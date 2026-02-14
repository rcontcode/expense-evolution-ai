import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Send, Loader2, Sparkles, HelpCircle, Target, Lightbulb, Mic, MicOff, Volume2, VolumeX, Radio, Play, Square, AlertTriangle, BookOpen, Settings, Volume1, History, Zap, TrendingUp, ArrowRight, Minimize2 } from 'lucide-react';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useIncome, useCreateIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useExpenses, useCreateExpense } from '@/hooks/data/useExpenses';
import { useFinancialProfile } from '@/hooks/data/useFinancialProfile';
import { KaraokeText } from './KaraokeText';
import { MinimizedAssistant } from './MinimizedAssistant';
import { MinimizedAssistantBubble } from './MinimizedAssistantBubble';
import { VoiceOnboarding } from './voice/VoiceOnboarding';
import { useMicrophonePermission, MicrophonePermissionAlert } from './voice/MicrophonePermission';
// ContinuousModeIndicator removed - using simplified Push-to-Talk only
import { useVoiceKeyboardShortcuts } from '@/hooks/utils/useKeyboardShortcuts';
// Import centralized voice modules
import { processVoiceCommand, ClarificationOption } from './voice/VoiceCommandProcessor';
import { parseOpenClientCommand } from './voice/VoiceActionParsers';
import { VoiceCommandsCheatsheet } from './voice/VoiceCommandsCheatsheet';
import { ClarificationIndicator } from './ClarificationIndicator';
import { IntentFeedback } from './IntentFeedback';
import { QuickResponseChips, getQuickResponsesForContext } from './QuickResponseChips';
import { AudioLevelIndicator } from './voice/AudioLevelIndicator';
import { SmartSuggestions } from './SmartSuggestions';
import { ConversationContext } from './ConversationContext';
import { TypingIndicator, ThinkingStatus } from './TypingIndicator';
import { VoiceSettingsPanel } from './VoiceSettingsPanel';
import { useSmartContext } from '@/hooks/utils/useSmartContext';
import { usePlanLimits } from '@/hooks/data/usePlanLimits';

import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHighlight, HIGHLIGHTABLE_ELEMENTS } from '@/contexts/HighlightContext';
import { detectHighlightTargets, getNavigationHighlights } from '@/lib/highlight-detection';
import { useAssistantVoiceControl } from '@/hooks/utils/useAssistantVoiceControl';
import { useSmartGuidance } from '@/hooks/utils/useSmartGuidance';
import { useVoiceConfirmation } from '@/hooks/utils/useVoiceConfirmation';
import { useConversationState } from '@/hooks/utils/useConversationState';
import { useConversationMemory } from '@/hooks/utils/useConversationMemory';
import { useVoiceSynthesis } from '@/hooks/utils/useVoiceSynthesis';
import { voiceSynthesisManager } from '@/lib/voiceSynthesisManager';
import { useLanguageDetection } from '@/hooks/utils/useLanguageDetection';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEntity } from '@/contexts/EntityContext';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Local QUICK_QUESTIONS with actual icon components (imported module uses string names)
const LOCAL_QUICK_QUESTIONS = {
  es: [
    { icon: HelpCircle, text: "¿Cómo capturo un gasto?" },
    { icon: Target, text: "¿Qué gastos puedo deducir?" },
    { icon: Lightbulb, text: "¿Cómo facturo a un cliente?" },
    { icon: Sparkles, text: "Sugiere cómo mejorar mis finanzas" },
  ],
  en: [
    { icon: HelpCircle, text: "How do I capture an expense?" },
    { icon: Target, text: "What expenses can I deduct?" },
    { icon: Lightbulb, text: "How do I bill a client?" },
    { icon: Sparkles, text: "Suggest how to improve my finances" },
  ],
};

// Public routes where ChatAssistant should NOT appear
const PUBLIC_ROUTES = ['/', '/landing', '/quiz', '/auth', '/legal', '/install'];

export const ChatAssistant: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Don't render on public/marketing pages
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBubbleMode, setIsBubbleMode] = useState(false); // Compact bubble mode for tutorials/navigation
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<number | null>(null);
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnboardingMicTest, setIsOnboardingMicTest] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathRef = useRef<string>('');
  const navigate = useNavigate();
  
  // Auto-minimize to bubble mode when navigating or in tutorial
  const autoMinimizeToBubble = useCallback(() => {
    if (isOpen && !isMinimized) {
      setIsBubbleMode(true);
      setIsOpen(false);
    }
  }, [isOpen, isMinimized]);
  
  // Early return for public routes - must be after all hooks
  if (isPublicRoute) {
    return null;
  }

  // Expand from bubble mode
  const expandFromBubble = useCallback(() => {
    setIsBubbleMode(false);
    setIsOpen(true);
  }, []);
  
  // Microphone permission management
  const micPermission = useMicrophonePermission();
  
  // Highlight system for interactive tutorials
  const { highlight, clearHighlights, isHighlightEnabled } = useHighlight();

  const { user } = useAuth();
  const { currentEntity, currentCurrency, isMultiEntity, activeEntities } = useEntity();
  const { data: profile } = useProfile();
  const { data: stats } = useDashboardStats();
  const { data: incomeData } = useIncome();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: expenses } = useExpenses();
  const { data: financialProfile } = useFinancialProfile();
  const { language } = useLanguage();
  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();
  
  // Plan limits for voice assistant
  const { canUseVoice, planType, hasFeature } = usePlanLimits();

  // Smart guidance system
  const { 
    getContextualWelcome, 
    getProactiveAlerts, 
    findTutorial, 
    getTutorialForCurrentPage,
    formatTutorialForSpeech,
    getPostActionSuggestion,
    getErrorRecovery,
    getQuickActions 
  } = useSmartGuidance();

  // Voice confirmation system
  const voiceConfirmation = useVoiceConfirmation();

  // Conversation state for clarification flows
  const conversationState = useConversationState();

  // Conversation memory for context
  const conversationMemory = useConversationMemory();

  // Language detection
  const langDetection = useLanguageDetection();

  // Current detected intent for visual feedback
  const [currentIntent, setCurrentIntent] = useState<{
    intent: string | null;
    action: string | null;
    target: string | null;
    showUntil: number;
  }>({ intent: null, action: null, target: null, showUntil: 0 });

  // Calculate financial data for queries
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = stats?.monthlyTotal || 0;
  const yearlyExpenses = stats?.totalExpenses || 0;
  const monthlyIncome = incomeData?.filter(inc => {
    const incDate = new Date(inc.date);
    return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear;
  }).reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;

  const yearlyIncome = incomeData?.filter(inc => {
    const incDate = new Date(inc.date);
    return incDate.getFullYear() === currentYear;
  }).reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;

  const totalIncome = incomeData?.reduce((sum, inc) => sum + Number(inc.amount), 0) || 0;
  const balance = yearlyIncome - yearlyExpenses;
  const pendingReceipts = stats?.pendingDocs || 0;

  // Calculate advanced metrics
  const biggestExpense = expenses?.reduce((max, exp) => 
    Number(exp.amount) > Number(max?.amount || 0) ? exp : max, expenses[0]);
  
  const categoryTotals = expenses?.reduce((acc, exp) => {
    const cat = exp.category || 'other';
    acc[cat] = (acc[cat] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>) || {};
  
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  
  const deductibleTotal = expenses?.filter(exp => exp.status === 'deductible')
    .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  
  const billableTotal = expenses?.filter(exp => exp.reimbursement_type === 'client_reimbursable' || exp.status === 'reimbursable')
    .reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

  // Estimated tax owed (simplified calculation)
  const estimatedTaxRate = 0.25; // 25% estimated average
  const estimatedTaxOwed = Math.max(0, (yearlyIncome - deductibleTotal) * estimatedTaxRate);

  const userName = profile?.full_name?.split(' ')[0] || 'Usuario'
  const quickQuestions = LOCAL_QUICK_QUESTIONS[language as keyof typeof LOCAL_QUICK_QUESTIONS] || LOCAL_QUICK_QUESTIONS.es;
  
  // Get personalized frequent actions - uses voicePrefs which is set after voiceControl hook
  // Moved to a safe default until voicePrefs is available
  const frequentActions: { action: string; count: number; info: { route: string; name: { es: string; en: string }; icon: typeof Zap } }[] = [];

  // Haptic feedback helper (for mobile)
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [30],
        heavy: [50, 30, 50],
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Get current page context for the AI assistant to explain
  const getCurrentPageContext = useCallback((): { pageName: string; description: string } => {
    const pageContexts: Record<string, { es: { name: string; desc: string }; en: { name: string; desc: string } }> = {
      '/dashboard': {
        es: { name: 'Dashboard', desc: 'Esta es tu página principal donde puedes ver un resumen de tus finanzas: balance general, gastos e ingresos del mes, gráficos de tendencias, y accesos rápidos a las funciones principales. Desde aquí puedes capturar gastos, ver alertas de presupuesto, y acceder a herramientas como la calculadora de libertad financiera y el optimizador de impuestos.' },
        en: { name: 'Dashboard', desc: 'This is your main page where you can see a summary of your finances: overall balance, monthly expenses and income, trend charts, and quick access to main features. From here you can capture expenses, view budget alerts, and access tools like the FIRE calculator and tax optimizer.' },
      },
      '/expenses': {
        es: { name: 'Gastos', desc: 'Aquí puedes ver, agregar y gestionar todos tus gastos. Puedes filtrarlos por fecha, categoría, cliente o tipo de reembolso. Cada gasto puede tener recibos adjuntos, etiquetas, y ser asignado a proyectos o contratos. Usa el botón "Agregar Gasto" para registrar uno nuevo, o el botón de captura rápida para escanear un recibo.' },
        en: { name: 'Expenses', desc: 'Here you can view, add and manage all your expenses. You can filter them by date, category, client or reimbursement type. Each expense can have attached receipts, tags, and be assigned to projects or contracts. Use the "Add Expense" button to record a new one, or quick capture to scan a receipt.' },
      },
      '/income': {
        es: { name: 'Ingresos', desc: 'Esta página muestra todos tus ingresos registrados. Puedes agregar ingresos de diferentes tipos: pagos de clientes, salario, freelance, inversiones, ingresos pasivos, etc. También puedes ver análisis de tus fuentes de ingreso y tendencias.' },
        en: { name: 'Income', desc: 'This page shows all your recorded income. You can add income from different types: client payments, salary, freelance, investments, passive income, etc. You can also see analysis of your income sources and trends.' },
      },
      '/clients': {
        es: { name: 'Clientes', desc: 'Gestiona tus clientes aquí. Puedes agregar nuevos clientes con su información de contacto, dirección, y configuración de facturación. Los clientes se pueden asociar a proyectos, contratos y gastos para un mejor seguimiento financiero.' },
        en: { name: 'Clients', desc: 'Manage your clients here. You can add new clients with their contact info, address, and billing settings. Clients can be associated with projects, contracts and expenses for better financial tracking.' },
      },
      '/projects': {
        es: { name: 'Proyectos', desc: 'Administra tus proyectos de trabajo. Cada proyecto puede tener un presupuesto, fechas de inicio y fin, y estar asociado a clientes. Puedes ver el balance financiero de cada proyecto (ingresos vs gastos) y su estado.' },
        en: { name: 'Projects', desc: 'Manage your work projects. Each project can have a budget, start and end dates, and be associated with clients. You can see the financial balance of each project (income vs expenses) and its status.' },
      },
      '/contracts': {
        es: { name: 'Contratos', desc: 'Sube y gestiona tus contratos aquí. La app puede analizar contratos con IA para extraer términos de reembolso, fechas importantes, y condiciones. Los contratos se vinculan a clientes y ayudan a clasificar automáticamente los gastos.' },
        en: { name: 'Contracts', desc: 'Upload and manage your contracts here. The app can analyze contracts with AI to extract reimbursement terms, important dates, and conditions. Contracts link to clients and help automatically classify expenses.' },
      },
      '/mileage': {
        es: { name: 'Kilometraje', desc: 'Registra tus viajes de trabajo para deducción fiscal. Puedes agregar rutas con direcciones de inicio y destino, ver mapas, y la app calcula automáticamente los kilómetros. Útil para deducir gastos de transporte en tus impuestos.' },
        en: { name: 'Mileage', desc: 'Record your work trips for tax deduction. You can add routes with start and end addresses, view maps, and the app automatically calculates kilometers. Useful for deducting transportation expenses on your taxes.' },
      },
      '/net-worth': {
        es: { name: 'Patrimonio Neto', desc: 'Rastrea tu patrimonio neto aquí. Agrega tus activos (cuentas, inversiones, propiedades, crypto) y pasivos (deudas, préstamos). La app calcula tu patrimonio neto y muestra su evolución en el tiempo.' },
        en: { name: 'Net Worth', desc: 'Track your net worth here. Add your assets (accounts, investments, properties, crypto) and liabilities (debts, loans). The app calculates your net worth and shows its evolution over time.' },
      },
      '/banking': {
        es: { name: 'Análisis Bancario', desc: 'Sube estados de cuenta bancarios para análisis inteligente. La app detecta patrones de gasto, pagos recurrentes, anomalías, y te permite hacer preguntas sobre tus transacciones. Útil para tener visibilidad de todas tus cuentas.' },
        en: { name: 'Banking Analysis', desc: 'Upload bank statements for smart analysis. The app detects spending patterns, recurring payments, anomalies, and lets you ask questions about your transactions. Useful for visibility across all your accounts.' },
      },
      '/mentorship': {
        es: { name: 'Mentoría Financiera', desc: 'Tu centro de educación financiera basado en principios de Kiyosaki, Rohn y Tracy. Incluye el Cuadrante de Flujo de Efectivo, seguimiento de libertad financiera, diario financiero, hábitos, metas SMART, y biblioteca de recursos.' },
        en: { name: 'Financial Mentorship', desc: 'Your financial education center based on Kiyosaki, Rohn and Tracy principles. Includes Cashflow Quadrant, financial freedom tracking, financial journal, habits, SMART goals, and resource library.' },
      },
      '/settings': {
        es: { name: 'Configuración', desc: 'Ajusta las preferencias de la app: idioma, tema visual, notificaciones, y gestiona tus metas de ahorro. También puedes ver y gestionar datos de muestra para probar la app.' },
        en: { name: 'Settings', desc: 'Adjust app preferences: language, visual theme, notifications, and manage your savings goals. You can also view and manage sample data to test the app.' },
      },
      '/tax-calendar': {
        es: { name: 'Calendario Fiscal', desc: 'Ve tus fechas límite de impuestos, estimaciones fiscales, y recursos tributarios. La app te recuerda fechas importantes según tu país (Canadá o Chile) y te ayuda a planificar tus obligaciones fiscales.' },
        en: { name: 'Tax Calendar', desc: 'View your tax deadlines, tax estimates, and tax resources. The app reminds you of important dates based on your country (Canada or Chile) and helps you plan your tax obligations.' },
      },
      '/chaos-inbox': {
        es: { name: 'Centro de Revisión', desc: 'Revisa y procesa recibos capturados que necesitan clasificación. Aquí puedes aprobar, rechazar, o editar gastos extraídos de fotos antes de que se agreguen a tu registro oficial. Usa el botón de cámara para escanear nuevos recibos, o revisa los pendientes en la cola.' },
        en: { name: 'Review Center', desc: 'Review and process captured receipts that need classification. Here you can approve, reject, or edit expenses extracted from photos before they are added to your official records. Use the camera button to scan new receipts, or review pending ones in the queue.' },
      },
      '/chaos': {
        es: { name: 'Centro de Revisión', desc: 'Revisa y procesa recibos capturados que necesitan clasificación. Aquí puedes aprobar, rechazar, o editar gastos extraídos de fotos antes de que se agreguen a tu registro oficial. Usa el botón de cámara para escanear nuevos recibos, o revisa los pendientes en la cola.' },
        en: { name: 'Review Center', desc: 'Review and process captured receipts that need classification. Here you can approve, reject, or edit expenses extracted from photos before they are added to your official records. Use the camera button to scan new receipts, or review pending ones in the queue.' },
      },
      '/notifications': {
        es: { name: 'Notificaciones', desc: 'Este es tu centro de alertas. Aquí ves tus logros desbloqueados, metas alcanzadas, rachas de hábitos financieros, recordatorios de impuestos y tips personalizados. Puedes filtrar por tipo (Todas, Sin leer, Logros, Metas), marcar como leídas con un clic, o limpiar todas. Cada notificación puede llevarte directo a la sección relevante de la app.' },
        en: { name: 'Notifications', desc: 'This is your alert center. Here you see your unlocked achievements, reached goals, financial habit streaks, tax reminders and personalized tips. You can filter by type (All, Unread, Achievements, Goals), mark as read with a click, or clear all. Each notification can take you directly to the relevant app section.' },
      },
      '/reconciliation': {
        es: { name: 'Conciliación Bancaria', desc: 'Aquí emparejas tus transacciones bancarias con los gastos que ya registraste. Importa un estado de cuenta, y la IA sugiere coincidencias automáticas. Puedes resolver discrepancias, encontrar gastos que olvidaste registrar, y asegurarte de que tu contabilidad esté completa.' },
        en: { name: 'Bank Reconciliation', desc: 'Here you match your bank transactions with expenses you already recorded. Import a bank statement, and AI suggests automatic matches. You can resolve discrepancies, find expenses you forgot to record, and make sure your accounting is complete.' },
      },
      '/tags': {
        es: { name: 'Etiquetas', desc: 'Crea y organiza etiquetas personalizadas para clasificar tus gastos más allá de las categorías estándar. Puedes asignar colores, agrupar etiquetas, y luego filtrar gastos por etiqueta en la sección de Gastos.' },
        en: { name: 'Tags', desc: 'Create and organize custom tags to classify your expenses beyond standard categories. You can assign colors, group tags, and then filter expenses by tag in the Expenses section.' },
      },
      '/business-profile': {
        es: { name: 'Perfil de Negocio', desc: 'Configura tu perfil fiscal aquí: país, provincia/región, moneda predeterminada, y datos de negocio. Estos datos se usan para calcular impuestos correctamente, mostrar la moneda adecuada en toda la app, y personalizar las funciones fiscales según tu jurisdicción.' },
        en: { name: 'Business Profile', desc: 'Set up your tax profile here: country, province/region, default currency, and business data. This data is used to calculate taxes correctly, show the right currency throughout the app, and customize tax features for your jurisdiction.' },
      },
      '/capture': {
        es: { name: 'Captura Rápida', desc: 'Usa la cámara para tomar fotos de recibos rápidamente. La IA extrae automáticamente el monto, fecha, comercio y categoría. Puedes capturar múltiples recibos en secuencia sin salir de esta pantalla.' },
        en: { name: 'Quick Capture', desc: 'Use the camera to quickly take receipt photos. AI automatically extracts amount, date, merchant and category. You can capture multiple receipts in sequence without leaving this screen.' },
      },
      '/adventure': {
        es: { name: 'Aventura Financiera', desc: 'Un juego interactivo para aprender conceptos financieros mientras te diviertes. Toma decisiones financieras en escenarios simulados y ve cómo afectan tu futuro financiero.' },
        en: { name: 'Financial Adventure', desc: 'An interactive game to learn financial concepts while having fun. Make financial decisions in simulated scenarios and see how they affect your financial future.' },
      },
    };

    const currentPath = location.pathname;
    const context = pageContexts[currentPath];
    
    if (context) {
      const lang = language === 'es' ? 'es' : 'en';
      return { pageName: context[lang].name, description: context[lang].desc };
    }
    
    return { 
      pageName: language === 'es' ? 'Página actual' : 'Current page',
      description: language === 'es' ? 'Estás en una página de la aplicación.' : 'You are on an application page.'
    };
  }, [location.pathname, language]);

  // Check if user is asking about the current page
  const isAskingAboutCurrentPage = useCallback((text: string): boolean => {
    const normalizedText = text.toLowerCase().trim();
    // Only match when EXPLICITLY asking about THIS page/screen — never when asking to explain a concept
    const exactPhrases = [
      'qué es esto', 'que es esto', 'dónde estoy', 'donde estoy', 'qué página es esta', 
      'que pagina es esta', 'explica esta página', 'explica esta pagina', 'qué puedo hacer aquí',
      'que puedo hacer aqui', 'cómo funciona esta página', 'como funciona esta pagina',
      'ayúdame con esta página', 'ayudame con esta pagina',
      'what is this page', 'where am i', 'what page is this', 'explain this page', 
      'what can i do here', 'help me with this page',
      'guíame aquí', 'guiame aqui', 'ayuda aquí', 'help here'
    ];
    // Must be an exact or near-exact match — NOT a substring of a longer question
    return exactPhrases.some(q => normalizedText === q || normalizedText === q + '?');
  }, []);

  // Handle voice command execution
  const executeVoiceCommand = useCallback((route: string, name: string, action?: string) => {
    const confirmMsg = language === 'es' 
      ? `Navegando a ${name}`
      : `Navigating to ${name}`;
    
    toast.success(confirmMsg);
    
    // Navigate to route
    navigate(route);
    
    // If there's an action, dispatch a custom event after navigation
    if (action) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('voice-command-action', { detail: { action } }));
      }, 500);
    }
  }, [navigate, language]);

  // UNIFIED Voice Control Hook - single source of truth for ALL voice activity
  const voiceControl = useAssistantVoiceControl({
    onInterimTranscript: (text) => {
      setInput(text);
    },
    onInterrupted: () => {
      voiceControl.voicePrefs.playSound('notification');
      const msg = language === 'es' ? 'Interrumpido. ¿Qué necesitas?' : 'Interrupted. What do you need?';
      toast.info(msg);
    },
    onTranscript: (text) => {
      console.log('[ChatAssistant] Received transcript:', text);
      
      // Track action for learning
      voiceControl.voicePrefs.trackAction('voice_input');

      // Auto-detect language and switch if needed (non-blocking)
      const langSwitch = langDetection.autoSwitchLanguage(text);
      if (langSwitch.switched && langSwitch.message) {
        const notifyMsg = langSwitch.message[langSwitch.newLanguage];
        toast.info(notifyMsg);
      }

      // Build context for the simplified IA-First processor
      const processorContext = {
        language: language as 'es' | 'en',
        isOnboardingMicTest,
        isWaitingForConfirmation: voiceConfirmation.isWaitingForConfirmation,
        isAwaitingClarification: conversationState.isAwaitingClarification,
        pendingClarificationOptions: conversationState.context?.options,
        currentPath: location.pathname,
        checkLanguageCommand: langDetection.checkLanguageCommand,
        processConfirmation: voiceConfirmation.processConfirmationVoice,
        processClarificationResponse: (userText: string) => 
          conversationState.processClarificationResponse(userText, language as 'es' | 'en'),
      };

      // Use centralized processor (clear priority chain, no conflicts)
      const result = processVoiceCommand(text, processorContext);
      
      if (!result.handled) {
        return;
      }

      // Helper to add messages and speak (respects autoSpeak setting)
      const respondWithMessage = (userText: string, response: string, sound?: 'success' | 'notification' | 'error') => {
        setInput('');
        const userMessage: Message = { role: 'user', content: userText };
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        if (autoSpeak) {
          voiceControl.speak(response);
        }
        if (sound) voiceControl.voicePrefs.playSound(sound);
      };

      // Handle each result type
      switch (result.type) {
        case 'onboarding-mic-test':
          setInput('');
          voiceControl.speak(result.response);
          setIsOnboardingMicTest(false);
          return;

        case 'language-switch':
          langDetection.executeLanguageSwitch(result.targetLanguage);
          respondWithMessage(text, result.response, 'success');
          return;

        case 'confirmation':
          setInput('');
          if (result.response) {
            const confirmMessage: Message = { role: 'assistant', content: result.response };
            setMessages(prev => [...prev, confirmMessage]);
            voiceControl.speak(result.response);
            voiceControl.voicePrefs.playSound(result.confirmed ? 'success' : 'notification');
          }
          return;

        case 'clarification-response':
          setInput('');
          if (result.option) {
            const option = result.option;
            const assistantMsg: Message = { role: 'assistant', content: result.response };
            setMessages(prev => [...prev, assistantMsg]);
            voiceControl.speak(result.response);
            
            if (option.action === 'navigate' || option.action === 'both') {
              if (option.route) {
                triggerHapticFeedback('medium');
                navigate(option.route);
                setTimeout(() => autoMinimizeToBubble(), 800);
              }
            }
            if (option.action === 'explain' || option.action === 'both') {
              if (option.target) {
                const tutorial = findTutorial(option.target);
                if (tutorial) {
                  setActiveTutorial(tutorial.id);
                  setCurrentTutorialStep(0);
                }
              }
            }
            voiceControl.voicePrefs.playSound('success');
          }
          return;

        case 'stop-command':
          setInput('');
          voiceControl.stopAll();
          voiceControl.voicePrefs.playSound('notification');
          return;

        case 'ai-fallback':
          setInput('');
          const userMessage: Message = { role: 'user', content: text };
          setMessages(prev => [...prev, userMessage]);
          sendMessage(text, true);
          return;
      }
    },
  });

  // Destructure commonly used values for convenience
  const { isAnySpeaking, isListening, isSupported: isVoiceSupported, transcript, 
          currentSpeakingText, currentSentenceIndex, isSpeechPaused } = voiceControl;
  const voicePrefs = voiceControl.voicePrefs;
  const elevenLabsTTS = voiceControl.elevenLabsTTS;

  // Track recording duration
  useEffect(() => {
    if (isListening && !recordingStartTime) {
      setRecordingStartTime(Date.now());
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!isListening && recordingStartTime) {
      setRecordingStartTime(null);
      setRecordingDuration(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
    
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isListening, recordingStartTime]);

  // Update input with live transcript - only when actually listening and NOT speaking
  useEffect(() => {
    const isOutputtingOrProcessing = isAnySpeaking || isLoading || isProcessingVoice;
    
    if (transcript && isListening && !isOutputtingOrProcessing) {
      setInput(transcript);
    }
  }, [transcript, isListening, isAnySpeaking, isLoading, isProcessingVoice]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    
    // Contextual welcome message when chat opens
    if (isOpen && !hasShownWelcome && messages.length === 0) {
      setHasShownWelcome(true);
      
      const welcome = getContextualWelcome();
      const welcomeMessage: Message = { role: 'assistant', content: welcome };
      setMessages([welcomeMessage]);
      
      // Check for proactive alerts
      const alerts = getProactiveAlerts();
      if (alerts.length > 0) {
        setShowAlerts(true);
        // Add first high-priority alert as a message
        const highPriorityAlert = alerts.find(a => a.priority === 'high');
        if (highPriorityAlert) {
          setTimeout(() => {
            const alertMsg: Message = { 
              role: 'assistant', 
              content: `⚠️ ${highPriorityAlert.message[language as 'es' | 'en']}` 
            };
            setMessages(prev => [...prev, alertMsg]);
          }, 2000);
        }
      }
      
      // Speak welcome if autoSpeak enabled
      if (autoSpeak && isVoiceSupported) {
        setTimeout(() => {
          voiceControl.speak(welcome);
        }, 500);
      }
    }
  }, [isOpen, hasShownWelcome, messages.length, getContextualWelcome, getProactiveAlerts, autoSpeak, isVoiceSupported, voiceControl, language]);

  // Check voice reminders periodically
  useEffect(() => {
    if (!isOpen || !isVoiceSupported) return;
    
    const checkInterval = setInterval(() => {
      const dueReminders = voicePrefs.checkReminders(language as 'es' | 'en');
      if (dueReminders.length > 0) {
        dueReminders.forEach(reminder => {
          const reminderMsg: Message = { role: 'assistant', content: `🔔 ${reminder}` };
          setMessages(prev => [...prev, reminderMsg]);
          if (autoSpeak) {
            voiceControl.speak(reminder);
          }
          voicePrefs.playSound('notification');
        });
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [isOpen, isVoiceSupported, language, autoSpeak, voiceControl, voicePrefs]);

  // Check if voice onboarding is needed - use CONSISTENT key with VoiceOnboarding.tsx
  useEffect(() => {
    if (isOpen && isVoiceSupported) {
      const hasCompletedOnboarding = localStorage.getItem('evofinz_voice_onboarding_completed');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isOpen, isVoiceSupported]);

  // Keyboard shortcuts for voice control
  useVoiceKeyboardShortcuts({
    onToggleMic: () => {
      if (isVoiceSupported) {
        voiceControl.toggleListening();
      }
    },
    onToggleContinuous: () => {
      if (isVoiceSupported) {
        voiceControl.toggleListening();
      }
    },
    onStopSpeaking: () => {
      voiceControl.stopAll();
    },
    onOpenChat: () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    },
    enabled: true,
  });

  // Track page navigation for contextual updates
  useEffect(() => {
    if (location.pathname !== previousPathRef.current && isOpen && hasShownWelcome) {
      previousPathRef.current = location.pathname;
      
      // Offer help on new page
      const pageContext = getCurrentPageContext();
      const navMsg = language === 'es'
        ? `Ahora estás en ${pageContext.pageName}. ¿Necesitas ayuda aquí?`
        : `You're now on ${pageContext.pageName}. Need help here?`;
      
      const navMessage: Message = { role: 'assistant', content: navMsg };
      setMessages(prev => [...prev, navMessage]);
    }
    previousPathRef.current = location.pathname;
  }, [location.pathname, isOpen, hasShownWelcome, getCurrentPageContext, language]);

  // Route mapping for navigation actions (fallback if edge function doesn't provide route)
  // MUST be synchronized with:
  //   - supabase/functions/app-assistant/index.ts (AVAILABLE_ROUTES)
  //   - src/hooks/utils/useAssistantActions.ts (ROUTE_MAP)
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

  // Execute action returned by AI
  const executeAIAction = useCallback((action: {
    action: string;
    target?: string;
    route?: string;
    name?: string;
    message: string;
    data?: Record<string, unknown>;
  }) => {
    console.log('[AI Action] Executing:', action);
    
    switch (action.action) {
      case 'navigate':
        // Get route from action or fallback to route map
        const targetRoute = action.route || (action.target ? ROUTE_MAP[action.target] : null);
        
        if (targetRoute) {
          triggerHapticFeedback('medium');
          voicePrefs.trackAction('navigation');
          
          console.log('[AI Action] Navigating to:', targetRoute);
          navigate(targetRoute);
          
          // Show success toast
          toast.success(action.message || (language === 'es' ? 'Navegando...' : 'Navigating...'));
          
          // Trigger navigation highlights after navigation completes with retry logic
          if (isHighlightEnabled) {
            const attemptHighlight = (attempt: number) => {
              const navHighlights = getNavigationHighlights(targetRoute, language as 'es' | 'en');
              if (navHighlights.length > 0) {
                // Check if elements exist in DOM
                const firstTarget = navHighlights[0];
                const element = document.querySelector(`[data-highlight="${firstTarget.selector}"]`);
                
                if (element) {
                  highlight(navHighlights);
                } else if (attempt < 3) {
                  // Retry after additional delay if element not found
                  setTimeout(() => attemptHighlight(attempt + 1), 500);
                } else {
                  // Last attempt, try anyway
                  highlight(navHighlights);
                }
              }
            };
            
            // Initial delay for page render
            setTimeout(() => attemptHighlight(0), 800);
          }
        } else {
          console.warn('[AI Action] No route found for target:', action.target);
        }
        break;
        
      case 'open':
        // Navigate to section and then open specific item
        const openRoute = action.route || (action.target ? ROUTE_MAP[action.target] : null);
        if (openRoute) {
          triggerHapticFeedback('medium');
          voicePrefs.trackAction('navigation');
          
          console.log('[AI Action] Opening item at:', openRoute, 'item:', action.data?.itemName);
          navigate(openRoute);
          
          toast.success(action.message || (language === 'es' ? 'Abriendo...' : 'Opening...'));
          
          // Dispatch event to open specific item after navigation completes
          if (action.data?.itemName) {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('voice-command-action', {
                  detail: { 
                    action: 'open-item', 
                    itemName: action.data?.itemName,
                    section: action.target 
                  },
                })
              );
              console.log('[AI Action] Dispatched open-item event for:', action.data?.itemName);
            }, 700);
          }
          
          // Also trigger highlights if enabled
          if (isHighlightEnabled) {
            setTimeout(() => {
              const navHighlights = getNavigationHighlights(openRoute, language as 'es' | 'en');
              if (navHighlights.length > 0) {
                highlight(navHighlights);
              }
            }, 1200);
          }
        }
        break;
        
      case 'query':
        triggerHapticFeedback('light');
        voicePrefs.trackAction('query');
        // Query responses are already in the message
        // But also trigger highlights if the message mentions UI elements
        if (isHighlightEnabled && action.message) {
          const queryHighlights = detectHighlightTargets(action.message, language as 'es' | 'en');
          if (queryHighlights.length > 0) {
            setTimeout(() => highlight(queryHighlights), 1500);
          }
        }
        break;
        
      case 'highlight':
        if (action.target && isHighlightEnabled) {
          highlight([{ selector: action.target }]);
        }
        break;

      case 'highlight_ui': {
        const elements = (action.data?.elements as string[]) || [];
        
        // Navigate first if needed
        if (action.route) {
          triggerHapticFeedback('medium');
          navigate(action.route);
        }
        
        // Then highlight the elements after a delay for page render
        if (elements.length > 0 && isHighlightEnabled) {
          const highlightDelay = action.route ? 1200 : 300;
          setTimeout(() => {
            highlight(elements.map(el => ({ selector: el })));
          }, highlightDelay);
        }
        break;
      }
        
      case 'both':
        // Navigate + explain (for tutorial-like requests)
        const bothRoute = action.route || (action.target ? ROUTE_MAP[action.target] : null);
        if (bothRoute) {
          triggerHapticFeedback('medium');
          voicePrefs.trackAction('navigation');
          navigate(bothRoute);
          toast.success(action.message);
          
          if (isHighlightEnabled) {
            setTimeout(() => {
              const navHighlights = getNavigationHighlights(bothRoute, language as 'es' | 'en');
              if (navHighlights.length > 0) {
                highlight(navHighlights);
              }
            }, 1200);
          }
        }
        break;

      case 'run_tutorial': {
        const tutorialId = action.data?.tutorialId as string;
        if (tutorialId) {
          // Normalize ID format: backend sends "add_expense", tutorials use "add-expense"
          const normalizedId = tutorialId.replace(/_/g, '-');
          const tutorial = findTutorial(normalizedId) || findTutorial(tutorialId);
          
          // GUARD: If this exact tutorial is already active, don't re-trigger it
          if (tutorial && (activeTutorial === tutorial.id || activeTutorial === normalizedId)) {
            console.log('[Tutorial] Already active, skipping re-trigger:', tutorial.id);
            // Instead of repeating, send a helpful follow-up message
            const followUpMsg: Message = { 
              role: 'assistant', 
              content: language === 'es' 
                ? '¡Ya tienes el tutorial activo! 👆 Sigue los pasos que te mostré arriba. Si necesitas que te explique algo específico, pregúntame directamente.' 
                : 'The tutorial is already active! 👆 Follow the steps I showed you above. If you need help with something specific, just ask.'
            };
            setMessages(prev => [...prev, followUpMsg]);
            break;
          }
          
          if (tutorial) {
            triggerHapticFeedback('medium');
            setActiveTutorial(tutorial.id);
            setCurrentTutorialStep(0);
            
            // Format tutorial steps and inject as chat message so user actually SEES the content
            const tutorialContent = formatTutorialForSpeech(tutorial);
            const tutorialMsg: Message = { role: 'assistant', content: tutorialContent };
            setMessages(prev => [...prev, tutorialMsg]);
            
            // Navigate to the relevant section if the tutorial has a route action
            const firstStepAction = tutorial.steps?.[0]?.action;
            if (firstStepAction && firstStepAction.startsWith('/')) {
              navigate(firstStepAction);
            }
            
            toast.success(language === 'es' ? '📚 Tutorial iniciado' : '📚 Tutorial started');
          } else {
            // Fallback: navigate to related section
            const routeMap: Record<string, string> = {
              'capture-expense': '/expenses',
              'add_expense': '/expenses',
              'add-expense': '/expenses',
              'add_income': '/income',
              'add-income': '/income',
              'upload_receipt': '/expenses',
              'use_ocr': '/expenses',
              'track_mileage': '/mileage',
            };
            const fallbackRoute = routeMap[tutorialId] || routeMap[normalizedId];
            if (fallbackRoute) {
              navigate(fallbackRoute);
              toast.success(action.message || (language === 'es' ? 'Te llevo a la sección' : 'Taking you there'));
            }
          }
        }
        break;
      }
        
      default:
        console.log('[AI Action] Unknown action type:', action.action);
    }
  }, [navigate, triggerHapticFeedback, voicePrefs, isHighlightEnabled, highlight, language, detectHighlightTargets]);

  const sendMessage = useCallback(async (text: string, skipAddingUserMessage = false) => {
    const trimmedText = text.trim();
    if (!trimmedText || isLoading) return;

    // DEV OVERRIDE: "modo dios" to bypass plan gates (for testing)
    const isGodMode = (() => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('god') === '1') {
          localStorage.setItem('god_mode', 'true');
          return true;
        }
        return localStorage.getItem('god_mode') === 'true';
      } catch {
        return false;
      }
    })();

    // Allow toggling God Mode by chat command
    if (/^(modo dios|god mode)(\s+(on|off))?$/i.test(trimmedText)) {
      const turnOff = /\s+off$/i.test(trimmedText);
      try {
        localStorage.setItem('god_mode', turnOff ? 'false' : 'true');
      } catch {
        // ignore
      }
      const msg = language === 'es'
        ? `Modo dios ${turnOff ? 'desactivado' : 'activado'}.`
        : `God mode ${turnOff ? 'disabled' : 'enabled'}.`;
      setMessages(prev => [...prev, { role: 'user', content: trimmedText }, { role: 'assistant', content: msg }]);
      return;
    }

    // Check voice assistant limit before processing
    if (!isGodMode && !canUseVoice()) {
      const limitMessage = language === 'es'
        ? '🚀 El asistente de voz es una función Pro. Actualiza tu plan para acceder a comandos de voz ilimitados.'
        : '🚀 Voice assistant is a Pro feature. Upgrade your plan for unlimited voice commands.';
      
      setMessages(prev => [...prev, 
        { role: 'user', content: trimmedText },
        { role: 'assistant', content: limitMessage }
      ]);
      
      toast.info(language === 'es' ? 'Función Pro' : 'Pro Feature', {
        description: language === 'es' 
          ? 'Actualiza a Pro para usar el asistente de voz' 
          : 'Upgrade to Pro to use the voice assistant',
        action: {
          label: language === 'es' ? 'Ver planes' : 'View plans',
          onClick: () => navigate('/settings?tab=subscription'),
        },
      });
      return;
    }

    const userMessage: Message = { role: 'user', content: trimmedText };
    if (!skipAddingUserMessage) {
      setMessages(prev => [...prev, userMessage]);
    }
    setInput('');

    // Save to conversation history
    voicePrefs.addToHistory({ role: 'user', content: trimmedText, page: location.pathname });

    const respondLocal = (responseText: string, highlightsPath?: string) => {
      const assistantMessage: Message = { role: 'assistant', content: responseText };
      setMessages(prev => [...prev, assistantMessage]);
      voicePrefs.addToHistory({ role: 'assistant', content: responseText, page: location.pathname });

      if (isHighlightEnabled && highlightsPath) {
        const highlights = getNavigationHighlights(highlightsPath, language as 'es' | 'en');
        if (highlights.length > 0) {
          setTimeout(() => highlight(highlights), 250);
        }
      }

      if (autoSpeak && isVoiceSupported) {
        window.speechSynthesis.cancel();
        voiceControl.speak(responseText);
      }
    };

    // LOCAL GUARANTEE: "qué puedo hacer aquí" must always reflect the REAL current page.
    if (isAskingAboutCurrentPage(trimmedText)) {
      const page = getCurrentPageContext();
      // Send to AI for a rich, contextual response instead of a canned one
      // Only fall back to local if page description is generic
      if (page.pageName !== (language === 'es' ? 'Página actual' : 'Current page')) {
        respondLocal(page.description, location.pathname);
        return;
      }
      // If unknown page, let AI handle it
    }

    // LOCAL ACTION: open a client by name (reliable in continuous voice mode)
    const requestedClientName = parseOpenClientCommand(trimmedText, language as 'es' | 'en');
    if (requestedClientName) {
      const normalize = (s: string) =>
        s
          .toLowerCase()
          .replace(/[.,!?¿¡"“”'’]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const needle = normalize(requestedClientName);
      const target =
        clients?.find(c => normalize(c.name) === needle) ||
        clients?.find(c => normalize(c.name).includes(needle)) ||
        clients?.find(c => needle.includes(normalize(c.name)));

      if (!target) {
        const responseText = language === 'es'
          ? `No encontré un cliente llamado "${requestedClientName}". Dime "muéstrame mis clientes" para ver la lista, o repite el nombre tal como aparece.`
          : `I couldn't find a client named "${requestedClientName}". Say "show my clients" to see the list, or repeat the name as it appears.`;
        respondLocal(responseText, '/clients');
        return;
      }

      const responseText = language === 'es'
        ? `Abriendo el cliente ${target.name}.`
        : `Opening client ${target.name}.`;
      respondLocal(responseText, '/clients');

      navigate('/clients');
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('voice-command-action', {
            detail: { action: 'open-client', clientId: target.id },
          })
        );
      }, 650);

      return;
    }

    setIsLoading(true);

    try {
      // Build comprehensive user context for AI
      const currentPage = getCurrentPageContext();
      const userContext = {
        userName,
        currentRoute: location.pathname,
        currentPageName: currentPage.pageName,
        totalExpenses: stats?.monthlyTotal || 0,
        yearlyExpenses: stats?.totalExpenses || 0,
        totalIncome: monthlyIncome,
        yearlyIncome,
        balance,
        pendingReceipts: stats?.pendingDocs || 0,
        clientCount: clients?.length || 0,
        projectCount: projects?.length || 0,
        biggestExpense: biggestExpense ? {
          amount: Number(biggestExpense.amount),
          vendor: biggestExpense.vendor,
          description: biggestExpense.description,
        } : null,
        topCategory: topCategory ? {
          category: topCategory[0],
          amount: topCategory[1],
        } : null,
        deductibleTotal,
        billableTotal,
        // Currency context for proper monetary responses
        currency: currentCurrency,
        entityName: currentEntity?.name || null,
        isMultiEntity,
        availableCurrencies: activeEntities.map(e => e.default_currency || 'CAD').filter((v, i, a) => a.indexOf(v) === i),
        // User profile data
        workTypes: profile?.work_types || [],
        country: currentEntity?.country || profile?.country || 'CA',
        province: profile?.province,
        // Financial profile for personalization
        financialProfile: financialProfile ? {
          experienceLevel: financialProfile.financial_education_level,
          riskTolerance: financialProfile.risk_tolerance,
          goals: financialProfile.passions,
          interests: financialProfile.interests,
          talents: financialProfile.talents,
          availableCapital: financialProfile.available_capital,
          monthlyInvestmentCapacity: financialProfile.monthly_investment_capacity,
          preferredIncomeType: financialProfile.preferred_income_type,
          timeAvailability: financialProfile.time_availability,
        } : null,
        // Active tutorial context - prevents AI from re-triggering the same tutorial
        activeTutorialId: activeTutorial || null,
      };


      const { data, error } = await supabase.functions.invoke('app-assistant', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userContext,
          language,
        },
      });

      if (error) throw error;

      // Check if AI returned an action
      const aiAction = data.action;
      const allActions = data.actions as any[] | undefined;
      let responseText = '';
      
      if (aiAction && aiAction.message) {
        // AI returned a structured action
        responseText = aiAction.message;
        
        // Set current intent for visual feedback (shows for 3 seconds)
        setCurrentIntent({
          intent: aiAction.intent || null,
          action: aiAction.action || null,
          target: aiAction.target || null,
          showUntil: Date.now() + 3000,
        });
        
        // Handle clarification action specially - store state for follow-up
        if (aiAction.action === 'clarify' && aiAction.options && Array.isArray(aiAction.options)) {
          // Start clarification flow
          conversationState.startClarification(
            trimmedText,
            aiAction.intent || 'unknown',
            aiAction.options.map((opt: { id: string; label: string; action: string; target?: string; route?: string }) => ({
              id: opt.id,
              label: opt.label,
              action: opt.action as 'navigate' | 'explain' | 'both' | 'cancel',
              target: opt.target,
              route: opt.route || (opt.target ? ROUTE_MAP[opt.target] : undefined),
            }))
          );
          console.log('[AI] Started clarification flow with options:', aiAction.options);
        } else {
          // Execute the primary action
          executeAIAction(aiAction);
          
          // Execute additional actions (e.g., highlight_ui after navigate)
          if (allActions && allActions.length > 1) {
            for (const secondaryAction of allActions.slice(1)) {
              if (secondaryAction.action !== aiAction.action) {
                // Delay secondary actions to let primary action (navigation) complete
                setTimeout(() => executeAIAction(secondaryAction), 1500);
              }
            }
          }
        }
      } else {
        // Regular text response (conversational)
        responseText = data.message || (language === 'es' 
          ? 'Lo siento, no pude procesar tu pregunta.' 
          : 'Sorry, I could not process your question.');
        
        // Set conversational intent
        setCurrentIntent({
          intent: 'conversational',
          action: null,
          target: null,
          showUntil: Date.now() + 2000,
        });
      }

      // For run_tutorial, the tutorial content is already added inside executeAIAction
      // so skip adding the vague AI intro message
      if (aiAction?.action !== 'run_tutorial') {
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseText,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      // Save assistant response to history
      voicePrefs.addToHistory({ role: 'assistant', content: responseText, page: location.pathname });
      
      // Add to conversation memory for context
      conversationMemory.addExchange(
        trimmedText,
        responseText,
        aiAction?.intent,
        aiAction?.action
      );

      // Detect and trigger highlights based on response content
      // Now works for BOTH action responses AND text responses
      if (isHighlightEnabled) {
        const detectedHighlights = detectHighlightTargets(responseText, language as 'es' | 'en');
        if (detectedHighlights.length > 0) {
          // Delay more for navigation actions to let page render
          const highlightDelay = aiAction?.action === 'navigate' || aiAction?.action === 'open' ? 2000 : 1500;
          setTimeout(() => {
            highlight(detectedHighlights);
          }, highlightDelay);
        }
      }

      // Auto-speak response if enabled
      if (autoSpeak && isVoiceSupported) {
        window.speechSynthesis.cancel();
        voiceControl.speak(responseText);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorText = language === 'es'
        ? 'Lo siento, ocurrió un error. Por favor intenta de nuevo.'
        : 'Sorry, an error occurred. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: errorText,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, userName, stats, monthlyIncome, yearlyIncome, balance, clients, projects, messages, language, autoSpeak, isVoiceSupported, voiceControl, voicePrefs, location.pathname, isHighlightEnabled, highlight, biggestExpense, topCategory, deductibleTotal, billableTotal, executeAIAction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  // UNIFIED STOP FUNCTION - delegates to voiceControl
  const stopAllVoiceActivity = useCallback(() => {
    voiceControl.stopAll();
  }, [voiceControl]);

  return (
    <>
      {/* Voice Onboarding Tutorial */}
      <VoiceOnboarding
        open={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          localStorage.setItem('evofinz_voice_onboarding_completed', 'true');
        }}
        onSkip={() => {
          setShowOnboarding(false);
          localStorage.setItem('evofinz_voice_onboarding_completed', 'true');
        }}
        isVoiceSupported={isVoiceSupported}
        onTestVoice={(text) => voiceControl.speak(text)}
        onTestMic={() => {
          setIsOnboardingMicTest(true);
          voiceControl.toggleListening();
        }}
        isListening={isListening}
        isSpeaking={isAnySpeaking}
      />

      {/* Floating Voice Indicator removed - Push-to-Talk only */}

      {/* Floating Button - only when chat is fully closed and not in bubble mode */}
      {/* Hidden on mobile to prevent overlapping with bottom nav */}
      {!isMobile && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
            "bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500",
            "transition-all duration-300 hover:scale-110",
            (isOpen || isMinimized || isBubbleMode || isListening || isAnySpeaking) && "hidden"
          )}
          size="icon"
        >
          <PhoenixLogo variant="badge" showEffects={false} className="h-7 w-7" />
        </Button>
      )}

      {/* Compact Bubble Mode - shows pulsating phoenix when auto-minimized during tutorials/navigation */}
      <AnimatePresence>
        {isBubbleMode && (
          <MinimizedAssistantBubble
            onExpand={expandFromBubble}
            isSpeaking={isAnySpeaking}
            isListening={isListening}
            isTutorialActive={!!activeTutorial}
            onStopSpeaking={stopAllVoiceActivity}
            currentText={currentSpeakingText}
          />
        )}
      </AnimatePresence>

      {/* Minimized Assistant View - for manual minimize with more controls */}
      <AnimatePresence>
        {isMinimized && !isBubbleMode && (
          <MinimizedAssistant
            onExpand={() => setIsMinimized(false)}
            isSpeaking={isAnySpeaking}
            isListening={isListening}
            isContinuousMode={false}
            onStopSpeaking={stopAllVoiceActivity}
            onStopContinuous={stopAllVoiceActivity}
            currentText={currentSpeakingText}
          />
        )}
      </AnimatePresence>

      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 w-[460px] max-w-[calc(100vw-48px)]",
          "bg-background border border-border rounded-2xl shadow-2xl",
          "flex flex-col overflow-hidden",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
        style={{ height: 'min(750px, calc(100vh - 80px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <div className="flex items-center gap-3">
              <PhoenixLogo 
                variant="mini" 
                state={isAnySpeaking ? "rebirth" : "auto"} 
                showEffects={isAnySpeaking}
                className={cn(isAnySpeaking && "animate-pulse")}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">
                    {language === 'es' ? 'Asistente Financiero' : 'Financial Assistant'}
                  </h3>
                  {/* Active Language Indicator */}
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 gap-1">
                    {language === 'es' ? '🇪🇸' : '🇬🇧'} {language.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {conversationState.isAwaitingClarification
                    ? (language === 'es' ? '🤔 Esperando tu elección...' : '🤔 Waiting for your choice...')
                    : isListening 
                      ? (language === 'es' ? '🎤 Escuchando...' : '🎤 Listening...')
                      : isAnySpeaking 
                        ? (language === 'es' ? '🔊 Hablando...' : '🔊 Speaking...')
                        : (() => {
                            const currentVoiceName = voiceControl.currentVoiceId 
                              ? voiceControl.elevenLabsTTS.getVoicesForLang(language as 'es' | 'en').female
                                  .concat(voiceControl.elevenLabsTTS.getVoicesForLang(language as 'es' | 'en').male)
                                  .find(v => v.id === voiceControl.currentVoiceId)?.name
                              : null;
                            const voiceLabel = currentVoiceName ? ` · 🎙️ ${currentVoiceName}` : '';
                            return language === 'es' 
                              ? `Hola ${userName}, ¿en qué te ayudo?${voiceLabel}` 
                              : `Hi ${userName}, how can I help?${voiceLabel}`;
                          })()
                  }
                </p>
              </div>
            </div>
            
            {/* Header Actions - Reorganized */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Voice Commands Cheatsheet */}
              {isVoiceSupported && (
                <VoiceCommandsCheatsheet 
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              )}
              
              {/* Voice Settings Popover - Full voice configuration */}
              {isVoiceSupported && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[90vw] sm:w-[480px] sm:max-w-[520px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        {language === 'es' ? 'Configuración de Voz' : 'Voice Settings'}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <VoiceSettingsPanel
                        language={language as 'es' | 'en'}
                        autoSpeak={autoSpeak}
                        onAutoSpeakChange={setAutoSpeak}
                        voicePrefs={voiceControl.voicePrefs}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Stop button - Only show when speaking */}
              {isVoiceSupported && isAnySpeaking && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={stopAllVoiceActivity}
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Square className={cn("h-3.5 w-3.5", isAnySpeaking && "animate-pulse")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {language === 'es' ? 'Detener todo' : 'Stop all'}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Minimize button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsMinimized(true)}
                    className="h-7 w-7"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'es' ? 'Minimizar' : 'Minimize'}
                </TooltipContent>
              </Tooltip>
              
              {/* Close button */}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Microphone Permission Alert */}
          {isVoiceSupported && micPermission.permission === 'denied' && (
            <MicrophonePermissionAlert />
          )}

          {/* Voice Mode Banner */}
          {isVoiceSupported && micPermission.permission !== 'denied' && (
            <div className="px-4 py-2 bg-muted/50 border-b text-xs text-center text-muted-foreground">
              {language === 'es' 
                ? '🎙️ Toca el micrófono para hablar • Ctrl+M'
                : '🎙️ Tap the microphone to speak • Ctrl+M'
              }
            </div>
          )}

          {/* Proactive Alerts Banner */}
          {showAlerts && getProactiveAlerts().length > 0 && (
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                  {getProactiveAlerts()[0].message[language as 'es' | 'en']}
                </span>
                <div className="flex gap-1">
                  {getProactiveAlerts()[0].route && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-amber-700"
                      onClick={() => {
                        navigate(getProactiveAlerts()[0].route!);
                        setShowAlerts(false);
                      }}
                    >
                      {getProactiveAlerts()[0].action?.[language as 'es' | 'en'] || (language === 'es' ? 'Ver' : 'View')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-amber-600"
                    onClick={() => setShowAlerts(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Active Tutorial Indicator */}
          {activeTutorial && currentTutorialStep !== null && (
            <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-blue-700 dark:text-blue-400 flex-1">
                  {language === 'es' ? 'Tutorial en curso' : 'Tutorial in progress'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-blue-700"
                  onClick={() => {
                    setActiveTutorial(null);
                    setCurrentTutorialStep(null);
                  }}
                >
                  {language === 'es' ? 'Cerrar' : 'Close'}
                </Button>
              </div>
            </div>
          )}

          {/* Conversation Context (if there's memory) */}
          <ConversationContext
            exchanges={conversationMemory.memory.exchanges}
            lastTopic={conversationMemory.memory.lastTopic}
            onClearMemory={conversationMemory.clearMemory}
            language={language as 'es' | 'en'}
            isExpanded={false}
            onToggleExpand={() => {}}
          />

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {language === 'es' 
                    ? 'Pregúntame sobre cómo usar la app, gestionar tus finanzas, o cualquier duda que tengas.'
                    : 'Ask me about how to use the app, manage your finances, or any questions you have.'}
                </p>
                
                {/* Smart Suggestions */}
                <SmartSuggestions
                  financialData={{
                    monthlyExpenses,
                    monthlyIncome,
                    balance,
                    pendingReceipts,
                    yearlyExpenses,
                    yearlyIncome,
                    deductibleTotal,
                  }}
                  currentRoute={location.pathname}
                  language={language as 'es' | 'en'}
                  onSuggestionClick={(command) => sendMessage(command)}
                  isVisible={messages.length === 0}
                  recentQueries={[]}
                />
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {language === 'es' ? 'Preguntas frecuentes' : 'Common questions'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickQuestions.map((q, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 transition-colors py-2 px-3"
                        onClick={() => handleQuickQuestion(q.text)}
                      >
                        <q.icon className="h-3 w-3 mr-1.5" />
                        {q.text}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Personalized frequent actions */}
                {frequentActions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      {language === 'es' ? 'Tus acciones frecuentes' : 'Your frequent actions'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {frequentActions.map((action, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary/20 transition-colors py-2 px-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10"
                          onClick={() => navigate(action.info.route)}
                        >
                          <action.info.icon className="h-3 w-3 mr-1.5 text-amber-600" />
                          {action.info.name[language as 'es' | 'en']}
                          <span className="ml-1.5 text-[10px] text-muted-foreground">
                            ({action.count}x)
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {/* Play button for assistant messages - SIMPLIFIED: always uses unified speak */}
                      {msg.role === 'assistant' && isVoiceSupported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isAnySpeaking) {
                              voiceControl.stopAll();
                            } else {
                              voiceControl.speak(msg.content);
                            }
                          }}
                          className="h-6 px-2 mt-1 text-xs opacity-70 hover:opacity-100"
                        >
                          {isAnySpeaking ? (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Detener' : 'Stop'}
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Escuchar' : 'Listen'}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <TypingIndicator isVisible variant="wave" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Karaoke Text Display - shows when speaking with sentence highlighting */}
          {isAnySpeaking && currentSpeakingText && (
            <KaraokeText
              text={currentSpeakingText}
              currentSentenceIndex={currentSentenceIndex}
              isPlaying={isAnySpeaking}
              isPaused={isSpeechPaused}
              onPause={voiceControl.pauseSpeech}
              onResume={voiceControl.resumeSpeech}
              onStop={voiceControl.stopAll}
              className="mx-4 mb-2"
            />
          )}

          {/* Spotify-style controls removed - unified voice control handles everything */}

          {/* Recording Controls */}
          {isListening && (
            <div className={cn(
              "px-4 py-3 border-t",
              isAnySpeaking ? "bg-primary/10" : "bg-red-500/10"
            )}>
              <div className="flex items-center gap-3">
                <AudioLevelIndicator 
                  isListening={isListening && !isAnySpeaking} 
                  variant="bars"
                  className="w-8"
                />
                <span className={cn(
                  "text-sm font-medium flex-1",
                  isAnySpeaking ? "text-primary" : "text-red-600 dark:text-red-400"
                )}>
                  {isProcessingVoice 
                    ? (language === 'es' ? '⏳ Procesando...' : '⏳ Processing...')
                    : isAnySpeaking 
                      ? (language === 'es' ? '🔊 Hablando...' : '🔊 Speaking...')
                      : (language === 'es' ? 'Grabando' : 'Recording')
                  }: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
                <Button
                  variant={isAnySpeaking ? "secondary" : "destructive"}
                  size="sm"
                  onClick={stopAllVoiceActivity}
                  className="h-8"
                >
                  <Square className="h-3 w-3 mr-1.5" />
                  {language === 'es' ? 'Detener' : 'Stop'}
                </Button>
              </div>
            </div>
          )}

          {/* Intent Feedback - visual indicator of what AI detected */}
          <div className="px-3">
            <IntentFeedback
              intent={currentIntent.intent}
              action={currentIntent.action}
              target={currentIntent.target}
              isVisible={Date.now() < currentIntent.showUntil}
              language={language as 'es' | 'en'}
            />
          </div>

          {/* Clarification Indicator - shows when AI asked for options */}
          <ClarificationIndicator
            isVisible={conversationState.isAwaitingClarification}
            options={conversationState.context?.options || []}
            remainingSeconds={conversationState.remainingSeconds}
            language={language as 'es' | 'en'}
            onOptionClick={(option) => {
              // Handle option click as if user spoke it
              const response = language === 'es' ? 'Entendido' : 'Got it';
              const msg: Message = { role: 'assistant', content: response };
              setMessages(prev => [...prev, msg]);
              voiceControl.speak(response);
              
              // Execute the action
              if (option.action === 'navigate' || option.action === 'both') {
                if (option.route) {
                  triggerHapticFeedback('medium');
                  navigate(option.route);
                  toast.success(language === 'es' ? 'Navegando...' : 'Navigating...');
                  setTimeout(() => autoMinimizeToBubble(), 800);
                }
              }
              if (option.action === 'explain' || option.action === 'both') {
                if (option.target) {
                  const tutorial = findTutorial(option.target);
                  if (tutorial) {
                    setActiveTutorial(tutorial.id);
                    setCurrentTutorialStep(0);
                    const tutorialResponse = formatTutorialForSpeech(tutorial);
                    const tutorialMsg: Message = { role: 'assistant', content: tutorialResponse };
                    setMessages(prev => [...prev, tutorialMsg]);
                    voiceControl.speak(tutorialResponse);
                  }
                }
              }
              conversationState.reset();
              voicePrefs.playSound('success');
            }}
            onCancel={() => {
              conversationState.reset();
              const cancelMsg: Message = { 
                role: 'assistant', 
                content: language === 'es' ? 'Cancelado. ¿En qué más puedo ayudarte?' : 'Cancelled. How else can I help?' 
              };
              setMessages(prev => [...prev, cancelMsg]);
              voiceControl.speak(cancelMsg.content);
            }}
            onQuickResponse={(value) => {
              // Process quick response chip click as if user spoke it
              const result = conversationState.processClarificationResponse(value, language as 'es' | 'en');
              if (result.matched && result.option) {
                const option = result.option;
                if (option.action === 'cancel') {
                  const cancelMsg: Message = { 
                    role: 'assistant', 
                    content: language === 'es' ? 'Cancelado.' : 'Cancelled.' 
                  };
                  setMessages(prev => [...prev, cancelMsg]);
                } else {
                  // Execute the action
                  if (option.action === 'navigate' || option.action === 'both') {
                    if (option.route) {
                      triggerHapticFeedback('medium');
                      navigate(option.route);
                      toast.success(language === 'es' ? 'Navegando...' : 'Navigating...');
                      setTimeout(() => autoMinimizeToBubble(), 800);
                    }
                  }
                  if (option.action === 'explain' || option.action === 'both') {
                    if (option.target) {
                      const tutorial = findTutorial(option.target);
                      if (tutorial) {
                        setActiveTutorial(tutorial.id);
                        setCurrentTutorialStep(0);
                      }
                    }
                  }
                  voicePrefs.playSound('success');
                }
              } else if (result.fallbackMessage) {
                const fallbackMsg: Message = { role: 'assistant', content: result.fallbackMessage };
                setMessages(prev => [...prev, fallbackMsg]);
                voiceControl.speak(result.fallbackMessage);
              }
            }}
          />

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-background/50">
            <div className="flex gap-2">
              {/* Voice input button */}
              {isVoiceSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={isListening ? "default" : "outline"}
                      size="icon"
                      onClick={voiceControl.handleMicClick}
                      disabled={isLoading}
                      className={cn(
                        "flex-shrink-0 transition-all",
                        isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
                      )}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isListening 
                      ? (language === 'es' ? 'Detener grabación' : 'Stop recording')
                      : (language === 'es' ? 'Hablar' : 'Speak')
                    }
                  </TooltipContent>
                </Tooltip>
              )}
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isAnySpeaking
                    ? (language === 'es' ? 'El asistente está hablando...' : 'Assistant is speaking...')
                    : isListening 
                      ? (language === 'es' ? 'Escuchando...' : 'Listening...')
                      : (language === 'es' ? 'Escribe o habla tu pregunta...' : 'Type or speak your question...')
                }
                disabled={isLoading}
                className={cn(
                  "flex-1",
                  isListening && "border-red-500 bg-red-50 dark:bg-red-950/20",
                  isAnySpeaking && "border-primary bg-primary/5"
                )}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
