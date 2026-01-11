import { supabaseAdmin } from '../../lib/supabase.js';
import { createModuleLogger } from '../../config/logger.js';
import {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
  ServiceUnavailableError,
} from '../../lib/errors.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from './auth.schema.js';
import type {
  AuthResponse,
  PublicUser,
  SupabaseUser,
  SupabaseSession,
} from './auth.types.js';
import { toPublicUser, toAuthTokens } from './auth.types.js';

const logger = createModuleLogger('auth-service');

/**
 * Authentication service.
 * Handles all auth operations via Supabase Auth.
 */
export const authService = {
  /**
   * Register a new user.
   *
   * @param input - Registration data (email, password, firstName, lastName)
   * @returns Auth response with user and tokens
   * @throws ConflictError if email already exists
   * @throws ServiceUnavailableError if Supabase is unavailable
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = input;

    logger.debug({ email }, 'Attempting user registration');

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
        },
        // TODO: Configure email confirmation in Supabase dashboard
        // emailRedirectTo: `${process.env.FRONTEND_URL}/auth/confirm`,
      },
    });

    if (error) {
      logger.warn({ email, error: error.message }, 'Registration failed');

      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        throw new ConflictError('Email already registered');
      }
      if (error.message.includes('password')) {
        throw new BadRequestError(error.message);
      }

      throw new ServiceUnavailableError('Authentication service unavailable');
    }

    if (!data.user || !data.session) {
      // This can happen if email confirmation is required
      logger.info({ email }, 'User registered, awaiting email confirmation');

      // If no session, user needs to confirm email
      if (data.user && !data.session) {
        const user = data.user as SupabaseUser;
        return {
          user: toPublicUser(user),
          tokens: {
            accessToken: '',
            refreshToken: '',
            expiresIn: 0,
            expiresAt: 0,
          },
        };
      }

      throw new ServiceUnavailableError('Registration failed');
    }

    logger.info({ userId: data.user.id, email }, 'User registered successfully');

    const user = data.user as SupabaseUser;
    const session = data.session as SupabaseSession;

    return {
      user: toPublicUser(user),
      tokens: toAuthTokens(session),
    };
  },

  /**
   * Login a user with email and password.
   *
   * @param input - Login credentials (email, password)
   * @returns Auth response with user and tokens
   * @throws UnauthorizedError if credentials are invalid
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    logger.debug({ email }, 'Attempting user login');

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn({ email, error: error.message }, 'Login failed');

      // Don't reveal whether email exists or password is wrong
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!data.user || !data.session) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info({ userId: data.user.id, email }, 'User logged in successfully');

    // TODO: Log login event for audit trail
    // TODO: Check for suspicious login patterns (new device, location)

    const user = data.user as SupabaseUser;
    const session = data.session as SupabaseSession;

    return {
      user: toPublicUser(user),
      tokens: toAuthTokens(session),
    };
  },

  /**
   * Logout a user by invalidating their session.
   *
   * @param accessToken - The user's current access token
   */
  async logout(accessToken: string): Promise<void> {
    logger.debug('Attempting user logout');

    // Create a client with the user's token to sign them out
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);

    if (error) {
      logger.warn({ error: error.message }, 'Logout failed');
      // Don't throw - user may already be logged out
    }

    logger.info('User logged out successfully');

    // TODO: Invalidate any cached sessions
    // TODO: Log logout event for audit trail
  },

  /**
   * Refresh access token using refresh token.
   *
   * @param input - Refresh token data
   * @returns New auth tokens
   * @throws UnauthorizedError if refresh token is invalid/expired
   */
  async refreshToken(input: RefreshTokenInput): Promise<AuthResponse> {
    const { refreshToken } = input;

    logger.debug('Attempting token refresh');

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      logger.warn({ error: error.message }, 'Token refresh failed');
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (!data.user || !data.session) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    logger.debug({ userId: data.user.id }, 'Token refreshed successfully');

    const user = data.user as SupabaseUser;
    const session = data.session as SupabaseSession;

    return {
      user: toPublicUser(user),
      tokens: toAuthTokens(session),
    };
  },

  /**
   * Get user by access token.
   *
   * @param accessToken - The user's JWT access token
   * @returns Public user data
   * @throws UnauthorizedError if token is invalid
   */
  async getUser(accessToken: string): Promise<PublicUser> {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    const user = data.user as SupabaseUser;
    return toPublicUser(user);
  },

  /**
   * Verify if an access token is valid.
   *
   * @param accessToken - The JWT to verify
   * @returns The user if valid, null otherwise
   */
  async verifyToken(accessToken: string): Promise<PublicUser | null> {
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

      if (error || !data.user) {
        return null;
      }

      const user = data.user as SupabaseUser;
      return toPublicUser(user);
    } catch {
      return null;
    }
  },

  // TODO: Implement password reset flow
  // async forgotPassword(email: string): Promise<void> {}
  // async resetPassword(token: string, newPassword: string): Promise<void> {}

  // TODO: Implement email verification
  // async verifyEmail(token: string): Promise<void> {}
  // async resendVerificationEmail(email: string): Promise<void> {}

  // TODO: Implement OAuth providers
  // async loginWithOAuth(provider: 'google' | 'github'): Promise<string> {}
  // async handleOAuthCallback(code: string): Promise<AuthResponse> {}
};
