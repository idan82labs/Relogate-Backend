import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.js';
import { createModuleLogger } from '../../config/logger.js';
import type {
  ListNotificationsQuery,
  NotificationIdParam,
  CreateNotificationInput,
  MarkAsReadInput,
} from './notifications.schema.js';

const logger = createModuleLogger('notifications-controller');

/**
 * Notifications controller.
 * Handles HTTP request/response for notifications endpoints.
 */
export const notificationsController = {
  /**
   * GET /api/v1/notifications
   * List notifications for the current user.
   */
  async listNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const query = (req as Request & { validatedQuery: ListNotificationsQuery }).validatedQuery;
    logger.debug({ userId, query }, 'List notifications request');

    const result = await notificationsService.listNotifications(userId, query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/notifications/unread-count
   * Get unread notification count for the current user.
   */
  async getUnreadCount(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    logger.debug({ userId }, 'Get unread count request');

    const result = await notificationsService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/notifications/:notificationId
   * Get a notification by ID.
   */
  async getNotificationById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { notificationId } = (req as Request & { validatedParams: NotificationIdParam }).validatedParams;
    logger.debug({ userId, notificationId }, 'Get notification by ID request');

    const notification = await notificationsService.getNotificationById(notificationId, userId);

    res.status(200).json({
      success: true,
      data: { notification },
    });
  },

  /**
   * POST /api/v1/notifications/mark-read
   * Mark notifications as read.
   */
  async markAsRead(req: Request<object, object, MarkAsReadInput>, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { notificationIds, markAllAsRead } = req.body;
    logger.debug({ userId, notificationIds, markAllAsRead }, 'Mark as read request');

    const result = await notificationsService.markAsRead(userId, notificationIds, markAllAsRead);

    res.status(200).json({
      success: true,
      message: `${result.markedCount} notifications marked as read`,
      data: result,
    });
  },

  /**
   * DELETE /api/v1/notifications/:notificationId
   * Delete a notification.
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { notificationId } = (req as Request & { validatedParams: NotificationIdParam }).validatedParams;
    logger.debug({ userId, notificationId }, 'Delete notification request');

    await notificationsService.deleteNotification(notificationId, userId);

    logger.info({ notificationId }, 'Notification deleted');

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  },

  // ================== ADMIN ==================

  /**
   * POST /api/v1/admin/notifications
   * Create a notification (admin only).
   */
  async createNotification(req: Request<object, object, CreateNotificationInput>, res: Response): Promise<void> {
    const input = req.body;
    logger.debug({ targetUserId: input.userId, type: input.type }, 'Create notification request');

    const notification = await notificationsService.createNotification(input);

    logger.info({ notificationId: notification.id }, 'Notification created');

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification },
    });
  },
};
