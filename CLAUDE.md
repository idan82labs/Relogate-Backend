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
- **Payments**: Stripe
- **Testing**: Vitest + Supertest

## Project Structure

```
src/
├── config/         # Configuration (env, logger)
├── db/             # Database (Drizzle ORM)
│   ├── schema/     # Table definitions
│   │   ├── users.ts
│   │   ├── questionnaires.ts
│   │   ├── countries.ts
│   │   ├── reports.ts
│   │   ├── notifications.ts
│   │   ├── blog.ts
│   │   ├── payments.ts
│   │   └── index.ts
│   └── index.ts    # Database client
├── modules/        # Feature modules
│   ├── auth/       # User authentication
│   ├── questionnaire/  # Questionnaire CRUD & migration
│   ├── countries/  # Country catalog
│   ├── reports/    # Report & destination management
│   ├── notifications/  # User notifications
│   ├── blog/       # Blog & press articles
│   ├── payments/   # Stripe payment integration
│   ├── upload/     # File uploads
│   └── admin/      # Admin user & stats management
├── middleware/     # Express middleware
│   ├── authenticate.ts   # JWT verification
│   ├── authorize.ts      # Role-based access
│   ├── validate-request.ts
│   └── error-handler.ts
├── lib/            # Shared utilities
│   ├── errors.ts   # Custom error classes
│   ├── supabase.ts # Supabase auth client
│   └── stripe.ts   # Stripe client & config
├── types/          # Global TypeScript types
├── routes/         # Route aggregator
├── app.ts          # Express app setup
└── server.ts       # Entry point

drizzle/            # Generated migrations
scripts/            # Utility scripts (Stripe setup, etc.)
tests/              # Test files
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
npm run test:coverage # Run tests with coverage

# Database (Drizzle)
npm run db:generate  # Generate migrations from schema
npm run db:migrate   # Apply migrations to database
npm run db:push      # Push schema directly (dev only)
npm run db:studio    # Open Drizzle Studio GUI

# Stripe
npm run stripe:setup    # Setup Stripe CLI
npm run stripe:webhook  # Start webhook listener
npm run stripe:login    # Login to Stripe
```

## Feature Modules

### Auth Module (`/api/v1/auth`)
- User registration with Supabase Auth
- Login/logout with JWT tokens
- Password reset flow
- Session refresh

### Questionnaire Module (`/api/v1/questionnaire`)
- Flexible JSONB storage for V1/V2 schemas
- Multi-step wizard tracking
- Schema migration support
- Completion and archival workflows

### Countries Module (`/api/v1/countries`)
- Static country catalog
- Admin CRUD operations
- Category-based information (visa, safety, education, etc.)

### Reports Module (`/api/v1/reports`)
- Report generation from questionnaires
- Destination recommendations with match scores
- Personalized narratives
- Draft/publish workflow

### Notifications Module (`/api/v1/notifications`)
- User notification system
- Unread count tracking
- Batch notifications for admins

### Blog Module (`/api/v1/blog`, `/api/v1/press`)
- Localized content (Hebrew/English)
- Blog posts and press articles
- SEO-friendly slugs
- Draft/published/archived states

### Payments Module (`/api/v1/payments`)
- Stripe Checkout integration
- Webhook handling for payment events
- Payment status tracking
- Product types: relomatch_report, consultation

### Upload Module (`/api/v1/upload`)
- File upload via busboy
- Admin-only access

### Admin Module (`/api/v1/admin`)
- User management (CRUD)
- Questionnaire statistics
- Outdated questionnaire notifications
- Report management

## Database Architecture

### Two Connection Methods

| Purpose | Tool | When to Use |
|---------|------|-------------|
| **Authentication** | `@supabase/supabase-js` | Login, register, JWT tokens |
| **Data Queries** | Drizzle ORM + `postgres` | All database operations |

### Database Tables

1. **user_profiles** - User profile linked to Supabase Auth
2. **questionnaire_responses** - Flexible JSONB questionnaire storage
3. **questionnaire_results** - Computed recommendations
4. **countries** - Static country catalog
5. **questionnaire_reports** - Report headers
6. **destination_responses** - Individual destination recommendations
7. **notifications** - User/admin notifications
8. **blog_posts** - Blog and press articles
9. **payments** - Stripe payment records

### Drizzle ORM Usage

```typescript
// Import database client
import { db } from '@/db';
import { userProfiles, questionnaireResponses } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Select all
const users = await db.select().from(userProfiles);

// Select with conditions
const user = await db
  .select()
  .from(userProfiles)
  .where(eq(userProfiles.id, id));

// Insert with returning
const [newUser] = await db.insert(userProfiles).values({
  id: userId,
  firstName: 'John',
  lastName: 'Doe',
}).returning();

// Update
await db
  .update(userProfiles)
  .set({ firstName: 'Jane', updatedAt: new Date() })
  .where(eq(userProfiles.id, id));

// Delete
await db.delete(userProfiles).where(eq(userProfiles.id, id));

// Complex query
const completedQuestionnaires = await db
  .select()
  .from(questionnaireResponses)
  .where(and(
    eq(questionnaireResponses.userId, userId),
    eq(questionnaireResponses.status, 'completed')
  ))
  .orderBy(desc(questionnaireResponses.completedAt));
```

### Schema Definition

Define tables in `src/db/schema/`:

```typescript
import { pgTable, uuid, varchar, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enum definition
export const statusEnum = pgEnum('status', ['draft', 'published']);

// Table definition
export const myTable = pgTable('my_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  data: jsonb('data').$type<{ key: string }>(),
  status: statusEnum('status').default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type inference (always export these)
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
- Use custom error classes from `src/lib/errors.ts`:
  - `AppError` - Base error
  - `ValidationError` - 400
  - `NotFoundError` - 404
  - `UnauthorizedError` - 401
  - `ForbiddenError` - 403
  - `ConflictError` - 409
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

// Success with pagination
{ success: true, data: T[], pagination: { page, limit, total } }

// Error
{ success: false, error: string, code?: string, details?: object }
```

## Environment Variables

Required in `.env`:
```
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Supabase Auth (Settings → API)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Database (Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres

CORS_ORIGIN=http://localhost:3000

# Stripe (optional, for payments)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Stripe Integration

### Local Testing Setup

1. Install Stripe CLI: `./scripts/stripe-setup.sh`
2. Login: `stripe login`
3. Start webhook listener: `npm run stripe:webhook`
4. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### Test Cards

| Card Number | Result |
|-------------|--------|
| 4242424242424242 | Success |
| 4000000000000002 | Declined |
| 4000000000009995 | Insufficient funds |

### Webhook Events Handled

- `checkout.session.completed` - Payment successful
- `checkout.session.expired` - Session expired
- `payment_intent.payment_failed` - Payment failed

## Testing

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Use Vitest for all tests
- Use Supertest for HTTP testing
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
- NEVER log sensitive data (passwords, tokens, PII)
