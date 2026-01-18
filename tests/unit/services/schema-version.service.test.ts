import { describe, it, expect } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  REQUIRED_FIELDS_BY_VERSION,
  V2_NEW_REQUIRED_FIELDS,
  isQuestionnaireOutdated,
  getMissingFields,
  getNewRequiredFieldsForMigration,
  requiresResubmission,
  getQuestionnaireVersionStatus,
} from '../../../src/modules/questionnaire/schema-version.service.js';
import type { QuestionnaireResponses } from '../../../src/db/schema/questionnaires.js';

describe('Schema Version Service', () => {
  describe('Constants', () => {
    it('should have CURRENT_SCHEMA_VERSION set to 2', () => {
      expect(CURRENT_SCHEMA_VERSION).toBe(2);
    });

    it('should have required fields for version 1', () => {
      expect(REQUIRED_FIELDS_BY_VERSION[1]).toBeDefined();
      expect(REQUIRED_FIELDS_BY_VERSION[1]).toContain('preferredCountries');
      expect(REQUIRED_FIELDS_BY_VERSION[1]).toContain('personalDetails.fullName');
    });

    it('should have required fields for version 2', () => {
      expect(REQUIRED_FIELDS_BY_VERSION[2]).toBeDefined();
      expect(REQUIRED_FIELDS_BY_VERSION[2]).toContain('personalDetails.birthDate');
      expect(REQUIRED_FIELDS_BY_VERSION[2]).toContain('relocationReasons');
      expect(REQUIRED_FIELDS_BY_VERSION[2]).toContain('citizenships');
    });

    it('should have V2_NEW_REQUIRED_FIELDS defined', () => {
      expect(V2_NEW_REQUIRED_FIELDS).toBeDefined();
      expect(V2_NEW_REQUIRED_FIELDS.length).toBeGreaterThan(0);
      expect(V2_NEW_REQUIRED_FIELDS).toContain('personalDetails.birthDate');
      expect(V2_NEW_REQUIRED_FIELDS).toContain('employment.employmentStatus');
    });
  });

  describe('isQuestionnaireOutdated', () => {
    it('should return true for version 1', () => {
      expect(isQuestionnaireOutdated(1)).toBe(true);
    });

    it('should return false for current version', () => {
      expect(isQuestionnaireOutdated(CURRENT_SCHEMA_VERSION)).toBe(false);
    });

    it('should return false for future version', () => {
      expect(isQuestionnaireOutdated(CURRENT_SCHEMA_VERSION + 1)).toBe(false);
    });
  });

  describe('getMissingFields', () => {
    it('should return all required fields for empty responses', () => {
      const emptyResponses = {} as QuestionnaireResponses;
      const missing = getMissingFields(emptyResponses);

      expect(missing.length).toBeGreaterThan(0);
      expect(missing).toContain('personalDetails.fullName');
    });

    it('should return empty array for complete V2 responses', () => {
      const completeResponses = {
        personalDetails: {
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
          birthDate: '1990-01-01',
          gender: 'male',
          familyStatus: 'single',
        },
        relocationReasons: ['work'],
        citizenships: ['US'],
        employment: {
          employmentStatus: 'employed',
        },
        languages: {
          speakingLanguages: ['English'],
        },
        preferences: {
          proximityToIsrael: 'no_preference',
          weatherPreference: 'mild',
        },
        bureaucracy: {
          previousVisaAttempt: false,
          hasCriminalRecord: false,
        },
      } as QuestionnaireResponses;

      const missing = getMissingFields(completeResponses);
      expect(missing).toEqual([]);
    });

    it('should identify missing nested fields', () => {
      const partialResponses = {
        personalDetails: {
          fullName: 'Test User',
          email: 'test@example.com',
          // missing phone, birthDate, gender, familyStatus
        },
      } as QuestionnaireResponses;

      const missing = getMissingFields(partialResponses);
      expect(missing).toContain('personalDetails.phone');
      expect(missing).toContain('personalDetails.birthDate');
    });

    it('should treat empty strings as missing', () => {
      const responses = {
        personalDetails: {
          fullName: '',
          email: 'test@example.com',
          phone: '+1234567890',
          birthDate: '1990-01-01',
          gender: 'male',
          familyStatus: 'single',
        },
      } as QuestionnaireResponses;

      const missing = getMissingFields(responses);
      expect(missing).toContain('personalDetails.fullName');
    });

    it('should treat empty arrays as missing', () => {
      const responses = {
        personalDetails: {
          fullName: 'Test',
          email: 'test@example.com',
          phone: '+1234567890',
          birthDate: '1990-01-01',
          gender: 'male',
          familyStatus: 'single',
        },
        relocationReasons: [],
        citizenships: [],
      } as QuestionnaireResponses;

      const missing = getMissingFields(responses);
      expect(missing).toContain('relocationReasons');
      expect(missing).toContain('citizenships');
    });
  });

  describe('getNewRequiredFieldsForMigration', () => {
    it('should return empty array when from >= to version', () => {
      const responses = {} as QuestionnaireResponses;
      expect(getNewRequiredFieldsForMigration(responses, 2, 2)).toEqual([]);
      expect(getNewRequiredFieldsForMigration(responses, 2, 1)).toEqual([]);
    });

    it('should return V2 new fields for V1 to V2 migration', () => {
      const v1Responses = {
        preferredCountries: ['US'],
        relocationReason: 'work',
        familyStatus: 'single',
        personalDetails: {
          fullName: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890',
        },
      } as QuestionnaireResponses;

      const newFields = getNewRequiredFieldsForMigration(v1Responses, 1, 2);
      expect(newFields.length).toBeGreaterThan(0);
      expect(newFields).toContain('personalDetails.birthDate');
      expect(newFields).toContain('employment.employmentStatus');
    });

    it('should exclude already filled fields', () => {
      const partialV2Responses = {
        preferredCountries: ['US'],
        personalDetails: {
          fullName: 'Test',
          email: 'test@example.com',
          phone: '+123',
          birthDate: '1990-01-01',
          gender: 'male',
          familyStatus: 'single',
        },
        relocationReasons: ['work'],
        citizenships: ['US'],
      } as QuestionnaireResponses;

      const newFields = getNewRequiredFieldsForMigration(partialV2Responses, 1, 2);
      expect(newFields).not.toContain('personalDetails.birthDate');
      expect(newFields).not.toContain('personalDetails.gender');
      expect(newFields).not.toContain('relocationReasons');
    });
  });

  describe('requiresResubmission', () => {
    it('should return true when more than 50% of new fields are missing', () => {
      const emptyResponses = {} as QuestionnaireResponses;
      expect(requiresResubmission(emptyResponses, 1)).toBe(true);
    });

    it('should return false when less than 50% of new fields are missing', () => {
      // Fill most V2 new required fields
      const mostlyCompleteResponses = {
        personalDetails: {
          birthDate: '1990-01-01',
          gender: 'male',
          familyStatus: 'single',
        },
        relocationReasons: ['work'],
        citizenships: ['US'],
        employment: {
          employmentStatus: 'employed',
        },
        languages: {
          speakingLanguages: ['English'],
        },
        preferences: {
          proximityToIsrael: 'no_preference',
          weatherPreference: 'mild',
        },
        bureaucracy: {
          previousVisaAttempt: false,
          hasCriminalRecord: false,
        },
      } as QuestionnaireResponses;

      expect(requiresResubmission(mostlyCompleteResponses, 1)).toBe(false);
    });
  });

  describe('getQuestionnaireVersionStatus', () => {
    it('should return complete status object', () => {
      const responses = {} as QuestionnaireResponses;
      const status = getQuestionnaireVersionStatus(1, responses, false);

      expect(status).toHaveProperty('isOutdated');
      expect(status).toHaveProperty('currentVersion');
      expect(status).toHaveProperty('userVersion');
      expect(status).toHaveProperty('needsUpdate');
      expect(status).toHaveProperty('requiresResubmission');
      expect(status).toHaveProperty('missingFields');
      expect(status).toHaveProperty('newRequiredFields');
    });

    it('should mark V1 questionnaire as outdated', () => {
      const responses = {} as QuestionnaireResponses;
      const status = getQuestionnaireVersionStatus(1, responses, false);

      expect(status.isOutdated).toBe(true);
      expect(status.userVersion).toBe(1);
      expect(status.currentVersion).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should set needsUpdate true when outdated', () => {
      const responses = {} as QuestionnaireResponses;
      const status = getQuestionnaireVersionStatus(1, responses, false);

      expect(status.needsUpdate).toBe(true);
    });

    it('should set needsUpdate true when explicitly flagged', () => {
      const responses = {} as QuestionnaireResponses;
      const status = getQuestionnaireVersionStatus(2, responses, true);

      expect(status.needsUpdate).toBe(true);
    });

    it('should return false for V2 questionnaire without update flag', () => {
      const completeResponses = {
        personalDetails: {
          fullName: 'Test',
          email: 'test@example.com',
          phone: '+123',
          birthDate: '1990-01-01',
          gender: 'male',
          familyStatus: 'single',
        },
        relocationReasons: ['work'],
        citizenships: ['US'],
        employment: { employmentStatus: 'employed' },
        languages: { speakingLanguages: ['English'] },
        preferences: { proximityToIsrael: 'no', weatherPreference: 'mild' },
        bureaucracy: { previousVisaAttempt: false, hasCriminalRecord: false },
      } as QuestionnaireResponses;

      const status = getQuestionnaireVersionStatus(2, completeResponses, false);
      expect(status.isOutdated).toBe(false);
      expect(status.needsUpdate).toBe(false);
    });
  });
});
