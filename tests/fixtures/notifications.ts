import type { Notification, NewNotification } from '../../src/db/schema/notifications.js';

/**
 * Valid notification data for testing
 */
export const validNotificationData: Omit<NewNotification, 'userId'> = {
  type: 'country_response_ready',
  title: 'המלצה חדשה זמינה',
  message: 'ההמלצה שלך לפורטוגל מוכנה לצפייה.',
  relatedId: 'response-uuid-123',
  isRead: false,
};

/**
 * Create mock notification with overrides
 */
export const createMockNotification = (
  overrides: Partial<Notification> = {}
): Notification => ({
  id: 'notification-uuid-123',
  userId: 'user-uuid-123',
  type: 'country_response_ready',
  title: 'המלצה חדשה זמינה',
  message: 'ההמלצה שלך מוכנה לצפייה.',
  relatedId: 'response-uuid-123',
  isRead: false,
  createdAt: new Date('2025-01-01'),
  readAt: null,
  ...overrides,
});

/**
 * Sample notifications for different types
 */
export const sampleNotifications = {
  countryResponseReady: {
    type: 'country_response_ready' as const,
    title: 'המלצה חדשה זמינה',
    message: 'ההמלצה שלך לפורטוגל מוכנה לצפייה.',
  },
  reportReady: {
    type: 'report_ready' as const,
    title: 'הדו"ח שלך מוכן',
    message: 'כל ההמלצות שלך מוכנות לצפייה.',
  },
  questionnaireCompleted: {
    type: 'questionnaire_completed' as const,
    title: 'שאלון חדש הושלם',
    message: 'משתמש חדש השלים את השאלון וממתין לדו"ח.',
  },
};
