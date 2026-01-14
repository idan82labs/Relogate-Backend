import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { createModuleLogger } from '../config/logger.js';
import type { UserRole } from '../modules/auth/auth.types.js';

const logger = createModuleLogger('authorize-middleware');

/**
 * Authorization middleware factory.
 * Creates middleware that checks if user has one of the allowed roles.
 *
 * Usage:
 * ```ts
 * router.get('/admin-only', authenticate, authorize('admin'), controller.method);
 * router.get('/staff', authenticate, authorize('admin', 'moderator'), controller.method);
 * ```
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // User must be authenticated first
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role;

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(userRole)) {
        logger.warn(
          { userId: req.user.id, userRole, requiredRoles: allowedRoles },
          'Authorization denied - insufficient permissions'
        );
        throw new ForbiddenError('Insufficient permissions');
      }

      logger.debug(
        { userId: req.user.id, role: userRole },
        'Authorization granted'
      );

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Admin-only authorization middleware.
 * Convenience wrapper for authorize('admin').
 *
 * Usage:
 * ```ts
 * router.get('/admin', authenticate, requireAdmin, controller.method);
 * ```
 */
export const requireAdmin = authorize('admin');
