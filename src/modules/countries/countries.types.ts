import type { CountryCategories } from '../../db/schema/countries.js';

/**
 * Public country representation (for API responses).
 */
export interface PublicCountry {
  id: string;
  code: string;
  name: string;
  englishName: string;
  flagImage: string | null;
  heroImage: string | null;
  introduction: string | null;
  categories: CountryCategories;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Country list item (simplified for lists).
 */
export interface CountryListItem {
  id: string;
  code: string;
  name: string;
  englishName: string;
  flagImage: string | null;
  isActive: boolean;
}

/**
 * Country list response with pagination.
 */
export interface CountryListResponse {
  countries: PublicCountry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Active countries response (for dropdowns/selects).
 */
export interface ActiveCountriesResponse {
  countries: CountryListItem[];
}
