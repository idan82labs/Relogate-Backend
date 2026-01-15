/**
 * Storage service interface.
 * Abstraction layer for file storage operations.
 * Allows easy switching between local filesystem and cloud storage (e.g., Supabase).
 */

/**
 * Metadata for an uploaded file
 */
export interface UploadedFile {
  /**
   * Public URL to access the file
   */
  url: string;

  /**
   * Storage path (relative path in storage system)
   */
  path: string;

  /**
   * Generated filename
   */
  filename: string;

  /**
   * Original uploaded filename
   */
  originalName: string;

  /**
   * File MIME type
   */
  mimeType: string;

  /**
   * File size in bytes
   */
  size: number;
}

/**
 * Options for uploading a file
 */
export interface UploadOptions {
  /**
   * Category for organizing files (e.g., 'countries', 'users')
   */
  category: string;

  /**
   * Original filename from the upload
   */
  originalName: string;

  /**
   * MIME type of the file
   */
  mimeType: string;
}

/**
 * Storage service interface.
 * Implement this interface for different storage backends.
 */
export interface IStorageService {
  /**
   * Upload a file to storage
   * @param file - Buffer containing file data
   * @param options - Upload options (category, originalName, mimeType)
   * @returns Metadata about the uploaded file
   */
  upload(file: Buffer, options: UploadOptions): Promise<UploadedFile>;

  /**
   * Delete a file from storage
   * @param path - Storage path of the file to delete
   */
  delete(path: string): Promise<void>;

  /**
   * Check if a file exists in storage
   * @param path - Storage path to check
   * @returns True if file exists, false otherwise
   */
  exists(path: string): Promise<boolean>;
}
