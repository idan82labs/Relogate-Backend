import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import {
  validateRequest,
  validateQuery,
  validateParams,
} from '../../middleware/validate-request.js';
import {
  createCheckoutSessionSchema,
  getPaymentParamsSchema,
  getUserPaymentsQuerySchema,
  checkPaymentStatusParamsSchema,
} from './payments.schema.js';

const router = Router();

/**
 * @route   GET /api/v1/payments/config
 * @desc    Get Stripe publishable key
 * @access  Public
 */
router.get('/config', paymentsController.getConfig);

// Note: Webhook route is in payments-webhook.routes.ts
// It's registered separately in app.ts before the JSON body parser

// ================== Protected Routes ==================
// All routes below require authentication

/**
 * @route   POST /api/v1/payments/checkout
 * @desc    Create a Stripe Checkout Session
 * @access  Authenticated
 */
router.post(
  '/checkout',
  authenticate,
  validateRequest(createCheckoutSessionSchema),
  paymentsController.createCheckoutSession
);

/**
 * @route   GET /api/v1/payments
 * @desc    Get user's payments
 * @access  Authenticated
 */
router.get(
  '/',
  authenticate,
  validateQuery(getUserPaymentsQuerySchema),
  paymentsController.getUserPayments
);

/**
 * @route   GET /api/v1/payments/status/:productType
 * @desc    Check if user has paid for a product
 * @access  Authenticated
 */
router.get(
  '/status/:productType',
  authenticate,
  validateParams(checkPaymentStatusParamsSchema),
  paymentsController.checkPaymentStatus
);

/**
 * @route   GET /api/v1/payments/:paymentId
 * @desc    Get payment details
 * @access  Authenticated
 */
router.get(
  '/:paymentId',
  authenticate,
  validateParams(getPaymentParamsSchema),
  paymentsController.getPayment
);

export const paymentsRouter = router;
