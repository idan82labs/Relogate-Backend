import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  boolean,
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

// ============================================================================
// Type definitions for questionnaire responses JSONB structure (V2)
// ============================================================================

/**
 * Gender options.
 */
export type Gender = 'male' | 'female' | 'prefer_not_to_say';

/**
 * Family status options.
 */
export type FamilyStatus =
  | 'single'
  | 'single_with_children'
  | 'married'
  | 'married_with_children'
  | 'divorced'
  | 'divorced_with_children'
  | 'widowed'
  | 'widowed_with_children';

/**
 * Process partner options - who is relocating with the user.
 */
export type ProcessPartner =
  | 'alone'
  | 'spouse'
  | 'spouse_and_children'
  | 'children_only'
  | 'ex_spouse_and_children';

/**
 * Employment status options.
 */
export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'business_owner'
  | 'unemployed'
  | 'retired';

/**
 * Monthly income range options (in ILS).
 */
export type IncomeRange =
  | 'up_to_10000'
  | '10000_15000'
  | '15000_20000'
  | '20000_25000'
  | '25000_30000'
  | '30000_35000'
  | '35000_40000'
  | '40000_50000'
  | '50000_60000'
  | 'above_60000';

/**
 * Proximity to Israel preference.
 */
export type ProximityToIsrael =
  | 'up_to_3h'
  | 'up_to_6h'
  | 'up_to_12h'
  | 'not_important';

/**
 * Time zone difference preference.
 */
export type TimeZoneDifference =
  | 'up_to_1h'
  | 'up_to_2h'
  | 'up_to_6h'
  | 'up_to_8h'
  | 'up_to_10h'
  | 'not_important';

/**
 * Weather preference options.
 */
export type WeatherPreference =
  | 'four_seasons'
  | 'hot_year_round'
  | 'cold_year_round'
  | 'no_preference';

/**
 * Living style preference.
 */
export type LivingStyle =
  | 'big_city'
  | 'small_town'
  | 'rural'
  | 'coastal'
  | 'no_preference';

/**
 * Previous visa attempt status.
 */
export type VisaAttemptStatus =
  | 'never_tried'
  | 'tried_approved'
  | 'tried_rejected';

/**
 * Relocation reason options (multi-select).
 */
export type RelocationReason =
  | 'economic_comfort'
  | 'personal_safety'
  | 'education_for_children'
  | 'future_for_family'
  | 'professional_development'
  | 'real_estate_opportunity'
  | 'academic_opportunity'
  | 'adventure'
  | 'life_change'
  | 'just_exploring';

/**
 * Child information.
 */
export interface Child {
  name: string;
  age: number;
}

/**
 * Personal details for the main applicant.
 */
export interface PersonalDetails {
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  familyStatus?: FamilyStatus;
  processPartner?: ProcessPartner;
  /** V1 fields preserved for backward compatibility */
  citizenship?: string;
  residenceCountry?: string;
  additionalCitizenship?: string;
}

/**
 * Spouse details (conditional - only if married or with spouse).
 */
export interface SpouseDetails {
  name?: string;
  birthDate?: string;
  citizenship?: string;
  employmentStatus?: EmploymentStatus;
  fieldOfWork?: string;
  highestEducation?: string;
  canWorkRemotely?: boolean;
  openToStudyingAbroad?: boolean;
  speakingLanguages?: string[];
  writingLanguages?: string[];
}

/**
 * Employment and education details.
 */
export interface EmploymentDetails {
  employmentStatus?: EmploymentStatus;
  fieldOfWork?: string;
  highestEducation?: string;
  canWorkRemotely?: boolean;
  monthlyIncome?: IncomeRange;
  hasPassiveIncome?: boolean;
  passiveIncomeAmount?: string;
}

/**
 * Studies and investments preferences.
 */
export interface StudiesInvestments {
  openToStudyingAbroad?: boolean;
  spouseOpenToStudyingAbroad?: boolean;
  willingToInvestInProperty?: boolean;
  has250kEuroForInvestment?: boolean;
}

/**
 * Language proficiency.
 */
export interface Languages {
  speakingLanguages?: string[];
  writingLanguages?: string[];
}

/**
 * Destination preferences.
 */
export interface Preferences {
  proximityToIsrael?: ProximityToIsrael;
  timeZoneDifference?: TimeZoneDifference;
  weatherPreference?: WeatherPreference;
  religiousJewishCommunity?: boolean;
  israeliCommunity?: boolean;
  livingStyle?: LivingStyle;
  additionalConsiderations?: boolean;
  additionalConsiderationsText?: string;
}

/**
 * Bureaucracy and visa history.
 */
export interface Bureaucracy {
  previousVisaAttempt?: VisaAttemptStatus;
  hasCriminalRecord?: boolean;
}

/**
 * Main questionnaire responses structure (V2).
 * Supports both V1 (4 steps) and V2 (9 steps) schemas.
 */
export interface QuestionnaireResponses {
  /** Schema version for backward compatibility */
  version: number;

  // ===== V1 Fields (preserved for backward compatibility) =====
  /** V1 Step 1: Country preferences */
  preferredCountries?: string[];

  /** V1 Step 2: Relocation reason (free text - deprecated in V2) */
  relocationReason?: string;

  /** V1 Step 3: Family status (deprecated in V2, now in personalDetails) */
  familyStatus?: string;

  // ===== V2 Fields =====
  /** V2 Step 2: Personal Details */
  personalDetails?: PersonalDetails;

  /** V2 Step 2: Spouse Details (conditional) */
  spouseDetails?: SpouseDetails;

  /** V2 Step 2: Children (up to 8) */
  children?: Child[];

  /** V2 Step 3: Migration Goals (multi-select) */
  relocationReasons?: RelocationReason[];

  /** V2 Step 4: Citizenships (user) */
  citizenships?: string[];

  /** V2 Step 4: Citizenships (spouse) */
  spouseCitizenships?: string[];

  /** V2 Step 5: Employment & Education */
  employment?: EmploymentDetails;

  /** V2 Step 6: Studies & Investments */
  studiesInvestments?: StudiesInvestments;

  /** V2 Step 7: Languages (user) */
  languages?: Languages;

  /** V2 Step 7: Languages (spouse) */
  spouseLanguages?: Languages;

  /** V2 Step 8: Preferences */
  preferences?: Preferences;

  /** V2 Step 9: Bureaucracy */
  bureaucracy?: Bureaucracy;

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

  // Schema migration tracking
  needsUpdate: boolean('needs_update').default(false).notNull(),
  lastSchemaCheck: timestamp('last_schema_check', { mode: 'date' }),

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
