import { eq, desc, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { payments, type Payment } from '../../db/schema/payments.js';
import { userProfiles } from '../../db/schema/users.js';
import { stripe, PRODUCTS, isStripeConfigured } from '../../lib/stripe.js';
import { env } from '../../config/env.js';
import { createModuleLogger } from '../../config/logger.js';
import { NotFoundError, BadRequestError, ServiceUnavailableError } from '../../lib/errors.js';
import type Stripe from 'stripe';
import type {
  CreateCheckoutSessionInput,
  GetUserPaymentsQuery,
} from './payments.schema.js';

const logger = createModuleLogger('payments-service');

/**
 * Helper to check if Stripe is available.
 * Throws ServiceUnavailableError if not configured.
 */
function ensureStripeConfigured(): void {
  if (!isStripeConfigured) {
    throw new ServiceUnavailableError('Payment service is not configured');
  }
}

/**
 * Payments service.
 * Handles all payment-related business logic.
 */
export const paymentsService = {
  /**
   * Create or get Stripe customer for user.
   *
   * @param userId - User ID
   * @param email - User email
   * @returns Stripe customer ID
   */
  async getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    ensureStripeConfigured();
    // Check if user already has a Stripe customer ID
    const [user] = await db
      .select({
        stripeCustomerId: userProfiles.stripeCustomerId,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
      })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId));

    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const fullName = user ? `${user.firstName} ${user.lastName}` : undefined;
    const customer = await stripe.customers.create({
      email,
      name: fullName,
      metadata: { userId },
    });

    // Save customer ID to user profile
    await db
      .update(userProfiles)
      .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(userProfiles.id, userId));

    logger.info({ userId, stripeCustomerId: customer.id }, 'Created Stripe customer');
    return customer.id;
  },

  /**
   * Create Stripe Checkout Session.
   *
   * @param userId - User ID
   * @param email - User email
   * @param input - Checkout session input
   * @returns Session ID and URL
   */
  async createCheckoutSession(
    userId: string,
    email: string,
    input: CreateCheckoutSessionInput
  ): Promise<{ sessionId: string; url: string }> {
    const productKey = input.productType === 'relomatch_report'
      ? 'RELOMATCH_REPORT'
      : 'CONSULTATION';
    const product = PRODUCTS[productKey];

    // Get or create Stripe customer
    const stripeCustomerId = await this.getOrCreateStripeCustomer(userId, email);

    // Create payment record
    const [payment] = await db.insert(payments).values({
      userId,
      questionnaireResponseId: input.questionnaireResponseId || null,
      stripeCustomerId,
      amount: product.priceInAgorot,
      currency: 'ILS',
      status: 'pending',
      productType: input.productType,
      productName: product.name,
    }).returning();

    if (!payment) {
      throw new BadRequestError('Failed to create payment record');
    }

    // Determine URLs
    const baseUrl = env.CORS_ORIGIN || 'http://localhost:3000';
    const successUrl = input.successUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = input.cancelUrl || `${baseUrl}/checkout/cancel`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ILS',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.priceInAgorot,
          },
          quantity: 1,
        },
      ],
      metadata: {
        paymentId: payment.id,
        userId,
        productType: input.productType,
        questionnaireResponseId: input.questionnaireResponseId || '',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Note: Stripe will use browser locale for Hebrew users
    });

    // Update payment with session ID
    await db
      .update(payments)
      .set({
        stripeCheckoutSessionId: session.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    logger.info({ paymentId: payment.id, sessionId: session.id }, 'Created checkout session');

    if (!session.url) {
      throw new BadRequestError('Failed to create checkout session URL');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  },

  /**
   * Handle Stripe webhook events.
   *
   * @param event - Stripe event
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    ensureStripeConfigured();
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutExpired(session);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await this.handleChargeRefunded(charge);
        break;
      }
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await this.handleDisputeCreated(dispute);
        break;
      }
      default:
        logger.debug({ eventType: event.type }, 'Unhandled webhook event');
    }
  },

  /**
   * Handle checkout.session.completed event.
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) {
      logger.warn({ sessionId: session.id }, 'Checkout completed without paymentId in metadata');
      return;
    }

    await db
      .update(payments)
      .set({
        status: 'completed',
        stripePaymentIntentId: session.payment_intent as string,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    logger.info({ paymentId, sessionId: session.id }, 'Payment completed');
  },

  /**
   * Handle checkout.session.expired event.
   */
  async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) return;

    await db
      .update(payments)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(payments.id, paymentId));

    logger.info({ paymentId, sessionId: session.id }, 'Checkout session expired');
  },

  /**
   * Handle charge.refunded event.
   */
  async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) return;

    await db
      .update(payments)
      .set({
        status: 'refunded',
        refundedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.stripePaymentIntentId, paymentIntentId));

    logger.info({ paymentIntentId }, 'Payment refunded');
  },

  /**
   * Handle charge.dispute.created event.
   */
  async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    const paymentIntentId = dispute.payment_intent as string;
    if (!paymentIntentId) return;

    await db
      .update(payments)
      .set({ status: 'disputed', updatedAt: new Date() })
      .where(eq(payments.stripePaymentIntentId, paymentIntentId));

    logger.info({ paymentIntentId, disputeId: dispute.id }, 'Payment disputed');
  },

  /**
   * Get payment by ID.
   *
   * @param paymentId - Payment ID
   * @param userId - Optional user ID to restrict access
   * @returns Payment record
   * @throws NotFoundError if payment not found
   */
  async getPaymentById(paymentId: string, userId?: string): Promise<Payment> {
    const conditions = [eq(payments.id, paymentId)];
    if (userId) {
      conditions.push(eq(payments.userId, userId));
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(and(...conditions));

    if (!payment) {
      throw new NotFoundError('Payment');
    }

    return payment;
  },

  /**
   * Get user's payments.
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns Payments and total count
   */
  async getUserPayments(
    userId: string,
    query: GetUserPaymentsQuery
  ): Promise<{ payments: Payment[]; total: number }> {
    const conditions = [eq(payments.userId, userId)];
    if (query.status) {
      conditions.push(eq(payments.status, query.status));
    }

    const [result, countResult] = await Promise.all([
      db
        .select()
        .from(payments)
        .where(and(...conditions))
        .orderBy(desc(payments.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      db
        .select()
        .from(payments)
        .where(and(...conditions)),
    ]);

    return {
      payments: result,
      total: countResult.length,
    };
  },

  /**
   * Check if user has paid for a specific product.
   *
   * @param userId - User ID
   * @param productType - Product type
   * @returns True if user has a completed payment
   */
  async hasUserPaid(
    userId: string,
    productType: 'relomatch_report' | 'consultation'
  ): Promise<boolean> {
    const [payment] = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.productType, productType),
          eq(payments.status, 'completed')
        )
      )
      .limit(1);

    return !!payment;
  },

  /**
   * Get Stripe publishable key for frontend.
   *
   * @returns Stripe publishable key
   */
  getPublishableKey(): string {
    return env.STRIPE_PUBLISHABLE_KEY;
  },
};
