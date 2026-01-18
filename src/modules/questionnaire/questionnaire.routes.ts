import { Router } from 'express';
import { questionnaireController } from './questionnaire.controller.js';
import { validateRequest, validateParams } from '../../middleware/validate-request.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
  createQuestionnaireSchema,
  updateQuestionnaireSchema,
  completeQuestionnaireSchema,
  questionnaireIdParamSchema,
} from './questionnaire.schema.js';

const router = Router();

// All questionnaire routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/questionnaire/status
 * @desc    Check if user has completed onboarding
 * @access  Private
 */
router.get('/status', questionnaireController.getOnboardingStatus);

/**
 * @route   GET /api/v1/questionnaire/version-status
 * @desc    Get questionnaire version status including migration info
 * @access  Private
 */
router.get('/version-status', questionnaireController.getVersionStatus);

/**
 * @route   POST /api/v1/questionnaire/migrate
 * @desc    Initiate migration for a completed questionnaire
 * @access  Private
 */
router.post('/migrate', questionnaireController.migrate);

/**
 * @route   GET /api/v1/questionnaire/completed
 * @desc    Get most recent completed questionnaire with results
 * @access  Private
 */
router.get('/completed', questionnaireController.getCompleted);

/**
 * @route   GET /api/v1/questionnaire/all
 * @desc    Get all questionnaires for user
 * @access  Private
 */
router.get('/all', questionnaireController.getAll);

/**
 * @route   GET /api/v1/questionnaire
 * @desc    Get current in-progress questionnaire or create new one
 * @access  Private
 */
router.get('/', questionnaireController.getCurrent);

/**
 * @route   POST /api/v1/questionnaire
 * @desc    Create a new questionnaire (archives existing in-progress)
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createQuestionnaireSchema),
  questionnaireController.create
);

/**
 * @route   GET /api/v1/questionnaire/:id
 * @desc    Get questionnaire by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(questionnaireIdParamSchema),
  questionnaireController.getById
);

/**
 * @route   PATCH /api/v1/questionnaire/:id
 * @desc    Update questionnaire responses (partial update)
 * @access  Private
 */
router.patch(
  '/:id',
  validateParams(questionnaireIdParamSchema),
  validateRequest(updateQuestionnaireSchema),
  questionnaireController.update
);

/**
 * @route   POST /api/v1/questionnaire/:id/complete
 * @desc    Mark questionnaire as completed
 * @access  Private
 */
router.post(
  '/:id/complete',
  validateParams(questionnaireIdParamSchema),
  validateRequest(completeQuestionnaireSchema),
  questionnaireController.complete
);

/**
 * @route   DELETE /api/v1/questionnaire/:id
 * @desc    Archive a questionnaire
 * @access  Private
 */
router.delete(
  '/:id',
  validateParams(questionnaireIdParamSchema),
  questionnaireController.archive
);

/**
 * @route   POST /api/v1/questionnaire/:id/complete-migration
 * @desc    Complete migration for a questionnaire
 * @access  Private
 */
router.post(
  '/:id/complete-migration',
  validateParams(questionnaireIdParamSchema),
  validateRequest(completeQuestionnaireSchema),
  questionnaireController.completeMigration
);

export const questionnaireRouter = router;
