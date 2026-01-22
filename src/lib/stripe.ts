import Stripe from 'stripe';
import { env } from '../config/env.js';
import { createModuleLogger } from '../config/logger.js';

const logger = createModuleLogger('stripe');

/**
 * Check if Stripe is configured.
 */
export const isStripeConfigured = !!env.STRIPE_SECRET_KEY;

if (!isStripeConfigured) {
  logger.warn('STRIPE_SECRET_KEY not configured - payment features will not work');
}

/**
 * Stripe client instance.
 * Used for all Stripe API operations.
 *
 * Note: If STRIPE_SECRET_KEY is not configured, this will be a dummy client
 * that will fail on any API call. Check isStripeConfigured before using.
 */
export const stripe = isStripeConfigured
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : (null as unknown as Stripe); // Type assertion for when Stripe is not configured

/**
 * Product configuration for Relogate.
 * Prices are in agorot (smallest ILS unit) - 990 = 9.90 ILS for testing.
 */
export const PRODUCTS = {
  RELOMATCH_REPORT: {
    name: 'דו״ח Relomatch',
    description: 'דו״ח התאמה מקיף ומקצועי לרילוקיישן',
    priceInAgorot: 990, // 9.90 ILS for testing
    type: 'relomatch_report' as const,
  },
  CONSULTATION: {
    name: 'שיחת ייעוץ',
    description: 'שיחת ייעוץ עם מומחים ישראלים מקומיים',
    priceInAgorot: 990, // 9.90 ILS for testing
    type: 'consultation' as const,
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
export type ProductType = typeof PRODUCTS[ProductKey]['type'];
