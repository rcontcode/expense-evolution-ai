import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type IncomeType = Database['public']['Enums']['income_type'];

// Map common income type strings to valid enum values
const mapIncomeType = (type?: string): IncomeType => {
  if (!type) return 'other';
  const normalized = type.toLowerCase();
  
  if (normalized.includes('salario') || normalized.includes('salary') || normalized.includes('sueldo')) return 'salary';
  if (normalized.includes('cliente') || normalized.includes('client')) return 'client_payment';
  if (normalized.includes('bono') || normalized.includes('bonus')) return 'bonus';
  if (normalized.includes('regalo') || normalized.includes('gift')) return 'gift';
  if (normalized.includes('reembolso') || normalized.includes('refund')) return 'refund';
  if (normalized.includes('acciones') || normalized.includes('stock')) return 'investment_stocks';
  if (normalized.includes('crypto')) return 'investment_crypto';
  if (normalized.includes('fondo') || normalized.includes('fund')) return 'investment_funds';
  if (normalized.includes('arriendo') || normalized.includes('rental') || normalized.includes('alquiler')) return 'passive_rental';
  if (normalized.includes('royalty') || normalized.includes('regalía')) return 'passive_royalties';
  if (normalized.includes('online') || normalized.includes('negocio')) return 'online_business';
  if (normalized.includes('freelance') || normalized.includes('independiente')) return 'freelance';
  
  return 'other';
};

interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

interface AssistantAction {
  action: string;
  target?: string;
  route?: string;
  name?: string;
  message: string;
  data?: Record<string, unknown>;
  options?: Array<{
    id: string;
    label: string;
    action: string;
    target?: string;
    route?: string;
  }>;
  intent?: string;
}

interface UseAssistantActionsOptions {
  language: 'es' | 'en';
  onNavigate?: (route: string) => void;
  onClarify?: (options: AssistantAction['options']) => void;
  onHighlight?: (target: string) => void;
  onActionStart?: (action: string, target?: string) => void;
  onActionComplete?: (action: string, result: ActionResult) => void;
  onRunTutorial?: (tutorialId: string) => void;
  onShowInsights?: (insightType: string) => void;
  onSetGoal?: (goalData: Record<string, unknown>) => void;
  onCreateExpense?: (data: { amount: number; vendor?: string; category?: string; description?: string }) => void;
  onCreateIncome?: (data: { amount: number; source?: string; income_type?: string; description?: string }) => void;
}

const ROUTE_MAP: Record<string, string> = {
  expenses: '/expenses',
  income: '/income',
  clients: '/clients',
  projects: '/projects',
  contracts: '/contracts',
  dashboard: '/dashboard',
  mileage: '/mileage',
  networth: '/net-worth',
  banking: '/banking',
  settings: '/settings',
  capture: '/capture',
  chaos: '/chaos',
  reconciliation: '/reconciliation',
  business: '/business-profile',
  notifications: '/notifications',
  mentorship: '/mentorship',
  taxes: '/tax-calendar',
  tags: '/tags',
  betafeedback: '/beta-feedback',
};

export function useAssistantActions(options: UseAssistantActionsOptions) {
  const {
    language,
    onNavigate,
    onClarify,
    onHighlight,
    onActionStart,
    onActionComplete,
    onRunTutorial,
    onShowInsights,
    onSetGoal,
    onCreateExpense,
    onCreateIncome,
  } = options;
  
  const navigate = useNavigate();
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastAction, setLastAction] = useState<AssistantAction | null>(null);

  const executeAction = useCallback(async (action: AssistantAction): Promise<ActionResult> => {
    setIsExecuting(true);
    setLastAction(action);
    onActionStart?.(action.action, action.target);

    try {
      let result: ActionResult = { success: true };

      switch (action.action) {
        case 'navigate': {
          const targetRoute = action.route || (action.target ? ROUTE_MAP[action.target] : null);
          
          if (targetRoute) {
            navigate(targetRoute);
            onNavigate?.(targetRoute);
            
            const successMsg = language === 'es' 
              ? `Navegando a ${action.name || action.target}...`
              : `Navigating to ${action.name || action.target}...`;
            toast.success(successMsg);
            
            result = { success: true, message: action.message };
          } else {
            result = { 
              success: false, 
              message: language === 'es' 
                ? 'No pude encontrar esa página' 
                : "Couldn't find that page" 
            };
          }
          break;
        }

        case 'query': {
          // Query responses are handled by the AI message directly
          result = { success: true, message: action.message, data: action.data };
          break;
        }

        case 'clarify': {
          if (action.options && action.options.length > 0) {
            onClarify?.(action.options);
            result = { success: true, message: action.message };
          } else {
            result = { success: false, message: 'No options provided' };
          }
          break;
        }

        case 'highlight': {
          if (action.target) {
            onHighlight?.(action.target);
            result = { success: true };
          }
          break;
        }

        case 'explain':
        case 'both': {
          // For explain actions, we might navigate first then explain
          if (action.target) {
            const targetRoute = action.route || ROUTE_MAP[action.target];
            if (targetRoute) {
              navigate(targetRoute);
              onNavigate?.(targetRoute);
            }
          }
          result = { success: true, message: action.message };
          break;
        }

        case 'run_tutorial': {
          const tutorialId = action.data?.tutorialId as string;
          if (tutorialId) {
            onRunTutorial?.(tutorialId);
            const msg = language === 'es' 
              ? 'Iniciando tutorial...' 
              : 'Starting tutorial...';
            toast.info(msg);
            result = { success: true, message: action.message };
          }
          break;
        }

        case 'calculate_fire': {
          // Navigate to mentorship where FIRE calculator is
          navigate('/mentorship');
          onNavigate?.('/mentorship');
          const msg = language === 'es'
            ? 'Te llevo al calculador FIRE...'
            : 'Taking you to the FIRE calculator...';
          toast.success(msg);
          result = { success: true, message: action.message };
          break;
        }

        case 'show_insights': {
          const insightType = action.data?.insightType as string;
          if (insightType) {
            onShowInsights?.(insightType);
            result = { success: true, message: action.message };
          }
          break;
        }

        case 'set_goal': {
          if (action.data) {
            onSetGoal?.(action.data);
            // Navigate to settings where goals are configured
            navigate('/settings');
            onNavigate?.('/settings');
            const msg = language === 'es'
              ? 'Te llevo a configurar tu meta...'
              : 'Taking you to set up your goal...';
            toast.success(msg);
            result = { success: true, message: action.message };
          }
          break;
        }

        case 'create_expense': {
          const expenseData = action.data as { amount: number; vendor?: string; category?: string; description?: string };
          if (expenseData && expenseData.amount) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error } = await supabase.from('expenses').insert({
                  user_id: user.id,
                  amount: expenseData.amount,
                  vendor: expenseData.vendor || 'Sin especificar',
                  category: expenseData.category || 'other',
                  description: expenseData.description || expenseData.vendor,
                  date: new Date().toISOString().split('T')[0],
                });

                if (error) throw error;

                onCreateExpense?.(expenseData);
                const msg = language === 'es'
                  ? `Gasto de $${expenseData.amount} registrado${expenseData.vendor ? ` en ${expenseData.vendor}` : ''}`
                  : `Expense of $${expenseData.amount} recorded${expenseData.vendor ? ` at ${expenseData.vendor}` : ''}`;
                toast.success(msg);
                result = { success: true, message: action.message, data: expenseData };
              }
            } catch (err) {
              console.error('[Assistant] Failed to create expense:', err);
              const errMsg = language === 'es'
                ? 'No pude registrar el gasto'
                : 'Failed to record expense';
              toast.error(errMsg);
              result = { success: false, message: errMsg };
            }
          }
          break;
        }

        case 'create_income': {
          const incomeData = action.data as { amount: number; source?: string; income_type?: string; description?: string };
          if (incomeData && incomeData.amount) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { error } = await supabase.from('income').insert({
                  user_id: user.id,
                  amount: incomeData.amount,
                  source: incomeData.source || 'Sin especificar',
                  income_type: mapIncomeType(incomeData.income_type),
                  description: incomeData.description || incomeData.source,
                  date: new Date().toISOString().split('T')[0],
                });

                if (error) throw error;

                onCreateIncome?.(incomeData);
                const msg = language === 'es'
                  ? `Ingreso de $${incomeData.amount} registrado${incomeData.source ? ` de ${incomeData.source}` : ''}`
                  : `Income of $${incomeData.amount} recorded${incomeData.source ? ` from ${incomeData.source}` : ''}`;
                toast.success(msg);
                result = { success: true, message: action.message, data: incomeData };
              }
            } catch (err) {
              console.error('[Assistant] Failed to create income:', err);
              const errMsg = language === 'es'
                ? 'No pude registrar el ingreso'
                : 'Failed to record income';
              toast.error(errMsg);
              result = { success: false, message: errMsg };
            }
          }
          break;
        }

        case 'create_recurring_bill': {
          const billData = action.data as { amount: number; name?: string; category?: string; frequency?: string; auto_pay?: boolean };
          if (billData && billData.amount) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const nextDueDate = new Date();
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                nextDueDate.setDate(1);
                
                const { error } = await supabase.from('recurring_bills').insert({
                  user_id: user.id,
                  name: billData.name || 'Sin nombre',
                  amount: billData.amount,
                  category: billData.category || 'other',
                  frequency: billData.frequency || 'monthly',
                  next_due_date: nextDueDate.toISOString().split('T')[0],
                  auto_pay: billData.auto_pay || false,
                  is_active: true,
                  currency: 'CAD',
                });

                if (error) throw error;

                const msg = language === 'es'
                  ? `Pago fijo de $${billData.amount} creado${billData.name ? ` (${billData.name})` : ''}`
                  : `Recurring bill of $${billData.amount} created${billData.name ? ` (${billData.name})` : ''}`;
                toast.success(msg);
                result = { success: true, message: action.message, data: billData };
              }
            } catch (err) {
              console.error('[Assistant] Failed to create recurring bill:', err);
              const errMsg = language === 'es'
                ? 'No pude crear el pago fijo'
                : 'Failed to create recurring bill';
              toast.error(errMsg);
              result = { success: false, message: errMsg };
            }
          }
          break;
        }

        case 'export': {
          const reportType = action.data?.reportType as string;
          const format = (action.data?.format as string) || 'excel';
          // Navigate to reports section
          navigate('/reports');
          onNavigate?.('/reports');
          const msg = language === 'es'
            ? `Preparando reporte de ${reportType}...`
            : `Preparing ${reportType} report...`;
          toast.info(msg);
          result = { success: true, message: action.message };
          break;
        }

        case 'open': {
          // Open a specific item
          const targetRoute = action.route || (action.target ? ROUTE_MAP[action.target] : null);
          if (targetRoute) {
            navigate(targetRoute);
            onNavigate?.(targetRoute);
            // If we have an item name, we could search/highlight it
            if (action.data?.itemName) {
              setTimeout(() => {
                onHighlight?.(action.data.itemName as string);
              }, 500);
            }
            result = { success: true, message: action.message };
          }
          break;
        }

        default:
          result = { success: true, message: action.message };
      }

      onActionComplete?.(action.action, result);
      return result;
    } catch (error) {
      const errorResult: ActionResult = {
        success: false,
        message: language === 'es' 
          ? 'Ocurrió un error al ejecutar la acción'
          : 'An error occurred while executing the action',
      };
      onActionComplete?.(action.action, errorResult);
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, [language, navigate, onNavigate, onClarify, onHighlight, onActionStart, onActionComplete]);

  const undoLastAction = useCallback(() => {
    if (!lastAction) return;
    
    // For navigation, go back
    if (lastAction.action === 'navigate') {
      window.history.back();
      const msg = language === 'es' ? 'Acción deshecha' : 'Action undone';
      toast.info(msg);
    }
    
    setLastAction(null);
  }, [lastAction, language]);

  const getRouteForTarget = useCallback((target: string): string | null => {
    return ROUTE_MAP[target] || null;
  }, []);

  const parseActionFromResponse = useCallback((response: {
    action?: AssistantAction;
    message: string;
  }): AssistantAction | null => {
    if (response.action && response.action.action && response.action.message) {
      return response.action;
    }
    return null;
  }, []);

  return {
    executeAction,
    undoLastAction,
    getRouteForTarget,
    parseActionFromResponse,
    isExecuting,
    lastAction,
    ROUTE_MAP,
  };
}
