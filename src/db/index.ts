import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import { createModuleLogger } from '../config/logger.js';

const logger = createModuleLogger('database');

/**
 * PostgreSQL connection using postgres.js
 *
 * Configuration notes:
 * - max: Connection pool size (adjust based on your plan)
 * - idle_timeout: Close idle connections after 20 seconds
 * - prepare: Disabled for Supabase transaction pooler compatibility
 */
const connectionString = env.DATABASE_URL;

// Create postgres.js client
const client = postgres(connectionString, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  prepare: false, // Required for Supabase transaction pooler
  onnotice: () => {}, // Suppress NOTICE messages
});

/**
 * Drizzle ORM instance
 *
 * Usage:
 * ```ts
 * import { db } from '@/db';
 * import { users } from '@/db/schema';
 *
 * const allUsers = await db.select().from(users);
 * ```
 */
export const db = drizzle(client);

/**
 * Verify database connection on startup.
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to verify connection
    await client`SELECT 1 as connected`;
    logger.info('Database connection verified');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    return false;
  }
}

/**
 * Gracefully close database connections.
 * Call this on server shutdown.
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await client.end();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error({ err: error }, 'Error closing database connections');
  }
}

// Export the raw postgres client for advanced use cases
export { client as sql };

// Re-export schema for convenience
export * from './schema/index.js';
