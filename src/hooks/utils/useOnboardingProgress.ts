import { useMemo } from 'react';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useClients } from '@/hooks/data/useClients';
import { useIncome } from '@/hooks/data/useIncome';

export interface OnboardingGoal {
  id: 'first_expense' | 'first_client' | 'first_income';
  completed: boolean;
  label: { es: string; en: string };
  description: { es: string; en: string };
  route: string;
  tutorialId?: string;
}

export interface OnboardingProgress {
  goals: OnboardingGoal[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  isLoading: boolean;
  isDismissed: boolean;
  dismiss: () => void;
  reset: () => void;
}

const DISMISS_KEY = 'onboarding-dismissed';

export function useOnboardingProgress(): OnboardingProgress {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: income = [], isLoading: incomeLoading } = useIncome();

  const isLoading = expensesLoading || clientsLoading || incomeLoading;

  const goals = useMemo<OnboardingGoal[]>(() => [
    {
      id: 'first_expense',
      completed: expenses.length > 0,
      label: { es: 'Registra tu primer gasto', en: 'Record your first expense' },
      description: { 
        es: 'Captura un recibo o ingresa un gasto manualmente para empezar a rastrear tus finanzas.',
        en: 'Capture a receipt or enter an expense manually to start tracking your finances.'
      },
      route: '/expenses',
      tutorialId: 'add-expense',
    },
    {
      id: 'first_client',
      completed: clients.length > 0,
      label: { es: 'Agrega tu primer cliente', en: 'Add your first client' },
      description: { 
        es: 'Registra un cliente para asociar ingresos y gastos a proyectos específicos.',
        en: 'Register a client to associate income and expenses with specific projects.'
      },
      route: '/clients',
      tutorialId: 'add-client',
    },
    {
      id: 'first_income',
      completed: income.length > 0,
      label: { es: 'Registra tu primer ingreso', en: 'Record your first income' },
      description: { 
        es: 'Ingresa un pago recibido para ver tu flujo de caja completo.',
        en: 'Enter a payment received to see your complete cash flow.'
      },
      route: '/income',
      tutorialId: 'add-income',
    },
  ], [expenses.length, clients.length, income.length]);

  const completedCount = goals.filter(g => g.completed).length;
  const totalCount = goals.length;
  const isComplete = completedCount === totalCount;

  const isDismissed = typeof window !== 'undefined' 
    ? localStorage.getItem(DISMISS_KEY) === 'true' 
    : false;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    window.dispatchEvent(new Event('storage'));
  };

  const reset = () => {
    localStorage.removeItem(DISMISS_KEY);
    window.dispatchEvent(new Event('storage'));
  };

  return {
    goals,
    completedCount,
    totalCount,
    isComplete,
    isLoading,
    isDismissed,
    dismiss,
    reset,
  };
}
