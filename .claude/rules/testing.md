# Testing Rules

## Framework
- **Vitest** for all tests (unit + integration)
- **Supertest** for HTTP endpoint testing
- Config in `vitest.config.ts`

## Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npx vitest run tests/unit/auth.service.test.ts

# Run tests matching pattern
npx vitest run -t "should register"
```

## File Organization

```
tests/
├── unit/                    # Unit tests (isolated, mocked deps)
│   ├── services/            # Service layer tests
│   │   ├── auth.service.test.ts
│   │   └── questionnaire.service.test.ts
│   └── lib/                 # Utility tests
│       └── errors.test.ts
├── integration/             # Integration tests (real/mock DB)
│   ├── auth.routes.test.ts
│   └── questionnaire.routes.test.ts
├── fixtures/                # Test data and factories
│   ├── users.ts
│   └── questionnaires.ts
├── mocks/                   # Mock implementations
│   ├── supabase.ts
│   └── db.ts
└── setup.ts                 # Global test setup
```

## Naming Conventions

- Test files: `*.test.ts`
- Describe blocks: Feature, class, or function name
- It blocks: "should [expected behavior] when [condition]"

```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create user when valid data provided', async () => {});
    it('should throw ConflictError when email exists', async () => {});
  });
});
```

## Test Structure (AAA Pattern)

```typescript
it('should return user when found', async () => {
  // Arrange - Set up test data and mocks
  const mockUser = { id: '1', email: 'test@example.com' };
  vi.mocked(db.select).mockResolvedValueOnce([mockUser]);

  // Act - Execute the code under test
  const result = await service.getUser('1');

  // Assert - Verify the outcome
  expect(result).toEqual(mockUser);
  expect(db.select).toHaveBeenCalledOnce();
});
```

## Unit Tests

### Principles
- Test one unit in isolation
- Mock ALL external dependencies (database, Supabase, services)
- Fast execution (no I/O operations)
- Cover happy path, edge cases, and error conditions

### Mocking Patterns

```typescript
// Mock database module
vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Supabase auth
vi.mock('../lib/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  },
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Integration Tests

### Principles
- Test API endpoints end-to-end
- Use test database or mocked Supabase
- Clean up test data after each test
- Test request/response contract

### HTTP Testing with Supertest

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('POST /api/v1/auth/register', () => {
  it('should return 201 with user data', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('user');
  });

  it('should return 400 for invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email',
        password: 'SecurePass123!',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

## Coverage Requirements

- **Service layer**: 80%+ coverage (business logic)
- **Utilities/lib**: 70%+ coverage
- **Routes**: Integration tests cover happy paths
- **Don't test**: Framework code (Express, Drizzle internals)

## AI Agent TDD Workflow

When using Claude Code or other AI agents for test-driven development:

### Step 1: Write Tests First
```
"Write unit tests for the [service/function] covering:
- Happy path with valid input
- Edge cases (empty input, boundary values)
- Error conditions (invalid input, missing data)
Use Vitest syntax. Do NOT create mock implementations."
```

### Step 2: Verify Tests Fail
```
"Run the tests and confirm they fail. Do NOT write implementation yet."
```

### Step 3: Implement to Pass
```
"Implement the [service/function] to make all tests pass.
Do NOT modify the tests."
```

### Step 4: Refactor
```
"Refactor the implementation while keeping tests green.
Run tests after each change."
```

## Test Data Fixtures

Create reusable test data in `tests/fixtures/`:

```typescript
// tests/fixtures/users.ts
export const validUserData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
};

export const createMockUser = (overrides = {}) => ({
  id: 'uuid-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date(),
  ...overrides,
});
```

## Environment Setup

Tests use these environment variables (set in `tests/setup.ts`):

```typescript
// tests/setup.ts
import { vi } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Global cleanup
afterEach(() => {
  vi.clearAllMocks();
});
```

## Common Patterns

### Testing Async Errors

```typescript
it('should throw NotFoundError when user not found', async () => {
  vi.mocked(db.select).mockResolvedValueOnce([]);

  await expect(service.getUser('999'))
    .rejects
    .toThrow(NotFoundError);
});
```

### Testing with Zod Validation

```typescript
it('should validate input with schema', async () => {
  const result = registerSchema.safeParse({
    email: 'invalid',
    password: '123', // Too short
  });

  expect(result.success).toBe(false);
  expect(result.error?.issues).toContainEqual(
    expect.objectContaining({ path: ['email'] })
  );
});
```

## CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Run tests
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v4
```

## DO

- Write tests before implementation (TDD)
- Test behavior, not implementation details
- Use descriptive test names
- Keep tests focused and small
- Mock external dependencies
- Clean up after tests

## DON'T

- Test private methods directly
- Write tests that depend on test order
- Use real database in unit tests
- Ignore flaky tests
- Skip error path testing
- Over-mock (test real logic)
