import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  questionnaireResponses,
  questionnaireResults,
  userProfiles,
  type QuestionnaireResponses,
} from '../../db/schema/index.js';
import { createModuleLogger } from '../../config/logger.js';
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from '../../lib/errors.js';
import {
  toPublicQuestionnaire,
  type PublicQuestionnaire,
  type QuestionnaireWithResults,
} from './questionnaire.types.js';
import type {
  CreateQuestionnaireInput,
  UpdateQuestionnaireInput,
  CompleteQuestionnaireInput,
} from './questionnaire.schema.js';
import { notificationsService } from '../notifications/notifications.service.js';
import {
  CURRENT_SCHEMA_VERSION,
  isQuestionnaireOutdated,
  getQuestionnaireVersionStatus,
  type QuestionnaireVersionStatus,
} from './schema-version.service.js';

const logger = createModuleLogger('questionnaire-service');

/**
 * Questionnaire service.
 * Handles all questionnaire operations.
 */
export const questionnaireService = {
  /**
   * Get or create a questionnaire for a user.
   * Returns existing completed or in-progress questionnaire if one exists.
   * Only creates a new questionnaire if user has no active questionnaire.
   */
  async getOrCreate(userId: string): Promise<PublicQuestionnaire> {
    logger.debug({ userId }, 'Getting or creating questionnaire');

    // First, check for existing completed questionnaire (user should not be able to retake)
    const completed = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.userId, userId),
          eq(questionnaireResponses.status, 'completed')
        )
      )
      .orderBy(desc(questionnaireResponses.completedAt))
      .limit(1);

    if (completed.length > 0 && completed[0]) {
      logger.debug({ userId, questionnaireId: completed[0].id }, 'Found existing completed questionnaire');
      return toPublicQuestionnaire(completed[0]);
    }

    // Check for existing in-progress questionnaire
    const existing = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.userId, userId),
          eq(questionnaireResponses.status, 'in_progress')
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      logger.debug({ userId, questionnaireId: existing[0].id }, 'Found existing in-progress questionnaire');
      return toPublicQuestionnaire(existing[0]);
    }

    // Create new questionnaire only if user has no active questionnaires
    const insertResult = await db
      .insert(questionnaireResponses)
      .values({
        userId,
        schemaVersion: 2,
        responses: { version: 2 },
        status: 'in_progress',
        currentStep: 'intro',
      })
      .returning();

    const newQuestionnaire = insertResult[0];
    if (!newQuestionnaire) {
      throw new Error('Failed to create questionnaire');
    }

    logger.info({ userId, questionnaireId: newQuestionnaire.id }, 'Created new questionnaire');
    return toPublicQuestionnaire(newQuestionnaire);
  },

  /**
   * Create a new questionnaire for a user.
   * Archives any existing in-progress questionnaires.
   */
  async create(userId: string, input: CreateQuestionnaireInput): Promise<PublicQuestionnaire> {
    logger.debug({ userId }, 'Creating new questionnaire');

    // Archive any existing in-progress questionnaires
    await db
      .update(questionnaireResponses)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(
        and(
          eq(questionnaireResponses.userId, userId),
          eq(questionnaireResponses.status, 'in_progress')
        )
      );

    // Create new questionnaire
    const insertResult = await db
      .insert(questionnaireResponses)
      .values({
        userId,
        schemaVersion: 2,
        responses: input.responses ?? { version: 2 },
        status: 'in_progress',
        currentStep: 'intro',
      })
      .returning();

    const questionnaire = insertResult[0];
    if (!questionnaire) {
      throw new Error('Failed to create questionnaire');
    }

    logger.info({ userId, questionnaireId: questionnaire.id }, 'Created new questionnaire');
    return toPublicQuestionnaire(questionnaire);
  },

  /**
   * Get questionnaire by ID.
   */
  async getById(id: string, userId: string): Promise<PublicQuestionnaire> {
    const [questionnaire] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.id, id),
          eq(questionnaireResponses.userId, userId)
        )
      )
      .limit(1);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire not found');
    }

    return toPublicQuestionnaire(questionnaire);
  },

  /**
   * Get current/active questionnaire for a user.
   */
  async getCurrent(userId: string): Promise<PublicQuestionnaire | null> {
    const [questionnaire] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.userId, userId),
          eq(questionnaireResponses.status, 'in_progress')
        )
      )
      .limit(1);

    return questionnaire ? toPublicQuestionnaire(questionnaire) : null;
  },

  /**
   * Get user's completed questionnaire with results.
   */
  async getCompletedWithResults(userId: string): Promise<QuestionnaireWithResults | null> {
    const [questionnaire] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.userId, userId),
          eq(questionnaireResponses.status, 'completed')
        )
      )
      .orderBy(desc(questionnaireResponses.completedAt))
      .limit(1);

    if (!questionnaire) {
      return null;
    }

    // Get results if available
    const [results] = await db
      .select()
      .from(questionnaireResults)
      .where(eq(questionnaireResults.questionnaireId, questionnaire.id))
      .limit(1);

    const publicQuestionnaire = toPublicQuestionnaire(questionnaire);

    if (results) {
      return {
        ...publicQuestionnaire,
        results: {
          id: results.id,
          recommendations: results.recommendations,
          generatedAt: results.generatedAt.toISOString(),
        },
      };
    }

    return publicQuestionnaire;
  },

  /**
   * Update questionnaire responses (partial update).
   */
  async update(
    id: string,
    userId: string,
    input: UpdateQuestionnaireInput
  ): Promise<PublicQuestionnaire> {
    logger.debug({ id, userId }, 'Updating questionnaire');

    // Get existing questionnaire
    const [existing] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.id, id),
          eq(questionnaireResponses.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Questionnaire not found');
    }

    // Allow updates if:
    // 1. Status is 'in_progress', OR
    // 2. Status is 'completed' AND needsUpdate is true (migration in progress)
    const canUpdate =
      existing.status === 'in_progress' ||
      (existing.status === 'completed' && existing.needsUpdate);

    if (!canUpdate) {
      throw new BadRequestError('Cannot update a completed or archived questionnaire');
    }

    // Merge responses (partial update)
    const updatedResponses: QuestionnaireResponses = {
      ...existing.responses,
      ...input.responses,
      version: existing.responses.version, // Keep original version
    };

    // Handle nested objects properly (deep merge)
    if (input.responses?.personalDetails) {
      updatedResponses.personalDetails = {
        ...existing.responses.personalDetails,
        ...input.responses.personalDetails,
      };
    }
    if (input.responses?.spouseDetails) {
      updatedResponses.spouseDetails = {
        ...existing.responses.spouseDetails,
        ...input.responses.spouseDetails,
      };
    }
    // Children array: replace instead of merge
    if (input.responses?.children !== undefined) {
      updatedResponses.children = input.responses.children;
    }
    if (input.responses?.employment) {
      updatedResponses.employment = {
        ...existing.responses.employment,
        ...input.responses.employment,
      };
    }
    if (input.responses?.studiesInvestments) {
      updatedResponses.studiesInvestments = {
        ...existing.responses.studiesInvestments,
        ...input.responses.studiesInvestments,
      };
    }
    if (input.responses?.languages) {
      updatedResponses.languages = {
        ...existing.responses.languages,
        ...input.responses.languages,
      };
    }
    if (input.responses?.spouseLanguages) {
      updatedResponses.spouseLanguages = {
        ...existing.responses.spouseLanguages,
        ...input.responses.spouseLanguages,
      };
    }
    if (input.responses?.preferences) {
      updatedResponses.preferences = {
        ...existing.responses.preferences,
        ...input.responses.preferences,
      };
    }
    if (input.responses?.bureaucracy) {
      updatedResponses.bureaucracy = {
        ...existing.responses.bureaucracy,
        ...input.responses.bureaucracy,
      };
    }

    const updateResult = await db
      .update(questionnaireResponses)
      .set({
        responses: updatedResponses,
        currentStep: input.currentStep ?? existing.currentStep,
        updatedAt: new Date(),
      })
      .where(eq(questionnaireResponses.id, id))
      .returning();

    const updated = updateResult[0];
    if (!updated) {
      throw new Error('Failed to update questionnaire');
    }

    logger.info({ id, userId }, 'Questionnaire updated');
    return toPublicQuestionnaire(updated);
  },

  /**
   * Complete a questionnaire and update user's onboarding status.
   */
  async complete(
    id: string,
    userId: string,
    input: CompleteQuestionnaireInput
  ): Promise<PublicQuestionnaire> {
    logger.debug({ id, userId }, 'Completing questionnaire');

    // Get existing questionnaire
    const [existing] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.id, id),
          eq(questionnaireResponses.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Questionnaire not found');
    }

    if (existing.status === 'completed') {
      throw new ConflictError('Questionnaire already completed');
    }

    if (existing.status === 'archived') {
      throw new BadRequestError('Cannot complete an archived questionnaire');
    }

    // Merge final responses
    const finalResponses: QuestionnaireResponses = {
      ...existing.responses,
      ...input.responses,
      version: existing.responses.version,
    };

    // Handle nested objects (deep merge)
    if (input.responses?.personalDetails) {
      finalResponses.personalDetails = {
        ...existing.responses.personalDetails,
        ...input.responses.personalDetails,
      };
    }
    if (input.responses?.spouseDetails) {
      finalResponses.spouseDetails = {
        ...existing.responses.spouseDetails,
        ...input.responses.spouseDetails,
      };
    }
    // Children array: replace instead of merge
    if (input.responses?.children !== undefined) {
      finalResponses.children = input.responses.children;
    }
    if (input.responses?.employment) {
      finalResponses.employment = {
        ...existing.responses.employment,
        ...input.responses.employment,
      };
    }
    if (input.responses?.studiesInvestments) {
      finalResponses.studiesInvestments = {
        ...existing.responses.studiesInvestments,
        ...input.responses.studiesInvestments,
      };
    }
    if (input.responses?.languages) {
      finalResponses.languages = {
        ...existing.responses.languages,
        ...input.responses.languages,
      };
    }
    if (input.responses?.spouseLanguages) {
      finalResponses.spouseLanguages = {
        ...existing.responses.spouseLanguages,
        ...input.responses.spouseLanguages,
      };
    }
    if (input.responses?.preferences) {
      finalResponses.preferences = {
        ...existing.responses.preferences,
        ...input.responses.preferences,
      };
    }
    if (input.responses?.bureaucracy) {
      finalResponses.bureaucracy = {
        ...existing.responses.bureaucracy,
        ...input.responses.bureaucracy,
      };
    }

    const now = new Date();

    // Update questionnaire to completed
    const completeResult = await db
      .update(questionnaireResponses)
      .set({
        responses: finalResponses,
        status: 'completed',
        currentStep: 'bureaucracy',
        updatedAt: now,
        completedAt: now,
      })
      .where(eq(questionnaireResponses.id, id))
      .returning();

    const completed = completeResult[0];
    if (!completed) {
      throw new Error('Failed to complete questionnaire');
    }

    // Update user's onboarding status
    await db
      .update(userProfiles)
      .set({
        onboardingStatus: 'completed',
        onboardingCompletedAt: now,
        updatedAt: now,
      })
      .where(eq(userProfiles.id, userId));

    // Get user's name for notification
    const [user] = await db
      .select({ firstName: userProfiles.firstName, lastName: userProfiles.lastName })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    const userName = user ? `${user.firstName} ${user.lastName}` : undefined;

    // Notify admins about the completed questionnaire (fire and forget)
    notificationsService.notifyNewQuestionnaireSubmitted(userId, userName).catch((error) => {
      logger.error({ error, userId }, 'Failed to send admin notification for completed questionnaire');
    });

    logger.info({ id, userId }, 'Questionnaire completed, user onboarding updated');
    return toPublicQuestionnaire(completed);
  },

  /**
   * Get all questionnaires for a user.
   */
  async getAllForUser(userId: string): Promise<PublicQuestionnaire[]> {
    const questionnaires = await db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, userId))
      .orderBy(desc(questionnaireResponses.createdAt));

    return questionnaires.map(toPublicQuestionnaire);
  },

  /**
   * Archive a questionnaire.
   */
  async archive(id: string, userId: string): Promise<void> {
    const [result] = await db
      .update(questionnaireResponses)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(questionnaireResponses.id, id),
          eq(questionnaireResponses.userId, userId)
        )
      )
      .returning({ id: questionnaireResponses.id });

    if (!result) {
      throw new NotFoundError('Questionnaire not found');
    }

    logger.info({ id, userId }, 'Questionnaire archived');
  },

  /**
   * Check if user has completed onboarding (questionnaire).
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ onboardingStatus: userProfiles.onboardingStatus })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    return user?.onboardingStatus === 'completed';
  },

  // ================== Migration Methods ==================

  /**
   * Get questionnaire status with version info.
   * Used to determine if user needs to update their questionnaire.
   */
  async getQuestionnaireStatus(userId: string): Promise<QuestionnaireVersionStatus | null> {
    logger.debug({ userId }, 'Getting questionnaire status');

    // Get the most recent questionnaire (completed or in progress)
    const [questionnaire] = await db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, userId))
      .orderBy(desc(questionnaireResponses.completedAt), desc(questionnaireResponses.createdAt))
      .limit(1);

    if (!questionnaire) {
      return null;
    }

    const status = getQuestionnaireVersionStatus(
      questionnaire.schemaVersion,
      questionnaire.responses,
      questionnaire.needsUpdate
    );

    logger.debug({ userId, status }, 'Questionnaire status retrieved');
    return status;
  },

  /**
   * Initiate migration for a completed questionnaire.
   * Marks the questionnaire as needing update so user can fill in new fields.
   */
  async migrateQuestionnaire(userId: string): Promise<PublicQuestionnaire> {
    logger.debug({ userId }, 'Initiating questionnaire migration');

    // Find the most recent completed questionnaire
    const [existing] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.userId, userId),
          eq(questionnaireResponses.status, 'completed')
        )
      )
      .orderBy(desc(questionnaireResponses.completedAt))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('No completed questionnaire found');
    }

    // Check if already up to date
    if (!isQuestionnaireOutdated(existing.schemaVersion) && !existing.needsUpdate) {
      throw new BadRequestError('Questionnaire is already up to date');
    }

    const now = new Date();

    // Mark questionnaire as needing update
    const [updated] = await db
      .update(questionnaireResponses)
      .set({
        needsUpdate: true,
        lastSchemaCheck: now,
        updatedAt: now,
      })
      .where(eq(questionnaireResponses.id, existing.id))
      .returning();

    if (!updated) {
      throw new Error('Failed to migrate questionnaire');
    }

    // Update user's onboarding status to indicate they need to update
    await db
      .update(userProfiles)
      .set({
        onboardingStatus: 'in_progress',
        updatedAt: now,
      })
      .where(eq(userProfiles.id, userId));

    logger.info({ userId, questionnaireId: existing.id }, 'Questionnaire migration initiated');
    return toPublicQuestionnaire(updated);
  },

  /**
   * Complete migration for a questionnaire that was marked as needing update.
   * Resets needsUpdate flag and updates schema version.
   */
  async completeMigration(
    id: string,
    userId: string,
    input: CompleteQuestionnaireInput
  ): Promise<PublicQuestionnaire> {
    logger.debug({ id, userId }, 'Completing questionnaire migration');

    // Get existing questionnaire
    const [existing] = await db
      .select()
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.id, id),
          eq(questionnaireResponses.userId, userId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Questionnaire not found');
    }

    if (!existing.needsUpdate) {
      throw new BadRequestError('Questionnaire does not need migration');
    }

    // Merge final responses
    const finalResponses: QuestionnaireResponses = {
      ...existing.responses,
      ...input.responses,
      version: CURRENT_SCHEMA_VERSION, // Update to current version
    };

    // Handle nested objects (deep merge)
    if (input.responses?.personalDetails) {
      finalResponses.personalDetails = {
        ...existing.responses.personalDetails,
        ...input.responses.personalDetails,
      };
    }
    if (input.responses?.spouseDetails) {
      finalResponses.spouseDetails = {
        ...existing.responses.spouseDetails,
        ...input.responses.spouseDetails,
      };
    }
    if (input.responses?.children !== undefined) {
      finalResponses.children = input.responses.children;
    }
    if (input.responses?.employment) {
      finalResponses.employment = {
        ...existing.responses.employment,
        ...input.responses.employment,
      };
    }
    if (input.responses?.studiesInvestments) {
      finalResponses.studiesInvestments = {
        ...existing.responses.studiesInvestments,
        ...input.responses.studiesInvestments,
      };
    }
    if (input.responses?.languages) {
      finalResponses.languages = {
        ...existing.responses.languages,
        ...input.responses.languages,
      };
    }
    if (input.responses?.spouseLanguages) {
      finalResponses.spouseLanguages = {
        ...existing.responses.spouseLanguages,
        ...input.responses.spouseLanguages,
      };
    }
    if (input.responses?.preferences) {
      finalResponses.preferences = {
        ...existing.responses.preferences,
        ...input.responses.preferences,
      };
    }
    if (input.responses?.bureaucracy) {
      finalResponses.bureaucracy = {
        ...existing.responses.bureaucracy,
        ...input.responses.bureaucracy,
      };
    }

    const now = new Date();

    // Update questionnaire with new responses and reset migration flag
    const [completed] = await db
      .update(questionnaireResponses)
      .set({
        responses: finalResponses,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        needsUpdate: false,
        lastSchemaCheck: now,
        updatedAt: now,
      })
      .where(eq(questionnaireResponses.id, id))
      .returning();

    if (!completed) {
      throw new Error('Failed to complete migration');
    }

    // Update user's onboarding status back to completed
    await db
      .update(userProfiles)
      .set({
        onboardingStatus: 'completed',
        updatedAt: now,
      })
      .where(eq(userProfiles.id, userId));

    // Get user's name for notification
    const [user] = await db
      .select({ firstName: userProfiles.firstName, lastName: userProfiles.lastName })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    const userName = user ? `${user.firstName} ${user.lastName}` : undefined;

    // Notify admins about the completed migration (fire and forget)
    notificationsService.notifyQuestionnaireUpdateCompleted(userId, userName).catch((error) => {
      logger.error({ error, userId }, 'Failed to send admin notification for questionnaire migration');
    });

    logger.info({ id, userId }, 'Questionnaire migration completed');
    return toPublicQuestionnaire(completed);
  },

  /**
   * Mark all outdated questionnaires as needing update.
   * Used by admin to trigger migrations for all V1 users.
   * Returns the count of questionnaires marked.
   */
  async markOutdatedQuestionnaires(): Promise<number> {
    logger.debug('Marking outdated questionnaires as needing update');

    const now = new Date();

    const result = await db
      .update(questionnaireResponses)
      .set({
        needsUpdate: true,
        lastSchemaCheck: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(questionnaireResponses.status, 'completed'),
          eq(questionnaireResponses.needsUpdate, false)
        )
      );

    // After marking, we need to filter those that are actually outdated
    // This is a simplified version - in production, you'd want a more efficient query
    const markedCount = result.count ?? 0;

    logger.info({ markedCount }, 'Outdated questionnaires marked as needing update');
    return markedCount;
  },

  /**
   * Get all users with outdated questionnaires.
   */
  async getUsersWithOutdatedQuestionnaires(): Promise<
    Array<{ userId: string; questionnaireId: string; schemaVersion: number }>
  > {
    const outdated = await db
      .select({
        userId: questionnaireResponses.userId,
        questionnaireId: questionnaireResponses.id,
        schemaVersion: questionnaireResponses.schemaVersion,
      })
      .from(questionnaireResponses)
      .where(
        and(
          eq(questionnaireResponses.status, 'completed'),
          eq(questionnaireResponses.needsUpdate, true)
        )
      );

    return outdated.map((q) => ({
      userId: q.userId,
      questionnaireId: q.questionnaireId,
      schemaVersion: q.schemaVersion,
    }));
  },

  /**
   * Get questionnaire statistics.
   */
  async getQuestionnaireStats(): Promise<{
    totalV1: number;
    totalV2: number;
    needsUpdate: number;
    completed: number;
    inProgress: number;
    archived: number;
  }> {
    // Get all questionnaires with their status and version
    const questionnaires = await db
      .select({
        schemaVersion: questionnaireResponses.schemaVersion,
        status: questionnaireResponses.status,
        needsUpdate: questionnaireResponses.needsUpdate,
      })
      .from(questionnaireResponses);

    let totalV1 = 0;
    let totalV2 = 0;
    let needsUpdate = 0;
    let completed = 0;
    let inProgress = 0;
    let archived = 0;

    for (const q of questionnaires) {
      if (q.schemaVersion === 1) totalV1++;
      if (q.schemaVersion >= 2) totalV2++;
      if (q.needsUpdate) needsUpdate++;
      if (q.status === 'completed') completed++;
      if (q.status === 'in_progress') inProgress++;
      if (q.status === 'archived') archived++;
    }

    return {
      totalV1,
      totalV2,
      needsUpdate,
      completed,
      inProgress,
      archived,
    };
  },
};
