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
import { countries } from './countries.js';

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
 * Type definitions for personalized content JSONB structure.
 */
export interface PersonalizedContent {
  /** המסלול - Visa path description */
  visaPath?: string;
  /** איך אתם מתאימים - How user fits requirements */
  howYouFit?: string;
  /** למה זה נכון לכם - Why it's right for them */
  whyRightForYou?: string;
  /** יתרונות עבורכם - Advantages bullet list */
  advantages?: string[];
}

/**
 * Type definitions for category overrides JSONB structure.
 * When set, these override the static country category content.
 */
export interface CategoryOverrides {
  general?: string;
  visa?: string;
  language?: string;
  safety?: string;
  jewish?: string;
  openness?: string;
  healthcare?: string;
  education?: string;
  employment?: string;
  transport?: string;
  cost?: string;
  distance?: string;
  community?: string;
}

/**
 * Questionnaire reports table.
 *
 * Stores shared report data for a questionnaire submission.
 * Each report can have multiple country responses linked to it.
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
 * Country responses table.
 *
 * Stores individual country recommendations within a report.
 * Each country response links to a static country and contains
 * personalized content written by admin.
 */
export const countryResponses = pgTable('country_responses', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Link to parent report
  reportId: uuid('report_id')
    .references(() => questionnaireReports.id, { onDelete: 'cascade' })
    .notNull(),

  // Link to static country data
  countryId: uuid('country_id')
    .references(() => countries.id, { onDelete: 'restrict' })
    .notNull(),

  // Display order (1, 2, 3...)
  displayOrder: integer('display_order').notNull().default(1),

  // Match information
  matchScore: integer('match_score').notNull().default(0), // 0-100
  visaType: varchar('visa_type', { length: 200 }), // e.g., "נוודים דיגיטליים D8"
  matchReasons: jsonb('match_reasons').$type<string[]>().notNull().default([]),

  // Personalized content (admin writes these)
  personalizedContent: jsonb('personalized_content')
    .$type<PersonalizedContent>()
    .notNull()
    .default({}),

  // Optional category overrides (uses static country data if null)
  categoryOverrides: jsonb('category_overrides').$type<CategoryOverrides>(),

  // Status (can publish individual countries)
  status: reportStatusEnum('status').default('draft').notNull(),

  // Timestamps
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference
export type CountryResponse = typeof countryResponses.$inferSelect;
export type NewCountryResponse = typeof countryResponses.$inferInsert;
