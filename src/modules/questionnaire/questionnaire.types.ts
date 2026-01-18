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
 * Valid step names for questionnaire.
 * Includes both current frontend step IDs and legacy step names for backward compatibility.
 */
export const VALID_STEPS = [
  // Current frontend V2 step IDs
  'intro',
  'personal-details',
  'family-status',
  'relocation-goals',
  'citizenship',
  'employment-education',
  'income',
  'partner-details',
  'studies-investments-languages',
  'preferences',
  // Legacy step names (V1 / old V2 - kept for backward compatibility)
  'migration-goals',
  'education-employment',
  'studies-investments',
  'languages',
  'bureaucracy',
  'countries',
] as const;

export type StepName = (typeof VALID_STEPS)[number];
