import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { userProfiles } from './users.js';

/**
 * Notification type enum
 */
export const notificationTypeEnum = pgEnum('notification_type', [
  'country_response_ready', // User: A country response has been published
  'report_ready', // User: Full report is ready (all countries published)
  'questionnaire_completed', // Admin: User completed a questionnaire
]);

/**
 * Notifications table.
 *
 * Stores notifications for both users and admins.
 * - Users receive notifications when their responses are ready
 * - Admins receive notifications when users complete questionnaires
 */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Target user (recipient of notification)
  userId: uuid('user_id')
    .references(() => userProfiles.id, { onDelete: 'cascade' })
    .notNull(),

  // Notification type
  type: notificationTypeEnum('type').notNull(),

  // Content
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message'),

  // Related entity (questionnaire, report, or country response ID)
  relatedId: uuid('related_id'),

  // Status
  isRead: boolean('is_read').default(false).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  readAt: timestamp('read_at', { mode: 'date' }),
});

// Type inference
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
