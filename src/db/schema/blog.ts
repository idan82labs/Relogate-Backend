import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Localized text structure for JSONB columns.
 * Hebrew is required, other locales optional.
 */
export interface LocalizedText {
  he: string; // Hebrew - required (primary language)
  en?: string; // English - optional
  [locale: string]: string | undefined; // Future locales
}

/**
 * Content type enum - distinguishes blog from press articles.
 */
export const blogContentTypeEnum = pgEnum('blog_content_type', [
  'blog', // Knowledge base articles
  'press', // Press/communication articles
]);

/**
 * Blog post status enum.
 */
export const blogStatusEnum = pgEnum('blog_status', [
  'draft',
  'published',
  'archived',
]);

/**
 * Blog category enum.
 */
export const blogCategoryEnum = pgEnum('blog_category', [
  'visa', // Visa information
  'relocation', // Moving guides
  'lifestyle', // Life in destination
  'finance', // Financial planning
  'legal', // Legal matters
  'testimonial', // Success stories
  'press', // Press mentions
  'general', // General articles
]);

/**
 * Blog posts table.
 *
 * Stores all blog and press articles with JSONB-based localization.
 * Content type distinguishes between blog (knowledge base) and press articles.
 */
export const blogPosts = pgTable(
  'blog_posts',
  {
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
  },
  (table) => [
    // Indexes for common queries
    index('blog_posts_status_idx').on(table.status),
    index('blog_posts_content_type_idx').on(table.contentType),
    index('blog_posts_category_idx').on(table.category),
    index('blog_posts_published_at_idx').on(table.publishedAt),
  ]
);

// Type inference
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
