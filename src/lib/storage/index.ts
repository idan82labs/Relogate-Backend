/**
 * Storage service module.
 * Exports a configured storage service instance.
 *
 * To migrate to Supabase Storage later:
 * 1. Create supabase-storage.service.ts implementing IStorageService
 * 2. Add STORAGE_TYPE environment variable
 * 3. Switch implementation based on env var
 */

import { LocalStorageService } from './local-storage.service.js';
import { uploadConfig } from '../../config/upload.js';

export type { IStorageService, UploadedFile, UploadOptions } from './storage.interface.js';
export { LocalStorageService } from './local-storage.service.js';

/**
 * Configured storage service instance.
 * Currently uses local filesystem storage.
 */
export const storageService = new LocalStorageService(
  uploadConfig.storage.localBasePath,
  uploadConfig.storage.localBaseUrl
);
