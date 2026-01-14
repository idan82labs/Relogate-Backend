/**
 * Mock database client for unit tests
 */
import { vi } from 'vitest';

export const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  // Chain terminator - returns mock data
  then: vi.fn(),
  execute: vi.fn(),
};

// Helper to set up mock return values
export const mockDbReturn = (data: unknown) => {
  mockDb.then.mockImplementation((resolve: (data: unknown) => void) => resolve(data));
  return mockDb;
};

// Helper to set up mock for single result queries
export const mockDbSingleReturn = (data: unknown) => {
  const result = Array.isArray(data) ? data : [data];
  mockDb.then.mockImplementation((resolve: (data: unknown) => void) => resolve(result));
  return mockDb;
};

// Reset all mocks
export const resetDbMocks = () => {
  Object.values(mockDb).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
      mock.mockReturnThis();
    }
  });
};
