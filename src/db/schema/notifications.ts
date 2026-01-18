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
 *
 * Types:
 * - Report-related (user-facing):
 *   - report_ready: Full report is ready
 *   - country_response_ready: A specific country response is ready
 *
 * - Questionnaire V1 (legacy):
 *   - questionnaire_completed: Admin notification when user completes questionnaire
 *
 * - Questionnaire V2 (user-facing):
 *   - questionnaire_updated: Schema updated, user should review
 *   - questionnaire_resubmit_required: User must resubmit due to major changes
 *   - questionnaire_reminder: Reminder to complete questionnaire
 *
 * - Questionnaire V2 (admin-facing):
 *   - new_questionnaire_submitted: Admin notification for new questionnaire
 *   - questionnaire_update_completed: Admin notification when user completes update
 *
 * - System:
 *   - system: General system notifications
 */
export const notificationTypeEnum = pgEnum('notification_type', [
  // Report-related (user-facing)
  'report_ready',
  'country_response_ready',
  // Questionnaire - existing
  'questionnaire_completed',
  // Questionnaire V2 - user-facing
  'questionnaire_updated',
  'questionnaire_resubmit_required',
  'questionnaire_reminder',
  // Questionnaire V2 - admin-facing
  'new_questionnaire_submitted',
  'questionnaire_update_completed',
  // System
  'system',
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
