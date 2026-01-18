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
  needsUpdate: boolean;
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
    needsUpdate: q.needsUpdate,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    completedAt: q.completedAt?.toISOString() ?? null,
  };
}

/**
 * Valid step names for questionnaire (V2).
 * Steps:
 * 1. intro - Explanation about the questionnaire
 * 2. personal-details - Personal information, family, children
 * 3. migration-goals - Reasons for relocation (multi-select)
 * 4. citizenship - User and spouse citizenships
 * 5. education-employment - Employment status, education, income
 * 6. studies-investments - Studies abroad, property investment
 * 7. languages - Speaking and writing languages
 * 8. preferences - Location, weather, community preferences
 * 9. bureaucracy - Visa history, criminal record
 */
export const VALID_STEPS = [
  'intro',
  'personal-details',
  'migration-goals',
  'citizenship',
  'education-employment',
  'studies-investments',
  'languages',
  'preferences',
  'bureaucracy',
] as const;

export type StepName = (typeof VALID_STEPS)[number];
