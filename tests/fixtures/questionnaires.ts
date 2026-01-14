/**
 * Test fixtures for questionnaire-related data
 */

export const validQuestionnaireResponses = {
  countries: ['US', 'UK', 'DE'],
  relocationReason: 'Looking for better opportunities',
  familyStatus: 'married',
  personalDetails: {
    occupation: 'Software Engineer',
    yearsOfExperience: 5,
  },
};

export const partialQuestionnaireResponses = {
  countries: ['US', 'UK'],
};

export const createMockQuestionnaire = (
  overrides: Partial<MockQuestionnaire> = {}
): MockQuestionnaire => ({
  id: 'uuid-questionnaire-123',
  userId: 'uuid-test-user-123',
  responses: validQuestionnaireResponses,
  status: 'in_progress',
  currentStep: 1,
  schemaVersion: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockCompletedQuestionnaire = (
  overrides: Partial<MockQuestionnaire> = {}
): MockQuestionnaire => ({
  ...createMockQuestionnaire(),
  status: 'completed',
  currentStep: 4,
  completedAt: new Date('2024-01-02'),
  ...overrides,
});

export const createMockQuestionnaireResult = (
  overrides: Partial<MockQuestionnaireResult> = {}
): MockQuestionnaireResult => ({
  id: 'uuid-result-123',
  questionnaireId: 'uuid-questionnaire-123',
  recommendations: {
    topCountries: [
      { country: 'US', score: 85, reasons: ['Strong job market'] },
      { country: 'UK', score: 78, reasons: ['Good education system'] },
      { country: 'DE', score: 72, reasons: ['High quality of life'] },
    ],
  },
  createdAt: new Date('2024-01-02'),
  ...overrides,
});

// Type definitions for mocks
interface MockQuestionnaire {
  id: string;
  userId: string;
  responses: Record<string, unknown>;
  status: 'in_progress' | 'completed' | 'archived';
  currentStep: number;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface MockQuestionnaireResult {
  id: string;
  questionnaireId: string;
  recommendations: {
    topCountries: Array<{
      country: string;
      score: number;
      reasons: string[];
    }>;
  };
  createdAt: Date;
}
