import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { userProfiles } from './users.js';
import { questionnaireResponses } from './questionnaires.js';

/**
 * Report status enum
 */
export const reportStatusEnum = pgEnum('report_status', [
  'draft',
  'published',
]);

/**
 * Type definitions for profile summary JSONB structure.
 */
export interface ReportProfileSummary {
  userName: string;
  citizenship?: string;
  age?: string;
  profession?: string;
  familyStatus?: string;
  netIncome?: string;
  passiveIncome?: string;
  relocationGoals?: string;
}

/**
 * Type definitions for destination narrative JSONB structure.
 * This is the personalized story for why this destination fits the user.
 */
export interface DestinationNarrative {
  /** Introduction - why this destination */
  introduction?: string;
  /** Pathway - how to get there (visa/permit route) */
  pathway?: string;
  /** Fit - how the user specifically matches */
  fit?: string;
  /** Benefits - what the user gains */
  benefits?: string;
  /** Highlights - bullet list of key points */
  highlights?: string[];
}

/**
 * Type definitions for flexible content sections.
 * Each section represents a topic (visa, safety, education, etc.)
 * with fully personalized content.
 */
export interface DestinationSection {
  /** Unique ID for the section */
  id: string;
  /** Key identifier (e.g., "visa", "safety", or custom) */
  key: string;
  /** Display title */
  title: string;
  /** Optional icon identifier */
  icon?: string;
  /** Markdown content */
  content: string;
  /** Display order */
  position: number;
}

/**
 * Questionnaire reports table.
 *
 * Stores shared report data for a questionnaire submission.
 * Each report can have multiple destination responses linked to it.
 */
export const questionnaireReports = pgTable('questionnaire_reports', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to user and questionnaire
  userId: uuid('user_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .notNull(),
  questionnaireId: uuid('questionnaire_id')
    .references(() => questionnaireResponses.id, { onDelete: 'cascade' })
    .notNull(),

  // Greeting message (personalized opening)
  greeting: text('greeting'),

  // Profile summary (extracted/edited from questionnaire)
  profileSummary: jsonb('profile_summary').$type<ReportProfileSummary>().notNull().default({
    userName: '',
  }),

  // Status
  status: reportStatusEnum('status').default('draft').notNull(),

  // Timestamps
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference
export type QuestionnaireReport = typeof questionnaireReports.$inferSelect;
export type NewQuestionnaireReport = typeof questionnaireReports.$inferInsert;

/**
 * Destination responses table.
 *
 * Stores individual destination recommendations within a report.
 * Each destination response is fully self-contained with all
 * personalized content - no foreign keys to master data.
 */
export const destinationResponses = pgTable('destination_responses', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to parent report
  reportId: uuid('report_id')
    .references(() => questionnaireReports.id, { onDelete: 'cascade' })
    .notNull(),

  // Display order (1, 2, 3...)
  displayOrder: integer('display_order').notNull().default(1),

  // Destination presentation (all personalized)
  destinationName: varchar('destination_name', { length: 200 }).notNull(),
  destinationSubtitle: varchar('destination_subtitle', { length: 200 }),
  destinationImage: text('destination_image'), // URL
  destinationBadge: varchar('destination_badge', { length: 100 }), // e.g., "מומלץ במיוחד"

  // Match information
  matchScore: integer('match_score').notNull().default(0), // 0-100
  visaType: varchar('visa_type', { length: 200 }), // e.g., "ויזת נוודים דיגיטליים D8"
  matchReasons: jsonb('match_reasons').$type<string[]>().notNull().default([]),

  // Narrative content (personalized story)
  narrative: jsonb('narrative')
    .$type<DestinationNarrative>()
    .notNull()
    .default({}),

  // Flexible content sections
  sections: jsonb('sections')
    .$type<DestinationSection[]>()
    .notNull()
    .default([]),

  // Status (can publish individual destinations)
  status: reportStatusEnum('status').default('draft').notNull(),

  // Timestamps
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference
export type DestinationResponse = typeof destinationResponses.$inferSelect;
export type NewDestinationResponse = typeof destinationResponses.$inferInsert;

// Legacy type aliases for backwards compatibility during transition
/** @deprecated Use DestinationResponse instead */
export type CountryResponse = DestinationResponse;
/** @deprecated Use NewDestinationResponse instead */
export type NewCountryResponse = NewDestinationResponse;
