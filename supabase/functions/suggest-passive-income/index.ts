import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un experto en finanzas personales e ingresos pasivos, inspirado en los principios de Robert Kiyosaki (Padre Rico, Padre Pobre), Warren Buffett, y otros mentores financieros. 

Tu objetivo es sugerir IDEAS DE NEGOCIOS DE INGRESOS PASIVOS personalizadas basadas en:
- Pasiones del usuario
- Talentos y habilidades
- Intereses
- Capital disponible
- Tolerancia al riesgo
- Tiempo disponible

IMPORTANTE:
1. Sé específico y práctico
2. Incluye estimaciones realistas de inversión inicial y retorno potencial
3. Clasifica por nivel de dificultad y tiempo para generar ingresos
4. Incluye citas de mentores financieros relevantes
5. Responde SIEMPRE en español`;

    const userPrompt = `Basándote en este perfil financiero, sugiere 3-5 ideas de ingresos pasivos personalizadas:

PERFIL:
- Pasiones: ${profile.passions?.join(', ') || 'No especificado'}
- Talentos: ${profile.talents?.join(', ') || 'No especificado'}
- Intereses: ${profile.interests?.join(', ') || 'No especificado'}
- Capital disponible: $${profile.available_capital || 0}
- Capacidad de inversión mensual: $${profile.monthly_investment_capacity || 0}
- Tolerancia al riesgo: ${profile.risk_tolerance || 'moderada'}
- Tiempo disponible: ${profile.time_availability || 'tiempo parcial'}
- Tipo de ingreso preferido: ${profile.preferred_income_type || 'mixto'}
- Nivel de educación financiera: ${profile.financial_education_level || 'principiante'}

Para cada idea incluye:
1. Nombre de la estrategia
2. Descripción breve
3. Inversión inicial estimada
4. Tiempo para generar ingresos
5. Potencial de ingresos mensuales
6. Nivel de dificultad (1-5)
7. Riesgo (bajo/medio/alto)
8. Pasos para empezar
9. Una cita motivacional de un mentor financiero relevante`;

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
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_passive_income_ideas",
              description: "Return personalized passive income ideas based on user profile",
              parameters: {
                type: "object",
                properties: {
                  ideas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        initial_investment: { type: "string" },
                        time_to_income: { type: "string" },
                        monthly_potential: { type: "string" },
                        difficulty: { type: "number" },
                        risk: { type: "string", enum: ["bajo", "medio", "alto"] },
                        steps: { type: "array", items: { type: "string" } },
                        mentor_quote: { type: "string" },
                        mentor_name: { type: "string" }
                      },
                      required: ["name", "description", "initial_investment", "time_to_income", "monthly_potential", "difficulty", "risk", "steps", "mentor_quote", "mentor_name"]
                    }
                  },
                  general_advice: { type: "string" }
                },
                required: ["ideas", "general_advice"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_passive_income_ideas" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limit" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const suggestions = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(suggestions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No suggestions generated");
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
