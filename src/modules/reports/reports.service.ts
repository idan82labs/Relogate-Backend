import { eq, desc, asc, and, count, sql, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { questionnaireReports, countryResponses } from '../../db/schema/reports.js';
import { questionnaireResponses } from '../../db/schema/questionnaires.js';
import { userProfiles } from '../../db/schema/users.js';
import { countries } from '../../db/schema/countries.js';
import { createModuleLogger } from '../../config/logger.js';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors.js';
import type {
  ReportListResponse,
  ReportListItem,
  ReportFull,
  CountryResponseListItem,
  CountryResponseFull,
  PendingQuestionnairesResponse,
  UserReport,
  UserCountryResponse,
  UserReportStatus,
  CountryInfo,
  UserInfo,
} from './reports.types.js';
import type {
  ListReportsQuery,
  CreateReportInput,
  UpdateReportInput,
  CreateCountryResponseInput,
  UpdateCountryResponseInput,
} from './reports.schema.js';
import type { ReportProfileSummary, PersonalizedContent, CategoryOverrides } from '../../db/schema/reports.js';
import type { CountryCategories } from '../../db/schema/countries.js';

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
 * Helper to map country to CountryInfo
 */
function toCountryInfo(country: typeof countries.$inferSelect): CountryInfo {
  return {
    id: country.id,
    code: country.code,
    name: country.name,
    englishName: country.englishName,
    flagImage: country.flagImage,
  };
}

/**
 * Reports service.
 * Handles CRUD operations for reports and country responses.
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

    // Get country response counts for each report
    const reportIds = filteredReports.map(r => r.report.id);
    const responseCounts = reportIds.length > 0
      ? await db
          .select({
            reportId: countryResponses.reportId,
            total: count(),
            published: sql<number>`COUNT(*) FILTER (WHERE ${countryResponses.status} = 'published')`,
          })
          .from(countryResponses)
          .where(sql`${countryResponses.reportId} = ANY(${reportIds})`)
          .groupBy(countryResponses.reportId)
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
        countryResponseCount: counts.total,
        publishedCountryCount: counts.published,
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
        report: questionnaireReports,
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
      .where(eq(questionnaireResponses.status, 'completed'))
      .orderBy(desc(questionnaireResponses.completedAt))
      .limit(limit)
      .offset(offset);

    const questionnaires = rows.map(row => ({
      id: row.questionnaire.id,
      user: toUserInfo(row.user!),
      countries: row.questionnaire.responses?.preferredCountries ?? [],
      submittedAt: row.questionnaire.completedAt?.toISOString() ?? row.questionnaire.createdAt.toISOString(),
      reportExists: !!row.report,
    }));

    logger.info({ page, limit, total, pending: questionnaires.filter(q => !q.reportExists).length }, 'Pending questionnaires retrieved');

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

    // Get country responses
    const responseRows = await db
      .select({
        response: countryResponses,
        country: countries,
      })
      .from(countryResponses)
      .leftJoin(countries, eq(countryResponses.countryId, countries.id))
      .where(eq(countryResponses.reportId, reportId))
      .orderBy(asc(countryResponses.displayOrder));

    const countryResponsesList: CountryResponseListItem[] = responseRows.map(row => ({
      id: row.response.id,
      country: toCountryInfo(row.country!),
      displayOrder: row.response.displayOrder,
      matchScore: row.response.matchScore,
      visaType: row.response.visaType,
      status: row.response.status,
      publishedAt: row.response.publishedAt?.toISOString() ?? null,
    }));

    logger.info({ reportId }, 'Report retrieved');

    return {
      id: reportRow.report.id,
      user: toUserInfo(reportRow.user!),
      questionnaireId: reportRow.report.questionnaireId,
      greeting: reportRow.report.greeting,
      profileSummary: reportRow.report.profileSummary as ReportProfileSummary,
      status: reportRow.report.status,
      countryResponses: countryResponsesList,
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
   * Publish a report (and optionally all its country responses).
   */
  async publishReport(reportId: string, publishCountries: boolean = true): Promise<ReportFull> {
    logger.debug({ reportId, publishCountries }, 'Publishing report');

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

    // Optionally publish all country responses
    if (publishCountries) {
      await db
        .update(countryResponses)
        .set({
          status: 'published',
          publishedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(countryResponses.reportId, reportId),
            eq(countryResponses.status, 'draft')
          )
        );
    }

    logger.info({ reportId, publishCountries }, 'Report published');

    return this.getReportById(reportId);
  },

  /**
   * Delete a report and all its country responses.
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

    // Delete report (country responses cascade delete)
    await db
      .delete(questionnaireReports)
      .where(eq(questionnaireReports.id, reportId));

    logger.info({ reportId }, 'Report deleted');
  },

  // ================== ADMIN: Country Responses ==================

  /**
   * Get a country response by ID with all details.
   */
  async getCountryResponseById(responseId: string): Promise<CountryResponseFull> {
    logger.debug({ responseId }, 'Getting country response by ID');

    const [row] = await db
      .select({
        response: countryResponses,
        country: countries,
      })
      .from(countryResponses)
      .leftJoin(countries, eq(countryResponses.countryId, countries.id))
      .where(eq(countryResponses.id, responseId))
      .limit(1);

    if (!row) {
      throw new NotFoundError('Country response');
    }

    logger.info({ responseId }, 'Country response retrieved');

    return {
      id: row.response.id,
      reportId: row.response.reportId,
      country: toCountryInfo(row.country!),
      displayOrder: row.response.displayOrder,
      matchScore: row.response.matchScore,
      visaType: row.response.visaType,
      matchReasons: row.response.matchReasons as string[],
      personalizedContent: row.response.personalizedContent as PersonalizedContent,
      categoryOverrides: row.response.categoryOverrides as CategoryOverrides | null,
      status: row.response.status,
      publishedAt: row.response.publishedAt?.toISOString() ?? null,
      createdAt: row.response.createdAt.toISOString(),
      updatedAt: row.response.updatedAt.toISOString(),
    };
  },

  /**
   * Create a new country response for a report.
   */
  async createCountryResponse(input: CreateCountryResponseInput): Promise<CountryResponseFull> {
    const { reportId, countryId, displayOrder, matchScore, visaType, matchReasons, personalizedContent, categoryOverrides } = input;

    logger.debug({ reportId, countryId }, 'Creating country response');

    // Check if report exists
    const [report] = await db
      .select({ id: questionnaireReports.id })
      .from(questionnaireReports)
      .where(eq(questionnaireReports.id, reportId))
      .limit(1);

    if (!report) {
      throw new NotFoundError('Report');
    }

    // Check if country exists
    const [country] = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);

    if (!country) {
      throw new NotFoundError('Country');
    }

    // Check if country response already exists for this report+country
    const [existing] = await db
      .select({ id: countryResponses.id })
      .from(countryResponses)
      .where(
        and(
          eq(countryResponses.reportId, reportId),
          eq(countryResponses.countryId, countryId)
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictError('Country response already exists for this report');
    }

    // Create country response
    const [newResponse] = await db
      .insert(countryResponses)
      .values({
        reportId,
        countryId,
        displayOrder: displayOrder ?? 1,
        matchScore: matchScore ?? 0,
        visaType: visaType ?? null,
        matchReasons: matchReasons ?? [],
        personalizedContent: personalizedContent ?? {},
        categoryOverrides: categoryOverrides ?? null,
        status: 'draft',
      })
      .returning();

    if (!newResponse) {
      throw new Error('Failed to create country response');
    }

    logger.info({ responseId: newResponse.id, reportId, countryId }, 'Country response created');

    return this.getCountryResponseById(newResponse.id);
  },

  /**
   * Update a country response.
   */
  async updateCountryResponse(responseId: string, input: UpdateCountryResponseInput): Promise<CountryResponseFull> {
    logger.debug({ responseId, input }, 'Updating country response');

    // Check if response exists
    const [existing] = await db
      .select()
      .from(countryResponses)
      .where(eq(countryResponses.id, responseId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Country response');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.matchScore !== undefined) updateData.matchScore = input.matchScore;
    if (input.visaType !== undefined) updateData.visaType = input.visaType;
    if (input.matchReasons !== undefined) updateData.matchReasons = input.matchReasons;
    if (input.personalizedContent !== undefined) updateData.personalizedContent = input.personalizedContent;
    if (input.categoryOverrides !== undefined) updateData.categoryOverrides = input.categoryOverrides;

    // Update response
    await db
      .update(countryResponses)
      .set(updateData)
      .where(eq(countryResponses.id, responseId));

    logger.info({ responseId }, 'Country response updated');

    return this.getCountryResponseById(responseId);
  },

  /**
   * Publish or unpublish a country response.
   */
  async publishCountryResponse(responseId: string, publish: boolean = true): Promise<CountryResponseFull> {
    logger.debug({ responseId, publish }, 'Publishing/unpublishing country response');

    // Check if response exists
    const [existing] = await db
      .select()
      .from(countryResponses)
      .where(eq(countryResponses.id, responseId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Country response');
    }

    const now = new Date();

    // Update status
    await db
      .update(countryResponses)
      .set({
        status: publish ? 'published' : 'draft',
        publishedAt: publish ? now : null,
        updatedAt: now,
      })
      .where(eq(countryResponses.id, responseId));

    logger.info({ responseId, publish }, 'Country response publish status updated');

    return this.getCountryResponseById(responseId);
  },

  /**
   * Delete a country response.
   */
  async deleteCountryResponse(responseId: string): Promise<void> {
    logger.debug({ responseId }, 'Deleting country response');

    // Check if response exists
    const [existing] = await db
      .select({ id: countryResponses.id })
      .from(countryResponses)
      .where(eq(countryResponses.id, responseId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Country response');
    }

    // Delete response
    await db
      .delete(countryResponses)
      .where(eq(countryResponses.id, responseId));

    logger.info({ responseId }, 'Country response deleted');
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
        publishedCountryCount: 0,
      };
    }

    // Count published country responses
    const [countResult] = await db
      .select({ count: count() })
      .from(countryResponses)
      .where(
        and(
          eq(countryResponses.reportId, report.id),
          eq(countryResponses.status, 'published')
        )
      );

    const publishedCount = countResult?.count ?? 0;

    logger.info({ userId, hasReport: true, publishedCount }, 'User report status retrieved');

    return {
      hasReport: true,
      hasPublishedReport: report.status === 'published',
      publishedCountryCount: publishedCount,
      reportId: report.id,
    };
  },

  /**
   * Get user's published report with all country responses.
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

    // Get published country responses with country data
    const responseRows = await db
      .select({
        response: countryResponses,
        country: countries,
      })
      .from(countryResponses)
      .leftJoin(countries, eq(countryResponses.countryId, countries.id))
      .where(
        and(
          eq(countryResponses.reportId, report.id),
          eq(countryResponses.status, 'published')
        )
      )
      .orderBy(asc(countryResponses.displayOrder));

    // Build user country responses with merged categories
    const userCountryResponses: UserCountryResponse[] = responseRows.map(row => {
      const country = row.country!;
      const response = row.response;
      const overrides = response.categoryOverrides as CategoryOverrides | null;
      const staticCategories = country.categories as CountryCategories;

      // Merge static categories with overrides (overrides take precedence)
      const mergedCategories = {
        general: overrides?.general ?? staticCategories?.general,
        visa: overrides?.visa ?? staticCategories?.visa,
        language: overrides?.language ?? staticCategories?.language,
        safety: overrides?.safety ?? staticCategories?.safety,
        jewish: overrides?.jewish ?? staticCategories?.jewish,
        openness: overrides?.openness ?? staticCategories?.openness,
        healthcare: overrides?.healthcare ?? staticCategories?.healthcare,
        education: overrides?.education ?? staticCategories?.education,
        employment: overrides?.employment ?? staticCategories?.employment,
        transport: overrides?.transport ?? staticCategories?.transport,
        cost: overrides?.cost ?? staticCategories?.cost,
        distance: overrides?.distance ?? staticCategories?.distance,
        community: overrides?.community ?? staticCategories?.community,
      };

      return {
        id: response.id,
        country: {
          id: country.id,
          code: country.code,
          name: country.name,
          englishName: country.englishName,
          flagImage: country.flagImage,
          heroImage: country.heroImage,
          introduction: country.introduction,
        },
        displayOrder: response.displayOrder,
        matchScore: response.matchScore,
        visaType: response.visaType,
        matchReasons: response.matchReasons as string[],
        personalizedContent: response.personalizedContent as PersonalizedContent,
        categories: mergedCategories,
      };
    });

    logger.info({ userId, reportId: report.id, countryCount: userCountryResponses.length }, 'User report retrieved');

    return {
      id: report.id,
      greeting: report.greeting,
      profileSummary: report.profileSummary as ReportProfileSummary,
      countryResponses: userCountryResponses,
      publishedAt: report.publishedAt?.toISOString() ?? null,
    };
  },

  /**
   * Get a specific country response for a user's published report.
   */
  async getUserCountryResponse(userId: string, countryId: string): Promise<UserCountryResponse | null> {
    logger.debug({ userId, countryId }, 'Getting user country response');

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

    // Get specific published country response
    const [row] = await db
      .select({
        response: countryResponses,
        country: countries,
      })
      .from(countryResponses)
      .leftJoin(countries, eq(countryResponses.countryId, countries.id))
      .where(
        and(
          eq(countryResponses.reportId, report.id),
          eq(countryResponses.countryId, countryId),
          eq(countryResponses.status, 'published')
        )
      )
      .limit(1);

    if (!row) {
      return null;
    }

    const country = row.country!;
    const response = row.response;
    const overrides = response.categoryOverrides as CategoryOverrides | null;
    const staticCategories = country.categories as CountryCategories;

    // Merge categories
    const mergedCategories = {
      general: overrides?.general ?? staticCategories?.general,
      visa: overrides?.visa ?? staticCategories?.visa,
      language: overrides?.language ?? staticCategories?.language,
      safety: overrides?.safety ?? staticCategories?.safety,
      jewish: overrides?.jewish ?? staticCategories?.jewish,
      openness: overrides?.openness ?? staticCategories?.openness,
      healthcare: overrides?.healthcare ?? staticCategories?.healthcare,
      education: overrides?.education ?? staticCategories?.education,
      employment: overrides?.employment ?? staticCategories?.employment,
      transport: overrides?.transport ?? staticCategories?.transport,
      cost: overrides?.cost ?? staticCategories?.cost,
      distance: overrides?.distance ?? staticCategories?.distance,
      community: overrides?.community ?? staticCategories?.community,
    };

    logger.info({ userId, countryId, responseId: response.id }, 'User country response retrieved');

    return {
      id: response.id,
      country: {
        id: country.id,
        code: country.code,
        name: country.name,
        englishName: country.englishName,
        flagImage: country.flagImage,
        heroImage: country.heroImage,
        introduction: country.introduction,
      },
      displayOrder: response.displayOrder,
      matchScore: response.matchScore,
      visaType: response.visaType,
      matchReasons: response.matchReasons as string[],
      personalizedContent: response.personalizedContent as PersonalizedContent,
      categories: mergedCategories,
    };
  },
};
