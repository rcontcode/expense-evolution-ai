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
// KEYWORD DETECTION PATTERNS - Priority-based intent recognition
// ============================================================================

// Navigation keywords with their target mappings
const NAVIGATION_KEYWORDS: Record<string, string[]> = {
  expenses: ['gastos', 'expenses', 'gasto', 'expense'],
  income: ['ingresos', 'income', 'ingreso', 'earnings'],
  clients: ['clientes', 'clients', 'cliente', 'client'],
  projects: ['proyectos', 'projects', 'proyecto', 'project'],
  contracts: ['contratos', 'contracts', 'contrato', 'contract'],
  dashboard: ['dashboard', 'inicio', 'home', 'resumen', 'summary', 'panel'],
  mileage: ['kilometraje', 'mileage', 'km', 'kilómetros', 'kilometers', 'millas'],
  networth: ['patrimonio', 'net worth', 'networth', 'riqueza', 'wealth'],
  banking: ['banca', 'banking', 'banco', 'bank', 'análisis bancario'],
  settings: ['configuración', 'settings', 'ajustes', 'config', 'preferencias'],
  capture: ['captura', 'capture', 'captura rápida', 'quick capture', 'foto'],
  chaos: ['chaos', 'revisión', 'review', 'centro de revisión', 'review center', 'bandeja'],
  reconciliation: ['reconciliación', 'reconciliation', 'reconciliar', 'reconcile'],
  business: ['negocio', 'business', 'perfil de negocio', 'business profile', 'empresa'],
  notifications: ['notificaciones', 'notifications', 'alertas', 'alerts'],
  mentorship: ['mentoría', 'mentorship', 'mentor', 'coaching', 'guía'],
  taxes: ['impuestos', 'taxes', 'fiscal', 'calendario fiscal', 'tax calendar', 'tributario'],
  tags: ['etiquetas', 'tags', 'tag', 'etiqueta'],
  betafeedback: ['beta', 'feedback', 'centro beta', 'beta center'],
  reports: ['reportes', 'reports', 'reporte', 'report', 'informes'],
};

// Navigation trigger phrases
const NAVIGATION_TRIGGERS = {
  es: ['llévame a', 'voy a', 'abre', 've a', 'muéstrame', 'ir a', 'navega a', 'quiero ver', 'enséñame'],
  en: ['take me to', 'go to', 'open', 'show me', 'navigate to', 'i want to see', 'let me see'],
};

// Query trigger phrases
const QUERY_TRIGGERS = {
  es: ['cuál es', 'cuáles son', 'cuánto', 'cuántos', 'dime', 'dame', 'qué tengo'],
  en: ['what is', 'what are', 'how much', 'how many', 'tell me', 'give me', 'what do i have'],
};

// Open specific item triggers
const OPEN_TRIGGERS = {
  es: ['abre el', 'abre la', 'abre al', 'muéstrame el', 'muéstrame la', 'accede a', 'accede al'],
  en: ['open the', 'show me the', 'access the', 'open my'],
};

// Explain triggers
const EXPLAIN_TRIGGERS = {
  es: ['explícame', 'cómo se usa', 'tutorial', 'enseña', 'ayuda con', 'cómo funciona', 'qué es'],
  en: ['explain', 'how to use', 'tutorial', 'teach me', 'help with', 'how does', 'what is'],
};

// ============================================================================
// INTENT DETECTION FUNCTIONS
// ============================================================================

interface DetectedIntent {
  action: 'navigate' | 'open' | 'query' | 'explain' | 'clarify' | 'conversational';
  target?: string;
  itemName?: string;
  queryType?: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();
}

function detectNavigationTarget(normalizedText: string): string | null {
  for (const [target, keywords] of Object.entries(NAVIGATION_KEYWORDS)) {
    for (const keyword of keywords) {
      // Check if the keyword appears in the text
      if (normalizedText.includes(keyword.toLowerCase())) {
        return target;
      }
    }
  }
  return null;
}

function hasNavigationTrigger(normalizedText: string, language: 'es' | 'en'): boolean {
  const triggers = [...NAVIGATION_TRIGGERS[language], ...NAVIGATION_TRIGGERS[language === 'es' ? 'en' : 'es']];
  return triggers.some(trigger => normalizedText.includes(trigger.toLowerCase()));
}

function hasQueryTrigger(normalizedText: string, language: 'es' | 'en'): boolean {
  const triggers = [...QUERY_TRIGGERS[language], ...QUERY_TRIGGERS[language === 'es' ? 'en' : 'es']];
  return triggers.some(trigger => normalizedText.includes(trigger.toLowerCase()));
}

function hasOpenTrigger(normalizedText: string, language: 'es' | 'en'): boolean {
  const triggers = [...OPEN_TRIGGERS[language], ...OPEN_TRIGGERS[language === 'es' ? 'en' : 'es']];
  return triggers.some(trigger => normalizedText.includes(trigger.toLowerCase()));
}

function hasExplainTrigger(normalizedText: string, language: 'es' | 'en'): boolean {
  const triggers = [...EXPLAIN_TRIGGERS[language], ...EXPLAIN_TRIGGERS[language === 'es' ? 'en' : 'es']];
  return triggers.some(trigger => normalizedText.includes(trigger.toLowerCase()));
}

function extractItemName(text: string, language: 'es' | 'en'): string | null {
  // Try to extract item name after open triggers
  const triggers = [...OPEN_TRIGGERS[language], ...OPEN_TRIGGERS[language === 'es' ? 'en' : 'es']];
  const normalizedText = text.toLowerCase();
  
  for (const trigger of triggers) {
    const triggerIndex = normalizedText.indexOf(trigger.toLowerCase());
    if (triggerIndex !== -1) {
      const afterTrigger = text.substring(triggerIndex + trigger.length).trim();
      // Get everything until the end or until a common stop word
      const stopWords = ['y', 'and', 'para', 'for', 'de', 'of'];
      let itemName = afterTrigger;
      for (const stop of stopWords) {
        const stopIndex = itemName.toLowerCase().indexOf(` ${stop} `);
        if (stopIndex !== -1) {
          itemName = itemName.substring(0, stopIndex);
        }
      }
      return itemName.trim() || null;
    }
  }
  return null;
}

function detectQueryType(normalizedText: string): string | null {
  if (normalizedText.includes('saldo') || normalizedText.includes('balance')) return 'balance';
  if (normalizedText.includes('gasto') || normalizedText.includes('expense')) return 'expenses';
  if (normalizedText.includes('ingreso') || normalizedText.includes('income')) return 'income';
  if (normalizedText.includes('cliente') || normalizedText.includes('client')) return 'clients';
  if (normalizedText.includes('proyecto') || normalizedText.includes('project')) return 'projects';
  if (normalizedText.includes('contrato') || normalizedText.includes('contract')) return 'contracts';
  if (normalizedText.includes('patrimonio') || normalizedText.includes('net worth')) return 'networth';
  if (normalizedText.includes('deducible') || normalizedText.includes('deductible')) return 'deductible';
  if (normalizedText.includes('facturable') || normalizedText.includes('billable')) return 'billable';
  return null;
}

function detectIntent(text: string, language: 'es' | 'en'): DetectedIntent {
  const normalizedText = normalizeText(text);
  
  console.log('[Intent] Analyzing:', normalizedText);
  
  // PRIORITY 1: Check for navigation with trigger words
  if (hasNavigationTrigger(normalizedText, language)) {
    const target = detectNavigationTarget(normalizedText);
    if (target) {
      console.log('[Intent] Navigate with trigger to:', target);
      return { action: 'navigate', target };
    }
  }
  
  // PRIORITY 2: Check for opening specific item
  if (hasOpenTrigger(normalizedText, language)) {
    const target = detectNavigationTarget(normalizedText);
    const itemName = extractItemName(text, language);
    if (target && itemName) {
      console.log('[Intent] Open item:', itemName, 'in:', target);
      return { action: 'open', target, itemName };
    }
    // Fall back to navigate if we can't extract item name
    if (target) {
      console.log('[Intent] Open section (no specific item):', target);
      return { action: 'navigate', target };
    }
  }
  
  // PRIORITY 3: Check for data queries
  if (hasQueryTrigger(normalizedText, language)) {
    const queryType = detectQueryType(normalizedText);
    if (queryType) {
      console.log('[Intent] Query for:', queryType);
      return { action: 'query', queryType };
    }
  }
  
  // PRIORITY 4: Check for explain/help requests
  if (hasExplainTrigger(normalizedText, language)) {
    const target = detectNavigationTarget(normalizedText);
    console.log('[Intent] Explain:', target || 'current_section');
    return { action: 'explain', target: target || 'current_section' };
  }
  
  // PRIORITY 5: Direct section name without trigger (still navigate)
  const directTarget = detectNavigationTarget(normalizedText);
  if (directTarget && normalizedText.split(/\s+/).length <= 3) {
    console.log('[Intent] Direct navigation to:', directTarget);
    return { action: 'navigate', target: directTarget };
  }
  
  // PRIORITY 6: If there's a target and some action-like words, navigate
  if (directTarget) {
    console.log('[Intent] Navigate (target detected):', directTarget);
    return { action: 'navigate', target: directTarget };
  }
  
  // Default: conversational
  console.log('[Intent] Conversational');
  return { action: 'conversational' };
}

// ============================================================================
// RESPONSE GENERATORS
// ============================================================================

interface ActionResponse {
  action: string;
  target?: string;
  route?: string;
  name?: string;
  message: string;
  data?: Record<string, unknown>;
  intent?: string;
}

interface UserContext {
  userName?: string;
  currentRoute?: string;
  currentPageName?: string;
  totalExpenses?: number;
  totalIncome?: number;
  pendingReceipts?: number;
  clientCount?: number;
  projectCount?: number;
  yearlyExpenses?: number;
  yearlyIncome?: number;
  balance?: number;
  biggestExpense?: { amount: number; vendor?: string; description?: string };
  topCategory?: { category: string; amount: number };
  deductibleTotal?: number;
  billableTotal?: number;
}

function generateNavigateResponse(target: string, language: 'es' | 'en'): ActionResponse {
  const routeInfo = AVAILABLE_ROUTES[target as keyof typeof AVAILABLE_ROUTES];
  if (!routeInfo) {
    return {
      action: 'navigate',
      target: 'dashboard',
      route: '/dashboard',
      name: 'Dashboard',
      message: language === 'es' ? 'Te llevo al Dashboard' : 'Taking you to Dashboard',
      intent: 'clear_action',
    };
  }
  
  const name = routeInfo.names[language];
  return {
    action: 'navigate',
    target,
    route: routeInfo.route,
    name,
    message: language === 'es' ? `Te llevo a ${name}` : `Taking you to ${name}`,
    intent: 'clear_action',
  };
}

function generateOpenResponse(target: string, itemName: string, language: 'es' | 'en'): ActionResponse {
  const routeInfo = AVAILABLE_ROUTES[target as keyof typeof AVAILABLE_ROUTES];
  const name = routeInfo?.names[language] || target;
  
  return {
    action: 'open',
    target,
    route: routeInfo?.route || `/${target}`,
    name,
    message: language === 'es' ? `Abriendo ${itemName}` : `Opening ${itemName}`,
    data: { itemName },
    intent: 'clear_action',
  };
}

function generateQueryResponse(queryType: string, context: UserContext, language: 'es' | 'en'): ActionResponse {
  let message = '';
  const data: Record<string, unknown> = {};
  
  switch (queryType) {
    case 'balance':
      const balance = context.balance || 0;
      const income = context.yearlyIncome || 0;
      const expenses = context.yearlyExpenses || 0;
      message = language === 'es' 
        ? `Tu balance anual es $${balance.toFixed(2)}. Has generado $${income.toFixed(2)} en ingresos y $${expenses.toFixed(2)} en gastos.`
        : `Your annual balance is $${balance.toFixed(2)}. You've earned $${income.toFixed(2)} and spent $${expenses.toFixed(2)}.`;
      data.balance = balance;
      data.income = income;
      data.expenses = expenses;
      break;
      
    case 'expenses':
      const monthlyExp = context.totalExpenses || 0;
      const yearlyExp = context.yearlyExpenses || 0;
      const topCat = context.topCategory;
      message = language === 'es'
        ? `Este mes has gastado $${monthlyExp.toFixed(2)}. Anual: $${yearlyExp.toFixed(2)}.${topCat ? ` Mayor categoría: ${topCat.category} ($${topCat.amount.toFixed(2)}).` : ''}`
        : `This month you've spent $${monthlyExp.toFixed(2)}. Yearly: $${yearlyExp.toFixed(2)}.${topCat ? ` Top category: ${topCat.category} ($${topCat.amount.toFixed(2)}).` : ''}`;
      data.monthly = monthlyExp;
      data.yearly = yearlyExp;
      data.topCategory = topCat;
      break;
      
    case 'income':
      const monthlyInc = context.totalIncome || 0;
      const yearlyInc = context.yearlyIncome || 0;
      message = language === 'es'
        ? `Este mes has ganado $${monthlyInc.toFixed(2)}. Anual: $${yearlyInc.toFixed(2)}.`
        : `This month you've earned $${monthlyInc.toFixed(2)}. Yearly: $${yearlyInc.toFixed(2)}.`;
      data.monthly = monthlyInc;
      data.yearly = yearlyInc;
      break;
      
    case 'clients':
      const clientCount = context.clientCount || 0;
      message = language === 'es'
        ? `Tienes ${clientCount} cliente${clientCount !== 1 ? 's' : ''} registrado${clientCount !== 1 ? 's' : ''}.`
        : `You have ${clientCount} registered client${clientCount !== 1 ? 's' : ''}.`;
      data.count = clientCount;
      break;
      
    case 'projects':
      const projectCount = context.projectCount || 0;
      message = language === 'es'
        ? `Tienes ${projectCount} proyecto${projectCount !== 1 ? 's' : ''}.`
        : `You have ${projectCount} project${projectCount !== 1 ? 's' : ''}.`;
      data.count = projectCount;
      break;
      
    case 'deductible':
      const deductible = context.deductibleTotal || 0;
      message = language === 'es'
        ? `Tu total deducible es $${deductible.toFixed(2)}.`
        : `Your deductible total is $${deductible.toFixed(2)}.`;
      data.total = deductible;
      break;
      
    case 'billable':
      const billable = context.billableTotal || 0;
      message = language === 'es'
        ? `Tu total facturable es $${billable.toFixed(2)}.`
        : `Your billable total is $${billable.toFixed(2)}.`;
      data.total = billable;
      break;
      
    default:
      message = language === 'es'
        ? 'No pude encontrar esa información específica. ¿Qué dato necesitas?'
        : "I couldn't find that specific information. What data do you need?";
  }
  
  return {
    action: 'query',
    target: queryType,
    message,
    data,
    intent: 'clear_query',
  };
}

// ============================================================================
// AI FALLBACK PROMPT (for conversational and complex queries)
// ============================================================================

const AI_FALLBACK_PROMPT = `
Eres un asistente financiero breve y directo. Tu objetivo es EJECUTAR acciones, no solo hablar.

REGLAS ABSOLUTAS:
1. Respuestas CORTAS (máximo 1-2 oraciones)
2. Si detectas navegación, devuelve JSON con action:navigate
3. Si detectas consulta de datos, devuelve JSON con action:query
4. Si detectas apertura de item específico, devuelve JSON con action:open
5. NO hagas tutoriales largos
6. NO repitas la misma respuesta genérica

FORMATO DE RESPUESTA JSON (obligatorio para acciones):
{"action":"navigate","target":"expenses","message":"Te llevo a Gastos"}
{"action":"query","target":"balance","message":"Tu balance es $X"}
{"action":"open","target":"clients","message":"Abriendo cliente X","data":{"itemName":"X"}}

TARGETS VÁLIDOS: expenses, income, clients, projects, contracts, dashboard, mileage, networth, banking, settings, capture, chaos, reconciliation, business, notifications, mentorship, taxes, tags, betafeedback, reports

Para CONVERSACIÓN PURA (sin acción): responde en texto plano, breve y útil.
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

    const { messages, userContext, language = 'es' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the last user message
    const lastMessage = messages?.[messages.length - 1]?.content || '';
    console.log('[Assistant] Processing message:', lastMessage);

    // STEP 1: Detect intent locally (fast, deterministic)
    const detectedIntent = detectIntent(lastMessage, language as 'es' | 'en');
    console.log('[Assistant] Detected intent:', JSON.stringify(detectedIntent));

    // STEP 2: Generate response based on detected intent
    let actionResponse: ActionResponse | null = null;

    switch (detectedIntent.action) {
      case 'navigate':
        if (detectedIntent.target) {
          actionResponse = generateNavigateResponse(detectedIntent.target, language as 'es' | 'en');
          console.log('[Assistant] Generated navigate response:', JSON.stringify(actionResponse));
        }
        break;
        
      case 'open':
        if (detectedIntent.target && detectedIntent.itemName) {
          actionResponse = generateOpenResponse(detectedIntent.target, detectedIntent.itemName, language as 'es' | 'en');
          console.log('[Assistant] Generated open response:', JSON.stringify(actionResponse));
        }
        break;
        
      case 'query':
        if (detectedIntent.queryType) {
          actionResponse = generateQueryResponse(detectedIntent.queryType, userContext || {}, language as 'es' | 'en');
          console.log('[Assistant] Generated query response:', JSON.stringify(actionResponse));
        }
        break;
        
      case 'explain':
        // For explain, we navigate and let the AI explain
        if (detectedIntent.target && detectedIntent.target !== 'current_section') {
          const navResponse = generateNavigateResponse(detectedIntent.target, language as 'es' | 'en');
          navResponse.action = 'both'; // Navigate + explain
          actionResponse = navResponse;
          console.log('[Assistant] Generated explain+navigate response');
        }
        break;
    }

    // If we have a deterministic response, return it immediately
    if (actionResponse) {
      // Increment voice usage for successful request
      if (userId) {
        await incrementVoiceUsage(userId);
      }
      
      return new Response(
        JSON.stringify({ 
          message: actionResponse.message,
          action: actionResponse
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // STEP 3: Fall back to AI for conversational/complex queries
    console.log('[Assistant] Falling back to AI for conversational response');

    let contextInfo = "";
    if (userContext) {
      contextInfo = `
CONTEXTO: ${userContext.userName || 'Usuario'} | Gastos mes: $${userContext.totalExpenses?.toFixed(2) || '0'} | Ingresos: $${userContext.totalIncome?.toFixed(2) || '0'} | Balance: $${userContext.balance?.toFixed(2) || '0'} | Clientes: ${userContext.clientCount || 0} | Proyectos: ${userContext.projectCount || 0}
Ruta actual: ${userContext.currentRoute || 'desconocida'}
`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: AI_FALLBACK_PROMPT + contextInfo },
          ...messages,
        ],
        max_tokens: 400,
        temperature: 0.1,
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
      throw new Error("Error al procesar la solicitud");
    }

    const data = await response.json();
    let assistantMessage = data.choices?.[0]?.message?.content || 
      (language === 'es' ? "Lo siento, no pude procesar tu pregunta." : "Sorry, I couldn't process your request.");

    // Try to parse any JSON from AI response
    let parsedAction: ActionResponse | null = null;
    
    // Check if response is pure JSON
    const trimmed = assistantMessage.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.action && parsed.message) {
          parsedAction = parsed;
          // Enrich with route info
          if (parsedAction && parsedAction.target) {
            const routeInfo = AVAILABLE_ROUTES[parsedAction.target as keyof typeof AVAILABLE_ROUTES];
            if (routeInfo) {
              parsedAction.route = routeInfo.route;
              parsedAction.name = routeInfo.names[language as 'es' | 'en'];
            }
          }
        }
      } catch {
        // Not valid JSON, use as message
      }
    }

    // Check for embedded JSON
    if (!parsedAction) {
      const jsonMatch = assistantMessage.match(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.action && parsed.message) {
            parsedAction = parsed;
            // Enrich with route info
            if (parsedAction && parsedAction.target) {
              const routeInfo = AVAILABLE_ROUTES[parsedAction.target as keyof typeof AVAILABLE_ROUTES];
              if (routeInfo) {
                parsedAction.route = routeInfo.route;
                parsedAction.name = routeInfo.names[language as 'es' | 'en'];
              }
            }
          }
        } catch {
          // Not valid JSON
        }
      }
    }

    // Increment voice usage for successful AI response
    if (userId) {
      await incrementVoiceUsage(userId);
    }

    return new Response(
      JSON.stringify({ 
        message: parsedAction?.message || assistantMessage,
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
