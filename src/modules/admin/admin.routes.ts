import { Router } from 'express';
import type { ZodSchema } from 'zod';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateRequest, validateQuery, validateParams } from '../../middleware/validate-request.js';
import {
  listUsersQuerySchema,
  userIdParamSchema,
  createUserSchema,
  updateUserSchema,
  type ListUsersQuery,
} from './admin.schema.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users with pagination and filtering
 * @access  Admin only
 */
router.get(
  '/users',
  validateQuery(listUsersQuerySchema as ZodSchema<ListUsersQuery>),
  adminController.listUsers
);

/**
 * @route   GET /api/v1/admin/users/:userId
 * @desc    Get a user by ID with their questionnaires
 * @access  Admin only
 */
router.get(
  '/users/:userId',
  validateParams(userIdParamSchema),
  adminController.getUserById
);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create a new user
 * @access  Admin only
 */
router.post(
  '/users',
  validateRequest(createUserSchema),
  adminController.createUser
);

/**
 * @route   PATCH /api/v1/admin/users/:userId
 * @desc    Update a user's profile
 * @access  Admin only
 */
router.patch(
  '/users/:userId',
  validateParams(userIdParamSchema),
  validateRequest(updateUserSchema),
  adminController.updateUser
);

/**
 * @route   DELETE /api/v1/admin/users/:userId
 * @desc    Delete (deactivate) a user. Use ?hard=true for permanent deletion.
 * @access  Admin only
 */
router.delete(
  '/users/:userId',
  validateParams(userIdParamSchema),
  adminController.deleteUser
);

export const adminRouter = router;
