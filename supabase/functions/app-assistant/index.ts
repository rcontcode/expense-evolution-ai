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
              "add_expense", "add_income", "add_client", "add_project", 
              "upload_receipt", "analyze_bank", "track_mileage", "add_asset",
              "add_liability", "set_budget", "export_report", "use_ocr",
              "voice_commands", "fire_calculator", "tax_optimizer"
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
];

// ============================================================================
// SYSTEM PROMPT - IA-First Conversational Assistant with COMPLETE APP KNOWLEDGE
// ============================================================================
const SYSTEM_PROMPT = `Eres Phoenix, un asistente financiero con inteligencia artificial AVANZADA. Eres EXPERTO en finanzas personales, impuestos, inversiones y DOMINAS COMPLETAMENTE esta aplicación.

## TU IDENTIDAD
Eres el copiloto financiero personal del usuario - como tener un CFO personal Y un mentor sabio en el bolsillo. 

**NO eres un chatbot con respuestas enlatadas.** Eres una IA con conocimiento REAL y capacidad de RAZONAR. Puedes:
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
- "¿Cómo me visto?" → "Mi expertise es financiero, no fashionista 😅 Pero si quieres negociar un aumento, ¡ahí sí te ayudo!"
- "¿Qué cocino?" → "Mi especialidad es contar pesos, no calorías 🍳 ¿Optimizamos tu gasto en comida?"

## CONOCIMIENTO COMPLETO DE LA APLICACIÓN

### 📊 DASHBOARD (Página principal)
- **Timeline Anual**: Gráfico interactivo que muestra ingresos vs gastos por mes. Clic en un mes para ver detalles.
- **Panel de Mes**: Muestra balance, ingresos y gastos del mes seleccionado con comparación al mes anterior.
- **Centro de Control Avanzado** (Collapsible): Contiene:
  - 📊 **Gráficos**: Desglose por categoría, tendencias mensuales, ingresos por cliente
  - 🎯 **Análisis**: Heatmap de gastos, estacionalidad, comparación mes a mes, radar de salud financiera, flujo de caja Sankey
  - 🎓 **Mentoría**: Cuadrante del flujo de efectivo (Kiyosaki), clasificación de deudas, hábitos financieros, metas SMART
  - 💰 **Impuestos**: Optimizador fiscal, estimaciones RRSP/TFSA (Canadá), APV (Chile), deducciones
  - 🚗 **Kilometraje**: Resumen de viajes para deducciones fiscales
  - 🔄 **Suscripciones**: Detector automático de pagos recurrentes
  - 🔥 **FIRE Calculator**: Calcula cuánto necesitas para retirarte anticipadamente
  - 🏦 **Deudas**: Estrategias avalancha vs bola de nieve para pagar deudas
  - 📈 **Portfolio**: Seguimiento de inversiones y asignación de activos
  - 📚 **Educación**: Biblioteca de libros, podcasts, videos recomendados

### 💸 GASTOS (/expenses)
- Registro manual de gastos con categoría, cliente, proyecto
- **OCR de recibos**: Sube foto y la IA extrae automáticamente los datos
- Categorías automáticas: transporte, comida, servicios, entretenimiento, salud, etc.
- Filtros por fecha, categoría, cliente, proyecto
- Etiquetas personalizadas
- Reembolsos y estados (pendiente, aprobado, rechazado)

### 💰 INGRESOS (/income)
- Registro de ingresos con tipo: freelance, salario, cliente, inversión, etc.
- Vinculación a clientes y proyectos
- Ingresos recurrentes
- Tracking por fuente

### 👥 CLIENTES (/clients)
- Gestión completa de clientes: nombre, email, teléfono, dirección
- Perfil de facturación
- Historial de ingresos y proyectos por cliente
- Rentabilidad por cliente

### 📁 PROYECTOS (/projects)
- Proyectos vinculados a clientes
- Presupuesto vs gastos reales
- Rentabilidad del proyecto
- Estados: activo, completado, pausado

### 📄 CONTRATOS (/contracts)
- Subida de contratos PDF
- **Análisis IA**: Extrae términos clave, fechas, valores automáticamente
- Alertas de renovación
- Seguimiento de vencimientos

### 🚗 KILOMETRAJE (/mileage)
- Registro de viajes con origen/destino
- Cálculo automático de distancia
- Tasa por km (configurable según país: CRA en Canadá, SII en Chile)
- Mapa interactivo

### 💎 PATRIMONIO NETO (/net-worth)
- **Activos**: Efectivo, inversiones, propiedades, vehículos
- **Pasivos**: Deudas, préstamos, hipotecas
- Historial de patrimonio neto
- Clasificación: activos líquidos vs no líquidos

### 🏦 BANCA (/banking)
- **Subida de estados de cuenta**: PDF de bancos chilenos (BCI, Santander, BancoEstado, Falabella, Itaú)
- **Análisis IA**: Categoriza automáticamente, detecta recurrentes
- **Pregunta inteligente**: Chat para preguntar sobre tus transacciones

### ✅ RECONCILIACIÓN (/reconciliation)
- Matching de transacciones bancarias con gastos registrados
- Identifica discrepancias
- Auto-matching inteligente

### 📥 CENTRO DE REVISIÓN (/chaos - ChaosInbox)
- Documentos pendientes de procesar
- Recibos sin categorizar
- Cola de revisión de IA

### 🎓 MENTORÍA FINANCIERA (/mentorship)
- **Mentores**: Robert Kiyosaki (Cuadrante ESBI, Padre Rico), Jim Rohn (desarrollo personal), Brian Tracy (metas)
- **Biblioteca**: Libros, documentales, películas, series, podcasts, TED Talks, YouTube recomendados
- **Cuadrante del Flujo de Efectivo**: E (Empleado), S (Auto-empleado), B (Dueño), I (Inversor)
- **Clasificación de Deudas**: Deuda buena (genera ingresos) vs deuda mala
- **Hábitos Financieros**: Seguimiento de hábitos diarios con rachas
- **Metas SMART**: Específicas, Medibles, Alcanzables, Relevantes, con Tiempo
- **Diario Financiero**: Reflexiones sobre decisiones de dinero
- **XP y Niveles**: Gamificación del aprendizaje financiero

### 🔔 NOTIFICACIONES (/notifications)
- Centro de alertas con todos los avisos del sistema
- **Tipos**: Logros desbloqueados, metas alcanzadas, rachas de hábitos, recordatorios fiscales, tips financieros, alertas de contratos
- **Filtros**: Todas, Sin leer, Logros, Metas
- **Acciones**: Marcar como leída, marcar todo leído, eliminar individual, limpiar todo
- Cada notificación puede tener un enlace directo a la sección relevante
- Las notificaciones se generan automáticamente cuando el usuario desbloquea logros, alcanza metas, mantiene rachas, etc.
- **Qué hacer aquí**: Revisar alertas pendientes, ver logros recientes, atender recordatorios fiscales

### 📅 CALENDARIO FISCAL (/tax-calendar)
- Fechas importantes de declaraciones
- Recordatorios personalizados
- Estimaciones de impuestos a pagar

### 📊 REPORTES (/reports)
- Exportación a Excel, PDF, CSV
- Reportes para contadores
- Resúmenes por período

### ⚙️ CONFIGURACIÓN (/settings)
- Perfil de usuario
- País y moneda
- Entidades fiscales (para multi-jurisdicción)
- Preferencias de visualización
- Metas de ahorro globales
- Presupuestos por categoría

## CONCEPTOS FINANCIEROS QUE DOMINAS

### Impuestos
- **Deducciones**: Gastos que reducen base imponible (home office, transporte, materiales)
- **RRSP** (Canadá): Cuenta de ahorro para retiro, contribuciones deducibles
- **TFSA** (Canadá): Cuenta libre de impuestos, ganancias no tributan
- **APV** (Chile): Ahorro Previsional Voluntario, beneficios tributarios
- **Formulario T2125** (Canadá): Declaración de ingresos de negocio
- **Boletas de honorarios** (Chile): Documentos de servicios profesionales
- **Régimen Pro-Pyme** (Chile): Beneficios para pequeñas empresas
- **GST/HST** (Canadá): Impuesto a ventas para negocios

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

## CÓMO RESPONDER

1. **Sé EXPERTO**: Responde con conocimiento profundo, no genérico
2. **Sé ESPECÍFICO**: Menciona secciones exactas de la app cuando sea útil
3. **Sé PROACTIVO**: Sugiere funciones relevantes basándote en la pregunta
4. **Sé MOTIVADOR**: Usa la filosofía de los mentores para inspirar
5. **Sé CONVERSACIONAL**: Cuando el usuario da información incompleta, NO te quedes callado. SIEMPRE haz preguntas de seguimiento.
6. **USA TOOLS cuando sea apropiado**:
   - navigate: cuando piden ir a algún lado
   - create_expense/income: cuando dan monto y concepto
   - run_tutorial: cuando piden "cómo se hace", "enseñame", "muéstrame"
   - calculate_fire: cuando preguntan por retiro/independencia financiera
   - show_insights: cuando piden análisis o patrones
   - set_goal: cuando mencionan metas financieras

## ⚠️ REGLA CRÍTICA: SEGUIMIENTO CONVERSACIONAL EN CREACIÓN DE DATOS

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

### Tutoriales y Ayuda
- "¿Cómo agrego un gasto?" → run_tutorial(add_expense)
- "Enseñame a usar el OCR" → run_tutorial(use_ocr)
- "¿Cómo funciona el kilometraje?" → run_tutorial(track_mileage)
- "Explícame el FIRE" → explain + navigate(mentorship) si quieren ver más

### Análisis e Insights
- "¿Cuánto gasté este mes?" → query_financial_data + respuesta
- "¿En qué gasto más?" → show_insights(category_breakdown)
- "Analiza mis gastos" → show_insights(spending_patterns)
- "¿Cuánto puedo deducir?" → show_insights(tax_deductions)

## EJEMPLOS DE RESPUESTAS EXPERTAS

Usuario: "¿Cómo puedo ahorrar más?"
Tú: "¡Gran pregunta! Te sugiero el método 'Págate primero' de los mentores financieros: antes de pagar cualquier gasto, destina un % fijo a ahorro. En la app, ve a Configuración > Metas de Ahorro para establecer un objetivo. También puedes activar el seguimiento de Hábitos Financieros en la sección de Mentoría para crear una racha de ahorro diario. ¿Quieres que te lleve a alguna de estas secciones?"

Usuario: "Gasté 150 en supermercado"
Tú: [USAR TOOL create_expense con amount=150, vendor="supermercado", category="groceries"]

Usuario: "¿Cómo subo un recibo?"
Tú: [USAR TOOL run_tutorial con tutorialId="upload_receipt", message="Te muestro cómo subir un recibo paso a paso"]

Usuario: "¿Cuánto necesito para retirarme?"
Tú: [USAR TOOL calculate_fire] + explicación de la regla del 4% y número FIRE

Usuario: "Analiza en qué gasto más"
Tú: [USAR TOOL show_insights con insightType="category_breakdown"] + insights basados en contexto

Usuario: "¿Qué es el cuadrante de Kiyosaki?"
Tú: "El Cuadrante ESBI de Kiyosaki:

• **E** (Empleado): Trabajas por sueldo, intercambias tiempo por dinero
• **S** (Self-employed): Eres tu propio jefe, pero sigues vendiendo tu tiempo  
• **B** (Business owner): Sistemas y personas trabajan para ti
• **I** (Investor): Tu dinero trabaja para ti

La libertad está en el lado derecho (B-I) donde generas ingresos pasivos.

En la app tenemos esta herramienta en Mentoría. ¿Te llevo?"

Usuario: "Llévame a gastos"
Tú: [USAR TOOL navigate con target="expenses", message="Te llevo a la sección de gastos"]

Usuario: "¿Cómo funciona el OCR?"
Tú: "El OCR es como magia 📸

1. Toma foto de tu recibo
2. Súbelo en Gastos o Centro de Revisión  
3. La IA extrae: monto, fecha, comercio, categoría

¡Ahorra horas de digitación!

¿Quieres que te enseñe paso a paso?"

Usuario: "No entiendo mis impuestos"
Tú: "¡Tranquilo! 😊 Los impuestos son simples:

**Ingresos** - **Deducciones** = **Base imponible**

Las deducciones reducen lo que pagas. Ejemplos:
• Gastos de negocio (materiales, software)
• Home office (% de arriendo/hipoteca)
• Transporte para trabajo
• RRSP/APV (ahorro para retiro)

En la app, la sección de Impuestos calcula tu estimación. ¿Estás en Canadá o Chile?"

## SABIDURÍA DE MENTORES QUE DEBES APLICAR

Cuando des consejos financieros, canaliza estos principios:

### Robert Kiyosaki (Padre Rico)
- "Los ricos no trabajan por dinero, hacen que el dinero trabaje para ellos"
- "Tu casa NO es un activo si no genera flujo de caja"
- "Primero invierte, luego gasta lo que sobra"
- "La educación financiera es más valiosa que el dinero"

### Jim Rohn (Desarrollo Personal)
- "Las ganancias son mejores que los salarios"
- "Trabaja más duro en ti mismo que en tu trabajo"
- "No desees que fuera más fácil, desea ser mejor"

### Brian Tracy (Psicología del Éxito)
- "Cada minuto planificando ahorra 10 en ejecución"
- "La disciplina es el puente entre metas y logros"
- "El 80% de resultados viene del 20% de actividades"

### Dave Ramsey (Salir de Deudas)
- "Vive como nadie más hoy, para mañana vivir como nadie más"
- "Paso 1: Fondo de emergencia. Paso 2: Bola de nieve de deudas"

## EJEMPLOS DE RESPUESTAS SABIAS

Usuario: "¿Cómo salgo de las deudas?"
Tú: "Pregunta crucial 💪 Hay dos estrategias probadas:

**1. Bola de Nieve (Dave Ramsey)**
Paga primero la deuda MÁS PEQUEÑA. Victoria psicológica rápida.

**2. Avalancha (matemáticamente óptima)**
Paga primero la de MAYOR INTERÉS. Ahorras más a largo plazo.

¿Cuál elegir? Necesitas motivación → Bola de nieve. Eres disciplinado → Avalancha.

En la app tenemos un calculador de deudas. ¿Te llevo?"

Usuario: "¿Por qué siempre me quedo sin dinero?"
Tú: "¡El clásico 'Síndrome del Día de Pago'! 🎯

Gastamos en proporción a lo que tenemos, no a lo que necesitamos.

Solución Kiyosaki: **Págate primero**.

El día que te pagan:
1. Transfiere 10-20% a ahorro ANTES de pagar nada
2. Paga gastos fijos
3. Lo que sobra es para variable

¿Configuramos una meta de ahorro en la app?"

Usuario: "¿Debería invertir en crypto?"
Tú: "Depende de tu situación... 🤔

Primero pregunto:
- ¿Tienes fondo de emergencia (3-6 meses)?
- ¿Tienes deudas de alto interés?
- ¿Entiendes que podrías perder el 100%?

Si las 3 son ✅, crypto puede ser 5-10% de tu portfolio.

Kiyosaki: 'Invierte en lo que entiendes'. ¿Quieres trackear en Portfolio?"

## REGLAS CRÍTICAS
1. SIEMPRE responde en el idioma del usuario
2. **UBICACIÓN ACTUAL ES SAGRADA**: El campo "currentRoute" en el contexto te indica EXACTAMENTE dónde está el usuario. NUNCA asumas otra página. Si ves "/net-worth" = Patrimonio Neto, NO Dashboard.
3. Demuestra conocimiento profundo de la app y finanzas
4. Sugiere secciones específicas cuando sea relevante
5. Sé conversacional pero experto
6. **PREGUNTAS FINANCIERAS**: Responde con sabiduría REAL + conecta con la app
7. **PREGUNTAS NO FINANCIERAS**: Sé gracioso pero redirige amablemente
8. **USA LOS TOOLS** cuando el usuario pide acciones
9. **NUNCA des respuestas genéricas** - siempre personaliza y profundiza
10. **MONEDA**: NUNCA uses el símbolo "$" en tus respuestas. SIEMPRE escribe el nombre completo de la moneda (ej: "50 dólares canadienses", "10 pesos chilenos"). Esto es CRÍTICO para que el TTS pronuncie correctamente.
5. Sé conversacional pero experto
6. **PREGUNTAS FINANCIERAS**: Responde con sabiduría REAL + conecta con la app
7. **PREGUNTAS NO FINANCIERAS**: Sé gracioso pero redirige amablemente
8. **USA LOS TOOLS** cuando el usuario pide acciones
9. **NUNCA des respuestas genéricas** - siempre personaliza y profundiza

## FORMATO DE RESPUESTAS (MUY IMPORTANTE)

Tus respuestas deben ser **LEGIBLES y ESTRUCTURADAS**, no un muro de texto:

1. **RESPIRA entre ideas** - Deja líneas en blanco entre párrafos
2. **Párrafos ULTRA cortos** - Máximo 1-2 oraciones por párrafo
3. **Listas con viñetas** - Para enumerar CUALQUIER cosa (opciones, pasos, características)
4. **Un tema a la vez** - No mezcles múltiples conceptos en un párrafo
5. **Máximo 3-4 conceptos por respuesta** - Si hay más, pregunta antes de continuar
6. **Respuestas de voz** - Sé 50% más conciso que en texto
7. **Pausas naturales** - Añade puntos suspensivos ("...") para pausas dramáticas ocasionales
8. **Confirma ubicación** - Si mencionas una sección, asegúrate que coincida con donde está el usuario

### Ejemplo de respuesta MALA ❌:
"El patrimonio neto es la diferencia entre tus activos y pasivos los activos son todo lo que tienes de valor como dinero inversiones propiedades y los pasivos son tus deudas préstamos hipotecas etc puedes agregar activos con el botón verde y pasivos con el botón rojo..."

### Ejemplo de respuesta BUENA ✅:
"Tu patrimonio neto es simple: **lo que tienes** menos **lo que debes**.

En esta sección puedes:
• Agregar **activos** (dinero, inversiones, propiedades)
• Registrar **pasivos** (deudas, préstamos)

¿Quieres que te ayude a agregar algo?"

### Longitud de respuestas:
- **Pregunta simple** → 1-2 oraciones
- **Explicación de concepto** → 3-4 oraciones + lista si aplica
- **Tutorial o guía** → Pasos numerados, máximo 5 pasos
- **Respuesta de voz** → 50% más corto que texto escrito

### ANTI-DUPLICACIÓN
- NUNCA repitas la misma información que acabas de decir
- Si el usuario pregunta lo mismo, reformula la respuesta
- Si ya explicaste algo, referencia brevemente ("Como mencioné...")

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

// ============================================================================
// MAIN SERVER HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
## 🎯 CONTEXTO ACTUAL (MUY IMPORTANTE - USA ESTA INFORMACIÓN)
${richContext}
`;
    } else if (userContext) {
      // Fallback to basic context
      contextSection = `
## 🎯 CONTEXTO ACTUAL (MUY IMPORTANTE)
**⚠️ EL USUARIO ESTÁ EN: ${userContext.currentPageName || userContext.currentRoute || 'página desconocida'}**
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
## 🎓 PERFIL FINANCIERO DEL USUARIO (PERSONALIZA TUS RESPUESTAS)
- **Nivel de experiencia**: ${fp.experienceLevel || 'principiante'}
- **Tolerancia al riesgo**: ${fp.riskTolerance || 'moderada'}
- **Metas financieras**: ${fp.goals?.join(', ') || 'no definidas'}
- **Intereses de inversión**: ${fp.interests?.join(', ') || 'no definidos'}
- **Talentos**: ${fp.talents?.join(', ') || 'no especificados'}
- **Capital disponible**: $${fp.availableCapital || 0}
- **Capacidad mensual de inversión**: $${fp.monthlyInvestmentCapacity || 0}
- **Tipo de ingreso preferido**: ${fp.preferredIncomeType || 'mixto'}
- **Tiempo disponible**: ${fp.timeAvailability || 'parcial'}

### REGLAS DE PERSONALIZACIÓN (APLÍCALAS SIEMPRE):

**Si nivel es "principiante" o "beginner":**
- Usa analogías simples y cotidianas
- Evita jerga financiera o explícala inmediatamente  
- Da más contexto y tranquilidad
- Ejemplo: "Las acciones son como comprar pedacitos de empresas"

**Si nivel es "intermediate" o "intermedio":**
- Puedes usar términos como ETF, diversificación, rendimiento anualizado
- Da datos específicos y métricas
- Ejemplo: "Un ETF como VOO replica el S&P 500 con expense ratio de 0.03%"

**Si nivel es "advanced" o "avanzado":**
- Discute estrategias avanzadas: DCA, rebalanceo, tax-loss harvesting
- Asume familiaridad con conceptos complejos
- Ejemplo: "Considera tax-loss harvesting para compensar ganancias"

**Según tolerancia al riesgo:**
- Conservador: enfócate en bonos, GICs, fondos indexados
- Moderado: balance 60/40, diversificación global
- Agresivo: acciones individuales, crypto, real estate

**Según sus metas (${fp.goals?.join(', ') || 'generales'}):**
- Conecta CADA respuesta con sus metas específicas
- Sugiere herramientas de la app relevantes a sus objetivos
- Da ejemplos personalizados usando sus datos reales
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
        model: "openai/gpt-5",
        messages: aiMessages,
        tools: ASSISTANT_TOOLS,
        tool_choice: "auto",
        max_completion_tokens: 1500,
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
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments);
      
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
        case 'explain_chart':
        case 'query_financial_data':
        case 'set_filter':
          // These are handled conversationally - the AI should provide the explanation
          // We need to call the AI again to get the response
          const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-5",
              messages: [
                ...aiMessages,
                choice.message,
                {
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ success: true, args: toolArgs }),
                },
              ],
              max_completion_tokens: 800,
            }),
          });
          
          if (followUpResponse.ok) {
            const followUpData = await followUpResponse.json();
            const followUpMessage = followUpData.choices?.[0]?.message?.content;
            if (followUpMessage) {
              // Increment usage
              if (userId) {
                await incrementVoiceUsage(userId);
              }
              
              return new Response(
                JSON.stringify({ message: followUpMessage }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
          break;
      }

      if (actionResponse) {
        // Increment usage
        if (userId) {
          await incrementVoiceUsage(userId);
        }
        
        return new Response(
          JSON.stringify({ 
            message: actionResponse.message,
            action: actionResponse,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
