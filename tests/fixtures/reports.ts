import type {
  QuestionnaireReport,
  NewQuestionnaireReport,
  CountryResponse,
  NewCountryResponse,
  ReportProfileSummary,
  PersonalizedContent,
} from '../../src/db/schema/reports.js';
import type { ListReportsQuery } from '../../src/modules/reports/reports.schema.js';

/**
 * Valid report data for testing
 */
export const validReportData: Omit<NewQuestionnaireReport, 'userId' | 'questionnaireId'> = {
  greeting: 'שלום משפחת ישראלי, הכנו עבורכם סקירה אישית של מדינות מומלצות.',
  profileSummary: {
    userName: 'ישראלי',
    citizenship: 'ישראלית',
    age: '35',
    profession: 'מפתח תוכנה',
    familyStatus: 'נשוי + 2',
    netIncome: '40,000 ₪',
    relocationGoals: 'חינוך טוב יותר לילדים, איכות חיים',
  },
  status: 'draft',
};

/**
 * Create mock questionnaire report with overrides
 */
export const createMockReport = (overrides: Partial<QuestionnaireReport> = {}): QuestionnaireReport => ({
  id: 'report-uuid-123',
  userId: 'user-uuid-123',
  questionnaireId: 'questionnaire-uuid-123',
  greeting: 'שלום משפחת ישראלי',
  profileSummary: {
    userName: 'ישראלי',
  },
  status: 'draft',
  publishedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

/**
 * Valid country response data for testing
 */
export const validCountryResponseData: Omit<NewCountryResponse, 'reportId' | 'countryId'> = {
  displayOrder: 1,
  matchScore: 92,
  visaType: 'נוודים דיגיטליים D8',
  matchReasons: [
    'הכנסה מספיקה לדרישות',
    'ניסיון עבודה מרחוק',
    'כישורים אקדמיים מתאימים',
  ],
  personalizedContent: {
    visaPath: 'פורטוגל מציעה ויזת נוודים דיגיטליים...',
    howYouFit: 'בתור מפתח תוכנה עם ניסיון עבודה מרחוק...',
    whyRightForYou: 'איכות החיים והאקלים הנוח מתאימים למשפחה...',
    advantages: [
      'חינוך בינלאומי באנגלית',
      'קהילה ישראלית תומכת',
      'מסלול הגירה ברור',
    ],
  },
  status: 'draft',
};

/**
 * Create mock country response with overrides
 */
export const createMockCountryResponse = (
  overrides: Partial<CountryResponse> = {}
): CountryResponse => ({
  id: 'response-uuid-123',
  reportId: 'report-uuid-123',
  countryId: 'country-uuid-123',
  displayOrder: 1,
  matchScore: 92,
  visaType: 'נוודים דיגיטליים D8',
  matchReasons: ['הכנסה מספיקה'],
  personalizedContent: {},
  categoryOverrides: null,
  status: 'draft',
  publishedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

/**
 * Sample profile summary for testing
 */
export const sampleProfileSummary: ReportProfileSummary = {
  userName: 'בכר',
  citizenship: 'ישראלית',
  age: '42',
  profession: 'עורך דין',
  familyStatus: 'נשוי + 2 ילדים',
  netIncome: '40,000 ₪',
  passiveIncome: '5,000 ₪',
  relocationGoals: 'חינוך, ביטחון, איכות חיים',
};

/**
 * Sample personalized content for testing
 */
export const samplePersonalizedContent: PersonalizedContent = {
  visaPath: 'פורטוגל מציעה ויזת נוודים דיגיטליים (D8).',
  howYouFit: 'כעורך דין עם יכולת עבודה אונליין, אתם מתאימים בדיוק לדרישות.',
  whyRightForYou: 'הילדים יוכלו להשתלב בחינוך ציבורי איכותי.',
  advantages: [
    'חינוך בינלאומי באנגלית לילדים',
    'קהילה ישראלית חמה ותומכת',
    'מסלול הגירה ברור ויציב',
  ],
};

/**
 * Create mock list reports query with defaults
 */
export const createMockListReportsQuery = (
  overrides: Partial<ListReportsQuery> = {}
): ListReportsQuery => ({
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...overrides,
});

/**
 * Create mock user info
 */
export const createMockUserInfo = (overrides: Partial<{ id: string; firstName: string | null; lastName: string | null }> = {}) => ({
  id: 'user-uuid-123',
  firstName: 'ישראל',
  lastName: 'ישראלי',
  ...overrides,
});
