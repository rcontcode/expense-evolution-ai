/**
 * Voice Command Processor - Sistema simplificado IA-First
 * 
 * NUEVO FLUJO DE PRIORIDADES (Simplificado):
 * 
 * 1. ONBOARDING MIC TEST - Solo confirma que el mic funciona
 * 2. LANGUAGE SWITCH - Cambiar idioma ("habla en inglés", "speak spanish")
 * 3. CONFIRMATION PENDING - Si hay una confirmación esperando (sí/no)
 * 4. TODO LO DEMÁS → IA - El backend con tool calling maneja todo
 * 
 * PRINCIPIO: "IA Primero, Acciones Después"
 * La IA interpreta el intent y decide si ejecutar una tool o responder conversacionalmente.
 */

import { parseOpenClientCommand } from './VoiceActionParsers';

// Clarification option type (matches useConversationState)
export interface ClarificationOption {
  id: string;
  label: string;
  action: 'navigate' | 'explain' | 'both' | 'cancel';
  target?: string;
  route?: string;
}

export type ProcessingResult = 
  | { handled: false }
  | { handled: true; type: 'onboarding-mic-test'; response: string }
  | { handled: true; type: 'language-switch'; targetLanguage: 'es' | 'en'; response: string }
  | { handled: true; type: 'confirmation'; confirmed: boolean; response: string }
  | { handled: true; type: 'clarification-response'; option: ClarificationOption; response: string }
  | { handled: true; type: 'stop-command'; response: string }
  | { handled: true; type: 'ai-fallback' };

interface ProcessorContext {
  language: 'es' | 'en';
  isOnboardingMicTest: boolean;
  isWaitingForConfirmation: boolean;
  isAwaitingClarification: boolean;
  pendingClarificationOptions?: ClarificationOption[];
  currentPath: string;
  
  // Callbacks for checking external state
  checkLanguageCommand: (text: string) => { isCommand: boolean; targetLanguage?: 'es' | 'en' };
  processConfirmation: (text: string) => { handled: boolean; confirmed?: boolean; message?: string };
  processClarificationResponse?: (text: string) => { matched: boolean; option?: ClarificationOption; fallbackMessage?: string };
}

// System commands that should be handled locally (stop, pause, etc.)
const STOP_COMMANDS = {
  es: ['para', 'parar', 'detente', 'stop', 'cállate', 'callate', 'silencio', 'basta'],
  en: ['stop', 'pause', 'quiet', 'silence', 'shut up', 'be quiet', 'enough'],
};

/**
 * Normaliza texto para comparación (lowercase, sin acentos comunes, sin puntuación)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[¿?¡!.,;:"""'']/g, '')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica si es un comando de parar/detener
 */
function isStopCommand(text: string, language: 'es' | 'en'): boolean {
  const normalized = normalizeText(text);
  const commands = [...STOP_COMMANDS[language], ...STOP_COMMANDS[language === 'es' ? 'en' : 'es']];
  return commands.some(cmd => normalized === cmd || normalized.startsWith(cmd + ' '));
}

/**
 * Procesa un comando de voz con el nuevo flujo simplificado IA-First
 * Solo maneja casos críticos localmente, todo lo demás va a la IA
 */
export function processVoiceCommand(
  text: string,
  context: ProcessorContext
): ProcessingResult {
  const { language, isOnboardingMicTest, isWaitingForConfirmation, isAwaitingClarification } = context;
  const trimmed = text.trim();
  
  if (!trimmed) {
    return { handled: false };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 0: PENDING CLARIFICATION RESPONSE
  // If AI asked for clarification and user is responding
  // ─────────────────────────────────────────────────────────────
  if (isAwaitingClarification && context.processClarificationResponse) {
    const result = context.processClarificationResponse(trimmed);
    if (result.matched && result.option) {
      let response = '';
      switch (result.option.action) {
        case 'navigate':
          response = language === 'es' ? `Perfecto, te llevo.` : `Perfect, taking you there.`;
          break;
        case 'explain':
          response = language === 'es' ? `Te explico desde aquí.` : `I'll explain from here.`;
          break;
        case 'both':
          response = language === 'es' ? `Te llevo y te explico allí.` : `Taking you there and explaining.`;
          break;
        case 'cancel':
          response = language === 'es' ? `Entendido, cancelado.` : `Got it, cancelled.`;
          break;
      }
      return { handled: true, type: 'clarification-response', option: result.option, response };
    }
    // If not matched, fall through to AI
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 1: ONBOARDING MIC TEST
  // Only confirms mic works, ignores all command processing
  // ─────────────────────────────────────────────────────────────
  if (isOnboardingMicTest) {
    const response = language === 'es'
      ? `¡Te escucho perfectamente! Dijiste: "${trimmed.substring(0, 50)}${trimmed.length > 50 ? '...' : ''}". Tu micrófono funciona bien.`
      : `I hear you perfectly! You said: "${trimmed.substring(0, 50)}${trimmed.length > 50 ? '...' : ''}". Your microphone is working great.`;
    return { handled: true, type: 'onboarding-mic-test', response };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 2: STOP COMMANDS
  // User wants to stop the assistant from speaking
  // ─────────────────────────────────────────────────────────────
  if (isStopCommand(trimmed, language)) {
    const response = language === 'es' ? 'Entendido.' : 'Got it.';
    return { handled: true, type: 'stop-command', response };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 3: LANGUAGE SWITCH COMMANDS
  // "habla en inglés", "speak spanish", etc.
  // ─────────────────────────────────────────────────────────────
  const langCmd = context.checkLanguageCommand(trimmed);
  if (langCmd.isCommand && langCmd.targetLanguage) {
    const response = langCmd.targetLanguage === 'es'
      ? '¡Ahora hablaré en español!'
      : "I'll now speak in English!";
    return { handled: true, type: 'language-switch', targetLanguage: langCmd.targetLanguage, response };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 4: CONFIRMATION PENDING
  // If waiting for yes/no confirmation
  // ─────────────────────────────────────────────────────────────
  if (isWaitingForConfirmation) {
    const result = context.processConfirmation(trimmed);
    if (result.handled) {
      return { 
        handled: true, 
        type: 'confirmation', 
        confirmed: result.confirmed || false, 
        response: result.message || '' 
      };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 5: EVERYTHING ELSE → AI
  // The AI backend with tool calling handles:
  // - Navigation commands
  // - Data queries
  // - Creating expenses/income
  // - Explaining charts
  // - Tutorials
  // - Conversational responses
  // ─────────────────────────────────────────────────────────────
  return { handled: true, type: 'ai-fallback' };
}

// Re-export parseOpenClientCommand for backward compatibility
export { parseOpenClientCommand };
