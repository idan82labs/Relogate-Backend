# Relogate Backend

## Project Overview

Node.js + Express + TypeScript backend for the Relogate relocation assistance platform.
Provides REST API for the Next.js frontend.

## Tech Stack

- **Runtime**: Node.js 22+ (LTS)
- **Framework**: Express 5
- **Language**: TypeScript 5 (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Vitest

## Project Structure

```
src/
├── config/         # Configuration (env, logger, database)
├── modules/        # Feature modules (questionnaire, auth, user)
│   └── [module]/
│       ├── *.controller.ts
│       ├── *.service.ts
│       ├── *.routes.ts
│       ├── *.schema.ts    # Zod schemas
│       └── *.types.ts
├── middleware/     # Express middleware
├── lib/            # Shared utilities and clients
├── types/          # Global TypeScript types
├── routes/         # Route aggregator
├── app.ts          # Express app setup
└── server.ts       # Entry point
```

## Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript to dist/
npm run start        # Run production build
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run typecheck    # Run TypeScript type checking
```

## Code Conventions

### File Naming
- Use kebab-case for files: `user-profile.service.ts`
- Use PascalCase for classes: `UserProfileService`
- Use camelCase for functions/variables: `getUserProfile`

### Module Pattern
Each feature module contains:
1. `*.routes.ts` - Route definitions with Zod validation middleware
2. `*.controller.ts` - Request handling, calls services
3. `*.service.ts` - Business logic, database calls
4. `*.schema.ts` - Zod schemas for validation
5. `*.types.ts` - TypeScript interfaces/types

### Error Handling
- Use custom `AppError` class from `src/lib/errors.ts`
- All async route handlers are automatically caught by Express 5
- Central error handler in `src/middleware/errorHandler.ts`

### Validation
- Define Zod schemas in `*.schema.ts` files
- Use `validateRequest` middleware in routes
- Infer TypeScript types from Zod: `type X = z.infer<typeof xSchema>`

### Logging
- Use Pino logger from `src/config/logger.ts`
- Create child loggers per module: `createModuleLogger('auth')`
- Log levels: error, warn, info, debug
- NEVER log sensitive data (passwords, tokens, PII)

### Database
- Use Supabase client from `src/lib/supabase.ts`
- Use `supabaseAdmin` for service-level operations (bypasses RLS)
- Use `createSupabaseClient(token)` for user-context operations
- Always handle database errors gracefully

## API Response Format

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string, code?: string, details?: object }
```

## Environment Variables

Required in `.env`:
```
NODE_ENV=development
PORT=3001
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

## Testing

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Use Vitest for all tests
- Mock Supabase client in tests
- Test file naming: `*.test.ts`

## Git Workflow

- `main` - Production-ready code
- `dev` - Development integration branch
- Feature branches from `dev`: `feature/feature-name`
- Bugfix branches: `fix/bug-description`

## IMPORTANT Rules

- ALWAYS validate input with Zod before processing
- NEVER expose internal error details in production responses
- ALWAYS use parameterized queries (Supabase handles this)
- NEVER commit `.env` files
- ALWAYS handle async errors properly
- Use TypeScript strict mode - no `any` types unless absolutely necessary
