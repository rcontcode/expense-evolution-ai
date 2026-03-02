import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  gastos: '/expenses',
  income: '/income',
  ingresos: '/income',
  clients: '/clients',
  clientes: '/clients',
  projects: '/projects',
  proyectos: '/projects',
  contracts: '/contracts',
  contratos: '/contracts',
  dashboard: '/dashboard',
  mileage: '/mileage',
  kilometraje: '/mileage',
  networth: '/net-worth',
  patrimonio: '/net-worth',
  banking: '/banking',
  banco: '/banking',
  settings: '/settings',
  configuracion: '/settings',
  capture: '/capture',
  captura: '/capture',
  chaos: '/chaos',
  reconciliation: '/reconciliation',
  conciliacion: '/reconciliation',
  bills: '/bills',
  pagos: '/bills',
  pagosfijos: '/bills',
  budget: '/budget',
  presupuesto: '/budget',
  business: '/business-profile',
  negocio: '/business-profile',
  notifications: '/notifications',
  notificaciones: '/notifications',
  mentorship: '/mentorship',
  mentoria: '/mentorship',
  taxes: '/tax-calendar',
  impuestos: '/tax-calendar',
  tags: '/tags',
  etiquetas: '/tags',
  betafeedback: '/beta-feedback',
  report: '/dashboard?tab=analytics',
  reporte: '/dashboard?tab=analytics',
  alerts: '/dashboard',
  alertas: '/dashboard',
  monthlyreport: '/dashboard?tab=analytics',
  trash: '/trash',
  papelera: '/trash',
  datahealth: '/data-health',
  saluddatos: '/data-health',
  files: '/files',
  archivos: '/files',
  adventure: '/adventure',
  aventura: '/adventure',
  guide: '/user-guide',
  guia: '/user-guide',
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
          const expenseData = action.data as { amount: number; vendor?: string; category?: string; description?: string; date?: string };
          if (expenseData && expenseData.amount) {
            try {
              // Use the onCreateExpense callback which should invoke useCreateExpense
              // This ensures duplicate detection, audit logging, gamification, and cache invalidation all fire
              if (onCreateExpense) {
                onCreateExpense(expenseData);
              }
              const msg = language === 'es'
                ? `Gasto de $${expenseData.amount} registrado${expenseData.vendor ? ` en ${expenseData.vendor}` : ''}`
                : `Expense of $${expenseData.amount} recorded${expenseData.vendor ? ` at ${expenseData.vendor}` : ''}`;
              // Don't toast here — onCreateExpense hook already toasts on success/error
              result = { success: true, message: action.message, data: expenseData };
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
              if (onCreateIncome) {
                onCreateIncome(incomeData);
              }
              result = { success: true, message: action.message, data: incomeData };
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
          const billData = action.data as { amount: number; name?: string; category?: string; frequency?: string; auto_pay?: boolean; next_due_date?: string };
          if (billData && billData.amount) {
            // Emit global event to open confirmation dialog instead of inserting directly
            const nextDueDate = billData.next_due_date || (() => {
              const d = new Date();
              d.setMonth(d.getMonth() + 1);
              d.setDate(1);
              return d.toISOString().split('T')[0];
            })();
            
            window.dispatchEvent(new CustomEvent('recurring-bill-candidate', {
              detail: {
                name: billData.name || (language === 'es' ? 'Sin nombre' : 'Unnamed'),
                amount: billData.amount,
                currency: 'CAD',
                category: billData.category || 'utilities',
                frequency: billData.frequency || 'monthly',
                auto_pay: billData.auto_pay || false,
                next_due_date: nextDueDate,
              }
            }));
            
            const msg = language === 'es'
              ? 'Revisa los detalles del pago fijo para confirmarlo'
              : 'Review the recurring bill details to confirm';
            toast.info(msg);
            result = { success: true, message: action.message, data: billData };
          }
          break;
        }

        case 'export': {
          const reportType = action.data?.reportType as string;
          navigate('/dashboard?tab=analytics');
          onNavigate?.('/dashboard?tab=analytics');
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
  }, [language, navigate, onNavigate, onClarify, onHighlight, onActionStart, onActionComplete, onRunTutorial, onShowInsights, onSetGoal, onCreateExpense, onCreateIncome]);

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
