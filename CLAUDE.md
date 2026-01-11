# Relogate Backend

## Project Overview

Node.js + Express + TypeScript backend for the Relogate relocation assistance platform.
Provides REST API for the Next.js frontend.

## Tech Stack

- **Runtime**: Node.js 22+ (LTS)
- **Framework**: Express 5
- **Language**: TypeScript 5 (strict mode)
- **Database**: Supabase PostgreSQL + Drizzle ORM
- **Auth**: Supabase Auth
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Vitest

## Project Structure

```
src/
├── config/         # Configuration (env, logger)
├── db/             # Database (Drizzle ORM)
│   ├── schema/     # Table definitions
│   └── index.ts    # Database client
├── modules/        # Feature modules (auth, questionnaire, user)
│   └── [module]/
│       ├── *.controller.ts
│       ├── *.service.ts
│       ├── *.routes.ts
│       ├── *.schema.ts    # Zod schemas
│       └── *.types.ts
├── middleware/     # Express middleware
├── lib/            # Shared utilities (supabase auth, errors)
├── types/          # Global TypeScript types
├── routes/         # Route aggregator
├── app.ts          # Express app setup
└── server.ts       # Entry point

drizzle/            # Generated migrations
drizzle.config.ts   # Drizzle Kit config
```

## Commands

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript to dist/
npm run start        # Run production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode

# Database (Drizzle)
npm run db:generate  # Generate migrations from schema
npm run db:migrate   # Apply migrations to database
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio GUI
```

## Database Architecture

### Two Connection Methods

| Purpose | Tool | When to Use |
|---------|------|-------------|
| **Authentication** | `@supabase/supabase-js` | Login, register, JWT tokens |
| **Data Queries** | Drizzle ORM + `postgres` | All database operations |

### Drizzle ORM Usage

```typescript
// Import database client
import { db } from '@/db';
import { userProfiles, questionnaires } from '@/db/schema';

// Select all
const users = await db.select().from(userProfiles);

// Select with conditions
const user = await db
  .select()
  .from(userProfiles)
  .where(eq(userProfiles.id, id));

// Insert
await db.insert(userProfiles).values({
  id: userId,
  firstName: 'John',
  lastName: 'Doe',
});

// Update
await db
  .update(userProfiles)
  .set({ firstName: 'Jane' })
  .where(eq(userProfiles.id, id));

// Delete
await db.delete(userProfiles).where(eq(userProfiles.id, id));
```

### Schema Definition

Define tables in `src/db/schema/`:

```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type inference
export type MyTable = typeof myTable.$inferSelect;
export type NewMyTable = typeof myTable.$inferInsert;
```

### Migration Workflow

1. Modify schema in `src/db/schema/`
2. Generate migration: `npm run db:generate`
3. Review migration in `drizzle/`
4. Apply migration: `npm run db:migrate`

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
- Central error handler in `src/middleware/error-handler.ts`

### Validation
- Define Zod schemas in `*.schema.ts` files
- Use `validateRequest` middleware in routes
- Infer TypeScript types from Zod: `type X = z.infer<typeof xSchema>`

### Logging
- Use Pino logger from `src/config/logger.ts`
- Create child loggers per module: `createModuleLogger('auth')`
- Log levels: error, warn, info, debug
- NEVER log sensitive data (passwords, tokens, PII)

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

# Supabase Auth (Settings → API)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Database (Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

## Testing

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Use Vitest for all tests
- Mock database with in-memory or test transactions
- Test file naming: `*.test.ts`

## Git Workflow

- `main` - Production-ready code
- `dev` - Development integration branch
- Feature branches from `dev`: `feature/feature-name`
- Bugfix branches: `fix/bug-description`

## IMPORTANT Rules

- ALWAYS validate input with Zod before processing
- NEVER expose internal error details in production responses
- Use Drizzle ORM for database queries (type-safe, SQL-like)
- Use Supabase Auth for authentication (JWT, password hashing)
- NEVER commit `.env` files
- ALWAYS handle async errors properly
- Use TypeScript strict mode - no `any` types unless absolutely necessary
- Run `npm run db:generate` after schema changes
