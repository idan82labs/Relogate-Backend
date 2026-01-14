import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import { createModuleLogger } from '../../config/logger.js';
import type { ListUsersQuery, CreateUserInput, UserIdParam } from './admin.schema.js';

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
};
