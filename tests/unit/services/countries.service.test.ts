import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock logger module before importing service
vi.mock('../../../src/config/logger.js', () => ({
  createModuleLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock database module
vi.mock('../../../src/db/index.js', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([])),
            })),
          })),
          limit: vi.fn(() => Promise.resolve([])),
        })),
        orderBy: vi.fn(() => Promise.resolve([])),
        limit: vi.fn(() => ({
          offset: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

// Import modules after mocking
import { db } from '../../../src/db/index.js';
import { countriesService } from '../../../src/modules/countries/countries.service.js';
import { NotFoundError, ConflictError } from '../../../src/lib/errors.js';
import { createMockCountry, createMockListCountriesQuery } from '../../fixtures/countries.js';

describe('CountriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCountries', () => {
    it('should return paginated list of countries', async () => {
      const mockCountries = [
        createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל' }),
        createMockCountry({ id: '2', code: 'CA', name: 'קנדה' }),
      ];

      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve(mockCountries)),
              })),
            })),
          })),
        })),
      };

      const mockCountChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ count: 2 }])),
        })),
      };

      vi.mocked(db.select)
        .mockImplementationOnce(() => mockCountChain as ReturnType<typeof db.select>)
        .mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);

      const query = createMockListCountriesQuery();
      const result = await countriesService.listCountries(query);

      expect(result.countries).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should return empty list when no countries found', async () => {
      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => Promise.resolve([])),
              })),
            })),
          })),
        })),
      };

      const mockCountChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ count: 0 }])),
        })),
      };

      vi.mocked(db.select)
        .mockImplementationOnce(() => mockCountChain as ReturnType<typeof db.select>)
        .mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);

      const query = createMockListCountriesQuery();
      const result = await countriesService.listCountries(query);

      expect(result.countries).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getActiveCountries', () => {
    it('should return list of active countries sorted by name', async () => {
      const mockCountries = [
        createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל', isActive: true }),
        createMockCountry({ id: '2', code: 'CA', name: 'קנדה', isActive: true }),
      ];

      const mockChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve(mockCountries)),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockChain as ReturnType<typeof db.select>);

      const result = await countriesService.getActiveCountries();

      expect(result.countries).toHaveLength(2);
      expect(result.countries[0]).toHaveProperty('code', 'PT');
      expect(result.countries[0]).not.toHaveProperty('introduction');
    });

    it('should return empty list when no active countries', async () => {
      const mockChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => Promise.resolve([])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockChain as ReturnType<typeof db.select>);

      const result = await countriesService.getActiveCountries();

      expect(result.countries).toHaveLength(0);
    });
  });

  describe('getCountryById', () => {
    it('should return country when found', async () => {
      const mockCountry = createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל' });

      const mockChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockCountry])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockChain as ReturnType<typeof db.select>);

      const result = await countriesService.getCountryById('1');

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('code', 'PT');
      expect(result).toHaveProperty('name', 'פורטוגל');
    });

    it('should throw NotFoundError when country not found', async () => {
      const mockChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockChain as ReturnType<typeof db.select>);

      await expect(countriesService.getCountryById('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCountryByCode', () => {
    it('should return country when found by code', async () => {
      const mockCountry = createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל' });

      const mockChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockCountry])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockChain as ReturnType<typeof db.select>);

      const result = await countriesService.getCountryByCode('PT');

      expect(result).toHaveProperty('code', 'PT');
    });

    it('should normalize code to uppercase', async () => {
      const mockCountry = createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל' });

      const mockChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockCountry])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockChain as ReturnType<typeof db.select>);

      const result = await countriesService.getCountryByCode('pt');

      expect(result).toHaveProperty('code', 'PT');
    });

    it('should throw NotFoundError when country code not found', async () => {
      const mockChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockChain as ReturnType<typeof db.select>);

      await expect(countriesService.getCountryByCode('XX')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createCountry', () => {
    it('should create country successfully when code is unique', async () => {
      const mockNewCountry = createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל' });

      // Mock check for existing
      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      };

      // Mock insert
      const mockInsertChain = {
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockNewCountry])),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);
      vi.mocked(db.insert).mockImplementationOnce(() => mockInsertChain as ReturnType<typeof db.insert>);

      const input = {
        code: 'PT',
        name: 'פורטוגל',
        englishName: 'Portugal',
        isActive: true,
      };

      const result = await countriesService.createCountry(input);

      expect(result).toHaveProperty('code', 'PT');
      expect(result).toHaveProperty('name', 'פורטוגל');
    });

    it('should throw ConflictError when country code already exists', async () => {
      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: 'existing' }])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);

      const input = {
        code: 'PT',
        name: 'פורטוגל',
        englishName: 'Portugal',
        isActive: true,
      };

      await expect(countriesService.createCountry(input)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateCountry', () => {
    it('should update country successfully', async () => {
      const mockExisting = createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל' });
      const mockUpdated = createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל חדש' });

      // Mock check for existing
      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockExisting])),
          })),
        })),
      };

      // Mock update
      const mockUpdateChain = {
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => Promise.resolve([mockUpdated])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);
      vi.mocked(db.update).mockImplementationOnce(() => mockUpdateChain as ReturnType<typeof db.update>);

      const result = await countriesService.updateCountry('1', { name: 'פורטוגל חדש' });

      expect(result).toHaveProperty('name', 'פורטוגל חדש');
    });

    it('should throw NotFoundError when updating non-existent country', async () => {
      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);

      await expect(countriesService.updateCountry('nonexistent', { name: 'New' })).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing code', async () => {
      const mockExisting = createMockCountry({ id: '1', code: 'PT', name: 'פורטוגל' });

      // Mock check for existing country
      const mockSelectExisting = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockExisting])),
          })),
        })),
      };

      // Mock check for code conflict
      const mockSelectConflict = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: 'other' }])),
          })),
        })),
      };

      vi.mocked(db.select)
        .mockImplementationOnce(() => mockSelectExisting as ReturnType<typeof db.select>)
        .mockImplementationOnce(() => mockSelectConflict as ReturnType<typeof db.select>);

      await expect(countriesService.updateCountry('1', { code: 'CA' })).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteCountry', () => {
    it('should delete country successfully', async () => {
      // Mock check for existing
      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: '1' }])),
          })),
        })),
      };

      // Mock delete
      const mockDeleteChain = {
        where: vi.fn(() => Promise.resolve()),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);
      vi.mocked(db.delete).mockImplementationOnce(() => mockDeleteChain as ReturnType<typeof db.delete>);

      await expect(countriesService.deleteCountry('1')).resolves.toBeUndefined();
    });

    it('should throw NotFoundError when deleting non-existent country', async () => {
      const mockSelectChain = {
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      };

      vi.mocked(db.select).mockImplementationOnce(() => mockSelectChain as ReturnType<typeof db.select>);

      await expect(countriesService.deleteCountry('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});
