import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Available routes for navigation actions
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
  chaos: { route: '/chaos-inbox', names: { es: 'Centro de Revisión', en: 'Review Center' } },
  reconciliation: { route: '/reconciliation', names: { es: 'Reconciliación', en: 'Reconciliation' } },
  business: { route: '/business-profile', names: { es: 'Perfil de Negocio', en: 'Business Profile' } },
  notifications: { route: '/notifications', names: { es: 'Notificaciones', en: 'Notifications' } },
  mentorship: { route: '/mentorship', names: { es: 'Mentoría', en: 'Mentorship' } },
  taxes: { route: '/tax-calendar', names: { es: 'Calendario Fiscal', en: 'Tax Calendar' } },
  tags: { route: '/tags', names: { es: 'Etiquetas', en: 'Tags' } },
  betafeedback: { route: '/beta-feedback', names: { es: 'Centro Beta', en: 'Beta Center' } },
};

// ============================================================================
// INTELLIGENT INTENT DETECTION SYSTEM v3
// ============================================================================

const APP_KNOWLEDGE = `
Eres un asistente personal de finanzas integrado en EvoFinz. Tu nombre es "Asistente Financiero".
Tu objetivo es ENTENDER la intención del usuario y actuar de forma inteligente.

🎯 CLASIFICACIÓN DE INTENCIÓN (SISTEMA DE PRIORIDADES):

PRIORIDAD 1 - NAVEGACIÓN DIRECTA (action = navigate):
Detecta estas señales y RESPONDE CON JSON INMEDIATAMENTE:
- Nombre de página solo: "gastos", "income", "clientes"
- Verbos de movimiento: "llévame a", "ve a", "abre", "muestra", "take me to", "go to", "open"
- Comandos directos: "dashboard", "configuración", "mentoría"

PRIORIDAD 2 - CONSULTA DE DATOS (action = query):
Señales: "cuánto", "cuál", "dime", "mi balance", "mis", "how much", "what's my"
- "cuánto gasté" → responder con datos del contexto
- "mi balance" → calcular y responder con análisis
- "cuántos clientes tengo" → responder con conteo y contexto

PRIORIDAD 3 - INTENCIÓN MIXTA (action = clarify):
SOLO cuando hay múltiples acciones válidas simultáneas:
- "gastos y explícame cómo funcionan" → ofrecer opciones
- "llévame a clientes y agrega uno nuevo" → ofrecer opciones
- NO clarificar si solo dice el nombre de una página

PRIORIDAD 4 - CONVERSACIONAL (texto sin JSON):
Para educación, conceptos, charla:
- "¿qué es RRSP?" → explicación educativa
- "cómo funciona FIRE" → explicación con ejemplos
- "dame consejos de ahorro" → tips personalizados

📝 FORMATO DE RESPUESTA ESTRUCTURADA (JSON obligatorio para acciones):

Para NAVEGACIÓN:
{"action":"navigate","intent":"clear_action","target":"expenses","message":"Te llevo a Gastos. Aquí puedes gestionar todos tus gastos registrados, filtrarlos y agregar nuevos."}

Para CONSULTA DE DATOS:
{"action":"query","intent":"clear_query","target":"balance","message":"Tu balance anual es $X. Has generado $Y en ingresos y gastado $Z. Tu mayor gasto fue en [categoría] con $A."}

Para CLARIFICACIÓN:
{"action":"clarify","intent":"mixed_intent","message":"¿Qué prefieres hacer?","options":[
  {"id":"1","label":"Ir a la página","action":"navigate","target":"expenses"},
  {"id":"2","label":"Explicar desde aquí","action":"explain"},
  {"id":"3","label":"Ambos: ir y explicar","action":"both","target":"expenses"}
]}

Para CONVERSACIÓN: texto educativo sin JSON, pero personalizado con datos del usuario cuando sea relevante.

🗺️ TARGETS VÁLIDOS PARA NAVEGACIÓN:
expenses, income, clients, projects, contracts, dashboard, mileage, networth, banking, settings, capture, chaos, reconciliation, business, notifications, mentorship, taxes, tags, betafeedback

📊 DETECCIÓN INTELIGENTE DE CONSULTAS:
Cuando el usuario pregunta por datos, SIEMPRE incluye:
1. El dato específico solicitado
2. Comparación o contexto (vs mes anterior, promedio, etc.)
3. Una observación o recomendación breve

Ejemplos de respuesta rica:
- "Este mes has gastado $1,234. Es un 15% más que el mes pasado. Tu mayor categoría fue Tecnología con $456."
- "Tu balance anual es $5,000 positivo. Has generado $25,000 en ingresos y $20,000 en gastos. ¡Buen trabajo!"

🎯 EJEMPLOS CRÍTICOS (MEMORIZAR):

INPUT: "gastos" → {"action":"navigate","intent":"clear_action","target":"expenses","message":"Te llevo a Gastos"}
INPUT: "expenses" → {"action":"navigate","intent":"clear_action","target":"expenses","message":"Taking you to Expenses"}
INPUT: "muéstrame mis gastos" → {"action":"navigate","intent":"clear_action","target":"expenses","message":"Aquí están tus gastos"}
INPUT: "cuánto gasté" → {"action":"query","intent":"clear_query","target":"expenses_month","message":"Este mes has gastado $X..."}
INPUT: "mi balance" → {"action":"query","intent":"clear_query","target":"balance","message":"Tu balance anual es $X..."}
INPUT: "qué es RRSP" → [texto educativo sin JSON]
INPUT: "gastos y cómo funcionan" → {"action":"clarify","intent":"mixed_intent",...}

🌍 PAÍSES SOPORTADOS: 🇨🇦 Canadá (CRA, RRSP, TFSA, T2125) | 🇨🇱 Chile (SII, RUT, APV, F22)

🚫 REGLAS ABSOLUTAS:
- NO saludes en cada mensaje (el saludo ya está en el UI)
- Responde SIEMPRE en el IDIOMA del usuario (es/en)
- Para navegación simple: SIEMPRE devuelve JSON, no texto
- Si el usuario solo dice nombre de página: navega directo, NO clarifiques
- Incluye el campo "intent" en cada respuesta JSON para tracking
- Respuestas de datos deben ser ricas en contexto, no solo el número
- Cuando el usuario dice algo corto como "ingresos" o "clientes", es navegación directa
- Prefiere respuestas concisas y accionables
`;

// ============================================================================
// ROBUST JSON EXTRACTION (Multi-strategy parser)
// ============================================================================

interface ExtractedAction {
  action: string;
  target?: string;
  message: string;
  options?: Array<{
    id: string;
    label: string;
    action: string;
    target?: string;
  }>;
  intent?: string;
  route?: string;
  name?: string;
}

function extractJSON(text: string): ExtractedAction | null {
  const trimmed = text.trim();
  
  // Strategy 1: Pure JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.action && parsed.message) {
        console.log('[Parser] Strategy 1: Pure JSON');
        return parsed as ExtractedAction;
      }
    } catch {
      // Not valid JSON
    }
  }

  // Strategy 2: JSON inside code fences
  const codeFenceMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeFenceMatch) {
    try {
      const parsed = JSON.parse(codeFenceMatch[1]);
      if (parsed.action && parsed.message) {
        console.log('[Parser] Strategy 2: Code fence JSON');
        return parsed as ExtractedAction;
      }
    } catch {
      // Not valid JSON
    }
  }

  // Strategy 3: First JSON block found anywhere
  const jsonMatch = text.match(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action && parsed.message) {
        console.log('[Parser] Strategy 3: Embedded JSON');
        return parsed as ExtractedAction;
      }
    } catch {
      // Not valid JSON
    }
  }

  // Strategy 4: Heuristic detection
  const actionPatterns = [
    { pattern: /te llevo a (gastos|expenses)/i, action: 'navigate', target: 'expenses' },
    { pattern: /te llevo a (ingresos|income)/i, action: 'navigate', target: 'income' },
    { pattern: /te llevo a (clientes|clients)/i, action: 'navigate', target: 'clients' },
    { pattern: /te llevo a (proyectos|projects)/i, action: 'navigate', target: 'projects' },
    { pattern: /te llevo a (dashboard|inicio)/i, action: 'navigate', target: 'dashboard' },
    { pattern: /te llevo a (patrimonio|net worth)/i, action: 'navigate', target: 'networth' },
    { pattern: /te llevo a (mentor|mentoría)/i, action: 'navigate', target: 'mentorship' },
    { pattern: /te llevo a (impuestos|taxes|fiscal)/i, action: 'navigate', target: 'taxes' },
    { pattern: /te llevo a (banco|banking|banca)/i, action: 'navigate', target: 'banking' },
    { pattern: /taking you to (expenses|gastos)/i, action: 'navigate', target: 'expenses' },
    { pattern: /taking you to (income|ingresos)/i, action: 'navigate', target: 'income' },
    { pattern: /taking you to (clients|clientes)/i, action: 'navigate', target: 'clients' },
    { pattern: /taking you to (dashboard|home)/i, action: 'navigate', target: 'dashboard' },
  ];

  for (const { pattern, action, target } of actionPatterns) {
    if (pattern.test(text)) {
      console.log('[Parser] Strategy 4: Heuristic for', target);
      return {
        action,
        target,
        message: text.replace(/```[\s\S]*?```/g, '').trim().substring(0, 200),
      };
    }
  }

  console.log('[Parser] No JSON found, conversational response');
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext, language = 'es' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context
    let contextInfo = "";
    if (userContext) {
      const { 
        userName,
        currentRoute,
        currentPageName,
        totalExpenses, 
        totalIncome, 
        pendingReceipts, 
        clientCount, 
        projectCount,
        yearlyExpenses,
        yearlyIncome,
        balance,
        biggestExpense,
        topCategory,
        deductibleTotal,
        billableTotal
      } = userContext;
      
      contextInfo = `
CONTEXTO DEL USUARIO:
- Nombre: ${userName || 'Usuario'}
- Ruta actual: ${currentRoute || 'desconocida'}
- Página actual: ${currentPageName || 'desconocida'}
- Gastos este mes: $${totalExpenses?.toFixed(2) || '0.00'}
- Gastos este año: $${yearlyExpenses?.toFixed(2) || '0.00'}
- Ingresos este mes: $${totalIncome?.toFixed(2) || '0.00'}
- Ingresos este año: $${yearlyIncome?.toFixed(2) || '0.00'}
- Balance anual: $${balance?.toFixed(2) || '0.00'}
- Recibos pendientes: ${pendingReceipts || 0}
- Clientes: ${clientCount || 0}
- Proyectos: ${projectCount || 0}
- Mayor gasto: ${biggestExpense ? `$${biggestExpense.amount} en ${biggestExpense.vendor || biggestExpense.description || 'sin descripción'}` : 'ninguno'}
- Categoría top: ${topCategory ? `${topCategory.category}: $${topCategory.amount}` : 'ninguna'}
- Total deducible: $${deductibleTotal?.toFixed(2) || '0.00'}
- Total facturable: $${billableTotal?.toFixed(2) || '0.00'}
- Idioma: ${language === 'es' ? 'Español' : 'English'}
`;
    }

    const systemPrompt = APP_KNOWLEDGE + contextInfo;

    console.log('[AI] Sending request with', messages?.length, 'messages');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 800,
        temperature: 0.1, // More deterministic responses
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
      console.error("[AI] Gateway error:", response.status, errorText);
      throw new Error("Error al procesar la solicitud");
    }

    const data = await response.json();
    let assistantMessage = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu pregunta.";

    console.log('[AI] Raw response:', assistantMessage.substring(0, 200));

    // Use robust multi-strategy parser
    let parsedAction = extractJSON(assistantMessage);

    // Enrich navigation with route info
    if (parsedAction?.action === 'navigate' && parsedAction.target) {
      const routeInfo = AVAILABLE_ROUTES[parsedAction.target as keyof typeof AVAILABLE_ROUTES];
      if (routeInfo) {
        parsedAction.route = routeInfo.route;
        parsedAction.name = routeInfo.names[language as 'es' | 'en'] || routeInfo.names.es;
      }
    }

    // Enrich clarification options with routes
    if (parsedAction?.action === 'clarify' && parsedAction.options && Array.isArray(parsedAction.options)) {
      // deno-lint-ignore no-explicit-any
      parsedAction.options = parsedAction.options.map((opt: any) => {
        if (opt.target) {
          const routeInfo = AVAILABLE_ROUTES[opt.target as keyof typeof AVAILABLE_ROUTES];
          if (routeInfo) {
            return { ...opt, route: routeInfo.route };
          }
        }
        return opt;
      });
      console.log('[AI] Enriched clarification options:', parsedAction.options);
    }

    // If action was parsed, use the action's message
    const finalMessage = parsedAction?.message || assistantMessage;

    return new Response(
      JSON.stringify({ 
        message: finalMessage,
        action: parsedAction 
      }),
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
