import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../../../src/modules/auth/auth.schema.js';

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.firstName).toBe('John');
      }
    });

    it('should transform email to lowercase and trim', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const data = {
        email: 'test@example.com',
        password: '1234567',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('password'))).toBe(true);
        expect(result.error.issues.some((i) => i.message.includes('8 characters'))).toBe(true);
      }
    });

    it('should reject password longer than 128 characters', () => {
      const data = {
        email: 'test@example.com',
        password: 'a'.repeat(129),
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('password'))).toBe(true);
      }
    });

    it('should require firstName', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: '',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('firstName'))).toBe(true);
      }
    });

    it('should allow optional fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        // Optional fields not provided
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should validate optional idNumber', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        idNumber: '123456789',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.idNumber).toBe('123456789');
      }
    });

    it('should validate optional birthDate', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '1990-01-15',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid birthDate format', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: 'not-a-date',
      };

      const result = registerSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const data = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('password'))).toBe(true);
      }
    });

    it('should transform email to lowercase', () => {
      const data = {
        email: 'TEST@EXAMPLE.COM',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refresh token', () => {
      const data = {
        refreshToken: 'some-valid-token',
      };

      const result = refreshTokenSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty refresh token', () => {
      const data = {
        refreshToken: '',
      };

      const result = refreshTokenSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should reject missing refresh token', () => {
      const data = {};

      const result = refreshTokenSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate valid email', () => {
      const data = {
        email: 'test@example.com',
      };

      const result = forgotPasswordSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid',
      };

      const result = forgotPasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate valid reset data', () => {
      const data = {
        token: 'reset-token-123',
        password: 'NewSecurePass123',
      };

      const result = resetPasswordSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty token', () => {
      const data = {
        token: '',
        password: 'NewSecurePass123',
      };

      const result = resetPasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should validate password meets requirements', () => {
      const data = {
        token: 'reset-token-123',
        password: 'short', // Less than 8 chars
      };

      const result = resetPasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate valid password change', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewSecurePass456',
      };

      const result = changePasswordSchema.safeParse(data);

      expect(result.success).toBe(true);
    });

    it('should reject empty current password', () => {
      const data = {
        currentPassword: '',
        newPassword: 'NewSecurePass456',
      };

      const result = changePasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });

    it('should validate new password meets requirements', () => {
      const data = {
        currentPassword: 'OldPassword123',
        newPassword: 'weak', // Less than 8 chars
      };

      const result = changePasswordSchema.safeParse(data);

      expect(result.success).toBe(false);
    });
  });
});
