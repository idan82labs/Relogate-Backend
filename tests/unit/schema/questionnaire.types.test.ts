import { describe, it, expect } from 'vitest';
import {
  toPublicQuestionnaire,
  VALID_STEPS,
  type PublicQuestionnaire,
  type StepName,
} from '../../../src/modules/questionnaire/questionnaire.types.js';
import type { QuestionnaireResponse } from '../../../src/db/schema/questionnaires.js';

describe('Questionnaire Types', () => {
  describe('toPublicQuestionnaire', () => {
    const mockDate = new Date('2024-01-15T10:30:00Z');
    const mockCompletedDate = new Date('2024-01-16T14:00:00Z');

    const createMockQuestionnaireResponse = (
      overrides: Partial<QuestionnaireResponse> = {}
    ): QuestionnaireResponse => ({
      id: 'test-uuid-1234',
      userId: 'user-uuid-5678',
      schemaVersion: 2,
      responses: { version: 2 },
      status: 'in_progress',
      currentStep: 'intro',
      createdAt: mockDate,
      updatedAt: mockDate,
      completedAt: null,
      ...overrides,
    });

    it('should convert database questionnaire to public format', () => {
      const dbQuestionnaire = createMockQuestionnaireResponse();
      const result = toPublicQuestionnaire(dbQuestionnaire);

      expect(result.id).toBe('test-uuid-1234');
      expect(result.userId).toBe('user-uuid-5678');
      expect(result.schemaVersion).toBe(2);
      expect(result.responses).toEqual({ version: 2 });
      expect(result.status).toBe('in_progress');
      expect(result.currentStep).toBe('intro');
      expect(result.createdAt).toBe('2024-01-15T10:30:00.000Z');
      expect(result.updatedAt).toBe('2024-01-15T10:30:00.000Z');
      expect(result.completedAt).toBeNull();
    });

    it('should format completedAt when present', () => {
      const dbQuestionnaire = createMockQuestionnaireResponse({
        status: 'completed',
        currentStep: 'bureaucracy',
        completedAt: mockCompletedDate,
      });
      const result = toPublicQuestionnaire(dbQuestionnaire);

      expect(result.status).toBe('completed');
      expect(result.currentStep).toBe('bureaucracy');
      expect(result.completedAt).toBe('2024-01-16T14:00:00.000Z');
    });

    it('should handle V2 responses with all fields', () => {
      const v2Responses = {
        version: 2,
        personalDetails: {
          fullName: 'Test User',
          email: 'test@example.com',
          gender: 'male' as const,
          familyStatus: 'married_with_children' as const,
          processPartner: 'spouse_and_children' as const,
        },
        spouseDetails: {
          name: 'Spouse User',
          employmentStatus: 'employed' as const,
        },
        children: [
          { name: 'Child 1', age: 5 },
          { name: 'Child 2', age: 8 },
        ],
        relocationReasons: ['economic_comfort' as const, 'education_for_children' as const],
        citizenships: ['Israeli', 'American'],
        spouseCitizenships: ['Israeli'],
        employment: {
          employmentStatus: 'self_employed' as const,
          fieldOfWork: 'Tech',
          canWorkRemotely: true,
          monthlyIncome: '40000_50000' as const,
        },
        studiesInvestments: {
          openToStudyingAbroad: true,
          willingToInvestInProperty: false,
        },
        languages: {
          speakingLanguages: ['Hebrew', 'English'],
          writingLanguages: ['Hebrew', 'English'],
        },
        spouseLanguages: {
          speakingLanguages: ['Hebrew', 'English', 'French'],
          writingLanguages: ['Hebrew'],
        },
        preferences: {
          proximityToIsrael: 'up_to_6h' as const,
          timeZoneDifference: 'up_to_2h' as const,
          weatherPreference: 'four_seasons' as const,
          religiousJewishCommunity: true,
          israeliCommunity: true,
          livingStyle: 'big_city' as const,
        },
        bureaucracy: {
          previousVisaAttempt: 'never_tried' as const,
          hasCriminalRecord: false,
        },
      };

      const dbQuestionnaire = createMockQuestionnaireResponse({
        responses: v2Responses,
        status: 'completed',
        currentStep: 'bureaucracy',
        completedAt: mockCompletedDate,
      });

      const result = toPublicQuestionnaire(dbQuestionnaire);

      expect(result.responses).toEqual(v2Responses);
      expect(result.responses.version).toBe(2);
      expect(result.responses.personalDetails?.fullName).toBe('Test User');
      expect(result.responses.children?.length).toBe(2);
      expect(result.responses.employment?.canWorkRemotely).toBe(true);
      expect(result.responses.preferences?.livingStyle).toBe('big_city');
      expect(result.responses.bureaucracy?.hasCriminalRecord).toBe(false);
    });

    it('should handle V1 backward-compatible responses', () => {
      const v1Responses = {
        version: 1,
        preferredCountries: ['PT', 'ES'],
        relocationReason: 'Looking for new opportunities',
        familyStatus: 'married',
        personalDetails: {
          fullName: 'V1 User',
          email: 'v1@example.com',
          citizenship: 'Israeli',
        },
        spouseDetails: {
          birthDate: '1990-01-01',
          citizenship: 'Israeli',
        },
      };

      const dbQuestionnaire = createMockQuestionnaireResponse({
        schemaVersion: 1,
        responses: v1Responses,
      });

      const result = toPublicQuestionnaire(dbQuestionnaire);

      expect(result.schemaVersion).toBe(1);
      expect(result.responses.version).toBe(1);
      expect(result.responses.preferredCountries).toEqual(['PT', 'ES']);
      expect(result.responses.relocationReason).toBe('Looking for new opportunities');
    });

    it('should handle archived questionnaire', () => {
      const dbQuestionnaire = createMockQuestionnaireResponse({
        status: 'archived',
      });

      const result = toPublicQuestionnaire(dbQuestionnaire);

      expect(result.status).toBe('archived');
    });
  });

  describe('VALID_STEPS type', () => {
    it('should correctly type step names', () => {
      // This is a compile-time check, but we verify the runtime values
      const step: StepName = 'personal-details';
      expect(VALID_STEPS.includes(step)).toBe(true);
    });

    it('should include all expected step names as valid StepName type', () => {
      const steps: StepName[] = [
        'intro',
        'personal-details',
        'migration-goals',
        'citizenship',
        'education-employment',
        'studies-investments',
        'languages',
        'preferences',
        'bureaucracy',
      ];

      steps.forEach((step) => {
        expect(VALID_STEPS.includes(step)).toBe(true);
      });
    });
  });

  describe('PublicQuestionnaire interface', () => {
    it('should have correct shape', () => {
      const mockPublicQuestionnaire: PublicQuestionnaire = {
        id: 'test-id',
        userId: 'user-id',
        schemaVersion: 2,
        responses: { version: 2 },
        status: 'in_progress',
        currentStep: 'intro',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
        completedAt: null,
      };

      expect(mockPublicQuestionnaire.id).toBe('test-id');
      expect(mockPublicQuestionnaire.schemaVersion).toBe(2);
      expect(mockPublicQuestionnaire.status).toBe('in_progress');
    });

    it('should accept completed status with completedAt', () => {
      const completedQuestionnaire: PublicQuestionnaire = {
        id: 'test-id',
        userId: 'user-id',
        schemaVersion: 2,
        responses: {
          version: 2,
          bureaucracy: {
            previousVisaAttempt: 'never_tried',
            hasCriminalRecord: false,
          },
        },
        status: 'completed',
        currentStep: 'bureaucracy',
        createdAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-16T14:00:00.000Z',
        completedAt: '2024-01-16T14:00:00.000Z',
      };

      expect(completedQuestionnaire.status).toBe('completed');
      expect(completedQuestionnaire.completedAt).toBe('2024-01-16T14:00:00.000Z');
    });
  });
});
