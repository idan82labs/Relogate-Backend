import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { createModuleLogger } from '../config/logger.js';

const logger = createModuleLogger('supabase');

/**
 * Supabase Admin Client
 *
 * Uses the SERVICE_KEY which bypasses Row Level Security (RLS).
 * Use this ONLY for:
 * - Admin operations
 * - Server-side operations that need full database access
 * - Operations where user context is not needed
 *
 * SECURITY WARNING: Never expose this client or its operations to the frontend.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Supabase Public Client
 *
 * Uses the ANON_KEY which respects Row Level Security (RLS).
 * Use this for operations that should respect user permissions.
 */
export const supabasePublic: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a Supabase client with a user's access token.
 *
 * This is useful for making requests on behalf of a user,
 * respecting their RLS policies.
 *
 * @param accessToken - The user's JWT access token
 * @returns Supabase client configured for the user
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verify Supabase connection on startup.
 * Logs success or failure for debugging.
 */
export async function verifySupabaseConnection(): Promise<boolean> {
  try {
    // Simple health check - get auth settings
    const { error } = await supabaseAdmin.auth.getSession();

    if (error) {
      logger.error({ error: error.message }, 'Supabase connection failed');
      return false;
    }

    logger.info('Supabase connection verified');
    return true;
  } catch (err) {
    logger.error({ err }, 'Supabase connection error');
    return false;
  }
}

// TODO: Add connection pooling configuration for high-traffic scenarios
// TODO: Implement automatic retry logic for transient failures
// TODO: Add metrics/tracing for Supabase operations
