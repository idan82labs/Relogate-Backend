import type { Request, Response } from 'express';
import { paymentsService } from './payments.service.js';
import { stripe, isStripeConfigured } from '../../lib/stripe.js';
import { env } from '../../config/env.js';
import { createModuleLogger } from '../../config/logger.js';
import { BadRequestError, UnauthorizedError, ServiceUnavailableError } from '../../lib/errors.js';
import type {
  CreateCheckoutSessionInput,
  GetPaymentParams,
  GetUserPaymentsQuery,
  CheckPaymentStatusParams,
} from './payments.schema.js';

const logger = createModuleLogger('payments-controller');

/**
 * Payments controller.
 * Handles HTTP request/response for payment endpoints.
 */
export const paymentsController = {
  /**
   * POST /payments/checkout
   * Create a Stripe Checkout Session.
   */
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      throw new UnauthorizedError('User not authenticated');
    }

    const input = req.body as CreateCheckoutSessionInput;
    logger.debug({ userId, productType: input.productType }, 'Creating checkout session');

    const result = await paymentsService.createCheckoutSession(userId, email, input);

    logger.info({ userId, sessionId: result.sessionId }, 'Checkout session created');

    res.json({
      success: true,
      data: result,
    });
  },

  /**
   * POST /payments/webhook
   * Handle Stripe webhook events.
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    if (!isStripeConfigured) {
      throw new ServiceUnavailableError('Payment service is not configured');
    }

    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      throw new BadRequestError('Missing stripe-signature header');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, // Raw body
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ error: message }, 'Webhook signature verification failed');
      throw new BadRequestError(`Webhook signature verification failed: ${message}`);
    }

    logger.debug({ eventType: event.type }, 'Processing webhook event');

    await paymentsService.handleWebhookEvent(event);

    res.json({ received: true });
  },

  /**
   * GET /payments/config
   * Get Stripe publishable key.
   */
  async getConfig(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        publishableKey: paymentsService.getPublishableKey(),
      },
    });
  },

  /**
   * GET /payments/:paymentId
   * Get payment details.
   */
  async getPayment(req: Request, res: Response): Promise<void> {
    const { paymentId } = (req as Request & { validatedParams: GetPaymentParams }).validatedParams;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    logger.debug({ paymentId, userId }, 'Getting payment details');

    const payment = await paymentsService.getPaymentById(paymentId, userId);

    res.json({
      success: true,
      data: payment,
    });
  },

  /**
   * GET /payments
   * Get user's payments.
   */
  async getUserPayments(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const query = (req as Request & { validatedQuery: GetUserPaymentsQuery }).validatedQuery;
    logger.debug({ userId, query }, 'Getting user payments');

    const result = await paymentsService.getUserPayments(userId, query);

    res.json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /payments/status/:productType
   * Check if user has paid for a product.
   */
  async checkPaymentStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const { productType } = (req as Request & { validatedParams: CheckPaymentStatusParams }).validatedParams;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    logger.debug({ userId, productType }, 'Checking payment status');

    const hasPaid = await paymentsService.hasUserPaid(userId, productType);

    res.json({
      success: true,
      data: { hasPaid },
    });
  },
};
