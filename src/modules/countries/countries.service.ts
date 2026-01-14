import { eq, desc, asc, or, ilike, count, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { countries } from '../../db/schema/index.js';
import { createModuleLogger } from '../../config/logger.js';
import {
  NotFoundError,
  ConflictError,
} from '../../lib/errors.js';
import type {
  PublicCountry,
  CountryListItem,
  CountryListResponse,
  ActiveCountriesResponse,
} from './countries.types.js';
import type {
  ListCountriesQuery,
  CreateCountryInput,
  UpdateCountryInput,
} from './countries.schema.js';

const logger = createModuleLogger('countries-service');

/**
 * Helper to map database country to PublicCountry.
 */
function toPublicCountry(country: typeof countries.$inferSelect): PublicCountry {
  return {
    id: country.id,
    code: country.code,
    name: country.name,
    englishName: country.englishName,
    flagImage: country.flagImage,
    heroImage: country.heroImage,
    introduction: country.introduction,
    categories: country.categories,
    isActive: country.isActive,
    createdAt: country.createdAt.toISOString(),
    updatedAt: country.updatedAt.toISOString(),
  };
}

/**
 * Helper to map database country to CountryListItem.
 */
function toCountryListItem(country: typeof countries.$inferSelect): CountryListItem {
  return {
    id: country.id,
    code: country.code,
    name: country.name,
    englishName: country.englishName,
    flagImage: country.flagImage,
    isActive: country.isActive,
  };
}

/**
 * Countries service.
 * Provides CRUD operations for the countries catalog.
 */
export const countriesService = {
  /**
   * List all countries with pagination, search, and filtering.
   *
   * @param query - Query parameters for pagination and filtering
   * @returns Paginated list of countries
   */
  async listCountries(query: ListCountriesQuery): Promise<CountryListResponse> {
    const { page, limit, search, isActive, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    logger.debug({ query }, 'Listing countries');

    // Build where conditions
    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(countries.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          ilike(countries.name, `%${search}%`),
          ilike(countries.englishName, `%${search}%`),
          ilike(countries.code, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by
    const sortColumn = {
      createdAt: countries.createdAt,
      name: countries.name,
      englishName: countries.englishName,
      code: countries.code,
    }[sortBy];

    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(countries)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Get paginated countries
    const countryList = await db
      .select()
      .from(countries)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    logger.info({ page, limit, total, count: countryList.length }, 'Countries listed');

    return {
      countries: countryList.map(toPublicCountry),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get all active countries (for dropdowns/selects).
   *
   * @returns List of active countries
   */
  async getActiveCountries(): Promise<ActiveCountriesResponse> {
    logger.debug('Getting active countries');

    const countryList = await db
      .select()
      .from(countries)
      .where(eq(countries.isActive, true))
      .orderBy(asc(countries.name));

    logger.info({ count: countryList.length }, 'Active countries retrieved');

    return {
      countries: countryList.map(toCountryListItem),
    };
  },

  /**
   * Get a country by ID.
   *
   * @param countryId - The country ID
   * @returns Country details
   * @throws NotFoundError if country not found
   */
  async getCountryById(countryId: string): Promise<PublicCountry> {
    logger.debug({ countryId }, 'Getting country by ID');

    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);

    if (!country) {
      throw new NotFoundError('Country');
    }

    logger.info({ countryId }, 'Country retrieved');

    return toPublicCountry(country);
  },

  /**
   * Get a country by code.
   *
   * @param code - The country code (e.g., 'PT', 'CA')
   * @returns Country details
   * @throws NotFoundError if country not found
   */
  async getCountryByCode(code: string): Promise<PublicCountry> {
    logger.debug({ code }, 'Getting country by code');

    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.code, code.toUpperCase()))
      .limit(1);

    if (!country) {
      throw new NotFoundError('Country');
    }

    logger.info({ code }, 'Country retrieved by code');

    return toPublicCountry(country);
  },

  /**
   * Create a new country.
   *
   * @param input - Country creation data
   * @returns Created country
   * @throws ConflictError if country code already exists
   */
  async createCountry(input: CreateCountryInput): Promise<PublicCountry> {
    const { code, name, englishName, flagImage, heroImage, introduction, categories, isActive } = input;

    logger.debug({ code, name }, 'Creating new country');

    // Check if country code already exists
    const [existing] = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.code, code))
      .limit(1);

    if (existing) {
      throw new ConflictError('Country with this code already exists');
    }

    // Create country
    const [newCountry] = await db
      .insert(countries)
      .values({
        code,
        name,
        englishName,
        flagImage: flagImage ?? null,
        heroImage: heroImage ?? null,
        introduction: introduction ?? null,
        categories: categories ?? {},
        isActive,
      })
      .returning();

    if (!newCountry) {
      throw new Error('Failed to create country');
    }

    logger.info({ countryId: newCountry.id, code }, 'Country created successfully');

    return toPublicCountry(newCountry);
  },

  /**
   * Update a country.
   *
   * @param countryId - The country ID
   * @param input - Update data
   * @returns Updated country
   * @throws NotFoundError if country not found
   * @throws ConflictError if new code already exists
   */
  async updateCountry(countryId: string, input: UpdateCountryInput): Promise<PublicCountry> {
    logger.debug({ countryId, input }, 'Updating country');

    // Check if country exists
    const [existing] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Country');
    }

    // If code is being changed, check for conflicts
    if (input.code && input.code !== existing.code) {
      const [codeConflict] = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.code, input.code))
        .limit(1);

      if (codeConflict) {
        throw new ConflictError('Country with this code already exists');
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.code !== undefined) updateData.code = input.code;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.englishName !== undefined) updateData.englishName = input.englishName;
    if (input.flagImage !== undefined) updateData.flagImage = input.flagImage;
    if (input.heroImage !== undefined) updateData.heroImage = input.heroImage;
    if (input.introduction !== undefined) updateData.introduction = input.introduction;
    if (input.categories !== undefined) updateData.categories = input.categories;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    // Update country
    const [updatedCountry] = await db
      .update(countries)
      .set(updateData)
      .where(eq(countries.id, countryId))
      .returning();

    if (!updatedCountry) {
      throw new Error('Failed to update country');
    }

    logger.info({ countryId }, 'Country updated successfully');

    return toPublicCountry(updatedCountry);
  },

  /**
   * Delete a country.
   * Note: This is a hard delete. Consider soft delete (isActive = false) for production.
   *
   * @param countryId - The country ID
   * @throws NotFoundError if country not found
   */
  async deleteCountry(countryId: string): Promise<void> {
    logger.debug({ countryId }, 'Deleting country');

    // Check if country exists
    const [existing] = await db
      .select({ id: countries.id })
      .from(countries)
      .where(eq(countries.id, countryId))
      .limit(1);

    if (!existing) {
      throw new NotFoundError('Country');
    }

    // Delete country
    await db.delete(countries).where(eq(countries.id, countryId));

    logger.info({ countryId }, 'Country deleted successfully');
  },
};
