import type { Country, NewCountry, CountryCategories } from '../../src/db/schema/countries.js';
import type { ListCountriesQuery } from '../../src/modules/countries/countries.schema.js';

/**
 * Valid country data for testing
 */
export const validCountryData: NewCountry = {
  code: 'PT',
  name: 'פורטוגל',
  englishName: 'Portugal',
  flagImage: '/flags/pt.svg',
  heroImage: '/images/portugal-hero.jpg',
  introduction: 'פורטוגל היא יעד מבוקש להגירה בזכות אקלים נוח ואיכות חיים גבוהה.',
  categories: {
    general: 'מידע כללי על פורטוגל',
    visa: 'מידע על ויזות ומסלולי הגירה',
    healthcare: 'מערכת הבריאות בפורטוגל',
    education: 'מערכת החינוך',
  },
  isActive: true,
};

/**
 * Create mock country with overrides
 */
export const createMockCountry = (overrides: Partial<Country> = {}): Country => ({
  id: 'country-uuid-123',
  code: 'PT',
  name: 'פורטוגל',
  englishName: 'Portugal',
  flagImage: '/flags/pt.svg',
  heroImage: '/images/portugal-hero.jpg',
  introduction: 'פורטוגל היא יעד מבוקש להגירה.',
  categories: {},
  isActive: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

/**
 * Sample countries for testing
 */
export const sampleCountries: NewCountry[] = [
  {
    code: 'PT',
    name: 'פורטוגל',
    englishName: 'Portugal',
    isActive: true,
    categories: {},
  },
  {
    code: 'CA',
    name: 'קנדה',
    englishName: 'Canada',
    isActive: true,
    categories: {},
  },
  {
    code: 'ES',
    name: 'ספרד',
    englishName: 'Spain',
    isActive: true,
    categories: {},
  },
];

/**
 * Complete category data for testing
 */
export const fullCategories: CountryCategories = {
  general: 'מידע כללי',
  visa: 'מסלול ויזה',
  language: 'שפה ומזג אויר',
  safety: 'ביטחון אישי',
  jewish: 'קהילה יהודית וישראלית',
  openness: 'פתיחות למהגרים',
  healthcare: 'מערכת בריאות',
  education: 'חינוך',
  employment: 'תעסוקה',
  transport: 'תחבורה ציבורית',
  cost: 'יוקר מחייה',
  distance: 'מרחק מישראל',
  community: 'קהילה',
};

/**
 * Create mock list countries query with defaults
 */
export const createMockListCountriesQuery = (
  overrides: Partial<ListCountriesQuery> = {}
): ListCountriesQuery => ({
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...overrides,
});
