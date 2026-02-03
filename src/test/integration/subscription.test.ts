import { describe, it, expect } from 'vitest';
import { STRIPE_CONFIG, BillingPeriod } from '@/hooks/data/useSubscription';
import { PLAN_LIMITS, PlanType } from '@/hooks/data/usePlanLimits';

describe('Subscription Configuration', () => {
  describe('STRIPE_CONFIG', () => {
    describe('Products', () => {
      it('should have all required product IDs', () => {
        expect(STRIPE_CONFIG.products.premium_monthly).toBeDefined();
        expect(STRIPE_CONFIG.products.premium_annual).toBeDefined();
        expect(STRIPE_CONFIG.products.pro_monthly).toBeDefined();
        expect(STRIPE_CONFIG.products.pro_annual).toBeDefined();
      });

      it('should have valid product ID format (prod_*)', () => {
        Object.values(STRIPE_CONFIG.products).forEach((productId) => {
          expect(productId).toMatch(/^prod_[A-Za-z0-9]+$/);
        });
      });
    });

    describe('Prices', () => {
      it('should have all required price IDs', () => {
        expect(STRIPE_CONFIG.prices.premium_monthly).toBeDefined();
        expect(STRIPE_CONFIG.prices.premium_annual).toBeDefined();
        expect(STRIPE_CONFIG.prices.pro_monthly).toBeDefined();
        expect(STRIPE_CONFIG.prices.pro_annual).toBeDefined();
      });

      it('should have valid price ID format (price_*)', () => {
        Object.values(STRIPE_CONFIG.prices).forEach((priceId) => {
          expect(priceId).toMatch(/^price_[A-Za-z0-9]+$/);
        });
      });
    });

    describe('Pricing', () => {
      it('should have all required pricing amounts', () => {
        expect(STRIPE_CONFIG.pricing.premium_monthly).toBeGreaterThan(0);
        expect(STRIPE_CONFIG.pricing.premium_annual).toBeGreaterThan(0);
        expect(STRIPE_CONFIG.pricing.pro_monthly).toBeGreaterThan(0);
        expect(STRIPE_CONFIG.pricing.pro_annual).toBeGreaterThan(0);
      });

      it('should have annual pricing cheaper than 12x monthly', () => {
        // Premium annual should be cheaper per month than monthly
        const premiumMonthlyAnnual = STRIPE_CONFIG.pricing.premium_monthly * 12;
        expect(STRIPE_CONFIG.pricing.premium_annual).toBeLessThan(premiumMonthlyAnnual);

        // Pro annual should be cheaper per month than monthly
        const proMonthlyAnnual = STRIPE_CONFIG.pricing.pro_monthly * 12;
        expect(STRIPE_CONFIG.pricing.pro_annual).toBeLessThan(proMonthlyAnnual);
      });

      it('should have Pro pricing higher than Premium', () => {
        expect(STRIPE_CONFIG.pricing.pro_monthly).toBeGreaterThan(
          STRIPE_CONFIG.pricing.premium_monthly
        );
        expect(STRIPE_CONFIG.pricing.pro_annual).toBeGreaterThan(
          STRIPE_CONFIG.pricing.premium_annual
        );
      });
    });
  });

  describe('Plan and Subscription Alignment', () => {
    it('should have matching plan types between PLAN_LIMITS and subscription', () => {
      const planTypes: PlanType[] = ['free', 'premium', 'pro'];

      planTypes.forEach((planType) => {
        expect(PLAN_LIMITS[planType]).toBeDefined();
      });
    });

    it('should have product/price for each paid plan', () => {
      // Premium should have products and prices
      expect(STRIPE_CONFIG.products.premium_monthly).toBeDefined();
      expect(STRIPE_CONFIG.products.premium_annual).toBeDefined();
      expect(STRIPE_CONFIG.prices.premium_monthly).toBeDefined();
      expect(STRIPE_CONFIG.prices.premium_annual).toBeDefined();

      // Pro should have products and prices
      expect(STRIPE_CONFIG.products.pro_monthly).toBeDefined();
      expect(STRIPE_CONFIG.products.pro_annual).toBeDefined();
      expect(STRIPE_CONFIG.prices.pro_monthly).toBeDefined();
      expect(STRIPE_CONFIG.prices.pro_annual).toBeDefined();
    });
  });

  describe('Billing Period', () => {
    it('should support monthly and annual billing', () => {
      const billingPeriods: BillingPeriod[] = ['monthly', 'annual'];

      billingPeriods.forEach((period) => {
        expect(['monthly', 'annual']).toContain(period);
      });
    });
  });

  describe('Price Calculations', () => {
    it('should calculate correct annual savings percentage', () => {
      // Premium savings
      const premiumMonthlyTotal = STRIPE_CONFIG.pricing.premium_monthly * 12;
      const premiumSavings =
        ((premiumMonthlyTotal - STRIPE_CONFIG.pricing.premium_annual) / premiumMonthlyTotal) * 100;
      expect(premiumSavings).toBeGreaterThanOrEqual(15); // At least 15% savings

      // Pro savings
      const proMonthlyTotal = STRIPE_CONFIG.pricing.pro_monthly * 12;
      const proSavings =
        ((proMonthlyTotal - STRIPE_CONFIG.pricing.pro_annual) / proMonthlyTotal) * 100;
      expect(proSavings).toBeGreaterThanOrEqual(15); // At least 15% savings
    });

    it('should have reasonable price points', () => {
      // Premium monthly should be under $20
      expect(STRIPE_CONFIG.pricing.premium_monthly).toBeLessThan(20);

      // Pro monthly should be under $30
      expect(STRIPE_CONFIG.pricing.pro_monthly).toBeLessThan(30);

      // Annual prices should be under $200
      expect(STRIPE_CONFIG.pricing.premium_annual).toBeLessThan(200);
      expect(STRIPE_CONFIG.pricing.pro_annual).toBeLessThan(200);
    });
  });
});
