import { Router } from 'express';
import type { ZodSchema } from 'zod';
import { countriesController } from './countries.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateRequest, validateQuery, validateParams } from '../../middleware/validate-request.js';
import {
  listCountriesQuerySchema,
  countryIdParamSchema,
  createCountrySchema,
  updateCountrySchema,
  type ListCountriesQuery,
} from './countries.schema.js';

/**
 * Admin countries routes.
 * All routes require authentication and admin role.
 */
const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate, requireAdmin);

/**
 * @route   GET /api/v1/admin/countries
 * @desc    List all countries with pagination and filtering
 * @access  Admin only
 */
adminRouter.get(
  '/',
  validateQuery(listCountriesQuerySchema as ZodSchema<ListCountriesQuery>),
  countriesController.listCountries
);

/**
 * @route   GET /api/v1/admin/countries/:countryId
 * @desc    Get a country by ID
 * @access  Admin only
 */
adminRouter.get(
  '/:countryId',
  validateParams(countryIdParamSchema),
  countriesController.getCountryById
);

/**
 * @route   POST /api/v1/admin/countries
 * @desc    Create a new country
 * @access  Admin only
 */
adminRouter.post(
  '/',
  validateRequest(createCountrySchema),
  countriesController.createCountry
);

/**
 * @route   PATCH /api/v1/admin/countries/:countryId
 * @desc    Update a country
 * @access  Admin only
 */
adminRouter.patch(
  '/:countryId',
  validateParams(countryIdParamSchema),
  validateRequest(updateCountrySchema),
  countriesController.updateCountry
);

/**
 * @route   DELETE /api/v1/admin/countries/:countryId
 * @desc    Delete a country
 * @access  Admin only
 */
adminRouter.delete(
  '/:countryId',
  validateParams(countryIdParamSchema),
  countriesController.deleteCountry
);

/**
 * Public countries routes.
 * These routes are accessible without authentication.
 */
const publicRouter = Router();

/**
 * @route   GET /api/v1/countries
 * @desc    Get all active countries (for dropdowns/selects)
 * @access  Public
 */
publicRouter.get('/', countriesController.getActiveCountries);

export const countriesAdminRouter = adminRouter;
export const countriesPublicRouter = publicRouter;
