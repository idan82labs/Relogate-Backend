import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from './auth.schema.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { createModuleLogger } from '../../config/logger.js';

const logger = createModuleLogger('auth-controller');

/**
 * Authentication controller.
 * Handles HTTP request/response for auth endpoints.
 */
export const authController = {
  /**
   * POST /api/v1/auth/register
   * Register a new user account.
   */
  async register(
    req: Request<object, object, RegisterInput>,
    res: Response
  ): Promise<void> {
    const result = await authService.register(req.body);

    // If no tokens, email confirmation is required
    if (!result.tokens.accessToken) {
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: { user: result.user },
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  },

  /**
   * POST /api/v1/auth/login
   * Authenticate user and return tokens.
   */
  async login(
    req: Request<object, object, LoginInput>,
    res: Response
  ): Promise<void> {
    const result = await authService.login(req.body);

    // TODO: Set refresh token in httpOnly cookie for better security
    // res.cookie('refreshToken', result.tokens.refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // });

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * POST /api/v1/auth/logout
   * Invalidate user session.
   */
  async logout(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      await authService.logout(token);
    }

    // TODO: Clear refresh token cookie
    // res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  },

  /**
   * POST /api/v1/auth/refresh
   * Get new access token using refresh token.
   */
  async refresh(
    req: Request<object, object, RefreshTokenInput>,
    res: Response
  ): Promise<void> {
    // TODO: Also check for refresh token in cookie
    // const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    const result = await authService.refreshToken(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user.
   * Requires authentication middleware.
   */
  async me(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const user = await authService.getUser(token);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },

  /**
   * POST /api/v1/auth/forgot-password
   * Send password reset email.
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    // TODO: Implement password reset
    logger.info({ email: req.body.email }, 'Password reset requested');

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  },

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token.
   */
  async resetPassword(_req: Request, res: Response): Promise<void> {
    // TODO: Implement password reset
    logger.info('Password reset attempted');

    res.status(501).json({
      success: false,
      error: 'Password reset not implemented yet',
      code: 'NOT_IMPLEMENTED',
    });
  },
};
