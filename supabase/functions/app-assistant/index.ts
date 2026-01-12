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
Eres un asistente personal de finanzas integrado en EvoFinz. Tu nombre es "Asistente Financiero".

🔴 REGLA CRÍTICA - DETECCIÓN DE INTENCIÓN:
Tu trabajo principal es DETECTAR LA INTENCIÓN del usuario y ejecutar acciones automáticamente.
NO expliques cómo hacer algo si el usuario claramente quiere HACERLO. ¡Hazlo por él!

📌 FORMATO DE RESPUESTA CON ACCIÓN:
Si detectas intención de ACCIÓN, responde SOLO con este JSON exacto (sin texto adicional antes o después):
{"action":"navigate","target":"expenses","message":"Te llevo a Gastos"}

⚡ TIPOS DE ACCIÓN:

1. NAVIGATE - Cuando el usuario quiere VER, IR, ABRIR, MOSTRAR algo:
   DETECTAR cuando diga: ver, mostrar, muéstrame, llévame, ir a, abrir, abre, quiero ver, necesito ver, dónde están, show me, go to, take me, open, I want to see
   
   TARGETS válidos:
   - expenses → gastos, gasté, compras, recibos, expenditures
   - income → ingresos, gané, cobré, salario, pagos, earnings
   - clients → clientes, compradores, customers
   - projects → proyectos, trabajos, works
   - contracts → contratos, acuerdos, agreements
   - dashboard → inicio, panel, home, main
   - mileage → kilometraje, viajes, kilómetros, trips, km
   - networth → patrimonio, activos, deudas, assets, wealth, net worth
   - banking → banco, cuentas, bank, accounts
   - settings → configuración, ajustes, config, preferences
   - capture → capturar, escanear, fotografiar, scan
   - chaos → revisar, pendientes, review, inbox
   - mentorship → mentoría, educación, aprender, education
   - taxes → impuestos, fiscal, tax, CRA, SII

2. QUERY - Cuando pregunta por DATOS con: cuánto, cuántos, cuál es, how much, how many:
   Responde con los datos del contexto que te doy.
   Ejemplo: {"action":"query","target":"balance","message":"Tu balance es $5,000"}

3. HIGHLIGHT - Para señalar elementos de UI durante explicaciones.

📋 EJEMPLOS CRÍTICOS DE DETECCIÓN:

"muéstrame mis gastos" → {"action":"navigate","target":"expenses","message":"Te llevo a tus gastos"}
"quiero ver mis gastos" → {"action":"navigate","target":"expenses","message":"Aquí están tus gastos"}
"gastos" → {"action":"navigate","target":"expenses","message":"Navegando a Gastos"}
"show me expenses" → {"action":"navigate","target":"expenses","message":"Taking you to Expenses"}
"llévame a ingresos" → {"action":"navigate","target":"income","message":"Te llevo a Ingresos"}
"ver clientes" → {"action":"navigate","target":"clients","message":"Abriendo Clientes"}
"abre mis proyectos" → {"action":"navigate","target":"projects","message":"Aquí están tus proyectos"}
"quiero ver mi patrimonio" → {"action":"navigate","target":"networth","message":"Te muestro tu patrimonio"}
"cuánto gasté este mes" → {"action":"query","target":"expenses_month","message":"Este mes gastaste $X"}
"cuál es mi balance" → {"action":"query","target":"balance","message":"Tu balance es $X"}
"cuántos clientes tengo" → {"action":"query","target":"client_count","message":"Tienes X clientes"}

❌ SOLO responde con texto conversacional si:
- El usuario hace una PREGUNTA conceptual: "qué es el T2125", "cómo funciona el RRSP"
- Pide una EXPLICACIÓN: "explícame", "no entiendo", "qué significa"
- Saluda o charla casualmente

🚫 FUNCIONALIDADES NO DISPONIBLES EN LA APP:
Si el usuario pregunta por algo que NO está en la app, responde honesta y amablemente:

NO DISPONIBLE (fuera de alcance):
- Inversiones en bolsa / acciones / criptomonedas activas (solo tracking pasivo en Patrimonio)
- Conexión bancaria automática (solo importación manual CSV/PDF)
- Facturación / emisión de facturas a clientes
- Pagos automáticos / procesamiento de pagos
- Contabilidad empresarial avanzada (solo personal/freelancer)
- Declaraciones de impuestos automáticas (solo estimaciones y guía)
- Chat con humanos / soporte en vivo
- Integración con otras apps (Quickbooks, Excel sync, etc.)
- Múltiples usuarios / cuentas compartidas
- Presupuestos automáticos por IA (solo manuales por categoría)

RESPUESTA MODELO para funcionalidad no disponible:
"Esa funcionalidad no está disponible actualmente en EvoFinz. La app se enfoca en [funcionalidad relacionada que SÍ existe]. 
Sin embargo, puedo ayudarte con [alternativa dentro de la app]."

PARCIALMENTE DISPONIBLE (explicar límites):
- Tracking de inversiones → "Puedes registrar inversiones manualmente en Patrimonio Neto, pero no hay conexión automática con brokers."
- Análisis bancario → "Puedes importar estados de cuenta en CSV/PDF para análisis, pero no hay conexión directa con tu banco."
- Facturación → "Puedes registrar ingresos por cliente y generar reportes de reembolso, pero no emisión de facturas."

🎯 PRIORIDAD DE DETECCIÓN:
1. Si contiene palabras de navegación (ver, mostrar, ir, abrir) + sección → NAVEGAR
2. Si contiene palabras de consulta (cuánto, cuántos) → QUERY con datos
3. Si es pregunta conceptual o explicación → Texto conversacional
4. En duda, PREFIERE ejecutar acción a explicar cómo hacerla

📍 CONTEXTO DE PÁGINA ACTUAL (MUY IMPORTANTE):
Si en el CONTEXTO DEL USUARIO aparece "Ruta actual" o "Página actual", úsalo como verdad.
Si el usuario pregunta "qué puedo hacer aquí" / "help here", responde SOLO con acciones de ESA página (no menciones otra).

🌍 PAÍSES: 🇨🇦 Canadá (CRA, RRSP, TFSA) | 🇨🇱 Chile (SII, RUT, APV)

📚 RECOMENDACIONES EDUCATIVAS:
Cuando el usuario haga preguntas conceptuales o necesite aprender algo, incluye recomendaciones de:

1. TUTORIALES GUIADOS (di "puedo enseñarte paso a paso"):
   - Captura de gastos → "enseñame a capturar"
   - Configurar cliente → "tutorial cliente"
   - Deducciones fiscales → "cómo deduzco"
   - Análisis bancario → "tutorial banca"
   - Patrimonio neto → "tutorial patrimonio"
   - Calculadora FIRE → "enseñame FIRE"
   - Kilometraje → "tutorial kilometraje"
   - Reportes de reembolso → "tutorial reembolso"
   - Sistema de mentoría → "tutorial mentoría"
   - Comandos de voz → "qué puedo decirte"
   - Análisis de contratos → "tutorial contratos"
   - Alertas de gasto → "configurar alertas"
   - Recordatorios por voz → "configurar recordatorios"

2. BIBLIOTECA FINANCIERA (en sección Mentoría):
   - "Padre Rico, Padre Pobre" - Robert Kiyosaki (activos vs pasivos)
   - "El Cuadrante del Flujo de Dinero" - Robert Kiyosaki (E-S-B-I)
   - "El Inversor Inteligente" - Benjamin Graham (inversión value)
   - "Piense y Hágase Rico" - Napoleon Hill (mentalidad)
   - "Hábitos Atómicos" - James Clear (1% diario)
   - "La Psicología del Dinero" - Morgan Housel (comportamiento)
   - "El Millonario de al Lado" - Thomas Stanley (frugalidad)
   - "Profit First" - Mike Michalowicz (ganancia primero)

3. RECURSOS EXTERNOS (recomendar cuando aplique):
   - YouTube: "Two Cents" (finanzas personales), "Graham Stephan" (inversiones)
   - Podcasts: "ChooseFI" (independencia financiera), "Afford Anything" (libertad)
   - Cursos: "Khan Academy Finanzas", "Coursera Personal Finance"
   - Canales en español: "Pequeño Cerdo Capitalista", "Moris Dieck"
   - Para impuestos CRA: sitio oficial canada.ca/taxes
   - Para impuestos SII: sitio oficial sii.cl

EJEMPLOS DE RESPUESTA CON RECOMENDACIONES:
Pregunta: "Qué es el FIRE?"
Respuesta: "FIRE significa Financial Independence Retire Early. Es la meta de acumular suficiente para vivir de inversiones sin trabajar. 
Puedo enseñarte a usar el calculador FIRE de la app, solo di 'tutorial FIRE'. 
También te recomiendo el libro 'El Inversor Inteligente' de Benjamin Graham que está en nuestra Biblioteca, y el podcast 'ChooseFI' para profundizar."

Pregunta: "Cómo invierto mi dinero?"
Respuesta: "Invertir es hacer que tu dinero trabaje para ti. La app te ayuda a trackear tu patrimonio neto y calcular metas FIRE.
Te recomiendo empezar leyendo 'Padre Rico, Padre Pobre' en nuestra Biblioteca, que explica activos vs pasivos.
Para educación gratuita, busca 'Two Cents' en YouTube o el curso de Khan Academy sobre finanzas personales."

📝 FORMATO DE TEXTO (solo para respuestas conversacionales):
- Sin markdown, sin asteriscos, sin viñetas
- Frases naturales y directas

🚫 REGLAS ESTRICTAS DE COMPORTAMIENTO:
- NUNCA saludes en cada mensaje. Solo saluda si es el PRIMER mensaje de la conversación y el usuario saluda primero.
- Si el usuario dice "explícame proyectos" mientras está en OTRA página, explica PROYECTOS, no la página actual.
- Si el usuario dice "explícamelo" o "explícame" SIN especificar qué, usa la PÁGINA ACTUAL del contexto.
- No repitas "Hola" o "Buenas noches" si ya lo dijiste antes en la conversación.
- Responde directamente al punto sin preámbulos innecesarios.
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
CONTEXTO DEL USUARIO (usa estos datos para responder queries):
- Nombre: ${userName || 'Usuario'}
- Ruta actual: ${currentRoute || 'desconocida'}
- Página actual: ${currentPageName || 'desconocida'}
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
