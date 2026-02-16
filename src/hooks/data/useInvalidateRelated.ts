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
    invalidate('expenses', 'dashboard-stats', 'income-summary', 'data-health', 'category-budgets');
  }, [invalidate]);

  /** After any income mutation */
  const afterIncome = useCallback(() => {
    invalidate('income', 'income-summary', 'dashboard-stats', 'data-health');
  }, [invalidate]);

  /** After any client mutation */
  const afterClient = useCallback(() => {
    invalidate('clients', 'dashboard-stats', 'projects-with-clients', 'client-projects', 'data-health');
  }, [invalidate]);

  /** After deleting a client (cascades to contracts, affects expenses/income) */
  const afterClientDelete = useCallback(() => {
    invalidate('clients', 'expenses', 'income', 'mileage', 'contracts', 'dashboard-stats', 'income-summary', 'projects', 'projects-with-clients', 'client-projects', 'data-health');
  }, [invalidate]);

  /** After any project mutation */
  const afterProject = useCallback(() => {
    invalidate('projects', 'projects-with-clients', 'client-projects', 'dashboard-stats', 'data-health');
  }, [invalidate]);

  /** After deleting a project (expenses/income lose project_id) */
  const afterProjectDelete = useCallback(() => {
    invalidate('projects', 'projects-with-clients', 'client-projects', 'expenses', 'income', 'dashboard-stats', 'income-summary', 'data-health');
  }, [invalidate]);

  /** After any contract mutation */
  const afterContract = useCallback(() => {
    invalidate('contracts', 'dashboard-stats', 'clients', 'data-health');
  }, [invalidate]);

  /** After any recurring bill mutation */
  const afterBill = useCallback(() => {
    invalidate('recurring-bills', 'bill-payments', 'dashboard-stats', 'income-summary');
  }, [invalidate]);

  /** After any fiscal entity mutation */
  const afterEntity = useCallback(() => {
    invalidate('fiscal-entities', 'fiscal-entity-primary', 'expenses', 'income', 'clients', 'recurring-bills', 'contracts', 'projects', 'category-budgets', 'dashboard-stats', 'income-summary', 'data-health');
  }, [invalidate]);

  /** After any category budget mutation */
  const afterBudget = useCallback(() => {
    invalidate('category-budgets', 'dashboard-stats');
  }, [invalidate]);

  /** After any settings change */
  const afterSettings = useCallback(() => {
    invalidate('user-settings', 'dashboard-stats');
  }, [invalidate]);

  /** After trash operations (restore/purge) */
  const afterTrash = useCallback(() => {
    invalidate('expenses', 'income', 'clients', 'projects', 'contracts', 'dashboard-stats', 'income-summary', 'data-health', 'projects-with-clients', 'client-projects');
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
  };
}
