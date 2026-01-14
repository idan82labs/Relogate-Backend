import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Type definitions for country category content JSONB structure.
 */
export interface CountryCategories {
  /** General country information */
  general?: string;
  /** Visa and immigration info */
  visa?: string;
  /** Language and weather */
  language?: string;
  /** Personal safety */
  safety?: string;
  /** Jewish and Israeli community */
  jewish?: string;
  /** Openness to immigrants */
  openness?: string;
  /** Healthcare system */
  healthcare?: string;
  /** Education system */
  education?: string;
  /** Employment opportunities */
  employment?: string;
  /** Public transportation */
  transport?: string;
  /** Cost of living */
  cost?: string;
  /** Distance from Israel */
  distance?: string;
  /** Community information */
  community?: string;
}

/**
 * Countries catalog table.
 *
 * Stores static country information that can be reused across
 * multiple user reports. Admin can edit this to update global
 * country information without affecting personalized content.
 */
export const countries = pgTable('countries', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Country identification
  code: varchar('code', { length: 3 }).notNull().unique(), // ISO 3166-1 alpha-2/3 code
  name: varchar('name', { length: 100 }).notNull(), // Hebrew name (פורטוגל)
  englishName: varchar('english_name', { length: 100 }).notNull(), // English name (Portugal)

  // Images
  flagImage: varchar('flag_image', { length: 500 }), // URL to flag image
  heroImage: varchar('hero_image', { length: 500 }), // URL to hero/banner image

  // General introduction
  introduction: text('introduction'), // Country overview text

  // Category content (static, reusable across users)
  categories: jsonb('categories').$type<CountryCategories>().notNull().default({}),

  // Status
  isActive: boolean('is_active').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference
export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;
