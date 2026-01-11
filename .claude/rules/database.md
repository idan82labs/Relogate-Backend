# Database Rules (Drizzle ORM)

## Architecture

Two database connection methods:

| Tool | Purpose |
|------|---------|
| `@supabase/supabase-js` | Authentication only (login, register, JWT) |
| Drizzle ORM + `postgres` | All data queries and mutations |

## Database Client

```typescript
import { db } from '../db/index.js';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { userProfiles, questionnaires } from '../db/schema/index.js';
```

## Query Patterns

### Select

```typescript
// All records
const users = await db.select().from(userProfiles);

// With conditions
const user = await db
  .select()
  .from(userProfiles)
  .where(eq(userProfiles.id, userId));

// Specific columns
const names = await db
  .select({ firstName: userProfiles.firstName })
  .from(userProfiles);

// Multiple conditions
const results = await db
  .select()
  .from(questionnaires)
  .where(
    and(
      eq(questionnaires.userId, userId),
      eq(questionnaires.status, 'completed')
    )
  );

// Order and limit
const recent = await db
  .select()
  .from(questionnaires)
  .orderBy(desc(questionnaires.createdAt))
  .limit(10);
```

### Insert

```typescript
// Single record
await db.insert(userProfiles).values({
  id: userId,
  firstName: 'John',
  lastName: 'Doe',
});

// Return inserted record
const [newUser] = await db
  .insert(userProfiles)
  .values({ ... })
  .returning();

// Multiple records
await db.insert(questionnaires).values([
  { userId: id1, countries: ['US'] },
  { userId: id2, countries: ['UK'] },
]);
```

### Update

```typescript
// Update with condition
await db
  .update(userProfiles)
  .set({ firstName: 'Jane', updatedAt: new Date() })
  .where(eq(userProfiles.id, userId));

// Return updated record
const [updated] = await db
  .update(questionnaires)
  .set({ status: 'completed' })
  .where(eq(questionnaires.id, id))
  .returning();
```

### Delete

```typescript
await db
  .delete(questionnaires)
  .where(eq(questionnaires.id, id));
```

### Joins

```typescript
const results = await db
  .select({
    questionnaire: questionnaires,
    user: userProfiles,
  })
  .from(questionnaires)
  .leftJoin(userProfiles, eq(questionnaires.userId, userProfiles.id));
```

## Schema Definition

### Location
Define tables in `src/db/schema/*.ts`

### Patterns

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Enum definition
export const statusEnum = pgEnum('status', ['active', 'inactive']);

// Table definition
export const myTable = pgTable('my_table', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign key
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),

  // Common types
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').$type<{ key: string }>(),
  status: statusEnum('status').default('active'),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Type inference (always export these)
export type MyTable = typeof myTable.$inferSelect;
export type NewMyTable = typeof myTable.$inferInsert;
```

### Export from index
Always add new tables to `src/db/schema/index.ts`:
```typescript
export * from './my-table.js';
```

## Migrations

### Workflow

1. **Modify schema** in `src/db/schema/`
2. **Generate migration**: `npm run db:generate`
3. **Review** generated SQL in `drizzle/`
4. **Apply**: `npm run db:migrate`

### Commands

```bash
npm run db:generate  # Generate from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:push      # Push directly (dev only, no migration)
npm run db:studio    # Open Drizzle Studio GUI
```

## Best Practices

### DO

- Use TypeScript types from `$inferSelect` and `$inferInsert`
- Use `eq()`, `and()`, `or()` for conditions
- Use `.returning()` when you need the result
- Use transactions for multi-step operations
- Export types alongside table definitions

### DON'T

- Don't use raw SQL unless absolutely necessary
- Don't forget to add new tables to schema/index.ts
- Don't skip migrations in production
- Don't use `db:push` in production

## Error Handling

```typescript
import { DatabaseError } from 'pg';

try {
  await db.insert(users).values(data);
} catch (error) {
  if (error instanceof DatabaseError) {
    if (error.code === '23505') {
      throw new ConflictError('Record already exists');
    }
  }
  throw error;
}
```

## Supabase-Specific

### Connection Pooling

For Supabase transaction pooler, `prepare: false` is set in the connection config.

### RLS Consideration

Drizzle bypasses RLS when using the direct connection. Implement authorization in your service layer.
