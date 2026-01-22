import { Router, raw } from 'express';
import { paymentsController } from './payments.controller.js';

const router = Router();

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Stripe signature verification
 *
 * This route must be registered BEFORE the global JSON body parser
 * to receive the raw request body for Stripe signature verification.
 */
router.post(
  '/',
  raw({ type: 'application/json' }),
  paymentsController.handleWebhook
);

export const paymentsWebhookRouter = router;
