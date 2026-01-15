import { eq, desc, asc, and, count, sql, isNull, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../../db/index.js';
import { questionnaireReports, destinationResponses } from '../../db/schema/reports.js';
import { questionnaireResponses } from '../../db/schema/questionnaires.js';
import { userProfiles } from '../../db/schema/users.js';
import { createModuleLogger } from '../../config/logger.js';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors.js';
import { notificationsService } from '../notifications/notifications.service.js';
import type {
  ReportListResponse,
  ReportListItem,
  ReportFull,
  DestinationResponseListItem,
  DestinationResponseFull,
  PendingQuestionnairesResponse,
  UserReport,
  UserDestinationResponse,
  UserReportStatus,
  UserInfo,
  DestinationInfo,
  MatchInfo,
} from './reports.types.js';
import type {
  ListReportsQuery,
  CreateReportInput,
  UpdateReportInput,
  CreateDestinationResponseInput,
  UpdateDestinationResponseInput,
} from './reports.schema.js';
import type { ReportProfileSummary, DestinationNarrative, DestinationSection } from '../../db/schema/reports.js';

const logger = createModuleLogger('reports-service');

/**
 * Helper to map user profile to UserInfo
 */
function toUserInfo(user: { id: string; firstName: string | null; lastName: string | null }): UserInfo {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Helper to build DestinationInfo from response row
 */
function toDestinationInfo(response: typeof destinationResponses.$inferSelect): DestinationInfo {
  return {
    name: response.destinationName,
    subtitle: response.destinationSubtitle,
    image: response.destinationImage,
    badge: response.destinationBadge,
  };
}

/**
 * Helper to build MatchInfo from response row
 */
function toMatchInfo(response: typeof destinationResponses.$inferSelect): MatchInfo {
  return {
    score: response.matchScore,
    reasons: response.matchReasons as string[],
    visaType: response.visaType,
  };
}

/**
 * Reports service.
 * Handles CRUD operations for reports and destination responses.
 */
export const reportsService = {
  // ================== ADMIN: Reports ==================

  /**
   * List all reports with pagination, filtering, and search.
   */
  async listReports(query: ListReportsQuery): Promise<ReportListResponse> {
    const { page, limit, status, userId, search, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    logger.debug({ query }, 'Listing reports');

    // Build conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(questionnaireReports.status, status));
    }

    if (userId) {
      conditions.push(eq(questionnaireReports.userId, userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(questionnaireReports)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Build order by
    const sortColumn = {
      createdAt: questionnaireReports.createdAt,
      updatedAt: questionnaireReports.updatedAt,
      publishedAt: questionnaireReports.publishedAt,
    }[sortBy];

    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get reports with user info
    const reportRows = await db
      .select({
        report: questionnaireReports,
        user: {
          id: userProfiles.id,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
        },
      })
      .from(questionnaireReports)
      .leftJoin(userProfiles, eq(questionnaireReports.userId, userProfiles.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Filter by search if provided (after join)
    let filteredReports = reportRows;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = reportRows.filter(row => {
        const user = row.user;
        if (!user) return false;
        return (
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Get destination response counts for each report
    const reportIds = filteredReports.map(r => r.report.id);
    const responseCounts = reportIds.length > 0
      ? await db
          .select({
            reportId: destinationResponses.reportId,
            total: count(),
            published: sql<number>`COUNT(*) FILTER (WHERE ${destinationResponses.status} = 'published')`,
          })
          .from(destinationResponses)
          .where(inArray(destinationResponses.reportId, reportIds))
          .groupBy(destinationResponses.reportId)
      : [];

    const countMap = new Map(responseCounts.map(c => [c.reportId, { total: c.total, published: c.published }]));

    // Map to response format
    const reports: ReportListItem[] = filteredReports.map(row => {
      const counts = countMap.get(row.report.id) ?? { total: 0, published: 0 };
      return {
        id: row.report.id,
        user: toUserInfo(row.user!),
        questionnaireId: row.report.questionnaireId,
        status: row.report.status,
        destinationCount: counts.total,
        publishedDestinationCount: counts.published,
        publishedAt: row.report.publishedAt?.toISOString() ?? null,
        createdAt: row.report.createdAt.toISOString(),
        updatedAt: row.report.updatedAt.toISOString(),
      };
    });

    logger.info({ page, limit, total, count: reports.length }, 'Reports listed');

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get pending questionnaires (completed but no report created).
   */
  async getPendingQuestionnaires(
    page: number = 1,
    limit: number = 20
  ): Promise<PendingQuestionnairesResponse> {
    const offset = (page - 1) * limit;

    logger.debug({ page, limit }, 'Getting pending questionnaires');

    // Get questionnaires with 'completed' status that don't have a report
    const [countResult] = await db
      .select({ count: count() })
      .from(questionnaireResponses)
      .leftJoin(
        questionnaireReports,
        eq(questionnaireResponses.id, questionnaireReports.questionnaireId)
      )
      .where(
        and(
          eq(questionnaireResponses.status, 'completed'),
          isNull(questionnaireReports.id)
        )
      );

    const total = countResult?.count ?? 0;

    const rows = await db
      .select({
        questionnaire: questionnaireResponses,
        user: {
          id: userProfiles.id,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
        },
      })
      .from(questionnaireResponses)
      .leftJoin(
        questionnaireReports,
        eq(questionnaireResponses.id, questionnaireReports.questionnaireId)
      )
      .leftJoin(userProfiles, eq(questionnaireResponses.userId, userProfiles.id))
      .where(
        and(
          eq(questionnaireResponses.status, 'completed'),
          isNull(questionnaireReports.id)
        )
      )
      .orderBy(desc(questionnaireResponses.completedAt))
      .limit(limit)
      .offset(offset);

    const questionnaires = rows.map(row => ({
      id: row.questionnaire.id,
      user: toUserInfo(row.user!),
      countries: row.questionnaire.responses?.preferredCountries ?? [],
      submittedAt: row.questionnaire.completedAt?.toISOString() ?? row.questionnaire.createdAt.toISOString(),
      reportExists: false,
    }));

    logger.info({ page, limit, total, pending: questionnaires.length }, 'Pending questionnaires retrieved');

    return {
      questionnaires,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a report by ID with all details (admin view).
   */
  async getReportById(reportId: string): Promise<ReportFull> {
    logger.debug({ reportId }, 'Getting report by ID');

    // Get report with user info
    const [reportRow] = await db
      .select({
        report: questionnaireReports,
        user: {
          id: userProfiles.id,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
        },
      })
      .from(questionnaireReports)
      .leftJoin(userProfiles, eq(questionnaireReports.userId, userProfiles.id))
      .where(eq(questionnaireReports.id, reportId))
      .limit(1);

    if (!reportRow) {
      throw new NotFoundError('Report');
    }

    // Get destination responses
    const responseRows = await db
      .select()
      .from(destinationResponses)
      .where(eq(destinationResponses.reportId, reportId))
      .orderBy(asc(destinationResponses.displayOrder));

    const destinations: DestinationResponseListItem[] = responseRows.map(row => ({
      id: row.id,
      destination: toDestinationInfo(row),
      displayOrder: row.displayOrder,
      match: toMatchInfo(row),
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }));

    logger.info({ reportId }, 'Report retrieved');

    return {
      id: reportRow.report.id,
      user: toUserInfo(reportRow.user!),
      questionnaireId: reportRow.report.questionnaireId,
      greeting: reportRow.report.greeting,
      profileSummary: reportRow.report.profileSummary as ReportProfileSummary,
      status: reportRow.report.status,
      destinations,
      publishedAt: reportRow.report.publishedAt?.toISOString() ?? null,
      createdAt: reportRow.report.createdAt.toISOString(),
      updatedAt: reportRow.report.updatedAt.toISOString(),
    };
  },

  /**
   * Create a new report for a questionnaire.
   */
  async createReport(input: CreateReportInput): Promise<ReportFull> {
    const { questionnaireId, greeting, profileSummary } = input;

    logger.debug({ questionnaireId }, 'Creating new report');

    // Check if questionnaire exists and is completed
    const [questionnaire] = await db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.id, questionnaireId))
      .limit(1);

    if (!questionnaire) {
      throw new NotFoundError('Questionnaire');
    }

    if (questionnaire.status !== 'completed') {
      throw new ValidationError('Questionnaire is not completed', {
        questionnaireId: ['Questionnaire must be completed before creating a report'],
      });
    }

    // Check if report already exists for this questionnaire
    const [existingReport] = await db
      .select({ id: questionnaireReports.id })
      .from(questionnaireReports)
      .where(eq(questionnaireReports.questionnaireId, questionnaireId))
      .limit(1);

    if (existingReport) {
      throw new ConflictError('Report already exists for this questionnaire');
    }

    // Get user profile to pre-fill profile summary
    const [userProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, questionnaire.userId))
      .limit(1);

    // Build profile summary from questionnaire data or use provided
    const responses = questionnaire.responses;
    const defaultProfileSummary: ReportProfileSummary = {
      userName: userProfile ? `${userProfile.firstName ?? ''} ${userProfile.lastName ?? ''}`.trim() : '',
      citizenship: responses?.personalDetails?.citizenship ?? undefined,
      familyStatus: responses?.familyStatus ?? undefined,
      relocationGoals: responses?.relocationReason ?? undefined,
    };

    // Create report
    const [newReport] = await db
      .insert(questionnaireReports)
      .values({
        userId: questionnaire.userId,
        questionnaireId,
        greeting: greeting ?? null,
        profileSummary: profileSummary ?? defaultProfileSummary,
        status: 'draft',
      })
      .returning();

    if (!newReport) {
      throw new Error('Failed to create report');
    }

    logger.info({ reportId: newReport.id, questionnaireId }, 'Report created');

    return this.getReportById(newReport.id);
  },

  /**
   * Update a report's greeting and profile summary.
   */
  async updateReport(reportId: string, input: UpdateReportInput): Promise<ReportFull> {
    logger.debug({ reportId, input }, 'Updating report');

    // Check if report exists
    const [existing] = await db
      .select()
      .from(questionnaireReports)
      .where(eq(questionnaireReports.id, reportId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Report');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.greeting !== undefined) {
      updateData.greeting = input.greeting;
    }

    if (input.profileSummary !== undefined) {
      updateData.profileSummary = input.profileSummary;
    }

    // Update report
    await db
      .update(questionnaireReports)
      .set(updateData)
      .where(eq(questionnaireReports.id, reportId));

    logger.info({ reportId }, 'Report updated');

    return this.getReportById(reportId);
  },

  /**
   * Publish a report (and optionally all its destination responses).
   */
  async publishReport(reportId: string, publishDestinations: boolean = true): Promise<ReportFull> {
    logger.debug({ reportId, publishDestinations }, 'Publishing report');

    // Check if report exists
    const [existing] = await db
      .select()
      .from(questionnaireReports)
      .where(eq(questionnaireReports.id, reportId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Report');
    }

    const now = new Date();

    // Update report status
    await db
      .update(questionnaireReports)
      .set({
        status: 'published',
        publishedAt: now,
        updatedAt: now,
      })
      .where(eq(questionnaireReports.id, reportId));

    // Optionally publish all destination responses
    if (publishDestinations) {
      await db
        .update(destinationResponses)
        .set({
          status: 'published',
          publishedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(destinationResponses.reportId, reportId),
            eq(destinationResponses.status, 'draft')
          )
        );
    }

    logger.info({ reportId, publishDestinations }, 'Report published');

    // Send notification to user that their report is ready
    try {
      await notificationsService.notifyReportReady(existing.userId, reportId);
      logger.info({ reportId, userId: existing.userId }, 'User notified about report publication');
    } catch (notifyError) {
      // Don't fail the publish operation if notification fails
      logger.error({ reportId, userId: existing.userId, error: notifyError }, 'Failed to send report notification');
    }

    return this.getReportById(reportId);
  },

  /**
   * Delete a report and all its destination responses.
   */
  async deleteReport(reportId: string): Promise<void> {
    logger.debug({ reportId }, 'Deleting report');

    // Check if report exists
    const [existing] = await db
      .select({ id: questionnaireReports.id })
      .from(questionnaireReports)
      .where(eq(questionnaireReports.id, reportId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Report');
    }

    // Delete report (destination responses cascade delete)
    await db
      .delete(questionnaireReports)
      .where(eq(questionnaireReports.id, reportId));

    logger.info({ reportId }, 'Report deleted');
  },

  // ================== ADMIN: Destination Responses ==================

  /**
   * Get a destination response by ID with all details.
   */
  async getDestinationResponseById(destinationId: string): Promise<DestinationResponseFull> {
    logger.debug({ destinationId }, 'Getting destination response by ID');

    const [row] = await db
      .select()
      .from(destinationResponses)
      .where(eq(destinationResponses.id, destinationId))
      .limit(1);

    if (!row) {
      throw new NotFoundError('Destination response');
    }

    logger.info({ destinationId }, 'Destination response retrieved');

    return {
      id: row.id,
      reportId: row.reportId,
      displayOrder: row.displayOrder,
      destination: toDestinationInfo(row),
      match: toMatchInfo(row),
      narrative: row.narrative as DestinationNarrative,
      sections: row.sections as DestinationSection[],
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  /**
   * Create a new destination response for a report.
   */
  async createDestinationResponse(input: CreateDestinationResponseInput): Promise<DestinationResponseFull> {
    const { reportId, displayOrder, destination, match, narrative, sections } = input;

    logger.debug({ reportId, destinationName: destination.name }, 'Creating destination response');

    // Check if report exists
    const [report] = await db
      .select({ id: questionnaireReports.id })
      .from(questionnaireReports)
      .where(eq(questionnaireReports.id, reportId))
      .limit(1);

    if (!report) {
      throw new NotFoundError('Report');
    }

    // Process sections to ensure they all have IDs
    const processedSections = (sections ?? []).map((section, index) => ({
      ...section,
      id: section.id ?? randomUUID(),
      position: section.position ?? index,
    }));

    // Create destination response
    const [newResponse] = await db
      .insert(destinationResponses)
      .values({
        reportId,
        displayOrder: displayOrder ?? 1,
        destinationName: destination.name,
        destinationSubtitle: destination.subtitle ?? null,
        destinationImage: destination.image ?? null,
        destinationBadge: destination.badge ?? null,
        matchScore: match?.score ?? 0,
        visaType: match?.visaType ?? null,
        matchReasons: match?.reasons ?? [],
        narrative: narrative ?? {},
        sections: processedSections,
        status: 'draft',
      })
      .returning();

    if (!newResponse) {
      throw new Error('Failed to create destination response');
    }

    logger.info({ destinationId: newResponse.id, reportId, destinationName: destination.name }, 'Destination response created');

    return this.getDestinationResponseById(newResponse.id);
  },

  /**
   * Update a destination response.
   */
  async updateDestinationResponse(destinationId: string, input: UpdateDestinationResponseInput): Promise<DestinationResponseFull> {
    logger.debug({ destinationId, input }, 'Updating destination response');

    // Check if response exists
    const [existing] = await db
      .select()
      .from(destinationResponses)
      .where(eq(destinationResponses.id, destinationId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Destination response');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

    // Handle destination updates
    if (input.destination) {
      if (input.destination.name !== undefined) updateData.destinationName = input.destination.name;
      if (input.destination.subtitle !== undefined) updateData.destinationSubtitle = input.destination.subtitle;
      if (input.destination.image !== undefined) updateData.destinationImage = input.destination.image;
      if (input.destination.badge !== undefined) updateData.destinationBadge = input.destination.badge;
    }

    // Handle match updates
    if (input.match) {
      if (input.match.score !== undefined) updateData.matchScore = input.match.score;
      if (input.match.visaType !== undefined) updateData.visaType = input.match.visaType;
      if (input.match.reasons !== undefined) updateData.matchReasons = input.match.reasons;
    }

    // Handle narrative and sections
    if (input.narrative !== undefined) updateData.narrative = input.narrative;
    if (input.sections !== undefined) {
      // Process sections to ensure they all have IDs
      const processedSections = input.sections.map((section, index) => ({
        ...section,
        id: section.id ?? randomUUID(),
        position: section.position ?? index,
      }));
      updateData.sections = processedSections;
    }

    // Update response
    await db
      .update(destinationResponses)
      .set(updateData)
      .where(eq(destinationResponses.id, destinationId));

    logger.info({ destinationId }, 'Destination response updated');

    return this.getDestinationResponseById(destinationId);
  },

  /**
   * Publish or unpublish a destination response.
   */
  async publishDestinationResponse(destinationId: string, publish: boolean = true): Promise<DestinationResponseFull> {
    logger.debug({ destinationId, publish }, 'Publishing/unpublishing destination response');

    // Check if response exists
    const [existing] = await db
      .select()
      .from(destinationResponses)
      .where(eq(destinationResponses.id, destinationId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Destination response');
    }

    const now = new Date();

    // Update status
    await db
      .update(destinationResponses)
      .set({
        status: publish ? 'published' : 'draft',
        publishedAt: publish ? now : null,
        updatedAt: now,
      })
      .where(eq(destinationResponses.id, destinationId));

    logger.info({ destinationId, publish }, 'Destination response publish status updated');

    // Send notification to user if publishing (not unpublishing) AND report is published
    if (publish) {
      try {
        // Get the report to find the user ID and check if report is published
        const [report] = await db
          .select({
            userId: questionnaireReports.userId,
            status: questionnaireReports.status,
          })
          .from(questionnaireReports)
          .where(eq(questionnaireReports.id, existing.reportId))
          .limit(1);

        // Only notify if the report itself is also published
        if (report && report.status === 'published') {
          await notificationsService.notifyCountryResponseReady(
            report.userId,
            existing.destinationName,
            destinationId
          );
          logger.info({ destinationId, userId: report.userId }, 'User notified about destination response');
        } else {
          logger.debug({ destinationId, reportStatus: report?.status }, 'Skipping notification - report not published');
        }
      } catch (notifyError) {
        // Don't fail the publish operation if notification fails
        logger.error({ destinationId, error: notifyError }, 'Failed to send destination notification');
      }
    }

    return this.getDestinationResponseById(destinationId);
  },

  /**
   * Delete a destination response.
   */
  async deleteDestinationResponse(destinationId: string): Promise<void> {
    logger.debug({ destinationId }, 'Deleting destination response');

    // Check if response exists
    const [existing] = await db
      .select({ id: destinationResponses.id })
      .from(destinationResponses)
      .where(eq(destinationResponses.id, destinationId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Destination response');
    }

    // Delete response
    await db
      .delete(destinationResponses)
      .where(eq(destinationResponses.id, destinationId));

    logger.info({ destinationId }, 'Destination response deleted');
  },

  // ================== PUBLIC: User Report ==================

  /**
   * Get report status for a user.
   */
  async getUserReportStatus(userId: string): Promise<UserReportStatus> {
    logger.debug({ userId }, 'Getting user report status');

    // Get report for user
    const [report] = await db
      .select()
      .from(questionnaireReports)
      .where(eq(questionnaireReports.userId, userId))
      .orderBy(desc(questionnaireReports.createdAt))
      .limit(1);

    if (!report) {
      return {
        hasReport: false,
        hasPublishedReport: false,
        publishedDestinationCount: 0,
      };
    }

    // Count published destination responses
    const [countResult] = await db
      .select({ count: count() })
      .from(destinationResponses)
      .where(
        and(
          eq(destinationResponses.reportId, report.id),
          eq(destinationResponses.status, 'published')
        )
      );

    const publishedCount = countResult?.count ?? 0;

    logger.info({ userId, hasReport: true, publishedCount }, 'User report status retrieved');

    return {
      hasReport: true,
      hasPublishedReport: report.status === 'published',
      publishedDestinationCount: publishedCount,
      reportId: report.id,
    };
  },

  /**
   * Get user's published report with all destination responses.
   */
  async getUserReport(userId: string): Promise<UserReport | null> {
    logger.debug({ userId }, 'Getting user report');

    // Get published report for user
    const [report] = await db
      .select()
      .from(questionnaireReports)
      .where(
        and(
          eq(questionnaireReports.userId, userId),
          eq(questionnaireReports.status, 'published')
        )
      )
      .orderBy(desc(questionnaireReports.publishedAt))
      .limit(1);

    if (!report) {
      logger.info({ userId }, 'No published report found for user');
      return null;
    }

    // Get published destination responses
    const responseRows = await db
      .select()
      .from(destinationResponses)
      .where(
        and(
          eq(destinationResponses.reportId, report.id),
          eq(destinationResponses.status, 'published')
        )
      )
      .orderBy(asc(destinationResponses.displayOrder));

    // Build user destination responses (self-contained, no merging needed)
    const userDestinations: UserDestinationResponse[] = responseRows.map(row => ({
      id: row.id,
      displayOrder: row.displayOrder,
      destination: toDestinationInfo(row),
      match: toMatchInfo(row),
      narrative: row.narrative as DestinationNarrative,
      sections: row.sections as DestinationSection[],
    }));

    logger.info({ userId, reportId: report.id, destinationCount: userDestinations.length }, 'User report retrieved');

    return {
      id: report.id,
      greeting: report.greeting,
      profileSummary: report.profileSummary as ReportProfileSummary,
      destinations: userDestinations,
      publishedAt: report.publishedAt?.toISOString() ?? null,
    };
  },

  /**
   * Get a specific destination response for a user's published report.
   */
  async getUserDestinationResponse(userId: string, destinationId: string): Promise<UserDestinationResponse | null> {
    logger.debug({ userId, destinationId }, 'Getting user destination response');

    // Get published report for user
    const [report] = await db
      .select()
      .from(questionnaireReports)
      .where(
        and(
          eq(questionnaireReports.userId, userId),
          eq(questionnaireReports.status, 'published')
        )
      )
      .limit(1);

    if (!report) {
      return null;
    }

    // Get specific published destination response
    const [row] = await db
      .select()
      .from(destinationResponses)
      .where(
        and(
          eq(destinationResponses.reportId, report.id),
          eq(destinationResponses.id, destinationId),
          eq(destinationResponses.status, 'published')
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    logger.info({ userId, destinationId }, 'User destination response retrieved');

    return {
      id: row.id,
      displayOrder: row.displayOrder,
      destination: toDestinationInfo(row),
      match: toMatchInfo(row),
      narrative: row.narrative as DestinationNarrative,
      sections: row.sections as DestinationSection[],
    };
  },
};
