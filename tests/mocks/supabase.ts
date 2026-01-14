/**
 * Mock Supabase client for unit tests
 */
import { vi } from 'vitest';
import { createMockAuthUser, createMockSession } from '../fixtures/users.js';

// Mock Supabase Auth Admin methods
export const mockSupabaseAuthAdmin = {
  createUser: vi.fn().mockResolvedValue({
    data: { user: createMockAuthUser() },
    error: null,
  }),
  deleteUser: vi.fn().mockResolvedValue({
    data: null,
    error: null,
  }),
  getUserById: vi.fn().mockResolvedValue({
    data: { user: createMockAuthUser() },
    error: null,
  }),
  listUsers: vi.fn().mockResolvedValue({
    data: { users: [createMockAuthUser()] },
    error: null,
  }),
  updateUserById: vi.fn().mockResolvedValue({
    data: { user: createMockAuthUser() },
    error: null,
  }),
};

// Mock Supabase Auth methods
export const mockSupabaseAuth = {
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { session: createMockSession(), user: createMockAuthUser() },
    error: null,
  }),
  signUp: vi.fn().mockResolvedValue({
    data: { session: createMockSession(), user: createMockAuthUser() },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  refreshSession: vi.fn().mockResolvedValue({
    data: { session: createMockSession(), user: createMockAuthUser() },
    error: null,
  }),
  getUser: vi.fn().mockResolvedValue({
    data: { user: createMockAuthUser() },
    error: null,
  }),
  admin: mockSupabaseAuthAdmin,
};

// Mock Supabase client
export const mockSupabase = {
  auth: mockSupabaseAuth,
};

// Mock Supabase Admin client
export const mockSupabaseAdmin = {
  auth: {
    admin: mockSupabaseAuthAdmin,
  },
};

// Helper to mock auth error
export const mockAuthError = (code: string, message: string) => ({
  data: { user: null, session: null },
  error: { code, message, status: 400 },
});

// Helper to mock successful auth
export const mockAuthSuccess = (overrides = {}) => ({
  data: {
    user: createMockAuthUser(overrides),
    session: createMockSession(overrides),
  },
  error: null,
});

// Reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseAuth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  Object.values(mockSupabaseAuthAdmin).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
};
