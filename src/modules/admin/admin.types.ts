import type { UserRole, OnboardingStatus } from '../auth/auth.types.js';

/**
 * Admin user view - includes all user data for admin purposes.
 */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  idNumber: string | null;
  phone: string | null;
  citizenship: string | null;
  birthDate: string | null;
  preferredLanguage: string;
  isActive: boolean;
  emailVerified: boolean;
  role: UserRole;
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User list response with pagination.
 */
export interface UserListResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * User questionnaire summary for admin view.
 */
export interface AdminQuestionnaire {
  id: string;
  userId: string;
  status: 'in_progress' | 'completed' | 'archived';
  currentStep: number;
  responses: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/**
 * User detail with questionnaires for admin view.
 */
export interface AdminUserDetail extends AdminUser {
  questionnaires: AdminQuestionnaire[];
}
