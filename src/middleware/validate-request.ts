import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../lib/errors.js';

/**
 * Request validation middleware factory.
 * Validates request body against a Zod schema.
 *
 * Usage:
 * ```ts
 * router.post('/register', validateRequest(registerSchema), authController.register);
 * ```
 *
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Parse and validate request body
      const validated = await schema.parseAsync(req.body);

      // Replace body with validated/transformed data
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors to our format
        const fieldErrors: Record<string, string[]> = {};

        for (const issue of error.issues) {
          const path = issue.path.join('.') || '_root';
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(issue.message);
        }

        next(new ValidationError('Validation failed', fieldErrors));
        return;
      }

      next(error);
    }
  };
}

/**
 * Validate query parameters against a Zod schema.
 *
 * Usage:
 * ```ts
 * router.get('/users', validateQuery(listUsersSchema), userController.list);
 * ```
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};

        for (const issue of error.issues) {
          const path = issue.path.join('.') || '_root';
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(issue.message);
        }

        next(new ValidationError('Invalid query parameters', fieldErrors));
        return;
      }

      next(error);
    }
  };
}

/**
 * Validate URL parameters against a Zod schema.
 *
 * Usage:
 * ```ts
 * router.get('/users/:id', validateParams(userIdSchema), userController.get);
 * ```
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};

        for (const issue of error.issues) {
          const path = issue.path.join('.') || '_root';
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(issue.message);
        }

        next(new ValidationError('Invalid URL parameters', fieldErrors));
        return;
      }

      next(error);
    }
  };
}
