import type {
  ReportProfileSummary,
  PersonalizedContent,
  CategoryOverrides,
} from '../../db/schema/reports.js';

/**
 * Report status type
 */
export type ReportStatus = 'draft' | 'published';

/**
 * Simplified country info for response lists
 */
export interface CountryInfo {
  id: string;
  code: string;
  name: string;
  englishName: string;
  flagImage: string | null;
}

/**
 * User info for report lists
 * Note: email is from Supabase auth, may not always be available
 */
export interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Country response in list view
 */
export interface CountryResponseListItem {
  id: string;
  country: CountryInfo;
  displayOrder: number;
  matchScore: number;
  visaType: string | null;
  status: ReportStatus;
  publishedAt: string | null;
}

/**
 * Full country response with all details
 */
export interface CountryResponseFull {
  id: string;
  reportId: string;
  country: CountryInfo;
  displayOrder: number;
  matchScore: number;
  visaType: string | null;
  matchReasons: string[];
  personalizedContent: PersonalizedContent;
  categoryOverrides: CategoryOverrides | null;
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
  countryResponseCount: number;
  publishedCountryCount: number;
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
  countryResponses: CountryResponseListItem[];
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
 * User-facing country response (public view)
 * Includes merged static + personalized content
 */
export interface UserCountryResponse {
  id: string;
  country: {
    id: string;
    code: string;
    name: string;
    englishName: string;
    flagImage: string | null;
    heroImage: string | null;
    introduction: string | null;
  };
  displayOrder: number;
  matchScore: number;
  visaType: string | null;
  matchReasons: string[];
  personalizedContent: PersonalizedContent;
  /** Merged categories (personalized overrides static) */
  categories: {
    general?: string;
    visa?: string;
    language?: string;
    safety?: string;
    jewish?: string;
    openness?: string;
    healthcare?: string;
    education?: string;
    employment?: string;
    transport?: string;
    cost?: string;
    distance?: string;
    community?: string;
  };
}

/**
 * User-facing report (public view)
 */
export interface UserReport {
  id: string;
  greeting: string | null;
  profileSummary: ReportProfileSummary;
  countryResponses: UserCountryResponse[];
  publishedAt: string | null;
}

/**
 * Check if user has a published report response
 */
export interface UserReportStatus {
  hasReport: boolean;
  hasPublishedReport: boolean;
  publishedCountryCount: number;
  reportId?: string;
}
