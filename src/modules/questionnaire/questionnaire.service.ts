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

const logger = createModuleLogger('questionnaire-service');

/**
 * Questionnaire service.
 * Handles all questionnaire operations.
 */
export const questionnaireService = {
  /**
   * Get or create a questionnaire for a user.
   * Returns existing in-progress questionnaire if one exists.
   */
  async getOrCreate(userId: string): Promise<PublicQuestionnaire> {
    logger.debug({ userId }, 'Getting or creating questionnaire');

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
      logger.debug({ userId, questionnaireId: existing[0].id }, 'Found existing questionnaire');
      return toPublicQuestionnaire(existing[0]);
    }

    // Create new questionnaire
    const insertResult = await db
      .insert(questionnaireResponses)
      .values({
        userId,
        schemaVersion: 1,
        responses: { version: 1, preferredCountries: [] },
        status: 'in_progress',
        currentStep: 'countries',
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
        schemaVersion: 1,
        responses: input.responses ?? { version: 1, preferredCountries: [] },
        status: 'in_progress',
        currentStep: 'countries',
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

    if (existing.status !== 'in_progress') {
      throw new BadRequestError('Cannot update a completed or archived questionnaire');
    }

    // Merge responses (partial update)
    const updatedResponses: QuestionnaireResponses = {
      ...existing.responses,
      ...input.responses,
      version: existing.responses.version, // Keep original version
    };

    // Handle nested objects properly
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

    // Handle nested objects
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

    const now = new Date();

    // Update questionnaire to completed
    const completeResult = await db
      .update(questionnaireResponses)
      .set({
        responses: finalResponses,
        status: 'completed',
        currentStep: 'personal-details',
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
};
