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
 * Destination info schema (inline, self-contained)
 */
export const destinationSchema = z.object({
  name: z.string().min(1).max(200),
  subtitle: z.string().max(200).nullable().optional(),
  image: z.string().url().nullable().optional(),
  badge: z.string().max(100).nullable().optional(),
});

export type DestinationInput = z.infer<typeof destinationSchema>;

/**
 * Match info schema
 */
export const matchSchema = z.object({
  score: z.number().int().min(0).max(100).default(0),
  reasons: z.array(z.string()).default([]),
  visaType: z.string().max(200).nullable().optional(),
});

export type MatchInput = z.infer<typeof matchSchema>;

/**
 * Narrative content schema (personalized story)
 */
export const narrativeSchema = z.object({
  introduction: z.string().optional(),
  pathway: z.string().optional(),
  fit: z.string().optional(),
  benefits: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export type NarrativeInput = z.infer<typeof narrativeSchema>;

/**
 * Section schema (flexible content sections)
 */
export const sectionSchema = z.object({
  id: z.string().uuid().optional(), // Auto-generate if not provided
  key: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  icon: z.string().max(50).optional(),
  content: z.string(),
  position: z.number().int().min(0),
});

export type SectionInput = z.infer<typeof sectionSchema>;

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
 * Publish report schema (publishes report and optionally destinations)
 */
export const publishReportSchema = z.object({
  publishDestinations: z.boolean().default(true),
});

export type PublishReportInput = z.infer<typeof publishReportSchema>;

/**
 * Destination response ID param schema
 */
export const destinationResponseIdParamSchema = z.object({
  destinationId: z.string().uuid(),
});

export type DestinationResponseIdParam = z.infer<typeof destinationResponseIdParamSchema>;

/**
 * Create destination response schema (admin adds destination to report)
 */
export const createDestinationResponseSchema = z.object({
  reportId: z.string().uuid(),
  displayOrder: z.number().int().min(1).optional().default(1),
  destination: destinationSchema,
  match: matchSchema.optional().default({ score: 0, reasons: [] }),
  narrative: narrativeSchema.optional().default({}),
  sections: z.array(sectionSchema).optional().default([]),
});

export type CreateDestinationResponseInput = z.infer<typeof createDestinationResponseSchema>;

/**
 * Update destination response schema (admin edits destination response)
 */
export const updateDestinationResponseSchema = z.object({
  displayOrder: z.number().int().min(1).optional(),
  destination: destinationSchema.partial().optional(),
  match: matchSchema.partial().optional(),
  narrative: narrativeSchema.optional(),
  sections: z.array(sectionSchema).optional(),
});

export type UpdateDestinationResponseInput = z.infer<typeof updateDestinationResponseSchema>;

/**
 * Publish destination response schema
 */
export const publishDestinationResponseSchema = z.object({
  publish: z.boolean().default(true),
});

export type PublishDestinationResponseInput = z.infer<typeof publishDestinationResponseSchema>;

// Legacy schema aliases for backwards compatibility
/** @deprecated Use destinationResponseIdParamSchema instead */
export const countryResponseIdParamSchema = destinationResponseIdParamSchema;
/** @deprecated Use CreateDestinationResponseInput instead */
export type CountryResponseIdParam = DestinationResponseIdParam;
