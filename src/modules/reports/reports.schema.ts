import { z } from 'zod';

/**
 * Profile summary schema for report
 */
export const profileSummarySchema = z.object({
  userName: z.string().min(1),
  citizenship: z.string().optional(),
  age: z.string().optional(),
  profession: z.string().optional(),
  familyStatus: z.string().optional(),
  netIncome: z.string().optional(),
  passiveIncome: z.string().optional(),
  relocationGoals: z.string().optional(),
});

export type ProfileSummaryInput = z.infer<typeof profileSummarySchema>;

/**
 * Personalized content schema for country response
 */
export const personalizedContentSchema = z.object({
  visaPath: z.string().optional(),
  howYouFit: z.string().optional(),
  whyRightForYou: z.string().optional(),
  advantages: z.array(z.string()).optional(),
});

export type PersonalizedContentInput = z.infer<typeof personalizedContentSchema>;

/**
 * Category overrides schema
 */
export const categoryOverridesSchema = z.object({
  general: z.string().optional(),
  visa: z.string().optional(),
  language: z.string().optional(),
  safety: z.string().optional(),
  jewish: z.string().optional(),
  openness: z.string().optional(),
  healthcare: z.string().optional(),
  education: z.string().optional(),
  employment: z.string().optional(),
  transport: z.string().optional(),
  cost: z.string().optional(),
  distance: z.string().optional(),
  community: z.string().optional(),
});

export type CategoryOverridesInput = z.infer<typeof categoryOverridesSchema>;

/**
 * List reports query schema (admin)
 */
export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'published']).optional(),
  userId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

/**
 * Report ID param schema
 */
export const reportIdParamSchema = z.object({
  reportId: z.string().uuid(),
});

export type ReportIdParam = z.infer<typeof reportIdParamSchema>;

/**
 * Questionnaire ID param schema (for creating report from questionnaire)
 */
export const questionnaireIdParamSchema = z.object({
  questionnaireId: z.string().uuid(),
});

export type QuestionnaireIdParam = z.infer<typeof questionnaireIdParamSchema>;

/**
 * Create report schema (admin creates from questionnaire)
 */
export const createReportSchema = z.object({
  questionnaireId: z.string().uuid(),
  greeting: z.string().optional(),
  profileSummary: profileSummarySchema.optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Update report schema (admin edits greeting/profile)
 */
export const updateReportSchema = z.object({
  greeting: z.string().optional(),
  profileSummary: profileSummarySchema.optional(),
});

export type UpdateReportInput = z.infer<typeof updateReportSchema>;

/**
 * Publish report schema (publishes report and optionally countries)
 */
export const publishReportSchema = z.object({
  publishCountries: z.boolean().default(true),
});

export type PublishReportInput = z.infer<typeof publishReportSchema>;

/**
 * Country response ID param schema
 */
export const countryResponseIdParamSchema = z.object({
  responseId: z.string().uuid(),
});

export type CountryResponseIdParam = z.infer<typeof countryResponseIdParamSchema>;

/**
 * Create country response schema (admin adds country to report)
 */
export const createCountryResponseSchema = z.object({
  reportId: z.string().uuid(),
  countryId: z.string().uuid(),
  displayOrder: z.number().int().min(1).optional().default(1),
  matchScore: z.number().int().min(0).max(100).optional().default(0),
  visaType: z.string().max(200).optional(),
  matchReasons: z.array(z.string()).optional().default([]),
  personalizedContent: personalizedContentSchema.optional().default({}),
  categoryOverrides: categoryOverridesSchema.nullable().optional(),
});

export type CreateCountryResponseInput = z.infer<typeof createCountryResponseSchema>;

/**
 * Update country response schema (admin edits country response)
 */
export const updateCountryResponseSchema = z.object({
  displayOrder: z.number().int().min(1).optional(),
  matchScore: z.number().int().min(0).max(100).optional(),
  visaType: z.string().max(200).nullable().optional(),
  matchReasons: z.array(z.string()).optional(),
  personalizedContent: personalizedContentSchema.optional(),
  categoryOverrides: categoryOverridesSchema.nullable().optional(),
});

export type UpdateCountryResponseInput = z.infer<typeof updateCountryResponseSchema>;

/**
 * Publish country response schema
 */
export const publishCountryResponseSchema = z.object({
  publish: z.boolean().default(true),
});

export type PublishCountryResponseInput = z.infer<typeof publishCountryResponseSchema>;
