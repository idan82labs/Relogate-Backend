import { z } from 'zod';

/**
 * Localized text schema - Hebrew required, English optional.
 * Uses strict typing compatible with LocalizedText interface.
 */
export const localizedTextSchema = z.object({
  he: z.string().min(1, 'Hebrew text is required'),
  en: z.string().optional(),
});

export type LocalizedTextInput = z.infer<typeof localizedTextSchema>;

/**
 * Blog category enum values.
 */
export const blogCategoryValues = [
  'visa',
  'relocation',
  'lifestyle',
  'finance',
  'legal',
  'testimonial',
  'press',
  'general',
] as const;

/**
 * Public list query schema.
 */
export const listBlogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.enum(blogCategoryValues).optional(),
  locale: z.enum(['he', 'en']).default('he'),
});

export type ListBlogQuery = z.infer<typeof listBlogQuerySchema>;

/**
 * Blog slug param schema.
 */
export const blogSlugParamSchema = z.object({
  slug: z.string().min(1).max(255),
});

export type BlogSlugParam = z.infer<typeof blogSlugParamSchema>;

/**
 * Blog ID param schema.
 */
export const blogIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type BlogIdParam = z.infer<typeof blogIdParamSchema>;

/**
 * Create blog post schema (admin).
 */
export const createBlogPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
  contentType: z.enum(['blog', 'press']).default('blog'),
  title: localizedTextSchema,
  excerpt: localizedTextSchema.optional(),
  content: localizedTextSchema,
  metaDescription: localizedTextSchema.optional(),
  featuredImageUrl: z.string().url().optional().nullable(),
  featuredImageAlt: localizedTextSchema.optional(),
  category: z.enum(blogCategoryValues).optional().nullable(),
  tags: z.array(z.string()).default([]),
  author: z.string().max(255).default('Relogate'),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;

/**
 * Update blog post schema (admin).
 * All fields optional except contentType cannot be changed.
 */
export const updateBlogPostSchema = createBlogPostSchema
  .partial()
  .omit({ contentType: true });

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;

/**
 * Admin list query schema (includes status filter).
 */
export const adminListBlogQuerySchema = listBlogQuerySchema.extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  contentType: z.enum(['blog', 'press']).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'publishedAt', 'displayOrder'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminListBlogQuery = z.infer<typeof adminListBlogQuerySchema>;
