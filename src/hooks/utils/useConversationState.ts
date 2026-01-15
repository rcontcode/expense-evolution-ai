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
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Reset to idle state
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setStatus('idle');
    setContext(null);
    setRemainingSeconds(0);
  }, []);

  // Start countdown timer for visual feedback
  const startCountdown = useCallback(() => {
    setRemainingSeconds(Math.ceil(CLARIFICATION_TIMEOUT_MS / 1000));
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    countdownRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

    // Start visual countdown
    startCountdown();

    // Auto-reset after timeout
    timeoutRef.current = setTimeout(() => {
      console.log('[ConversationState] Clarification timeout, resetting to idle');
      reset();
    }, CLARIFICATION_TIMEOUT_MS);
  }, [reset, startCountdown]);

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
      ? ['nada', 'cancela', 'cancelar', 'olvídalo', 'olvidalo', 'no importa', 'dejalo', 'déjalo', 'no', 'para']
      : ['nothing', 'cancel', 'nevermind', 'never mind', 'forget it', 'skip', 'no', 'stop'];
    
    if (cancelPatterns.some(p => normalized === p || normalized.startsWith(p + ' '))) {
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
          { pattern: /primer[ao]?|1[ºª°]?|uno|una|el 1|la 1/, index: 0 },
          { pattern: /segund[ao]?|2[ºª°]?|dos|el 2|la 2/, index: 1 },
          { pattern: /tercer[ao]?|3[ºª°]?|tres|el 3|la 3/, index: 2 },
          { pattern: /cuart[ao]?|4[ºª°]?|cuatro|el 4|la 4/, index: 3 },
        ]
      : [
          { pattern: /first|1st|one|number 1/, index: 0 },
          { pattern: /second|2nd|two|number 2/, index: 1 },
          { pattern: /third|3rd|three|number 3/, index: 2 },
          { pattern: /fourth|4th|four|number 4/, index: 3 },
        ];

    for (const { pattern, index } of ordinalPatterns) {
      if (pattern.test(normalized) && index < context.options.length) {
        const option = context.options[index];
        reset();
        return { matched: true, option };
      }
    }

    // Match by action keywords (more comprehensive)
    const actionKeywords = language === 'es'
      ? {
          navigate: ['llévame', 'llevame', 've', 'ir', 'solo llevar', 'navegar', 'muéstrame', 'muestrame', 'solo ir', 'navega'],
          explain: ['explica', 'explícame', 'explicame', 'cuéntame', 'cuentame', 'dime', 'solo explicar', 'solo explica', 'aquí', 'aqui'],
          both: ['ambas', 'las dos', 'todo', 'llévame y explica', 'explica allá', 'allí', 'los dos', 'las dos opciones', 'ambos'],
        }
      : {
          navigate: ['take me', 'go', 'navigate', 'just take', 'show me', 'open', 'just go', 'only go'],
          explain: ['explain', 'tell me', 'describe', 'just explain', 'what is', 'only explain', 'here'],
          both: ['both', 'take me and explain', 'explain there', 'all', 'do both'],
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

    // Try fuzzy match by option label keywords (more lenient)
    for (const option of context.options) {
      const labelWords = option.label.toLowerCase().split(/\s+/);
      const significantWords = labelWords.filter(w => w.length > 3);
      const matchCount = significantWords.filter(w => normalized.includes(w)).length;
      
      // Match if at least 1 significant word matches
      if (matchCount >= 1) {
        reset();
        return { matched: true, option };
      }
    }

    // No match found - ask again with clearer instructions
    const optionsList = context.options.map((o, i) => `${i + 1}`).join(', ');
    const fallbackMessage = language === 'es'
      ? `No entendí. Di un número (${optionsList}) o "cancelar" para salir.`
      : `I didn't understand. Say a number (${optionsList}) or "cancel" to exit.`;
    
    return { matched: false, fallbackMessage };
  }, [status, context, reset]);

  // Check if we're waiting for clarification
  const isAwaitingClarification = status === 'awaiting_clarification';
  const isAwaitingConfirmation = status === 'awaiting_confirmation';
  const hasPendingContext = context !== null;

  // Get remaining time before timeout (more accurate)
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

    startCountdown();
    timeoutRef.current = setTimeout(reset, CLARIFICATION_TIMEOUT_MS);
  }, [reset, startCountdown]);

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
      ? ['sí', 'si', 'claro', 'ok', 'vale', 'dale', 'adelante', 'hazlo', 'confirmo', 'por favor', 'yes', 'bueno', 'listo']
      : ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'do it', 'confirm', 'please', 'go ahead', 'alright'];
    
    const noPatterns = language === 'es'
      ? ['no', 'nope', 'cancela', 'cancelar', 'olvídalo', 'dejalo', 'para', 'detente', 'nada']
      : ['no', 'nope', 'cancel', 'stop', 'nevermind', 'dont', "don't", 'nothing'];

    if (yesPatterns.some(p => normalized === p || normalized.startsWith(p + ' ') || normalized.endsWith(' ' + p))) {
      reset();
      return { confirmed: true };
    }

    if (noPatterns.some(p => normalized === p || normalized.startsWith(p + ' '))) {
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

  // Get formatted options for display
  const getFormattedOptions = useCallback((language: 'es' | 'en') => {
    if (!context?.options) return [];
    return context.options.map((opt, index) => ({
      ...opt,
      number: index + 1,
      displayLabel: `${index + 1}. ${opt.label}`,
    }));
  }, [context]);

  return {
    status,
    context,
    isAwaitingClarification,
    isAwaitingConfirmation,
    hasPendingContext,
    remainingSeconds,
    getRemainingTime,
    getFormattedOptions,
    reset,
    startClarification,
    processClarificationResponse,
    startConfirmation,
    processConfirmationResponse,
  };
}
