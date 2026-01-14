import { eq, desc, asc, or, ilike, count, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { userProfiles, questionnaireResponses } from '../../db/schema/index.js';
import { supabaseAdmin } from '../../lib/supabase.js';
import { createModuleLogger } from '../../config/logger.js';
import {
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
  BadRequestError,
} from '../../lib/errors.js';
import type {
  AdminUser,
  AdminUserDetail,
  AdminQuestionnaire,
  UserListResponse,
} from './admin.types.js';
import type { ListUsersQuery, CreateUserInput, UpdateUserInput } from './admin.schema.js';

const logger = createModuleLogger('admin-service');

/**
 * Helper to map database user profile to AdminUser.
 */
function toAdminUser(profile: typeof userProfiles.$inferSelect, email: string): AdminUser {
  return {
    id: profile.id,
    email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    idNumber: profile.idNumber,
    phone: profile.phone,
    citizenship: profile.citizenship,
    birthDate: profile.birthDate?.toISOString().split('T')[0] ?? null,
    preferredLanguage: profile.preferredLanguage ?? 'he',
    isActive: profile.isActive,
    emailVerified: profile.emailVerified,
    role: profile.role,
    onboardingStatus: profile.onboardingStatus,
    onboardingCompletedAt: profile.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

/**
 * Helper to map questionnaire response to AdminQuestionnaire.
 */
function toAdminQuestionnaire(
  q: typeof questionnaireResponses.$inferSelect
): AdminQuestionnaire {
  return {
    id: q.id,
    userId: q.userId,
    status: q.status,
    currentStep: parseInt(q.currentStep, 10) || 1,
    responses: q.responses as Record<string, unknown>,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    completedAt: q.completedAt?.toISOString() ?? null,
  };
}

/**
 * Admin service.
 * Provides administrative operations for user management.
 */
export const adminService = {
  /**
   * List all users with pagination, search, and filtering.
   *
   * @param query - Query parameters for pagination and filtering
   * @returns Paginated list of users
   */
  async listUsers(query: ListUsersQuery): Promise<UserListResponse> {
    const { page, limit, search, role, isActive, sortBy, sortOrder } = query;
    const offset = (page - 1) * limit;

    logger.debug({ query }, 'Listing users');

    // Build where conditions
    const conditions = [];

    if (role) {
      conditions.push(eq(userProfiles.role, role));
    }

    if (isActive !== undefined) {
      conditions.push(eq(userProfiles.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          ilike(userProfiles.firstName, `%${search}%`),
          ilike(userProfiles.lastName, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build order by
    const sortColumn = {
      createdAt: userProfiles.createdAt,
      firstName: userProfiles.firstName,
      lastName: userProfiles.lastName,
      email: userProfiles.firstName, // We don't have email in profiles, sort by firstName
    }[sortBy];

    const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(userProfiles)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Get paginated users
    const profiles = await db
      .select()
      .from(userProfiles)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Fetch emails from Supabase Auth for all users
    const users: AdminUser[] = [];
    for (const profile of profiles) {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const email = data?.user?.email ?? '';
        users.push(toAdminUser(profile, email));
      } catch {
        // If we can't get email, still include user with empty email
        users.push(toAdminUser(profile, ''));
      }
    }

    logger.info({ page, limit, total, count: users.length }, 'Users listed');

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a user by ID with their questionnaires.
   *
   * @param userId - The user ID
   * @returns User details with questionnaires
   * @throws NotFoundError if user not found
   */
  async getUserById(userId: string): Promise<AdminUserDetail> {
    logger.debug({ userId }, 'Getting user by ID');

    // Get user profile
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (!profile) {
      throw new NotFoundError('User');
    }

    // Get email from Supabase Auth
    let email = '';
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
      email = data?.user?.email ?? '';
    } catch (error) {
      logger.warn({ userId, error }, 'Failed to get user email from Supabase');
    }

    // Get user's questionnaires
    const questionnaires = await db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, userId))
      .orderBy(desc(questionnaireResponses.createdAt));

    logger.info({ userId }, 'User retrieved');

    return {
      ...toAdminUser(profile, email),
      questionnaires: questionnaires.map(toAdminQuestionnaire),
    };
  },

  /**
   * Create a new user.
   *
   * @param input - User creation data
   * @returns Created user
   * @throws ConflictError if email already exists
   */
  async createUser(input: CreateUserInput): Promise<AdminUser> {
    const { email, password, firstName, lastName, idNumber, phone, birthDate, role } = input;

    logger.debug({ email }, 'Creating new user');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin-created users
      user_metadata: {
        firstName,
        lastName,
      },
    });

    if (authError) {
      logger.warn({ email, error: authError.message }, 'Failed to create user in Supabase');

      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        throw new ConflictError('Email already registered');
      }
      if (authError.message.includes('password')) {
        throw new BadRequestError(authError.message);
      }

      throw new ServiceUnavailableError('Failed to create user');
    }

    if (!authData.user) {
      throw new ServiceUnavailableError('Failed to create user');
    }

    const userId = authData.user.id;

    // Create user profile
    try {
      await db.insert(userProfiles).values({
        id: userId,
        firstName,
        lastName,
        idNumber: idNumber ?? null,
        phone: phone ?? null,
        birthDate: birthDate ? new Date(birthDate) : null,
        role: role ?? 'user',
        onboardingStatus: 'pending',
        emailVerified: true, // Admin-created users have verified email
      });
    } catch (error) {
      // Rollback: delete Supabase auth user
      logger.error({ userId, error }, 'Failed to create profile, rolling back auth user');
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new ServiceUnavailableError('Failed to create user profile');
    }

    // Return created user
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId));

    if (!profile) {
      throw new ServiceUnavailableError('Failed to retrieve created user');
    }

    logger.info({ userId, email }, 'User created successfully');

    return toAdminUser(profile, email);
  },

  /**
   * Update a user's profile.
   *
   * @param userId - The user ID
   * @param input - Update data
   * @returns Updated user
   * @throws NotFoundError if user not found
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<AdminUser> {
    logger.debug({ userId, input }, 'Updating user');

    // Check if user exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (!existingProfile) {
      throw new NotFoundError('User');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.idNumber !== undefined) updateData.idNumber = input.idNumber;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.citizenship !== undefined) updateData.citizenship = input.citizenship;
    if (input.birthDate !== undefined) {
      updateData.birthDate = input.birthDate ? new Date(input.birthDate) : null;
    }
    if (input.preferredLanguage !== undefined) updateData.preferredLanguage = input.preferredLanguage;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.role !== undefined) updateData.role = input.role;

    // Update profile
    const [updatedProfile] = await db
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.id, userId))
      .returning();

    if (!updatedProfile) {
      throw new ServiceUnavailableError('Failed to update user');
    }

    // Get email from Supabase
    let email = '';
    try {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
      email = data?.user?.email ?? '';
    } catch {
      // Ignore email fetch error
    }

    logger.info({ userId }, 'User updated successfully');

    return toAdminUser(updatedProfile, email);
  },

  /**
   * Delete a user.
   * This soft-deletes by setting isActive to false, or hard-deletes from auth.
   *
   * @param userId - The user ID
   * @param hardDelete - If true, permanently delete user and auth record
   * @throws NotFoundError if user not found
   */
  async deleteUser(userId: string, hardDelete = false): Promise<void> {
    logger.debug({ userId, hardDelete }, 'Deleting user');

    // Check if user exists
    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (!existingProfile) {
      throw new NotFoundError('User');
    }

    if (hardDelete) {
      // Delete from Supabase Auth (this cascades to profile due to FK)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        logger.error({ userId, error: error.message }, 'Failed to delete user from Supabase');
        throw new ServiceUnavailableError('Failed to delete user');
      }

      // Also delete profile (may already be deleted by cascade)
      await db.delete(userProfiles).where(eq(userProfiles.id, userId));

      logger.info({ userId }, 'User hard deleted');
    } else {
      // Soft delete - just deactivate
      await db
        .update(userProfiles)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(userProfiles.id, userId));

      logger.info({ userId }, 'User soft deleted (deactivated)');
    }
  },
};
