import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { verifySupabaseConnection } from './lib/supabase.js';
import { verifyDatabaseConnection, closeDatabaseConnection } from './db/index.js';

/**
 * Start the server.
 */
async function main(): Promise<void> {
  logger.info({ nodeEnv: env.NODE_ENV }, 'Starting Relogate API server');

  // Verify Supabase Auth connection
  const supabaseOk = await verifySupabaseConnection();
  if (!supabaseOk) {
    logger.warn('Supabase Auth connection could not be verified. Server will start anyway.');
  }

  // Verify Database connection (Drizzle)
  const dbOk = await verifyDatabaseConnection();
  if (!dbOk) {
    logger.warn('Database connection could not be verified. Server will start anyway.');
  }

  // Create Express app
  const app = createApp();

  // Start listening
  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        environment: env.NODE_ENV,
        corsOrigin: env.CORS_ORIGIN,
      },
      `Server listening on port ${env.PORT}`
    );

    // Log available endpoints
    logger.info('Available endpoints:');
    logger.info(`  GET  /                     - API info`);
    logger.info(`  GET  /api/v1/health        - Health check`);
    logger.info(`  POST /api/v1/auth/register - Register new user`);
    logger.info(`  POST /api/v1/auth/login    - Login user`);
    logger.info(`  POST /api/v1/auth/logout   - Logout user`);
    logger.info(`  POST /api/v1/auth/refresh  - Refresh token`);
    logger.info(`  GET  /api/v1/auth/me       - Get current user (protected)`);
  });

  // ===========================================
  // Graceful Shutdown
  // ===========================================

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal');

    server.close(async () => {
      logger.info('HTTP server closed');

      // Close database connections
      await closeDatabaseConnection();

      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ===========================================
  // Uncaught Error Handling
  // ===========================================

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled rejection');
    process.exit(1);
  });
}

// Run the server
main().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
