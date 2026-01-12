import { z } from 'zod';

/**
 * Password validation rules.
 * Following OWASP recommendations:
 * - Minimum 8 characters
 * - Maximum 128 characters (prevent DoS via hash computation)
 * - No composition rules (allow any characters)
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters');

/**
 * Email validation schema.
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must not exceed 255 characters')
  .transform((email) => email.toLowerCase().trim());

/**
 * Registration request schema.
 */
export const registerSchema = z.object({
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
});

/**
 * Login request schema.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token request schema.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Forgot password request schema.
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password request schema.
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

/**
 * Change password request schema (for authenticated users).
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Infer TypeScript types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// TODO: Add password strength validation (check against common passwords)
// TODO: Add CAPTCHA validation schema for registration
// TODO: Add phone number validation for 2FA
