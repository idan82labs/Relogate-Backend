import { z } from 'zod';
import { VALID_STEPS } from './questionnaire.types.js';

/**
 * Personal details schema.
 */
const personalDetailsSchema = z.object({
  fullName: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  birthDate: z.string().optional(),
  citizenship: z.string().max(100).optional(),
  residenceCountry: z.string().max(100).optional(),
  additionalCitizenship: z.string().max(100).optional(),
}).optional();

/**
 * Spouse details schema.
 */
const spouseDetailsSchema = z.object({
  birthDate: z.string().optional(),
  citizenship: z.string().max(100).optional(),
}).optional();

/**
 * Questionnaire responses schema.
 * Flexible to allow partial updates at each step.
 */
export const responsesSchema = z.object({
  version: z.number().int().positive().optional().default(1),
  preferredCountries: z.array(z.string().max(10)).optional(),
  relocationReason: z.string().max(2000).optional(),
  familyStatus: z.string().max(50).optional(),
  personalDetails: personalDetailsSchema,
  spouseDetails: spouseDetailsSchema,
}).passthrough(); // Allow additional fields for future compatibility

/**
 * Create questionnaire request schema.
 */
export const createQuestionnaireSchema = z.object({
  responses: responsesSchema.optional().default({ version: 1 }),
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

// Infer TypeScript types from schemas
export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireSchema>;
export type UpdateQuestionnaireInput = z.infer<typeof updateQuestionnaireSchema>;
export type CompleteQuestionnaireInput = z.infer<typeof completeQuestionnaireSchema>;
export type QuestionnaireIdParam = z.infer<typeof questionnaireIdParamSchema>;
