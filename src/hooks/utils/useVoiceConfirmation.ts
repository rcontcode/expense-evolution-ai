import { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type ConfirmableAction = 'delete_expense' | 'delete_income' | 'delete_client' | 'delete_project' | 'clear_data' | 'bulk_action' | 'create_expense' | 'create_income';

interface PendingConfirmation {
  id: string;
  action: ConfirmableAction;
  description: { es: string; en: string };
  onConfirm: () => void;
  onCancel: () => void;
  data?: Record<string, unknown>;
  expiresAt: number;
}

const CONFIRMATION_TIMEOUT_MS = 30000; // 30 seconds

const ACTION_DESCRIPTIONS: Record<ConfirmableAction, { es: string; en: string }> = {
  delete_expense: {
    es: '¿Estás seguro de que quieres eliminar este gasto?',
    en: 'Are you sure you want to delete this expense?',
  },
  delete_income: {
    es: '¿Estás seguro de que quieres eliminar este ingreso?',
    en: 'Are you sure you want to delete this income?',
  },
  delete_client: {
    es: '¿Estás seguro de que quieres eliminar este cliente? También se eliminarán los proyectos asociados.',
    en: 'Are you sure you want to delete this client? Associated projects will also be deleted.',
  },
  delete_project: {
    es: '¿Estás seguro de que quieres eliminar este proyecto?',
    en: 'Are you sure you want to delete this project?',
  },
  clear_data: {
    es: '¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.',
    en: 'Are you sure you want to clear all data? This action cannot be undone.',
  },
  bulk_action: {
    es: '¿Confirmas la acción en múltiples elementos?',
    en: 'Do you confirm the action on multiple items?',
  },
  create_expense: {
    es: '¿Confirmas la creación de este gasto?',
    en: 'Do you confirm creating this expense?',
  },
  create_income: {
    es: '¿Confirmas el registro de este ingreso?',
    en: 'Do you confirm recording this income?',
  },
};

const CONFIRM_PATTERNS = [
  // Spanish
  'sí', 'si', 'confirmo', 'confirmar', 'adelante', 'hazlo', 'procede', 'ok', 'okay', 'vale', 'claro', 'por supuesto', 'afirmativo',
  // English
  'yes', 'confirm', 'go ahead', 'do it', 'proceed', 'sure', 'of course', 'affirmative', 'yep', 'yeah',
];

const CANCEL_PATTERNS = [
  // Spanish
  'no', 'cancelar', 'cancela', 'parar', 'para', 'detener', 'deten', 'olvídalo', 'olvidalo', 'dejarlo', 'mejor no',
  // English
  'no', 'cancel', 'stop', 'abort', 'forget it', 'never mind', 'don\'t', 'nope',
];

export function useVoiceConfirmation() {
  const { language } = useLanguage();
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timeout
  const clearConfirmationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Request confirmation for an action
  const requestConfirmation = useCallback((
    action: ConfirmableAction,
    onConfirm: () => void,
    onCancel: () => void,
    customDescription?: { es: string; en: string },
    data?: Record<string, unknown>
  ): string => {
    clearConfirmationTimeout();

    const confirmation: PendingConfirmation = {
      id: `confirm_${Date.now()}`,
      action,
      description: customDescription || ACTION_DESCRIPTIONS[action],
      onConfirm,
      onCancel,
      data,
      expiresAt: Date.now() + CONFIRMATION_TIMEOUT_MS,
    };

    setPendingConfirmation(confirmation);
    setIsWaitingForConfirmation(true);

    // Set timeout to auto-cancel
    timeoutRef.current = setTimeout(() => {
      if (pendingConfirmation?.id === confirmation.id) {
        cancelConfirmation();
      }
    }, CONFIRMATION_TIMEOUT_MS);

    const lang = language as 'es' | 'en';
    const confirmHint = lang === 'es'
      ? 'Di "sí" para confirmar o "no" para cancelar.'
      : 'Say "yes" to confirm or "no" to cancel.';

    return `${confirmation.description[lang]} ${confirmHint}`;
  }, [clearConfirmationTimeout, language, pendingConfirmation?.id]);

  // Check if text is a confirmation response
  const checkConfirmationResponse = useCallback((text: string): {
    isResponse: boolean;
    confirmed?: boolean;
    message?: string;
  } => {
    if (!pendingConfirmation) {
      return { isResponse: false };
    }

    const normalizedText = text.toLowerCase().trim().replace(/[.,!?¿¡]/g, '');
    const lang = language as 'es' | 'en';

    // Check for confirm patterns
    for (const pattern of CONFIRM_PATTERNS) {
      if (normalizedText === pattern || normalizedText.startsWith(pattern + ' ')) {
        return {
          isResponse: true,
          confirmed: true,
          message: lang === 'es' ? 'Acción confirmada.' : 'Action confirmed.',
        };
      }
    }

    // Check for cancel patterns
    for (const pattern of CANCEL_PATTERNS) {
      if (normalizedText === pattern || normalizedText.startsWith(pattern + ' ')) {
        return {
          isResponse: true,
          confirmed: false,
          message: lang === 'es' ? 'Acción cancelada.' : 'Action cancelled.',
        };
      }
    }

    return { isResponse: false };
  }, [pendingConfirmation, language]);

  // Confirm the pending action
  const confirmAction = useCallback((): string => {
    if (!pendingConfirmation) {
      return language === 'es' ? 'No hay acción pendiente.' : 'No pending action.';
    }

    clearConfirmationTimeout();
    
    try {
      pendingConfirmation.onConfirm();
    } catch (e) {
      console.error('Confirmation action failed:', e);
    }

    setPendingConfirmation(null);
    setIsWaitingForConfirmation(false);

    return language === 'es' ? 'Listo, acción ejecutada.' : 'Done, action executed.';
  }, [pendingConfirmation, clearConfirmationTimeout, language]);

  // Cancel the pending action
  const cancelConfirmation = useCallback((): string => {
    if (!pendingConfirmation) {
      return language === 'es' ? 'No hay nada que cancelar.' : 'Nothing to cancel.';
    }

    clearConfirmationTimeout();
    
    try {
      pendingConfirmation.onCancel();
    } catch (e) {
      console.error('Cancel action failed:', e);
    }

    setPendingConfirmation(null);
    setIsWaitingForConfirmation(false);

    return language === 'es' ? 'Acción cancelada.' : 'Action cancelled.';
  }, [pendingConfirmation, clearConfirmationTimeout, language]);

  // Process voice input during confirmation
  const processConfirmationVoice = useCallback((text: string): {
    handled: boolean;
    message?: string;
    confirmed?: boolean;
  } => {
    const response = checkConfirmationResponse(text);
    
    if (!response.isResponse) {
      return { handled: false };
    }

    if (response.confirmed) {
      const message = confirmAction();
      return { handled: true, message, confirmed: true };
    } else {
      const message = cancelConfirmation();
      return { handled: true, message, confirmed: false };
    }
  }, [checkConfirmationResponse, confirmAction, cancelConfirmation]);

  // Get timeout remaining
  const getTimeoutRemaining = useCallback((): number => {
    if (!pendingConfirmation) return 0;
    return Math.max(0, pendingConfirmation.expiresAt - Date.now());
  }, [pendingConfirmation]);

  return {
    pendingConfirmation,
    isWaitingForConfirmation,
    requestConfirmation,
    checkConfirmationResponse,
    confirmAction,
    cancelConfirmation,
    processConfirmationVoice,
    getTimeoutRemaining,
  };
}
