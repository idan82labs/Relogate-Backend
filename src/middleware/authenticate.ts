import type { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service.js';
import { UnauthorizedError } from '../lib/errors.js';
import { createModuleLogger } from '../config/logger.js';
import type { PublicUser } from '../modules/auth/auth.types.js';

const logger = createModuleLogger('auth-middleware');

/**
 * Extend Express Request to include authenticated user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
      accessToken?: string;
    }
  }
}

/**
 * Authentication middleware.
 * Verifies JWT token and attaches user to request.
 *
 * Usage:
 * ```ts
 * router.get('/protected', authenticate, (req, res) => {
 *   const user = req.user; // Guaranteed to exist
 * });
 * ```
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.slice(7); // Remove 'Bearer '

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token and get user
    const user = await authService.verifyToken(token);

    if (!user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Attach user and token to request
    req.user = user;
    req.accessToken = token;

    logger.debug({ userId: user.id }, 'User authenticated');

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware.
 * Attaches user to request if valid token provided, but doesn't fail if not.
 *
 * Usage:
 * ```ts
 * router.get('/public', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // User is logged in
 *   } else {
 *     // Anonymous request
 *   }
 * });
 * ```
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);

    if (!token) {
      return next();
    }

    const user = await authService.verifyToken(token);

    if (user) {
      req.user = user;
      req.accessToken = token;
    }

    next();
  } catch {
    // Silently continue without user
    next();
  }
}

// TODO: Add role-based authorization middleware
// export function authorize(...roles: string[]) {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       throw new UnauthorizedError();
//     }
//     if (!roles.includes(req.user.role)) {
//       throw new ForbiddenError();
//     }
//     next();
//   };
// }

// TODO: Add rate limiting for auth endpoints
// TODO: Add IP-based blocking for failed attempts
