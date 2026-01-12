import type { User, Session } from '@supabase/supabase-js';

/**
 * User profile data stored in Supabase user metadata.
 */
export interface UserMetadata {
  firstName: string;
  lastName: string;
}

/**
 * Onboarding status values.
 */
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';

/**
 * Public user data returned to clients.
 * Excludes sensitive information.
 */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  idNumber?: string;
  phone?: string;
  birthDate?: string;
  emailVerified: boolean;
  onboardingStatus: OnboardingStatus;
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
 * Profile data from database for extending PublicUser.
 */
export interface ProfileData {
  onboardingStatus?: OnboardingStatus;
  idNumber?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
}

/**
 * Helper to convert Supabase user to public user.
 * Note: onboardingStatus defaults to 'pending' - should be overridden
 * when user profile data is available from database.
 */
export function toPublicUser(
  user: SupabaseUser,
  profileData: ProfileData = {}
): PublicUser {
  const { onboardingStatus = 'pending', idNumber, phone, birthDate } = profileData;
  return {
    id: user.id,
    email: user.email ?? '',
    firstName: user.user_metadata?.firstName ?? '',
    lastName: user.user_metadata?.lastName ?? '',
    idNumber: idNumber || undefined,
    phone: phone || undefined,
    birthDate: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
    emailVerified: user.email_confirmed_at != null,
    onboardingStatus,
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
