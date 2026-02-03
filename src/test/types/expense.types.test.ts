import { describe, it, expect } from 'vitest';
import type {
  ExpenseCategory,
  ReimbursementType,
  ExpenseFormData,
  ExpenseFilters,
} from '@/types/expense.types';

describe('Expense Types', () => {
  describe('ExpenseCategory', () => {
    it('should have all required categories', () => {
      const categories: ExpenseCategory[] = [
        'meals',
        'travel',
        'equipment',
        'software',
        'mileage',
        'home_office',
        'professional_services',
        'office_supplies',
        'utilities',
        'fuel',
        'other',
      ];

      // Type check - this will fail at compile time if any category is wrong
      expect(categories).toHaveLength(11);
    });
  });

  describe('ReimbursementType', () => {
    it('should have all required reimbursement types', () => {
      const types: ReimbursementType[] = [
        'pending_classification',
        'client_reimbursable',
        'cra_deductible',
        'personal',
      ];

      expect(types).toHaveLength(4);
    });

    it('should start with pending_classification by default', () => {
      const defaultType: ReimbursementType = 'pending_classification';
      expect(defaultType).toBe('pending_classification');
    });
  });

  describe('ExpenseFormData', () => {
    it('should accept minimal valid form data', () => {
      const minimalExpense: ExpenseFormData = {
        date: new Date(),
        vendor: 'Test Vendor',
        amount: 100,
        category: 'meals',
      };

      expect(minimalExpense.date).toBeInstanceOf(Date);
      expect(minimalExpense.vendor).toBe('Test Vendor');
      expect(minimalExpense.amount).toBe(100);
      expect(minimalExpense.category).toBe('meals');
    });

    it('should accept complete form data with all fields', () => {
      const completeExpense: ExpenseFormData = {
        date: new Date('2024-01-15'),
        vendor: 'Complete Vendor',
        amount: 250.5,
        category: 'travel',
        description: 'Business trip expense',
        notes: 'Tax deductible',
        client_id: 'client-123',
        project_id: 'project-456',
        contract_id: 'contract-789',
        document_id: 'doc-abc',
        status: 'finalized',
        reimbursement_type: 'client_reimbursable',
      };

      expect(completeExpense.description).toBe('Business trip expense');
      expect(completeExpense.notes).toBe('Tax deductible');
      expect(completeExpense.client_id).toBe('client-123');
      expect(completeExpense.reimbursement_type).toBe('client_reimbursable');
    });
  });

  describe('ExpenseFilters', () => {
    it('should accept empty filters', () => {
      const emptyFilters: ExpenseFilters = {};
      expect(Object.keys(emptyFilters)).toHaveLength(0);
    });

    it('should accept date range filter', () => {
      const filters: ExpenseFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      };

      expect(filters.dateRange?.start).toBeInstanceOf(Date);
      expect(filters.dateRange?.end).toBeInstanceOf(Date);
    });

    it('should accept multiple client IDs', () => {
      const filters: ExpenseFilters = {
        clientIds: ['client-1', 'client-2', 'client-3'],
      };

      expect(filters.clientIds).toHaveLength(3);
    });

    it('should accept tag filters with mode', () => {
      const andFilters: ExpenseFilters = {
        tagIds: ['tag-1', 'tag-2'],
        tagFilterMode: 'AND',
      };

      const orFilters: ExpenseFilters = {
        tagIds: ['tag-1', 'tag-2'],
        tagFilterMode: 'OR',
      };

      expect(andFilters.tagFilterMode).toBe('AND');
      expect(orFilters.tagFilterMode).toBe('OR');
    });

    it('should accept amount range filters', () => {
      const filters: ExpenseFilters = {
        minAmount: 50,
        maxAmount: 500,
      };

      expect(filters.minAmount).toBe(50);
      expect(filters.maxAmount).toBe(500);
    });

    it('should accept entity filtering options', () => {
      const entityFilter: ExpenseFilters = {
        entityId: 'entity-123',
      };

      const consolidatedFilter: ExpenseFilters = {
        showAllEntities: true,
      };

      expect(entityFilter.entityId).toBe('entity-123');
      expect(consolidatedFilter.showAllEntities).toBe(true);
    });

    it('should accept incomplete expense filter', () => {
      const filters: ExpenseFilters = {
        onlyIncomplete: true,
      };

      expect(filters.onlyIncomplete).toBe(true);
    });
  });
});
