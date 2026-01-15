/**
 * Upload configuration constants.
 * Centralized configuration for file uploads.
 */

export const uploadConfig = {
  /**
   * Maximum file size in bytes (5MB)
   */
  maxFileSize: 5 * 1024 * 1024,

  /**
   * Allowed MIME types for image uploads
   */
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ] as const,

  /**
   * Allowed file extensions
   */
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'] as const,

  /**
   * Storage configuration
   */
  storage: {
    /**
     * Local storage base path (relative to project root)
     */
    localBasePath: 'public/uploads',

    /**
     * Base URL for serving uploaded files
     */
    localBaseUrl: '/uploads',
  },

  /**
   * Upload categories for organizing files
   */
  categories: ['countries', 'users', 'reports'] as const,
} as const;

/**
 * Type for upload categories
 */
export type UploadCategory = (typeof uploadConfig.categories)[number];

/**
 * Type for allowed MIME types
 */
export type AllowedMimeType = (typeof uploadConfig.allowedMimeTypes)[number];
