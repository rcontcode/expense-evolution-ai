import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, HelpCircle, Target, Lightbulb, Mic, MicOff, Volume2, VolumeX, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceAssistant } from '@/hooks/utils/useVoiceAssistant';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = {
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

// Voice navigation commands
const VOICE_COMMANDS = {
  es: [
    { patterns: ['ir a gastos', 'gastos', 'ver gastos', 'mostrar gastos', 'abrir gastos'], route: '/expenses', name: 'Gastos' },
    { patterns: ['ir a ingresos', 'ingresos', 'ver ingresos', 'mostrar ingresos'], route: '/income', name: 'Ingresos' },
    { patterns: ['ir a clientes', 'clientes', 'ver clientes', 'mostrar clientes'], route: '/clients', name: 'Clientes' },
    { patterns: ['ir a proyectos', 'proyectos', 'ver proyectos'], route: '/projects', name: 'Proyectos' },
    { patterns: ['ir a contratos', 'contratos', 'ver contratos'], route: '/contracts', name: 'Contratos' },
    { patterns: ['ir al dashboard', 'dashboard', 'inicio', 'ir al inicio', 'panel'], route: '/dashboard', name: 'Dashboard' },
    { patterns: ['ir a kilometraje', 'kilometraje', 'millas', 'kilómetros'], route: '/mileage', name: 'Kilometraje' },
    { patterns: ['ir a patrimonio', 'patrimonio', 'patrimonio neto', 'net worth'], route: '/net-worth', name: 'Patrimonio' },
    { patterns: ['ir a banca', 'banca', 'banco', 'transacciones bancarias'], route: '/banking', name: 'Banca' },
    { patterns: ['ir a configuración', 'configuración', 'ajustes', 'settings'], route: '/settings', name: 'Configuración' },
    { patterns: ['capturar', 'capturar gasto', 'tomar foto', 'escanear recibo'], route: '/capture', name: 'Captura Rápida' },
    { patterns: ['agregar gasto', 'nuevo gasto', 'añadir gasto'], route: '/expenses', action: 'add-expense', name: 'Agregar Gasto' },
    { patterns: ['agregar ingreso', 'nuevo ingreso', 'añadir ingreso'], route: '/income', action: 'add-income', name: 'Agregar Ingreso' },
    { patterns: ['agregar cliente', 'nuevo cliente'], route: '/clients', action: 'add-client', name: 'Agregar Cliente' },
    { patterns: ['bandeja', 'bandeja de caos', 'revisar recibos', 'chaos inbox'], route: '/chaos-inbox', name: 'Bandeja de Caos' },
    { patterns: ['reconciliación', 'reconciliar', 'conciliación'], route: '/reconciliation', name: 'Reconciliación' },
    { patterns: ['perfil de negocio', 'perfil empresarial', 'mi negocio'], route: '/business-profile', name: 'Perfil de Negocio' },
    { patterns: ['notificaciones', 'alertas', 'ver notificaciones'], route: '/notifications', name: 'Notificaciones' },
  ],
  en: [
    { patterns: ['go to expenses', 'expenses', 'show expenses', 'open expenses'], route: '/expenses', name: 'Expenses' },
    { patterns: ['go to income', 'income', 'show income'], route: '/income', name: 'Income' },
    { patterns: ['go to clients', 'clients', 'show clients'], route: '/clients', name: 'Clients' },
    { patterns: ['go to projects', 'projects', 'show projects'], route: '/projects', name: 'Projects' },
    { patterns: ['go to contracts', 'contracts', 'show contracts'], route: '/contracts', name: 'Contracts' },
    { patterns: ['go to dashboard', 'dashboard', 'home', 'go home'], route: '/dashboard', name: 'Dashboard' },
    { patterns: ['go to mileage', 'mileage', 'miles', 'kilometers'], route: '/mileage', name: 'Mileage' },
    { patterns: ['go to net worth', 'net worth', 'wealth', 'assets'], route: '/net-worth', name: 'Net Worth' },
    { patterns: ['go to banking', 'banking', 'bank', 'bank transactions'], route: '/banking', name: 'Banking' },
    { patterns: ['go to settings', 'settings', 'configuration'], route: '/settings', name: 'Settings' },
    { patterns: ['capture', 'capture expense', 'take photo', 'scan receipt'], route: '/capture', name: 'Quick Capture' },
    { patterns: ['add expense', 'new expense', 'create expense'], route: '/expenses', action: 'add-expense', name: 'Add Expense' },
    { patterns: ['add income', 'new income', 'create income'], route: '/income', action: 'add-income', name: 'Add Income' },
    { patterns: ['add client', 'new client', 'create client'], route: '/clients', action: 'add-client', name: 'Add Client' },
    { patterns: ['inbox', 'chaos inbox', 'review receipts'], route: '/chaos-inbox', name: 'Chaos Inbox' },
    { patterns: ['reconciliation', 'reconcile', 'bank reconciliation'], route: '/reconciliation', name: 'Reconciliation' },
    { patterns: ['business profile', 'my business'], route: '/business-profile', name: 'Business Profile' },
    { patterns: ['notifications', 'alerts', 'show notifications'], route: '/notifications', name: 'Notifications' },
  ],
};

// Voice query commands (return data directly)
type QueryType = 'expenses_month' | 'expenses_year' | 'income_month' | 'income_year' | 'balance' | 'client_count' | 'project_count' | 'pending_receipts';

interface VoiceQuery {
  patterns: string[];
  queryType: QueryType;
}

const VOICE_QUERIES: { es: VoiceQuery[]; en: VoiceQuery[] } = {
  es: [
    { patterns: ['cuánto gasté este mes', 'gastos del mes', 'gastos este mes', 'cuánto he gastado este mes'], queryType: 'expenses_month' },
    { patterns: ['cuánto gasté este año', 'gastos del año', 'gastos este año', 'cuánto he gastado este año'], queryType: 'expenses_year' },
    { patterns: ['cuánto gané este mes', 'ingresos del mes', 'ingresos este mes'], queryType: 'income_month' },
    { patterns: ['cuánto gané este año', 'ingresos del año', 'ingresos este año'], queryType: 'income_year' },
    { patterns: ['mostrar balance', 'cuál es mi balance', 'mi balance', 'balance actual', 'cómo estoy financieramente'], queryType: 'balance' },
    { patterns: ['cuántos clientes tengo', 'número de clientes', 'total de clientes', 'mis clientes'], queryType: 'client_count' },
    { patterns: ['cuántos proyectos tengo', 'número de proyectos', 'total de proyectos', 'mis proyectos'], queryType: 'project_count' },
    { patterns: ['recibos pendientes', 'cuántos recibos pendientes', 'pendientes de revisar'], queryType: 'pending_receipts' },
  ],
  en: [
    { patterns: ['how much did i spend this month', 'monthly expenses', 'expenses this month', 'spending this month'], queryType: 'expenses_month' },
    { patterns: ['how much did i spend this year', 'yearly expenses', 'expenses this year', 'spending this year'], queryType: 'expenses_year' },
    { patterns: ['how much did i earn this month', 'monthly income', 'income this month'], queryType: 'income_month' },
    { patterns: ['how much did i earn this year', 'yearly income', 'income this year'], queryType: 'income_year' },
    { patterns: ['show balance', 'what is my balance', 'my balance', 'current balance', 'how am i doing financially'], queryType: 'balance' },
    { patterns: ['how many clients do i have', 'number of clients', 'total clients', 'my clients count'], queryType: 'client_count' },
    { patterns: ['how many projects do i have', 'number of projects', 'total projects', 'my projects count'], queryType: 'project_count' },
    { patterns: ['pending receipts', 'how many pending receipts', 'receipts to review'], queryType: 'pending_receipts' },
  ],
};

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats } = useDashboardStats();
  const { data: incomeData } = useIncome();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { language } = useLanguage();

  // Calculate financial data for queries
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = stats?.monthlyTotal || 0;
  const yearlyExpenses = stats?.totalExpenses || 0; // Using totalExpenses as yearly approximation
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

  const userName = profile?.full_name?.split(' ')[0] || 'Usuario';
  const quickQuestions = QUICK_QUESTIONS[language as keyof typeof QUICK_QUESTIONS] || QUICK_QUESTIONS.es;

  // Check if text matches a voice query command
  const checkVoiceQuery = useCallback((text: string): { matched: boolean; queryType?: QueryType } => {
    const normalizedText = text.toLowerCase().trim();
    const queries = VOICE_QUERIES[language as keyof typeof VOICE_QUERIES] || VOICE_QUERIES.es;
    
    for (const query of queries) {
      for (const pattern of query.patterns) {
        if (normalizedText.includes(pattern)) {
          return { matched: true, queryType: query.queryType };
        }
      }
    }
    return { matched: false };
  }, [language]);

  // Generate response for voice query
  const getQueryResponse = useCallback((queryType: QueryType): string => {
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    
    const responses: Record<QueryType, { es: string; en: string }> = {
      expenses_month: {
        es: `Este mes has gastado ${formatCurrency(monthlyExpenses)}.`,
        en: `This month you've spent ${formatCurrency(monthlyExpenses)}.`,
      },
      expenses_year: {
        es: `Este año has gastado ${formatCurrency(yearlyExpenses)} en total.`,
        en: `This year you've spent ${formatCurrency(yearlyExpenses)} in total.`,
      },
      income_month: {
        es: `Este mes has ingresado ${formatCurrency(monthlyIncome)}.`,
        en: `This month you've earned ${formatCurrency(monthlyIncome)}.`,
      },
      income_year: {
        es: `Este año has ingresado ${formatCurrency(yearlyIncome)} en total.`,
        en: `This year you've earned ${formatCurrency(yearlyIncome)} in total.`,
      },
      balance: {
        es: balance >= 0 
          ? `Tu balance anual es positivo: ${formatCurrency(balance)}. ¡Vas bien!`
          : `Tu balance anual es negativo: ${formatCurrency(Math.abs(balance))}. Considera revisar tus gastos.`,
        en: balance >= 0
          ? `Your yearly balance is positive: ${formatCurrency(balance)}. You're doing great!`
          : `Your yearly balance is negative: ${formatCurrency(Math.abs(balance))}. Consider reviewing your expenses.`,
      },
      client_count: {
        es: clients?.length === 1 
          ? `Tienes 1 cliente registrado.`
          : `Tienes ${clients?.length || 0} clientes registrados.`,
        en: clients?.length === 1
          ? `You have 1 registered client.`
          : `You have ${clients?.length || 0} registered clients.`,
      },
      project_count: {
        es: projects?.length === 1
          ? `Tienes 1 proyecto activo.`
          : `Tienes ${projects?.length || 0} proyectos registrados.`,
        en: projects?.length === 1
          ? `You have 1 active project.`
          : `You have ${projects?.length || 0} registered projects.`,
      },
      pending_receipts: {
        es: pendingReceipts === 0
          ? `No tienes recibos pendientes de revisar. ¡Todo al día!`
          : pendingReceipts === 1
            ? `Tienes 1 recibo pendiente de revisar.`
            : `Tienes ${pendingReceipts} recibos pendientes de revisar.`,
        en: pendingReceipts === 0
          ? `You have no pending receipts to review. All caught up!`
          : pendingReceipts === 1
            ? `You have 1 pending receipt to review.`
            : `You have ${pendingReceipts} pending receipts to review.`,
      },
    };

    return responses[queryType][language as 'es' | 'en'] || responses[queryType].es;
  }, [monthlyExpenses, yearlyExpenses, monthlyIncome, yearlyIncome, balance, clients?.length, projects?.length, pendingReceipts, language]);

  // Check if text matches a voice command
  const checkVoiceCommand = useCallback((text: string): { matched: boolean; route?: string; name?: string; action?: string } => {
    const normalizedText = text.toLowerCase().trim();
    const commands = VOICE_COMMANDS[language as keyof typeof VOICE_COMMANDS] || VOICE_COMMANDS.es;
    
    for (const command of commands) {
      for (const pattern of command.patterns) {
        if (normalizedText.includes(pattern)) {
          return { matched: true, route: command.route, name: command.name, action: command.action };
        }
      }
    }
    return { matched: false };
  }, [language]);

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

  // Voice assistant hook
  const {
    isListening,
    isContinuousMode,
    isSpeaking,
    isSupported: isVoiceSupported,
    transcript,
    toggleListening,
    startContinuousListening,
    stopContinuousListening,
    speak,
    stopSpeaking,
  } = useVoiceAssistant({
    onTranscript: (text) => {
      // First check if it's a data query command
      const query = checkVoiceQuery(text);
      if (query.matched && query.queryType) {
        setInput('');
        const response = getQueryResponse(query.queryType);
        
        // Add to chat messages
        const userMessage: Message = { role: 'user', content: text };
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        // Speak the response
        speak(response);
        return;
      }
      
      // Then check if it's a navigation command
      const command = checkVoiceCommand(text);
      if (command.matched && command.route && command.name) {
        setInput('');
        const confirmMsg = language === 'es' 
          ? `Entendido. Navegando a ${command.name}.`
          : `Got it. Navigating to ${command.name}.`;
        speak(confirmMsg);
        executeVoiceCommand(command.route, command.name, command.action);
        return;
      }
      
      // Otherwise, send as a chat message
      setInput('');
      sendMessage(text);
    },
    onContinuousStopped: () => {
      // Notify user that continuous mode was stopped by voice
      const msg = language === 'es' 
        ? 'Modo continuo desactivado por comando de voz.'
        : 'Continuous mode stopped by voice command.';
      speak(msg);
    },
  });

  // Update input with live transcript
  useEffect(() => {
    if (transcript && isListening) {
      setInput(transcript);
    }
  }, [transcript, isListening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const userContext = {
        userName,
        totalExpenses: stats?.monthlyTotal || 0,
        totalIncome,
        pendingReceipts: stats?.pendingDocs || 0,
        clientCount: clients?.length || 0,
        projectCount: projects?.length || 0,
      };

      const { data, error } = await supabase.functions.invoke('app-assistant', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userContext,
        },
      });

      if (error) throw error;

      const responseText = data.message || (language === 'es' 
        ? 'Lo siento, no pude procesar tu pregunta.' 
        : 'Sorry, I could not process your question.');

      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-speak response if enabled
      if (autoSpeak && isVoiceSupported) {
        speak(responseText);
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
  }, [isLoading, userName, stats, totalIncome, clients, projects, messages, language, autoSpeak, isVoiceSupported, speak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleMicClick = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    if (isContinuousMode) {
      stopContinuousListening();
    } else {
      toggleListening();
    }
  };

  const handleContinuousModeToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    if (isContinuousMode) {
      stopContinuousListening();
    } else {
      startContinuousListening();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 hover:scale-110",
          isOpen && "hidden"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)]",
          "bg-background border border-border rounded-2xl shadow-2xl",
          "flex flex-col overflow-hidden",
          "animate-in slide-in-from-bottom-4 fade-in duration-300"
        )}
        style={{ height: 'min(600px, calc(100vh - 100px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                isSpeaking ? "bg-primary animate-pulse" : "bg-primary/10"
              )}>
                <Sparkles className={cn(
                  "h-5 w-5",
                  isSpeaking ? "text-primary-foreground" : "text-primary"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {language === 'es' ? 'Asistente Financiero' : 'Financial Assistant'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isContinuousMode
                    ? (language === 'es' ? '🎙️ Modo continuo activo - di "detener" para parar' : '🎙️ Continuous mode - say "stop" to end')
                    : isListening 
                      ? (language === 'es' ? '🎤 Escuchando...' : '🎤 Listening...')
                      : isSpeaking 
                        ? (language === 'es' ? '🔊 Hablando...' : '🔊 Speaking...')
                        : (language === 'es' ? `Hola ${userName}, ¿en qué te ayudo?` : `Hi ${userName}, how can I help?`)
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Continuous mode toggle */}
              {isVoiceSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleContinuousModeToggle}
                      className={cn(
                        "h-8 w-8",
                        isContinuousMode && "text-green-500 bg-green-500/10"
                      )}
                    >
                      <Radio className={cn("h-4 w-4", isContinuousMode && "animate-pulse")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isContinuousMode 
                      ? (language === 'es' ? 'Desactivar modo continuo' : 'Disable continuous mode')
                      : (language === 'es' ? 'Modo continuo (manos libres)' : 'Continuous mode (hands-free)')
                    }
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Auto-speak toggle */}
              {isVoiceSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setAutoSpeak(!autoSpeak);
                        if (isSpeaking) stopSpeaking();
                      }}
                      className={cn(
                        "h-8 w-8",
                        autoSpeak && "text-primary"
                      )}
                    >
                      {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {autoSpeak 
                      ? (language === 'es' ? 'Desactivar voz' : 'Disable voice')
                      : (language === 'es' ? 'Activar voz' : 'Enable voice')
                    }
                  </TooltipContent>
                </Tooltip>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Voice Mode Banner */}
          {isVoiceSupported && isContinuousMode && (
            <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 text-xs text-center text-green-700 dark:text-green-400">
              {language === 'es' 
                ? '🎙️ Modo continuo: habla naturalmente. Di "detener", "parar" o "stop" para desactivar.'
                : '🎙️ Continuous mode: speak naturally. Say "stop", "pause" or "quit" to disable.'
              }
            </div>
          )}

          {/* Voice Mode Banner - Normal */}
          {isVoiceSupported && !isContinuousMode && (
            <div className="px-4 py-2 bg-muted/50 border-b text-xs text-center text-muted-foreground">
              {language === 'es' 
                ? '🎙️ Toca el micrófono para hablar o activa el modo continuo (📻)'
                : '🎙️ Tap the microphone to speak or enable continuous mode (📻)'
              }
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  {language === 'es' 
                    ? 'Pregúntame sobre cómo usar la app, gestionar tus finanzas, o cualquier duda que tengas.'
                    : 'Ask me about how to use the app, manage your finances, or any questions you have.'}
                </p>
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
                      {/* Play button for assistant messages */}
                      {msg.role === 'assistant' && isVoiceSupported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isSpeaking) {
                              stopSpeaking();
                            } else {
                              speak(msg.content);
                            }
                          }}
                          className="h-6 px-2 mt-1 text-xs opacity-70 hover:opacity-100"
                        >
                          {isSpeaking ? <VolumeX className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                          {isSpeaking 
                            ? (language === 'es' ? 'Detener' : 'Stop')
                            : (language === 'es' ? 'Escuchar' : 'Listen')
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

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
                      onClick={handleMicClick}
                      disabled={isLoading}
                      className={cn(
                        "flex-shrink-0 transition-all",
                        isContinuousMode && "bg-green-500 hover:bg-green-600 text-white",
                        isListening && !isContinuousMode && "bg-red-500 hover:bg-red-600 animate-pulse"
                      )}
                    >
                      {isContinuousMode ? <Radio className="h-4 w-4" /> : isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isContinuousMode 
                      ? (language === 'es' ? 'Detener modo continuo' : 'Stop continuous mode')
                      : isListening 
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
                  isListening 
                    ? (language === 'es' ? 'Escuchando...' : 'Listening...')
                    : (language === 'es' ? 'Escribe o habla tu pregunta...' : 'Type or speak your question...')
                }
                disabled={isLoading}
                className={cn(
                  "flex-1",
                  isListening && "border-red-500 bg-red-50 dark:bg-red-950/20"
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
