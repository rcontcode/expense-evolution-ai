/**
 * useAssistantContext - Hook para recopilar contexto rico de la UI
 * 
 * Este hook extrae información contextual de la página actual para enviar
 * al asistente IA, permitiendo respuestas más inteligentes y contextuales.
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useExpenses } from '@/hooks/data/useExpenses';
import { useEntity } from '@/contexts/EntityContext';
import { useIncome } from '@/hooks/data/useIncome';
import { useClients } from '@/hooks/data/useClients';
import { useProjects } from '@/hooks/data/useProjects';
import { useDashboardStats } from '@/hooks/data/useDashboardStats';
import { useProfile } from '@/hooks/data/useProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Tipos de gráficos que pueden estar visibles en cada página
const PAGE_CHARTS: Record<string, string[]> = {
  '/dashboard': ['expenses_by_category', 'monthly_trend', 'income_vs_expenses', 'balance_summary'],
  '/expenses': ['category_breakdown', 'vendor_top_10', 'monthly_expenses'],
  '/income': ['income_by_source', 'income_trend', 'client_revenue'],
  '/banking': ['transaction_analysis', 'recurring_payments', 'spending_patterns'],
  '/net-worth': ['assets_breakdown', 'liabilities', 'net_worth_trend'],
  '/mentorship': ['fire_progress', 'savings_rate', 'financial_independence'],
  '/notifications': [],
  '/reconciliation': [],
  '/tax-calendar': ['tax_estimates'],
  '/chaos': [],
  '/tags': [],
  '/contracts': [],
  '/business-profile': [],
  '/capture': [],
  '/adventure': [],
};

// Acciones disponibles por página
const PAGE_ACTIONS: Record<string, { es: string; en: string }[]> = {
  '/dashboard': [
    { es: 'capturar gasto', en: 'capture expense' },
    { es: 'ver resumen', en: 'view summary' },
    { es: 'abrir calculador FIRE', en: 'open FIRE calculator' },
  ],
  '/expenses': [
    { es: 'agregar gasto', en: 'add expense' },
    { es: 'filtrar por categoría', en: 'filter by category' },
    { es: 'exportar gastos', en: 'export expenses' },
    { es: 'captura rápida', en: 'quick capture' },
  ],
  '/income': [
    { es: 'agregar ingreso', en: 'add income' },
    { es: 'filtrar por fuente', en: 'filter by source' },
    { es: 'ver análisis', en: 'view analysis' },
  ],
  '/clients': [
    { es: 'agregar cliente', en: 'add client' },
    { es: 'buscar cliente', en: 'search client' },
    { es: 'ver detalles', en: 'view details' },
  ],
  '/projects': [
    { es: 'crear proyecto', en: 'create project' },
    { es: 'ver balance', en: 'view balance' },
  ],
  '/banking': [
    { es: 'subir estado de cuenta', en: 'upload statement' },
    { es: 'analizar transacciones', en: 'analyze transactions' },
    { es: 'preguntar sobre finanzas', en: 'ask about finances' },
  ],
  '/net-worth': [
    { es: 'agregar activo', en: 'add asset' },
    { es: 'agregar pasivo', en: 'add liability' },
    { es: 'ver evolución', en: 'view evolution' },
  ],
  '/notifications': [
    { es: 'marcar todo como leído', en: 'mark all as read' },
    { es: 'filtrar por tipo', en: 'filter by type' },
    { es: 'limpiar notificaciones', en: 'clear notifications' },
  ],
  '/reconciliation': [
    { es: 'importar estado bancario', en: 'import bank statement' },
    { es: 'emparejar transacciones', en: 'match transactions' },
    { es: 'resolver discrepancias', en: 'resolve discrepancies' },
  ],
  '/tax-calendar': [
    { es: 'ver próximas fechas', en: 'view upcoming dates' },
    { es: 'estimar impuestos', en: 'estimate taxes' },
    { es: 'configurar recordatorios', en: 'set reminders' },
  ],
  '/mentorship': [
    { es: 'ver cuadrante Kiyosaki', en: 'view Kiyosaki quadrant' },
    { es: 'registrar hábito financiero', en: 'log financial habit' },
    { es: 'explorar biblioteca', en: 'explore library' },
    { es: 'escribir diario financiero', en: 'write financial journal' },
  ],
  '/chaos': [
    { es: 'revisar documentos pendientes', en: 'review pending documents' },
    { es: 'escanear recibo', en: 'scan receipt' },
    { es: 'procesar con IA', en: 'process with AI' },
  ],
  '/contracts': [
    { es: 'subir contrato', en: 'upload contract' },
    { es: 'ver términos extraídos', en: 'view extracted terms' },
    { es: 'revisar vencimientos', en: 'review expirations' },
  ],
  '/mileage': [
    { es: 'registrar viaje', en: 'log trip' },
    { es: 'ver deducciones', en: 'view deductions' },
    { es: 'exportar reporte', en: 'export report' },
  ],
  '/tags': [
    { es: 'crear etiqueta', en: 'create tag' },
    { es: 'organizar etiquetas', en: 'organize tags' },
  ],
  '/settings': [
    { es: 'cambiar idioma', en: 'change language' },
    { es: 'configurar moneda', en: 'configure currency' },
    { es: 'ajustar presupuestos', en: 'adjust budgets' },
  ],
  '/business-profile': [
    { es: 'actualizar datos fiscales', en: 'update tax data' },
    { es: 'cambiar país', en: 'change country' },
    { es: 'configurar entidad', en: 'configure entity' },
  ],
  '/capture': [
    { es: 'tomar foto de recibo', en: 'take receipt photo' },
    { es: 'captura múltiple', en: 'multi capture' },
  ],
};

export interface ChartData {
  chartId: string;
  chartType: 'pie' | 'bar' | 'line' | 'area';
  title: string;
  data: Array<{ label: string; value: number; percentage?: number }>;
  period?: string;
}

export interface AssistantContext {
  // Página actual
  currentPage: {
    path: string;
    name: { es: string; en: string };
    description: { es: string; en: string };
  };
  
  // Gráficos visibles con datos
  visibleCharts: ChartData[];
  
  // Período seleccionado (si aplica)
  selectedPeriod: {
    start: string;
    end: string;
    label: string;
  } | null;
  
  // Filtros activos
  activeFilters: Record<string, string>;
  
  // Acciones disponibles
  availableActions: { es: string; en: string }[];
  
  // Datos financieros resumidos
  financialSummary: {
    monthlyExpenses: number;
    monthlyIncome: number;
    yearlyExpenses: number;
    yearlyIncome: number;
    balance: number;
    netWorth?: number;
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
    topVendors: Array<{ vendor: string; amount: number; count: number }>;
    recentTransactions: Array<{ description: string; amount: number; date: string; type: 'expense' | 'income' }>;
  };
  
  // Contexto del usuario
  userContext: {
    userName: string;
    clientCount: number;
    projectCount: number;
    pendingReceipts: number;
  };
  
  // Historial de conversación reciente (para memoria contextual)
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const PAGE_NAMES: Record<string, { es: string; en: string }> = {
  '/dashboard': { es: 'Dashboard', en: 'Dashboard' },
  '/expenses': { es: 'Gastos', en: 'Expenses' },
  '/income': { es: 'Ingresos', en: 'Income' },
  '/clients': { es: 'Clientes', en: 'Clients' },
  '/projects': { es: 'Proyectos', en: 'Projects' },
  '/contracts': { es: 'Contratos', en: 'Contracts' },
  '/mileage': { es: 'Kilometraje', en: 'Mileage' },
  '/net-worth': { es: 'Patrimonio Neto', en: 'Net Worth' },
  '/banking': { es: 'Análisis Bancario', en: 'Banking Analysis' },
  '/settings': { es: 'Configuración', en: 'Settings' },
  '/mentorship': { es: 'Mentoría Financiera', en: 'Financial Mentorship' },
  '/tax-calendar': { es: 'Calendario Fiscal', en: 'Tax Calendar' },
  '/notifications': { es: 'Notificaciones', en: 'Notifications' },
  '/reconciliation': { es: 'Conciliación Bancaria', en: 'Bank Reconciliation' },
  '/chaos': { es: 'Centro de Revisión', en: 'Review Center' },
  '/tags': { es: 'Etiquetas', en: 'Tags' },
  '/business-profile': { es: 'Perfil de Negocio', en: 'Business Profile' },
  '/capture': { es: 'Captura Rápida', en: 'Quick Capture' },
  '/adventure': { es: 'Aventura Financiera', en: 'Financial Adventure' },
  '/beta-feedback': { es: 'Feedback Beta', en: 'Beta Feedback' },
};

const PAGE_DESCRIPTIONS: Record<string, { es: string; en: string }> = {
  '/dashboard': {
    es: 'Vista general con resumen de finanzas, gráficos de tendencias, y acceso rápido a funciones principales.',
    en: 'Overview with financial summary, trend charts, and quick access to main features.',
  },
  '/expenses': {
    es: 'Gestión de gastos con filtros por fecha, categoría y tipo. Incluye captura rápida de recibos.',
    en: 'Expense management with date, category and type filters. Includes quick receipt capture.',
  },
  '/income': {
    es: 'Registro y análisis de ingresos por fuente, cliente y proyecto.',
    en: 'Income tracking and analysis by source, client and project.',
  },
  '/clients': {
    es: 'Gestión de clientes con información de contacto y configuración de facturación.',
    en: 'Client management with contact info and billing configuration.',
  },
  '/projects': {
    es: 'Administración de proyectos con presupuestos y seguimiento financiero.',
    en: 'Project management with budgets and financial tracking.',
  },
  '/banking': {
    es: 'Análisis de estados de cuenta bancarios con detección de patrones y pagos recurrentes.',
    en: 'Bank statement analysis with pattern detection and recurring payments.',
  },
  '/net-worth': {
    es: 'Seguimiento de patrimonio neto con activos, pasivos y evolución histórica.',
    en: 'Net worth tracking with assets, liabilities and historical evolution.',
  },
  '/notifications': {
    es: 'Tu centro de alertas: logros desbloqueados, metas alcanzadas, rachas, recordatorios de impuestos y tips financieros. Puedes filtrar por tipo (todas, sin leer, logros, metas), marcar como leídas o limpiar. Cada notificación puede llevarte a la sección relevante.',
    en: 'Your alert center: unlocked achievements, reached goals, streaks, tax reminders and financial tips. Filter by type (all, unread, achievements, goals), mark as read or clear. Each notification can take you to the relevant section.',
  },
  '/reconciliation': {
    es: 'Empareja transacciones bancarias con tus gastos registrados. Detecta discrepancias y gastos no registrados. Importa estados de cuenta y la IA sugiere coincidencias automáticas.',
    en: 'Match bank transactions with your recorded expenses. Detect discrepancies and unrecorded expenses. Import statements and AI suggests automatic matches.',
  },
  '/tax-calendar': {
    es: 'Fechas clave de impuestos para tu país (CRA en Canadá, SII en Chile). Recordatorios personalizados, estimación de impuestos a pagar, y configuración de perfil fiscal.',
    en: 'Key tax dates for your country (CRA in Canada, SII in Chile). Custom reminders, tax payment estimates, and tax profile setup.',
  },
  '/mentorship': {
    es: 'Tu espacio de crecimiento financiero: Cuadrante de Kiyosaki (ESBI), clasificación de deudas, hábitos financieros con rachas, metas SMART, diario financiero, biblioteca educativa y sistema de XP/niveles.',
    en: 'Your financial growth space: Kiyosaki Quadrant (ESBI), debt classification, financial habits with streaks, SMART goals, financial journal, educational library and XP/level system.',
  },
  '/chaos': {
    es: 'Cola de documentos pendientes de revisar: recibos escaneados, PDFs sin procesar. La IA extrae datos automáticamente. Revisa, corrige y aprueba para enviar a gastos.',
    en: 'Queue of documents pending review: scanned receipts, unprocessed PDFs. AI extracts data automatically. Review, correct and approve to send to expenses.',
  },
  '/contracts': {
    es: 'Gestión de contratos con clientes. Sube PDFs y la IA extrae términos clave, fechas de vencimiento, valores y políticas de reembolso automáticamente.',
    en: 'Client contract management. Upload PDFs and AI automatically extracts key terms, expiration dates, values and reimbursement policies.',
  },
  '/mileage': {
    es: 'Registro de viajes de negocios para deducciones fiscales. Distancia, ruta, propósito y cálculo automático según tarifa oficial de tu país.',
    en: 'Business trip logging for tax deductions. Distance, route, purpose and automatic calculation based on your country official rate.',
  },
  '/tags': {
    es: 'Crea y organiza etiquetas personalizadas para clasificar tus gastos más allá de las categorías estándar.',
    en: 'Create and organize custom tags to classify your expenses beyond standard categories.',
  },
  '/settings': {
    es: 'Configura tu perfil, idioma, moneda, entidades fiscales, metas de ahorro y presupuestos por categoría.',
    en: 'Configure your profile, language, currency, tax entities, savings goals and category budgets.',
  },
  '/business-profile': {
    es: 'Configura tu perfil fiscal: país, provincia, moneda predeterminada y datos de negocio para cálculos correctos de impuestos.',
    en: 'Set up your tax profile: country, province, default currency and business data for correct tax calculations.',
  },
  '/capture': {
    es: 'Captura rápida de recibos con cámara. Toma fotos y la IA extrae automáticamente monto, fecha, comercio y categoría.',
    en: 'Quick receipt capture with camera. Take photos and AI automatically extracts amount, date, merchant and category.',
  },
};

export function useAssistantContext(): AssistantContext {
  const location = useLocation();
  const { language } = useLanguage();
  const { currentCurrency } = useEntity();
  const { data: expenses } = useExpenses();
  const { data: income } = useIncome();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();
  const { data: stats } = useDashboardStats();
  const { data: profile } = useProfile();

  const context = useMemo(() => {
    const currentPath = location.pathname;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = subMonths(now, 1);

    // Calcular datos financieros
    const monthlyExpenses = expenses?.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const monthlyIncome = income?.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    const yearlyExpenses = expenses?.filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear;
    }).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const yearlyIncome = income?.filter(i => {
      const d = new Date(i.date);
      return d.getFullYear() === currentYear;
    }).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    // Top categorías
    const categoryTotals = expenses?.reduce((acc, e) => {
      const cat = e.category || 'other';
      acc[cat] = (acc[cat] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>) || {};

    const totalExpenses = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Top vendors
    const vendorTotals = expenses?.reduce((acc, e) => {
      const vendor = e.vendor || 'Sin proveedor';
      if (!acc[vendor]) acc[vendor] = { amount: 0, count: 0 };
      acc[vendor].amount += Number(e.amount);
      acc[vendor].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>) || {};

    const topVendors = Object.entries(vendorTotals)
      .map(([vendor, data]) => ({ vendor, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Transacciones recientes (últimas 10)
    const recentExpenses = (expenses || [])
      .slice(0, 5)
      .map(e => ({
        description: e.description || e.vendor || 'Gasto',
        amount: -Number(e.amount),
        date: e.date,
        type: 'expense' as const,
      }));

    const recentIncome = (income || [])
      .slice(0, 5)
      .map(i => ({
        description: i.description || i.source || 'Ingreso',
        amount: Number(i.amount),
        date: i.date,
        type: 'income' as const,
      }));

    const recentTransactions = [...recentExpenses, ...recentIncome]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Construir datos de gráficos visibles según la página
    const visibleCharts: ChartData[] = [];
    const chartIds = PAGE_CHARTS[currentPath] || [];

    if (chartIds.includes('expenses_by_category') && topCategories.length > 0) {
      visibleCharts.push({
        chartId: 'expenses_by_category',
        chartType: 'pie',
        title: language === 'es' ? 'Gastos por Categoría' : 'Expenses by Category',
        data: topCategories.map(c => ({
          label: c.category,
          value: c.amount,
          percentage: c.percentage,
        })),
        period: format(now, 'MMMM yyyy'),
      });
    }

    if (chartIds.includes('monthly_trend')) {
      // Simplificado - en producción extraeríamos datos reales del gráfico
      visibleCharts.push({
        chartId: 'monthly_trend',
        chartType: 'line',
        title: language === 'es' ? 'Tendencia Mensual' : 'Monthly Trend',
        data: [
          { label: format(lastMonth, 'MMM'), value: stats?.totalExpenses || 0 },
          { label: format(now, 'MMM'), value: monthlyExpenses },
        ],
      });
    }

    const result: AssistantContext = {
      currentPage: {
        path: currentPath,
        name: PAGE_NAMES[currentPath] || { es: 'Página', en: 'Page' },
        description: PAGE_DESCRIPTIONS[currentPath] || { es: '', en: '' },
      },
      visibleCharts,
      selectedPeriod: {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd'),
        label: format(now, 'MMMM yyyy'),
      },
      activeFilters: {},
      availableActions: PAGE_ACTIONS[currentPath] || [],
      financialSummary: {
        monthlyExpenses,
        monthlyIncome,
        yearlyExpenses,
        yearlyIncome,
        balance: yearlyIncome - yearlyExpenses,
        topCategories,
        topVendors,
        recentTransactions,
      },
      userContext: {
        userName: profile?.full_name?.split(' ')[0] || 'Usuario',
        clientCount: clients?.length || 0,
        projectCount: projects?.length || 0,
        pendingReceipts: stats?.pendingDocs || 0,
      },
      conversationHistory: [], // Se llena desde el componente que usa el hook
    };

    return result;
  }, [location.pathname, expenses, income, clients, projects, stats, profile, language, currentCurrency]);

  return context;
}

/**
 * Serializa el contexto para enviar al backend
 */
export function serializeContextForAI(context: AssistantContext, language: 'es' | 'en', currency?: string): string {
  const { currentPage, visibleCharts, financialSummary, userContext, availableActions } = context;

  const activeCurrency = currency || 'CAD';
  const locale = activeCurrency === 'CLP' ? 'es-CL' : (language === 'es' ? 'es-CL' : 'en-CA');
  const decimals = activeCurrency === 'CLP' ? 0 : 2;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: activeCurrency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);

  let contextStr = `
## CONTEXTO DE LA PÁGINA ACTUAL
- Página: ${currentPage.name[language]} (${currentPage.path})
- Descripción: ${currentPage.description[language]}

## DATOS FINANCIEROS DEL USUARIO
- Nombre: ${userContext.userName}
- Gastos este mes: ${formatCurrency(financialSummary.monthlyExpenses)}
- Ingresos este mes: ${formatCurrency(financialSummary.monthlyIncome)}
- Balance mensual: ${formatCurrency(financialSummary.monthlyIncome - financialSummary.monthlyExpenses)}
- Gastos anuales: ${formatCurrency(financialSummary.yearlyExpenses)}
- Ingresos anuales: ${formatCurrency(financialSummary.yearlyIncome)}
- Clientes: ${userContext.clientCount}
- Proyectos: ${userContext.projectCount}
- Recibos pendientes: ${userContext.pendingReceipts}
`;

  if (financialSummary.topCategories.length > 0) {
    contextStr += `
## GASTOS POR CATEGORÍA (Top 5)
${financialSummary.topCategories.map(c => `- ${c.category}: ${formatCurrency(c.amount)} (${c.percentage}%)`).join('\n')}
`;
  }

  if (visibleCharts.length > 0) {
    contextStr += `
## GRÁFICOS VISIBLES EN PANTALLA
${visibleCharts.map(chart => {
  const dataStr = chart.data.slice(0, 5).map(d => 
    `  - ${d.label}: ${formatCurrency(d.value)}${d.percentage ? ` (${d.percentage}%)` : ''}`
  ).join('\n');
  return `### ${chart.title}${chart.period ? ` (${chart.period})` : ''}\n${dataStr}`;
}).join('\n\n')}
`;
  }

  if (financialSummary.recentTransactions.length > 0) {
    contextStr += `
## TRANSACCIONES RECIENTES
${financialSummary.recentTransactions.slice(0, 5).map(t => 
  `- ${t.date}: ${t.description} ${t.amount >= 0 ? '+' : ''}${formatCurrency(t.amount)}`
).join('\n')}
`;
  }

  if (availableActions.length > 0) {
    contextStr += `
## ACCIONES DISPONIBLES EN ESTA PÁGINA
${availableActions.map(a => `- ${a[language]}`).join('\n')}
`;
  }

  return contextStr;
}
