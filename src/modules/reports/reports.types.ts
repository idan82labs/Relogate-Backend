import type {
  ReportProfileSummary,
  DestinationNarrative,
  DestinationSection,
} from '../../db/schema/reports.js';

// Re-export schema types for convenience
export type { ReportProfileSummary, DestinationNarrative, DestinationSection };

/**
 * Report status type
 */
export type ReportStatus = 'draft' | 'published';

/**
 * User info for report lists
 */
export interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Destination presentation (inline, self-contained)
 */
export interface DestinationInfo {
  name: string;
  subtitle: string | null;
  image: string | null;
  badge: string | null;
}

/**
 * Match data for a destination
 */
export interface MatchInfo {
  score: number;
  reasons: string[];
  visaType: string | null;
}

/**
 * Destination response in list view (minimal)
 */
export interface DestinationResponseListItem {
  id: string;
  destination: DestinationInfo;
  displayOrder: number;
  match: MatchInfo;
  status: ReportStatus;
  publishedAt: string | null;
}

/**
 * Full destination response with all details (admin view)
 */
export interface DestinationResponseFull {
  id: string;
  reportId: string;
  displayOrder: number;
  destination: DestinationInfo;
  match: MatchInfo;
  narrative: DestinationNarrative;
  sections: DestinationSection[];
  status: ReportStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report in list view (admin dashboard)
 */
export interface ReportListItem {
  id: string;
  user: UserInfo;
  questionnaireId: string;
  status: ReportStatus;
  destinationCount: number;
  publishedDestinationCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full report with all details (admin view)
 */
export interface ReportFull {
  id: string;
  user: UserInfo;
  questionnaireId: string;
  greeting: string | null;
  profileSummary: ReportProfileSummary;
  status: ReportStatus;
  destinations: DestinationResponseListItem[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Report list response with pagination (admin)
 */
export interface ReportListResponse {
  reports: ReportListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Pending questionnaire for admin (no report created yet)
 */
export interface PendingQuestionnaire {
  id: string;
  user: UserInfo;
  countries: string[];
  submittedAt: string;
  reportExists: boolean;
}

/**
 * Pending questionnaires response
 */
export interface PendingQuestionnairesResponse {
  questionnaires: PendingQuestionnaire[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * User-facing destination response (public view)
 * Self-contained with all personalized content
 */
export interface UserDestinationResponse {
  id: string;
  displayOrder: number;
  destination: DestinationInfo;
  match: MatchInfo;
  narrative: DestinationNarrative;
  sections: DestinationSection[];
}

/**
 * User-facing report (public view)
 */
export interface UserReport {
  id: string;
  greeting: string | null;
  profileSummary: ReportProfileSummary;
  destinations: UserDestinationResponse[];
  publishedAt: string | null;
}

/**
 * Check if user has a published report response
 */
export interface UserReportStatus {
  hasReport: boolean;
  hasPublishedReport: boolean;
  publishedDestinationCount: number;
  reportId?: string;
}

// Legacy type aliases for backwards compatibility
/** @deprecated Use DestinationResponseListItem instead */
export type CountryResponseListItem = DestinationResponseListItem;
/** @deprecated Use DestinationResponseFull instead */
export type CountryResponseFull = DestinationResponseFull;
/** @deprecated Use UserDestinationResponse instead */
export type UserCountryResponse = UserDestinationResponse;
