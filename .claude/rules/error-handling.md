# Error Handling Rules

## Custom Error Classes
Use custom errors from `src/lib/errors.ts`:
```typescript
throw new AppError('Something went wrong', 500);
throw new ValidationError('Invalid input', { field: ['error'] });
throw new NotFoundError('User');
throw new UnauthorizedError();
```

## Error Handler Middleware
- Central handler in `src/middleware/errorHandler.ts`
- Catches all errors from async routes (Express 5)
- Logs errors with appropriate level
- Returns safe error messages in production

## Error Response Format
```typescript
{
  success: false,
  error: "Human-readable message",
  code: "ERROR_CODE",        // Optional
  details: { ... }           // Optional, validation errors
}
```

## Logging Errors
- `logger.error()` for 5xx errors
- `logger.warn()` for 4xx errors
- Include request context (path, method, user)
- Never log full stack traces in production responses

## Async Error Handling
Express 5 catches async errors automatically:
```typescript
// This works - no try/catch needed
router.get('/', async (req, res) => {
  const data = await service.getData(); // Errors auto-caught
  res.json({ success: true, data });
});
```

## Database Errors
- Catch Supabase errors specifically
- Map database errors to appropriate HTTP codes
- Log original error, return safe message

## Validation Errors
- Zod errors caught by validateRequest middleware
- Returns 400 with field-level error details
- Format: `{ details: { fieldName: ["error message"] } }`
