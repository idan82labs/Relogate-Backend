import { z } from 'zod';
import { VALID_STEPS } from './questionnaire.types.js';

// ============================================================================
// Enum Schemas
// ============================================================================

export const genderSchema = z.enum(['male', 'female', 'prefer_not_to_say']);

export const familyStatusSchema = z.enum([
  'single',
  'single_with_children',
  'married',
  'married_with_children',
  'divorced',
  'divorced_with_children',
  'widowed',
  'widowed_with_children',
]);

export const processPartnerSchema = z.enum([
  'alone',
  'spouse',
  'spouse_and_children',
  'children_only',
  'ex_spouse_and_children',
]);

export const employmentStatusSchema = z.enum([
  'employed',
  'self_employed',
  'business_owner',
  'unemployed',
  'retired',
]);

export const incomeRangeSchema = z.enum([
  'up_to_10000',
  '10000_15000',
  '15000_20000',
  '20000_25000',
  '25000_30000',
  '30000_35000',
  '35000_40000',
  '40000_50000',
  '50000_60000',
  'above_60000',
]);

export const proximityToIsraelSchema = z.enum([
  'up_to_3h',
  'up_to_6h',
  'up_to_12h',
  'not_important',
]);

export const timeZoneDifferenceSchema = z.enum([
  'up_to_1h',
  'up_to_2h',
  'up_to_6h',
  'up_to_8h',
  'up_to_10h',
  'not_important',
]);

export const weatherPreferenceSchema = z.enum([
  'four_seasons',
  'hot_year_round',
  'cold_year_round',
  'no_preference',
]);

export const livingStyleSchema = z.enum([
  'big_city',
  'small_town',
  'rural',
  'coastal',
  'no_preference',
]);

export const visaAttemptStatusSchema = z.enum([
  'never_tried',
  'tried_approved',
  'tried_rejected',
]);

export const relocationReasonSchema = z.enum([
  'economic_comfort',
  'personal_safety',
  'education_for_children',
  'future_for_family',
  'professional_development',
  'real_estate_opportunity',
  'academic_opportunity',
  'adventure',
  'life_change',
  'just_exploring',
]);

// ============================================================================
// Component Schemas
// ============================================================================

/**
 * Child schema.
 */
export const childSchema = z.object({
  name: z.string().min(1).max(200),
  age: z.number().int().min(0).max(120),
});

/**
 * Personal details schema (V2).
 */
export const personalDetailsSchema = z.object({
  fullName: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  birthDate: z.string().optional(),
  gender: genderSchema.optional(),
  familyStatus: familyStatusSchema.optional(),
  processPartner: processPartnerSchema.optional(),
  // V1 fields preserved for backward compatibility
  citizenship: z.string().max(100).optional(),
  residenceCountry: z.string().max(100).optional(),
  additionalCitizenship: z.string().max(100).optional(),
}).optional();

/**
 * Spouse details schema (V2).
 */
export const spouseDetailsSchema = z.object({
  name: z.string().max(200).optional(),
  birthDate: z.string().optional(),
  citizenship: z.string().max(100).optional(),
  employmentStatus: employmentStatusSchema.optional(),
  fieldOfWork: z.string().max(200).optional(),
  highestEducation: z.string().max(200).optional(),
  canWorkRemotely: z.boolean().optional(),
  openToStudyingAbroad: z.boolean().optional(),
  speakingLanguages: z.array(z.string().max(50)).max(5).optional(),
  writingLanguages: z.array(z.string().max(50)).max(5).optional(),
}).optional();

/**
 * Employment details schema (V2).
 */
export const employmentDetailsSchema = z.object({
  employmentStatus: employmentStatusSchema.optional(),
  fieldOfWork: z.string().max(200).optional(),
  highestEducation: z.string().max(200).optional(),
  canWorkRemotely: z.boolean().optional(),
  monthlyIncome: incomeRangeSchema.optional(),
  hasPassiveIncome: z.boolean().optional(),
  passiveIncomeAmount: z.string().max(50).optional(),
}).optional();

/**
 * Studies and investments schema (V2).
 */
export const studiesInvestmentsSchema = z.object({
  openToStudyingAbroad: z.boolean().optional(),
  spouseOpenToStudyingAbroad: z.boolean().optional(),
  willingToInvestInProperty: z.boolean().optional(),
  has250kEuroForInvestment: z.boolean().optional(),
}).optional();

/**
 * Languages schema (V2).
 */
export const languagesSchema = z.object({
  speakingLanguages: z.array(z.string().max(50)).max(5).optional(),
  writingLanguages: z.array(z.string().max(50)).max(5).optional(),
}).optional();

/**
 * Preferences schema (V2).
 */
export const preferencesSchema = z.object({
  proximityToIsrael: proximityToIsraelSchema.optional(),
  timeZoneDifference: timeZoneDifferenceSchema.optional(),
  weatherPreference: weatherPreferenceSchema.optional(),
  religiousJewishCommunity: z.boolean().optional(),
  israeliCommunity: z.boolean().optional(),
  livingStyle: livingStyleSchema.optional(),
  additionalConsiderations: z.boolean().optional(),
  additionalConsiderationsText: z.string().max(2000).optional(),
}).optional();

/**
 * Bureaucracy schema (V2).
 */
export const bureaucracySchema = z.object({
  previousVisaAttempt: visaAttemptStatusSchema.optional(),
  hasCriminalRecord: z.boolean().optional(),
}).optional();

// ============================================================================
// Main Responses Schema
// ============================================================================

/**
 * Questionnaire responses schema (V2).
 * Flexible to allow partial updates at each step.
 * Maintains backward compatibility with V1 fields.
 */
export const responsesSchema = z.object({
  // Schema version
  version: z.number().int().positive().optional().default(2),

  // ===== V1 Fields (preserved for backward compatibility) =====
  preferredCountries: z.array(z.string().max(10)).optional(),
  relocationReason: z.string().max(2000).optional(),
  familyStatus: z.string().max(50).optional(),

  // ===== V2 Fields =====
  // Personal Details
  personalDetails: personalDetailsSchema,
  spouseDetails: spouseDetailsSchema,
  children: z.array(childSchema).max(8).optional(),

  // Migration Goals
  relocationReasons: z.array(relocationReasonSchema).max(10).optional(),

  // Citizenship
  citizenships: z.array(z.string().max(100)).max(5).optional(),
  spouseCitizenships: z.array(z.string().max(100)).max(5).optional(),

  // Employment & Education
  employment: employmentDetailsSchema,

  // Studies & Investments
  studiesInvestments: studiesInvestmentsSchema,

  // Languages
  languages: languagesSchema,
  spouseLanguages: languagesSchema,

  // Preferences
  preferences: preferencesSchema,

  // Bureaucracy
  bureaucracy: bureaucracySchema,
}).passthrough(); // Allow additional fields for future compatibility

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Create questionnaire request schema.
 */
export const createQuestionnaireSchema = z.object({
  responses: responsesSchema.optional().default({ version: 2 }),
});

/**
 * Update questionnaire request schema.
 */
export const updateQuestionnaireSchema = z.object({
  responses: responsesSchema.optional(),
  currentStep: z.enum(VALID_STEPS).optional(),
});

/**
 * Complete questionnaire request schema.
 */
export const completeQuestionnaireSchema = z.object({
  responses: responsesSchema,
});

/**
 * Get questionnaire by ID params schema.
 */
export const questionnaireIdParamSchema = z.object({
  id: z.string().uuid('Invalid questionnaire ID'),
});

// ============================================================================
// TypeScript Types (inferred from schemas)
// ============================================================================

export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireSchema>;
export type UpdateQuestionnaireInput = z.infer<typeof updateQuestionnaireSchema>;
export type CompleteQuestionnaireInput = z.infer<typeof completeQuestionnaireSchema>;
export type QuestionnaireIdParam = z.infer<typeof questionnaireIdParamSchema>;

// Export component types
export type ChildInput = z.infer<typeof childSchema>;
export type PersonalDetailsInput = z.infer<typeof personalDetailsSchema>;
export type SpouseDetailsInput = z.infer<typeof spouseDetailsSchema>;
export type EmploymentDetailsInput = z.infer<typeof employmentDetailsSchema>;
export type StudiesInvestmentsInput = z.infer<typeof studiesInvestmentsSchema>;
export type LanguagesInput = z.infer<typeof languagesSchema>;
export type PreferencesInput = z.infer<typeof preferencesSchema>;
export type BureaucracyInput = z.infer<typeof bureaucracySchema>;
export type ResponsesInput = z.infer<typeof responsesSchema>;
