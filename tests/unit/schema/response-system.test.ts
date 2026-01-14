import { describe, it, expect } from 'vitest';
import type {
  Country,
  NewCountry,
  CountryCategories,
} from '../../../src/db/schema/countries.js';
import type {
  QuestionnaireReport,
  NewQuestionnaireReport,
  CountryResponse,
  NewCountryResponse,
  ReportProfileSummary,
  PersonalizedContent,
  CategoryOverrides,
} from '../../../src/db/schema/reports.js';
import type {
  Notification,
  NewNotification,
} from '../../../src/db/schema/notifications.js';
import {
  validCountryData,
  createMockCountry,
  fullCategories,
} from '../../fixtures/countries.js';
import {
  validReportData,
  createMockReport,
  validCountryResponseData,
  createMockCountryResponse,
  sampleProfileSummary,
  samplePersonalizedContent,
} from '../../fixtures/reports.js';
import {
  validNotificationData,
  createMockNotification,
  sampleNotifications,
} from '../../fixtures/notifications.js';

describe('Response System Schema Types', () => {
  describe('Countries Schema', () => {
    it('should accept valid country data', () => {
      const country: NewCountry = validCountryData;

      expect(country.code).toBe('PT');
      expect(country.name).toBe('פורטוגל');
      expect(country.englishName).toBe('Portugal');
      expect(country.isActive).toBe(true);
    });

    it('should create mock country with defaults', () => {
      const country: Country = createMockCountry();

      expect(country.id).toBeDefined();
      expect(country.code).toBe('PT');
      expect(country.createdAt).toBeInstanceOf(Date);
      expect(country.updatedAt).toBeInstanceOf(Date);
    });

    it('should allow override of country properties', () => {
      const country: Country = createMockCountry({
        code: 'ES',
        name: 'ספרד',
        englishName: 'Spain',
      });

      expect(country.code).toBe('ES');
      expect(country.name).toBe('ספרד');
    });

    it('should support all category fields', () => {
      const categories: CountryCategories = fullCategories;

      expect(categories.general).toBeDefined();
      expect(categories.visa).toBeDefined();
      expect(categories.language).toBeDefined();
      expect(categories.safety).toBeDefined();
      expect(categories.jewish).toBeDefined();
      expect(categories.openness).toBeDefined();
      expect(categories.healthcare).toBeDefined();
      expect(categories.education).toBeDefined();
      expect(categories.employment).toBeDefined();
      expect(categories.transport).toBeDefined();
      expect(categories.cost).toBeDefined();
      expect(categories.distance).toBeDefined();
      expect(categories.community).toBeDefined();
    });

    it('should allow partial categories', () => {
      const partial: CountryCategories = {
        general: 'מידע כללי',
        visa: 'מידע על ויזה',
      };

      expect(partial.general).toBe('מידע כללי');
      expect(partial.healthcare).toBeUndefined();
    });
  });

  describe('Questionnaire Reports Schema', () => {
    it('should accept valid report data', () => {
      const report: Omit<NewQuestionnaireReport, 'userId' | 'questionnaireId'> = validReportData;

      expect(report.greeting).toContain('משפחת ישראלי');
      expect(report.profileSummary.userName).toBe('ישראלי');
      expect(report.status).toBe('draft');
    });

    it('should create mock report with defaults', () => {
      const report: QuestionnaireReport = createMockReport();

      expect(report.id).toBeDefined();
      expect(report.userId).toBeDefined();
      expect(report.questionnaireId).toBeDefined();
      expect(report.status).toBe('draft');
      expect(report.publishedAt).toBeNull();
    });

    it('should allow changing report status to published', () => {
      const report: QuestionnaireReport = createMockReport({
        status: 'published',
        publishedAt: new Date(),
      });

      expect(report.status).toBe('published');
      expect(report.publishedAt).toBeInstanceOf(Date);
    });

    it('should support full profile summary', () => {
      const summary: ReportProfileSummary = sampleProfileSummary;

      expect(summary.userName).toBe('בכר');
      expect(summary.citizenship).toBe('ישראלית');
      expect(summary.age).toBe('42');
      expect(summary.profession).toBe('עורך דין');
      expect(summary.familyStatus).toBe('נשוי + 2 ילדים');
      expect(summary.netIncome).toBe('40,000 ₪');
      expect(summary.passiveIncome).toBe('5,000 ₪');
      expect(summary.relocationGoals).toBe('חינוך, ביטחון, איכות חיים');
    });

    it('should allow minimal profile summary', () => {
      const minimal: ReportProfileSummary = {
        userName: 'Test',
      };

      expect(minimal.userName).toBe('Test');
      expect(minimal.citizenship).toBeUndefined();
    });
  });

  describe('Country Responses Schema', () => {
    it('should accept valid country response data', () => {
      const response = validCountryResponseData;

      expect(response.matchScore).toBe(92);
      expect(response.visaType).toBe('נוודים דיגיטליים D8');
      expect(response.matchReasons).toHaveLength(3);
      expect(response.personalizedContent.visaPath).toBeDefined();
    });

    it('should create mock country response with defaults', () => {
      const response: CountryResponse = createMockCountryResponse();

      expect(response.id).toBeDefined();
      expect(response.reportId).toBeDefined();
      expect(response.countryId).toBeDefined();
      expect(response.displayOrder).toBe(1);
      expect(response.matchScore).toBe(92);
      expect(response.status).toBe('draft');
    });

    it('should support display ordering', () => {
      const response1 = createMockCountryResponse({ displayOrder: 1 });
      const response2 = createMockCountryResponse({ displayOrder: 2 });
      const response3 = createMockCountryResponse({ displayOrder: 3 });

      expect(response1.displayOrder).toBeLessThan(response2.displayOrder);
      expect(response2.displayOrder).toBeLessThan(response3.displayOrder);
    });

    it('should validate match score range', () => {
      const lowScore = createMockCountryResponse({ matchScore: 0 });
      const highScore = createMockCountryResponse({ matchScore: 100 });

      expect(lowScore.matchScore).toBe(0);
      expect(highScore.matchScore).toBe(100);
    });

    it('should support personalized content', () => {
      const content: PersonalizedContent = samplePersonalizedContent;

      expect(content.visaPath).toContain('D8');
      expect(content.howYouFit).toContain('עורך דין');
      expect(content.whyRightForYou).toContain('ילדים');
      expect(content.advantages).toHaveLength(3);
    });

    it('should allow category overrides', () => {
      const response: CountryResponse = createMockCountryResponse({
        categoryOverrides: {
          visa: 'מידע מותאם אישית על ויזה',
          education: 'מידע מותאם על חינוך לילדיכם',
        },
      });

      expect(response.categoryOverrides?.visa).toContain('מותאם אישית');
      expect(response.categoryOverrides?.education).toContain('ילדיכם');
    });

    it('should allow publishing individual country responses', () => {
      const unpublished = createMockCountryResponse({ status: 'draft' });
      const published = createMockCountryResponse({
        status: 'published',
        publishedAt: new Date(),
      });

      expect(unpublished.status).toBe('draft');
      expect(unpublished.publishedAt).toBeNull();
      expect(published.status).toBe('published');
      expect(published.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('Notifications Schema', () => {
    it('should accept valid notification data', () => {
      const notification = validNotificationData;

      expect(notification.type).toBe('country_response_ready');
      expect(notification.title).toBe('המלצה חדשה זמינה');
      expect(notification.isRead).toBe(false);
    });

    it('should create mock notification with defaults', () => {
      const notification: Notification = createMockNotification();

      expect(notification.id).toBeDefined();
      expect(notification.userId).toBeDefined();
      expect(notification.type).toBe('country_response_ready');
      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeNull();
    });

    it('should support all notification types', () => {
      const types = ['country_response_ready', 'report_ready', 'questionnaire_completed'] as const;

      types.forEach((type) => {
        const notification = createMockNotification({ type });
        expect(notification.type).toBe(type);
      });
    });

    it('should track read status', () => {
      const unread = createMockNotification({ isRead: false, readAt: null });
      const read = createMockNotification({
        isRead: true,
        readAt: new Date(),
      });

      expect(unread.isRead).toBe(false);
      expect(unread.readAt).toBeNull();
      expect(read.isRead).toBe(true);
      expect(read.readAt).toBeInstanceOf(Date);
    });

    it('should support sample notification templates', () => {
      expect(sampleNotifications.countryResponseReady.type).toBe('country_response_ready');
      expect(sampleNotifications.reportReady.type).toBe('report_ready');
      expect(sampleNotifications.questionnaireCompleted.type).toBe('questionnaire_completed');
    });

    it('should allow related entity reference', () => {
      const withRelated = createMockNotification({
        relatedId: 'some-entity-uuid',
      });
      const withoutRelated = createMockNotification({
        relatedId: undefined,
      });

      expect(withRelated.relatedId).toBe('some-entity-uuid');
      expect(withoutRelated.relatedId).toBeUndefined();
    });
  });

  describe('Schema Relationships', () => {
    it('should link country response to report', () => {
      const report = createMockReport({ id: 'report-123' });
      const response = createMockCountryResponse({
        reportId: report.id,
      });

      expect(response.reportId).toBe(report.id);
    });

    it('should link country response to country', () => {
      const country = createMockCountry({ id: 'country-456' });
      const response = createMockCountryResponse({
        countryId: country.id,
      });

      expect(response.countryId).toBe(country.id);
    });

    it('should support multiple country responses per report', () => {
      const reportId = 'shared-report-id';
      const responses = [
        createMockCountryResponse({ reportId, displayOrder: 1 }),
        createMockCountryResponse({ reportId, displayOrder: 2 }),
        createMockCountryResponse({ reportId, displayOrder: 3 }),
      ];

      expect(responses.every((r) => r.reportId === reportId)).toBe(true);
      expect(responses.map((r) => r.displayOrder)).toEqual([1, 2, 3]);
    });

    it('should link notification to user', () => {
      const userId = 'user-789';
      const notification = createMockNotification({ userId });

      expect(notification.userId).toBe(userId);
    });
  });
});
