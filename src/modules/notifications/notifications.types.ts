import type { NotificationType } from './notifications.schema.js';

/**
 * Public notification for API responses
 */
export interface PublicNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

/**
 * Notification list response with pagination
 */
export interface NotificationListResponse {
  notifications: PublicNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Mark as read response
 */
export interface MarkAsReadResponse {
  markedCount: number;
}
