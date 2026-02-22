import { describe, it, expect } from 'vitest';
import type {
  IncomeType,
  RecurrenceType,
  Income,
  IncomeFormData,
} from '@/types/income.types';

describe('Income Types', () => {
  describe('IncomeType', () => {
    it('should have all required income types', () => {
      const incomeTypes: IncomeType[] = [
        'salary',
        'client_payment',
        'bonus',
        'gift',
        'refund',
        'investment_stocks',
        'investment_crypto',
        'investment_funds',
        'passive_rental',
        'passive_royalties',
        'online_business',
        'freelance',
        'other',
      ];

      expect(incomeTypes).toHaveLength(13);
    });

    it('should include investment types', () => {
      const investmentTypes: IncomeType[] = [
        'investment_stocks',
        'investment_crypto',
        'investment_funds',
      ];

      investmentTypes.forEach((type) => {
        expect(type).toContain('investment');
      });
    });

    it('should include passive income types', () => {
      const passiveTypes: IncomeType[] = ['passive_rental', 'passive_royalties'];

      passiveTypes.forEach((type) => {
        expect(type).toContain('passive');
      });
    });
  });

  describe('RecurrenceType', () => {
    it('should have all required recurrence types', () => {
      const recurrenceTypes: RecurrenceType[] = [
        'one_time',
        'daily',
        'weekly',
        'biweekly',
        'monthly',
        'quarterly',
        'yearly',
      ];

      expect(recurrenceTypes).toHaveLength(7);
    });

    it('should have one_time as default option', () => {
      const defaultRecurrence: RecurrenceType = 'one_time';
      expect(defaultRecurrence).toBe('one_time');
    });
  });

  describe('IncomeFormData', () => {
    it('should accept minimal valid form data', () => {
      const minimalIncome: IncomeFormData = {
        amount: 5000,
        currency: 'CAD',
        date: new Date(),
        income_type: 'salary',
        recurrence: 'monthly',
        is_taxable: true,
      };

      expect(minimalIncome.amount).toBe(5000);
      expect(minimalIncome.currency).toBe('CAD');
      expect(minimalIncome.income_type).toBe('salary');
      expect(minimalIncome.is_taxable).toBe(true);
    });

    it('should accept complete form data with all fields', () => {
      const completeIncome: IncomeFormData = {
        amount: 1500,
        currency: 'USD',
        date: new Date('2024-03-15'),
        income_type: 'client_payment',
        description: 'Project completion payment',
        source: 'Acme Corp',
        client_id: 'client-123',
        project_id: 'project-456',
        entity_id: 'entity-789',
        recurrence: 'one_time',
        recurrence_end_date: new Date('2024-12-31'),
        is_taxable: true,
        notes: 'Final invoice for Q1 project',
      };

      expect(completeIncome.description).toBe('Project completion payment');
      expect(completeIncome.source).toBe('Acme Corp');
      expect(completeIncome.client_id).toBe('client-123');
      expect(completeIncome.recurrence_end_date).toBeInstanceOf(Date);
    });

    it('should allow non-taxable income', () => {
      const giftIncome: IncomeFormData = {
        amount: 500,
        currency: 'CAD',
        date: new Date(),
        income_type: 'gift',
        recurrence: 'one_time',
        is_taxable: false,
      };

      expect(giftIncome.is_taxable).toBe(false);
    });
  });

  describe('Income Entity', () => {
    it('should have all required fields', () => {
      const income: Income = {
        id: 'inc-123',
        user_id: 'user-456',
        amount: 3000,
        currency: 'CAD',
        date: '2024-01-15',
        income_type: 'salary',
        description: 'Monthly salary',
        source: 'Employer Inc',
        client_id: null,
        project_id: null,
        entity_id: 'entity-789',
        document_id: null,
        recurrence: 'monthly',
        recurrence_end_date: null,
        is_taxable: true,
        notes: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      expect(income.id).toBe('inc-123');
      expect(income.user_id).toBe('user-456');
      expect(income.amount).toBe(3000);
      expect(income.income_type).toBe('salary');
      expect(income.is_taxable).toBe(true);
    });

    it('should allow null values for optional fields', () => {
      const incomeWithNulls: Income = {
        id: 'inc-456',
        user_id: 'user-789',
        amount: 100,
        currency: 'CAD',
        date: '2024-02-01',
        income_type: 'other',
        description: null,
        source: null,
        client_id: null,
        project_id: null,
        entity_id: null,
        document_id: null,
        recurrence: 'one_time',
        recurrence_end_date: null,
        is_taxable: false,
        notes: null,
        created_at: '2024-02-01T00:00:00Z',
        updated_at: '2024-02-01T00:00:00Z',
      };

      expect(incomeWithNulls.description).toBeNull();
      expect(incomeWithNulls.source).toBeNull();
      expect(incomeWithNulls.client_id).toBeNull();
      expect(incomeWithNulls.entity_id).toBeNull();
    });
  });

  describe('Currency Support', () => {
    it('should accept common currencies', () => {
      const currencies = ['CAD', 'USD', 'EUR', 'GBP', 'MXN', 'CLP'];

      currencies.forEach((currency) => {
        const income: IncomeFormData = {
          amount: 1000,
          currency,
          date: new Date(),
          income_type: 'salary',
          recurrence: 'monthly',
          is_taxable: true,
        };

        expect(income.currency).toBe(currency);
      });
    });
  });
});
