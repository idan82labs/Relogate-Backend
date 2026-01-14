/**
 * Admin Module
 *
 * Provides administrative functionality for user management.
 * All endpoints require admin authentication.
 */

export { adminRouter } from './admin.routes.js';
export { adminController } from './admin.controller.js';
export { adminService } from './admin.service.js';
export * from './admin.types.js';
export * from './admin.schema.js';
