import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { userProfiles } from './users.js';
import { questionnaireResponses } from './questionnaires.js';

/**
 * Payment status enum
 */
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'expired',
  'refunded',
  'disputed',
]);

/**
 * Product type enum
 */
export const productTypeEnum = pgEnum('product_type', [
  'relomatch_report',
  'consultation',
]);

/**
 * Payments table.
 *
 * Stores payment records for Stripe transactions.
 */
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Relations
  userId: uuid('user_id')
    .notNull()
    .references(() => userProfiles.id, { onDelete: 'cascade' }),
  questionnaireResponseId: uuid('questionnaire_response_id')
    .references(() => questionnaireResponses.id, { onDelete: 'set null' }),

  // Stripe references
  stripeCustomerId: text('stripe_customer_id'),
  stripeCheckoutSessionId: text('stripe_checkout_session_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),

  // Payment details
  amount: integer('amount').notNull(), // In agorot (smallest unit)
  currency: text('currency').notNull().default('ILS'),
  status: paymentStatusEnum('status').notNull().default('pending'),

  // Product info
  productType: productTypeEnum('product_type').notNull(),
  productName: text('product_name').notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  refundedAt: timestamp('refunded_at', { mode: 'date' }),

  // Metadata
  metadata: text('metadata'), // JSON string for extra data
});

// Type inference
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
