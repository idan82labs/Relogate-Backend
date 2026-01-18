import { describe, it, expect } from 'vitest';
import {
  notificationTypeSchema,
  createNotificationSchema,
} from '../../../src/modules/notifications/notifications.schema.js';

describe('Notifications Schema', () => {
  describe('notificationTypeSchema', () => {
    it('should accept all valid notification types', () => {
      const validTypes = [
        'report_ready',
        'country_response_ready',
        'questionnaire_completed',
        'questionnaire_updated',
        'questionnaire_resubmit_required',
        'questionnaire_reminder',
        'new_questionnaire_submitted',
        'questionnaire_update_completed',
        'system',
      ];

      validTypes.forEach((type) => {
        const result = notificationTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(type);
        }
      });
    });

    it('should reject invalid notification types', () => {
      const invalidTypes = [
        'invalid',
        'SYSTEM',
        'System',
        '',
        'notification',
        'alert',
      ];

      invalidTypes.forEach((type) => {
        const result = notificationTypeSchema.safeParse(type);
        expect(result.success).toBe(false);
      });
    });

    it('should have exactly 9 valid notification types', () => {
      const validTypes = notificationTypeSchema._def.values;
      expect(validTypes).toHaveLength(9);
    });
  });

  describe('createNotificationSchema', () => {
    it('should validate correct notification input', () => {
      const validInput = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification message',
      };

      const result = createNotificationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate notification with optional fields', () => {
      const validInput = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'questionnaire_completed',
        title: 'Questionnaire Complete',
        message: 'Your questionnaire has been submitted',
        relatedId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = createNotificationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relatedId).toBe('550e8400-e29b-41d4-a716-446655440001');
      }
    });

    it('should reject invalid userId', () => {
      const input = {
        userId: 'not-a-uuid',
        type: 'system',
        title: 'Test',
        message: 'Test message',
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid notification type', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'invalid_type',
        title: 'Test',
        message: 'Test message',
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept questionnaire_updated type', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'questionnaire_updated',
        title: 'Questionnaire Updated',
        message: 'Your questionnaire needs attention',
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept questionnaire_resubmit_required type', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'questionnaire_resubmit_required',
        title: 'Resubmission Required',
        message: 'Please resubmit your questionnaire',
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept questionnaire_reminder type', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'questionnaire_reminder',
        title: 'Reminder',
        message: 'Please update your questionnaire',
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept new_questionnaire_submitted type', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'new_questionnaire_submitted',
        title: 'New Submission',
        message: 'A user submitted a new questionnaire',
        relatedId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept questionnaire_update_completed type', () => {
      const input = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        type: 'questionnaire_update_completed',
        title: 'Update Complete',
        message: 'A user completed their questionnaire update',
        relatedId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const result = createNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
