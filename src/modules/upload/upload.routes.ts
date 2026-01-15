import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { uploadController } from './upload.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { uploadConfig } from '../../config/upload.js';

const router = Router();

// All upload routes require admin authentication
router.use(authenticate, requireAdmin);

/**
 * Extended request type with parsed file
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
 * Middleware to parse multipart/form-data using busboy.
 * Parses file and form fields into req.file and req.body.
 */
function parseMultipart(req: Request, _res: Response, next: NextFunction): void {
  // Skip if not multipart/form-data
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    next();
    return;
  }

  const uploadReq = req as UploadRequest;
  const fields: Record<string, string> = {};
  const chunks: Buffer[] = [];
  let fileInfo: { originalname: string; mimetype: string } | null = null;
  let hasFile = false;

  const busboy = Busboy({
    headers: req.headers,
    limits: {
      fileSize: uploadConfig.maxFileSize,
      files: 1, // Only allow one file
    },
  });

  busboy.on('field', (name: string, value: string) => {
    fields[name] = value;
  });

  busboy.on('file', (_name: string, stream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
    hasFile = true;
    fileInfo = {
      originalname: info.filename,
      mimetype: info.mimeType,
    };

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('limit', () => {
      // File exceeded size limit - handled by validation in service
    });
  });

  busboy.on('finish', () => {
    uploadReq.body = { ...uploadReq.body, ...fields };

    if (hasFile && fileInfo) {
      const buffer = Buffer.concat(chunks);
      uploadReq.file = {
        ...fileInfo,
        buffer,
        size: buffer.length,
      };
    }

    next();
  });

  busboy.on('error', (error: Error) => {
    next(error);
  });

  req.pipe(busboy);
}

/**
 * @route   POST /api/v1/upload
 * @desc    Upload a file
 * @access  Admin only
 */
router.post('/', parseMultipart, uploadController.uploadFile);

/**
 * @route   DELETE /api/v1/upload
 * @desc    Delete a file
 * @access  Admin only
 */
router.delete('/', uploadController.deleteFile);

export const uploadRouter = router;
