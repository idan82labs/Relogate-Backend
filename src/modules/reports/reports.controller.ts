import type { Request, Response } from 'express';
import { reportsService } from './reports.service.js';
import { createModuleLogger } from '../../config/logger.js';
import type {
  ListReportsQuery,
  ReportIdParam,
  CreateReportInput,
  UpdateReportInput,
  PublishReportInput,
  DestinationResponseIdParam,
  CreateDestinationResponseInput,
  UpdateDestinationResponseInput,
  PublishDestinationResponseInput,
} from './reports.schema.js';

const logger = createModuleLogger('reports-controller');

/**
 * Reports controller.
 * Handles HTTP request/response for reports endpoints.
 */
export const reportsController = {
  // ================== ADMIN: Reports ==================

  /**
   * GET /api/v1/admin/reports
   * List all reports with pagination and filtering.
   */
  async listReports(req: Request, res: Response): Promise<void> {
    const query = (req as Request & { validatedQuery: ListReportsQuery }).validatedQuery;
    logger.debug({ query }, 'List reports request');

    const result = await reportsService.listReports(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/admin/reports/pending
   * Get pending questionnaires (no report created yet).
   */
  async getPendingQuestionnaires(req: Request, res: Response): Promise<void> {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    logger.debug({ page, limit }, 'Get pending questionnaires request');

    const result = await reportsService.getPendingQuestionnaires(page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/admin/reports/:reportId
   * Get a report by ID.
   */
  async getReportById(req: Request, res: Response): Promise<void> {
    const { reportId } = (req as Request & { validatedParams: ReportIdParam }).validatedParams;
    logger.debug({ reportId }, 'Get report by ID request');

    const report = await reportsService.getReportById(reportId);

    res.status(200).json({
      success: true,
      data: { report },
    });
  },

  /**
   * POST /api/v1/admin/reports
   * Create a new report for a questionnaire.
   */
  async createReport(req: Request<object, object, CreateReportInput>, res: Response): Promise<void> {
    const input = req.body;
    logger.debug({ questionnaireId: input.questionnaireId }, 'Create report request');

    const report = await reportsService.createReport(input);

    logger.info({ reportId: report.id }, 'Report created');

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: { report },
    });
  },

  /**
   * PATCH /api/v1/admin/reports/:reportId
   * Update a report's greeting and profile summary.
   */
  async updateReport(req: Request<object, object, UpdateReportInput>, res: Response): Promise<void> {
    const { reportId } = (req as Request & { validatedParams: ReportIdParam }).validatedParams;
    logger.debug({ reportId, updates: req.body }, 'Update report request');

    const report = await reportsService.updateReport(reportId, req.body);

    logger.info({ reportId }, 'Report updated');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: { report },
    });
  },

  /**
   * POST /api/v1/admin/reports/:reportId/publish
   * Publish a report.
   */
  async publishReport(req: Request<object, object, PublishReportInput>, res: Response): Promise<void> {
    const { reportId } = (req as Request & { validatedParams: ReportIdParam }).validatedParams;
    const { publishDestinations } = req.body ?? { publishDestinations: true };
    logger.debug({ reportId, publishDestinations }, 'Publish report request');

    const report = await reportsService.publishReport(reportId, publishDestinations);

    logger.info({ reportId }, 'Report published');

    res.status(200).json({
      success: true,
      message: 'Report published successfully',
      data: { report },
    });
  },

  /**
   * DELETE /api/v1/admin/reports/:reportId
   * Delete a report.
   */
  async deleteReport(req: Request, res: Response): Promise<void> {
    const { reportId } = (req as Request & { validatedParams: ReportIdParam }).validatedParams;
    logger.debug({ reportId }, 'Delete report request');

    await reportsService.deleteReport(reportId);

    logger.info({ reportId }, 'Report deleted');

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  },

  // ================== ADMIN: Destination Responses ==================

  /**
   * GET /api/v1/admin/reports/destinations/:destinationId
   * Get a destination response by ID.
   */
  async getDestinationResponseById(req: Request, res: Response): Promise<void> {
    const { destinationId } = (req as Request & { validatedParams: DestinationResponseIdParam }).validatedParams;
    logger.debug({ destinationId }, 'Get destination response by ID request');

    const response = await reportsService.getDestinationResponseById(destinationId);

    res.status(200).json({
      success: true,
      data: { response },
    });
  },

  /**
   * POST /api/v1/admin/reports/destinations
   * Create a new destination response for a report.
   */
  async createDestinationResponse(req: Request<object, object, CreateDestinationResponseInput>, res: Response): Promise<void> {
    const input = req.body;
    logger.debug({ reportId: input.reportId, destinationName: input.destination.name }, 'Create destination response request');

    const response = await reportsService.createDestinationResponse(input);

    logger.info({ responseId: response.id }, 'Destination response created');

    res.status(201).json({
      success: true,
      message: 'Destination response created successfully',
      data: { response },
    });
  },

  /**
   * PATCH /api/v1/admin/reports/destinations/:destinationId
   * Update a destination response.
   */
  async updateDestinationResponse(req: Request<object, object, UpdateDestinationResponseInput>, res: Response): Promise<void> {
    const { destinationId } = (req as Request & { validatedParams: DestinationResponseIdParam }).validatedParams;
    logger.debug({ destinationId, updates: req.body }, 'Update destination response request');

    const response = await reportsService.updateDestinationResponse(destinationId, req.body);

    logger.info({ destinationId }, 'Destination response updated');

    res.status(200).json({
      success: true,
      message: 'Destination response updated successfully',
      data: { response },
    });
  },

  /**
   * POST /api/v1/admin/reports/destinations/:destinationId/publish
   * Publish or unpublish a destination response.
   */
  async publishDestinationResponse(req: Request<object, object, PublishDestinationResponseInput>, res: Response): Promise<void> {
    const { destinationId } = (req as Request & { validatedParams: DestinationResponseIdParam }).validatedParams;
    const { publish } = req.body ?? { publish: true };
    logger.debug({ destinationId, publish }, 'Publish destination response request');

    const response = await reportsService.publishDestinationResponse(destinationId, publish);

    logger.info({ destinationId, publish }, 'Destination response publish status updated');

    res.status(200).json({
      success: true,
      message: publish ? 'Destination response published successfully' : 'Destination response unpublished successfully',
      data: { response },
    });
  },

  /**
   * DELETE /api/v1/admin/reports/destinations/:destinationId
   * Delete a destination response.
   */
  async deleteDestinationResponse(req: Request, res: Response): Promise<void> {
    const { destinationId } = (req as Request & { validatedParams: DestinationResponseIdParam }).validatedParams;
    logger.debug({ destinationId }, 'Delete destination response request');

    await reportsService.deleteDestinationResponse(destinationId);

    logger.info({ destinationId }, 'Destination response deleted');

    res.status(200).json({
      success: true,
      message: 'Destination response deleted successfully',
    });
  },

  // ================== PUBLIC: User Report ==================

  /**
   * GET /api/v1/reports/status
   * Get current user's report status.
   */
  async getUserReportStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    logger.debug({ userId }, 'Get user report status request');

    const status = await reportsService.getUserReportStatus(userId);

    res.status(200).json({
      success: true,
      data: status,
    });
  },

  /**
   * GET /api/v1/reports
   * Get current user's published report.
   */
  async getUserReport(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    logger.debug({ userId }, 'Get user report request');

    const report = await reportsService.getUserReport(userId);

    if (!report) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'No published report available',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { report },
    });
  },

  /**
   * GET /api/v1/reports/destinations/:destinationId
   * Get a specific destination response from user's report.
   */
  async getUserDestinationResponse(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const destinationId = req.params.destinationId as string;
    logger.debug({ userId, destinationId }, 'Get user destination response request');

    const response = await reportsService.getUserDestinationResponse(userId, destinationId);

    if (!response) {
      res.status(404).json({
        success: false,
        error: 'Destination response not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { response },
    });
  },
};
