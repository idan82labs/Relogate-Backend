import type { LocalizedText } from '../../db/schema/blog.js';

// Re-export schema type for convenience
export type { LocalizedText };

/**
 * Blog content type
 */
export type BlogContentType = 'blog' | 'press';

/**
 * Blog status type
 */
export type BlogStatus = 'draft' | 'published' | 'archived';

/**
 * Blog category type
 */
export type BlogCategory =
  | 'visa'
  | 'relocation'
  | 'lifestyle'
  | 'finance'
  | 'legal'
  | 'testimonial'
  | 'press'
  | 'general';

/**
 * Blog post summary for list views (public).
 */
export interface BlogPostSummary {
  id: string;
  slug: string;
  contentType: BlogContentType;
  title: LocalizedText;
  excerpt: LocalizedText | null;
  featuredImageUrl: string | null;
  category: BlogCategory | null;
  author: string;
  publishedAt: string;
}

/**
 * Full blog post with all details (public single view).
 */
export interface BlogPostFull extends BlogPostSummary {
  content: LocalizedText;
  metaDescription: LocalizedText | null;
  featuredImageAlt: LocalizedText | null;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Blog list response with pagination (public).
 */
export interface BlogListResponse {
  posts: BlogPostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Admin blog post summary (includes status and admin fields).
 */
export interface AdminBlogPostSummary extends BlogPostSummary {
  status: BlogStatus;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin full blog post with all details.
 */
export interface AdminBlogPostFull extends BlogPostFull {
  status: BlogStatus;
  isFeatured: boolean;
  displayOrder: number;
}

/**
 * Admin blog list response with pagination.
 */
export interface AdminBlogListResponse {
  posts: AdminBlogPostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
