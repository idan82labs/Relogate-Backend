import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

/**
 * Drizzle Kit Configuration
 *
 * Commands:
 * - npm run db:generate  - Generate migrations from schema changes
 * - npm run db:migrate   - Apply migrations to database
 * - npm run db:push      - Push schema directly (dev only)
 * - npm run db:studio    - Open Drizzle Studio GUI
 */
export default defineConfig({
  // Schema location
  schema: './src/db/schema/index.ts',

  // Output directory for migrations
  out: './drizzle',

  // Database dialect
  dialect: 'postgresql',

  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },

  // Verbose logging
  verbose: true,

  // Strict mode - fail on warnings
  strict: true,
});
