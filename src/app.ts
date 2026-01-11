import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

/**
 * Create and configure Express application.
 */
export function createApp(): Application {
  const app = express();

  // ===========================================
  // Security Middleware
  // ===========================================

  // Helmet: Set security HTTP headers
  app.use(
    helmet({
      // TODO: Configure CSP for production
      contentSecurityPolicy: false,
    })
  );

  // CORS: Allow frontend origin
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // TODO: Add rate limiting
  // app.use(rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100, // limit each IP to 100 requests per windowMs
  //   standardHeaders: true,
  //   legacyHeaders: false,
  // }));

  // TODO: Add HTTPS redirect in production
  // if (env.NODE_ENV === 'production') {
  //   app.use((req, res, next) => {
  //     if (req.headers['x-forwarded-proto'] !== 'https') {
  //       return res.redirect(`https://${req.headers.host}${req.url}`);
  //     }
  //     next();
  //   });
  // }

  // ===========================================
  // Request Parsing
  // ===========================================

  // Parse JSON bodies
  app.use(express.json({ limit: '10mb' }));

  // Parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ===========================================
  // Logging
  // ===========================================

  // HTTP request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Skip health check logging
    if (req.url === '/api/v1/health') {
      return next();
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      logger[logLevel](
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        },
        `${req.method} ${req.url} ${res.statusCode}`
      );
    });

    next();
  });

  // ===========================================
  // API Routes
  // ===========================================

  // Mount API routes
  app.use('/api/v1', apiRouter);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Relogate API',
      version: '1.0.0',
      docs: '/api/v1/health',
    });
  });

  // ===========================================
  // Error Handling
  // ===========================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
