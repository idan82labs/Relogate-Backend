import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

/**
 * User profiles table.
 *
 * Note: Authentication is handled by Supabase Auth (auth.users).
 * This table stores additional profile data linked to auth users.
 *
 * The `id` column references Supabase Auth user ID.
 */
export const userProfiles = pgTable('user_profiles', {
  // Links to Supabase Auth user (auth.users.id)
  id: uuid('id').primaryKey(),

  // Profile information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  citizenship: varchar('citizenship', { length: 100 }),
  birthDate: timestamp('birth_date', { mode: 'date' }),

  // Preferences
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('he'),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
