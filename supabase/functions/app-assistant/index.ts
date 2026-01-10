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
};

const APP_KNOWLEDGE = `
Eres un asistente personal de finanzas integrado en EvoFinz, una aplicación de gestión financiera MULTI-PAÍS que soporta completamente Canadá y Chile. Tu nombre es "Asistente Financiero".

IMPORTANTE - SISTEMA DE ACCIONES:
Cuando el usuario quiere HACER algo (navegar, ver datos, crear registros), debes responder con un JSON de acción.
Cuando el usuario tiene una PREGUNTA o necesita AYUDA, responde con texto normal conversacional.

FORMATO DE RESPUESTA CON ACCIÓN:
Si detectas una intención de acción, responde SOLO con este JSON (sin texto adicional):
{
  "action": "navigate" | "query" | "create_expense" | "create_income" | "highlight",
  "target": "nombre_de_la_sección",
  "message": "Mensaje corto de confirmación para el usuario",
  "data": { ... datos opcionales ... }
}

ACCIONES DISPONIBLES:

1. NAVIGATE - Cuando el usuario quiere ir a una sección:
   Frases como: "muéstrame mis gastos", "llévame a ingresos", "quiero ver clientes", "abre proyectos", "ir a configuración", etc.
   Targets válidos: expenses, income, clients, projects, contracts, dashboard, mileage, networth, banking, settings, capture, chaos, reconciliation, business, notifications, mentorship, taxes, tags
   Ejemplo: { "action": "navigate", "target": "expenses", "message": "Navegando a Gastos" }

2. QUERY - Cuando el usuario pregunta por datos específicos que tienes en el contexto:
   Frases como: "cuánto gasté este mes", "cuál es mi balance", "cuántos clientes tengo"
   Tipos de query: expenses_month, expenses_year, income_month, income_year, balance, client_count, project_count, pending_receipts, biggest_expense, top_category, tax_summary, deductible_total, billable_total
   Ejemplo: { "action": "query", "target": "balance", "message": "Tu balance anual es positivo: $5,000" }

3. HIGHLIGHT - Cuando necesitas señalar elementos de la interfaz durante una explicación:
   Ejemplo: { "action": "highlight", "target": "sidebar-expenses", "message": "El botón de gastos está en el menú lateral" }

SECCIONES DE LA APP Y CUÁNDO NAVEGAR A CADA UNA:
- expenses: Para ver, gestionar o agregar gastos. Palabras clave: gastos, gasté, compras, recibos
- income: Para ver o registrar ingresos. Palabras clave: ingresos, gané, cobré, salario, pagos
- clients: Para gestionar clientes. Palabras clave: clientes, compradores, contactos
- projects: Para gestionar proyectos. Palabras clave: proyectos, trabajos, encargos
- contracts: Para subir y ver contratos. Palabras clave: contratos, acuerdos, documentos legales
- dashboard: Panel principal, resumen general. Palabras clave: inicio, panel, resumen, dashboard
- mileage: Registro de viajes y kilometraje. Palabras clave: kilometraje, viajes, millas, recorridos
- networth: Patrimonio neto, activos y pasivos. Palabras clave: patrimonio, activos, deudas, riqueza
- banking: Análisis bancario, importar estados. Palabras clave: banco, transacciones bancarias, estados de cuenta
- settings: Configuración de la app. Palabras clave: configuración, ajustes, preferencias
- capture: Captura rápida de recibos. Palabras clave: capturar, fotografiar, escanear recibo
- chaos: Centro de revisión de documentos pendientes. Palabras clave: revisar, pendientes, bandeja
- reconciliation: Reconciliación bancaria. Palabras clave: reconciliar, emparejar, conciliar
- mentorship: Educación financiera y mentoría. Palabras clave: aprender, educación, mentoría, libros
- taxes: Calendario fiscal e impuestos. Palabras clave: impuestos, fiscal, declaración, CRA, SII

PAÍSES SOPORTADOS:
🇨🇦 CANADÁ: CRA, T2125, RRSP, TFSA, GST/HST, ITC
🇨🇱 CHILE: SII, RUT, F22, F29, APV, Boletas

REGLAS DE FORMATO PARA RESPUESTAS DE TEXTO:
- NUNCA uses formato markdown como **negrita**, *cursiva*, o viñetas con guiones
- Escribe de forma conversacional y fluida
- Usa frases completas y conectores naturales
- NO saludes en cada mensaje, solo la primera vez de la sesión

REGLAS DE DECISIÓN:
1. Si el usuario claramente quiere NAVEGAR a algún lugar → responde con action "navigate"
2. Si el usuario pregunta por DATOS específicos (cuánto, cuántos, cuál es) → responde con action "query" incluyendo la respuesta calculada en "message"
3. Si el usuario tiene una DUDA o necesita EXPLICACIÓN → responde con texto conversacional normal (sin JSON)
4. Si no estás seguro si es navegación o pregunta → responde con texto y SUGIERE la acción

EJEMPLOS:
Usuario: "muéstrame mis gastos" → {"action":"navigate","target":"expenses","message":"Navegando a Gastos"}
Usuario: "cuánto gasté este mes" → {"action":"query","target":"expenses_month","message":"Este mes has gastado $1,234.56"}
Usuario: "qué es el T2125" → Respuesta de texto explicando qué es el T2125
Usuario: "quiero ver cuánto gané y después ir a mis clientes" → {"action":"navigate","target":"income","message":"Primero te muestro los ingresos. Después puedes decirme 'ir a clientes'"}
`;

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

    // Build context about user's situation with actual data
    let contextInfo = "";
    if (userContext) {
      const { 
        userName, 
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
CONTEXTO DEL USUARIO (usa estos datos para responder queries):
- Nombre: ${userName || 'Usuario'}
- Gastos este mes: $${totalExpenses?.toFixed(2) || '0.00'}
- Gastos este año: $${yearlyExpenses?.toFixed(2) || '0.00'}
- Ingresos este mes: $${totalIncome?.toFixed(2) || '0.00'}
- Ingresos este año: $${yearlyIncome?.toFixed(2) || '0.00'}
- Balance anual (ingresos - gastos): $${balance?.toFixed(2) || '0.00'}
- Recibos pendientes: ${pendingReceipts || 0}
- Clientes: ${clientCount || 0}
- Proyectos: ${projectCount || 0}
- Mayor gasto: ${biggestExpense ? `$${biggestExpense.amount} en ${biggestExpense.vendor || biggestExpense.description || 'sin descripción'}` : 'ninguno'}
- Categoría con más gastos: ${topCategory ? `${topCategory.category}: $${topCategory.amount}` : 'ninguna'}
- Total deducible: $${deductibleTotal?.toFixed(2) || '0.00'}
- Total facturable a clientes: $${billableTotal?.toFixed(2) || '0.00'}
- Idioma del usuario: ${language === 'es' ? 'Español' : 'English'}
`;
    }

    const systemPrompt = APP_KNOWLEDGE + contextInfo;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido, intenta de nuevo en un momento." }),
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
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al procesar la solicitud");
    }

    const data = await response.json();
    let assistantMessage = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu pregunta.";

    // Try to parse as action JSON
    let parsedAction = null;
    try {
      // Check if the response starts with { and ends with }
      const trimmed = assistantMessage.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        parsedAction = JSON.parse(trimmed);
        
        // Validate it has required action fields
        if (parsedAction.action && parsedAction.message) {
          // Enrich navigation actions with route info
          if (parsedAction.action === 'navigate' && parsedAction.target) {
            const routeInfo = AVAILABLE_ROUTES[parsedAction.target as keyof typeof AVAILABLE_ROUTES];
            if (routeInfo) {
              parsedAction.route = routeInfo.route;
              parsedAction.name = routeInfo.names[language as 'es' | 'en'] || routeInfo.names.es;
            }
          }
        } else {
          parsedAction = null;
        }
      }
    } catch {
      // Not JSON, treat as regular text response
      parsedAction = null;
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
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
