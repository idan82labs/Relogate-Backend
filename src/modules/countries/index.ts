/**
 * Countries Module
 *
 * Provides CRUD operations for the countries catalog.
 * Admin endpoints require authentication.
 * Public endpoint returns active countries for dropdowns.
 */

export { countriesAdminRouter, countriesPublicRouter } from './countries.routes.js';
export { countriesController } from './countries.controller.js';
export { countriesService } from './countries.service.js';
export * from './countries.types.js';
export * from './countries.schema.js';
