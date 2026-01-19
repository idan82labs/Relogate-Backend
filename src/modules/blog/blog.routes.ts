import { Router } from 'express';
import { blogController } from './blog.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import {
  validateRequest,
  validateQuery,
  validateParams,
} from '../../middleware/validate-request.js';
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
 * GET /api/v1/blog - List blog posts
 * GET /api/v1/blog/:slug - Get blog post by slug
 */
const blogPublicRouter = Router();

/**
 * @route   GET /api/v1/blog
 * @desc    List published blog posts with pagination
 * @access  Public
 */
blogPublicRouter.get(
  '/',
  validateQuery(listBlogQuerySchema),
  blogController.listBlogPosts
);

/**
 * @route   GET /api/v1/blog/:slug
 * @desc    Get a published blog post by slug
 * @access  Public
 */
blogPublicRouter.get(
  '/:slug',
  validateParams(blogSlugParamSchema),
  blogController.getBlogPostBySlug
);

/**
 * Public press routes (no auth required).
 * GET /api/v1/press - List press articles
 * GET /api/v1/press/:slug - Get press article by slug
 */
const pressPublicRouter = Router();

/**
 * @route   GET /api/v1/press
 * @desc    List published press articles with pagination
 * @access  Public
 */
pressPublicRouter.get(
  '/',
  validateQuery(listBlogQuerySchema),
  blogController.listPressPosts
);

/**
 * @route   GET /api/v1/press/:slug
 * @desc    Get a published press article by slug
 * @access  Public
 */
pressPublicRouter.get(
  '/:slug',
  validateParams(blogSlugParamSchema),
  blogController.getPressPostBySlug
);

/**
 * Admin blog routes (auth + admin required).
 * CRUD operations for blog posts.
 */
const blogAdminRouter = Router();

// All admin routes require authentication and admin role
blogAdminRouter.use(authenticate, requireAdmin);

/**
 * @route   GET /api/v1/admin/blog
 * @desc    List all blog posts with pagination (includes drafts)
 * @access  Admin only
 */
blogAdminRouter.get(
  '/',
  validateQuery(adminListBlogQuerySchema),
  blogController.adminListPosts
);

/**
 * @route   GET /api/v1/admin/blog/:id
 * @desc    Get a blog post by ID
 * @access  Admin only
 */
blogAdminRouter.get(
  '/:id',
  validateParams(blogIdParamSchema),
  blogController.adminGetPostById
);

/**
 * @route   POST /api/v1/admin/blog
 * @desc    Create a new blog post
 * @access  Admin only
 */
blogAdminRouter.post(
  '/',
  validateRequest(createBlogPostSchema),
  blogController.adminCreatePost
);

/**
 * @route   PATCH /api/v1/admin/blog/:id
 * @desc    Update a blog post
 * @access  Admin only
 */
blogAdminRouter.patch(
  '/:id',
  validateParams(blogIdParamSchema),
  validateRequest(updateBlogPostSchema),
  blogController.adminUpdatePost
);

/**
 * @route   DELETE /api/v1/admin/blog/:id
 * @desc    Delete a blog post
 * @access  Admin only
 */
blogAdminRouter.delete(
  '/:id',
  validateParams(blogIdParamSchema),
  blogController.adminDeletePost
);

/**
 * @route   POST /api/v1/admin/blog/:id/publish
 * @desc    Publish a blog post
 * @access  Admin only
 */
blogAdminRouter.post(
  '/:id/publish',
  validateParams(blogIdParamSchema),
  blogController.adminPublishPost
);

/**
 * @route   POST /api/v1/admin/blog/:id/unpublish
 * @desc    Unpublish a blog post
 * @access  Admin only
 */
blogAdminRouter.post(
  '/:id/unpublish',
  validateParams(blogIdParamSchema),
  blogController.adminUnpublishPost
);

export { blogPublicRouter, pressPublicRouter, blogAdminRouter };
