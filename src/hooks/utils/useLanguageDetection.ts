import { useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Common words/patterns for each language - enhanced with more patterns
const SPANISH_INDICATORS = [
  // Question words
  'qué', 'que', 'cómo', 'como', 'cuánto', 'cuanto', 'dónde', 'donde', 'cuál', 'cual', 'quién', 'quien', 'cuándo', 'cuando',
  // Verbs - present
  'tengo', 'quiero', 'puedo', 'necesito', 'hay', 'estoy', 'soy', 'voy', 'hago', 'digo', 'sé', 'se', 'creo', 'pienso',
  // Verbs - past
  'gasté', 'gané', 'gaste', 'gane', 'hice', 'fui', 'tuve', 'pude', 'quise', 'dije', 'pagué', 'recibí', 'compré',
  // Verbs - imperative/infinitive
  'agregar', 'crear', 'ver', 'mostrar', 'abrir', 'ir', 'ayudar', 'explicar', 'decir', 'hacer', 'cambiar', 'buscar',
  // Pronouns
  'yo', 'mi', 'mis', 'mío', 'mio', 'tú', 'tu', 'él', 'ella', 'nosotros', 'ellos', 'me', 'te', 'nos',
  // Prepositions/articles
  'de', 'del', 'al', 'en', 'con', 'por', 'para', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  // Common words
  'hola', 'gracias', 'por favor', 'ayuda', 'gastos', 'ingresos', 'clientes', 'proyectos',
  'dinero', 'balance', 'este', 'esta', 'estos', 'estas', 'mes', 'año', 'día', 'hoy', 'ayer', 'mañana',
  'bien', 'mal', 'mucho', 'poco', 'más', 'menos', 'sí', 'no', 'ahora', 'después', 'antes', 'siempre', 'nunca',
  // Business terms
  'factura', 'pago', 'deducible', 'impuesto', 'reembolso', 'cliente', 'proyecto', 'contrato', 'recibo',
  // Financial terms
  'patrimonio', 'activos', 'pasivos', 'deuda', 'ahorro', 'inversión', 'retiro', 'jubilación',
  // Commands
  'llévame', 'llevame', 'abre', 'muéstrame', 'muestrame', 'dime', 'cuéntame', 'cuentame',
];

const ENGLISH_INDICATORS = [
  // Question words
  'what', 'how', 'when', 'where', 'which', 'who', 'why', 'whose',
  // Verbs - present
  'have', 'want', 'can', 'need', 'there', 'am', 'is', 'are', 'go', 'do', 'know', 'think', 'believe',
  // Verbs - past
  'spent', 'earned', 'did', 'was', 'were', 'had', 'went', 'made', 'paid', 'received', 'bought', 'got',
  // Verbs - imperative/infinitive
  'add', 'create', 'show', 'open', 'take', 'help', 'explain', 'tell', 'make', 'change', 'find', 'search',
  // Pronouns
  'i', 'my', 'me', 'mine', 'you', 'your', 'yours', 'he', 'she', 'we', 'they', 'it', 'us', 'them',
  // Prepositions/articles
  'of', 'to', 'in', 'on', 'at', 'for', 'the', 'a', 'an', 'with', 'from', 'about', 'into',
  // Common words
  'hello', 'hi', 'thanks', 'thank', 'please', 'help', 'expenses', 'income', 'clients', 'projects',
  'money', 'balance', 'this', 'that', 'these', 'those', 'month', 'year', 'day', 'today', 'yesterday', 'tomorrow',
  'good', 'bad', 'much', 'many', 'more', 'less', 'yes', 'no', 'now', 'later', 'before', 'always', 'never',
  // Business terms
  'invoice', 'payment', 'deductible', 'tax', 'reimbursement', 'client', 'project', 'contract', 'receipt',
  // Financial terms
  'net worth', 'assets', 'liabilities', 'debt', 'savings', 'investment', 'retirement',
  // Commands
  'take me', 'show me', 'tell me', 'give me', 'let me',
];

interface LanguageDetectionResult {
  detectedLanguage: 'es' | 'en';
  confidence: number; // 0 to 1
  shouldSwitch: boolean;
}

export function useLanguageDetection() {
  const { language, setLanguage } = useLanguage();
  const lastDetectedRef = useRef<'es' | 'en'>(language as 'es' | 'en');
  const consecutiveSwitchesRef = useRef(0);

  // Detect language from text
  const detectLanguage = useCallback((text: string): LanguageDetectionResult => {
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);
    
    let spanishScore = 0;
    let englishScore = 0;
    
    // Count matching indicators
    for (const word of words) {
      // Check exact matches
      if (SPANISH_INDICATORS.includes(word)) {
        spanishScore += 1;
      }
      if (ENGLISH_INDICATORS.includes(word)) {
        englishScore += 1;
      }
    }
    
    // Also check for multi-word patterns
    for (const pattern of SPANISH_INDICATORS) {
      if (pattern.includes(' ') && normalizedText.includes(pattern)) {
        spanishScore += 2;
      }
    }
    for (const pattern of ENGLISH_INDICATORS) {
      if (pattern.includes(' ') && normalizedText.includes(pattern)) {
        englishScore += 2;
      }
    }
    
    // Check for Spanish-specific characters
    if (/[áéíóúüñ¿¡]/i.test(normalizedText)) {
      spanishScore += 2;
    }
    
    // Calculate totals
    const totalScore = spanishScore + englishScore;
    
    if (totalScore === 0) {
      // No clear indicators, keep current language
      return {
        detectedLanguage: language as 'es' | 'en',
        confidence: 0,
        shouldSwitch: false,
      };
    }
    
    const spanishRatio = spanishScore / totalScore;
    const englishRatio = englishScore / totalScore;
    
    let detectedLanguage: 'es' | 'en';
    let confidence: number;
    
    if (spanishRatio > englishRatio) {
      detectedLanguage = 'es';
      confidence = spanishRatio;
    } else if (englishRatio > spanishRatio) {
      detectedLanguage = 'en';
      confidence = englishRatio;
    } else {
      // Tie - keep current language
      detectedLanguage = language as 'es' | 'en';
      confidence = 0.5;
    }
    
    // Determine if we should switch
    // Only switch if confidence is high AND different from current
    const shouldSwitch = 
      detectedLanguage !== language && 
      confidence >= 0.65 && 
      totalScore >= 3; // Need at least 3 indicator matches
    
    return {
      detectedLanguage,
      confidence,
      shouldSwitch,
    };
  }, [language]);

  // Auto-switch language if detected with high confidence
  const autoSwitchLanguage = useCallback((text: string): { 
    switched: boolean; 
    newLanguage: 'es' | 'en';
    message?: { es: string; en: string };
  } => {
    const result = detectLanguage(text);
    
    if (result.shouldSwitch) {
      // Track consecutive switches to prevent flapping
      if (result.detectedLanguage === lastDetectedRef.current) {
        consecutiveSwitchesRef.current++;
      } else {
        consecutiveSwitchesRef.current = 1;
        lastDetectedRef.current = result.detectedLanguage;
      }
      
      // Only actually switch after 2 consecutive detections of same language
      // This prevents accidental switches from mixed-language input
      if (consecutiveSwitchesRef.current >= 2) {
        setLanguage(result.detectedLanguage);
        consecutiveSwitchesRef.current = 0;
        
        return {
          switched: true,
          newLanguage: result.detectedLanguage,
          message: {
            es: `Cambié a español. Si prefieres inglés, di "cambiar a inglés".`,
            en: `Switched to English. If you prefer Spanish, say "switch to Spanish".`,
          },
        };
      }
    }
    
    return {
      switched: false,
      newLanguage: language as 'es' | 'en',
    };
  }, [detectLanguage, language, setLanguage]);

  // Manual language switch commands
  const checkLanguageCommand = useCallback((text: string): { 
    isCommand: boolean; 
    targetLanguage?: 'es' | 'en';
  } => {
    const normalizedText = text.toLowerCase().trim();
    
    const switchToSpanish = [
      'cambiar a español', 'en español', 'habla español', 'habla en español',
      'switch to spanish', 'speak spanish', 'in spanish', 'spanish please',
    ];
    
    const switchToEnglish = [
      'cambiar a inglés', 'cambiar a ingles', 'en inglés', 'habla inglés', 'habla ingles',
      'switch to english', 'speak english', 'in english', 'english please',
    ];
    
    for (const cmd of switchToSpanish) {
      if (normalizedText.includes(cmd)) {
        return { isCommand: true, targetLanguage: 'es' };
      }
    }
    
    for (const cmd of switchToEnglish) {
      if (normalizedText.includes(cmd)) {
        return { isCommand: true, targetLanguage: 'en' };
      }
    }
    
    return { isCommand: false };
  }, []);

  // Execute language switch
  const executeLanguageSwitch = useCallback((targetLanguage: 'es' | 'en'): string => {
    setLanguage(targetLanguage);
    
    return targetLanguage === 'es'
      ? '¡Perfecto! Ahora hablaré en español.'
      : 'Perfect! I\'ll now speak in English.';
  }, [setLanguage]);

  return {
    currentLanguage: language as 'es' | 'en',
    detectLanguage,
    autoSwitchLanguage,
    checkLanguageCommand,
    executeLanguageSwitch,
  };
}
