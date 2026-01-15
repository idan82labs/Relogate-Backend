import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IStorageService, UploadedFile, UploadOptions } from './storage.interface.js';

/**
 * Local filesystem storage service.
 * Stores files on the local filesystem.
 */
export class LocalStorageService implements IStorageService {
  private readonly basePath: string;
  private readonly baseUrl: string;

  /**
   * Create a new LocalStorageService
   * @param basePath - Base path for storing files (relative to project root)
   * @param baseUrl - Base URL for serving files
   */
  constructor(basePath: string, baseUrl: string) {
    this.basePath = basePath;
    this.baseUrl = baseUrl;
  }

  /**
   * Upload a file to local filesystem
   */
  async upload(file: Buffer, options: UploadOptions): Promise<UploadedFile> {
    const ext = this.getExtension(options.originalName, options.mimeType);
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const relativePath = `images/${options.category}/${filename}`;
    const fullPath = path.join(process.cwd(), this.basePath, relativePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file to disk
    await fs.writeFile(fullPath, file);

    return {
      url: `${this.baseUrl}/${relativePath}`,
      path: relativePath,
      filename,
      originalName: options.originalName,
      mimeType: options.mimeType,
      size: file.length,
    };
  }

  /**
   * Delete a file from local filesystem
   */
  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), this.basePath, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Check if a file exists
   */
  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(process.cwd(), this.basePath, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file extension from filename or MIME type
   */
  private getExtension(filename: string, mimeType: string): string {
    // Try to get extension from filename
    const extMatch = filename.match(/\.[^.]+$/);
    if (extMatch) {
      return extMatch[0].toLowerCase();
    }

    // Fall back to MIME type mapping
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };

    return mimeToExt[mimeType] || '.bin';
  }
}
