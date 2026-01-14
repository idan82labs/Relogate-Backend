import type { Request, Response } from 'express';
import { reportsService } from './reports.service.js';
import { createModuleLogger } from '../../config/logger.js';
import type {
  ListReportsQuery,
  ReportIdParam,
  CreateReportInput,
  UpdateReportInput,
  PublishReportInput,
  CountryResponseIdParam,
  CreateCountryResponseInput,
  UpdateCountryResponseInput,
  PublishCountryResponseInput,
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
    const { publishCountries } = req.body ?? { publishCountries: true };
    logger.debug({ reportId, publishCountries }, 'Publish report request');

    const report = await reportsService.publishReport(reportId, publishCountries);

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

  // ================== ADMIN: Country Responses ==================

  /**
   * GET /api/v1/admin/reports/responses/:responseId
   * Get a country response by ID.
   */
  async getCountryResponseById(req: Request, res: Response): Promise<void> {
    const { responseId } = (req as Request & { validatedParams: CountryResponseIdParam }).validatedParams;
    logger.debug({ responseId }, 'Get country response by ID request');

    const response = await reportsService.getCountryResponseById(responseId);

    res.status(200).json({
      success: true,
      data: { response },
    });
  },

  /**
   * POST /api/v1/admin/reports/responses
   * Create a new country response for a report.
   */
  async createCountryResponse(req: Request<object, object, CreateCountryResponseInput>, res: Response): Promise<void> {
    const input = req.body;
    logger.debug({ reportId: input.reportId, countryId: input.countryId }, 'Create country response request');

    const response = await reportsService.createCountryResponse(input);

    logger.info({ responseId: response.id }, 'Country response created');

    res.status(201).json({
      success: true,
      message: 'Country response created successfully',
      data: { response },
    });
  },

  /**
   * PATCH /api/v1/admin/reports/responses/:responseId
   * Update a country response.
   */
  async updateCountryResponse(req: Request<object, object, UpdateCountryResponseInput>, res: Response): Promise<void> {
    const { responseId } = (req as Request & { validatedParams: CountryResponseIdParam }).validatedParams;
    logger.debug({ responseId, updates: req.body }, 'Update country response request');

    const response = await reportsService.updateCountryResponse(responseId, req.body);

    logger.info({ responseId }, 'Country response updated');

    res.status(200).json({
      success: true,
      message: 'Country response updated successfully',
      data: { response },
    });
  },

  /**
   * POST /api/v1/admin/reports/responses/:responseId/publish
   * Publish or unpublish a country response.
   */
  async publishCountryResponse(req: Request<object, object, PublishCountryResponseInput>, res: Response): Promise<void> {
    const { responseId } = (req as Request & { validatedParams: CountryResponseIdParam }).validatedParams;
    const { publish } = req.body ?? { publish: true };
    logger.debug({ responseId, publish }, 'Publish country response request');

    const response = await reportsService.publishCountryResponse(responseId, publish);

    logger.info({ responseId, publish }, 'Country response publish status updated');

    res.status(200).json({
      success: true,
      message: publish ? 'Country response published successfully' : 'Country response unpublished successfully',
      data: { response },
    });
  },

  /**
   * DELETE /api/v1/admin/reports/responses/:responseId
   * Delete a country response.
   */
  async deleteCountryResponse(req: Request, res: Response): Promise<void> {
    const { responseId } = (req as Request & { validatedParams: CountryResponseIdParam }).validatedParams;
    logger.debug({ responseId }, 'Delete country response request');

    await reportsService.deleteCountryResponse(responseId);

    logger.info({ responseId }, 'Country response deleted');

    res.status(200).json({
      success: true,
      message: 'Country response deleted successfully',
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
   * GET /api/v1/reports/countries/:countryId
   * Get a specific country response from user's report.
   */
  async getUserCountryResponse(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const countryId = req.params.countryId as string;
    logger.debug({ userId, countryId }, 'Get user country response request');

    const response = await reportsService.getUserCountryResponse(userId, countryId);

    if (!response) {
      res.status(404).json({
        success: false,
        error: 'Country response not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { response },
    });
  },
};
