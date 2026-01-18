import { z } from 'zod';

/**
 * Notification type enum for validation.
 * Must match the notification_type enum in the database.
 *
 * Categories:
 * - Report-related: report_ready, country_response_ready
 * - Questionnaire (legacy): questionnaire_completed
 * - Questionnaire V2 (user-facing): questionnaire_updated, questionnaire_resubmit_required, questionnaire_reminder
 * - Questionnaire V2 (admin-facing): new_questionnaire_submitted, questionnaire_update_completed
 * - System: system
 */
export const notificationTypeSchema = z.enum([
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

export type NotificationType = z.infer<typeof notificationTypeSchema>;

/**
 * List notifications query schema (for users)
 */
export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

/**
 * Notification ID param schema
 */
export const notificationIdParamSchema = z.object({
  notificationId: z.string().uuid(),
});

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;

/**
 * Create notification schema (admin)
 */
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().optional(),
  relatedId: z.string().uuid().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

/**
 * Mark as read schema
 */
export const markAsReadSchema = z.object({
  notificationIds: z.array(z.string().uuid()).min(1).optional(),
  markAllAsRead: z.boolean().optional().default(false),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
