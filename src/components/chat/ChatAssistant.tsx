import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Sparkles, HelpCircle, Target, Lightbulb, Mic, MicOff, Volume2, VolumeX, Radio, Play, Pause, RotateCcw, RotateCw, Square, AlertTriangle, BookOpen, Settings, Volume1 } from 'lucide-react';
import { PhoenixLogo } from '@/components/ui/phoenix-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/data/useProfile';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useIncome, useCreateIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useExpenses, useCreateExpense } from '@/hooks/data/useExpenses';
import { KaraokeText } from './KaraokeText';

import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceAssistant } from '@/hooks/utils/useVoiceAssistant';
import { useAudioPlayback } from '@/hooks/utils/useAudioPlayback';
import { useSmartGuidance } from '@/hooks/utils/useSmartGuidance';
import { useVoicePreferences } from '@/hooks/utils/useVoicePreferences';
import { useVoiceConfirmation } from '@/hooks/utils/useVoiceConfirmation';
import { useLanguageDetection } from '@/hooks/utils/useLanguageDetection';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ExpenseCategory } from '@/types/expense.types';
import { IncomeType } from '@/types/income.types';

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
    { patterns: ['ir a gastos', 'gastos', 'ver gastos', 'mostrar gastos', 'abrir gastos', 'llévame a gastos', 'llevame a gastos', 'quiero ver gastos', 'abre gastos', 'muéstrame gastos', 'muestrame gastos'], route: '/expenses', name: 'Gastos' },
    { patterns: ['ir a ingresos', 'ingresos', 'ver ingresos', 'mostrar ingresos', 'llévame a ingresos', 'llevame a ingresos', 'quiero ver ingresos', 'abre ingresos', 'muéstrame ingresos'], route: '/income', name: 'Ingresos' },
    { patterns: ['ir a clientes', 'clientes', 'ver clientes', 'mostrar clientes', 'llévame a clientes', 'llevame a clientes', 'quiero ver clientes', 'abre clientes', 'muéstrame clientes'], route: '/clients', name: 'Clientes' },
    { patterns: ['ir a proyectos', 'proyectos', 'ver proyectos', 'llévame a proyectos', 'llevame a proyectos', 'quiero ver proyectos', 'abre proyectos', 'muéstrame proyectos', 'muestrame proyectos'], route: '/projects', name: 'Proyectos' },
    { patterns: ['ir a contratos', 'contratos', 'ver contratos', 'llévame a contratos', 'llevame a contratos', 'quiero ver contratos', 'abre contratos'], route: '/contracts', name: 'Contratos' },
    { patterns: ['ir al dashboard', 'dashboard', 'inicio', 'ir al inicio', 'panel', 'llévame al inicio', 'llevame al inicio', 'quiero ir al inicio', 'abre el dashboard', 'página principal'], route: '/dashboard', name: 'Dashboard' },
    { patterns: ['ir a kilometraje', 'kilometraje', 'millas', 'kilómetros', 'llévame a kilometraje', 'llevame a kilometraje', 'ver kilometraje'], route: '/mileage', name: 'Kilometraje' },
    { patterns: ['ir a patrimonio', 'patrimonio', 'patrimonio neto', 'net worth', 'llévame a patrimonio', 'llevame a patrimonio', 'quiero ver patrimonio', 'mis activos'], route: '/net-worth', name: 'Patrimonio' },
    { patterns: ['ir a banca', 'banca', 'banco', 'transacciones bancarias', 'llévame a banca', 'llevame a banca', 'análisis bancario'], route: '/banking', name: 'Banca' },
    { patterns: ['ir a configuración', 'configuración', 'ajustes', 'settings', 'llévame a configuración', 'llevame a configuración', 'quiero configurar'], route: '/settings', name: 'Configuración' },
    { patterns: ['capturar', 'capturar gasto', 'tomar foto', 'escanear recibo', 'quiero capturar', 'escanea un recibo'], route: '/capture', name: 'Captura Rápida' },
    { patterns: ['agregar gasto', 'nuevo gasto', 'añadir gasto', 'quiero agregar un gasto', 'registrar gasto'], route: '/expenses', action: 'add-expense', name: 'Agregar Gasto' },
    { patterns: ['agregar ingreso', 'nuevo ingreso', 'añadir ingreso', 'quiero agregar un ingreso', 'registrar ingreso'], route: '/income', action: 'add-income', name: 'Agregar Ingreso' },
    { patterns: ['agregar cliente', 'nuevo cliente', 'quiero agregar un cliente', 'registrar cliente'], route: '/clients', action: 'add-client', name: 'Agregar Cliente' },
    { patterns: ['bandeja', 'bandeja de caos', 'revisar recibos', 'chaos inbox', 'recibos pendientes'], route: '/chaos-inbox', name: 'Bandeja de Caos' },
    { patterns: ['reconciliación', 'reconciliar', 'conciliación', 'conciliar cuentas'], route: '/reconciliation', name: 'Reconciliación' },
    { patterns: ['perfil de negocio', 'perfil empresarial', 'mi negocio', 'datos del negocio'], route: '/business-profile', name: 'Perfil de Negocio' },
    { patterns: ['notificaciones', 'alertas', 'ver notificaciones', 'mis alertas'], route: '/notifications', name: 'Notificaciones' },
    { patterns: ['mentoría', 'mentoria', 'ir a mentoría', 'educación financiera', 'aprender finanzas'], route: '/mentorship', name: 'Mentoría' },
    { patterns: ['impuestos', 'calendario fiscal', 'ir a impuestos', 'ver impuestos', 'fechas de impuestos'], route: '/tax-calendar', name: 'Calendario Fiscal' },
  ],
  en: [
    { patterns: ['go to expenses', 'expenses', 'show expenses', 'open expenses', 'take me to expenses', 'i want to see expenses', 'show me expenses'], route: '/expenses', name: 'Expenses' },
    { patterns: ['go to income', 'income', 'show income', 'take me to income', 'i want to see income', 'show me income'], route: '/income', name: 'Income' },
    { patterns: ['go to clients', 'clients', 'show clients', 'take me to clients', 'i want to see clients', 'show me clients'], route: '/clients', name: 'Clients' },
    { patterns: ['go to projects', 'projects', 'show projects', 'take me to projects', 'i want to see projects', 'show me projects'], route: '/projects', name: 'Projects' },
    { patterns: ['go to contracts', 'contracts', 'show contracts', 'take me to contracts', 'i want to see contracts'], route: '/contracts', name: 'Contracts' },
    { patterns: ['go to dashboard', 'dashboard', 'home', 'go home', 'take me home', 'main page', 'i want to go home'], route: '/dashboard', name: 'Dashboard' },
    { patterns: ['go to mileage', 'mileage', 'miles', 'kilometers', 'take me to mileage', 'show mileage'], route: '/mileage', name: 'Mileage' },
    { patterns: ['go to net worth', 'net worth', 'wealth', 'assets', 'take me to net worth', 'show my assets'], route: '/net-worth', name: 'Net Worth' },
    { patterns: ['go to banking', 'banking', 'bank', 'bank transactions', 'take me to banking', 'bank analysis'], route: '/banking', name: 'Banking' },
    { patterns: ['go to settings', 'settings', 'configuration', 'take me to settings', 'i want to configure'], route: '/settings', name: 'Settings' },
    { patterns: ['capture', 'capture expense', 'take photo', 'scan receipt', 'i want to capture', 'scan a receipt'], route: '/capture', name: 'Quick Capture' },
    { patterns: ['add expense', 'new expense', 'create expense', 'i want to add an expense', 'record expense'], route: '/expenses', action: 'add-expense', name: 'Add Expense' },
    { patterns: ['add income', 'new income', 'create income', 'i want to add income', 'record income'], route: '/income', action: 'add-income', name: 'Add Income' },
    { patterns: ['add client', 'new client', 'create client', 'i want to add a client', 'register client'], route: '/clients', action: 'add-client', name: 'Add Client' },
    { patterns: ['inbox', 'chaos inbox', 'review receipts', 'pending receipts'], route: '/chaos-inbox', name: 'Chaos Inbox' },
    { patterns: ['reconciliation', 'reconcile', 'bank reconciliation', 'reconcile accounts'], route: '/reconciliation', name: 'Reconciliation' },
    { patterns: ['business profile', 'my business', 'business data'], route: '/business-profile', name: 'Business Profile' },
    { patterns: ['notifications', 'alerts', 'show notifications', 'my alerts'], route: '/notifications', name: 'Notifications' },
    { patterns: ['mentorship', 'go to mentorship', 'financial education', 'learn finance'], route: '/mentorship', name: 'Mentorship' },
    { patterns: ['taxes', 'tax calendar', 'go to taxes', 'see taxes', 'tax dates'], route: '/tax-calendar', name: 'Tax Calendar' },
  ],
};

// Voice query commands (return data directly)
type QueryType = 'expenses_month' | 'expenses_year' | 'income_month' | 'income_year' | 'balance' | 'client_count' | 'project_count' | 'pending_receipts' | 'biggest_expense' | 'top_category' | 'tax_summary' | 'tax_owed' | 'deductible_total' | 'billable_total';

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
    // New advanced queries
    { patterns: ['cuál es mi mayor gasto', 'mayor gasto', 'gasto más grande', 'gasto más alto'], queryType: 'biggest_expense' },
    { patterns: ['en qué gasto más', 'categoría más alta', 'dónde gasto más', 'principal categoría'], queryType: 'top_category' },
    { patterns: ['resumen de impuestos', 'resumen fiscal', 'mis impuestos', 'situación fiscal'], queryType: 'tax_summary' },
    { patterns: ['cuánto debo a hacienda', 'cuánto debo de impuestos', 'impuestos por pagar', 'deuda fiscal'], queryType: 'tax_owed' },
    { patterns: ['gastos deducibles', 'cuánto puedo deducir', 'total deducible', 'deducciones'], queryType: 'deductible_total' },
    { patterns: ['gastos facturables', 'cuánto puedo facturar', 'reembolsables', 'por facturar a clientes'], queryType: 'billable_total' },
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
    // New advanced queries
    { patterns: ['what is my biggest expense', 'biggest expense', 'largest expense', 'highest expense'], queryType: 'biggest_expense' },
    { patterns: ['what do i spend most on', 'top category', 'where do i spend most', 'main category'], queryType: 'top_category' },
    { patterns: ['tax summary', 'my taxes', 'tax situation', 'fiscal summary'], queryType: 'tax_summary' },
    { patterns: ['how much do i owe in taxes', 'taxes owed', 'tax debt', 'tax liability'], queryType: 'tax_owed' },
    { patterns: ['deductible expenses', 'how much can i deduct', 'total deductions', 'tax deductions'], queryType: 'deductible_total' },
    { patterns: ['billable expenses', 'reimbursable expenses', 'client billable', 'to bill clients'], queryType: 'billable_total' },
  ],
};

// Category mappings for voice expense creation
const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; category: ExpenseCategory }> = {
  meals: { keywords: ['restaurante', 'restaurant', 'comida', 'food', 'almuerzo', 'lunch', 'cena', 'dinner', 'desayuno', 'breakfast', 'cafe', 'café', 'coffee'], category: 'meals' },
  travel: { keywords: ['viaje', 'travel', 'vuelo', 'flight', 'hotel', 'hospedaje', 'avión', 'airplane', 'tren', 'train', 'bus', 'taxi', 'uber', 'transporte', 'transport'], category: 'travel' },
  equipment: { keywords: ['equipo', 'equipment', 'computadora', 'computer', 'laptop', 'teléfono', 'phone', 'tablet', 'monitor', 'teclado', 'keyboard', 'herramienta', 'tool'], category: 'equipment' },
  software: { keywords: ['software', 'licencia', 'license', 'suscripción', 'subscription', 'app', 'aplicación', 'programa'], category: 'software' },
  fuel: { keywords: ['gasolina', 'gas', 'fuel', 'combustible', 'diesel', 'nafta', 'bencina'], category: 'fuel' },
  office_supplies: { keywords: ['oficina', 'office', 'papelería', 'stationery', 'papel', 'paper', 'tinta', 'ink', 'material'], category: 'office_supplies' },
  utilities: { keywords: ['servicios', 'utilities', 'luz', 'electricity', 'agua', 'water', 'internet', 'teléfono fijo', 'landline'], category: 'utilities' },
  professional_services: { keywords: ['servicio', 'service', 'consultoría', 'consulting', 'abogado', 'lawyer', 'contador', 'accountant', 'profesional'], category: 'professional_services' },
};

// Income type mappings for voice income creation
const INCOME_TYPE_KEYWORDS: Record<string, { keywords: string[]; incomeType: IncomeType }> = {
  client_payment: { keywords: ['cliente', 'client', 'pago de cliente', 'client payment', 'factura', 'invoice'], incomeType: 'client_payment' },
  salary: { keywords: ['salario', 'salary', 'sueldo', 'nómina', 'payroll', 'wage'], incomeType: 'salary' },
  bonus: { keywords: ['bono', 'bonus', 'aguinaldo', 'prima'], incomeType: 'bonus' },
  freelance: { keywords: ['freelance', 'proyecto', 'project', 'trabajo independiente', 'independiente'], incomeType: 'freelance' },
  investment_stocks: { keywords: ['dividendos', 'dividends', 'inversión', 'investment', 'acciones', 'stocks', 'bolsa'], incomeType: 'investment_stocks' },
  investment_crypto: { keywords: ['crypto', 'cripto', 'bitcoin', 'ethereum', 'criptomoneda'], incomeType: 'investment_crypto' },
  passive_rental: { keywords: ['alquiler', 'renta', 'rental', 'arrendamiento', 'rent'], incomeType: 'passive_rental' },
  passive_royalties: { keywords: ['regalías', 'royalties', 'derechos de autor', 'royalty'], incomeType: 'passive_royalties' },
  gift: { keywords: ['regalo', 'gift', 'donación', 'donation'], incomeType: 'gift' },
  refund: { keywords: ['reembolso', 'refund', 'devolución', 'return'], incomeType: 'refund' },
  online_business: { keywords: ['online', 'ecommerce', 'tienda online', 'negocio online'], incomeType: 'online_business' },
};

// Parse voice expense command
interface ParsedExpense {
  amount: number;
  category: ExpenseCategory;
  vendor: string;
}

function parseVoiceExpense(text: string): ParsedExpense | null {
  const normalizedText = text.toLowerCase().trim();
  
  // Patterns: "gasto de X en Y", "expense of X at Y", "X dólares en Y", "X dollars at Y"
  const patterns = [
    /(?:gasto de|expense of|gasté)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:en|at|de)\s+(.+)/i,
    /\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:en|at|de)\s+(.+)/i,
    /(?:gasto|expense|gasté)\s+(.+)\s+(?:por|for)\s*\$?\s*(\d+(?:[.,]\d+)?)/i,
  ];
  
  let amount: number | null = null;
  let vendorText: string = '';
  
  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      if (pattern.source.includes('por|for')) {
        // Pattern: "gasto restaurante por 50"
        vendorText = match[1].trim();
        amount = parseFloat(match[2].replace(',', '.'));
      } else {
        // Pattern: "gasto de 50 en restaurante"
        amount = parseFloat(match[1].replace(',', '.'));
        vendorText = match[2].trim();
      }
      break;
    }
  }
  
  if (!amount || amount <= 0 || !vendorText) {
    return null;
  }
  
  // Detect category from vendor text
  let category: ExpenseCategory = 'other';
  for (const [, config] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (vendorText.includes(keyword)) {
        category = config.category;
        break;
      }
    }
    if (category !== 'other') break;
  }
  
  // Capitalize vendor name
  const vendor = vendorText.charAt(0).toUpperCase() + vendorText.slice(1);
  
  return { amount, category, vendor };
}

// Parse voice income command
interface ParsedIncome {
  amount: number;
  incomeType: IncomeType;
  source: string;
}

function parseVoiceIncome(text: string): ParsedIncome | null {
  const normalizedText = text.toLowerCase().trim();
  
  // Patterns: "ingreso de X de cliente", "income of X from client", "recibí X por proyecto"
  const patterns = [
    /(?:ingreso de|income of|recibí|gané|recibí pago de)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:de|from|por|by)\s+(.+)/i,
    /(?:me pagaron|pago de)\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:de|por|from)\s+(.+)/i,
    /\$?\s*(\d+(?:[.,]\d+)?)\s*(?:dólares?|dollars?|pesos?)?\s*(?:de ingreso|de sueldo|de salario)\s*(?:de|por)?\s*(.+)?/i,
  ];
  
  let amount: number | null = null;
  let sourceText: string = '';
  
  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(',', '.'));
      sourceText = (match[2] || '').trim();
      break;
    }
  }
  
  if (!amount || amount <= 0) {
    return null;
  }
  
  // Detect income type from source text
  let incomeType: IncomeType = 'other';
  const combinedText = `${normalizedText} ${sourceText}`;
  
  for (const [, config] of Object.entries(INCOME_TYPE_KEYWORDS)) {
    for (const keyword of config.keywords) {
      if (combinedText.includes(keyword)) {
        incomeType = config.incomeType;
        break;
      }
    }
    if (incomeType !== 'other') break;
  }
  
  // Capitalize source name
  const source = sourceText ? sourceText.charAt(0).toUpperCase() + sourceText.slice(1) : '';
  
  return { amount, incomeType, source };
}

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathRef = useRef<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: stats } = useDashboardStats();
  const { data: incomeData } = useIncome();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: expenses } = useExpenses();
  const { language } = useLanguage();
  const createExpense = useCreateExpense();
  const createIncome = useCreateIncome();

  // Smart guidance system
  const { 
    getContextualWelcome, 
    getProactiveAlerts, 
    findTutorial, 
    formatTutorialForSpeech,
    getPostActionSuggestion,
    getErrorRecovery,
    getQuickActions 
  } = useSmartGuidance();

  // Voice preferences (speed, volume, sounds, shortcuts, reminders)
  const voicePrefs = useVoicePreferences();

  // Voice confirmation system
  const voiceConfirmation = useVoiceConfirmation();

  // Language detection
  const langDetection = useLanguageDetection();

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
  const quickQuestions = QUICK_QUESTIONS[language as keyof typeof QUICK_QUESTIONS] || QUICK_QUESTIONS.es;

  // Check if text matches a voice query command
  // STRICT: Only match short/direct queries with exact or start-of-phrase patterns
  const checkVoiceQuery = useCallback((text: string): { matched: boolean; queryType?: QueryType } => {
    const normalizedText = text.toLowerCase().trim().replace(/[.,!?¿¡]/g, '');
    const words = normalizedText.split(/\s+/);
    const queries = VOICE_QUERIES[language as keyof typeof VOICE_QUERIES] || VOICE_QUERIES.es;
    
    // Don't match queries in long sentences - those are complex questions for AI
    if (words.length > 10) {
      console.log('[Voice] Text too long for query matching, sending to AI');
      return { matched: false };
    }
    
    // Words that indicate a complex question that should go to AI instead
    const complexIndicators = [
      'puedes', 'podrías', 'puedo', 'cómo hacer', 'qué es', 'por qué', 'cuál es la diferencia',
      'ayuda', 'ayudar', 'orientar', 'explicar', 'explicame', 'dime cómo', 'hacer por mí',
      'can you', 'could you', 'how do', 'what is', 'why', 'explain', 'help me', 'tell me how',
      'de chile', 'de canadá', 'from chile', 'from canada',
      'en chile', 'en canadá', 'in chile', 'in canada',
    ];
    
    // If the text contains complex question indicators, send to AI
    const hasComplexIndicator = complexIndicators.some(indicator => normalizedText.includes(indicator));
    if (hasComplexIndicator) {
      console.log('[Voice] Complex indicator found, sending to AI');
      return { matched: false };
    }
    
    for (const query of queries) {
      for (const pattern of query.patterns) {
        // Exact match OR text starts with pattern
        if (normalizedText === pattern || normalizedText.startsWith(pattern)) {
          console.log('[Voice] Query matched:', pattern, '→', query.queryType);
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
      // New advanced queries
      biggest_expense: {
        es: biggestExpense 
          ? `Tu mayor gasto es ${formatCurrency(Number(biggestExpense.amount))} en ${biggestExpense.vendor || biggestExpense.description || 'un gasto sin descripción'}.`
          : `No tienes gastos registrados aún.`,
        en: biggestExpense
          ? `Your biggest expense is ${formatCurrency(Number(biggestExpense.amount))} at ${biggestExpense.vendor || biggestExpense.description || 'an expense without description'}.`
          : `You don't have any recorded expenses yet.`,
      },
      top_category: {
        es: topCategory 
          ? `Gastas más en ${topCategory[0]}: ${formatCurrency(topCategory[1])} en total.`
          : `No tienes gastos categorizados aún.`,
        en: topCategory
          ? `You spend most on ${topCategory[0]}: ${formatCurrency(topCategory[1])} in total.`
          : `You don't have any categorized expenses yet.`,
      },
      tax_summary: {
        es: `Resumen fiscal: Ingresos ${formatCurrency(yearlyIncome)}, gastos ${formatCurrency(yearlyExpenses)}, deducible ${formatCurrency(deductibleTotal)}. Balance neto: ${formatCurrency(balance)}.`,
        en: `Tax summary: Income ${formatCurrency(yearlyIncome)}, expenses ${formatCurrency(yearlyExpenses)}, deductible ${formatCurrency(deductibleTotal)}. Net balance: ${formatCurrency(balance)}.`,
      },
      tax_owed: {
        es: estimatedTaxOwed > 0
          ? `Estimación de impuestos por pagar: ${formatCurrency(estimatedTaxOwed)} (basado en tasa promedio del 25% sobre ingresos menos deducciones).`
          : `No tienes impuestos estimados por pagar. Tus deducciones cubren tus ingresos gravables.`,
        en: estimatedTaxOwed > 0
          ? `Estimated taxes owed: ${formatCurrency(estimatedTaxOwed)} (based on 25% average rate on income minus deductions).`
          : `You don't have estimated taxes owed. Your deductions cover your taxable income.`,
      },
      deductible_total: {
        es: `Tienes ${formatCurrency(deductibleTotal)} en gastos deducibles para declarar.`,
        en: `You have ${formatCurrency(deductibleTotal)} in deductible expenses to declare.`,
      },
      billable_total: {
        es: billableTotal > 0
          ? `Tienes ${formatCurrency(billableTotal)} en gastos facturables a clientes pendientes de cobrar.`
          : `No tienes gastos facturables a clientes pendientes.`,
        en: billableTotal > 0
          ? `You have ${formatCurrency(billableTotal)} in client billable expenses pending collection.`
          : `You don't have any client billable expenses pending.`,
      },
    };

    return responses[queryType][language as 'es' | 'en'] || responses[queryType].es;
  }, [monthlyExpenses, yearlyExpenses, monthlyIncome, yearlyIncome, balance, clients?.length, projects?.length, pendingReceipts, biggestExpense, topCategory, deductibleTotal, billableTotal, estimatedTaxOwed, language]);

  // Check if text matches a voice command
  // STRICT: Only match if text is short (max 10 words) AND pattern is at the START or is EXACT
  const checkVoiceCommand = useCallback((text: string): { matched: boolean; route?: string; name?: string; action?: string } => {
    const normalizedText = text.toLowerCase().trim().replace(/[.,!?¿¡]/g, '');
    const words = normalizedText.split(/\s+/);
    
    // Don't match commands in long sentences - those are questions for the AI
    if (words.length > 10) {
      console.log('[Voice] Text too long for command matching, sending to AI:', normalizedText);
      return { matched: false };
    }
    
    const commands = VOICE_COMMANDS[language as keyof typeof VOICE_COMMANDS] || VOICE_COMMANDS.es;
    
    for (const command of commands) {
      for (const pattern of command.patterns) {
        // Exact match OR text starts with pattern
        if (normalizedText === pattern || normalizedText.startsWith(pattern + ' ') || normalizedText.startsWith(pattern)) {
          console.log('[Voice] Command matched:', pattern, '→', command.name);
          return { matched: true, route: command.route, name: command.name, action: command.action };
        }
      }
    }
    return { matched: false };
  }, [language]);

  // Get current page context for the AI assistant to explain
  const getCurrentPageContext = useCallback((): { pageName: string; description: string } => {
    const pageContexts: Record<string, { es: { name: string; desc: string }; en: { name: string; desc: string } }> = {
      '/dashboard': {
        es: { name: 'Dashboard', desc: 'Esta es tu página principal donde puedes ver un resumen de tus finanzas: balance general, gastos e ingresos del mes, gráficos de tendencias, y accesos rápidos a las funciones principales. Desde aquí puedes capturar gastos, ver alertas de presupuesto, y acceder a herramientas como el calculador FIRE y el optimizador de impuestos.' },
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
        es: { name: 'Bandeja de Caos', desc: 'Revisa y procesa recibos capturados que necesitan clasificación. Aquí puedes aprobar, rechazar, o editar gastos extraídos de fotos antes de que se agreguen a tu registro oficial.' },
        en: { name: 'Chaos Inbox', desc: 'Review and process captured receipts that need classification. Here you can approve, reject, or edit expenses extracted from photos before they are added to your official records.' },
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
    const pageQueries = [
      'qué es esto', 'que es esto', 'dónde estoy', 'donde estoy', 'qué página es esta', 
      'que pagina es esta', 'explica esta página', 'explícame', 'explicame', 'qué puedo hacer aquí',
      'que puedo hacer aqui', 'cómo funciona', 'como funciona', 'ayúdame con esta página',
      'what is this', 'where am i', 'what page is this', 'explain this page', 
      'what can i do here', 'how does this work', 'help me with this page',
      'guíame', 'guiame', 'guide me', 'tutorial', 'ayuda aquí', 'help here'
    ];
    return pageQueries.some(q => normalizedText.includes(q));
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

  // Voice assistant hook with preferences
  const {
    isListening,
    isContinuousMode,
    isSpeaking,
    isSpeechPaused,
    isSupported: isVoiceSupported,
    transcript,
    currentSpeakingText,
    currentSentenceIndex,
    toggleListening,
    startContinuousListening,
    stopContinuousListening,
    speak,
    pauseSpeech,
    resumeSpeech,
    stopSpeaking,
  } = useVoiceAssistant({
    speechSpeed: voicePrefs.speechSpeed,
    volume: voicePrefs.volume,
    pitch: voicePrefs.pitch,
    onInterimTranscript: (text) => {
      // Update input field with live transcript
      setInput(text);
    },
    onInterrupted: () => {
      voicePrefs.playSound('notification');
      const msg = language === 'es' ? 'Interrumpido. ¿Qué necesitas?' : 'Interrupted. What do you need?';
      toast.info(msg);
    },
    onTranscript: (text) => {
      console.log('[ChatAssistant] Received transcript:', text);
      
      // Track action for learning
      voicePrefs.trackAction('voice_input');
      
      // Check for language switch commands first
      const langCmd = langDetection.checkLanguageCommand(text);
      if (langCmd.isCommand && langCmd.targetLanguage) {
        setInput('');
        const response = langDetection.executeLanguageSwitch(langCmd.targetLanguage);
        const userMessage: Message = { role: 'user', content: text };
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        speak(response);
        voicePrefs.playSound('success');
        return;
      }

      // Auto-detect language and switch if needed
      const langSwitch = langDetection.autoSwitchLanguage(text);
      if (langSwitch.switched && langSwitch.message) {
        const notifyMsg = langSwitch.message[langSwitch.newLanguage];
        toast.info(notifyMsg);
      }

      // Check if waiting for confirmation
      if (voiceConfirmation.isWaitingForConfirmation) {
        const confirmResult = voiceConfirmation.processConfirmationVoice(text);
        if (confirmResult.handled) {
          setInput('');
          if (confirmResult.message) {
            const confirmMessage: Message = { role: 'assistant', content: confirmResult.message };
            setMessages(prev => [...prev, confirmMessage]);
            speak(confirmResult.message);
            voicePrefs.playSound(confirmResult.confirmed ? 'success' : 'notification');
          }
          return;
        }
      }

      // Check for custom shortcuts
      const customShortcut = voicePrefs.checkCustomShortcut(text);
      if (customShortcut) {
        setInput('');
        voicePrefs.trackAction(`shortcut_${customShortcut.id}`);
        
        if (customShortcut.route) {
          const confirmMsg = customShortcut.name[language as 'es' | 'en'];
          const userMessage: Message = { role: 'user', content: text };
          const assistantMessage: Message = { role: 'assistant', content: confirmMsg };
          setMessages(prev => [...prev, userMessage, assistantMessage]);
          speak(confirmMsg);
          navigate(customShortcut.route);
          voicePrefs.playSound('success');
        }
        return;
      }
      // PRIORITY 0: Check for tutorial requests
      const tutorial = findTutorial(text);
      if (tutorial) {
        setInput('');
        setActiveTutorial(tutorial.id);
        setCurrentTutorialStep(0);
        
        const tutorialResponse = formatTutorialForSpeech(tutorial);
        const userMessage: Message = { role: 'user', content: text };
        const assistantMessage: Message = { role: 'assistant', content: tutorialResponse };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        speak(tutorialResponse);
        return;
      }
      
      // PRIORITY 1: Check if it's a navigation command first (most user-friendly)
      const command = checkVoiceCommand(text);
      if (command.matched && command.route && command.name) {
        setInput('');
        const confirmMsg = language === 'es' 
          ? `Entendido. Navegando a ${command.name}.`
          : `Got it. Navigating to ${command.name}.`;
        
        const userMessage: Message = { role: 'user', content: text };
        const assistantMessage: Message = { role: 'assistant', content: confirmMsg };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        speak(confirmMsg);
        executeVoiceCommand(command.route, command.name, command.action);
        
        // Post-navigation suggestion
        setTimeout(() => {
          const suggestion = getPostActionSuggestion('navigation');
          if (suggestion && autoSpeak) {
            // Don't speak this one, just add to chat silently
          }
        }, 2000);
        return;
      }
      
      // PRIORITY 2: Check if it's a data query command
      const query = checkVoiceQuery(text);
      if (query.matched && query.queryType) {
        setInput('');
        const response = getQueryResponse(query.queryType);
        
        const userMessage: Message = { role: 'user', content: text };
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        speak(response);
        return;
      }
      
      // PRIORITY 3: Check if user is asking about the current page (guide functionality)
      if (isAskingAboutCurrentPage(text)) {
        setInput('');
        const pageContext = getCurrentPageContext();
        const response = language === 'es'
          ? `Estás en la página de ${pageContext.pageName}. ${pageContext.description}`
          : `You're on the ${pageContext.pageName} page. ${pageContext.description}`;
        
        const userMessage: Message = { role: 'user', content: text };
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        speak(response);
        return;
      }
      
      // PRIORITY 3.5: Check for error recovery if user seems confused
      const errorRecovery = getErrorRecovery(text);
      if (errorRecovery) {
        setInput('');
        const response = language === 'es'
          ? `Entiendo que puede ser confuso. Aquí hay algunas opciones:\n\n${errorRecovery.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
          : `I understand it can be confusing. Here are some options:\n\n${errorRecovery.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
        
        const userMessage: Message = { role: 'user', content: text };
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        speak(response);
        return;
      }
      
      // PRIORITY 4: Check if it's an expense creation command
      const parsedExpense = parseVoiceExpense(text);
      if (parsedExpense) {
        setInput('');
        
        createExpense.mutate({
          amount: parsedExpense.amount,
          vendor: parsedExpense.vendor,
          category: parsedExpense.category,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          reimbursement_type: 'pending_classification',
          user_id: '',
        }, {
          onSuccess: () => {
            const confirmMsg = language === 'es'
              ? `Gasto creado: $${parsedExpense.amount} en ${parsedExpense.vendor}, categoría ${parsedExpense.category}.`
              : `Expense created: $${parsedExpense.amount} at ${parsedExpense.vendor}, category ${parsedExpense.category}.`;
            
            const userMessage: Message = { role: 'user', content: text };
            const assistantMessage: Message = { role: 'assistant', content: confirmMsg };
            setMessages(prev => [...prev, userMessage, assistantMessage]);
            
            speak(confirmMsg);
            toast.success(language === 'es' ? 'Gasto creado por voz' : 'Expense created by voice');
            
            // Post-action suggestion
            setTimeout(() => {
              const suggestion = getPostActionSuggestion('expense_created');
              if (suggestion) {
                const suggestionMsg: Message = { role: 'assistant', content: `💡 ${suggestion}` };
                setMessages(prev => [...prev, suggestionMsg]);
              }
            }, 1500);
          },
          onError: () => {
            const errorMsg = language === 'es'
              ? 'No pude crear el gasto. Intenta de nuevo.'
              : 'Could not create the expense. Please try again.';
            speak(errorMsg);
          }
        });
        return;
      }
      
      // PRIORITY 5: Check if it's an income creation command
      const parsedIncome = parseVoiceIncome(text);
      if (parsedIncome) {
        setInput('');
        
        createIncome.mutate({
          amount: parsedIncome.amount,
          currency: 'CAD',
          date: new Date(),
          income_type: parsedIncome.incomeType,
          source: parsedIncome.source || undefined,
          description: parsedIncome.source || undefined,
          recurrence: 'one_time',
          is_taxable: true,
        }, {
          onSuccess: () => {
            const incomeTypeLabel = parsedIncome.incomeType === 'client_payment' ? (language === 'es' ? 'pago de cliente' : 'client payment') :
              parsedIncome.incomeType === 'salary' ? (language === 'es' ? 'salario' : 'salary') :
              parsedIncome.incomeType === 'freelance' ? 'freelance' :
              parsedIncome.incomeType;
            
            const confirmMsg = language === 'es'
              ? `Ingreso registrado: $${parsedIncome.amount}${parsedIncome.source ? ` de ${parsedIncome.source}` : ''}, tipo: ${incomeTypeLabel}.`
              : `Income recorded: $${parsedIncome.amount}${parsedIncome.source ? ` from ${parsedIncome.source}` : ''}, type: ${incomeTypeLabel}.`;
            
            const userMessage: Message = { role: 'user', content: text };
            const assistantMessage: Message = { role: 'assistant', content: confirmMsg };
            setMessages(prev => [...prev, userMessage, assistantMessage]);
            
            speak(confirmMsg);
            toast.success(language === 'es' ? 'Ingreso creado por voz' : 'Income created by voice');
            
            // Post-action suggestion
            setTimeout(() => {
              const suggestion = getPostActionSuggestion('income_created');
              if (suggestion) {
                const suggestionMsg: Message = { role: 'assistant', content: `💡 ${suggestion}` };
                setMessages(prev => [...prev, suggestionMsg]);
              }
            }, 1500);
          },
          onError: () => {
            const errorMsg = language === 'es'
              ? 'No pude registrar el ingreso. Intenta de nuevo.'
              : 'Could not create the income. Please try again.';
            speak(errorMsg);
          }
        });
        return;
      }
      
      // PRIORITY 6: Send to AI for complex questions
      setInput('');
      sendMessage(text);
    },
    onContinuousStopped: () => {
      // Notify user that continuous mode was stopped by voice
      const msg = language === 'es' 
        ? 'Modo continuo desactivado.'
        : 'Continuous mode stopped.';
      toast.info(msg);
    },
  });

  // Audio playback hook for Spotify-like controls
  const audioPlayback = useAudioPlayback({
    onEnd: () => {
      // Optionally handle when audio ends
    },
  });

  // Track recording duration
  // Track recording duration - in continuous mode, keep timer running even during speak pauses
  useEffect(() => {
    // Start timer when listening starts (or continuous mode is active and listening)
    const shouldTrackTime = isListening || isContinuousMode;
    
    if (shouldTrackTime && !recordingStartTime) {
      setRecordingStartTime(Date.now());
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!shouldTrackTime && recordingStartTime) {
      // Only reset when BOTH listening stops AND continuous mode is off
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
  }, [isListening, isContinuousMode, recordingStartTime]);

  // Update input with live transcript - now handled by onInterimTranscript callback
  // Also update from transcript state for final results
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
          speak(welcome);
        }, 500);
      }
    }
  }, [isOpen, hasShownWelcome, messages.length, getContextualWelcome, getProactiveAlerts, autoSpeak, isVoiceSupported, speak, language]);

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
            speak(reminder);
          }
          voicePrefs.playSound('notification');
        });
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, [isOpen, isVoiceSupported, language, autoSpeak, speak, voicePrefs]);

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
      // IMPORTANT: ALWAYS use speak() so the mic is paused even if callbacks are stale.
      if (autoSpeak && isVoiceSupported) {
        window.speechSynthesis.cancel();
        audioPlayback.stop();
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
  }, [isLoading, userName, stats, totalIncome, clients, projects, messages, language, autoSpeak, isVoiceSupported, speak, audioPlayback]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleMicClick = () => {
    // CRITICAL: Cancel ALL speech synthesis first
    window.speechSynthesis.cancel();
    audioPlayback.stop();
    
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
    // CRITICAL: Cancel ALL speech synthesis before toggling
    window.speechSynthesis.cancel();
    audioPlayback.stop();
    
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
          "bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500",
          "transition-all duration-300 hover:scale-110",
          isOpen && "hidden"
        )}
        size="icon"
      >
        <PhoenixLogo variant="badge" showEffects={false} className="h-7 w-7" />
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
              <PhoenixLogo 
                variant="mini" 
                state={isSpeaking ? "rebirth" : "auto"} 
                showEffects={isSpeaking}
                className={cn(isSpeaking && "animate-pulse")}
              />
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
              {/* Voice Settings Popover */}
              {isVoiceSupported && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">{language === 'es' ? 'Configuración de voz' : 'Voice Settings'}</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{language === 'es' ? 'Velocidad' : 'Speed'}</span>
                          <span>{voicePrefs.speechSpeed.toFixed(1)}x</span>
                        </div>
                        <Slider
                          value={[voicePrefs.speechSpeed]}
                          min={0.5}
                          max={2}
                          step={0.1}
                          onValueChange={([v]) => voicePrefs.setSpeechSpeed(v)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{language === 'es' ? 'Volumen' : 'Volume'}</span>
                          <Volume1 className="h-3 w-3" />
                        </div>
                        <Slider
                          value={[voicePrefs.volume]}
                          min={0}
                          max={1}
                          step={0.1}
                          onValueChange={([v]) => voicePrefs.setVolume(v)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>{language === 'es' ? 'Tono' : 'Pitch'}</span>
                          <span className="text-muted-foreground">{voicePrefs.pitch.toFixed(1)}</span>
                        </div>
                        <Slider
                          value={[voicePrefs.pitch]}
                          min={0.5}
                          max={2}
                          step={0.1}
                          onValueChange={([v]) => voicePrefs.setPitch(v)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{language === 'es' ? 'Sonidos' : 'Sounds'}</span>
                        <Button
                          variant={voicePrefs.enableSoundEffects ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => voicePrefs.toggleSoundEffects()}
                        >
                          {voicePrefs.enableSoundEffects ? 'On' : 'Off'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{language === 'es' ? 'Confirmar acciones' : 'Confirm actions'}</span>
                        <Button
                          variant={voicePrefs.confirmDestructiveActions ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => voicePrefs.toggleConfirmDestructive()}
                        >
                          {voicePrefs.confirmDestructiveActions ? 'On' : 'Off'}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
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
              {/* Stop speaking button - only show when speaking */}
              {isVoiceSupported && isSpeaking && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        stopSpeaking();
                        voicePrefs.playSound('notification');
                      }}
                      className="h-8 w-8 text-red-500 hover:text-red-600 animate-pulse"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {language === 'es' ? 'Detener habla' : 'Stop speaking'}
                  </TooltipContent>
                </Tooltip>
              )}
              {/* Auto-speak toggle */}
              {isVoiceSupported && !isSpeaking && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setAutoSpeak(!autoSpeak);
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
                            // If the mic is currently listening, avoid audioPlayback because it doesn't pause recognition.
                            // This prevents speaker-echo loops.
                            if (isListening || isContinuousMode) {
                              window.speechSynthesis.cancel();
                              audioPlayback.stop();
                              speak(msg.content);
                              return;
                            }

                            const isThisPlaying = audioPlayback.isPlaying && audioPlayback.currentMessageIndex === i;
                            const isThisPaused = audioPlayback.isPaused && audioPlayback.currentMessageIndex === i;

                            if (isThisPlaying && !isThisPaused) {
                              audioPlayback.pause();
                            } else if (isThisPaused) {
                              audioPlayback.resume();
                            } else {
                              audioPlayback.play(msg.content, i);
                            }
                          }}
                          className="h-6 px-2 mt-1 text-xs opacity-70 hover:opacity-100"
                        >
                          {audioPlayback.isPlaying && audioPlayback.currentMessageIndex === i && !audioPlayback.isPaused ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Pausar' : 'Pause'}
                            </>
                          ) : audioPlayback.isPaused && audioPlayback.currentMessageIndex === i ? (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Reanudar' : 'Resume'}
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
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Karaoke Text Display - shows when speaking with sentence highlighting */}
          {isSpeaking && currentSpeakingText && (
            <KaraokeText
              text={currentSpeakingText}
              currentSentenceIndex={currentSentenceIndex}
              isPlaying={isSpeaking}
              isPaused={isSpeechPaused}
              onPause={pauseSpeech}
              onResume={resumeSpeech}
              onStop={stopSpeaking}
              className="mx-4 mb-2"
            />
          )}

          {/* Audio Playback Controls - Spotify style */}
          {(audioPlayback.isPlaying || audioPlayback.isPaused) && !isSpeaking && (
            <div className="px-4 py-3 border-t bg-muted/30">
              <div className="flex flex-col gap-2">
                {/* Progress bar */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-8 text-right font-mono">
                    {Math.floor(audioPlayback.currentTime / 60)}:{Math.floor(audioPlayback.currentTime % 60).toString().padStart(2, '0')}
                  </span>
                  <Progress value={audioPlayback.progress} className="flex-1 h-1.5" />
                  <span className="w-8 font-mono">
                    {Math.floor(audioPlayback.duration / 60)}:{Math.floor(audioPlayback.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                
                {/* Playback controls */}
                <div className="flex items-center justify-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={audioPlayback.seekBackward}
                        className="h-8 w-8"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{language === 'es' ? 'Retroceder 10s' : 'Rewind 10s'}</TooltipContent>
                  </Tooltip>
                  
                  <Button
                    variant="default"
                    size="icon"
                    onClick={audioPlayback.isPaused ? audioPlayback.resume : audioPlayback.pause}
                    className="h-10 w-10 rounded-full"
                  >
                    {audioPlayback.isPaused ? (
                      <Play className="h-5 w-5 ml-0.5" />
                    ) : (
                      <Pause className="h-5 w-5" />
                    )}
                  </Button>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={audioPlayback.seekForward}
                        className="h-8 w-8"
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{language === 'es' ? 'Adelantar 10s' : 'Forward 10s'}</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={audioPlayback.stop}
                        className="h-8 w-8 ml-2"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{language === 'es' ? 'Detener' : 'Stop'}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}

          {/* Recording Controls - Show for both listening and continuous mode */}
          {(isListening || isContinuousMode) && (
            <div className={cn(
              "px-4 py-3 border-t",
              isSpeaking ? "bg-primary/10" : "bg-red-500/10"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-3 w-3 rounded-full animate-pulse",
                  isSpeaking ? "bg-primary" : "bg-red-500"
                )} />
                <span className={cn(
                  "text-sm font-medium flex-1",
                  isSpeaking 
                    ? "text-primary" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {isSpeaking 
                    ? (language === 'es' ? '🔊 Hablando...' : '🔊 Speaking...')
                    : isContinuousMode
                      ? (language === 'es' ? '🎙️ Modo Continuo' : '🎙️ Continuous Mode')
                      : (language === 'es' ? 'Grabando' : 'Recording')
                  }: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
                <Button
                  variant={isSpeaking ? "secondary" : "destructive"}
                  size="sm"
                  onClick={isContinuousMode ? stopContinuousListening : handleMicClick}
                  className="h-8"
                >
                  <Square className="h-3 w-3 mr-1.5" />
                  {language === 'es' ? 'Detener' : 'Stop'}
                </Button>
              </div>
            </div>
          )}

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
                  isSpeaking
                    ? (language === 'es' ? 'El asistente está hablando...' : 'Assistant is speaking...')
                    : isListening 
                      ? (language === 'es' ? 'Escuchando...' : 'Listening...')
                      : isContinuousMode
                        ? (language === 'es' ? 'Pausado, esperando...' : 'Paused, waiting...')
                        : (language === 'es' ? 'Escribe o habla tu pregunta...' : 'Type or speak your question...')
                }
                disabled={isLoading}
                className={cn(
                  "flex-1",
                  isListening && "border-red-500 bg-red-50 dark:bg-red-950/20",
                  isSpeaking && "border-primary bg-primary/5"
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
