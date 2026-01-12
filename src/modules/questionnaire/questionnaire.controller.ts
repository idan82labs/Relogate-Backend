import type { Request, Response } from 'express';
import { questionnaireService } from './questionnaire.service.js';
import type {
  CreateQuestionnaireInput,
  UpdateQuestionnaireInput,
  CompleteQuestionnaireInput,
} from './questionnaire.schema.js';
import { UnauthorizedError } from '../../lib/errors.js';

/**
 * Questionnaire controller.
 * Handles HTTP request/response for questionnaire endpoints.
 */
export const questionnaireController = {
  /**
   * GET /api/v1/questionnaire
   * Get current in-progress questionnaire or create new one.
   */
  async getCurrent(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const questionnaire = await questionnaireService.getOrCreate(userId);

    res.status(200).json({
      success: true,
      data: { questionnaire },
    });
  },

  /**
   * POST /api/v1/questionnaire
   * Create a new questionnaire (archives existing in-progress).
   */
  async create(
    req: Request<object, object, CreateQuestionnaireInput>,
    res: Response
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const questionnaire = await questionnaireService.create(userId, req.body);

    res.status(201).json({
      success: true,
      data: { questionnaire },
    });
  },

  /**
   * GET /api/v1/questionnaire/:id
   * Get questionnaire by ID.
   */
  async getById(req: Request<{ id: string }>, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const questionnaire = await questionnaireService.getById(req.params.id, userId);

    res.status(200).json({
      success: true,
      data: { questionnaire },
    });
  },

  /**
   * PATCH /api/v1/questionnaire/:id
   * Update questionnaire responses (partial update).
   */
  async update(
    req: Request<{ id: string }, object, UpdateQuestionnaireInput>,
    res: Response
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const questionnaire = await questionnaireService.update(
      req.params.id,
      userId,
      req.body
    );

    res.status(200).json({
      success: true,
      data: { questionnaire },
    });
  },

  /**
   * POST /api/v1/questionnaire/:id/complete
   * Mark questionnaire as completed.
   */
  async complete(
    req: Request<{ id: string }, object, CompleteQuestionnaireInput>,
    res: Response
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const questionnaire = await questionnaireService.complete(
      req.params.id,
      userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Questionnaire completed successfully',
      data: { questionnaire },
    });
  },

  /**
   * GET /api/v1/questionnaire/completed
   * Get user's most recent completed questionnaire with results.
   */
  async getCompleted(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const questionnaire = await questionnaireService.getCompletedWithResults(userId);

    res.status(200).json({
      success: true,
      data: { questionnaire },
    });
  },

  /**
   * GET /api/v1/questionnaire/all
   * Get all questionnaires for user.
   */
  async getAll(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const questionnaires = await questionnaireService.getAllForUser(userId);

    res.status(200).json({
      success: true,
      data: { questionnaires },
    });
  },

  /**
   * DELETE /api/v1/questionnaire/:id
   * Archive a questionnaire.
   */
  async archive(req: Request<{ id: string }>, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    await questionnaireService.archive(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: 'Questionnaire archived',
    });
  },

  /**
   * GET /api/v1/questionnaire/status
   * Check if user has completed onboarding.
   */
  async getOnboardingStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const hasCompleted = await questionnaireService.hasCompletedOnboarding(userId);

    res.status(200).json({
      success: true,
      data: {
        hasCompletedOnboarding: hasCompleted,
      },
    });
  },
};
