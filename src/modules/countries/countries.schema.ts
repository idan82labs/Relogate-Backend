import { z } from 'zod';

/**
 * Country code validation (ISO 3166-1 alpha-2/3).
 */
const countryCodeSchema = z
  .string()
  .min(2, 'Country code must be at least 2 characters')
  .max(3, 'Country code must not exceed 3 characters')
  .regex(/^[A-Z]+$/, 'Country code must be uppercase letters only')
  .transform((code) => code.toUpperCase());

/**
 * Category content schema.
 * All fields are optional rich text.
 */
const categoriesSchema = z.object({
  general: z.string().optional(),
  visa: z.string().optional(),
  language: z.string().optional(),
  safety: z.string().optional(),
  jewish: z.string().optional(),
  openness: z.string().optional(),
  healthcare: z.string().optional(),
  education: z.string().optional(),
  employment: z.string().optional(),
  transport: z.string().optional(),
  cost: z.string().optional(),
  distance: z.string().optional(),
  community: z.string().optional(),
}).default({});

/**
 * List countries query params schema.
 */
export const listCountriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().max(100).optional(),
  isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  sortBy: z.enum(['createdAt', 'name', 'englishName', 'code']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Country ID param schema.
 */
export const countryIdParamSchema = z.object({
  countryId: z.string().uuid('Invalid country ID'),
});

/**
 * Create country schema (admin).
 */
export const createCountrySchema = z.object({
  code: countryCodeSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  englishName: z
    .string()
    .min(1, 'English name is required')
    .max(100, 'English name must not exceed 100 characters')
    .trim(),
  flagImage: z
    .string()
    .url('Invalid flag image URL')
    .max(500, 'Flag image URL must not exceed 500 characters')
    .optional()
    .nullable(),
  heroImage: z
    .string()
    .url('Invalid hero image URL')
    .max(500, 'Hero image URL must not exceed 500 characters')
    .optional()
    .nullable(),
  introduction: z
    .string()
    .max(5000, 'Introduction must not exceed 5000 characters')
    .optional()
    .nullable(),
  categories: categoriesSchema,
  isActive: z.boolean().default(true),
});

/**
 * Update country schema (admin).
 * All fields are optional for partial updates.
 */
export const updateCountrySchema = z.object({
  code: countryCodeSchema.optional(),
  name: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  englishName: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  flagImage: z
    .string()
    .url('Invalid flag image URL')
    .max(500)
    .nullable()
    .optional(),
  heroImage: z
    .string()
    .url('Invalid hero image URL')
    .max(500)
    .nullable()
    .optional(),
  introduction: z
    .string()
    .max(5000)
    .nullable()
    .optional(),
  categories: categoriesSchema.optional(),
  isActive: z.boolean().optional(),
});

// Infer TypeScript types from schemas
export type ListCountriesQuery = z.infer<typeof listCountriesQuerySchema>;
export type CountryIdParam = z.infer<typeof countryIdParamSchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>;
