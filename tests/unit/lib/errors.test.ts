import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  BadRequestError,
  ServiceUnavailableError,
} from '../../../src/lib/errors.js';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 418, 'TEAPOT', false);

      expect(error.statusCode).toBe(418);
      expect(error.code).toBe('TEAPOT');
      expect(error.isOperational).toBe(false);
    });

    it('should maintain proper stack trace', () => {
      const error = new AppError('Stack test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Stack test');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with default values', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.errors).toEqual({});
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create validation error with field errors', () => {
      const fieldErrors = {
        email: ['Invalid email format'],
        password: ['Password too short', 'Password must contain a number'],
      };
      const error = new ValidationError('Validation failed', fieldErrors);

      expect(error.errors).toEqual(fieldErrors);
      expect(error.errors.email).toContain('Invalid email format');
      expect(error.errors.password).toHaveLength(2);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with default resource', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should create not found error with custom resource', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it('should create forbidden error with custom message', () => {
      const error = new ForbiddenError('Admin access required');

      expect(error.message).toBe('Admin access required');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should create conflict error with custom message', () => {
      const error = new ConflictError('Email already registered');

      expect(error.message).toBe('Email already registered');
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with default values', () => {
      const error = new RateLimitError();

      expect(error.message).toBe('Too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.retryAfter).toBeUndefined();
      expect(error).toBeInstanceOf(RateLimitError);
    });

    it('should create rate limit error with retry after', () => {
      const error = new RateLimitError('Slow down', 60);

      expect(error.message).toBe('Slow down');
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('BadRequestError', () => {
    it('should create bad request error with default message', () => {
      const error = new BadRequestError();

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error).toBeInstanceOf(BadRequestError);
    });

    it('should create bad request error with custom message', () => {
      const error = new BadRequestError('Invalid JSON');

      expect(error.message).toBe('Invalid JSON');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create service unavailable error with default message', () => {
      const error = new ServiceUnavailableError();

      expect(error.message).toBe('Service temporarily unavailable');
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error).toBeInstanceOf(ServiceUnavailableError);
    });

    it('should create service unavailable error with custom message', () => {
      const error = new ServiceUnavailableError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
    });
  });

  describe('Error inheritance', () => {
    it('should allow catching all custom errors as AppError', () => {
      const errors = [
        new ValidationError('test'),
        new NotFoundError(),
        new UnauthorizedError(),
        new ForbiddenError(),
        new ConflictError(),
        new RateLimitError(),
        new BadRequestError(),
        new ServiceUnavailableError(),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(AppError);
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
});
