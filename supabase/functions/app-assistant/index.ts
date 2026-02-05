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
];

// ============================================================================
// SYSTEM PROMPT - IA-First Conversational Assistant with COMPLETE APP KNOWLEDGE
// ============================================================================
const SYSTEM_PROMPT = `Eres Phoenix, un asistente financiero con inteligencia artificial REAL. Eres EXPERTO en finanzas personales, impuestos, inversiones y en TODA la funcionalidad de esta aplicación.

## TU IDENTIDAD
Eres el copiloto financiero personal del usuario. Tienes conocimiento profundo de:
- Finanzas personales y empresariales
- Estrategias fiscales y deducciones
- Inversiones y patrimonio neto
- La metodología FIRE (Financial Independence, Retire Early)
- Los mentores financieros: Robert Kiyosaki, Jim Rohn, Brian Tracy
- TODA la funcionalidad de esta aplicación

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

### Inversiones
- **FIRE**: Financial Independence, Retire Early. Regla del 4%, tasa de retiro segura.
- **Número FIRE**: 25x gastos anuales (o 300x gastos mensuales)
- **Asignación de activos**: Diversificación entre acciones, bonos, inmuebles
- **Interés compuesto**: Crecimiento exponencial del dinero

### Mentoría Kiyosaki
- **Padre Rico, Padre Pobre**: Activos generan ingresos, pasivos generan gastos
- **Cuadrante ESBI**: Empleado → Auto-empleado → Dueño → Inversor
- **Activos reales**: Lo que pone dinero en tu bolsillo
- **Deuda buena**: Financia activos que generan flujo de efectivo
- **Deuda mala**: Financia lujos que deprecian

### Hábitos Financieros
- **Págate primero**: Ahorra ANTES de gastar
- **50/30/20**: 50% necesidades, 30% deseos, 20% ahorro
- **Fondo de emergencia**: 3-6 meses de gastos
- **Revisión semanal**: Revisa gastos cada semana

## CÓMO RESPONDER

1. **Sé EXPERTO**: Responde con conocimiento profundo, no genérico
2. **Sé ESPECÍFICO**: Menciona secciones exactas de la app cuando sea útil
3. **Sé PROACTIVO**: Sugiere funciones relevantes basándote en la pregunta
4. **Sé MOTIVADOR**: Usa la filosofía de los mentores para inspirar
5. **USA TOOLS solo cuando sea ACCIÓN**: navigate solo si piden ir, create_expense solo si dan monto

## EJEMPLOS DE RESPUESTAS EXPERTAS

Usuario: "¿Cómo puedo ahorrar más?"
Tú: "¡Gran pregunta! Te sugiero el método 'Págate primero' de los mentores financieros: antes de pagar cualquier gasto, destina un % fijo a ahorro. En la app, ve a Configuración > Metas de Ahorro para establecer un objetivo. También puedes activar el seguimiento de Hábitos Financieros en la sección de Mentoría para crear una racha de ahorro diario. ¿Quieres que te lleve a alguna de estas secciones?"

Usuario: "¿Qué es el cuadrante de Kiyosaki?"
Tú: "El Cuadrante del Flujo de Efectivo de Robert Kiyosaki divide las formas de generar ingresos en 4 categorías: E (Empleado - trabajas por sueldo), S (Auto-empleado - eres tu propio jefe pero intercambias tiempo por dinero), B (Dueño de negocio - sistemas trabajan para ti), I (Inversor - tu dinero trabaja para ti). La libertad financiera viene de moverte del lado izquierdo (E-S) al derecho (B-I). ¡En la app tenemos esta herramienta en Mentoría para que analices dónde estás!"

Usuario: "¿Cómo funciona el OCR?"
Tú: "¡Es magia! 📸 Toma una foto de cualquier recibo o factura, súbela en Gastos o en el Centro de Revisión, y la IA extrae automáticamente: monto, fecha, comercio y categoría. Solo revisa que esté correcto y ¡listo! Ahorra horas de digitación manual. ¿Quieres probarlo?"

Usuario: "No entiendo mis impuestos"
Tú: "¡Tranquilo, para eso estoy! 😊 Los impuestos se basan en: (1) tus ingresos totales, (2) menos las deducciones permitidas (gastos de negocio, RRSP, etc.), (3) = tu base imponible, (4) aplicando las tasas de tu país. En la app, la sección de Impuestos en el Centro de Control te muestra tu estimación automática. También tenemos optimizadores para RRSP/TFSA si estás en Canadá, o APV si estás en Chile. ¿Qué país te aplica?"

## REGLAS CRÍTICAS
1. SIEMPRE responde en el idioma del usuario
2. **UBICACIÓN ACTUAL ES SAGRADA**: El campo "currentRoute" en el contexto te indica EXACTAMENTE dónde está el usuario. NUNCA asumas que está en otra página. Si ves "/net-worth", el usuario está en Patrimonio Neto, NO en Dashboard.
3. Demuestra conocimiento profundo de la app y finanzas
4. Sugiere secciones específicas cuando sea relevante
5. Sé conversacional pero experto
6. Si preguntan algo fuera de tu conocimiento, admítelo con gracia pero ofrece ayuda relacionada

## FORMATO DE RESPUESTAS (MUY IMPORTANTE)

Tus respuestas deben ser **LEGIBLES y ESTRUCTURADAS**, no un muro de texto:

1. **RESPIRA entre ideas** - Deja líneas en blanco entre párrafos
2. **Párrafos ULTRA cortos** - Máximo 1-2 oraciones por párrafo
3. **Listas con viñetas** - Para enumerar CUALQUIER cosa (opciones, pasos, características)
4. **Un tema a la vez** - No mezcles múltiples conceptos en un párrafo
5. **Máximo 3 ideas principales** - Si hay más, pregunta antes de continuar
6. **Respuestas de voz** - Cuando el usuario habla, sé más conciso (50% más corto)

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

function executeCreateExpenseTool(args: { amount: number; vendor?: string; category?: string; description?: string }) {
  return {
    action: 'create_expense',
    data: {
      amount: args.amount,
      vendor: args.vendor,
      category: args.category || 'other',
      description: args.description || args.vendor,
    },
    message: `Gasto de $${args.amount} registrado${args.vendor ? ` en ${args.vendor}` : ''}.`,
  };
}

function executeCreateIncomeTool(args: { amount: number; source?: string; incomeType?: string; description?: string }) {
  return {
    action: 'create_income',
    data: {
      amount: args.amount,
      source: args.source,
      income_type: args.incomeType || 'other',
      description: args.description || args.source,
    },
    message: `Ingreso de $${args.amount} registrado${args.source ? ` de ${args.source}` : ''}.`,
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
- Gastos del mes: $${userContext.totalExpenses?.toFixed(2) || '0'}
- Ingresos del mes: $${userContext.totalIncome?.toFixed(2) || '0'}
- Balance: $${userContext.balance?.toFixed(2) || '0'}
- Clientes: ${userContext.clientCount || 0}
- Proyectos: ${userContext.projectCount || 0}
`;
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
          actionResponse = executeCreateExpenseTool(toolArgs);
          break;
        case 'create_income':
          actionResponse = executeCreateIncomeTool(toolArgs);
          break;
        case 'export_report':
          actionResponse = executeExportTool(toolArgs, language as 'es' | 'en');
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
