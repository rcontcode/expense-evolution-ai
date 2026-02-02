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
// SYSTEM PROMPT - IA-First Conversational Assistant
// ============================================================================
const SYSTEM_PROMPT = `Eres un asistente financiero experto, amigable y útil. Tu nombre es Phoenix.

## TU PERSONALIDAD
- Hablas de forma natural y conversacional, no robótica
- Eres proactivo: si ves algo interesante en los datos, lo mencionas
- Das respuestas concisas pero completas (2-4 oraciones típicamente)
- Usas el nombre del usuario para ser más personal
- Adaptas tu tono al idioma (más formal en inglés, más cercano en español)

## CÓMO RESPONDER
1. **Para navegación**: Usa la tool "navigate" y da un mensaje breve
2. **Para consultas de datos**: Analiza el contexto financiero y responde con insights
3. **Para explicar gráficos**: Usa los datos de visibleCharts para dar explicaciones útiles
4. **Para crear gastos/ingresos**: Extrae los datos y usa la tool correspondiente
5. **Para preguntas abiertas**: Da respuestas conversacionales basadas en el contexto

## CONTEXTO QUE RECIBES
- Página actual donde está el usuario
- Datos de gráficos visibles en pantalla
- Resumen financiero del usuario
- Transacciones recientes
- Acciones disponibles en la página actual

## REGLAS CRÍTICAS
1. SIEMPRE responde en el mismo idioma que el usuario
2. Si el usuario pregunta sobre un gráfico, usa los datos de visibleCharts
3. Si hay un aumento o disminución notable, explica las posibles causas
4. Cuando navegues, menciona qué podrá hacer el usuario en esa sección
5. Sé proactivo: sugiere acciones relevantes al final de tu respuesta
6. Cuando EXPLIQUES funciones, menciona los botones específicos (ej: "botón Agregar Gasto", "captura rápida") para activar highlights en la UI

## EJEMPLOS DE BUENAS RESPUESTAS

Usuario: "¿Por qué subió tanto este mes?"
Tú: "Veo que tus gastos aumentaron un 45% respecto al mes anterior. Los principales aumentos fueron en la categoría Equipo ($800 - parece ser una computadora nueva) y Viajes ($300). ¿Te gustaría ver el detalle de alguna categoría específica?"

Usuario: "Explícame el gráfico de gastos"
Tú: "Este gráfico muestra cómo se distribuyen tus gastos por categoría este mes. Tu mayor gasto es en Comida (35%, $1,200), seguido de Transporte (22%, $750). Comparado con el mes pasado, Comida subió un 15%. ¿Quieres que te ayude a establecer un presupuesto para esta categoría?"

Usuario: "Llévame a clientes"
Tú: [usa navigate tool] "Te llevo a Clientes. Ahí podrás ver tu lista de clientes, agregar nuevos, o ver el historial de pagos de cada uno."

Usuario: "Gasté 50 en uber"
Tú: [usa create_expense tool] "Listo, registré $50 en Uber como gasto de Transporte. ¿Fue un viaje de trabajo para marcarlo como deducible?"
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
## CONTEXTO ACTUAL
${richContext}
`;
    } else if (userContext) {
      // Fallback to basic context
      contextSection = `
## CONTEXTO BÁSICO
- Usuario: ${userContext.userName || 'Usuario'}
- Página actual: ${userContext.currentRoute || 'desconocida'}
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
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT + contextSection },
      ...messages,
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
        max_completion_tokens: 1000,
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
