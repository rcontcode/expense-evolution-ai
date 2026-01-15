import { useState, useCallback, useRef, useEffect } from 'react';

interface ConversationExchange {
  id: string;
  userMessage: string;
  assistantResponse: string;
  intent?: string;
  action?: string;
  timestamp: number;
}

interface ConversationMemory {
  exchanges: ConversationExchange[];
  lastIntent: string | null;
  lastTopic: string | null;
  sessionStartTime: number;
}

const MAX_MEMORY_SIZE = 10;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hook for managing conversation memory
 * Tracks recent exchanges to provide context for follow-up questions
 */
export function useConversationMemory() {
  const [memory, setMemory] = useState<ConversationMemory>({
    exchanges: [],
    lastIntent: null,
    lastTopic: null,
    sessionStartTime: Date.now(),
  });

  const exchangeIdCounter = useRef(0);

  // Check if session is still valid
  const isSessionValid = useCallback(() => {
    return Date.now() - memory.sessionStartTime < SESSION_TIMEOUT_MS;
  }, [memory.sessionStartTime]);

  // Reset session if expired
  useEffect(() => {
    const checkSession = () => {
      if (!isSessionValid()) {
        setMemory({
          exchanges: [],
          lastIntent: null,
          lastTopic: null,
          sessionStartTime: Date.now(),
        });
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isSessionValid]);

  // Add a new exchange
  const addExchange = useCallback((
    userMessage: string,
    assistantResponse: string,
    intent?: string,
    action?: string
  ) => {
    const newExchange: ConversationExchange = {
      id: `exchange-${++exchangeIdCounter.current}`,
      userMessage,
      assistantResponse,
      intent,
      action,
      timestamp: Date.now(),
    };

    // Extract topic from the exchange
    const topic = extractTopic(userMessage, intent);

    setMemory(prev => ({
      ...prev,
      exchanges: [...prev.exchanges.slice(-MAX_MEMORY_SIZE + 1), newExchange],
      lastIntent: intent || prev.lastIntent,
      lastTopic: topic || prev.lastTopic,
    }));

    return newExchange.id;
  }, []);

  // Get recent context for AI
  const getContextSummary = useCallback((): string => {
    if (memory.exchanges.length === 0) return '';

    const recentExchanges = memory.exchanges.slice(-3);
    const summary = recentExchanges.map(ex => 
      `Usuario: "${ex.userMessage}" → Asistente: "${ex.assistantResponse.substring(0, 100)}..."`
    ).join('\n');

    return `
HISTORIAL RECIENTE:
${summary}
${memory.lastTopic ? `Último tema: ${memory.lastTopic}` : ''}
${memory.lastIntent ? `Última intención: ${memory.lastIntent}` : ''}
`;
  }, [memory]);

  // Check if user is following up on previous topic
  const isFollowUp = useCallback((userMessage: string): boolean => {
    if (memory.exchanges.length === 0) return false;

    const followUpPatterns = [
      /^(y|and|but|pero|también|also|más|more|qué más|what else)/i,
      /^(ok|okay|bueno|bien|sí|yes|entiendo|i see)/i,
      /^(eso|that|this|esto|ahí|there|aquí|here)/i,
      /^(cuánto|how much|cuándo|when|dónde|where|quién|who)/i,
    ];

    const normalized = userMessage.toLowerCase().trim();
    return followUpPatterns.some(p => p.test(normalized));
  }, [memory.exchanges.length]);

  // Get last action for potential undo
  const getLastAction = useCallback(() => {
    const lastWithAction = memory.exchanges
      .slice()
      .reverse()
      .find(ex => ex.action);
    
    return lastWithAction ? {
      action: lastWithAction.action,
      message: lastWithAction.userMessage,
    } : null;
  }, [memory.exchanges]);

  // Clear memory
  const clearMemory = useCallback(() => {
    setMemory({
      exchanges: [],
      lastIntent: null,
      lastTopic: null,
      sessionStartTime: Date.now(),
    });
  }, []);

  return {
    memory,
    addExchange,
    getContextSummary,
    isFollowUp,
    getLastAction,
    clearMemory,
    exchangeCount: memory.exchanges.length,
  };
}

// Helper to extract topic from message
function extractTopic(message: string, intent?: string): string | null {
  const topicPatterns: Record<string, RegExp> = {
    'gastos': /gast|expense|spend/i,
    'ingresos': /ingres|income|earn/i,
    'clientes': /client|cliente/i,
    'proyectos': /project|proyecto/i,
    'impuestos': /tax|impuesto|irs|cra|sii/i,
    'patrimonio': /net worth|patrimonio|assets|activos/i,
    'inversiones': /invest|inversión|portfolio/i,
    'ahorro': /saving|ahorro|fire|retire/i,
  };

  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(message)) {
      return topic;
    }
  }

  return intent || null;
}
