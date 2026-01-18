/**
 * Schema version service for questionnaire migrations.
 *
 * Handles version tracking, migration detection, and schema compatibility.
 */

import type { QuestionnaireResponses } from '../../db/schema/questionnaires.js';

/**
 * Current schema version.
 * Increment this when making breaking changes to the questionnaire structure.
 */
export const CURRENT_SCHEMA_VERSION = 2;

/**
 * Required field paths per version.
 * These are the minimum fields required for a questionnaire to be considered complete.
 *
 * Note: Paths use dot notation for nested fields.
 */
export const REQUIRED_FIELDS_BY_VERSION: Record<number, string[]> = {
  1: [
    'preferredCountries',
    'relocationReason',
    'familyStatus',
    'personalDetails.fullName',
    'personalDetails.email',
    'personalDetails.phone',
  ],
  2: [
    'personalDetails.fullName',
    'personalDetails.email',
    'personalDetails.phone',
    'personalDetails.birthDate',
    'personalDetails.gender',
    'personalDetails.familyStatus',
    'relocationReasons',
    'citizenships',
    'employment.employmentStatus',
    'languages.speakingLanguages',
    'preferences.proximityToIsrael',
    'preferences.weatherPreference',
    'bureaucracy.previousVisaAttempt',
    'bureaucracy.hasCriminalRecord',
  ],
};

/**
 * New required fields in V2 that were not in V1.
 * These fields must be filled when migrating from V1 to V2.
 */
export const V2_NEW_REQUIRED_FIELDS: string[] = [
  'personalDetails.birthDate',
  'personalDetails.gender',
  'personalDetails.familyStatus',
  'relocationReasons',
  'citizenships',
  'employment.employmentStatus',
  'languages.speakingLanguages',
  'preferences.proximityToIsrael',
  'preferences.weatherPreference',
  'bureaucracy.previousVisaAttempt',
  'bureaucracy.hasCriminalRecord',
];

/**
 * Check if a questionnaire's schema version is outdated.
 */
export function isQuestionnaireOutdated(schemaVersion: number): boolean {
  return schemaVersion < CURRENT_SCHEMA_VERSION;
}

/**
 * Get a nested value from an object using dot notation.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Check if a field has a valid value (not null, undefined, or empty).
 */
function hasValidValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}

/**
 * Get missing required fields for a specific version.
 */
export function getMissingFields(
  responses: QuestionnaireResponses,
  targetVersion: number = CURRENT_SCHEMA_VERSION
): string[] {
  const requiredFields = REQUIRED_FIELDS_BY_VERSION[targetVersion] || [];
  const missingFields: string[] = [];

  for (const fieldPath of requiredFields) {
    const value = getNestedValue(responses as Record<string, unknown>, fieldPath);
    if (!hasValidValue(value)) {
      missingFields.push(fieldPath);
    }
  }

  return missingFields;
}

/**
 * Get new required fields that a V1 questionnaire needs to fill for V2.
 */
export function getNewRequiredFieldsForMigration(
  responses: QuestionnaireResponses,
  fromVersion: number = 1,
  toVersion: number = CURRENT_SCHEMA_VERSION
): string[] {
  if (fromVersion >= toVersion) {
    return [];
  }

  // For V1 -> V2 migration, return fields that are new in V2 and not yet filled
  if (fromVersion === 1 && toVersion === 2) {
    const missingNewFields: string[] = [];

    for (const fieldPath of V2_NEW_REQUIRED_FIELDS) {
      const value = getNestedValue(responses as Record<string, unknown>, fieldPath);
      if (!hasValidValue(value)) {
        missingNewFields.push(fieldPath);
      }
    }

    return missingNewFields;
  }

  // For other version jumps, return all missing fields for target version
  return getMissingFields(responses, toVersion);
}

/**
 * Determine if a questionnaire requires full resubmission vs just an update.
 *
 * Resubmission is required when:
 * - More than 50% of required fields are missing
 * - Critical fields have changed structure
 */
export function requiresResubmission(
  responses: QuestionnaireResponses,
  fromVersion: number
): boolean {
  const newRequiredFields = getNewRequiredFieldsForMigration(responses, fromVersion);
  const totalNewFields = V2_NEW_REQUIRED_FIELDS.length;

  // If more than 50% of new required fields are missing, require resubmission
  if (newRequiredFields.length > totalNewFields * 0.5) {
    return true;
  }

  return false;
}

/**
 * Questionnaire status with version info.
 */
export interface QuestionnaireVersionStatus {
  isOutdated: boolean;
  currentVersion: number;
  userVersion: number;
  needsUpdate: boolean;
  requiresResubmission: boolean;
  missingFields: string[];
  newRequiredFields: string[];
}

/**
 * Get comprehensive questionnaire version status.
 */
export function getQuestionnaireVersionStatus(
  schemaVersion: number,
  responses: QuestionnaireResponses,
  needsUpdate: boolean
): QuestionnaireVersionStatus {
  const isOutdated = isQuestionnaireOutdated(schemaVersion);
  const missingFields = getMissingFields(responses);
  const newRequiredFields = getNewRequiredFieldsForMigration(responses, schemaVersion);
  const requiresResub = requiresResubmission(responses, schemaVersion);

  return {
    isOutdated,
    currentVersion: CURRENT_SCHEMA_VERSION,
    userVersion: schemaVersion,
    needsUpdate: needsUpdate || isOutdated,
    requiresResubmission: requiresResub,
    missingFields,
    newRequiredFields,
  };
}
