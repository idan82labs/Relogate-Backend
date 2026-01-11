import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { userProfiles } from './users.js';

/**
 * Family status enum
 */
export const familyStatusEnum = pgEnum('family_status', [
  'single',
  'married',
  'married_with_children',
]);

/**
 * Questionnaire status enum
 */
export const questionnaireStatusEnum = pgEnum('questionnaire_status', [
  'in_progress',
  'completed',
  'archived',
]);

/**
 * Questionnaires table.
 *
 * Stores user questionnaire responses for relocation recommendations.
 */
export const questionnaires = pgTable('questionnaires', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to user (optional - can be anonymous)
  userId: uuid('user_id').references(() => userProfiles.id, {
    onDelete: 'set null',
  }),

  // Questionnaire data
  countries: jsonb('countries').$type<string[]>().notNull().default([]),
  relocationReason: text('relocation_reason'),
  familyStatus: familyStatusEnum('family_status'),

  // Spouse details (if married)
  spouseDetails: jsonb('spouse_details').$type<{
    firstName?: string;
    lastName?: string;
  }>(),

  // Personal details (for anonymous users or additional info)
  personalDetails: jsonb('personal_details').$type<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    citizenship?: string;
  }>(),

  // Status tracking
  status: questionnaireStatusEnum('status').default('in_progress').notNull(),
  currentStep: varchar('current_step', { length: 50 }).default('countries'),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { mode: 'date' }),
});

// Type inference
export type Questionnaire = typeof questionnaires.$inferSelect;
export type NewQuestionnaire = typeof questionnaires.$inferInsert;

/**
 * Questionnaire results table.
 *
 * Stores computed recommendations for completed questionnaires.
 */
export const questionnaireResults = pgTable('questionnaire_results', {
  id: uuid('id').primaryKey().defaultRandom(),

  questionnaireId: uuid('questionnaire_id')
    .references(() => questionnaires.id, { onDelete: 'cascade' })
    .notNull(),

  // Results data
  recommendations: jsonb('recommendations')
    .$type<
      Array<{
        countryCode: string;
        countryName: string;
        matchScore: number;
        categories: Array<{
          name: string;
          score: number;
        }>;
      }>
    >()
    .notNull()
    .default([]),

  // Metadata
  generatedAt: timestamp('generated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference
export type QuestionnaireResult = typeof questionnaireResults.$inferSelect;
export type NewQuestionnaireResult = typeof questionnaireResults.$inferInsert;
