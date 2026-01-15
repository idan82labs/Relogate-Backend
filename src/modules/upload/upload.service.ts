import path from 'node:path';
import { createModuleLogger } from '../../config/logger.js';
import { ValidationError } from '../../lib/errors.js';
import { uploadConfig, type UploadCategory } from '../../config/upload.js';
import { storageService, type UploadedFile } from '../../lib/storage/index.js';

const logger = createModuleLogger('upload-service');

/**
 * File information from the multipart parser
 */
export interface FileInfo {
  originalName: string;
  mimeType: string;
  size: number;
}

/**
 * Upload service - handles file validation and storage operations
 */
export const uploadService = {
  /**
   * Validate and upload a file
   * @param fileBuffer - File data as Buffer
   * @param fileInfo - File metadata (name, type, size)
   * @param category - Upload category for organizing files
   * @returns Uploaded file metadata
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileInfo: FileInfo,
    category: UploadCategory
  ): Promise<UploadedFile> {
    logger.debug(
      { category, originalName: fileInfo.originalName, size: fileInfo.size },
      'Processing file upload'
    );

    // Validate MIME type
    if (!uploadConfig.allowedMimeTypes.includes(fileInfo.mimeType as typeof uploadConfig.allowedMimeTypes[number])) {
      throw new ValidationError('Invalid file type', {
        file: [`Allowed types: ${uploadConfig.allowedMimeTypes.join(', ')}`],
      });
    }

    // Validate file size
    if (fileInfo.size > uploadConfig.maxFileSize) {
      throw new ValidationError('File too large', {
        file: [`Maximum size: ${uploadConfig.maxFileSize / 1024 / 1024}MB`],
      });
    }

    // Validate file extension
    const ext = path.extname(fileInfo.originalName).toLowerCase();
    if (ext && !uploadConfig.allowedExtensions.includes(ext as typeof uploadConfig.allowedExtensions[number])) {
      throw new ValidationError('Invalid file extension', {
        file: [`Allowed extensions: ${uploadConfig.allowedExtensions.join(', ')}`],
      });
    }

    // Upload via storage service
    const uploaded = await storageService.upload(fileBuffer, {
      category,
      originalName: fileInfo.originalName,
      mimeType: fileInfo.mimeType,
    });

    logger.info(
      { path: uploaded.path, url: uploaded.url, size: uploaded.size },
      'File uploaded successfully'
    );

    return uploaded;
  },

  /**
   * Delete an uploaded file
   * @param filePath - Storage path of the file to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    logger.debug({ path: filePath }, 'Deleting file');

    // Validate path to prevent directory traversal
    if (filePath.includes('..') || filePath.startsWith('/')) {
      throw new ValidationError('Invalid file path', {
        path: ['Path must not contain ".." or start with "/"'],
      });
    }

    await storageService.delete(filePath);
    logger.info({ path: filePath }, 'File deleted successfully');
  },
};
