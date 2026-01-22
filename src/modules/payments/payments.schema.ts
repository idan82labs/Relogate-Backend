import { z } from 'zod';

/**
 * Create checkout session request schema.
 */
export const createCheckoutSessionSchema = z.object({
  productType: z.enum(['relomatch_report', 'consultation']),
  questionnaireResponseId: z.string().uuid().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * Get payment by ID params schema.
 */
export const getPaymentParamsSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
});

/**
 * Get user payments query schema.
 */
export const getUserPaymentsQuerySchema = z.object({
  status: z
    .enum(['pending', 'completed', 'failed', 'expired', 'refunded', 'disputed'])
    .optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * Check payment status params schema.
 */
export const checkPaymentStatusParamsSchema = z.object({
  productType: z.enum(['relomatch_report', 'consultation']),
});

// Infer TypeScript types from schemas
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
export type GetPaymentParams = z.infer<typeof getPaymentParamsSchema>;
export type GetUserPaymentsQuery = z.infer<typeof getUserPaymentsQuerySchema>;
export type CheckPaymentStatusParams = z.infer<typeof checkPaymentStatusParamsSchema>;
