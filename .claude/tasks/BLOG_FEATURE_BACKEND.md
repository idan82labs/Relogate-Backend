# Blog Feature - Backend Implementation

## Mission

Implement the backend API and database schema for a bilingual blog/press feature with:
- JSONB-based localization for Hebrew (primary) and English content
- Public API endpoints for blog listing and article pages
- Admin API endpoints for content management
- ISR-compatible caching headers

## Scope

**In Scope:**
- Database schema with Drizzle ORM (JSONB localized fields)
- Supabase Storage integration for images
- Public REST API endpoints (GET blog posts)
- Admin REST API endpoints (CRUD operations)
- Zod validation schemas
- Database migration files

**Out of Scope:**
- Frontend implementation (separate agent)
- Image processing/optimization
- Full-text search (future enhancement)
- Comments/user interactions

---

## 1. Project Context

### Tech Stack
| Technology | Version | Usage |
|------------|---------|-------|
| Node.js | 22+ | Runtime |
| Express | 5 | HTTP Framework |
| TypeScript | 5 | Language (strict mode) |
| Drizzle ORM | Latest | Database queries |
| PostgreSQL | Supabase | Database |
| Zod | Latest | Validation |
| Pino | Latest | Logging |

### Backend Directory Structure
```
src/
├── config/         # Configuration (env, logger)
├── db/             # Database (Drizzle ORM)
│   ├── schema/     # Table definitions
│   └── index.ts    # Database client
├── modules/        # Feature modules
│   └── [module]/
│       ├── *.controller.ts
│       ├── *.service.ts
│       ├── *.routes.ts
│       ├── *.schema.ts    # Zod schemas
│       └── *.types.ts
├── middleware/     # Express middleware
├── lib/            # Shared utilities
├── routes/         # Route aggregator
├── app.ts          # Express app setup
└── server.ts       # Entry point

drizzle/            # Generated migrations
```

### Key Patterns to Follow

**Module Structure** (follow `src/modules/reports/`):
```
src/modules/blog/
├── index.ts              # Barrel exports
├── blog.routes.ts        # Route definitions
├── blog.controller.ts    # Request handlers
├── blog.service.ts       # Business logic
├── blog.schema.ts        # Zod validation
└── blog.types.ts         # TypeScript interfaces
```

**Service Pattern** (from `reports.service.ts`):
- Export as `const blogService = { ... }`
- Use `createModuleLogger('blog-service')` for logging
- Use Drizzle ORM query patterns
- Throw custom errors: `NotFoundError`, `ValidationError`

**Route Pattern** (from `reports.routes.ts`):
- Create separate routers for public and admin endpoints
- Use `validateRequest`, `validateQuery`, `validateParams` middleware
- Use `authenticate` and `requireAdmin` middleware for protected routes

---

## 2. Git Workflow

### Branch Strategy
```
main (production)
└── dev (development)
    └── feature/blog-backend (your working branch)
```

### Branch Setup
```bash
# Ensure you're in the backend directory
cd /home/alexandr/82labsRelogate/Relogate-Backend

# Fetch latest and create branch from dev
git fetch origin
git checkout dev
git pull origin dev
git checkout -b feature/blog-backend
```

### Commit Convention
Use conventional commits:
```
feat(blog): add blog posts database schema
feat(blog): implement public blog API endpoints
feat(blog): add admin CRUD endpoints
test(blog): add service unit tests
```

### Commit Checkpoints
Make commits after each major milestone:
1. After database schema creation
2. After service implementation
3. After routes/controller implementation
4. After tests

---

## 3. Database Schema Design

### LocalizedText Interface

Create in `src/db/schema/blog.ts`:

```typescript
/**
 * Localized text structure for JSONB columns.
 * Hebrew is required, other locales optional.
 */
export interface LocalizedText {
  he: string;      // Hebrew - required (primary language)
  en?: string;     // English - optional
  [locale: string]: string | undefined;  // Future locales
}
```

### Content Type Enum

```typescript
export const blogContentTypeEnum = pgEnum('blog_content_type', [
  'blog',     // Knowledge base articles
  'press',    // Press/communication articles
]);
```

### Blog Status Enum

```typescript
export const blogStatusEnum = pgEnum('blog_status', [
  'draft',
  'published',
  'archived',
]);
```

### Blog Category Enum

```typescript
export const blogCategoryEnum = pgEnum('blog_category', [
  'visa',           // Visa information
  'relocation',     // Moving guides
  'lifestyle',      // Life in destination
  'finance',        // Financial planning
  'legal',          // Legal matters
  'testimonial',    // Success stories
  'press',          // Press mentions
  'general',        // General articles
]);
```

### Blog Posts Table

```typescript
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),

  // URL-friendly identifier (unique)
  slug: varchar('slug', { length: 255 }).notNull().unique(),

  // Content type: 'blog' or 'press'
  contentType: blogContentTypeEnum('content_type').notNull().default('blog'),

  // Localized content (JSONB)
  title: jsonb('title').$type<LocalizedText>().notNull(),
  excerpt: jsonb('excerpt').$type<LocalizedText>(),
  content: jsonb('content').$type<LocalizedText>().notNull(),
  metaDescription: jsonb('meta_description').$type<LocalizedText>(),

  // Media
  featuredImageUrl: text('featured_image_url'),
  featuredImageAlt: jsonb('featured_image_alt').$type<LocalizedText>(),

  // Categorization
  category: blogCategoryEnum('category'),
  tags: jsonb('tags').$type<string[]>().default([]),

  // Author
  author: varchar('author', { length: 255 }).notNull().default('Relogate'),

  // Status & ordering
  status: blogStatusEnum('status').notNull().default('draft'),
  displayOrder: integer('display_order').notNull().default(0),

  // SEO
  isFeatured: boolean('is_featured').notNull().default(false),

  // Analytics
  viewCount: integer('view_count').notNull().default(0),

  // Timestamps
  publishedAt: timestamp('published_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  // Indexes for common queries
  slugIdx: unique('blog_posts_slug_idx').on(table.slug),
  statusIdx: index('blog_posts_status_idx').on(table.status),
  contentTypeIdx: index('blog_posts_content_type_idx').on(table.contentType),
  categoryIdx: index('blog_posts_category_idx').on(table.category),
  publishedAtIdx: index('blog_posts_published_at_idx').on(table.publishedAt),
}));

// Type inference
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
```

### Migration Commands

After creating schema, run:
```bash
npm run db:generate   # Generate migration SQL
npm run db:migrate    # Apply migration to database
```

---

## 4. API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/blog` | List blog posts (paginated) |
| GET | `/api/v1/blog/:slug` | Get single blog post by slug |
| GET | `/api/v1/press` | List press articles (paginated) |
| GET | `/api/v1/press/:slug` | Get single press article by slug |

### Admin Endpoints (Auth + Admin Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/blog` | List all posts (with drafts) |
| GET | `/api/v1/admin/blog/:id` | Get post by ID (includes drafts) |
| POST | `/api/v1/admin/blog` | Create new post |
| PATCH | `/api/v1/admin/blog/:id` | Update post |
| DELETE | `/api/v1/admin/blog/:id` | Delete post |
| POST | `/api/v1/admin/blog/:id/publish` | Publish post |
| POST | `/api/v1/admin/blog/:id/unpublish` | Unpublish post |

### Query Parameters (Public List)

```typescript
interface ListBlogQuery {
  page?: number;       // Default: 1
  limit?: number;      // Default: 12, Max: 50
  category?: string;   // Filter by category
  locale?: string;     // 'he' | 'en' (for sorting/filtering)
}
```

### Response Format

**List Response:**
```typescript
interface BlogListResponse {
  posts: BlogPostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BlogPostSummary {
  id: string;
  slug: string;
  contentType: 'blog' | 'press';
  title: LocalizedText;
  excerpt: LocalizedText | null;
  featuredImageUrl: string | null;
  category: string | null;
  author: string;
  publishedAt: string;
}
```

**Single Post Response:**
```typescript
interface BlogPostFull extends BlogPostSummary {
  content: LocalizedText;
  metaDescription: LocalizedText | null;
  featuredImageAlt: LocalizedText | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Cache Headers for ISR

Public endpoints MUST include cache headers:
```typescript
res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
```

---

## 5. Implementation Tasks

### Phase 1: Database Schema

**Task 1.1: Create Schema File**
- File: `src/db/schema/blog.ts`
- Create all enums, interfaces, and table definitions
- Export types for inference

**Task 1.2: Update Schema Index**
- File: `src/db/schema/index.ts`
- Add export for blog schema

**Task 1.3: Generate Migration**
```bash
npm run db:generate
```
- Review generated SQL in `drizzle/` folder
- Ensure indexes are correct

**Task 1.4: Apply Migration**
```bash
npm run db:migrate
```

### Phase 2: Types & Validation

**Task 2.1: Create Types File**
- File: `src/modules/blog/blog.types.ts`
- Define response interfaces
- Define input types

**Task 2.2: Create Zod Schemas**
- File: `src/modules/blog/blog.schema.ts`
- Create validation schemas for:
  - List query params
  - Create/update post body
  - ID/slug params

### Phase 3: Service Layer

**Task 3.1: Create Blog Service**
- File: `src/modules/blog/blog.service.ts`
- Implement methods:
  - `listPosts(query, contentType)` - Public list with pagination
  - `getPostBySlug(slug, contentType)` - Public single post
  - `getPostById(id)` - Admin single post
  - `createPost(input)` - Admin create
  - `updatePost(id, input)` - Admin update
  - `deletePost(id)` - Admin delete
  - `publishPost(id)` - Admin publish
  - `unpublishPost(id)` - Admin unpublish
  - `incrementViewCount(id)` - Analytics

### Phase 4: Controller & Routes

**Task 4.1: Create Controller**
- File: `src/modules/blog/blog.controller.ts`
- Implement request handlers for all endpoints

**Task 4.2: Create Routes**
- File: `src/modules/blog/blog.routes.ts`
- Create `blogPublicRouter` for public endpoints
- Create `blogAdminRouter` for admin endpoints

**Task 4.3: Create Module Index**
- File: `src/modules/blog/index.ts`
- Export routers and service

**Task 4.4: Register Routes**
- File: `src/routes/index.ts`
- Add blog routes to API router

### Phase 5: Testing

**Task 5.1: Service Unit Tests**
- File: `tests/unit/modules/blog/blog.service.test.ts`
- Test all service methods

**Task 5.2: API Integration Tests**
- File: `tests/integration/blog.test.ts`
- Test public and admin endpoints

---

## 6. Detailed Implementation

### 6.1 Types File (`blog.types.ts`)

```typescript
import type { LocalizedText, BlogPost } from '../../db/schema/blog.js';

// Public response types
export interface BlogPostSummary {
  id: string;
  slug: string;
  contentType: 'blog' | 'press';
  title: LocalizedText;
  excerpt: LocalizedText | null;
  featuredImageUrl: string | null;
  category: string | null;
  author: string;
  publishedAt: string;
}

export interface BlogPostFull extends BlogPostSummary {
  content: LocalizedText;
  metaDescription: LocalizedText | null;
  featuredImageAlt: LocalizedText | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  posts: BlogPostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Admin response types (include status)
export interface AdminBlogPostSummary extends BlogPostSummary {
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogPostFull extends BlogPostFull {
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  displayOrder: number;
}

export interface AdminBlogListResponse {
  posts: AdminBlogPostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 6.2 Schema File (`blog.schema.ts`)

```typescript
import { z } from 'zod';

// Localized text schema
export const localizedTextSchema = z.object({
  he: z.string().min(1, 'Hebrew text is required'),
  en: z.string().optional(),
}).passthrough(); // Allow future locales

// Query schemas
export const listBlogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.enum([
    'visa', 'relocation', 'lifestyle', 'finance',
    'legal', 'testimonial', 'press', 'general'
  ]).optional(),
  locale: z.enum(['he', 'en']).default('he'),
});

export type ListBlogQuery = z.infer<typeof listBlogQuerySchema>;

export const blogSlugParamSchema = z.object({
  slug: z.string().min(1).max(255),
});

export type BlogSlugParam = z.infer<typeof blogSlugParamSchema>;

export const blogIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type BlogIdParam = z.infer<typeof blogIdParamSchema>;

// Admin mutation schemas
export const createBlogPostSchema = z.object({
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'),
  contentType: z.enum(['blog', 'press']).default('blog'),
  title: localizedTextSchema,
  excerpt: localizedTextSchema.optional(),
  content: localizedTextSchema,
  metaDescription: localizedTextSchema.optional(),
  featuredImageUrl: z.string().url().optional(),
  featuredImageAlt: localizedTextSchema.optional(),
  category: z.enum([
    'visa', 'relocation', 'lifestyle', 'finance',
    'legal', 'testimonial', 'press', 'general'
  ]).optional(),
  tags: z.array(z.string()).default([]),
  author: z.string().max(255).default('Relogate'),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = createBlogPostSchema.partial().omit({
  contentType: true, // Cannot change content type
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

// Admin list query (includes status filter)
export const adminListBlogQuerySchema = listBlogQuerySchema.extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  contentType: z.enum(['blog', 'press']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'publishedAt', 'displayOrder']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminListBlogQuery = z.infer<typeof adminListBlogQuerySchema>;
```

### 6.3 Service Implementation Pattern

```typescript
import { eq, desc, asc, and, count, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { blogPosts } from '../../db/schema/blog.js';
import { createModuleLogger } from '../../config/logger.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';
import type { BlogListResponse, BlogPostFull, BlogPostSummary } from './blog.types.js';
import type { ListBlogQuery, CreateBlogPostInput, UpdateBlogPostInput } from './blog.schema.js';

const logger = createModuleLogger('blog-service');

export const blogService = {
  /**
   * List published blog posts with pagination.
   * Used by public API.
   */
  async listPosts(
    query: ListBlogQuery,
    contentType: 'blog' | 'press'
  ): Promise<BlogListResponse> {
    const { page, limit, category } = query;
    const offset = (page - 1) * limit;

    logger.debug({ query, contentType }, 'Listing blog posts');

    // Build conditions
    const conditions = [
      eq(blogPosts.contentType, contentType),
      eq(blogPosts.status, 'published'),
    ];

    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Get posts
    const rows = await db
      .select()
      .from(blogPosts)
      .where(whereClause)
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);

    const posts: BlogPostSummary[] = rows.map(row => ({
      id: row.id,
      slug: row.slug,
      contentType: row.contentType,
      title: row.title,
      excerpt: row.excerpt,
      featuredImageUrl: row.featuredImageUrl,
      category: row.category,
      author: row.author,
      publishedAt: row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
    }));

    logger.info({ page, limit, total, count: posts.length }, 'Blog posts listed');

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a published blog post by slug.
   * Used by public API.
   */
  async getPostBySlug(
    slug: string,
    contentType: 'blog' | 'press'
  ): Promise<BlogPostFull> {
    logger.debug({ slug, contentType }, 'Getting blog post by slug');

    const [row] = await db
      .select()
      .from(blogPosts)
      .where(and(
        eq(blogPosts.slug, slug),
        eq(blogPosts.contentType, contentType),
        eq(blogPosts.status, 'published')
      ))
      .limit(1);

    if (!row) {
      throw new NotFoundError('Blog post');
    }

    logger.info({ slug }, 'Blog post retrieved');

    return {
      id: row.id,
      slug: row.slug,
      contentType: row.contentType,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      metaDescription: row.metaDescription,
      featuredImageUrl: row.featuredImageUrl,
      featuredImageAlt: row.featuredImageAlt,
      category: row.category,
      tags: row.tags ?? [],
      author: row.author,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  // ... Additional methods (createPost, updatePost, deletePost, etc.)
};
```

### 6.4 Routes Implementation Pattern

```typescript
import { Router } from 'express';
import { blogController } from './blog.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateRequest, validateQuery, validateParams } from '../../middleware/validate-request.js';
import {
  listBlogQuerySchema,
  blogSlugParamSchema,
  blogIdParamSchema,
  createBlogPostSchema,
  updateBlogPostSchema,
  adminListBlogQuerySchema,
} from './blog.schema.js';

/**
 * Public blog routes (no auth required).
 */
const publicRouter = Router();

// GET /api/v1/blog - List blog posts
publicRouter.get(
  '/',
  validateQuery(listBlogQuerySchema),
  blogController.listBlogPosts
);

// GET /api/v1/blog/:slug - Get blog post by slug
publicRouter.get(
  '/:slug',
  validateParams(blogSlugParamSchema),
  blogController.getBlogPostBySlug
);

/**
 * Public press routes (no auth required).
 */
const pressRouter = Router();

// GET /api/v1/press - List press articles
pressRouter.get(
  '/',
  validateQuery(listBlogQuerySchema),
  blogController.listPressPosts
);

// GET /api/v1/press/:slug - Get press article by slug
pressRouter.get(
  '/:slug',
  validateParams(blogSlugParamSchema),
  blogController.getPressPostBySlug
);

/**
 * Admin blog routes (auth + admin required).
 */
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

// GET /api/v1/admin/blog - List all posts (with drafts)
adminRouter.get(
  '/',
  validateQuery(adminListBlogQuerySchema),
  blogController.adminListPosts
);

// GET /api/v1/admin/blog/:id - Get post by ID
adminRouter.get(
  '/:id',
  validateParams(blogIdParamSchema),
  blogController.adminGetPostById
);

// POST /api/v1/admin/blog - Create post
adminRouter.post(
  '/',
  validateRequest(createBlogPostSchema),
  blogController.adminCreatePost
);

// PATCH /api/v1/admin/blog/:id - Update post
adminRouter.patch(
  '/:id',
  validateParams(blogIdParamSchema),
  validateRequest(updateBlogPostSchema),
  blogController.adminUpdatePost
);

// DELETE /api/v1/admin/blog/:id - Delete post
adminRouter.delete(
  '/:id',
  validateParams(blogIdParamSchema),
  blogController.adminDeletePost
);

// POST /api/v1/admin/blog/:id/publish - Publish post
adminRouter.post(
  '/:id/publish',
  validateParams(blogIdParamSchema),
  blogController.adminPublishPost
);

// POST /api/v1/admin/blog/:id/unpublish - Unpublish post
adminRouter.post(
  '/:id/unpublish',
  validateParams(blogIdParamSchema),
  blogController.adminUnpublishPost
);

export const blogPublicRouter = publicRouter;
export const pressPublicRouter = pressRouter;
export const blogAdminRouter = adminRouter;
```

---

## 7. Coordination with Frontend Agent

### API Contract

Frontend expects these exact response shapes:

**GET /api/v1/blog**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "slug": "article-slug",
        "contentType": "blog",
        "title": { "he": "כותרת", "en": "Title" },
        "excerpt": { "he": "תקציר", "en": "Excerpt" },
        "featuredImageUrl": "https://...",
        "category": "relocation",
        "author": "Relogate",
        "publishedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 45,
      "totalPages": 4
    }
  }
}
```

**GET /api/v1/blog/:slug**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "article-slug",
    "contentType": "blog",
    "title": { "he": "כותרת", "en": "Title" },
    "excerpt": { "he": "תקציר" },
    "content": { "he": "תוכן מלא בעברית..." },
    "metaDescription": { "he": "תיאור מטא" },
    "featuredImageUrl": "https://...",
    "featuredImageAlt": { "he": "תיאור תמונה" },
    "category": "relocation",
    "tags": ["israel", "visa"],
    "author": "Relogate",
    "viewCount": 150,
    "publishedAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### Cache Headers

All public endpoints MUST include:
```typescript
res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
```

This enables Next.js ISR revalidation.

### Error Responses

```json
{
  "success": false,
  "error": "Blog post not found",
  "code": "NOT_FOUND"
}
```

---

## 8. Image Storage

### Supabase Storage Bucket

Use existing upload service pattern. Images should be stored in:
- Bucket: `blog-images`
- Path: `{contentType}/{slug}/{filename}`

Example: `blog/visa-guide-israel/featured.jpg`

### Upload Integration

The upload module (`src/modules/upload/`) already handles file uploads.
Blog posts reference images by URL stored in `featuredImageUrl`.

---

## 9. Testing Requirements

### Unit Tests

Test each service method:
- `listPosts` - pagination, filtering, sorting
- `getPostBySlug` - found, not found, wrong content type
- `createPost` - valid input, duplicate slug
- `updatePost` - found, not found, partial update
- `deletePost` - found, not found
- `publishPost` / `unpublishPost` - status transitions

### Integration Tests

Test each API endpoint:
- Public list with pagination
- Public single post (found/not found)
- Admin CRUD operations
- Auth/authorization checks

---

## 10. Definition of Done

### Must Have
- [ ] Database schema created and migrated
- [ ] Public API endpoints working (GET list, GET single)
- [ ] Admin API endpoints working (CRUD)
- [ ] Zod validation on all endpoints
- [ ] Cache headers on public endpoints
- [ ] Logger integration
- [ ] Error handling consistent with project patterns

### Should Have
- [ ] Unit tests for service layer
- [ ] Integration tests for API endpoints
- [ ] View count increment on article read

### Nice to Have
- [ ] Related posts query
- [ ] Search by title/content

---

## 11. Existing Content Reference

Content to seed (from `מאמרים לאתר` directory):

### Hebrew Articles (7)
1. "7 יעדים שאפשר לעבור אליהם בלי להתאמץ" - Category: relocation
2. "4 טעויות שישראלים עושים כשמעבירים את העסק לחו״ל" - Category: finance
3. "האם ויזת הנוודים הדיגיטלים שווה?" - Category: visa
4. "מעבר לחו״ל עם ילדים" - Category: lifestyle
5. "איך רילוקייט עזרה לי לחסוך אלפי שקלים" - Category: testimonial
6. "מדריך מעשי להעברת כספים לחשבון זר" - Category: finance
7. "שיקולי מס במעבר לחו״ל" - Category: legal

### English Articles (7)
Corresponding translations of Hebrew articles.

### Images
14 images in `תמונות מאמרים/` to be uploaded to Supabase Storage.

---

## 12. Quick Start Commands

```bash
# Setup
cd /home/alexandr/82labsRelogate/Relogate-Backend
git checkout -b feature/blog-backend

# Development
npm run dev          # Start dev server
npm run typecheck    # Check types
npm run lint         # Lint code

# Database
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
npm run db:studio    # Visual DB browser

# Testing
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

---

## 13. Files to Create/Modify

### New Files
```
src/db/schema/blog.ts           # Database schema
src/modules/blog/index.ts       # Barrel exports
src/modules/blog/blog.types.ts  # TypeScript types
src/modules/blog/blog.schema.ts # Zod validation
src/modules/blog/blog.service.ts    # Business logic
src/modules/blog/blog.controller.ts # Request handlers
src/modules/blog/blog.routes.ts     # Route definitions
tests/unit/modules/blog/blog.service.test.ts
tests/integration/blog.test.ts
```

### Modified Files
```
src/db/schema/index.ts          # Add blog export
src/routes/index.ts             # Register blog routes
```

---

## Notes

- Follow existing patterns exactly (see `src/modules/reports/`)
- Use Drizzle ORM query patterns (not raw SQL)
- All Hebrew content is valid - schema supports RTL
- Coordinate with frontend agent on API contract
- Keep commits atomic and well-documented
