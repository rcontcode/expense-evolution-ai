/**
 * Voice Command Processor - Sistema centralizado de prioridades
 * 
 * FLUJO DE PRIORIDADES (sin conflictos):
 * 
 * 1. ONBOARDING MIC TEST - Solo confirma que el mic funciona, ignora todo lo demás
 * 2. LANGUAGE SWITCH - Cambiar idioma ("habla en inglés", "speak spanish")
 * 3. CONFIRMATION PENDING - Si hay una confirmación esperando (sí/no)
 * 4. CUSTOM SHORTCUTS - Atajos personalizados del usuario (VoicePreferences)
 * 5. TUTORIAL REQUESTS - Pedir tutoriales ("cómo capturo un gasto")
 * 6. EXPENSE CREATION - Crear gastos por voz ("gasté 50 en uber")
 * 7. INCOME CREATION - Crear ingresos por voz ("recibí 1000 de cliente")
 * 8. PAGE CONTEXT QUERY - "qué puedo hacer aquí" (SIEMPRE local, usa ruta actual)
 * 9. OPEN CLIENT BY NAME - "abre el cliente ACME" (SIEMPRE local, busca en datos)
 * 10. NAVIGATION COMMANDS - "llévame a gastos" (local patterns de VOICE_COMMANDS)
 * 11. DATA QUERIES - "cuánto gasté este mes" (local patterns de VOICE_QUERIES)
 * 12. ADVANCED ACTIONS - Alertas, recordatorios, duplicar, exportar
 * 13. AI FALLBACK - Todo lo demás va a la IA para respuesta inteligente
 * 
 * REGLA CLAVE: Cada nivel tiene precedencia absoluta sobre los siguientes.
 * Si el nivel N maneja el comando, los niveles N+1 a 13 NO se ejecutan.
 */

import { VOICE_COMMANDS, VOICE_QUERIES, QueryType } from './VoiceCommands';
import { parseOpenClientCommand } from './VoiceActionParsers';
import { parseVoiceExpense, parseVoiceIncome } from './VoiceParsers';
import { parseAdvancedAction, AdvancedAction } from './VoiceAdvancedActions';

export type ProcessingResult = 
  | { handled: false }
  | { handled: true; type: 'onboarding-mic-test'; response: string }
  | { handled: true; type: 'language-switch'; targetLanguage: 'es' | 'en'; response: string }
  | { handled: true; type: 'confirmation'; confirmed: boolean; response: string }
  | { handled: true; type: 'custom-shortcut'; route: string; name: string; action?: string }
  | { handled: true; type: 'tutorial'; tutorialId: string; response: string }
  | { handled: true; type: 'expense-creation'; data: ReturnType<typeof parseVoiceExpense> }
  | { handled: true; type: 'income-creation'; data: ReturnType<typeof parseVoiceIncome> }
  | { handled: true; type: 'page-context'; response: string; currentPath: string }
  | { handled: true; type: 'open-client'; clientId: string; clientName: string; response: string }
  | { handled: true; type: 'navigation'; route: string; name: string; action?: string; response: string }
  | { handled: true; type: 'data-query'; queryType: QueryType; response: string }
  | { handled: true; type: 'advanced-action'; action: AdvancedAction; response: string }
  | { handled: true; type: 'ai-fallback' };

interface ProcessorContext {
  language: 'es' | 'en';
  isOnboardingMicTest: boolean;
  isWaitingForConfirmation: boolean;
  currentPath: string;
  clients: Array<{ id: string; name: string }> | null | undefined;
  
  // Callbacks for checking external state
  checkCustomShortcut: (text: string) => { route?: string; name: { es: string; en: string }; action?: string } | null;
  checkLanguageCommand: (text: string) => { isCommand: boolean; targetLanguage?: 'es' | 'en' };
  processConfirmation: (text: string) => { handled: boolean; confirmed?: boolean; message?: string };
  findTutorial: (text: string) => { id: string } | null;
  getPageContext: () => { pageName: string; description: string };
  
  // Financial data for queries
  financialData: {
    monthlyExpenses: number;
    yearlyExpenses: number;
    monthlyIncome: number;
    yearlyIncome: number;
    balance: number;
    clientCount: number;
    projectCount: number;
    pendingReceipts: number;
    biggestExpense: { amount: number; vendor?: string | null } | null;
    topCategory: { category: string; amount: number } | null;
    deductibleTotal: number;
    billableTotal: number;
    estimatedTaxOwed: number;
    // Extended data for new queries
    lastMonthExpenses?: number;
    lastMonthIncome?: number;
    subscriptions?: Array<{ name: string; amount: number; frequency: string }>;
    netWorth?: { assets: number; liabilities: number; total: number };
    fireProgress?: { current: number; target: number; percentage: number; yearsToFire: number };
    mileageSummary?: { totalKm: number; totalTrips: number; deductionValue: number };
    categoryBreakdown?: Array<{ category: string; amount: number; percentage: number }>;
    incomeBreakdown?: Array<{ source: string; amount: number; percentage: number }>;
  };
}

// Patterns for page context queries
const PAGE_CONTEXT_PATTERNS = {
  es: [
    'qué es esto', 'que es esto', 'dónde estoy', 'donde estoy', 
    'qué página es esta', 'que pagina es esta', 'explica esta página',
    'explícame', 'explicame', 'qué puedo hacer aquí', 'que puedo hacer aqui',
    'cómo funciona', 'como funciona', 'ayúdame con esta página',
    'guíame', 'guiame', 'ayuda aquí', 'ayuda aqui'
  ],
  en: [
    'what is this', 'where am i', 'what page is this', 'explain this page',
    'what can i do here', 'how does this work', 'help me with this page',
    'guide me', 'tutorial', 'help here'
  ]
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
 * Verifica si el texto coincide con algún patrón de consulta de página
 */
function isPageContextQuery(text: string, language: 'es' | 'en'): boolean {
  const normalized = normalizeText(text);
  const patterns = PAGE_CONTEXT_PATTERNS[language];
  return patterns.some(p => normalized.includes(normalizeText(p)));
}

/**
 * Busca un comando de navegación en VOICE_COMMANDS
 */
function findNavigationCommand(
  text: string, 
  language: 'es' | 'en'
): { route: string; name: string; action?: string } | null {
  const normalized = normalizeText(text);
  const commands = VOICE_COMMANDS[language];
  
  for (const cmd of commands) {
    for (const pattern of cmd.patterns) {
      if (normalized.includes(normalizeText(pattern))) {
        return { route: cmd.route, name: cmd.name, action: cmd.action };
      }
    }
  }
  
  return null;
}

/**
 * Busca una consulta de datos en VOICE_QUERIES
 */
function findDataQuery(text: string, language: 'es' | 'en'): QueryType | null {
  const normalized = normalizeText(text);
  const queries = VOICE_QUERIES[language];
  
  for (const query of queries) {
    for (const pattern of query.patterns) {
      if (normalized.includes(normalizeText(pattern))) {
        return query.queryType;
      }
    }
  }
  
  return null;
}

/**
 * Genera respuesta para consultas de datos
 */
function generateQueryResponse(
  queryType: QueryType,
  data: ProcessorContext['financialData'],
  language: 'es' | 'en'
): string {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat(language === 'es' ? 'es-CL' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  switch (queryType) {
    case 'expenses_month':
      return language === 'es'
        ? `Este mes has gastado ${formatCurrency(data.monthlyExpenses)}.`
        : `This month you've spent ${formatCurrency(data.monthlyExpenses)}.`;
    case 'expenses_year':
      return language === 'es'
        ? `Este año has gastado ${formatCurrency(data.yearlyExpenses)}.`
        : `This year you've spent ${formatCurrency(data.yearlyExpenses)}.`;
    case 'income_month':
      return language === 'es'
        ? `Este mes has ganado ${formatCurrency(data.monthlyIncome)}.`
        : `This month you've earned ${formatCurrency(data.monthlyIncome)}.`;
    case 'income_year':
      return language === 'es'
        ? `Este año has ganado ${formatCurrency(data.yearlyIncome)}.`
        : `This year you've earned ${formatCurrency(data.yearlyIncome)}.`;
    case 'balance':
      const balanceStatus = data.balance >= 0 
        ? (language === 'es' ? 'positivo' : 'positive')
        : (language === 'es' ? 'negativo' : 'negative');
      return language === 'es'
        ? `Tu balance es ${formatCurrency(data.balance)} (${balanceStatus}).`
        : `Your balance is ${formatCurrency(data.balance)} (${balanceStatus}).`;
    case 'client_count':
      return language === 'es'
        ? `Tienes ${data.clientCount} cliente${data.clientCount !== 1 ? 's' : ''} registrado${data.clientCount !== 1 ? 's' : ''}.`
        : `You have ${data.clientCount} registered client${data.clientCount !== 1 ? 's' : ''}.`;
    case 'project_count':
      return language === 'es'
        ? `Tienes ${data.projectCount} proyecto${data.projectCount !== 1 ? 's' : ''}.`
        : `You have ${data.projectCount} project${data.projectCount !== 1 ? 's' : ''}.`;
    case 'pending_receipts':
      return language === 'es'
        ? `Tienes ${data.pendingReceipts} recibo${data.pendingReceipts !== 1 ? 's' : ''} pendiente${data.pendingReceipts !== 1 ? 's' : ''} de revisar.`
        : `You have ${data.pendingReceipts} pending receipt${data.pendingReceipts !== 1 ? 's' : ''} to review.`;
    case 'biggest_expense':
      if (!data.biggestExpense) {
        return language === 'es'
          ? 'No tienes gastos registrados aún.'
          : "You don't have any expenses recorded yet.";
      }
      return language === 'es'
        ? `Tu mayor gasto es ${formatCurrency(data.biggestExpense.amount)}${data.biggestExpense.vendor ? ` en ${data.biggestExpense.vendor}` : ''}.`
        : `Your biggest expense is ${formatCurrency(data.biggestExpense.amount)}${data.biggestExpense.vendor ? ` at ${data.biggestExpense.vendor}` : ''}.`;
    case 'top_category':
      if (!data.topCategory) {
        return language === 'es'
          ? 'No tienes gastos categorizados aún.'
          : "You don't have any categorized expenses yet.";
      }
      return language === 'es'
        ? `Tu categoría con más gastos es "${data.topCategory.category}" con ${formatCurrency(data.topCategory.amount)}.`
        : `Your top spending category is "${data.topCategory.category}" with ${formatCurrency(data.topCategory.amount)}.`;
    case 'tax_summary':
      return language === 'es'
        ? `Resumen fiscal: Ingresos ${formatCurrency(data.yearlyIncome)}, gastos deducibles ${formatCurrency(data.deductibleTotal)}, impuesto estimado ${formatCurrency(data.estimatedTaxOwed)}.`
        : `Tax summary: Income ${formatCurrency(data.yearlyIncome)}, deductible expenses ${formatCurrency(data.deductibleTotal)}, estimated tax ${formatCurrency(data.estimatedTaxOwed)}.`;
    case 'tax_owed':
      return language === 'es'
        ? `Tu impuesto estimado es ${formatCurrency(data.estimatedTaxOwed)} (aproximación del 25%).`
        : `Your estimated tax owed is ${formatCurrency(data.estimatedTaxOwed)} (25% approximation).`;
    case 'deductible_total':
      return language === 'es'
        ? `Tus gastos deducibles suman ${formatCurrency(data.deductibleTotal)}.`
        : `Your deductible expenses total ${formatCurrency(data.deductibleTotal)}.`;
    case 'billable_total':
      return language === 'es'
        ? `Tienes ${formatCurrency(data.billableTotal)} en gastos facturables a clientes.`
        : `You have ${formatCurrency(data.billableTotal)} in client-billable expenses.`;
    
    // ===== NEW QUERY TYPES =====
    case 'month_comparison': {
      const lastMonth = data.lastMonthExpenses ?? 0;
      const diff = data.monthlyExpenses - lastMonth;
      const diffPercent = lastMonth > 0 ? ((diff / lastMonth) * 100).toFixed(0) : 0;
      const trend = diff > 0 ? (language === 'es' ? 'más' : 'more') : (language === 'es' ? 'menos' : 'less');
      return language === 'es'
        ? `Este mes: ${formatCurrency(data.monthlyExpenses)}. Mes anterior: ${formatCurrency(lastMonth)}. ${diff !== 0 ? `Gastaste ${formatCurrency(Math.abs(diff))} (${Math.abs(Number(diffPercent))}%) ${trend}.` : 'Sin cambios.'}`
        : `This month: ${formatCurrency(data.monthlyExpenses)}. Last month: ${formatCurrency(lastMonth)}. ${diff !== 0 ? `You spent ${formatCurrency(Math.abs(diff))} (${Math.abs(Number(diffPercent))}%) ${trend}.` : 'No change.'}`;
    }
    case 'subscriptions_list': {
      if (!data.subscriptions || data.subscriptions.length === 0) {
        return language === 'es'
          ? 'No he detectado suscripciones recurrentes todavía. Importa tu estado bancario para analizarlas.'
          : "I haven't detected recurring subscriptions yet. Import your bank statement to analyze them.";
      }
      const total = data.subscriptions.reduce((sum, s) => sum + s.amount, 0);
      const list = data.subscriptions.slice(0, 5).map(s => s.name).join(', ');
      return language === 'es'
        ? `Tienes ${data.subscriptions.length} suscripciones que suman ${formatCurrency(total)}/mes: ${list}${data.subscriptions.length > 5 ? '...' : ''}.`
        : `You have ${data.subscriptions.length} subscriptions totaling ${formatCurrency(total)}/month: ${list}${data.subscriptions.length > 5 ? '...' : ''}.`;
    }
    case 'savings_needed': {
      // Basic savings calculation
      const monthlyNet = data.monthlyIncome - data.monthlyExpenses;
      return language === 'es'
        ? `Tu capacidad de ahorro actual es ${formatCurrency(monthlyNet)}/mes. Para alcanzar metas específicas, ve al calculador FIRE en el Dashboard.`
        : `Your current savings capacity is ${formatCurrency(monthlyNet)}/month. For specific goal calculations, check the FIRE calculator on the Dashboard.`;
    }
    case 'cash_flow_projection': {
      const monthlyNet = data.monthlyIncome - data.monthlyExpenses;
      const projectedAnnual = monthlyNet * 12;
      return language === 'es'
        ? `Flujo mensual: ${formatCurrency(monthlyNet)}. Proyección anual: ${formatCurrency(projectedAnnual)}. ${monthlyNet >= 0 ? '¡Vas bien!' : 'Considera reducir gastos.'}`
        : `Monthly cash flow: ${formatCurrency(monthlyNet)}. Annual projection: ${formatCurrency(projectedAnnual)}. ${monthlyNet >= 0 ? 'Looking good!' : 'Consider reducing expenses.'}`;
    }
    case 'expense_by_category': {
      if (!data.categoryBreakdown || data.categoryBreakdown.length === 0) {
        return language === 'es'
          ? 'No tengo suficientes datos para el desglose por categoría.'
          : "I don't have enough data for category breakdown.";
      }
      const top3 = data.categoryBreakdown.slice(0, 3).map(c => 
        `${c.category}: ${formatCurrency(c.amount)} (${c.percentage}%)`
      ).join(', ');
      return language === 'es'
        ? `Tus principales categorías: ${top3}.`
        : `Your top categories: ${top3}.`;
    }
    case 'income_by_source': {
      if (!data.incomeBreakdown || data.incomeBreakdown.length === 0) {
        return language === 'es'
          ? 'No tengo suficientes datos para el desglose de ingresos.'
          : "I don't have enough data for income breakdown.";
      }
      const top3 = data.incomeBreakdown.slice(0, 3).map(s => 
        `${s.source}: ${formatCurrency(s.amount)} (${s.percentage}%)`
      ).join(', ');
      return language === 'es'
        ? `Tus principales fuentes: ${top3}.`
        : `Your top sources: ${top3}.`;
    }
    case 'net_worth_summary': {
      if (!data.netWorth) {
        return language === 'es'
          ? 'No has registrado activos ni pasivos aún. Ve a Patrimonio para comenzar.'
          : "You haven't registered assets or liabilities yet. Go to Net Worth to start.";
      }
      return language === 'es'
        ? `Activos: ${formatCurrency(data.netWorth.assets)}. Pasivos: ${formatCurrency(data.netWorth.liabilities)}. Patrimonio neto: ${formatCurrency(data.netWorth.total)}.`
        : `Assets: ${formatCurrency(data.netWorth.assets)}. Liabilities: ${formatCurrency(data.netWorth.liabilities)}. Net worth: ${formatCurrency(data.netWorth.total)}.`;
    }
    case 'fire_progress': {
      if (!data.fireProgress) {
        return language === 'es'
          ? 'Configura tus metas FIRE en el Dashboard para ver tu progreso.'
          : 'Set up your FIRE goals in the Dashboard to see your progress.';
      }
      return language === 'es'
        ? `Progreso FIRE: ${data.fireProgress.percentage.toFixed(0)}%. Meta: ${formatCurrency(data.fireProgress.target)}. Actual: ${formatCurrency(data.fireProgress.current)}. Años restantes: ~${data.fireProgress.yearsToFire}.`
        : `FIRE progress: ${data.fireProgress.percentage.toFixed(0)}%. Target: ${formatCurrency(data.fireProgress.target)}. Current: ${formatCurrency(data.fireProgress.current)}. Years remaining: ~${data.fireProgress.yearsToFire}.`;
    }
    case 'mileage_summary': {
      if (!data.mileageSummary) {
        return language === 'es'
          ? 'No tienes viajes registrados. Ve a Kilometraje para agregar tus rutas de trabajo.'
          : "You don't have trips recorded. Go to Mileage to add your work routes.";
      }
      return language === 'es'
        ? `Kilometraje total: ${data.mileageSummary.totalKm} km en ${data.mileageSummary.totalTrips} viajes. Deducción estimada: ${formatCurrency(data.mileageSummary.deductionValue)}.`
        : `Total mileage: ${data.mileageSummary.totalKm} km in ${data.mileageSummary.totalTrips} trips. Estimated deduction: ${formatCurrency(data.mileageSummary.deductionValue)}.`;
    }
    default:
      return language === 'es'
        ? 'No pude obtener esa información.'
        : "I couldn't get that information.";
  }
}

/**
 * Genera respuesta para acciones avanzadas
 */
function generateAdvancedActionResponse(
  action: AdvancedAction,
  language: 'es' | 'en'
): string {
  switch (action.type) {
    case 'spending_alert':
      const categoryText = action.category 
        ? (language === 'es' ? ` en ${action.category}` : ` on ${action.category}`)
        : '';
      return language === 'es'
        ? `¡Alerta configurada! Te avisaré cuando gastes más de $${action.threshold}${categoryText}.`
        : `Alert set! I'll notify you when you spend more than $${action.threshold}${categoryText}.`;
    case 'reminder':
      return language === 'es'
        ? `¡Recordatorio guardado! Te recordaré "${action.action}" el ${action.dayOrDate}${action.time ? ` a las ${action.time}` : ''}.`
        : `Reminder saved! I'll remind you to "${action.action}" on ${action.dayOrDate}${action.time ? ` at ${action.time}` : ''}.`;
    case 'duplicate':
      const targetName = action.target === 'last_expense' 
        ? (language === 'es' ? 'el último gasto' : 'the last expense')
        : (language === 'es' ? 'el último ingreso' : 'the last income');
      return language === 'es'
        ? `Duplicando ${targetName}. ¿Confirmas?`
        : `Duplicating ${targetName}. Confirm?`;
    case 'export':
      const exportTypeNames: Record<string, { es: string; en: string }> = {
        tax_report: { es: 'reporte fiscal', en: 'tax report' },
        reimbursement: { es: 'reporte de reembolsos', en: 'reimbursement report' },
        all_expenses: { es: 'todos los gastos', en: 'all expenses' },
        all_income: { es: 'todos los ingresos', en: 'all income' },
        full_report: { es: 'reporte completo', en: 'full report' },
      };
      const typeName = exportTypeNames[action.exportType]?.[language] || action.exportType;
      return language === 'es'
        ? `Preparando ${typeName} en formato ${action.format?.toUpperCase() || 'Excel'}. Te lo descargo en un momento.`
        : `Preparing ${typeName} in ${action.format?.toUpperCase() || 'Excel'} format. Downloading shortly.`;
    default:
      return language === 'es' ? 'Procesando tu solicitud...' : 'Processing your request...';
  }
}

/**
 * Procesa un comando de voz siguiendo la cadena de prioridades
 * Retorna el resultado del primer handler que maneje el comando
 */
export function processVoiceCommand(
  text: string,
  context: ProcessorContext
): ProcessingResult {
  const { language, isOnboardingMicTest, isWaitingForConfirmation, currentPath, clients } = context;
  const trimmed = text.trim();
  
  if (!trimmed) {
    return { handled: false };
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
  // PRIORITY 2: LANGUAGE SWITCH COMMANDS
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
  // PRIORITY 3: CONFIRMATION PENDING
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
  // PRIORITY 4: CUSTOM SHORTCUTS (user-defined)
  // ─────────────────────────────────────────────────────────────
  const customShortcut = context.checkCustomShortcut(trimmed);
  if (customShortcut && customShortcut.route) {
    return { 
      handled: true, 
      type: 'custom-shortcut', 
      route: customShortcut.route, 
      name: customShortcut.name[language],
      action: customShortcut.action
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 5: TUTORIAL REQUESTS
  // "cómo capturo un gasto", "how do I add income"
  // ─────────────────────────────────────────────────────────────
  const tutorial = context.findTutorial(trimmed);
  if (tutorial) {
    return { 
      handled: true, 
      type: 'tutorial', 
      tutorialId: tutorial.id, 
      response: '' // Response will be formatted by caller
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 6: EXPENSE CREATION
  // "gasté 50 en uber", "spent 100 at amazon"
  // ─────────────────────────────────────────────────────────────
  const parsedExpense = parseVoiceExpense(trimmed);
  if (parsedExpense) {
    return { handled: true, type: 'expense-creation', data: parsedExpense };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 7: INCOME CREATION
  // "recibí 1000 de cliente", "received 500 from client"
  // ─────────────────────────────────────────────────────────────
  const parsedIncome = parseVoiceIncome(trimmed);
  if (parsedIncome) {
    return { handled: true, type: 'income-creation', data: parsedIncome };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 8: PAGE CONTEXT QUERY (ALWAYS LOCAL)
  // "qué puedo hacer aquí" - Uses REAL current route
  // ─────────────────────────────────────────────────────────────
  if (isPageContextQuery(trimmed, language)) {
    const page = context.getPageContext();
    const response = language === 'es'
      ? `${page.description} Dime "agregar" para crear algo, "muéstrame" para navegar, o "abre el cliente NOMBRE" para acceder a un cliente específico.`
      : `${page.description} Say "add" to create something, "show" to navigate, or "open client NAME" to access a specific client.`;
    return { handled: true, type: 'page-context', response, currentPath };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 9: OPEN CLIENT BY NAME (ALWAYS LOCAL)
  // "abre el cliente ACME", "open client ACME Corporation"
  // ─────────────────────────────────────────────────────────────
  const requestedClientName = parseOpenClientCommand(trimmed, language);
  if (requestedClientName && clients) {
    const normalize = (s: string) => normalizeText(s);
    const needle = normalize(requestedClientName);
    
    const target = 
      clients.find(c => normalize(c.name) === needle) ||
      clients.find(c => normalize(c.name).includes(needle)) ||
      clients.find(c => needle.includes(normalize(c.name)));
    
    if (target) {
      const response = language === 'es'
        ? `Abriendo el cliente ${target.name}.`
        : `Opening client ${target.name}.`;
      return { handled: true, type: 'open-client', clientId: target.id, clientName: target.name, response };
    } else {
      const response = language === 'es'
        ? `No encontré un cliente llamado "${requestedClientName}". Dime "muéstrame mis clientes" para ver la lista.`
        : `I couldn't find a client named "${requestedClientName}". Say "show my clients" to see the list.`;
      return { handled: true, type: 'page-context', response, currentPath: '/clients' };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 10: NAVIGATION COMMANDS (LOCAL)
  // "llévame a gastos", "show my expenses", "go to dashboard"
  // ─────────────────────────────────────────────────────────────
  const navCommand = findNavigationCommand(trimmed, language);
  if (navCommand) {
    const response = language === 'es'
      ? `Te llevo a ${navCommand.name}.`
      : `Taking you to ${navCommand.name}.`;
    return { 
      handled: true, 
      type: 'navigation', 
      route: navCommand.route, 
      name: navCommand.name, 
      action: navCommand.action,
      response 
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 11: DATA QUERIES (LOCAL)
  // "cuánto gasté este mes", "what's my balance"
  // ─────────────────────────────────────────────────────────────
  const queryType = findDataQuery(trimmed, language);
  if (queryType) {
    const response = generateQueryResponse(queryType, context.financialData, language);
    return { handled: true, type: 'data-query', queryType, response };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 12: ADVANCED ACTIONS (LOCAL)
  // Alerts, reminders, duplicates, exports
  // ─────────────────────────────────────────────────────────────
  const advancedAction = parseAdvancedAction(trimmed);
  if (advancedAction) {
    const response = generateAdvancedActionResponse(advancedAction, language);
    return { handled: true, type: 'advanced-action', action: advancedAction, response };
  }

  // ─────────────────────────────────────────────────────────────
  // PRIORITY 13: AI FALLBACK
  // Everything else goes to the AI for intelligent response
  // ─────────────────────────────────────────────────────────────
  return { handled: true, type: 'ai-fallback' };
}
