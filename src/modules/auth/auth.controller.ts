import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from './auth.schema.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { createModuleLogger } from '../../config/logger.js';
import { getSessionLogger } from '../../middleware/session-logger.js';

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
    const sessionLog = getSessionLogger(req);
    const { email, firstName, lastName } = req.body;

    sessionLog.info('AuthController', 'REGISTER - Request received', {
      email: email.substring(0, 3) + '***',
      firstName,
      lastName,
    });

    const result = await authService.register(req.body);

    sessionLog.info('AuthController', 'REGISTER - User created', {
      userId: result.user.id,
      onboardingStatus: result.user.onboardingStatus,
      hasTokens: !!result.tokens.accessToken,
    });

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
    const sessionLog = getSessionLogger(req);
    const { email } = req.body;

    sessionLog.info('AuthController', 'LOGIN - Request received', {
      email: email.substring(0, 3) + '***',
    });

    const result = await authService.login(req.body);

    sessionLog.info('AuthController', 'LOGIN - Success', {
      userId: result.user.id,
      onboardingStatus: result.user.onboardingStatus,
      hasAccessToken: !!result.tokens.accessToken,
      expiresIn: result.tokens.expiresIn,
    });

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
    const sessionLog = getSessionLogger(req);
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    sessionLog.info('AuthController', 'GET ME - Request received', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    });

    if (!token) {
      sessionLog.warn('AuthController', 'GET ME - No token provided');
      throw new UnauthorizedError('No token provided');
    }

    const user = await authService.getUser(token);

    sessionLog.info('AuthController', 'GET ME - Success', {
      userId: user.id,
      onboardingStatus: user.onboardingStatus,
      emailVerified: user.emailVerified,
    });

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
