import type { Request, Response } from 'express';
import { blogService } from './blog.service.js';
import { createModuleLogger } from '../../config/logger.js';
import type {
  ListBlogQuery,
  AdminListBlogQuery,
  BlogSlugParam,
  BlogIdParam,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from './blog.schema.js';

const logger = createModuleLogger('blog-controller');

/**
 * Cache control header for ISR support.
 * s-maxage: CDN cache for 1 hour
 * stale-while-revalidate: Serve stale content for 24 hours while revalidating
 */
const PUBLIC_CACHE_HEADER =
  'public, s-maxage=3600, stale-while-revalidate=86400';

/**
 * Blog controller.
 * Handles HTTP request/response for blog endpoints.
 */
export const blogController = {
  // ================== PUBLIC: Blog Posts ==================

  /**
   * GET /api/v1/blog
   * List published blog posts with pagination.
   */
  async listBlogPosts(req: Request, res: Response): Promise<void> {
    const query = (req as Request & { validatedQuery: ListBlogQuery })
      .validatedQuery;
    logger.debug({ query }, 'List blog posts request');

    const result = await blogService.listPosts(query, 'blog');

    res.setHeader('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/blog/:slug
   * Get a published blog post by slug.
   */
  async getBlogPostBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = (req as Request & { validatedParams: BlogSlugParam })
      .validatedParams;
    logger.debug({ slug }, 'Get blog post by slug request');

    const post = await blogService.getPostBySlug(slug, 'blog');

    // Increment view count asynchronously (don't await)
    blogService.incrementViewCount(post.id).catch((err) => {
      logger.error({ err, postId: post.id }, 'Failed to increment view count');
    });

    res.setHeader('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json({
      success: true,
      data: post,
    });
  },

  /**
   * GET /api/v1/press
   * List published press articles with pagination.
   */
  async listPressPosts(req: Request, res: Response): Promise<void> {
    const query = (req as Request & { validatedQuery: ListBlogQuery })
      .validatedQuery;
    logger.debug({ query }, 'List press posts request');

    const result = await blogService.listPosts(query, 'press');

    res.setHeader('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/press/:slug
   * Get a published press article by slug.
   */
  async getPressPostBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = (req as Request & { validatedParams: BlogSlugParam })
      .validatedParams;
    logger.debug({ slug }, 'Get press post by slug request');

    const post = await blogService.getPostBySlug(slug, 'press');

    // Increment view count asynchronously (don't await)
    blogService.incrementViewCount(post.id).catch((err) => {
      logger.error({ err, postId: post.id }, 'Failed to increment view count');
    });

    res.setHeader('Cache-Control', PUBLIC_CACHE_HEADER);
    res.status(200).json({
      success: true,
      data: post,
    });
  },

  // ================== ADMIN: Blog Posts ==================

  /**
   * GET /api/v1/admin/blog
   * List all blog posts with pagination (admin).
   */
  async adminListPosts(req: Request, res: Response): Promise<void> {
    const query = (req as Request & { validatedQuery: AdminListBlogQuery })
      .validatedQuery;
    logger.debug({ query }, 'Admin list blog posts request');

    const result = await blogService.adminListPosts(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/admin/blog/:id
   * Get a blog post by ID (admin).
   */
  async adminGetPostById(req: Request, res: Response): Promise<void> {
    const { id } = (req as Request & { validatedParams: BlogIdParam })
      .validatedParams;
    logger.debug({ id }, 'Admin get blog post by ID request');

    const post = await blogService.getPostById(id);

    res.status(200).json({
      success: true,
      data: { post },
    });
  },

  /**
   * POST /api/v1/admin/blog
   * Create a new blog post (admin).
   */
  async adminCreatePost(
    req: Request<object, object, CreateBlogPostInput>,
    res: Response
  ): Promise<void> {
    const input = req.body;
    logger.debug({ slug: input.slug, contentType: input.contentType }, 'Admin create blog post request');

    const post = await blogService.createPost(input);

    logger.info({ postId: post.id }, 'Blog post created');

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: { post },
    });
  },

  /**
   * PATCH /api/v1/admin/blog/:id
   * Update a blog post (admin).
   */
  async adminUpdatePost(
    req: Request<object, object, UpdateBlogPostInput>,
    res: Response
  ): Promise<void> {
    const { id } = (req as Request & { validatedParams: BlogIdParam })
      .validatedParams;
    logger.debug({ id, updates: req.body }, 'Admin update blog post request');

    const post = await blogService.updatePost(id, req.body);

    logger.info({ id }, 'Blog post updated');

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: { post },
    });
  },

  /**
   * DELETE /api/v1/admin/blog/:id
   * Delete a blog post (admin).
   */
  async adminDeletePost(req: Request, res: Response): Promise<void> {
    const { id } = (req as Request & { validatedParams: BlogIdParam })
      .validatedParams;
    logger.debug({ id }, 'Admin delete blog post request');

    await blogService.deletePost(id);

    logger.info({ id }, 'Blog post deleted');

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully',
    });
  },

  /**
   * POST /api/v1/admin/blog/:id/publish
   * Publish a blog post (admin).
   */
  async adminPublishPost(req: Request, res: Response): Promise<void> {
    const { id } = (req as Request & { validatedParams: BlogIdParam })
      .validatedParams;
    logger.debug({ id }, 'Admin publish blog post request');

    const post = await blogService.publishPost(id);

    logger.info({ id }, 'Blog post published');

    res.status(200).json({
      success: true,
      message: 'Blog post published successfully',
      data: { post },
    });
  },

  /**
   * POST /api/v1/admin/blog/:id/unpublish
   * Unpublish a blog post (admin).
   */
  async adminUnpublishPost(req: Request, res: Response): Promise<void> {
    const { id } = (req as Request & { validatedParams: BlogIdParam })
      .validatedParams;
    logger.debug({ id }, 'Admin unpublish blog post request');

    const post = await blogService.unpublishPost(id);

    logger.info({ id }, 'Blog post unpublished');

    res.status(200).json({
      success: true,
      message: 'Blog post unpublished successfully',
      data: { post },
    });
  },
};
