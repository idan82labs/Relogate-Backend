import { z } from 'zod';
import { uploadConfig } from '../../config/upload.js';

/**
 * Schema for upload request body (the 'category' field from form-data)
 */
export const uploadBodySchema = z.object({
  category: z.enum(uploadConfig.categories, {
    errorMap: () => ({
      message: `Category must be one of: ${uploadConfig.categories.join(', ')}`,
    }),
  }),
});

export type UploadBody = z.infer<typeof uploadBodySchema>;

/**
 * Schema for file metadata validation (after parsing multipart)
 */
export const fileMetadataSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  mimetype: z.enum(uploadConfig.allowedMimeTypes as unknown as [string, ...string[]], {
    errorMap: () => ({
      message: `File type must be one of: ${uploadConfig.allowedMimeTypes.join(', ')}`,
    }),
  }),
  size: z
    .number()
    .max(
      uploadConfig.maxFileSize,
      `File size must not exceed ${uploadConfig.maxFileSize / 1024 / 1024}MB`
    ),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

/**
 * Schema for delete request query
 */
export const deleteQuerySchema = z.object({
  path: z.string().min(1, 'File path is required'),
});

export type DeleteQuery = z.infer<typeof deleteQuerySchema>;
