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
