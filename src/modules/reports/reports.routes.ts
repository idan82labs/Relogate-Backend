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
  destinationResponseIdParamSchema,
  createDestinationResponseSchema,
  updateDestinationResponseSchema,
  publishDestinationResponseSchema,
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

// ================== Destination Responses ==================

/**
 * @route   GET /api/v1/admin/reports/destinations/:destinationId
 * @desc    Get a destination response by ID
 * @access  Admin only
 */
adminRouter.get(
  '/destinations/:destinationId',
  validateParams(destinationResponseIdParamSchema),
  reportsController.getDestinationResponseById
);

/**
 * @route   POST /api/v1/admin/reports/destinations
 * @desc    Create a new destination response for a report
 * @access  Admin only
 */
adminRouter.post(
  '/destinations',
  validateRequest(createDestinationResponseSchema),
  reportsController.createDestinationResponse
);

/**
 * @route   PATCH /api/v1/admin/reports/destinations/:destinationId
 * @desc    Update a destination response
 * @access  Admin only
 */
adminRouter.patch(
  '/destinations/:destinationId',
  validateParams(destinationResponseIdParamSchema),
  validateRequest(updateDestinationResponseSchema),
  reportsController.updateDestinationResponse
);

/**
 * @route   POST /api/v1/admin/reports/destinations/:destinationId/publish
 * @desc    Publish or unpublish a destination response
 * @access  Admin only
 */
adminRouter.post(
  '/destinations/:destinationId/publish',
  validateParams(destinationResponseIdParamSchema),
  validateRequest(publishDestinationResponseSchema),
  reportsController.publishDestinationResponse
);

/**
 * @route   DELETE /api/v1/admin/reports/destinations/:destinationId
 * @desc    Delete a destination response
 * @access  Admin only
 */
adminRouter.delete(
  '/destinations/:destinationId',
  validateParams(destinationResponseIdParamSchema),
  reportsController.deleteDestinationResponse
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
 * @route   GET /api/v1/reports/destinations/:destinationId
 * @desc    Get a specific destination response from user's report
 * @access  Authenticated users
 */
publicRouter.get('/destinations/:destinationId', reportsController.getUserDestinationResponse);

export const reportsAdminRouter = adminRouter;
export const reportsPublicRouter = publicRouter;
