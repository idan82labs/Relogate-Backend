import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import { createModuleLogger } from '../../config/logger.js';
import { UnauthorizedError } from '../../lib/errors.js';
import type { ListUsersQuery, CreateUserInput, UserIdParam, BatchNotificationInput } from './admin.schema.js';
import { questionnaireService } from '../questionnaire/questionnaire.service.js';
import { notificationsService } from '../notifications/notifications.service.js';

const logger = createModuleLogger('admin-controller');

/**
 * Admin controller.
 * Handles HTTP request/response for admin endpoints.
 */
export const adminController = {
  /**
   * GET /api/v1/admin/users
   * List all users with pagination and filtering.
   */
  async listUsers(
    req: Request,
    res: Response
  ): Promise<void> {
    // Query is validated and transformed by validateQuery middleware
    const query = (req as Request & { validatedQuery: ListUsersQuery }).validatedQuery;
    logger.debug({ query }, 'List users request');

    const result = await adminService.listUsers(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/admin/users/:userId
   * Get a user by ID with their questionnaires.
   */
  async getUserById(
    req: Request,
    res: Response
  ): Promise<void> {
    const { userId } = (req as Request & { validatedParams: UserIdParam }).validatedParams;
    logger.debug({ userId }, 'Get user by ID request');

    const user = await adminService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },

  /**
   * POST /api/v1/admin/users
   * Create a new user.
   */
  async createUser(
    req: Request<object, object, CreateUserInput>,
    res: Response
  ): Promise<void> {
    const { email, firstName, lastName } = req.body;
    logger.debug({ email, firstName, lastName }, 'Create user request');

    const user = await adminService.createUser(req.body);

    logger.info({ userId: user.id, email }, 'User created by admin');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  },

  /**
   * PATCH /api/v1/admin/users/:userId
   * Update a user's profile.
   */
  async updateUser(
    req: Request,
    res: Response
  ): Promise<void> {
    const { userId } = (req as Request & { validatedParams: UserIdParam }).validatedParams;
    logger.debug({ userId, updates: req.body }, 'Update user request');

    const user = await adminService.updateUser(userId, req.body);

    logger.info({ userId }, 'User updated by admin');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  },

  /**
   * DELETE /api/v1/admin/users/:userId
   * Delete (deactivate) a user.
   */
  async deleteUser(
    req: Request,
    res: Response
  ): Promise<void> {
    const { userId } = (req as Request & { validatedParams: UserIdParam }).validatedParams;
    const hardDelete = req.query.hard === 'true';
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    logger.debug({ userId, adminUserId, hardDelete }, 'Delete user request');

    await adminService.deleteUser(userId, adminUserId, hardDelete);

    logger.info({ userId, hardDelete }, 'User deleted by admin');

    res.status(200).json({
      success: true,
      message: hardDelete ? 'User permanently deleted' : 'User deactivated',
    });
  },

  // ================== Questionnaire Admin Endpoints ==================

  /**
   * GET /api/v1/admin/questionnaires/stats
   * Get questionnaire statistics.
   */
  async getQuestionnaireStats(_req: Request, res: Response): Promise<void> {
    logger.debug('Get questionnaire stats request');

    const stats = await questionnaireService.getQuestionnaireStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  },

  /**
   * GET /api/v1/admin/questionnaires/outdated
   * Get list of users with outdated questionnaires.
   */
  async getOutdatedQuestionnaires(_req: Request, res: Response): Promise<void> {
    logger.debug('Get outdated questionnaires request');

    const outdated = await questionnaireService.getUsersWithOutdatedQuestionnaires();

    res.status(200).json({
      success: true,
      data: {
        count: outdated.length,
        questionnaires: outdated,
      },
    });
  },

  /**
   * POST /api/v1/admin/questionnaire/notify-outdated
   * Notify all users with outdated questionnaires.
   */
  async notifyOutdatedQuestionnaires(_req: Request, res: Response): Promise<void> {
    logger.debug('Notify outdated questionnaires request');

    // First mark all outdated questionnaires
    const markedCount = await questionnaireService.markOutdatedQuestionnaires();

    // Get users with outdated questionnaires
    const outdated = await questionnaireService.getUsersWithOutdatedQuestionnaires();

    // Send notifications to each user
    let notifiedCount = 0;
    for (const q of outdated) {
      try {
        await notificationsService.notifyQuestionnaireUpdated(q.userId);
        notifiedCount++;
      } catch (error) {
        logger.error({ error, userId: q.userId }, 'Failed to notify user about outdated questionnaire');
      }
    }

    logger.info({ markedCount, notifiedCount }, 'Outdated questionnaires notification completed');

    res.status(200).json({
      success: true,
      message: 'Notifications sent to users with outdated questionnaires',
      data: {
        markedCount,
        notifiedCount,
      },
    });
  },

  // ================== Notification Admin Endpoints ==================

  /**
   * POST /api/v1/admin/notifications/batch
   * Send notifications to multiple users.
   */
  async sendBatchNotification(
    req: Request<object, object, BatchNotificationInput>,
    res: Response
  ): Promise<void> {
    const { userIds, type, title, message } = req.body;
    logger.debug({ userIds: userIds.length, type }, 'Batch notification request');

    let sentCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        await notificationsService.createNotification({
          userId,
          type,
          title,
          message,
        });
        sentCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ userId, error: errorMessage });
        logger.error({ error, userId }, 'Failed to send notification');
      }
    }

    logger.info({ sentCount, errorCount: errors.length }, 'Batch notification completed');

    res.status(200).json({
      success: true,
      message: `Notifications sent: ${sentCount}/${userIds.length}`,
      data: {
        sentCount,
        totalCount: userIds.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  },

  /**
   * POST /api/v1/admin/users/:userId/restore
   * Restore a deactivated user.
   */
  async restoreUser(
    req: Request,
    res: Response
  ): Promise<void> {
    const { userId } = (req as Request & { validatedParams: UserIdParam }).validatedParams;
    const adminUserId = req.user?.id;

    if (!adminUserId) {
      throw new UnauthorizedError('Admin user ID not found');
    }

    logger.debug({ userId, adminUserId }, 'Restore user request');

    await adminService.restoreUser(userId, adminUserId);

    logger.info({ userId }, 'User restored by admin');

    res.status(200).json({
      success: true,
      message: 'User restored successfully',
    });
  },

  /**
   * GET /api/v1/admin/users/:userId/payments
   * Get user's payment status.
   */
  async getUserPaymentStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    const { userId } = (req as Request & { validatedParams: UserIdParam }).validatedParams;
    logger.debug({ userId }, 'Get user payment status request');

    const paymentStatus = await adminService.getUserPaymentStatus(userId);

    res.status(200).json({
      success: true,
      data: paymentStatus,
    });
  },
};
