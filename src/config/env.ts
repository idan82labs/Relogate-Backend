import { z } from 'zod';
import { config } from 'dotenv';

// Load .env file
config();

/**
 * Environment configuration schema with validation.
 * Fails fast at startup if required variables are missing.
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, 'PORT must be between 1 and 65535'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // Supabase Auth (for authentication)
  SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z
    .string()
    .min(50, 'SUPABASE_ANON_KEY appears to be invalid (too short)'),
  SUPABASE_SERVICE_KEY: z
    .string()
    .min(50, 'SUPABASE_SERVICE_KEY appears to be invalid (too short)'),

  // Database (for Drizzle ORM)
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a valid PostgreSQL connection string'
    ),

  // CORS
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000'),

  // TODO: Production security configuration
  // Uncomment and configure for production

  // HTTPS/TLS
  // SSL_CERT_PATH: z.string().optional(),
  // SSL_KEY_PATH: z.string().optional(),

  // Rate Limiting (Redis)
  // REDIS_URL: z.string().url().optional(),

  // Session Configuration
  // SESSION_SECRET: z.string().min(32).optional(),
  // SESSION_MAX_AGE: z.string().transform(Number).optional(),
});

/**
 * Validate and parse environment variables.
 * This will throw an error at startup if validation fails.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

// Type export for use throughout the application
export type Env = z.infer<typeof envSchema>;
