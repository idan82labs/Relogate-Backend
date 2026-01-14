import { Router } from 'express';
import type { ZodSchema } from 'zod';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { validateRequest, validateQuery, validateParams } from '../../middleware/validate-request.js';
import {
  listReportsQuerySchema,
  reportIdParamSchema,
  createReportSchema,
  updateReportSchema,
  publishReportSchema,
  countryResponseIdParamSchema,
  createCountryResponseSchema,
  updateCountryResponseSchema,
  publishCountryResponseSchema,
  type ListReportsQuery,
} from './reports.schema.js';

/**
 * Admin reports routes.
 * All routes require authentication and admin role.
 */
const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate, requireAdmin);

// ================== Reports ==================

/**
 * @route   GET /api/v1/admin/reports
 * @desc    List all reports with pagination and filtering
 * @access  Admin only
 */
adminRouter.get(
  '/',
  validateQuery(listReportsQuerySchema as ZodSchema<ListReportsQuery>),
  reportsController.listReports
);

/**
 * @route   GET /api/v1/admin/reports/pending
 * @desc    Get pending questionnaires (no report created yet)
 * @access  Admin only
 */
adminRouter.get('/pending', reportsController.getPendingQuestionnaires);

/**
 * @route   GET /api/v1/admin/reports/:reportId
 * @desc    Get a report by ID
 * @access  Admin only
 */
adminRouter.get(
  '/:reportId',
  validateParams(reportIdParamSchema),
  reportsController.getReportById
);

/**
 * @route   POST /api/v1/admin/reports
 * @desc    Create a new report for a questionnaire
 * @access  Admin only
 */
adminRouter.post(
  '/',
  validateRequest(createReportSchema),
  reportsController.createReport
);

/**
 * @route   PATCH /api/v1/admin/reports/:reportId
 * @desc    Update a report's greeting and profile summary
 * @access  Admin only
 */
adminRouter.patch(
  '/:reportId',
  validateParams(reportIdParamSchema),
  validateRequest(updateReportSchema),
  reportsController.updateReport
);

/**
 * @route   POST /api/v1/admin/reports/:reportId/publish
 * @desc    Publish a report
 * @access  Admin only
 */
adminRouter.post(
  '/:reportId/publish',
  validateParams(reportIdParamSchema),
  validateRequest(publishReportSchema),
  reportsController.publishReport
);

/**
 * @route   DELETE /api/v1/admin/reports/:reportId
 * @desc    Delete a report
 * @access  Admin only
 */
adminRouter.delete(
  '/:reportId',
  validateParams(reportIdParamSchema),
  reportsController.deleteReport
);

// ================== Country Responses ==================

/**
 * @route   GET /api/v1/admin/reports/responses/:responseId
 * @desc    Get a country response by ID
 * @access  Admin only
 */
adminRouter.get(
  '/responses/:responseId',
  validateParams(countryResponseIdParamSchema),
  reportsController.getCountryResponseById
);

/**
 * @route   POST /api/v1/admin/reports/responses
 * @desc    Create a new country response for a report
 * @access  Admin only
 */
adminRouter.post(
  '/responses',
  validateRequest(createCountryResponseSchema),
  reportsController.createCountryResponse
);

/**
 * @route   PATCH /api/v1/admin/reports/responses/:responseId
 * @desc    Update a country response
 * @access  Admin only
 */
adminRouter.patch(
  '/responses/:responseId',
  validateParams(countryResponseIdParamSchema),
  validateRequest(updateCountryResponseSchema),
  reportsController.updateCountryResponse
);

/**
 * @route   POST /api/v1/admin/reports/responses/:responseId/publish
 * @desc    Publish or unpublish a country response
 * @access  Admin only
 */
adminRouter.post(
  '/responses/:responseId/publish',
  validateParams(countryResponseIdParamSchema),
  validateRequest(publishCountryResponseSchema),
  reportsController.publishCountryResponse
);

/**
 * @route   DELETE /api/v1/admin/reports/responses/:responseId
 * @desc    Delete a country response
 * @access  Admin only
 */
adminRouter.delete(
  '/responses/:responseId',
  validateParams(countryResponseIdParamSchema),
  reportsController.deleteCountryResponse
);

/**
 * Public reports routes.
 * These routes require user authentication but not admin role.
 */
const publicRouter = Router();

// All public routes require authentication
publicRouter.use(authenticate);

/**
 * @route   GET /api/v1/reports/status
 * @desc    Get current user's report status
 * @access  Authenticated users
 */
publicRouter.get('/status', reportsController.getUserReportStatus);

/**
 * @route   GET /api/v1/reports
 * @desc    Get current user's published report
 * @access  Authenticated users
 */
publicRouter.get('/', reportsController.getUserReport);

/**
 * @route   GET /api/v1/reports/countries/:countryId
 * @desc    Get a specific country response from user's report
 * @access  Authenticated users
 */
publicRouter.get('/countries/:countryId', reportsController.getUserCountryResponse);

export const reportsAdminRouter = adminRouter;
export const reportsPublicRouter = publicRouter;
