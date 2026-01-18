import { describe, it, expect } from 'vitest';
import {
  genderSchema,
  familyStatusSchema,
  processPartnerSchema,
  employmentStatusSchema,
  incomeRangeSchema,
  proximityToIsraelSchema,
  timeZoneDifferenceSchema,
  weatherPreferenceSchema,
  livingStyleSchema,
  visaAttemptStatusSchema,
  relocationReasonSchema,
  childSchema,
  personalDetailsSchema,
  spouseDetailsSchema,
  employmentDetailsSchema,
  studiesInvestmentsSchema,
  languagesSchema,
  preferencesSchema,
  bureaucracySchema,
  responsesSchema,
  createQuestionnaireSchema,
  updateQuestionnaireSchema,
  completeQuestionnaireSchema,
} from '../../../src/modules/questionnaire/questionnaire.schema.js';
import { VALID_STEPS } from '../../../src/modules/questionnaire/questionnaire.types.js';

describe('Questionnaire Schema (V2)', () => {
  // =========================================================================
  // Enum Schema Tests
  // =========================================================================
  describe('Enum Schemas', () => {
    describe('genderSchema', () => {
      it('should accept valid gender values', () => {
        expect(genderSchema.safeParse('male').success).toBe(true);
        expect(genderSchema.safeParse('female').success).toBe(true);
        expect(genderSchema.safeParse('prefer_not_to_say').success).toBe(true);
      });

      it('should reject invalid gender values', () => {
        expect(genderSchema.safeParse('other').success).toBe(false);
        expect(genderSchema.safeParse('').success).toBe(false);
        expect(genderSchema.safeParse(123).success).toBe(false);
      });
    });

    describe('familyStatusSchema', () => {
      it('should accept all valid family status values', () => {
        const validValues = [
          'single',
          'single_with_children',
          'married',
          'married_with_children',
          'divorced',
          'divorced_with_children',
          'widowed',
          'widowed_with_children',
        ];
        validValues.forEach((value) => {
          expect(familyStatusSchema.safeParse(value).success).toBe(true);
        });
      });

      it('should reject invalid family status values', () => {
        expect(familyStatusSchema.safeParse('partner').success).toBe(false);
        expect(familyStatusSchema.safeParse('').success).toBe(false);
      });
    });

    describe('processPartnerSchema', () => {
      it('should accept valid process partner values', () => {
        const validValues = [
          'alone',
          'spouse',
          'spouse_and_children',
          'children_only',
          'ex_spouse_and_children',
        ];
        validValues.forEach((value) => {
          expect(processPartnerSchema.safeParse(value).success).toBe(true);
        });
      });
    });

    describe('employmentStatusSchema', () => {
      it('should accept valid employment status values', () => {
        const validValues = [
          'employed',
          'self_employed',
          'business_owner',
          'unemployed',
          'retired',
        ];
        validValues.forEach((value) => {
          expect(employmentStatusSchema.safeParse(value).success).toBe(true);
        });
      });
    });

    describe('incomeRangeSchema', () => {
      it('should accept valid income range values', () => {
        const validValues = [
          'up_to_10000',
          '10000_15000',
          '15000_20000',
          '20000_25000',
          '25000_30000',
          '30000_35000',
          '35000_40000',
          '40000_50000',
          '50000_60000',
          'above_60000',
        ];
        validValues.forEach((value) => {
          expect(incomeRangeSchema.safeParse(value).success).toBe(true);
        });
      });
    });

    describe('proximityToIsraelSchema', () => {
      it('should accept valid proximity values', () => {
        expect(proximityToIsraelSchema.safeParse('up_to_3h').success).toBe(true);
        expect(proximityToIsraelSchema.safeParse('up_to_6h').success).toBe(true);
        expect(proximityToIsraelSchema.safeParse('up_to_12h').success).toBe(true);
        expect(proximityToIsraelSchema.safeParse('not_important').success).toBe(true);
      });
    });

    describe('timeZoneDifferenceSchema', () => {
      it('should accept valid time zone difference values', () => {
        const validValues = [
          'up_to_1h',
          'up_to_2h',
          'up_to_6h',
          'up_to_8h',
          'up_to_10h',
          'not_important',
        ];
        validValues.forEach((value) => {
          expect(timeZoneDifferenceSchema.safeParse(value).success).toBe(true);
        });
      });
    });

    describe('weatherPreferenceSchema', () => {
      it('should accept valid weather preference values', () => {
        expect(weatherPreferenceSchema.safeParse('four_seasons').success).toBe(true);
        expect(weatherPreferenceSchema.safeParse('hot_year_round').success).toBe(true);
        expect(weatherPreferenceSchema.safeParse('cold_year_round').success).toBe(true);
        expect(weatherPreferenceSchema.safeParse('no_preference').success).toBe(true);
      });
    });

    describe('livingStyleSchema', () => {
      it('should accept valid living style values', () => {
        const validValues = ['big_city', 'small_town', 'rural', 'coastal', 'no_preference'];
        validValues.forEach((value) => {
          expect(livingStyleSchema.safeParse(value).success).toBe(true);
        });
      });
    });

    describe('visaAttemptStatusSchema', () => {
      it('should accept valid visa attempt status values', () => {
        expect(visaAttemptStatusSchema.safeParse('never_tried').success).toBe(true);
        expect(visaAttemptStatusSchema.safeParse('tried_approved').success).toBe(true);
        expect(visaAttemptStatusSchema.safeParse('tried_rejected').success).toBe(true);
      });
    });

    describe('relocationReasonSchema', () => {
      it('should accept valid relocation reason values', () => {
        const validValues = [
          'economic_comfort',
          'personal_safety',
          'education_for_children',
          'future_for_family',
          'professional_development',
          'real_estate_opportunity',
          'academic_opportunity',
          'adventure',
          'life_change',
          'just_exploring',
        ];
        validValues.forEach((value) => {
          expect(relocationReasonSchema.safeParse(value).success).toBe(true);
        });
      });
    });
  });

  // =========================================================================
  // Component Schema Tests
  // =========================================================================
  describe('Component Schemas', () => {
    describe('childSchema', () => {
      it('should accept valid child data', () => {
        const validChild = { name: 'David', age: 10 };
        const result = childSchema.safeParse(validChild);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe('David');
          expect(result.data.age).toBe(10);
        }
      });

      it('should reject child with empty name', () => {
        const result = childSchema.safeParse({ name: '', age: 5 });
        expect(result.success).toBe(false);
      });

      it('should reject child with negative age', () => {
        const result = childSchema.safeParse({ name: 'Sarah', age: -1 });
        expect(result.success).toBe(false);
      });

      it('should reject child with age over 120', () => {
        const result = childSchema.safeParse({ name: 'Sarah', age: 121 });
        expect(result.success).toBe(false);
      });

      it('should reject child with name over 200 characters', () => {
        const longName = 'a'.repeat(201);
        const result = childSchema.safeParse({ name: longName, age: 10 });
        expect(result.success).toBe(false);
      });
    });

    describe('personalDetailsSchema', () => {
      it('should accept valid personal details', () => {
        const validDetails = {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+972501234567',
          birthDate: '1990-01-15',
          gender: 'male',
          familyStatus: 'married_with_children',
          processPartner: 'spouse_and_children',
        };
        const result = personalDetailsSchema.safeParse(validDetails);
        expect(result.success).toBe(true);
      });

      it('should accept partial personal details', () => {
        const partialDetails = {
          fullName: 'Jane Doe',
        };
        const result = personalDetailsSchema.safeParse(partialDetails);
        expect(result.success).toBe(true);
      });

      it('should accept undefined (optional schema)', () => {
        const result = personalDetailsSchema.safeParse(undefined);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const result = personalDetailsSchema.safeParse({
          email: 'not-an-email',
        });
        expect(result.success).toBe(false);
      });

      it('should reject name over 200 characters', () => {
        const longName = 'a'.repeat(201);
        const result = personalDetailsSchema.safeParse({
          fullName: longName,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('spouseDetailsSchema', () => {
      it('should accept valid spouse details', () => {
        const validDetails = {
          name: 'Jane Doe',
          birthDate: '1992-05-20',
          citizenship: 'Israeli',
          employmentStatus: 'employed',
          fieldOfWork: 'Software Engineering',
          highestEducation: 'Masters Degree',
          canWorkRemotely: true,
          openToStudyingAbroad: false,
          speakingLanguages: ['Hebrew', 'English', 'French'],
          writingLanguages: ['Hebrew', 'English'],
        };
        const result = spouseDetailsSchema.safeParse(validDetails);
        expect(result.success).toBe(true);
      });

      it('should reject languages array with more than 5 items', () => {
        const result = spouseDetailsSchema.safeParse({
          speakingLanguages: ['Hebrew', 'English', 'French', 'Spanish', 'German', 'Italian'],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('employmentDetailsSchema', () => {
      it('should accept valid employment details', () => {
        const validDetails = {
          employmentStatus: 'self_employed',
          fieldOfWork: 'Consulting',
          highestEducation: 'PhD',
          canWorkRemotely: true,
          monthlyIncome: '40000_50000',
          hasPassiveIncome: true,
          passiveIncomeAmount: '5000 ILS',
        };
        const result = employmentDetailsSchema.safeParse(validDetails);
        expect(result.success).toBe(true);
      });

      it('should accept minimal employment details', () => {
        const result = employmentDetailsSchema.safeParse({
          employmentStatus: 'retired',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('studiesInvestmentsSchema', () => {
      it('should accept valid studies and investments data', () => {
        const validData = {
          openToStudyingAbroad: true,
          spouseOpenToStudyingAbroad: false,
          willingToInvestInProperty: true,
          has250kEuroForInvestment: false,
        };
        const result = studiesInvestmentsSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept partial data', () => {
        const result = studiesInvestmentsSchema.safeParse({
          openToStudyingAbroad: true,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('languagesSchema', () => {
      it('should accept valid languages data', () => {
        const validData = {
          speakingLanguages: ['Hebrew', 'English'],
          writingLanguages: ['Hebrew', 'English', 'Arabic'],
        };
        const result = languagesSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject more than 5 languages', () => {
        const result = languagesSchema.safeParse({
          speakingLanguages: ['Hebrew', 'English', 'Arabic', 'French', 'Spanish', 'German'],
        });
        expect(result.success).toBe(false);
      });

      it('should reject language names over 50 characters', () => {
        const longLanguage = 'a'.repeat(51);
        const result = languagesSchema.safeParse({
          speakingLanguages: [longLanguage],
        });
        expect(result.success).toBe(false);
      });
    });

    describe('preferencesSchema', () => {
      it('should accept valid preferences', () => {
        const validPreferences = {
          proximityToIsrael: 'up_to_6h',
          timeZoneDifference: 'up_to_2h',
          weatherPreference: 'four_seasons',
          religiousJewishCommunity: true,
          israeliCommunity: true,
          livingStyle: 'big_city',
          additionalConsiderations: true,
          additionalConsiderationsText: 'Looking for good schools nearby.',
        };
        const result = preferencesSchema.safeParse(validPreferences);
        expect(result.success).toBe(true);
      });

      it('should reject additional considerations text over 2000 characters', () => {
        const longText = 'a'.repeat(2001);
        const result = preferencesSchema.safeParse({
          additionalConsiderationsText: longText,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('bureaucracySchema', () => {
      it('should accept valid bureaucracy data', () => {
        const validData = {
          previousVisaAttempt: 'tried_approved',
          hasCriminalRecord: false,
        };
        const result = bureaucracySchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should accept partial bureaucracy data', () => {
        const result = bureaucracySchema.safeParse({
          hasCriminalRecord: false,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  // =========================================================================
  // Main Responses Schema Tests
  // =========================================================================
  describe('responsesSchema', () => {
    it('should accept complete V2 responses', () => {
      const validResponses = {
        version: 2,
        personalDetails: {
          fullName: 'John Smith',
          email: 'john@example.com',
          gender: 'male',
          familyStatus: 'married_with_children',
          processPartner: 'spouse_and_children',
        },
        spouseDetails: {
          name: 'Jane Smith',
          employmentStatus: 'employed',
        },
        children: [
          { name: 'Alice', age: 10 },
          { name: 'Bob', age: 7 },
        ],
        relocationReasons: ['economic_comfort', 'education_for_children'],
        citizenships: ['Israeli', 'American'],
        spouseCitizenships: ['Israeli'],
        employment: {
          employmentStatus: 'self_employed',
          canWorkRemotely: true,
          monthlyIncome: '50000_60000',
        },
        studiesInvestments: {
          openToStudyingAbroad: true,
          willingToInvestInProperty: true,
        },
        languages: {
          speakingLanguages: ['Hebrew', 'English'],
          writingLanguages: ['Hebrew', 'English'],
        },
        preferences: {
          proximityToIsrael: 'up_to_6h',
          weatherPreference: 'four_seasons',
        },
        bureaucracy: {
          previousVisaAttempt: 'never_tried',
          hasCriminalRecord: false,
        },
      };
      const result = responsesSchema.safeParse(validResponses);
      expect(result.success).toBe(true);
    });

    it('should accept minimal responses with default version', () => {
      const result = responsesSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe(2);
      }
    });

    it('should accept V1 backward-compatible fields', () => {
      const v1Responses = {
        version: 1,
        preferredCountries: ['PT', 'ES', 'GR'],
        relocationReason: 'Looking for better opportunities',
        familyStatus: 'married',
        personalDetails: {
          fullName: 'Test User',
        },
      };
      const result = responsesSchema.safeParse(v1Responses);
      expect(result.success).toBe(true);
    });

    it('should reject more than 8 children', () => {
      const tooManyChildren = Array.from({ length: 9 }, (_, i) => ({
        name: `Child ${i + 1}`,
        age: i + 1,
      }));
      const result = responsesSchema.safeParse({
        children: tooManyChildren,
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 10 relocation reasons', () => {
      const tooManyReasons = Array.from({ length: 11 }, () => 'economic_comfort');
      const result = responsesSchema.safeParse({
        relocationReasons: tooManyReasons,
      });
      expect(result.success).toBe(false);
    });

    it('should allow additional unknown fields (passthrough)', () => {
      const result = responsesSchema.safeParse({
        version: 2,
        customField: 'custom value',
        anotherField: 123,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customField).toBe('custom value');
        expect(result.data.anotherField).toBe(123);
      }
    });
  });

  // =========================================================================
  // Request Schema Tests
  // =========================================================================
  describe('Request Schemas', () => {
    describe('createQuestionnaireSchema', () => {
      it('should accept empty object and provide defaults', () => {
        const result = createQuestionnaireSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.responses.version).toBe(2);
        }
      });

      it('should accept custom responses', () => {
        const result = createQuestionnaireSchema.safeParse({
          responses: {
            personalDetails: {
              fullName: 'New User',
            },
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe('updateQuestionnaireSchema', () => {
      it('should accept responses update', () => {
        const result = updateQuestionnaireSchema.safeParse({
          responses: {
            personalDetails: {
              fullName: 'Updated Name',
            },
          },
        });
        expect(result.success).toBe(true);
      });

      it('should accept step update', () => {
        const result = updateQuestionnaireSchema.safeParse({
          currentStep: 'personal-details',
        });
        expect(result.success).toBe(true);
      });

      it('should accept both responses and step update', () => {
        const result = updateQuestionnaireSchema.safeParse({
          responses: {
            employment: {
              employmentStatus: 'employed',
            },
          },
          currentStep: 'education-employment',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid step name', () => {
        const result = updateQuestionnaireSchema.safeParse({
          currentStep: 'invalid-step',
        });
        expect(result.success).toBe(false);
      });

      it('should accept all valid step names', () => {
        VALID_STEPS.forEach((step) => {
          const result = updateQuestionnaireSchema.safeParse({
            currentStep: step,
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('completeQuestionnaireSchema', () => {
      it('should accept complete responses', () => {
        const result = completeQuestionnaireSchema.safeParse({
          responses: {
            personalDetails: {
              fullName: 'Complete User',
              email: 'complete@example.com',
            },
            bureaucracy: {
              previousVisaAttempt: 'never_tried',
              hasCriminalRecord: false,
            },
          },
        });
        expect(result.success).toBe(true);
      });

      it('should require responses object', () => {
        const result = completeQuestionnaireSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  // =========================================================================
  // VALID_STEPS Constant Tests
  // =========================================================================
  describe('VALID_STEPS', () => {
    it('should have 9 steps', () => {
      expect(VALID_STEPS.length).toBe(9);
    });

    it('should include all V2 step names', () => {
      expect(VALID_STEPS).toContain('intro');
      expect(VALID_STEPS).toContain('personal-details');
      expect(VALID_STEPS).toContain('migration-goals');
      expect(VALID_STEPS).toContain('citizenship');
      expect(VALID_STEPS).toContain('education-employment');
      expect(VALID_STEPS).toContain('studies-investments');
      expect(VALID_STEPS).toContain('languages');
      expect(VALID_STEPS).toContain('preferences');
      expect(VALID_STEPS).toContain('bureaucracy');
    });

    it('should have intro as the first step', () => {
      expect(VALID_STEPS[0]).toBe('intro');
    });

    it('should have bureaucracy as the last step', () => {
      expect(VALID_STEPS[8]).toBe('bureaucracy');
    });
  });
});
