/**
 * Test fixtures for user-related data
 */

export const validRegistrationData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
};

export const validLoginData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
};

export const invalidEmailData = {
  email: 'invalid-email',
  password: 'SecurePass123!',
};

export const weakPasswordData = {
  email: 'test@example.com',
  password: '123', // Too short
};

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'uuid-test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  idNumber: null,
  citizenship: null,
  birthDate: null,
  onboardingStatus: 'pending',
  emailVerified: false,
  preferredLanguage: 'he',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockAuthUser = (overrides: Partial<MockAuthUser> = {}): MockAuthUser => ({
  id: 'uuid-test-user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {
    firstName: 'Test',
    lastName: 'User',
  },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockSession = (overrides: Partial<MockSession> = {}): MockSession => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: createMockAuthUser(),
  ...overrides,
});

// Type definitions for mocks
interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  idNumber: string | null;
  citizenship: string | null;
  birthDate: Date | null;
  onboardingStatus: 'pending' | 'in_progress' | 'completed';
  emailVerified: boolean;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockAuthUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: MockAuthUser;
}
