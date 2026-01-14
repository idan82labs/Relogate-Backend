/**
 * Notifications Module
 *
 * Provides endpoints for managing user and admin notifications.
 * User endpoints for viewing and managing notifications.
 * Admin endpoint for creating notifications.
 */

export { notificationsUserRouter, notificationsAdminRouter } from './notifications.routes.js';
export { notificationsController } from './notifications.controller.js';
export { notificationsService } from './notifications.service.js';
export * from './notifications.types.js';
export * from './notifications.schema.js';
