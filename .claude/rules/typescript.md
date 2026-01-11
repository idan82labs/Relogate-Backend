# TypeScript Rules

## Strict Mode
- Project uses `strict: true` in tsconfig.json
- No implicit `any` - always provide explicit types
- No unused variables or parameters
- No implicit returns

## Type Definitions
- Define interfaces for all data structures
- Use `type` for unions and simple types
- Use `interface` for objects that may be extended
- Export types from `*.types.ts` files in each module

## Zod Integration
- Define Zod schemas first, then infer TypeScript types:
  ```typescript
  const userSchema = z.object({ name: z.string() });
  type User = z.infer<typeof userSchema>;
  ```

## Avoid
- `any` type - use `unknown` if type is truly unknown
- Type assertions (`as`) unless absolutely necessary
- Non-null assertions (`!`) - handle null cases explicitly

## Express Types
- Use proper Request/Response types from express
- Extend Express types in `src/types/express.d.ts` if needed
- Type request body, params, query with generics
