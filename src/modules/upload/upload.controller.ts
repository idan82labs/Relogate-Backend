import type { Request, Response } from 'express';
import { uploadService } from './upload.service.js';
import { BadRequestError } from '../../lib/errors.js';
import type { UploadCategory } from '../../config/upload.js';

/**
 * Extended request type with parsed file from multipart middleware
 */
interface UploadRequest extends Request {
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

/**
 * Upload controller - handles HTTP requests for file uploads
 */
export const uploadController = {
  /**
   * Handle file upload
   * POST /api/v1/upload
   * Content-Type: multipart/form-data
   */
  async uploadFile(req: UploadRequest, res: Response): Promise<void> {
    const file = req.file;

    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    const category = req.body.category as UploadCategory;

    if (!category) {
      throw new BadRequestError('Category is required');
    }

    const uploaded = await uploadService.uploadFile(
      file.buffer,
      {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      category
    );

    res.status(201).json({
      success: true,
      data: {
        url: uploaded.url,
        filename: uploaded.filename,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      },
    });
  },

  /**
   * Delete a file
   * DELETE /api/v1/upload?path=<file_path>
   */
  async deleteFile(req: Request, res: Response): Promise<void> {
    const filePath = req.query.path as string;

    if (!filePath) {
      throw new BadRequestError('File path is required');
    }

    await uploadService.deleteFile(filePath);

    res.status(204).send();
  },
};
