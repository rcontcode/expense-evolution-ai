import { useMemo } from 'react';
import { useDocumentsForReview } from '@/hooks/data/useDocumentReview';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useClients } from '@/hooks/data/useClients';
import { useIncome } from '@/hooks/data/useIncome';

export type NudgeType = 'pending_docs' | 'incomplete_expenses' | 'no_clients' | 'no_income' | 'all_good';
export type NudgePriority = 'high' | 'medium' | 'low' | 'none';

export interface Nudge {
  type: NudgeType;
  priority: NudgePriority;
  count?: number;
}

const COOLDOWN_KEY = 'nudge_cooldowns';
const COOLDOWN_HOURS = 4;

function getCooldowns(): Record<string, number> {
  try {
    const stored = localStorage.getItem(COOLDOWN_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setCooldown(type: NudgeType): void {
  const cooldowns = getCooldowns();
  cooldowns[type] = Date.now();
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(cooldowns));
}

function isOnCooldown(type: NudgeType): boolean {
  const cooldowns = getCooldowns();
  const lastDismissed = cooldowns[type];
  if (!lastDismissed) return false;
  
  const hoursSince = (Date.now() - lastDismissed) / (1000 * 60 * 60);
  return hoursSince < COOLDOWN_HOURS;
}

export function useNudgeSystem() {
  const { data: documents = [] } = useDocumentsForReview();
  const { data: expenses = [] } = useExpenses();
  const { data: clients = [] } = useClients();
  const { data: incomes = [] } = useIncome();
  
  const nudge = useMemo((): Nudge | null => {
    // Priority 1: Pending documents (high urgency)
    const pendingDocs = documents.filter(
      d => d.status === 'pending' || d.review_status === 'pending'
    ).length;
    
    if (pendingDocs > 0 && !isOnCooldown('pending_docs')) {
      return {
        type: 'pending_docs',
        priority: 'high',
        count: pendingDocs,
      };
    }
    
    // Priority 2: Incomplete expenses (missing category/vendor)
    const incompleteExpenses = expenses.filter(
      e => !e.category || !e.vendor
    ).length;
    
    if (incompleteExpenses > 0 && !isOnCooldown('incomplete_expenses')) {
      return {
        type: 'incomplete_expenses',
        priority: 'medium',
        count: incompleteExpenses,
      };
    }
    
    // Priority 3: No clients (onboarding)
    if (clients.length === 0 && !isOnCooldown('no_clients')) {
      return {
        type: 'no_clients',
        priority: 'low',
      };
    }
    
    // Priority 4: No income recorded
    if (incomes.length === 0 && expenses.length > 0 && !isOnCooldown('no_income')) {
      return {
        type: 'no_income',
        priority: 'low',
      };
    }
    
    // All good!
    return {
      type: 'all_good',
      priority: 'none',
    };
  }, [documents, expenses, clients, incomes]);
  
  const dismissNudge = (type: NudgeType) => {
    setCooldown(type);
  };
  
  return {
    nudge,
    dismissNudge,
    pendingDocuments: documents.filter(d => d.status === 'pending' || d.review_status === 'pending').length,
    incompleteExpenses: expenses.filter(e => !e.category || !e.vendor).length,
    totalClients: clients.length,
    totalIncomes: incomes.length,
  };
}
