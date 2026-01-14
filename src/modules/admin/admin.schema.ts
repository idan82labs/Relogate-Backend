import { z } from 'zod';

/**
 * Password validation (same as auth).
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

/**
 * Email validation (same as auth).
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must not exceed 255 characters')
  .transform((email) => email.toLowerCase().trim());

/**
 * Role validation.
 */
const roleSchema = z.enum(['user', 'admin']);

/**
 * List users query params schema.
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role: roleSchema.optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * User ID param schema.
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

/**
 * Create user schema (admin).
 */
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .trim(),
  idNumber: z
    .string()
    .max(20, 'ID number must not exceed 20 characters')
    .optional(),
  phone: z
    .string()
    .max(20, 'Phone number must not exceed 20 characters')
    .optional(),
  birthDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date format')
    .optional(),
  role: roleSchema.default('user'),
});

/**
 * Update user schema (admin).
 */
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  lastName: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  idNumber: z
    .string()
    .max(20)
    .nullable()
    .optional(),
  phone: z
    .string()
    .max(20)
    .nullable()
    .optional(),
  citizenship: z
    .string()
    .max(100)
    .nullable()
    .optional(),
  birthDate: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date format')
    .nullable()
    .optional(),
  preferredLanguage: z
    .string()
    .max(10)
    .optional(),
  isActive: z.boolean().optional(),
  role: roleSchema.optional(),
});

// Infer TypeScript types from schemas
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
