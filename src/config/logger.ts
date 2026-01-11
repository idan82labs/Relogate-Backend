import pino from 'pino';
import { env } from './env.js';

/**
 * Pino logger configuration.
 * - Uses pino-pretty in development for readable output
 * - Uses JSON format in production for log aggregation
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  // Security: Redact sensitive fields from logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'email', // Consider if you want to log emails
    ],
    censor: '[REDACTED]',
  },
  base: {
    // Remove pid for cleaner logs, keep service name
    service: 'relogate-api',
  },
});

/**
 * Create a child logger for a specific module.
 * Adds module name to all log entries for easier filtering.
 *
 * @example
 * const log = createModuleLogger('auth');
 * log.info('User logged in');
 * // Output: {"level":"info","module":"auth","msg":"User logged in"}
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}

// Export types
export type Logger = typeof logger;
