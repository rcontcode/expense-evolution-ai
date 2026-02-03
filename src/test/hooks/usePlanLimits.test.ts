import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, PlanType, FeatureKey } from '@/hooks/data/usePlanLimits';

describe('Plan Limits Configuration', () => {
  describe('Free Plan Limits', () => {
    const freeLimits = PLAN_LIMITS.free;

    it('should have correct expense limits', () => {
      expect(freeLimits.expenses_per_month).toBe(50);
    });

    it('should have correct income limits', () => {
      expect(freeLimits.incomes_per_month).toBe(20);
    });

    it('should have correct OCR scan limits', () => {
      expect(freeLimits.ocr_scans_per_month).toBe(5);
    });

    it('should have correct client limits', () => {
      expect(freeLimits.clients).toBe(2);
    });

    it('should have correct project limits', () => {
      expect(freeLimits.projects).toBe(2);
    });

    it('should NOT have contract analysis', () => {
      expect(freeLimits.contract_analyses_per_month).toBe(0);
    });

    it('should NOT have bank analysis', () => {
      expect(freeLimits.bank_analyses_per_month).toBe(0);
    });

    it('should have limited premium voice minutes', () => {
      expect(freeLimits.voice_minutes_per_month).toBe(3);
    });

    it('should NOT have premium features', () => {
      expect(freeLimits.mileage).toBe(false);
      expect(freeLimits.gamification).toBe(false);
      expect(freeLimits.net_worth).toBe(false);
      expect(freeLimits.tax_calendar).toBe(false);
      expect(freeLimits.export_excel).toBe(false);
      expect(freeLimits.fire_calculator).toBe(false);
      expect(freeLimits.tax_optimizer).toBe(false);
      expect(freeLimits.rrsp_tfsa_optimizer).toBe(false);
      expect(freeLimits.t2125_export).toBe(false);
    });

    it('should have basic voice assistant', () => {
      expect(freeLimits.voice_assistant).toBe(true);
    });
  });

  describe('Premium Plan Limits', () => {
    const premiumLimits = PLAN_LIMITS.premium;

    it('should have unlimited expenses', () => {
      expect(premiumLimits.expenses_per_month).toBe(Infinity);
    });

    it('should have unlimited incomes', () => {
      expect(premiumLimits.incomes_per_month).toBe(Infinity);
    });

    it('should have 50 OCR scans', () => {
      expect(premiumLimits.ocr_scans_per_month).toBe(50);
    });

    it('should have unlimited clients', () => {
      expect(premiumLimits.clients).toBe(Infinity);
    });

    it('should have unlimited projects', () => {
      expect(premiumLimits.projects).toBe(Infinity);
    });

    it('should have 30 minutes premium voice', () => {
      expect(premiumLimits.voice_minutes_per_month).toBe(30);
    });

    it('should have core premium features', () => {
      expect(premiumLimits.mileage).toBe(true);
      expect(premiumLimits.gamification).toBe(true);
      expect(premiumLimits.net_worth).toBe(true);
      expect(premiumLimits.tax_calendar).toBe(true);
      expect(premiumLimits.export_excel).toBe(true);
      expect(premiumLimits.tags_unlimited).toBe(true);
    });

    it('should NOT have pro-only features', () => {
      expect(premiumLimits.fire_calculator).toBe(false);
      expect(premiumLimits.tax_optimizer).toBe(false);
      expect(premiumLimits.rrsp_tfsa_optimizer).toBe(false);
      expect(premiumLimits.t2125_export).toBe(false);
    });

    it('should have 4 mentorship components', () => {
      expect(premiumLimits.mentorship_components).toBe(4);
    });
  });

  describe('Pro Plan Limits', () => {
    const proLimits = PLAN_LIMITS.pro;

    it('should have unlimited core resources', () => {
      expect(proLimits.expenses_per_month).toBe(Infinity);
      expect(proLimits.incomes_per_month).toBe(Infinity);
      expect(proLimits.ocr_scans_per_month).toBe(Infinity);
      expect(proLimits.clients).toBe(Infinity);
      expect(proLimits.projects).toBe(Infinity);
    });

    it('should have unlimited contract and bank analyses', () => {
      expect(proLimits.contract_analyses_per_month).toBe(Infinity);
      expect(proLimits.bank_analyses_per_month).toBe(Infinity);
    });

    it('should have 120 minutes premium voice', () => {
      expect(proLimits.voice_minutes_per_month).toBe(120);
    });

    it('should have ALL features enabled', () => {
      expect(proLimits.mileage).toBe(true);
      expect(proLimits.gamification).toBe(true);
      expect(proLimits.net_worth).toBe(true);
      expect(proLimits.tax_calendar).toBe(true);
      expect(proLimits.export_excel).toBe(true);
      expect(proLimits.tags_unlimited).toBe(true);
      expect(proLimits.fire_calculator).toBe(true);
      expect(proLimits.tax_optimizer).toBe(true);
      expect(proLimits.rrsp_tfsa_optimizer).toBe(true);
      expect(proLimits.t2125_export).toBe(true);
      expect(proLimits.voice_assistant).toBe(true);
    });

    it('should have 8 mentorship components', () => {
      expect(proLimits.mentorship_components).toBe(8);
    });
  });

  describe('Plan Type Definitions', () => {
    it('should have all plan types defined', () => {
      const planTypes: PlanType[] = ['free', 'premium', 'pro'];
      planTypes.forEach((type) => {
        expect(PLAN_LIMITS[type]).toBeDefined();
      });
    });

    it('should have consistent feature keys across all plans', () => {
      const freeKeys = Object.keys(PLAN_LIMITS.free);
      const premiumKeys = Object.keys(PLAN_LIMITS.premium);
      const proKeys = Object.keys(PLAN_LIMITS.pro);

      expect(freeKeys.sort()).toEqual(premiumKeys.sort());
      expect(premiumKeys.sort()).toEqual(proKeys.sort());
    });
  });

  describe('Plan Progression', () => {
    it('should have increasing limits from free to premium to pro', () => {
      // OCR scans progression
      expect(PLAN_LIMITS.free.ocr_scans_per_month).toBeLessThan(
        PLAN_LIMITS.premium.ocr_scans_per_month
      );

      // Voice minutes progression
      expect(PLAN_LIMITS.free.voice_minutes_per_month).toBeLessThan(
        PLAN_LIMITS.premium.voice_minutes_per_month
      );
      expect(PLAN_LIMITS.premium.voice_minutes_per_month).toBeLessThan(
        PLAN_LIMITS.pro.voice_minutes_per_month
      );

      // Mentorship components progression
      expect(PLAN_LIMITS.free.mentorship_components).toBeLessThan(
        PLAN_LIMITS.premium.mentorship_components
      );
      expect(PLAN_LIMITS.premium.mentorship_components).toBeLessThan(
        PLAN_LIMITS.pro.mentorship_components
      );
    });

    it('should unlock more features as plan level increases', () => {
      // Count boolean features that are true
      const countTrueFeatures = (limits: Record<string, unknown>) => {
        return Object.values(limits).filter((v) => v === true).length;
      };

      const freeFeatureCount = countTrueFeatures(PLAN_LIMITS.free as unknown as Record<string, unknown>);
      const premiumFeatureCount = countTrueFeatures(PLAN_LIMITS.premium as unknown as Record<string, unknown>);
      const proFeatureCount = countTrueFeatures(PLAN_LIMITS.pro as unknown as Record<string, unknown>);

      expect(freeFeatureCount).toBeLessThan(premiumFeatureCount);
      expect(premiumFeatureCount).toBeLessThan(proFeatureCount);
    });
  });
});
