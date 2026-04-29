const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { checkPlanAccess } = await import('../_shared/plan-guard.ts');
    const guard = await checkPlanAccess(req, 'autopilot');
    if (!guard.allowed) return guard.response;

    const { expenses, income, bills, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isEs = language === "es";

    const systemPrompt = isEs
      ? `Eres un asesor financiero IA experto. Analiza los datos financieros del usuario y genera exactamente 5 insights accionables. Cada insight debe ser específico a sus datos reales, NO genérico. Responde SOLO usando la herramienta proporcionada.`
      : `You are an expert AI financial advisor. Analyze the user's financial data and generate exactly 5 actionable insights. Each insight must be specific to their actual data, NOT generic. Respond ONLY using the provided tool.`;

    const userPrompt = isEs
      ? `Analiza estos datos financieros y genera 5 insights personalizados:

GASTOS RECIENTES (últimos 50):
${JSON.stringify(expenses?.slice(0, 30) || [])}

INGRESOS RECIENTES:
${JSON.stringify(income?.slice(0, 15) || [])}

PAGOS FIJOS ACTIVOS:
${JSON.stringify(bills || [])}

Genera insights de tipo: opportunity (ahorro), warning (riesgo), achievement (logro), tip (consejo). Prioriza los de alto impacto.`
      : `Analyze this financial data and generate 5 personalized insights:

RECENT EXPENSES (last 50):
${JSON.stringify(expenses?.slice(0, 30) || [])}

RECENT INCOME:
${JSON.stringify(income?.slice(0, 15) || [])}

ACTIVE RECURRING BILLS:
${JSON.stringify(bills || [])}

Generate insights of type: opportunity (savings), warning (risk), achievement (accomplishment), tip (advice). Prioritize high-impact ones.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_insights",
              description: "Return financial insights for the user",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["opportunity", "warning", "achievement", "tip"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        impact: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["type", "title", "description", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_insights" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let insights = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      insights = parsed.insights || [];
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("financial-autopilot error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
