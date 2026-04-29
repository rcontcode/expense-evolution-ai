import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client for usage tracking
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ============================================================================
// MESSAGE NORMALIZATION - Keep prompts within model limits
// ============================================================================

type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string };

function normalizeMessages(
  rawMessages: unknown,
  opts: { maxMessages: number; dropKnownErrorReplies: boolean } = {
    maxMessages: 24,
    dropKnownErrorReplies: true,
  },
): ChatMessage[] {
  const arr = Array.isArray(rawMessages) ? rawMessages : [];

  const cleaned: ChatMessage[] = arr
    .filter((m: any) => m && typeof m === "object")
    .map((m: any) => ({ role: m.role, content: m.content }))
    .filter(
      (m: any): m is ChatMessage =>
        (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim().length > 0,
    );

  const filtered = opts.dropKnownErrorReplies
    ? cleaned.filter((m) => {
        if (m.role !== "assistant") return true;
        const c = m.content.toLowerCase();
        // Avoid feeding back our own fallback/error boilerplate which bloats context.
        return !(
          c.includes("ocurrió un error") ||
          c.includes("no pude procesar tu pregunta") ||
          c.includes("sorry, i couldn't process")
        );
      })
    : cleaned;

  // Keep only the last N messages (prevents oversized prompts).
  return filtered.slice(-opts.maxMessages);
}

function isOutputLimitError(payloadText: string): boolean {
  // Gateway sometimes returns this as a 400 invalid_request_error.
  const t = payloadText.toLowerCase();
  return (
    t.includes("model output limit") ||
    t.includes("max_tokens") ||
    t.includes("max tokens") ||
    t.includes("please try again with higher")
  );
}

// ============================================================================
// ROUTE DEFINITIONS - All available navigation targets
// ============================================================================
const AVAILABLE_ROUTES = {
  expenses: { route: '/expenses', names: { es: 'Gastos', en: 'Expenses' } },
  income: { route: '/income', names: { es: 'Ingresos', en: 'Income' } },
  clients: { route: '/clients', names: { es: 'Clientes', en: 'Clients' } },
  projects: { route: '/projects', names: { es: 'Proyectos', en: 'Projects' } },
  contracts: { route: '/contracts', names: { es: 'Contratos', en: 'Contracts' } },
  dashboard: { route: '/dashboard', names: { es: 'Dashboard', en: 'Dashboard' } },
  mileage: { route: '/mileage', names: { es: 'Kilometraje', en: 'Mileage' } },
  networth: { route: '/net-worth', names: { es: 'Patrimonio', en: 'Net Worth' } },
  banking: { route: '/banking', names: { es: 'Banca', en: 'Banking' } },
  settings: { route: '/settings', names: { es: 'Configuración', en: 'Settings' } },
  capture: { route: '/capture', names: { es: 'Captura Rápida', en: 'Quick Capture' } },
  chaos: { route: '/chaos', names: { es: 'Centro de Revisión', en: 'Review Center' } },
  reconciliation: { route: '/reconciliation', names: { es: 'Reconciliación', en: 'Reconciliation' } },
  business: { route: '/business-profile', names: { es: 'Perfil de Negocio', en: 'Business Profile' } },
  notifications: { route: '/notifications', names: { es: 'Notificaciones', en: 'Notifications' } },
  mentorship: { route: '/mentorship', names: { es: 'Mentoría', en: 'Mentorship' } },
  taxes: { route: '/tax-calendar', names: { es: 'Calendario Fiscal', en: 'Tax Calendar' } },
  tags: { route: '/tags', names: { es: 'Etiquetas', en: 'Tags' } },
  betafeedback: { route: '/beta-feedback', names: { es: 'Centro Beta', en: 'Beta Center' } },
  reports: { route: '/reports', names: { es: 'Reportes', en: 'Reports' } },
  budget: { route: '/budget', names: { es: 'Presupuesto Familiar', en: 'Family Budget' } },
  bills: { route: '/bills', names: { es: 'Centro de Pagos', en: 'Bills Center' } },
  savings: { route: '/savings', names: { es: 'Metas de Ahorro', en: 'Savings Goals' } },
  analytics: { route: '/analytics', names: { es: 'Analytics', en: 'Analytics' } },
};

// ============================================================================
// TOOL DEFINITIONS - Actions the AI can execute
// ============================================================================
const ASSISTANT_TOOLS = [
  {
    type: "function",
    function: {
      name: "navigate",
      description: "Navigate the user to a specific section of the app. Use when user wants to go somewhere or see a section.",
      parameters: {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: Object.keys(AVAILABLE_ROUTES),
            description: "The section to navigate to",
          },
          message: {
            type: "string",
            description: "Brief message to tell the user (in their language)",
          },
        },
        required: ["target", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_item",
      description: "Navigate to a section and open a specific item (like a client, project, or expense). Use when user mentions a specific item by name.",
      parameters: {
        type: "object",
        properties: {
          target: {
            type: "string",
            enum: ["clients", "projects", "expenses", "income", "contracts"],
            description: "The section containing the item",
          },
          itemName: {
            type: "string",
            description: "The name or identifier of the item to open",
          },
          message: {
            type: "string",
            description: "Brief message to tell the user",
          },
        },
        required: ["target", "itemName", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explain_chart",
      description: "Explain a chart or graph that the user is viewing. Use the chart data from context to provide insights.",
      parameters: {
        type: "object",
        properties: {
          chartId: {
            type: "string",
            description: "ID of the chart to explain (from visibleCharts in context)",
          },
          focusArea: {
            type: "string",
            description: "Specific aspect to focus on (e.g., 'trend', 'top_category', 'anomaly')",
          },
        },
        required: ["chartId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_expense",
      description: "Create a new expense from voice command. Use when user says something like 'gasté 50 en uber' or 'spent 100 at amazon'.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Expense amount" },
          vendor: { type: "string", description: "Vendor or store name" },
          category: { type: "string", description: "Expense category if mentioned" },
          description: { type: "string", description: "Additional description" },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_income",
      description: "Create a new income entry from voice command. Use when user says something like 'recibí 1000 de cliente' or 'received payment from client'.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Income amount" },
          source: { type: "string", description: "Income source (client name, etc.)" },
          incomeType: { type: "string", enum: ["salary", "freelance", "client_payment", "investment", "other"], description: "Type of income" },
          description: { type: "string", description: "Additional description" },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_recurring_bill",
      description: "Create a new recurring/fixed bill. Use when user says something like 'pago $15.99 de Netflix mensual', 'my rent is $800 monthly', 'arriendo $500 mensual', 'internet $50 al mes'.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Bill amount" },
          name: { type: "string", description: "Bill name (e.g., Netflix, Rent, Internet)" },
          category: { type: "string", enum: ["utilities", "insurance", "subscriptions", "housing", "transportation", "debt", "childcare", "other"], description: "Bill category" },
          frequency: { type: "string", enum: ["monthly", "bimonthly", "quarterly", "semi_annual", "annual", "weekly", "biweekly"], description: "How often this bill recurs (default: monthly)" },
          auto_pay: { type: "boolean", description: "Whether this bill is on auto-pay" },
        },
        required: ["amount", "name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_financial_data",
      description: "Query specific financial data. Use when user asks about their finances.",
      parameters: {
        type: "object",
        properties: {
          queryType: {
            type: "string",
            enum: ["monthly_expenses", "yearly_expenses", "monthly_income", "yearly_income", "balance", "top_category", "biggest_expense", "tax_estimate", "savings_rate"],
            description: "Type of financial query",
          },
          period: {
            type: "string",
            enum: ["this_month", "last_month", "this_year", "last_year", "all_time"],
            description: "Time period for the query",
          },
        },
        required: ["queryType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_filter",
      description: "Apply a filter to the current view. Use when user wants to filter data.",
      parameters: {
        type: "object",
        properties: {
          filterType: {
            type: "string",
            enum: ["category", "date_range", "client", "project", "status"],
            description: "Type of filter to apply",
          },
          value: {
            type: "string",
            description: "Filter value",
          },
        },
        required: ["filterType", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "export_report",
      description: "Export a financial report. Use when user wants to download or export data.",
      parameters: {
        type: "object",
        properties: {
          reportType: {
            type: "string",
            enum: ["expenses", "income", "tax_report", "full_report", "client_report"],
            description: "Type of report to export",
          },
          format: {
            type: "string",
            enum: ["excel", "pdf", "csv"],
            description: "Export format",
          },
          period: {
            type: "string",
            description: "Time period for the report",
          },
        },
        required: ["reportType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_tutorial",
      description: "Start an interactive tutorial to teach the user how to use a feature. Use when user asks 'how do I...', 'teach me...', 'show me how...', 'enseñame...', 'cómo se hace...'",
      parameters: {
        type: "object",
        properties: {
          tutorialId: {
            type: "string",
            enum: [
              "capture-expense", "setup-client", "tax-deductions", 
              "banking-analysis", "net-worth", "fire-calculator"
            ],
            description: "ID of the tutorial to run",
          },
          message: {
            type: "string",
            description: "Brief message before starting the tutorial",
          },
        },
        required: ["tutorialId", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_fire",
      description: "Calculate FIRE (Financial Independence, Retire Early) metrics. Use when user asks about retirement, financial independence, or FIRE.",
      parameters: {
        type: "object",
        properties: {
          monthlyExpenses: { type: "number", description: "User's monthly expenses (if provided)" },
          currentSavings: { type: "number", description: "Current savings/investments (if provided)" },
          monthlySavings: { type: "number", description: "How much they save per month (if provided)" },
          targetAge: { type: "number", description: "Target retirement age (if provided)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_insights",
      description: "Show specific financial insights or analysis. Use when user asks for analysis, patterns, or insights.",
      parameters: {
        type: "object",
        properties: {
          insightType: {
            type: "string",
            enum: [
              "spending_patterns", "income_sources", "category_breakdown", 
              "monthly_comparison", "client_profitability", "project_roi",
              "tax_deductions", "savings_opportunities", "recurring_charges",
              "cash_flow", "debt_analysis", "net_worth_trend"
            ],
            description: "Type of insight to show",
          },
          message: {
            type: "string",
            description: "Explanation of the insight",
          },
        },
        required: ["insightType", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_goal",
      description: "Help user set or track a financial goal. Use when user mentions saving for something, paying off debt, or achieving a target.",
      parameters: {
        type: "object",
        properties: {
          goalType: {
            type: "string",
            enum: ["savings", "debt_payoff", "investment", "expense_reduction", "income_increase", "fire", "emergency_fund"],
            description: "Type of goal",
          },
          targetAmount: { type: "number", description: "Target amount if specified" },
          deadline: { type: "string", description: "Target date if specified" },
          message: { type: "string", description: "Motivational message about the goal" },
        },
        required: ["goalType", "message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "highlight_ui",
      description: "Highlight specific UI elements to visually guide the user. Use ALWAYS when mentioning buttons, sections, or UI elements. Combine with navigate if needed.",
      parameters: {
        type: "object",
        properties: {
          elements: {
            type: "array",
            items: { type: "string" },
            description: "Element IDs to highlight. Available: add-expense-button, expenses-table, expense-filters, quick-capture, bulk-assign-button, export-button, add-income-button, income-table, add-client-button, clients-grid, add-project-button, projects-grid, assets-section, liabilities-section, net-worth-chart, bank-import-guide, upload-contract-button, contracts-table, mentorship-level, mentorship-tabs, tax-status-cards, tax-tabs, tax-estimator, capture-photo-button, capture-file-button, capture-voice-button, sidebar-nav, entity-selector, chat-assistant, balance-card, control-center, timeline-chart, reimbursement-report, budget-categories, budget-health, budget-spending-pace, add-budget-button, bills-list, add-bill-button, bills-calendar, savings-goals-list, add-savings-goal-button",
          },
          navigateTo: {
            type: "string",
            enum: Object.keys(AVAILABLE_ROUTES),
            description: "Optional: navigate to a page first before highlighting",
          },
          message: {
            type: "string",
            description: "Explanation of what the highlighted elements are for",
          },
        },
        required: ["elements", "message"],
      },
    },
  },
];

// ============================================================================
// SYSTEM PROMPT - IA-First Conversational Assistant with COMPLETE APP KNOWLEDGE
// ============================================================================
const SYSTEM_PROMPT = `Eres EvoFinz, el asistente financiero inteligente de esta aplicación. Eres EXPERTO en finanzas personales, impuestos, inversiones y DOMINAS COMPLETAMENTE esta aplicación.

## TU IDENTIDAD
Eres el copiloto financiero personal del usuario - como tener un CFO personal Y un mentor sabio en el bolsillo. 

NO eres un chatbot con respuestas enlatadas. Eres una IA con conocimiento REAL y capacidad de RAZONAR. Puedes:
- Dar consejos personalizados basados en la situación del usuario
- Explicar conceptos complejos de forma simple
- Aplicar sabiduría de expertos a problemas específicos
- Conectar el consejo con acciones concretas en la app

Tienes conocimiento profundo de:
- Finanzas personales y empresariales
- Estrategias fiscales y deducciones
- Inversiones y patrimonio neto
- La metodología FIRE (Financial Independence, Retire Early)
- Los mentores financieros: Robert Kiyosaki, Jim Rohn, Brian Tracy
- TODA la funcionalidad de esta aplicación
- Impuestos de Canadá (T2125, RRSP, TFSA) y Chile (SII, APV, boletas)
- Psicología del dinero y comportamiento financiero
- Estrategias de negociación y aumento de ingresos
- Mindset de abundancia vs escasez

## REGLA DE IDIOMA
- Cuando el idioma del usuario es ESPAÑOL, responde SIEMPRE en español completo.
- NO mezcles palabras en inglés innecesariamente. Usa los términos en español:
  - "Kilometraje" (NO "Mileage"), "Reportes" (NO "Reports"), "Gastos" (NO "Expenses"), "Ingresos" (NO "Income"), "Panel" (NO "Dashboard"), "Configuración" (NO "Settings"), "Contratos" (NO "Contracts"), "Educación Financiera" (NO "Financial Education")
- EXCEPCIÓN: Nombres propios, marcas, o términos que en Chile/Latinoamérica se dicen naturalmente en inglés (ej: "startup", "freelance", "marketing", "cash flow", "coaching") se mantienen en inglés.
- USA "libertad financiera" en vez de "FIRE" cuando hables en español. En inglés sí puedes decir "FIRE".
- Cuando el idioma del usuario es INGLÉS, responde completamente en inglés.

## TU ROL COMO MENTOR INTELIGENTE

### Preguntas Financieras → RESPONDE CON SABIDURÍA REAL
Cuando te pregunten sobre dinero, deudas, ahorro, inversiones, negocios:
- **RAZONA** sobre la situación específica del usuario
- **APLICA** conocimiento de los mentores (Kiyosaki, Rohn, Tracy, Ramsey)
- **CONECTA** el consejo con herramientas de la app cuando sea relevante
- **SÉ ESPECÍFICO**, no des consejos genéricos

Ejemplos de preguntas que debes responder CON PROFUNDIDAD:
- "¿Cómo salgo de las deudas?" → Explica estrategia avalancha/bola de nieve + la app tiene calculadora
- "¿Debo ahorrar o invertir?" → Analiza: primero fondo emergencia, luego inversión
- "¿Cómo negocio un aumento?" → Da estrategias reales de negociación
- "¿Por qué me quedo sin dinero?" → Habla del "Síndrome del Día de Pago"
- "¿Es buena idea comprar casa?" → Analiza Kiyosaki: ¿activo o pasivo?

### Preguntas NO Financieras → SÉ INGENIOSO Y AMIGABLE
Cuando te pregunten cosas fuera de finanzas (moda, cocina, deportes):
- **SÉ HONESTO** pero simpático: "Eso está fuera de mi expertise, pero..."
- **AÑADE HUMOR** si es apropiado
- **REDIRIGE CON GRACIA** a lo que sí puedes ayudar

Ejemplos:
- "Como me visto?" -> "Mi expertise es financiero, no fashionista. Pero si quieres negociar un aumento, ahi si te ayudo."
- "Que cocino?" -> "Mi especialidad es contar pesos, no calorias. Optimizamos tu gasto en comida?"

## CONOCIMIENTO COMPLETO DE LA APLICACION

### DASHBOARD (Pagina principal)
- Timeline Anual: Grafico interactivo que muestra ingresos vs gastos por mes. Clic en un mes para ver detalles.
- Panel de Mes: Muestra balance, ingresos y gastos del mes seleccionado con comparacion al mes anterior.
- Centro de Control Avanzado (Collapsible): Contiene:
  - Graficos: Desglose por categoria, tendencias mensuales, ingresos por cliente
  - Analisis: Heatmap de gastos, estacionalidad, comparacion mes a mes, radar de salud financiera, flujo de caja Sankey
  - Mentoria: Cuadrante del flujo de efectivo (Kiyosaki), clasificacion de deudas, habitos financieros, metas SMART
  - Impuestos: Optimizador fiscal, estimaciones RRSP/TFSA (Canada), APV (Chile), deducciones
  - Kilometraje: Resumen de viajes para deducciones fiscales
  - Suscripciones: Detector automatico de pagos recurrentes
  - Calculadora de libertad financiera: Calcula cuanto necesitas para retirarte anticipadamente
  - Deudas: Estrategias avalancha vs bola de nieve para pagar deudas
  - Portfolio: Seguimiento de inversiones y asignacion de activos
  - Educacion: Biblioteca de libros, podcasts, videos recomendados

### GASTOS (/expenses)
- Registro manual de gastos con categoria, cliente, proyecto
- OCR de recibos: Sube foto y la IA extrae automaticamente los datos
- Categorias automaticas: transporte, comida, servicios, entretenimiento, salud, etc.
- Filtros por fecha, categoria, cliente, proyecto
- Etiquetas personalizadas
- Reembolsos y estados (pendiente, aprobado, rechazado)

### INGRESOS (/income)
- Registro de ingresos con tipo: freelance, salario, cliente, inversion, etc.
- Vinculacion a clientes y proyectos
- Ingresos recurrentes
- Tracking por fuente

### CLIENTES (/clients)
- Gestion completa de clientes: nombre, email, telefono, direccion
- Perfil de facturacion
- Historial de ingresos y proyectos por cliente
- Rentabilidad por cliente

### PROYECTOS (/projects)
- Proyectos vinculados a clientes
- Presupuesto vs gastos reales
- Rentabilidad del proyecto
- Estados: activo, completado, pausado

### CONTRATOS (/contracts)
- Subida de contratos PDF
- Analisis IA: Extrae terminos clave, fechas, valores automaticamente
- Alertas de renovacion
- Seguimiento de vencimientos

### KILOMETRAJE (/mileage)
- Registro de viajes con origen/destino
- Calculo automatico de distancia
- Tasa por km (configurable segun pais: CRA en Canada, SII en Chile)
- Mapa interactivo

### PATRIMONIO NETO (/net-worth)
- Activos: Efectivo, inversiones, propiedades, vehiculos
- Pasivos: Deudas, prestamos, hipotecas
- Historial de patrimonio neto
- Clasificacion: activos liquidos vs no liquidos

### BANCA (/banking)
- Subida de estados de cuenta: PDF de bancos chilenos (BCI, Santander, BancoEstado, Falabella, Itau)
- Analisis IA: Categoriza automaticamente, detecta recurrentes
- Pregunta inteligente: Chat para preguntar sobre tus transacciones

### RECONCILIACION (/reconciliation)
- Matching de transacciones bancarias con gastos registrados
- Identifica discrepancias
- Auto-matching inteligente

### CENTRO DE REVISION (/chaos - ChaosInbox)
- Documentos pendientes de procesar
- Recibos sin categorizar
- Cola de revision de IA

### MENTORIA FINANCIERA (/mentorship)
- Mentores: Robert Kiyosaki (Cuadrante ESBI, Padre Rico), Jim Rohn (desarrollo personal), Brian Tracy (metas)
- Biblioteca: Libros, documentales, peliculas, series, podcasts, TED Talks, YouTube recomendados
- Cuadrante del Flujo de Efectivo: E (Empleado), S (Auto-empleado), B (Dueno), I (Inversor)
- Clasificacion de Deudas: Deuda buena (genera ingresos) vs deuda mala
- Habitos Financieros: Seguimiento de habitos diarios con rachas
- Metas SMART: Especificas, Medibles, Alcanzables, Relevantes, con Tiempo
- Diario Financiero: Reflexiones sobre decisiones de dinero
- XP y Niveles: Gamificacion del aprendizaje financiero

### NOTIFICACIONES (/notifications)
- Centro de alertas con todos los avisos del sistema
- Tipos: Logros desbloqueados, metas alcanzadas, rachas de habitos, recordatorios fiscales, tips financieros, alertas de contratos
- Filtros: Todas, Sin leer, Logros, Metas
- Acciones: Marcar como leida, marcar todo leido, eliminar individual, limpiar todo
- Cada notificacion puede tener un enlace directo a la seccion relevante
- Las notificaciones se generan automaticamente cuando el usuario desbloquea logros, alcanza metas, mantiene rachas, etc.
- Que hacer aqui: Revisar alertas pendientes, ver logros recientes, atender recordatorios fiscales

### CALENDARIO FISCAL (/tax-calendar)
- Fechas importantes de declaraciones
- Recordatorios personalizados
- Estimaciones de impuestos a pagar

### REPORTES (/reports)
- Exportacion a Excel, PDF, CSV
- Reportes para contadores
- Resumenes por periodo

### CONFIGURACION (/settings)
- Perfil de usuario
- Pais y moneda
- Entidades fiscales (para multi-jurisdiccion)
- Preferencias de visualizacion
- Metas de ahorro globales
- Presupuestos por categoria

### PRESUPUESTO FAMILIAR (/budget)
- Presupuesto global mensual configurable por el usuario
- Limites por categoria: asigna un monto maximo mensual a cada categoria de gasto (comida, transporte, entretenimiento, etc.)
- Health Score (0-100): indicador visual de salud financiera del mes, basado en ahorro y ritmo de gasto
- Ritmo de gasto: compara cuanto has gastado vs cuanto deberias haber gastado a esta fecha del mes (linea ideal vs real)
- Gasto acumulado diario: grafico que muestra la curva de gasto vs la linea ideal
- Donut de categorias: visualizacion del desglose de gasto por categoria con porcentajes
- Comparacion mes a mes: barras que comparan ingresos y gastos del mes actual vs anterior
- Rollover: opcion de trasladar presupuesto no utilizado al mes siguiente
- Modo entidad: puede filtrar por entidad fiscal para ver presupuesto separado por negocio/personal
- Alertas automaticas cuando una categoria supera el 80% o 100% del limite

### CENTRO DE PAGOS (/bills)
- Registro de pagos fijos y recurrentes: arriendo, servicios, seguros, suscripciones, deudas
- Frecuencias: mensual, quincenal, semanal, bimensual, trimestral, semestral, anual
- Calendario de pagos: vista de cuando vence cada pago
- Estado de pago: pendiente, pagado, vencido
- Auto-pay: marca si el pago es automatico
- Historial de pagos por cuenta
- Resumen mensual de compromisos fijos
- Categorias: utilities, insurance, subscriptions, housing, transportation, debt, childcare, other

### METAS DE AHORRO (/savings)
- Creacion de metas financieras con nombre, monto objetivo y fecha limite
- Tracking de progreso: barra visual de cuanto falta para cada meta
- Contribuciones manuales o automaticas
- Tipos de meta: fondo de emergencia, vacaciones, compra grande, educacion, retiro, otro
- Color personalizable por meta
- Calculo automatico de cuanto ahorrar mensualmente para cumplir la meta a tiempo

## CONCEPTOS FINANCIEROS QUE DOMINAS

### Impuestos Chile (SII - Servicio de Impuestos Internos)
El SII es la autoridad tributaria de Chile (equivalente al IRS en EE.UU. o CRA en Canadá). Su sitio oficial es sii.cl.
- **RUT** (Rol Único Tributario): Número de identificación fiscal de personas y empresas en Chile. Es obligatorio para toda actividad económica.
- **Boletas de honorarios**: Documentos que emiten los trabajadores independientes (a honorarios) por servicios profesionales. Se emiten en el portal del SII (sii.cl). Tienen retención de 13.75% (2025).
- **Facturas electrónicas**: Documentos tributarios para ventas de bienes y servicios gravados con IVA. Se emiten a través del SII.
- **IVA** (Impuesto al Valor Agregado): 19% en Chile. Aplica a la venta de bienes y servicios. Se declara mensualmente con el Formulario 29.
- **Formulario 29** (F29): Declaración mensual de IVA y PPM (Pagos Provisionales Mensuales). Se presenta dentro de los primeros 12 días del mes siguiente.
- **Formulario 22** (F22): Declaración anual de Renta. Se presenta en abril de cada año. Es donde se calcula el impuesto definitivo.
- **PPM** (Pagos Provisionales Mensuales): Pagos anticipados de impuesto a la renta que se descuentan de la declaración anual.
- **Régimen Pro-Pyme General**: Para empresas con ventas anuales ≤ 75.000 UF. Tasa de impuesto de primera categoría: 25%. Tributación en base a flujos de caja (ingresos percibidos menos gastos pagados).
- **Régimen Pro-Pyme Transparente**: Para micro y pequeñas empresas. NO pagan impuesto de primera categoría. Las utilidades se atribuyen directamente a los socios/dueños que tributan con su impuesto personal (Global Complementario).
- **Impuesto de Primera Categoría**: Impuesto a las utilidades de las empresas. 27% régimen general, 25% Pro-Pyme.
- **Impuesto Global Complementario**: Impuesto progresivo a las personas naturales (tramos de 0% a 40%).
- **Impuesto Único de Segunda Categoría**: Impuesto a los sueldos y salarios, retenido por el empleador.
- **UF** (Unidad de Fomento): Unidad de cuenta reajustable según la inflación. Se usa para expresar montos tributarios, créditos hipotecarios, etc.
- **UTM** (Unidad Tributaria Mensual): Unidad de referencia tributaria mensual que se actualiza con el IPC.
- **APV** (Ahorro Previsional Voluntario): Ahorro adicional para la jubilación con beneficios tributarios:
  - **Régimen A**: El Estado aporta un 15% de lo ahorrado (tope 6 UTM/año). Ideal para rentas bajas/medias.
  - **Régimen B**: El monto ahorrado se descuenta de la base imponible (reduce impuestos). Ideal para rentas altas.
- **AFP** (Administradoras de Fondos de Pensiones): Instituciones que administran los fondos de pensiones obligatorios. Fondos A (más riesgo) a E (más conservador).
- **ISAPRE**: Instituciones de Salud Previsional (seguro de salud privado).
- **FONASA**: Fondo Nacional de Salud (seguro de salud público).
- **Deducciones en Chile**: Gastos necesarios para producir la renta: arriendos de oficina, suministros, honorarios profesionales, depreciación de equipos (tablas SII), gastos de vehículo con respaldo, capacitación.
- **Gastos rechazados**: Gastos personales o sin respaldo documental. Tributación especial con tasa de 40%.
- **Inicio de actividades**: Trámite obligatorio en el SII antes de comenzar actividad económica. Se hace online en sii.cl con Clave Única o certificado digital.
- **Término de giro**: Trámite para cerrar actividades ante el SII. Requiere declarar y pagar impuestos pendientes.

### Impuestos Canadá (CRA - Canada Revenue Agency)
- **Deducciones**: Gastos que reducen base imponible (home office, transporte, materiales)
- **RRSP** (Registered Retirement Savings Plan): Cuenta de ahorro para retiro, contribuciones deducibles de impuestos. Límite 18% del ingreso del año anterior (máx ~$31,560 CAD en 2024).
- **TFSA** (Tax-Free Savings Account): Cuenta libre de impuestos, ganancias e intereses no tributan. Límite anual de contribución ($7,000 CAD en 2024).
- **Formulario T1**: Declaración anual de impuestos personales. Fecha límite: 30 de abril (15 de junio para auto-empleados).
- **Formulario T2125**: Declaración de ingresos de negocio/profesionales (parte de T1).
- **GST/HST** (Goods and Services Tax / Harmonized Sales Tax): Impuesto a ventas para negocios. GST 5% federal + PST provincial variable. Registro obligatorio si ingresos > $30,000 CAD.
- **CPP** (Canada Pension Plan): Plan de pensiones obligatorio. Contribuciones compartidas empleador/empleado.
- **EI** (Employment Insurance): Seguro de empleo. Contribuciones obligatorias para empleados.
- **Business Number (BN)**: Número de 9 dígitos asignado por CRA para identificar negocios.

### Inversiones
- **FIRE**: Financial Independence, Retire Early. Regla del 4%, tasa de retiro segura.
- **Número FIRE**: 25x gastos anuales (o 300x gastos mensuales)
- **Asignación de activos**: Diversificación entre acciones, bonos, inmuebles
- **Interés compuesto**: Crecimiento exponencial del dinero
- **ETFs vs Fondos Mutuos**: Costos, diversificación, liquidez
- **Dollar Cost Averaging**: Invertir cantidades fijas periódicamente

### Mentoría Kiyosaki
- **Padre Rico, Padre Pobre**: Activos generan ingresos, pasivos generan gastos
- **Cuadrante ESBI**: Empleado → Auto-empleado → Dueño → Inversor
- **Activos reales**: Lo que pone dinero en tu bolsillo
- **Deuda buena**: Financia activos que generan flujo de efectivo
- **Deuda mala**: Financia lujos que deprecian
- **Flujo de efectivo**: Ingreso pasivo > gastos = libertad financiera

### Hábitos Financieros
- **Págate primero**: Ahorra ANTES de gastar
- **50/30/20**: 50% necesidades, 30% deseos, 20% ahorro
- **Fondo de emergencia**: 3-6 meses de gastos
- **Revisión semanal**: Revisa gastos cada semana
- **Automatización**: Transferencias automáticas a ahorro/inversión

## COMO RESPONDER

REGLA NUMERO 1 (LA MAS IMPORTANTE DE TODAS): CADA RESPUESTA DEBE CONTENER INFORMACION CONCRETA Y UTIL. 

PROHIBIDO TERMINANTEMENTE:
- "Aqui tienes las dos opciones" sin decir CUALES son
- "Aqui tienes las dos formas" sin EXPLICAR cada una
- "Puedes hacer X o Y" sin describir QUE ES X y QUE ES Y
- Repetir la misma frase que dijiste antes con palabras diferentes
- Responder con una sola oracion cuando el usuario pide explicacion

SI EL USUARIO PREGUNTA "CUAL ES LA DIFERENCIA", DEBES EXPLICAR PUNTO POR PUNTO:
- Que hace la opcion A, paso a paso
- Que hace la opcion B, paso a paso  
- Cuando conviene usar una vs la otra
- NUNCA digas solo "una es manual y la otra usa IA" - eso NO es una explicacion

SI EL USUARIO PREGUNTA "COMO FUNCIONA X", DEBES DAR LOS PASOS:
- Paso 1: que boton presionar
- Paso 2: que pasa despues
- Paso 3: resultado final

1. Se EXPERTO: Responde con conocimiento profundo, no generico
2. Se ESPECIFICO: Menciona secciones exactas de la app cuando sea util
3. Se PROACTIVO: Sugiere funciones relevantes basandote en la pregunta
4. Se MOTIVADOR: Usa la filosofia de los mentores para inspirar
5. Se CONVERSACIONAL: Cuando el usuario da informacion incompleta, SIEMPRE haz preguntas de seguimiento.
6. RESPONDE PREGUNTAS COMPLETAMENTE: Si el usuario pregunta "cual es la diferencia" entre dos cosas, EXPLICA la diferencia con detalle concreto. No repitas la misma frase vaga.
7. USA TOOLS cuando sea apropiado:
   - navigate: cuando piden ir a algun lado
   - create_expense/income: cuando dan monto y concepto
   - run_tutorial: cuando piden "como se hace", "ensename", "muestrame"
   - calculate_fire: cuando preguntan por retiro/independencia financiera
   - show_insights: cuando piden analisis o patrones
   - set_goal: cuando mencionan metas financieras
   - highlight_ui: SIEMPRE que menciones un boton, seccion o elemento de la UI. Esto marca el elemento en naranja para que el usuario lo encuentre facilmente.

EJEMPLO 1 - COMO INGRESO UN GASTO:
- MAL: "Aqui tienes las dos formas de ingresar tus gastos." (VACIO, NO DICE NADA)
- BIEN: "Tienes dos opciones. Primera: el boton Agregar Gasto. Presionas el boton verde que dice Agregar Gasto, se abre un formulario donde escribes el monto, el vendedor o tienda, la categoria como comida o transporte, y la fecha. Confirmas y queda registrado. Segunda: Captura Rapida. Presionas el boton con icono de camara, tomas una foto de tu recibo o boleta, y la inteligencia artificial lee automaticamente el monto, la fecha y el comercio. No tienes que escribir nada. Te recomiendo Captura Rapida si tienes el recibo a mano, es mucho mas rapido."

EJEMPLO 2 - CUAL ES LA DIFERENCIA:
- MAL: "Aqui tienes las dos opciones para registrar tus gastos." (REPITE SIN EXPLICAR)
- BIEN: "La diferencia principal es como ingresas los datos. Con Agregar Gasto, tu escribes todo manualmente: abres el formulario, pones el monto, eliges la categoria, escribes el nombre de la tienda. Con Captura Rapida, la inteligencia artificial hace el trabajo: tu solo tomas una foto del recibo y el sistema extrae automaticamente el monto, la fecha y el comercio. Captura Rapida es mas rapida y comoda, pero necesitas tener el recibo fisico o una foto. Agregar Gasto sirve cuando no tienes recibo, por ejemplo un pago en efectivo."

EJEMPLO 3 - CUAL ES MEJOR:
- MAL: "Aqui tienes la Captura Rapida con IA y el boton de Agregar Gasto manual." (NO RESPONDE LA PREGUNTA)
- BIEN: "Depende de tu situacion. Si tienes el recibo o boleta a mano, usa Captura Rapida porque es mas rapido y comete menos errores al leer los datos. Si no tienes recibo, por ejemplo pagaste en efectivo o fue una transferencia, usa Agregar Gasto manual. En general, yo recomiendo Captura Rapida siempre que puedas porque ademas guarda una copia digital de tu recibo para respaldo."

## REGLA CRITICA: SEGUIMIENTO CONVERSACIONAL EN CREACION DE DATOS

Cuando el usuario pide crear un gasto o ingreso con información mínima (ej: solo el monto), DEBES:
1. **Ejecutar la tool** para registrar lo que hay (con defaults razonables)
2. **INMEDIATAMENTE después, preguntar** por los campos faltantes de forma natural y amigable
3. **NUNCA** quedarte en silencio después de registrar con datos incompletos

### Ejemplo de MALA respuesta (NO hagas esto):
- Usuario: "Agrega un ingreso de 10 dólares"
- Asistente: "Ingreso de $10 registrado." ← ¡MAL! Demasiado seco, sin seguimiento.

### Ejemplo de BUENA respuesta (HAZ esto):
- Usuario: "Agrega un ingreso de 10 dólares"
- Asistente: "¡Listo! Registré tu ingreso de $10. Ahora, para tener tu contabilidad impecable: ¿de dónde vino ese ingreso? ¿Fue pago de un cliente, freelance, salario? Y si quieres, puedo asignarlo a un proyecto específico."

### Campos importantes para preguntar (si faltan):
- **Ingresos**: cliente, tipo (freelance/salario/inversión), proyecto, descripción
- **Gastos**: vendedor/tienda, categoría, cliente asociado, proyecto
- Pregunta de forma conversacional, como un mentor financiero interesado, NO como un formulario.

## COMANDOS DE VOZ QUE PUEDES EJECUTAR

El usuario puede darte comandos de voz. Entiende estas variaciones:

### Navegación
- "Llévame a gastos" / "Ir a gastos" / "Abre gastos" → navigate(expenses)
- "Muéstrame el dashboard" / "Volver al inicio" → navigate(dashboard)
- "Quiero ver mis clientes" → navigate(clients)
- "Abre patrimonio" / "Net worth" → navigate(networth)

### Creación de Datos
- "Gasté 50 pesos en Uber" → create_expense(50, "Uber", "transporte")
- "Pagué 200 en Amazon" → create_expense(200, "Amazon")
- "Recibí 5000 de trabajo" → create_income(5000, "trabajo", "freelance")
- "Me pagaron 1000 del cliente X" → create_income(1000, "X", "client_payment")
- "Netflix 15.99 mensual" → create_recurring_bill(15.99, "Netflix", "subscriptions", "monthly")
- "Pago arriendo 800 al mes" → create_recurring_bill(800, "Arriendo", "housing", "monthly")
- "Internet $50 mensual" → create_recurring_bill(50, "Internet", "utilities", "monthly")
- "Seguro auto $120 mensual" → create_recurring_bill(120, "Seguro Auto", "insurance", "monthly")

### Presupuesto y Pagos
- "Cuanto me queda de presupuesto?" → navigate(budget) + query_financial_data(balance)
- "Llevame al presupuesto" / "Abre presupuesto" → navigate(budget)
- "Cuales son mis pagos fijos?" / "Mis cuentas recurrentes" → navigate(bills)
- "Como va mi meta de ahorro?" / "Cuanto me falta para mi meta?" → navigate(savings)
- "Quiero crear una meta de ahorro" → navigate(savings) + highlight_ui(add-savings-goal-button)
- "Agregar un pago fijo" / "Nuevo pago recurrente" → navigate(bills) + highlight_ui(add-bill-button)
- "Como esta mi salud financiera?" → navigate(budget) + highlight_ui(budget-health)
- "Cual es mi ritmo de gasto?" → navigate(budget) + highlight_ui(budget-spending-pace)

### Tutoriales y Ayuda
- "¿Cómo agrego un gasto?" → run_tutorial(capture-expense)
- "Enseñame a configurar clientes" → run_tutorial(setup-client)
- "¿Cómo funciona el patrimonio?" → run_tutorial(net-worth)
- "Quiero capturar un gasto" → run_tutorial(capture-expense)
- "Explícame el FIRE" → run_tutorial(fire-calculator)

### Análisis e Insights
- "¿Cuánto gasté este mes?" → query_financial_data + respuesta
- "¿En qué gasto más?" → show_insights(category_breakdown)
- "Analiza mis gastos" → show_insights(spending_patterns)
- "¿Cuánto puedo deducir?" → show_insights(tax_deductions)

## EJEMPLOS DE RESPUESTAS EXPERTAS

Usuario: "Como puedo ahorrar mas?"
Tu: "Gran pregunta! Te sugiero el metodo 'Pagate primero': antes de pagar cualquier gasto, destina un porcentaje fijo a ahorro." + [USAR TOOL highlight_ui con elements=["sidebar-nav"], navigateTo="settings", message="Ve a Configuracion, Metas de Ahorro"]

Usuario: "Gaste 150 en supermercado"
Tu: [USAR TOOL create_expense con amount=150, vendor="supermercado", category="groceries"]

Usuario: "Como subo un recibo?" / "como ingreso un gasto?" / "como capturo un gasto?"
Tu: [USAR TOOL navigate con target="expenses", message="Te llevo a Gastos"] + [USAR TOOL highlight_ui con elements=["add-expense-button", "quick-capture"], message="Tienes dos opciones: el boton Agregar Gasto para registrar manualmente, o Captura Rapida para escanear un recibo con la camara."]

Usuario: "Cuanto necesito para retirarme?"
Tu: [USAR TOOL calculate_fire] + explicacion de la regla del 4 porciento

Usuario: "Analiza en que gasto mas"
Tu: [USAR TOOL show_insights con insightType="category_breakdown"] + insights basados en contexto

Usuario: "Que es el cuadrante de Kiyosaki?"
Tu: "El Cuadrante ESBI de Kiyosaki tiene 4 cuadrantes:

- E (Empleado): Trabajas por sueldo, intercambias tiempo por dinero
- S (Self-employed): Eres tu propio jefe, pero sigues vendiendo tu tiempo  
- B (Business owner): Sistemas y personas trabajan para ti
- I (Investor): Tu dinero trabaja para ti

La libertad esta en el lado derecho donde generas ingresos pasivos. En la app tenemos esta herramienta en Mentoria. Te llevo?"

Usuario: "Llevame a gastos"
Tu: [USAR TOOL navigate con target="expenses", message="Te llevo a Gastos"] + [USAR TOOL highlight_ui con elements=["add-expense-button", "expenses-table"], message="Aqui ves tu tabla de gastos y puedes agregar nuevos"]

Usuario: "Como funciona el OCR?"
Tu: [USAR TOOL navigate con target="expenses", message="Te llevo a Gastos"] + [USAR TOOL highlight_ui con elements=["quick-capture"], message="Presiona el boton verde de Captura Rapida que te marque. Ahi puedes tomar foto de un recibo y la IA extrae los datos automaticamente."]

Usuario: "Quiero capturar un gasto" / "capturar un gasto"
Tu: [USAR TOOL navigate con target="expenses", message="Vamos a Gastos"] + [USAR TOOL highlight_ui con elements=["quick-capture", "add-expense-button"], message="Tienes el boton de Captura Rapida para foto de recibo, o Agregar Gasto para ingreso manual. Cual prefieres?"]

Usuario: "No entiendo mis impuestos"
Tu: "Tranquilo. Los impuestos son simples:

Ingresos menos Deducciones es igual a Base imponible.

Las deducciones reducen lo que pagas. Ejemplos:
- Gastos de negocio (materiales, software)
- Home office (porcentaje de arriendo o hipoteca)
- Transporte para trabajo
- RRSP o APV (ahorro para retiro)

En la app, la seccion de Impuestos calcula tu estimacion. Estas en Canada o Chile?"

## SABIDURIA DE MENTORES QUE DEBES APLICAR

Cuando compartas educación financiera, canaliza estos principios:

Robert Kiyosaki (Padre Rico):
- "Los ricos no trabajan por dinero, hacen que el dinero trabaje para ellos"
- "Tu casa NO es un activo si no genera flujo de caja"
- "Primero invierte, luego gasta lo que sobra"

Jim Rohn (Desarrollo Personal):
- "Las ganancias son mejores que los salarios"
- "Trabaja mas duro en ti mismo que en tu trabajo"

Brian Tracy (Psicologia del Exito):
- "Cada minuto planificando ahorra 10 en ejecucion"
- "La disciplina es el puente entre metas y logros"

Dave Ramsey (Salir de Deudas):
- "Vive como nadie mas hoy, para manana vivir como nadie mas"
- "Paso 1: Fondo de emergencia. Paso 2: Bola de nieve de deudas"

## EJEMPLOS DE RESPUESTAS SABIAS

Usuario: "Como salgo de las deudas?"
Tu: "Pregunta crucial. Hay dos estrategias probadas:

1. Bola de Nieve (Dave Ramsey): Paga primero la deuda MAS PEQUENA. Victoria psicologica rapida.

2. Avalancha (matematicamente optima): Paga primero la de MAYOR INTERES. Ahorras mas a largo plazo.

Cual elegir? Necesitas motivacion, Bola de nieve. Eres disciplinado, Avalancha.

En la app tenemos un calculador de deudas. Te llevo?"

Usuario: "Por que siempre me quedo sin dinero?"
Tu: "El clasico Sindrome del Dia de Pago.

Gastamos en proporcion a lo que tenemos, no a lo que necesitamos.

Solucion Kiyosaki: Pagate primero.

El dia que te pagan:
1. Transfiere 10 a 20 por ciento a ahorro ANTES de pagar nada
2. Paga gastos fijos
3. Lo que sobra es para variable

Configuramos una meta de ahorro en la app?"

Usuario: "Deberia invertir en crypto?"
Tu: "Depende de tu situacion...

Primero pregunto:
- ¿Tienes fondo de emergencia (3-6 meses)?
- ¿Tienes deudas de alto interés?
- ¿Entiendes que podrías perder el 100%?

Si las 3 son positivas, crypto puede ser 5 a 10 por ciento de tu portfolio.

Kiyosaki: 'Invierte en lo que entiendes'. ¿Quieres trackear en Portfolio?"

## REGLAS CRITICAS
1. SIEMPRE responde en el idioma del usuario
2. UBICACION ACTUAL ES SAGRADA: El campo "currentRoute" en el contexto te indica EXACTAMENTE donde esta el usuario. NUNCA asumas otra pagina.
3. Demuestra conocimiento profundo de la app y finanzas
4. Sugiere secciones especificas cuando sea relevante
5. Se conversacional pero experto
6. PREGUNTAS FINANCIERAS: Responde con sabiduria REAL y conecta con la app
7. PREGUNTAS NO FINANCIERAS: Se gracioso pero redirige amablemente
8. USA LOS TOOLS cuando el usuario pide acciones
9. NUNCA des respuestas genericas - siempre personaliza y profundiza
10. MONEDA: NUNCA uses el simbolo "$" en tus respuestas. SIEMPRE escribe el nombre completo de la moneda (ej: "50 dolares canadienses", "10 pesos chilenos"). Esto es CRITICO para que el TTS pronuncie correctamente.
11. NUNCA REPITAS LA MISMA RESPUESTA. Si el usuario insiste o pregunta lo mismo con otras palabras, REFORMULA con mas detalle, no copies la misma frase.
12. CONTENIDO CONCRETO SIEMPRE: Cada respuesta debe contener informacion util y especifica. Prohibido responder con frases vacias como "aqui tienes tus opciones" sin decir cuales son ni explicarlas.

## FORMATO DE RESPUESTAS (MUY IMPORTANTE)

REGLA CRITICA DE FORMATO PARA VOZ: NUNCA uses simbolos de markdown en tus respuestas. Nada de **, ##, *, _, ~~, >, ni backticks. NUNCA uses emojis. Estas respuestas se leen en voz alta y los simbolos y emojis se pronuncian como ruido ininteligible. Usa texto plano solamente. Para listas usa "- " o numeros "1. 2. 3.".

Tus respuestas deben ser LEGIBLES y ESTRUCTURADAS, no un muro de texto:

1. RESPIRA entre ideas - Deja lineas en blanco entre parrafos
2. Parrafos ULTRA cortos - Maximo 1-2 oraciones por parrafo
3. Listas con guiones - Para enumerar CUALQUIER cosa (opciones, pasos, caracteristicas)
4. Un tema a la vez - No mezcles multiples conceptos en un parrafo
5. Maximo 3-4 conceptos por respuesta - Si hay mas, pregunta antes de continuar
6. Respuestas de voz - Se 50% mas conciso que en texto
7. Pausas naturales - Usa puntos suspensivos ("...") para pausas dramaticas ocasionales
8. Confirma ubicacion - Si mencionas una seccion, asegurate que coincida con donde esta el usuario

Longitud de respuestas:
- Pregunta simple: 1-2 oraciones
- Explicacion de concepto: 3-4 oraciones + lista si aplica
- Tutorial o guia: Pasos numerados, maximo 5 pasos
- Respuesta de voz: 50% mas corto que texto escrito

### REGLA CRÍTICA: ACCIÓN > PALABRAS
- NUNCA digas "te mostraré", "te enseñaré", "vamos paso a paso" como respuesta final. Eso NO es una respuesta útil.
- Si el usuario quiere IR a algún lado o ver algo → USA navigate() PRIMERO, luego explica brevemente.
  - "llévame a gastos" → navigate(expenses) con un mensaje breve
  - "muéstrame los clientes" → navigate(clients)
  - "quiero ver mis ingresos" → navigate(income)
- Si el usuario quiere APRENDER cómo hacer algo → USA navigate() para llevarlo a la sección + highlight_ui() para mostrarle los botones. NO uses run_tutorial a menos que sea la PRIMERA vez que preguntan.
  - "cómo ingreso un gasto" → navigate(expenses) + highlight_ui(["add-expense-button", "quick-capture"]) + explicación breve de 2-3 pasos
  - "cómo capturo un recibo" → navigate(expenses) + highlight_ui(["quick-capture"]) + "Presiona el botón verde que te marqué"
- run_tutorial SOLO se usa cuando el usuario dice literalmente "tutorial", "paso a paso completo", o es su primera interacción pidiendo ayuda con una función.
- Si NO hay tool apropiada, da instrucciones concretas en 3 pasos máximo.
- PROHIBIDO responder solo con promesas vagas. Cada respuesta debe contener una ACCIÓN concreta o INFORMACIÓN útil.
- Si el usuario dice "estoy esperando", "no pasó nada", "hazlo ya" → USA navigate() + highlight_ui() INMEDIATAMENTE. NO repitas texto.

### REGLA CRÍTICA: SIEMPRE RESALTA LO QUE MENCIONAS
- Cuando le dices al usuario "haz clic en X", "ve al botón Y", "mira la sección Z" → USA highlight_ui() para resaltar esos elementos en la pantalla.
- Esto SIEMPRE debe acompañar a cualquier mención de UI. Ejemplos:
  - "Presiona el botón verde de Captura" → highlight_ui(["quick-capture"], message="...")
  - "En la tabla de gastos verás..." → highlight_ui(["expenses-table"], message="...")
  - "Ve a la sección de filtros" → highlight_ui(["expense-filters"], message="...")
  - Si el usuario no está en la página correcta → highlight_ui(["expenses-table"], navigateTo="expenses", message="...")
- Si mencionas MÚLTIPLES elementos → resáltalos todos: highlight_ui(["add-expense-button", "expenses-table"])
- NUNCA hables de un elemento de la UI sin resaltarlo. El usuario no sabe dónde está lo que describes.

### ANTI-DUPLICACIÓN
- NUNCA repitas la misma información que acabas de decir
- Si el usuario pregunta lo mismo, reformula la respuesta
- Si ya explicaste algo, referencia brevemente ("Como mencioné...")
- **NUNCA saludes más de una vez por conversación.** Si ya dijiste "Hola", "¡Hey!", "¡Buena pregunta!" o cualquier saludo en un mensaje anterior, NO vuelvas a saludar. Ve directo al contenido.

### TONO DE VOZ
- Sé amigable pero profesional
- Usa "tú" no "usted" (a menos que el usuario use "usted")
- Evita jerga técnica innecesaria
- Termina con una pregunta cuando sea natural (pero no siempre)
- Varía tus inicios de oración (no empieces todo con "Puedes...")
`;


// ============================================================================
// VOICE USAGE TRACKING
// ============================================================================

async function incrementVoiceUsage(userId: string): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_usage_type: 'voice',
    });
    console.log('[Voice] Incremented usage for user:', userId);
  } catch (error) {
    console.error('[Voice] Failed to increment usage:', error);
  }
}

// ============================================================================
// CURRENCY HELPERS
// ============================================================================

const CURRENCY_SPOKEN_MAP: Record<string, { es: string; en: string }> = {
  CAD: { es: 'dólares canadienses', en: 'Canadian dollars' },
  CLP: { es: 'pesos chilenos', en: 'Chilean pesos' },
  USD: { es: 'dólares', en: 'dollars' },
  EUR: { es: 'euros', en: 'euros' },
  MXN: { es: 'pesos mexicanos', en: 'Mexican pesos' },
};

function getCurrencySpokenName(currency: string, language: string): string {
  const entry = CURRENCY_SPOKEN_MAP[currency];
  if (entry) return language === 'es' ? entry.es : entry.en;
  return language === 'es' ? 'dólares' : 'dollars';
}

// ============================================================================
// TOOL EXECUTION HELPERS
// ============================================================================

function executeNavigateTool(args: { target: string; message: string }, language: 'es' | 'en') {
  const routeInfo = AVAILABLE_ROUTES[args.target as keyof typeof AVAILABLE_ROUTES];
  if (!routeInfo) {
    return {
      action: 'navigate',
      target: 'dashboard',
      route: '/dashboard',
      name: 'Dashboard',
      message: args.message,
    };
  }
  
  return {
    action: 'navigate',
    target: args.target,
    route: routeInfo.route,
    name: routeInfo.names[language],
    message: args.message,
  };
}

function executeOpenItemTool(args: { target: string; itemName: string; message: string }, language: 'es' | 'en') {
  const routeInfo = AVAILABLE_ROUTES[args.target as keyof typeof AVAILABLE_ROUTES];
  
  return {
    action: 'open',
    target: args.target,
    route: routeInfo?.route || `/${args.target}`,
    name: routeInfo?.names[language] || args.target,
    message: args.message,
    data: { itemName: args.itemName },
  };
}

function executeCreateExpenseTool(args: { amount: number; vendor?: string; category?: string; description?: string }, currency?: string, language?: string) {
  const hasVendor = !!args.vendor;
  const hasCategory = !!args.category && args.category !== 'other';
  
  // Use spoken currency name instead of $ symbol
  const currencyName = getCurrencySpokenName(currency || 'CAD', language || 'es');
  
  let message = `¡Registrado! Gasto de ${args.amount} ${currencyName}${args.vendor ? ` en ${args.vendor}` : ''}.`;
  
  const missingFields: string[] = [];
  if (!hasVendor) missingFields.push('el vendedor o tienda');
  if (!hasCategory) missingFields.push('la categoría (comida, transporte, software, etc.)');
  if (!args.description) missingFields.push('una descripción');
  
  if (missingFields.length > 0) {
    message += ` Para clasificarlo bien, ¿me dices ${missingFields.join(', ')}? Así tu análisis fiscal será más preciso.`;
  }
  
  return {
    action: 'create_expense',
    data: {
      amount: args.amount,
      vendor: args.vendor,
      category: args.category || 'other',
      description: args.description || args.vendor,
    },
    message,
  };
}

function executeCreateIncomeTool(args: { amount: number; source?: string; incomeType?: string; description?: string }, currency?: string, language?: string) {
  const hasSource = !!args.source;
  const hasType = !!args.incomeType && args.incomeType !== 'other';
  
  // Use spoken currency name instead of $ symbol
  const currencyName = getCurrencySpokenName(currency || 'CAD', language || 'es');
  
  let message = `¡Listo! Ingreso de ${args.amount} ${currencyName} registrado${args.source ? ` de ${args.source}` : ''}.`;
  
  // Add conversational follow-up for missing fields
  const missingFields: string[] = [];
  if (!hasSource) missingFields.push('la fuente o cliente');
  if (!hasType) missingFields.push('el tipo de ingreso (freelance, salario, inversión, etc.)');
  if (!args.description) missingFields.push('una descripción');
  
  if (missingFields.length > 0) {
    message += ` Para que tu contabilidad quede impecable, ¿me podrías indicar ${missingFields.join(', ')}? También puedo asignarlo a un proyecto si quieres.`;
  }
  
  return {
    action: 'create_income',
    data: {
      amount: args.amount,
      source: args.source,
      income_type: args.incomeType || 'other',
      description: args.description || args.source,
    },
    message,
  };
}

function executeCreateRecurringBillTool(args: { amount: number; name?: string; category?: string; frequency?: string; auto_pay?: boolean }, currency?: string, language?: string) {
  const currencyName = getCurrencySpokenName(currency || 'CAD', language || 'es');
  
  const freqMap: Record<string, string> = {
    monthly: language === 'es' ? 'mensual' : 'monthly',
    bimonthly: language === 'es' ? 'bimensual' : 'bimonthly', 
    quarterly: language === 'es' ? 'trimestral' : 'quarterly',
    semi_annual: language === 'es' ? 'semestral' : 'semi-annual',
    annual: language === 'es' ? 'anual' : 'annual',
    weekly: language === 'es' ? 'semanal' : 'weekly',
    biweekly: language === 'es' ? 'quincenal' : 'biweekly',
  };
  const freqLabel = freqMap[args.frequency || 'monthly'] || args.frequency || 'mensual';
  
  let message = language === 'es'
    ? `¡Pago fijo creado! ${args.name || 'Sin nombre'} de ${args.amount} ${currencyName} ${freqLabel}.`
    : `Recurring bill created! ${args.name || 'Unnamed'} of ${args.amount} ${currencyName} ${freqLabel}.`;
  
  if (!args.name) {
    message += language === 'es'
      ? ' ¿Me dices el nombre del servicio o proveedor?'
      : ' What is the service or provider name?';
  }
  
  return {
    action: 'create_recurring_bill',
    data: {
      amount: args.amount,
      name: args.name || 'Sin nombre',
      category: args.category || 'other',
      frequency: args.frequency || 'monthly',
      auto_pay: args.auto_pay || false,
    },
    message,
  };
}

function executeExportTool(args: { reportType: string; format?: string; period?: string }, language: 'es' | 'en') {
  return {
    action: 'export',
    data: {
      reportType: args.reportType,
      format: args.format || 'excel',
      period: args.period,
    },
    message: language === 'es' 
      ? `Preparando tu reporte de ${args.reportType}...`
      : `Preparing your ${args.reportType} report...`,
  };
}

function executeRunTutorialTool(args: { tutorialId: string; message: string }) {
  return {
    action: 'run_tutorial',
    data: { tutorialId: args.tutorialId },
    message: args.message,
  };
}

function executeCalculateFireTool(args: { monthlyExpenses?: number; currentSavings?: number; monthlySavings?: number; targetAge?: number }, language: 'es' | 'en') {
  return {
    action: 'calculate_fire',
    data: args,
    message: language === 'es'
      ? 'Calculando tu número FIRE...'
      : 'Calculating your FIRE number...',
  };
}

function executeShowInsightsTool(args: { insightType: string; message: string }) {
  return {
    action: 'show_insights',
    data: { insightType: args.insightType },
    message: args.message,
  };
}

function executeSetGoalTool(args: { goalType: string; targetAmount?: number; deadline?: string; message: string }) {
  return {
    action: 'set_goal',
    data: {
      goalType: args.goalType,
      targetAmount: args.targetAmount,
      deadline: args.deadline,
    },
    message: args.message,
  };
}

function executeHighlightUiTool(args: { elements: string[]; navigateTo?: string; message: string }, language: 'es' | 'en') {
  const routeInfo = args.navigateTo ? AVAILABLE_ROUTES[args.navigateTo as keyof typeof AVAILABLE_ROUTES] : null;
  
  return {
    action: 'highlight_ui',
    target: args.navigateTo || null,
    route: routeInfo?.route || null,
    data: { elements: args.elements },
    message: args.message,
  };
}

// ============================================================================
// MAIN SERVER HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Plan-guard for non-admin users (admins bypass automatically).
    // Soft-fail: if anything goes wrong we still let the request through.
    try {
      const { checkPlanAccess } = await import('../_shared/plan-guard.ts');
      const guard = await checkPlanAccess(req, 'ai_credits');
      if (!guard.allowed) return guard.response;
    } catch (e) {
      console.warn('[app-assistant] plan-guard skipped:', e);
    }

    // Extract user ID from authorization header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (e) {
        console.log('[Auth] Could not extract user ID:', e);
      }
    }

    const { messages, userContext, richContext, language = 'es', conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the last user message
    const lastMessage = messages?.[messages.length - 1]?.content || '';
    console.log('[Assistant] Processing message:', lastMessage);
    console.log('[Assistant] Rich context available:', !!richContext);

    // Build comprehensive context for the AI
    let contextSection = "";
    
    if (richContext) {
      // Use the rich context from useAssistantContext
      contextSection = `
## CONTEXTO DE UBICACION (solo referencia - NO uses esto como respuesta)
REGLA CRÍTICA: Si el usuario hace una PREGUNTA DE CONOCIMIENTO (ej: "qué es el SII", "explícame el IVA", "cómo funciona X"), RESPONDE con tu conocimiento experto del system prompt. NUNCA respondas con la descripción de la página actual. La info de abajo es SOLO para saber dónde está el usuario, NO es la respuesta a su pregunta.
${richContext}
`;
    } else if (userContext) {
      // Fallback to basic context
      contextSection = `
## CONTEXTO ACTUAL (MUY IMPORTANTE)
EL USUARIO ESTA EN: ${userContext.currentPageName || userContext.currentRoute || 'página desconocida'}
Ruta exacta: ${userContext.currentRoute || 'desconocida'}

### Datos financieros:
- Usuario: ${userContext.userName || 'Usuario'}
- Moneda activa: ${userContext.currency || 'CAD'} (${getCurrencySpokenName(userContext.currency || 'CAD', language)})
- Entidad activa: ${userContext.entityName || 'Principal'}
- Multi-país: ${userContext.isMultiEntity ? 'Sí - monedas disponibles: ' + (userContext.availableCurrencies || []).join(', ') : 'No'}
- Gastos del mes: ${userContext.totalExpenses?.toFixed(2) || '0'} ${getCurrencySpokenName(userContext.currency || 'CAD', language)}
- Ingresos del mes: ${userContext.totalIncome?.toFixed(2) || '0'} ${getCurrencySpokenName(userContext.currency || 'CAD', language)}
- Balance: ${userContext.balance?.toFixed(2) || '0'} ${getCurrencySpokenName(userContext.currency || 'CAD', language)}
- Clientes: ${userContext.clientCount || 0}
- Proyectos: ${userContext.projectCount || 0}

### Regla de moneda:
- Cuando el usuario mencione un monto sin especificar moneda, asume ${userContext.currency || 'CAD'} (${getCurrencySpokenName(userContext.currency || 'CAD', language)}).
${userContext.isMultiEntity ? '- El usuario opera en MÚLTIPLES países. Si hay ambigüedad en la moneda, PREGUNTA en cuál moneda quiere registrar.' : ''}
- NUNCA uses el símbolo "$" en tus respuestas. Siempre escribe el nombre de la moneda (ej: "50 ${getCurrencySpokenName(userContext.currency || 'CAD', language)}").
`;
      
      // Add user profile context
      if (userContext.workTypes?.length > 0) {
        contextSection += `
### Perfil de trabajo:
- Tipos de trabajo: ${userContext.workTypes.join(', ')}
- País: ${userContext.country || 'Canada'}
- Provincia: ${userContext.province || 'no especificada'}
`;
      }
      
      // Add financial profile for personalization
      if (userContext.financialProfile) {
        const fp = userContext.financialProfile;
        contextSection += `
## PERFIL FINANCIERO DEL USUARIO (PERSONALIZA TUS RESPUESTAS)
- Nivel de experiencia: ${fp.experienceLevel || 'principiante'}
- Tolerancia al riesgo: ${fp.riskTolerance || 'moderada'}
- Metas financieras: ${fp.goals?.join(', ') || 'no definidas'}
- Intereses de inversion: ${fp.interests?.join(', ') || 'no definidos'}
- Talentos: ${fp.talents?.join(', ') || 'no especificados'}
- Capital disponible: ${fp.availableCapital || 0}
- Capacidad mensual de inversion: ${fp.monthlyInvestmentCapacity || 0}
- Tipo de ingreso preferido: ${fp.preferredIncomeType || 'mixto'}
- Tiempo disponible: ${fp.timeAvailability || 'parcial'}

REGLAS DE PERSONALIZACION:

Si nivel es "principiante" o "beginner":
- Usa analogias simples y cotidianas
- Evita jerga financiera o explicala inmediatamente  
- Da mas contexto y tranquilidad

Si nivel es "intermediate" o "intermedio":
- Puedes usar terminos como ETF, diversificacion, rendimiento anualizado
- Da datos especificos y metricas

Si nivel es "advanced" o "avanzado":
- Discute estrategias avanzadas: DCA, rebalanceo, tax-loss harvesting
- Asume familiaridad con conceptos complejos

Segun tolerancia al riesgo:
- Conservador: enfocate en bonos, GICs, fondos indexados
- Moderado: balance 60/40, diversificacion global
- Agresivo: acciones individuales, crypto, real estate

Segun sus metas (${fp.goals?.join(', ') || 'generales'}):
- Conecta CADA respuesta con sus metas especificas
- Sugiere herramientas de la app relevantes a sus objetivos
- Da ejemplos personalizados usando sus datos reales
`;
      }
      
      // Add active tutorial context to prevent re-triggering
      if (userContext.activeTutorialId) {
        contextSection += `
## TUTORIAL ACTIVO: "${userContext.activeTutorialId}"
El usuario YA tiene un tutorial activo en pantalla. NO vuelvas a llamar run_tutorial con el mismo ID.
Si el usuario dice "continua", "si", "okay", "adelante", "sigue", responde CONVERSACIONALMENTE:
- Pregunta si ya completó los pasos
- Ofrece ayuda con un paso específico
- Sugiere probar la acción descrita en el tutorial
- Si piden algo DIFERENTE, puedes usar otras tools normalmente
`;
      }
    }

    // Add conversation history for context
    if (conversationHistory.length > 0) {
      contextSection += `
## HISTORIAL DE CONVERSACIÓN RECIENTE
${conversationHistory.slice(-5).map((msg: { role: string; content: string }) => 
  `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
).join('\n')}
`;
    }

    // Prepare messages for AI
    const aiMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT + contextSection },
      ...normalizeMessages(messages),
    ];

    console.log('[Assistant] Calling AI with tools...');

    // Call AI with tool definitions
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: ASSISTANT_TOOLS,
        tool_choice: "auto",
        max_completion_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error('[Assistant] AI error:', response.status, errorText);

      // Prevent client blank-screens: return a friendly message instead of 500
      // when the model hits output limits / token caps.
      if (response.status === 400 && isOutputLimitError(errorText)) {
        const friendly = language === 'es'
          ? "Me quedé sin espacio para responder (el contexto ya está muy largo). ¿Puedes repetir tu pregunta en 1 frase, o dime solo lo que quieres lograr ahora mismo?"
          : "I ran out of room to respond (the context got too long). Can you repeat your question in one sentence, or tell me what you want to do right now?";

        return new Response(
          JSON.stringify({ message: friendly, error_code: "AI_OUTPUT_LIMIT" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Error al procesar la solicitud");
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    
    console.log('[Assistant] AI response received, finish_reason:', choice?.finish_reason);

    // Check if AI wants to use a tool
    if (choice?.finish_reason === 'tool_calls' && choice?.message?.tool_calls) {
      const toolCalls = choice.message.tool_calls;
      console.log('[Assistant] Tool calls count:', toolCalls.length);
      
      // Process ALL tool calls (AI may call navigate + highlight_ui together)
      const actionResponses: any[] = [];
      let conversationalFollowUp: string | null = null;
      
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        let toolArgs: any;
        try {
          toolArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          console.error('[Assistant] Failed to parse tool args:', toolCall.function.arguments);
          continue;
        }
        
        console.log('[Assistant] Tool call:', toolName, toolArgs);

        let actionResponse: any = null;

        switch (toolName) {
          case 'navigate':
            actionResponse = executeNavigateTool(toolArgs, language as 'es' | 'en');
            break;
          case 'open_item':
            actionResponse = executeOpenItemTool(toolArgs, language as 'es' | 'en');
            break;
          case 'create_expense':
            actionResponse = executeCreateExpenseTool(toolArgs, userContext?.currency, language);
            break;
          case 'create_income':
            actionResponse = executeCreateIncomeTool(toolArgs, userContext?.currency, language);
            break;
          case 'create_recurring_bill':
            actionResponse = executeCreateRecurringBillTool(toolArgs, userContext?.currency, language);
            break;
          case 'export_report':
            actionResponse = executeExportTool(toolArgs, language as 'es' | 'en');
            break;
          case 'run_tutorial':
            actionResponse = executeRunTutorialTool(toolArgs);
            break;
          case 'calculate_fire':
            actionResponse = executeCalculateFireTool(toolArgs, language as 'es' | 'en');
            break;
          case 'show_insights':
            actionResponse = executeShowInsightsTool(toolArgs);
            break;
          case 'set_goal':
            actionResponse = executeSetGoalTool(toolArgs);
            break;
          case 'highlight_ui':
            actionResponse = executeHighlightUiTool(toolArgs, language as 'es' | 'en');
            break;
          case 'explain_chart':
          case 'query_financial_data':
          case 'set_filter': {
            // These need a follow-up AI call for conversational response
            const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  ...aiMessages,
                  choice.message,
                  {
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ success: true, args: toolArgs }),
                  },
                ],
                max_completion_tokens: 2048,
              }),
            });
            
            if (followUpResponse.ok) {
              const followUpData = await followUpResponse.json();
              conversationalFollowUp = followUpData.choices?.[0]?.message?.content || null;
            }
            break;
          }
        }
        
        if (actionResponse) {
          actionResponses.push(actionResponse);
        }
      }
      
      // If we got a conversational follow-up (query/chart/filter), return that
      if (conversationalFollowUp) {
        if (userId) await incrementVoiceUsage(userId);
        return new Response(
          JSON.stringify({ message: conversationalFollowUp }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Merge multiple action responses (e.g., navigate + highlight_ui)
      if (actionResponses.length > 0) {
        if (userId) await incrementVoiceUsage(userId);
        
        // Primary action is the first non-highlight action, or the first one
        const primaryAction = actionResponses.find(a => a.action !== 'highlight_ui') || actionResponses[0];
        const highlightAction = actionResponses.find(a => a.action === 'highlight_ui');
        
        // Merge highlight data into primary action
        if (highlightAction && primaryAction !== highlightAction) {
          primaryAction.data = { ...primaryAction.data, ...highlightAction.data };
          // Combine messages
          primaryAction.message = primaryAction.message + ' ' + highlightAction.message;
          // Add secondary actions array for the frontend to process
          primaryAction.secondaryActions = [highlightAction];
        }
        
        return new Response(
          JSON.stringify({ 
            message: primaryAction.message,
            action: primaryAction,
            // Also send all actions for the frontend to process
            actions: actionResponses,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle truncated responses (model hit token limit)
    if (choice?.finish_reason === 'length' && choice?.message?.content) {
      const truncationNote = language === 'es'
        ? "\n\nMi respuesta se corto. Quieres que continue o que te lo resuma mas corto?"
        : "\n\nMy response was cut short. Want me to continue or summarize it shorter?";
      
      if (userId) await incrementVoiceUsage(userId);
      
      return new Response(
        JSON.stringify({ message: choice.message.content + truncationNote }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regular conversational response
    const assistantMessage = choice?.message?.content || 
      (language === 'es' ? "Lo siento, no pude procesar tu pregunta." : "Sorry, I couldn't process your request.");

    // Increment usage
    if (userId) {
      await incrementVoiceUsage(userId);
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("App assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
