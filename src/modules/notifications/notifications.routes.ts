import { Router } from 'express';
import type { ZodSchema } from 'zod';
import { notificationsController } from './notifications.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateRequest, validateQuery, validateParams } from '../../middleware/validate-request.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  createNotificationSchema,
  markAsReadSchema,
  type ListNotificationsQuery,
} from './notifications.schema.js';

/**
 * User notifications routes.
 * All routes require authentication.
 */
const userRouter = Router();

// All user routes require authentication
userRouter.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    List notifications for the current user
 * @access  Authenticated users
 */
userRouter.get(
  '/',
  validateQuery(listNotificationsQuerySchema as ZodSchema<ListNotificationsQuery>),
  notificationsController.listNotifications
);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Authenticated users
 */
userRouter.get('/unread-count', notificationsController.getUnreadCount);

/**
 * @route   POST /api/v1/notifications/mark-read
 * @desc    Mark notifications as read
 * @access  Authenticated users
 */
userRouter.post(
  '/mark-read',
  validateRequest(markAsReadSchema),
  notificationsController.markAsRead
);

/**
 * @route   GET /api/v1/notifications/:notificationId
 * @desc    Get a notification by ID
 * @access  Authenticated users
 */
userRouter.get(
  '/:notificationId',
  validateParams(notificationIdParamSchema),
  notificationsController.getNotificationById
);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Authenticated users
 */
userRouter.delete(
  '/:notificationId',
  validateParams(notificationIdParamSchema),
  notificationsController.deleteNotification
);

/**
 * Admin notifications routes.
 * All routes require authentication and admin role.
 */
const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate, requireAdmin);

/**
 * @route   POST /api/v1/admin/notifications
 * @desc    Create a notification for a user
 * @access  Admin only
 */
adminRouter.post(
  '/',
  validateRequest(createNotificationSchema),
  notificationsController.createNotification
);

export const notificationsUserRouter = userRouter;
export const notificationsAdminRouter = adminRouter;
