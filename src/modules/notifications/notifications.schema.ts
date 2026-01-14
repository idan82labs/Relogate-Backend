import { z } from 'zod';

/**
 * Notification type enum for validation
 */
export const notificationTypeSchema = z.enum([
  'country_response_ready',
  'report_ready',
  'questionnaire_completed',
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
