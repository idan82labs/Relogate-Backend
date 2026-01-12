import type {
  QuestionnaireResponse,
  QuestionnaireResponses,
  QuestionnaireRecommendation,
} from '../../db/schema/questionnaires.js';

/**
 * Public questionnaire data returned to clients.
 */
export interface PublicQuestionnaire {
  id: string;
  userId: string;
  schemaVersion: number;
  responses: QuestionnaireResponses;
  status: 'in_progress' | 'completed' | 'archived';
  currentStep: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * Questionnaire with results.
 */
export interface QuestionnaireWithResults extends PublicQuestionnaire {
  results?: {
    id: string;
    recommendations: QuestionnaireRecommendation[];
    generatedAt: string;
  };
}

/**
 * Helper to convert database questionnaire to public format.
 */
export function toPublicQuestionnaire(q: QuestionnaireResponse): PublicQuestionnaire {
  return {
    id: q.id,
    userId: q.userId,
    schemaVersion: q.schemaVersion,
    responses: q.responses,
    status: q.status,
    currentStep: q.currentStep,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    completedAt: q.completedAt?.toISOString() ?? null,
  };
}

/**
 * Valid step names for questionnaire.
 */
export const VALID_STEPS = [
  'countries',
  'relocation-reason',
  'family-status',
  'personal-details',
] as const;

export type StepName = typeof VALID_STEPS[number];
