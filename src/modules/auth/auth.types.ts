import type { User, Session } from '@supabase/supabase-js';

/**
 * User profile data stored in Supabase user metadata.
 */
export interface UserMetadata {
  firstName: string;
  lastName: string;
}

/**
 * Public user data returned to clients.
 * Excludes sensitive information.
 */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  createdAt: string;
}

/**
 * Authentication tokens returned on login/register.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

/**
 * Complete auth response with user and tokens.
 */
export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}

/**
 * Supabase user with our custom metadata.
 */
export type SupabaseUser = User & {
  user_metadata: UserMetadata;
};

/**
 * Supabase session with typed user.
 */
export type SupabaseSession = Omit<Session, 'user'> & {
  user: SupabaseUser;
};

/**
 * Helper to convert Supabase user to public user.
 */
export function toPublicUser(user: SupabaseUser): PublicUser {
  return {
    id: user.id,
    email: user.email ?? '',
    firstName: user.user_metadata?.firstName ?? '',
    lastName: user.user_metadata?.lastName ?? '',
    emailVerified: user.email_confirmed_at != null,
    createdAt: user.created_at,
  };
}

/**
 * Helper to extract tokens from Supabase session.
 */
export function toAuthTokens(session: Session): AuthTokens {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in ?? 3600,
    expiresAt: session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
  };
}

// TODO: Add types for OAuth providers
// TODO: Add types for MFA/2FA
