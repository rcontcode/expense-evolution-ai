import { useState, useCallback, useRef, useEffect } from 'react';

export type ConversationStatus = 
  | 'idle'                    // No pending context
  | 'awaiting_clarification'  // Waiting for user to choose an option
  | 'awaiting_confirmation'   // Waiting for yes/no
  | 'tutorial_active';        // In the middle of a tutorial

export interface ClarificationOption {
  id: string;
  label: string;
  action: 'navigate' | 'explain' | 'both' | 'cancel';
  target?: string;
  route?: string;
}

export interface ConversationContext {
  originalQuery: string;
  detectedIntent: string;
  options: ClarificationOption[];
  selectedOption?: ClarificationOption;
  timestamp: number;
}

// Timeout for pending clarifications (30 seconds)
const CLARIFICATION_TIMEOUT_MS = 30000;

/**
 * Hook for managing conversation state with the AI assistant
 * Enables multi-turn dialogues with clarification and confirmation flows
 */
export function useConversationState() {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [context, setContext] = useState<ConversationContext | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset to idle state
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus('idle');
    setContext(null);
  }, []);

  // Start a clarification flow with options
  const startClarification = useCallback((
    originalQuery: string,
    detectedIntent: string,
    options: ClarificationOption[]
  ) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('awaiting_clarification');
    setContext({
      originalQuery,
      detectedIntent,
      options,
      timestamp: Date.now(),
    });

    // Auto-reset after timeout
    timeoutRef.current = setTimeout(() => {
      console.log('[ConversationState] Clarification timeout, resetting to idle');
      reset();
    }, CLARIFICATION_TIMEOUT_MS);
  }, [reset]);

  // Process a user response during clarification
  const processClarificationResponse = useCallback((
    userResponse: string,
    language: 'es' | 'en'
  ): { matched: boolean; option?: ClarificationOption; fallbackMessage?: string } => {
    if (status !== 'awaiting_clarification' || !context) {
      return { matched: false };
    }

    const normalized = userResponse.toLowerCase().trim();
    
    // Check for cancellation
    const cancelPatterns = language === 'es' 
      ? ['nada', 'cancela', 'cancelar', 'olvídalo', 'olvidalo', 'no importa', 'dejalo', 'déjalo']
      : ['nothing', 'cancel', 'nevermind', 'never mind', 'forget it', 'skip'];
    
    if (cancelPatterns.some(p => normalized.includes(p))) {
      reset();
      return { 
        matched: true, 
        option: { id: 'cancel', label: 'Cancel', action: 'cancel' } 
      };
    }

    // Try to match by number (1, 2, 3, etc.)
    const numberMatch = normalized.match(/^(\d+)$/);
    if (numberMatch) {
      const index = parseInt(numberMatch[1], 10) - 1;
      if (index >= 0 && index < context.options.length) {
        const option = context.options[index];
        reset();
        return { matched: true, option };
      }
    }

    // Match by ordinal phrases (la primera, the first, etc.)
    const ordinalPatterns = language === 'es'
      ? [
          { pattern: /primer[ao]?|1[ºª°]?|uno|una/, index: 0 },
          { pattern: /segund[ao]?|2[ºª°]?|dos/, index: 1 },
          { pattern: /tercer[ao]?|3[ºª°]?|tres/, index: 2 },
          { pattern: /cuart[ao]?|4[ºª°]?|cuatro/, index: 3 },
        ]
      : [
          { pattern: /first|1st|one/, index: 0 },
          { pattern: /second|2nd|two/, index: 1 },
          { pattern: /third|3rd|three/, index: 2 },
          { pattern: /fourth|4th|four/, index: 3 },
        ];

    for (const { pattern, index } of ordinalPatterns) {
      if (pattern.test(normalized) && index < context.options.length) {
        const option = context.options[index];
        reset();
        return { matched: true, option };
      }
    }

    // Try fuzzy match by option label keywords
    for (const option of context.options) {
      const labelWords = option.label.toLowerCase().split(/\s+/);
      const significantWords = labelWords.filter(w => w.length > 3);
      const matchCount = significantWords.filter(w => normalized.includes(w)).length;
      
      if (matchCount >= 2 || (significantWords.length === 1 && matchCount === 1)) {
        reset();
        return { matched: true, option };
      }
    }

    // Match by action keywords
    const actionKeywords = language === 'es'
      ? {
          navigate: ['llévame', 'llevame', 've', 'ir', 'solo llevar', 'navegar', 'muéstrame', 'muestrame'],
          explain: ['explica', 'explícame', 'explicame', 'cuéntame', 'cuentame', 'dime', 'solo explicar'],
          both: ['ambas', 'las dos', 'todo', 'llévame y explica', 'explica allá', 'allí'],
        }
      : {
          navigate: ['take me', 'go', 'navigate', 'just take', 'show me', 'open'],
          explain: ['explain', 'tell me', 'describe', 'just explain', 'what is'],
          both: ['both', 'take me and explain', 'explain there', 'all'],
        };

    for (const [action, keywords] of Object.entries(actionKeywords)) {
      if (keywords.some(k => normalized.includes(k))) {
        const matchingOption = context.options.find(o => o.action === action);
        if (matchingOption) {
          reset();
          return { matched: true, option: matchingOption };
        }
      }
    }

    // No match found - ask again
    const fallbackMessage = language === 'es'
      ? `No entendí tu elección. Di un número (1, 2, 3) o describe lo que prefieres.`
      : `I didn't understand your choice. Say a number (1, 2, 3) or describe what you prefer.`;
    
    return { matched: false, fallbackMessage };
  }, [status, context, reset]);

  // Check if we're waiting for clarification
  const isAwaitingClarification = status === 'awaiting_clarification';
  const isAwaitingConfirmation = status === 'awaiting_confirmation';
  const hasPendingContext = context !== null;

  // Get remaining time before timeout
  const getRemainingTime = useCallback(() => {
    if (!context) return 0;
    const elapsed = Date.now() - context.timestamp;
    return Math.max(0, CLARIFICATION_TIMEOUT_MS - elapsed);
  }, [context]);

  // Start confirmation flow (simpler yes/no)
  const startConfirmation = useCallback((
    originalQuery: string,
    detectedIntent: string
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('awaiting_confirmation');
    setContext({
      originalQuery,
      detectedIntent,
      options: [
        { id: 'yes', label: 'Yes', action: 'navigate' },
        { id: 'no', label: 'No', action: 'cancel' },
      ],
      timestamp: Date.now(),
    });

    timeoutRef.current = setTimeout(reset, CLARIFICATION_TIMEOUT_MS);
  }, [reset]);

  // Process yes/no response
  const processConfirmationResponse = useCallback((
    userResponse: string,
    language: 'es' | 'en'
  ): { confirmed: boolean | null; message?: string } => {
    if (status !== 'awaiting_confirmation') {
      return { confirmed: null };
    }

    const normalized = userResponse.toLowerCase().trim();
    
    const yesPatterns = language === 'es'
      ? ['sí', 'si', 'claro', 'ok', 'vale', 'dale', 'adelante', 'hazlo', 'confirmo', 'por favor', 'yes']
      : ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'do it', 'confirm', 'please', 'go ahead'];
    
    const noPatterns = language === 'es'
      ? ['no', 'nope', 'cancela', 'cancelar', 'olvídalo', 'dejalo', 'para', 'detente']
      : ['no', 'nope', 'cancel', 'stop', 'nevermind', 'dont', "don't"];

    if (yesPatterns.some(p => normalized.includes(p))) {
      reset();
      return { confirmed: true };
    }

    if (noPatterns.some(p => normalized.includes(p))) {
      reset();
      return { confirmed: false };
    }

    // Unclear response
    return { 
      confirmed: null, 
      message: language === 'es' 
        ? 'Di "sí" para confirmar o "no" para cancelar.'
        : 'Say "yes" to confirm or "no" to cancel.'
    };
  }, [status, reset]);

  return {
    status,
    context,
    isAwaitingClarification,
    isAwaitingConfirmation,
    hasPendingContext,
    getRemainingTime,
    reset,
    startClarification,
    processClarificationResponse,
    startConfirmation,
    processConfirmationResponse,
  };
}
