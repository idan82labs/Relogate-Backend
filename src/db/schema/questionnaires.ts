import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { userProfiles } from './users.js';

/**
 * Questionnaire status enum
 */
export const questionnaireStatusEnum = pgEnum('questionnaire_status', [
  'in_progress',
  'completed',
  'archived',
]);

/**
 * Type definitions for questionnaire responses JSONB structure.
 * These are documented here for TypeScript type safety.
 */
export interface QuestionnaireResponses {
  /** Schema version for backward compatibility */
  version: number;

  /** Step 1: Country preferences */
  preferredCountries?: string[];

  /** Step 2: Relocation reason (free text) */
  relocationReason?: string;

  /** Step 3: Family status */
  familyStatus?: string;

  /** Step 4: Personal details */
  personalDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    citizenship?: string;
    residenceCountry?: string;
    additionalCitizenship?: string;
  };

  /** Step 4: Spouse details (conditional) */
  spouseDetails?: {
    birthDate?: string;
    citizenship?: string;
  };

  /** Future fields can be added here without migrations */
  [key: string]: unknown;
}

/**
 * Type definitions for questionnaire results JSONB structure.
 */
export interface QuestionnaireRecommendation {
  countryCode: string;
  countryName: string;
  matchScore: number;
  categories: Array<{
    name: string;
    score: number;
  }>;
}

/**
 * Questionnaire responses table.
 *
 * Stores user questionnaire responses using JSONB for flexibility.
 * The schema_version field allows handling different questionnaire versions.
 */
export const questionnaireResponses = pgTable('questionnaire_responses', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to user (required - authenticated users only)
  userId: uuid('user_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .notNull(),

  // Schema version for backward compatibility
  schemaVersion: integer('schema_version').notNull().default(1),

  // All responses stored in flexible JSONB
  responses: jsonb('responses').$type<QuestionnaireResponses>().notNull().default({
    version: 1,
    preferredCountries: [],
  }),

  // Status tracking
  status: questionnaireStatusEnum('status').default('in_progress').notNull(),
  currentStep: varchar('current_step', { length: 50 }).default('countries').notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { mode: 'date' }),
});

// Note: One in-progress questionnaire per user is enforced in the service layer
// A partial unique index can be added manually in SQL if needed:
// CREATE UNIQUE INDEX one_active_per_user ON questionnaire_responses(user_id) WHERE status = 'in_progress';

// Type inference
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type NewQuestionnaireResponse = typeof questionnaireResponses.$inferInsert;

/**
 * Questionnaire results table.
 *
 * Stores computed recommendations for completed questionnaires.
 */
export const questionnaireResults = pgTable('questionnaire_results', {
  id: uuid('id').primaryKey().defaultRandom(),

  questionnaireId: uuid('questionnaire_id')
    .references(() => questionnaireResponses.id, { onDelete: 'cascade' })
    .notNull(),

  // Results data stored in JSONB
  recommendations: jsonb('recommendations')
    .$type<QuestionnaireRecommendation[]>()
    .notNull()
    .default([]),

  // Metadata
  generatedAt: timestamp('generated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference
export type QuestionnaireResult = typeof questionnaireResults.$inferSelect;
export type NewQuestionnaireResult = typeof questionnaireResults.$inferInsert;
