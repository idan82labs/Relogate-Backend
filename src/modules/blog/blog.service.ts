import { eq, desc, asc, and, count, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { blogPosts, type NewBlogPost } from '../../db/schema/blog.js';
import { createModuleLogger } from '../../config/logger.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';
import type {
  BlogListResponse,
  BlogPostFull,
  BlogPostSummary,
  AdminBlogListResponse,
  AdminBlogPostSummary,
  AdminBlogPostFull,
  BlogContentType,
  BlogCategory,
} from './blog.types.js';
import type {
  ListBlogQuery,
  AdminListBlogQuery,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from './blog.schema.js';

const logger = createModuleLogger('blog-service');

/**
 * Blog service.
 * Handles CRUD operations for blog posts.
 */
export const blogService = {
  // ================== PUBLIC: Blog Posts ==================

  /**
   * List published blog posts with pagination.
   * Used by public API.
   */
  async listPosts(
    query: ListBlogQuery,
    contentType: BlogContentType
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

    const posts: BlogPostSummary[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      contentType: row.contentType as BlogContentType,
      title: row.title,
      excerpt: row.excerpt,
      featuredImageUrl: row.featuredImageUrl,
      category: row.category as BlogCategory | null,
      author: row.author,
      publishedAt:
        row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
    }));

    logger.info(
      { page, limit, total, count: posts.length, contentType },
      'Blog posts listed'
    );

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
    contentType: BlogContentType
  ): Promise<BlogPostFull> {
    logger.debug({ slug, contentType }, 'Getting blog post by slug');

    const [row] = await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.slug, slug),
          eq(blogPosts.contentType, contentType),
          eq(blogPosts.status, 'published')
        )
      )
      .limit(1);

    if (!row) {
      throw new NotFoundError('Blog post');
    }

    logger.info({ slug, contentType }, 'Blog post retrieved');

    return {
      id: row.id,
      slug: row.slug,
      contentType: row.contentType as BlogContentType,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      metaDescription: row.metaDescription,
      featuredImageUrl: row.featuredImageUrl,
      featuredImageAlt: row.featuredImageAlt,
      category: row.category as BlogCategory | null,
      tags: row.tags ?? [],
      author: row.author,
      viewCount: row.viewCount,
      publishedAt:
        row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  },

  /**
   * Increment view count for a blog post.
   */
  async incrementViewCount(id: string): Promise<void> {
    logger.debug({ id }, 'Incrementing view count');

    await db
      .update(blogPosts)
      .set({
        viewCount: sql`${blogPosts.viewCount} + 1`,
      })
      .where(eq(blogPosts.id, id));

    logger.debug({ id }, 'View count incremented');
  },

  // ================== ADMIN: Blog Posts ==================

  /**
   * List all blog posts with pagination (admin view).
   * Includes drafts and archived posts.
   */
  async adminListPosts(query: AdminListBlogQuery): Promise<AdminBlogListResponse> {
    const { page, limit, category, status, contentType, sortBy, sortOrder } =
      query;
    const offset = (page - 1) * limit;

    logger.debug({ query }, 'Admin listing blog posts');

    // Build conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(blogPosts.status, status));
    }

    if (contentType) {
      conditions.push(eq(blogPosts.contentType, contentType));
    }

    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(blogPosts)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Build order by
    const sortColumn = {
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      publishedAt: blogPosts.publishedAt,
      displayOrder: blogPosts.displayOrder,
    }[sortBy];

    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get posts
    const rows = await db
      .select()
      .from(blogPosts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const posts: AdminBlogPostSummary[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      contentType: row.contentType as BlogContentType,
      title: row.title,
      excerpt: row.excerpt,
      featuredImageUrl: row.featuredImageUrl,
      category: row.category as BlogCategory | null,
      author: row.author,
      publishedAt:
        row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
      status: row.status,
      isFeatured: row.isFeatured,
      displayOrder: row.displayOrder,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    logger.info({ page, limit, total, count: posts.length }, 'Admin blog posts listed');

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
   * Get a blog post by ID (admin view).
   * Includes drafts and all fields.
   */
  async getPostById(id: string): Promise<AdminBlogPostFull> {
    logger.debug({ id }, 'Getting blog post by ID');

    const [row] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!row) {
      throw new NotFoundError('Blog post');
    }

    logger.info({ id }, 'Blog post retrieved by ID');

    return {
      id: row.id,
      slug: row.slug,
      contentType: row.contentType as BlogContentType,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      metaDescription: row.metaDescription,
      featuredImageUrl: row.featuredImageUrl,
      featuredImageAlt: row.featuredImageAlt,
      category: row.category as BlogCategory | null,
      tags: row.tags ?? [],
      author: row.author,
      viewCount: row.viewCount,
      publishedAt:
        row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      status: row.status,
      isFeatured: row.isFeatured,
      displayOrder: row.displayOrder,
    };
  },

  /**
   * Create a new blog post (admin).
   */
  async createPost(input: CreateBlogPostInput): Promise<AdminBlogPostFull> {
    logger.debug({ slug: input.slug, contentType: input.contentType }, 'Creating blog post');

    // Check if slug already exists
    const [existingPost] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, input.slug))
      .limit(1);

    if (existingPost) {
      throw new ConflictError('A blog post with this slug already exists');
    }

    // Create post
    const insertData: NewBlogPost = {
      slug: input.slug,
      contentType: input.contentType,
      title: input.title,
      excerpt: input.excerpt ?? null,
      content: input.content,
      metaDescription: input.metaDescription ?? null,
      featuredImageUrl: input.featuredImageUrl ?? null,
      featuredImageAlt: input.featuredImageAlt ?? null,
      category: input.category ?? null,
      tags: input.tags,
      author: input.author,
      isFeatured: input.isFeatured,
      displayOrder: input.displayOrder,
      status: 'draft',
    };

    const [newPost] = await db.insert(blogPosts).values(insertData).returning();

    if (!newPost) {
      throw new Error('Failed to create blog post');
    }

    logger.info(
      { postId: newPost.id, slug: input.slug },
      'Blog post created'
    );

    return this.getPostById(newPost.id);
  },

  /**
   * Update a blog post (admin).
   */
  async updatePost(
    id: string,
    input: UpdateBlogPostInput
  ): Promise<AdminBlogPostFull> {
    logger.debug({ id, input }, 'Updating blog post');

    // Check if post exists
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    // Check slug uniqueness if being changed
    if (input.slug && input.slug !== existing.slug) {
      const [existingSlug] = await db
        .select({ id: blogPosts.id })
        .from(blogPosts)
        .where(eq(blogPosts.slug, input.slug))
        .limit(1);

      if (existingSlug) {
        throw new ConflictError('A blog post with this slug already exists');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.metaDescription !== undefined)
      updateData.metaDescription = input.metaDescription;
    if (input.featuredImageUrl !== undefined)
      updateData.featuredImageUrl = input.featuredImageUrl;
    if (input.featuredImageAlt !== undefined)
      updateData.featuredImageAlt = input.featuredImageAlt;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.author !== undefined) updateData.author = input.author;
    if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured;
    if (input.displayOrder !== undefined)
      updateData.displayOrder = input.displayOrder;

    // Update post
    await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, id));

    logger.info({ id }, 'Blog post updated');

    return this.getPostById(id);
  },

  /**
   * Delete a blog post (admin).
   */
  async deletePost(id: string): Promise<void> {
    logger.debug({ id }, 'Deleting blog post');

    // Check if post exists
    const [existing] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    // Delete post
    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    logger.info({ id }, 'Blog post deleted');
  },

  /**
   * Publish a blog post (admin).
   */
  async publishPost(id: string): Promise<AdminBlogPostFull> {
    logger.debug({ id }, 'Publishing blog post');

    // Check if post exists
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    const now = new Date();

    // Update status
    await db
      .update(blogPosts)
      .set({
        status: 'published',
        publishedAt: existing.publishedAt ?? now,
        updatedAt: now,
      })
      .where(eq(blogPosts.id, id));

    logger.info({ id }, 'Blog post published');

    return this.getPostById(id);
  },

  /**
   * Unpublish a blog post (set to draft, admin).
   */
  async unpublishPost(id: string): Promise<AdminBlogPostFull> {
    logger.debug({ id }, 'Unpublishing blog post');

    // Check if post exists
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Blog post');
    }

    const now = new Date();

    // Update status
    await db
      .update(blogPosts)
      .set({
        status: 'draft',
        updatedAt: now,
      })
      .where(eq(blogPosts.id, id));

    logger.info({ id }, 'Blog post unpublished');

    return this.getPostById(id);
  },
};
