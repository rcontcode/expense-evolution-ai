import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Centralized cross-invalidation helper.
 * Every mutation that changes financial data must invalidate related query keys
 * so the entire app stays synchronized across sections.
 */
export function useInvalidateRelated() {
  const queryClient = useQueryClient();

  const invalidate = useCallback((...keys: string[]) => {
    keys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
  }, [queryClient]);

  /** After any expense mutation */
  const afterExpense = useCallback(() => {
    invalidate('expenses', 'dashboard-stats', 'income-summary', 'data-health', 'category-budgets', 'monthly-plan');
  }, [invalidate]);

  /** After any income mutation */
  const afterIncome = useCallback(() => {
    invalidate('income', 'income-summary', 'dashboard-stats', 'data-health', 'monthly-plan');
  }, [invalidate]);

  /** After any client mutation */
  const afterClient = useCallback(() => {
    invalidate('clients', 'dashboard-stats', 'projects-with-clients', 'client-projects', 'data-health');
  }, [invalidate]);

  /** After deleting a client (cascades to contracts, affects expenses/income) */
  const afterClientDelete = useCallback(() => {
    invalidate('clients', 'expenses', 'income', 'mileage', 'contracts', 'dashboard-stats', 'income-summary', 'projects', 'projects-with-clients', 'client-projects', 'data-health', 'monthly-plan');
  }, [invalidate]);

  /** After any project mutation */
  const afterProject = useCallback(() => {
    invalidate('projects', 'projects-with-clients', 'client-projects', 'dashboard-stats', 'data-health');
  }, [invalidate]);

  /** After deleting a project (expenses/income lose project_id) */
  const afterProjectDelete = useCallback(() => {
    invalidate('projects', 'projects-with-clients', 'client-projects', 'expenses', 'income', 'dashboard-stats', 'income-summary', 'data-health', 'monthly-plan');
  }, [invalidate]);

  /** After any contract mutation */
  const afterContract = useCallback(() => {
    invalidate('contracts', 'dashboard-stats', 'clients', 'data-health');
  }, [invalidate]);

  /** After any recurring bill mutation */
  const afterBill = useCallback(() => {
    invalidate('recurring-bills', 'bill-payments', 'dashboard-stats', 'income-summary', 'monthly-plan', 'data-health');
  }, [invalidate]);

  /** After any fiscal entity mutation */
  const afterEntity = useCallback(() => {
    invalidate('fiscal-entities', 'fiscal-entity-primary', 'expenses', 'income', 'clients', 'recurring-bills', 'contracts', 'projects', 'category-budgets', 'dashboard-stats', 'income-summary', 'data-health', 'monthly-plan');
  }, [invalidate]);

  /** After any category budget mutation */
  const afterBudget = useCallback(() => {
    invalidate('category-budgets', 'dashboard-stats', 'monthly-plan', 'income-summary');
  }, [invalidate]);

  /** After any document mutation */
  const afterDocument = useCallback(() => {
    invalidate('documents', 'expenses', 'income', 'dashboard-stats', 'data-health');
  }, [invalidate]);

  /** After any bank transaction mutation */
  const afterBank = useCallback(() => {
    invalidate('bank-transactions', 'bank-insights', 'dashboard-stats', 'recurring-bills', 'monthly-plan');
  }, [invalidate]);

  /** After any settings change */
  const afterSettings = useCallback(() => {
    invalidate('user-settings', 'dashboard-stats');
  }, [invalidate]);

  /** After trash operations (restore/purge) */
  const afterTrash = useCallback(() => {
    invalidate('expenses', 'income', 'clients', 'projects', 'contracts', 'mileage', 'mileage-summary', 'dashboard-stats', 'income-summary', 'data-health', 'projects-with-clients', 'client-projects', 'monthly-plan');
  }, [invalidate]);

  /** After any mileage mutation */
  const afterMileage = useCallback(() => {
    invalidate('mileage', 'mileage-summary', 'dashboard-stats', 'data-health');
  }, [invalidate]);

  /** After any savings goal mutation */
  const afterSavings = useCallback(() => {
    invalidate('savings-goals', 'savings-contributions', 'dashboard-stats');
  }, [invalidate]);

  /** After any net worth mutation (assets/liabilities) */
  const afterNetWorth = useCallback(() => {
    invalidate('assets', 'liabilities', 'net-worth-snapshots', 'dashboard-stats');
  }, [invalidate]);

  /** After any tag mutation */
  const afterTag = useCallback(() => {
    invalidate('tags', 'tags-with-expense-count', 'expenses', 'data-health');
  }, [invalidate]);

  /** After any financial habit mutation */
  const afterHabit = useCallback(() => {
    invalidate('financial-habits', 'financial-habits-stats');
  }, [invalidate]);

  /** After any financial journal mutation */
  const afterJournal = useCallback(() => {
    invalidate('financial-journal', 'financial-journal-stats');
  }, [invalidate]);

  return {
    invalidate,
    afterExpense,
    afterIncome,
    afterClient,
    afterClientDelete,
    afterProject,
    afterProjectDelete,
    afterContract,
    afterBill,
    afterEntity,
    afterBudget,
    afterSettings,
    afterTrash,
    afterMileage,
    afterSavings,
    afterNetWorth,
    afterTag,
    afterHabit,
    afterJournal,
    afterDocument,
    afterBank,
  };
}
