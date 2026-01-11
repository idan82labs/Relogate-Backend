import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, RateLimitError } from '../lib/errors.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

/**
 * Global error handler middleware.
 * Catches all errors and returns appropriate JSON responses.
 *
 * Must be registered LAST in the middleware chain.
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors (shouldn't reach here if using validateRequest)
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of err.issues) {
      const path = issue.path.join('.') || '_root';
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: fieldErrors,
    });
    return;
  }

  // Handle ValidationError
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      details: err.errors,
    });
    return;
  }

  // Handle RateLimitError
  if (err instanceof RateLimitError) {
    if (err.retryAfter) {
      res.setHeader('Retry-After', err.retryAfter);
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      retryAfter: err.retryAfter,
    });
    return;
  }

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    logger.warn(
      {
        err: err.message,
        code: err.code,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
      },
      'Operational error'
    );

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Log unexpected errors with full stack trace
  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    },
    'Unexpected error'
  );

  // Don't leak error details in production
  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  const response: Record<string, unknown> = {
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
};

/**
 * 404 Not Found handler.
 * Catches requests to undefined routes.
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
}
