import { eq, desc, and, count, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { notifications } from '../../db/schema/notifications.js';
import { userProfiles } from '../../db/schema/users.js';
import { createModuleLogger } from '../../config/logger.js';
import { NotFoundError } from '../../lib/errors.js';
import type {
  PublicNotification,
  NotificationListResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
} from './notifications.types.js';
import type {
  ListNotificationsQuery,
  CreateNotificationInput,
} from './notifications.schema.js';
import type { NotificationType } from './notifications.schema.js';

const logger = createModuleLogger('notifications-service');

/**
 * Helper to map notification to public format
 */
function toPublicNotification(notification: typeof notifications.$inferSelect): PublicNotification {
  return {
    id: notification.id,
    type: notification.type as NotificationType,
    title: notification.title,
    message: notification.message,
    relatedId: notification.relatedId,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
}

/**
 * Notifications service.
 * Handles CRUD operations for notifications.
 */
export const notificationsService = {
  /**
   * List notifications for a user with pagination.
   */
  async listNotifications(userId: string, query: ListNotificationsQuery): Promise<NotificationListResponse> {
    const { page, limit, unreadOnly } = query;
    const offset = (page - 1) * limit;

    logger.debug({ userId, query }, 'Listing notifications');

    // Build conditions
    const conditions = [eq(notifications.userId, userId)];

    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(whereClause);

    const total = countResult?.count ?? 0;

    // Get unread count
    const [unreadResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const unreadCount = unreadResult?.count ?? 0;

    // Get notifications
    const notificationList = await db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    logger.info({ userId, page, limit, total, unreadCount }, 'Notifications listed');

    return {
      notifications: notificationList.map(toPublicNotification),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    logger.debug({ userId }, 'Getting unread count');

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const unreadCount = result?.count ?? 0;

    logger.info({ userId, unreadCount }, 'Unread count retrieved');

    return { unreadCount };
  },

  /**
   * Get a notification by ID.
   */
  async getNotificationById(notificationId: string, userId: string): Promise<PublicNotification> {
    logger.debug({ notificationId, userId }, 'Getting notification by ID');

    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    logger.info({ notificationId }, 'Notification retrieved');

    return toPublicNotification(notification);
  },

  /**
   * Mark notifications as read.
   */
  async markAsRead(userId: string, notificationIds?: string[], markAllAsRead?: boolean): Promise<MarkAsReadResponse> {
    logger.debug({ userId, notificationIds, markAllAsRead }, 'Marking notifications as read');

    const now = new Date();
    let markedCount = 0;

    if (markAllAsRead) {
      // Mark all unread notifications as read
      const result = await db
        .update(notifications)
        .set({ isRead: true, readAt: now })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      markedCount = result.count ?? 0;
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const result = await db
        .update(notifications)
        .set({ isRead: true, readAt: now })
        .where(
          and(
            eq(notifications.userId, userId),
            inArray(notifications.id, notificationIds),
            eq(notifications.isRead, false)
          )
        );

      markedCount = result.count ?? 0;
    }

    logger.info({ userId, markedCount }, 'Notifications marked as read');

    return { markedCount };
  },

  /**
   * Create a notification (internal use or admin).
   */
  async createNotification(input: CreateNotificationInput): Promise<PublicNotification> {
    const { userId, type, title, message, relatedId } = input;

    logger.debug({ userId, type }, 'Creating notification');

    // Verify user exists
    const [user] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User');
    }

    // Create notification
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message: message ?? null,
        relatedId: relatedId ?? null,
        isRead: false,
      })
      .returning();

    if (!notification) {
      throw new Error('Failed to create notification');
    }

    logger.info({ notificationId: notification.id, userId, type }, 'Notification created');

    return toPublicNotification(notification);
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    logger.debug({ notificationId, userId }, 'Deleting notification');

    // Check if notification exists and belongs to user
    const [notification] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification) {
      throw new NotFoundError('Notification');
    }

    // Delete notification
    await db.delete(notifications).where(eq(notifications.id, notificationId));

    logger.info({ notificationId }, 'Notification deleted');
  },

  // ================== Helper Functions for Other Services ==================

  /**
   * Notify user that a country response is ready.
   */
  async notifyCountryResponseReady(userId: string, countryName: string, responseId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'country_response_ready',
      title: `התגובה שלך ל${countryName} מוכנה!`,
      message: `המלצת ההגירה שלך למדינה ${countryName} מוכנה לצפייה.`,
      relatedId: responseId,
    });
  },

  /**
   * Notify user that their full report is ready.
   */
  async notifyReportReady(userId: string, reportId: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'report_ready',
      title: 'הדוח האישי שלך מוכן!',
      message: 'כל המלצות ההגירה שלך מוכנות לצפייה.',
      relatedId: reportId,
    });
  },

  /**
   * Notify admin that a user completed a questionnaire.
   * @deprecated Use notifyNewQuestionnaireSubmitted instead
   */
  async notifyQuestionnaireCompleted(adminUserId: string, userName: string, questionnaireId: string): Promise<void> {
    await this.createNotification({
      userId: adminUserId,
      type: 'questionnaire_completed',
      title: `${userName} השלים/ה שאלון`,
      message: `המשתמש ${userName} סיים למלא את השאלון ומחכה לתגובה.`,
      relatedId: questionnaireId,
    });
  },

  // ================== Questionnaire V2 Notifications ==================

  /**
   * Hebrew notification content for V2 questionnaire notifications.
   */
  NOTIFICATION_CONTENT: {
    questionnaire_updated: {
      title: 'עדכון בשאלון',
      message: 'השאלון עודכן. אנא בדוק את הפרטים שלך.',
    },
    questionnaire_resubmit_required: {
      title: 'נדרש מילוי שאלון מחדש',
      message: 'בוצעו שינויים משמעותיים בשאלון. אנא מלא את השאלון מחדש.',
    },
    questionnaire_reminder: {
      title: 'תזכורת: השלם את השאלון',
      message: 'השאלון שלך עדיין לא הושלם. השלם אותו כדי לקבל את הדוח שלך.',
    },
    new_questionnaire_submitted: {
      title: 'שאלון חדש התקבל',
      message: 'משתמש חדש השלים את השאלון.',
    },
    questionnaire_update_completed: {
      title: 'משתמש עדכן שאלון',
      message: 'משתמש השלים את עדכון השאלון.',
    },
  } as const,

  /**
   * Get all admin user IDs.
   */
  async getAdminUserIds(): Promise<string[]> {
    const admins = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.role, 'admin'));

    return admins.map((admin) => admin.id);
  },

  /**
   * Notify user that their questionnaire schema has been updated.
   * User should review their responses but doesn't need to resubmit.
   */
  async notifyQuestionnaireUpdated(userId: string, customMessage?: string): Promise<void> {
    const content = this.NOTIFICATION_CONTENT.questionnaire_updated;
    await this.createNotification({
      userId,
      type: 'questionnaire_updated',
      title: content.title,
      message: customMessage ?? content.message,
    });

    logger.info({ userId }, 'Sent questionnaire updated notification');
  },

  /**
   * Notify user that they need to resubmit their questionnaire.
   * Used when major schema changes require new data.
   */
  async notifyQuestionnaireResubmitRequired(userId: string): Promise<void> {
    const content = this.NOTIFICATION_CONTENT.questionnaire_resubmit_required;
    await this.createNotification({
      userId,
      type: 'questionnaire_resubmit_required',
      title: content.title,
      message: content.message,
    });

    logger.info({ userId }, 'Sent questionnaire resubmit required notification');
  },

  /**
   * Send reminder to user to complete their questionnaire.
   */
  async notifyQuestionnaireReminder(userId: string): Promise<void> {
    const content = this.NOTIFICATION_CONTENT.questionnaire_reminder;
    await this.createNotification({
      userId,
      type: 'questionnaire_reminder',
      title: content.title,
      message: content.message,
    });

    logger.info({ userId }, 'Sent questionnaire reminder notification');
  },

  /**
   * Notify all admins that a new questionnaire has been submitted.
   * @param relatedUserId - The ID of the user who submitted the questionnaire
   * @param userName - Optional user name for the notification message
   */
  async notifyNewQuestionnaireSubmitted(relatedUserId: string, userName?: string): Promise<void> {
    const adminIds = await this.getAdminUserIds();

    if (adminIds.length === 0) {
      logger.warn('No admin users found to notify about new questionnaire');
      return;
    }

    const content = this.NOTIFICATION_CONTENT.new_questionnaire_submitted;
    const message = userName
      ? `${userName} השלים/ה את השאלון.`
      : content.message;

    // Create notifications for all admins in parallel
    await Promise.all(
      adminIds.map((adminId) =>
        this.createNotification({
          userId: adminId,
          type: 'new_questionnaire_submitted',
          title: content.title,
          message,
          relatedId: relatedUserId,
        })
      )
    );

    logger.info({ relatedUserId, adminCount: adminIds.length }, 'Notified admins about new questionnaire');
  },

  /**
   * Notify all admins that a user has completed their questionnaire update.
   * @param relatedUserId - The ID of the user who completed the update
   * @param userName - Optional user name for the notification message
   */
  async notifyQuestionnaireUpdateCompleted(relatedUserId: string, userName?: string): Promise<void> {
    const adminIds = await this.getAdminUserIds();

    if (adminIds.length === 0) {
      logger.warn('No admin users found to notify about questionnaire update');
      return;
    }

    const content = this.NOTIFICATION_CONTENT.questionnaire_update_completed;
    const message = userName
      ? `${userName} השלים/ה את עדכון השאלון.`
      : content.message;

    // Create notifications for all admins in parallel
    await Promise.all(
      adminIds.map((adminId) =>
        this.createNotification({
          userId: adminId,
          type: 'questionnaire_update_completed',
          title: content.title,
          message,
          relatedId: relatedUserId,
        })
      )
    );

    logger.info({ relatedUserId, adminCount: adminIds.length }, 'Notified admins about questionnaire update completion');
  },

  /**
   * Send a system notification to a user.
   */
  async notifySystem(userId: string, title: string, message: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'system',
      title,
      message,
    });

    logger.info({ userId }, 'Sent system notification');
  },
};
