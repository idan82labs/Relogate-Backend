import { describe, it, expect } from 'vitest';
import { batchNotificationSchema } from '../../../src/modules/admin/admin.schema.js';

describe('Admin Schema', () => {
  describe('batchNotificationSchema', () => {
    it('should validate correct batch notification input', () => {
      const validInput = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test message',
      };

      const result = batchNotificationSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userIds).toHaveLength(1);
        expect(result.data.type).toBe('system');
        expect(result.data.title).toBe('Test Notification');
      }
    });

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
        const input = {
          userIds: ['550e8400-e29b-41d4-a716-446655440000'],
          type,
          title: 'Test',
          message: 'Test message',
        };

        const result = batchNotificationSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid notification type', () => {
      const input = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        type: 'invalid_type',
        title: 'Test',
        message: 'Test message',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept multiple user IDs', () => {
      const input = {
        userIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
        type: 'system',
        title: 'Batch Test',
        message: 'Message to multiple users',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userIds).toHaveLength(3);
      }
    });

    it('should reject empty userIds array', () => {
      const input = {
        userIds: [],
        type: 'system',
        title: 'Test',
        message: 'Test message',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least one user ID');
      }
    });

    it('should reject invalid UUID in userIds', () => {
      const input = {
        userIds: ['not-a-valid-uuid'],
        type: 'system',
        title: 'Test',
        message: 'Test message',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid user ID');
      }
    });

    it('should reject empty title', () => {
      const input = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        type: 'system',
        title: '',
        message: 'Test message',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty message', () => {
      const input = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        type: 'system',
        title: 'Test',
        message: '',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject title exceeding 200 characters', () => {
      const input = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        type: 'system',
        title: 'A'.repeat(201),
        message: 'Test message',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200');
      }
    });

    it('should reject message exceeding 1000 characters', () => {
      const input = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        type: 'system',
        title: 'Test',
        message: 'A'.repeat(1001),
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1000');
      }
    });

    it('should trim title and message whitespace', () => {
      const input = {
        userIds: ['550e8400-e29b-41d4-a716-446655440000'],
        type: 'system',
        title: '  Test Title  ',
        message: '  Test Message  ',
      };

      const result = batchNotificationSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Title');
        expect(result.data.message).toBe('Test Message');
      }
    });

    it('should reject missing required fields', () => {
      const inputs = [
        { type: 'system', title: 'Test', message: 'Test' }, // missing userIds
        { userIds: ['550e8400-e29b-41d4-a716-446655440000'], title: 'Test', message: 'Test' }, // missing type
        { userIds: ['550e8400-e29b-41d4-a716-446655440000'], type: 'system', message: 'Test' }, // missing title
        { userIds: ['550e8400-e29b-41d4-a716-446655440000'], type: 'system', title: 'Test' }, // missing message
      ];

      inputs.forEach((input) => {
        const result = batchNotificationSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });
  });
});
