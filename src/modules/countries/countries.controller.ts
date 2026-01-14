import type { Request, Response } from 'express';
import { countriesService } from './countries.service.js';
import { createModuleLogger } from '../../config/logger.js';
import type {
  ListCountriesQuery,
  CountryIdParam,
  CreateCountryInput,
  UpdateCountryInput,
} from './countries.schema.js';

const logger = createModuleLogger('countries-controller');

/**
 * Countries controller.
 * Handles HTTP request/response for countries endpoints.
 */
export const countriesController = {
  /**
   * GET /api/v1/admin/countries
   * List all countries with pagination and filtering.
   */
  async listCountries(
    req: Request,
    res: Response
  ): Promise<void> {
    const query = (req as Request & { validatedQuery: ListCountriesQuery }).validatedQuery;
    logger.debug({ query }, 'List countries request');

    const result = await countriesService.listCountries(query);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/countries
   * Get all active countries (public endpoint for dropdowns).
   */
  async getActiveCountries(
    _req: Request,
    res: Response
  ): Promise<void> {
    logger.debug('Get active countries request');

    const result = await countriesService.getActiveCountries();

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  /**
   * GET /api/v1/admin/countries/:countryId
   * Get a country by ID.
   */
  async getCountryById(
    req: Request,
    res: Response
  ): Promise<void> {
    const { countryId } = (req as Request & { validatedParams: CountryIdParam }).validatedParams;
    logger.debug({ countryId }, 'Get country by ID request');

    const country = await countriesService.getCountryById(countryId);

    res.status(200).json({
      success: true,
      data: { country },
    });
  },

  /**
   * POST /api/v1/admin/countries
   * Create a new country.
   */
  async createCountry(
    req: Request<object, object, CreateCountryInput>,
    res: Response
  ): Promise<void> {
    const { code, name, englishName } = req.body;
    logger.debug({ code, name, englishName }, 'Create country request');

    const country = await countriesService.createCountry(req.body);

    logger.info({ countryId: country.id, code }, 'Country created');

    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: { country },
    });
  },

  /**
   * PATCH /api/v1/admin/countries/:countryId
   * Update a country.
   */
  async updateCountry(
    req: Request<object, object, UpdateCountryInput>,
    res: Response
  ): Promise<void> {
    const { countryId } = (req as Request & { validatedParams: CountryIdParam }).validatedParams;
    logger.debug({ countryId, updates: req.body }, 'Update country request');

    const country = await countriesService.updateCountry(countryId, req.body);

    logger.info({ countryId }, 'Country updated');

    res.status(200).json({
      success: true,
      message: 'Country updated successfully',
      data: { country },
    });
  },

  /**
   * DELETE /api/v1/admin/countries/:countryId
   * Delete a country.
   */
  async deleteCountry(
    req: Request,
    res: Response
  ): Promise<void> {
    const { countryId } = (req as Request & { validatedParams: CountryIdParam }).validatedParams;
    logger.debug({ countryId }, 'Delete country request');

    await countriesService.deleteCountry(countryId);

    logger.info({ countryId }, 'Country deleted');

    res.status(200).json({
      success: true,
      message: 'Country deleted successfully',
    });
  },
};
