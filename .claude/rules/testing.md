# Testing Rules

## Framework
- Use Vitest for all tests
- Config in `vitest.config.ts`

## File Organization
```
tests/
├── unit/           # Unit tests (isolated, mocked deps)
├── integration/    # Integration tests (real DB)
└── setup.ts        # Global test setup
```

## Naming
- Test files: `*.test.ts`
- Describe blocks: Feature or function name
- It blocks: "should [expected behavior]"

## Unit Tests
- Test one unit in isolation
- Mock all dependencies (Supabase, services)
- Fast execution (no I/O)
- Cover edge cases and error paths

## Integration Tests
- Test API endpoints end-to-end
- Use test database or Supabase test project
- Clean up test data after each test
- Use `supertest` for HTTP testing

## Test Structure
```typescript
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUser = { id: '1', name: 'Test' };

      // Act
      const result = await service.getUser('1');

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      await expect(service.getUser('999'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
```

## Mocking
- Mock Supabase client in unit tests
- Use `vi.mock()` for module mocking
- Reset mocks between tests: `vi.clearAllMocks()`

## Coverage
- Aim for 80%+ coverage on business logic
- Focus on service layer coverage
- Don't test framework code (Express, Supabase)
