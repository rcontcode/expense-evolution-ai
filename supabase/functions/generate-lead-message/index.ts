import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { lead, messageType, language } = await req.json();
    // messageType: 'whatsapp' | 'email' | 'offer'
    // language: 'es' | 'en'

    const isEs = language === "es";
    const firstName = lead.name?.split(" ")[0] || "there";

    let systemPrompt = "";
    let userPrompt = "";

    if (messageType === "whatsapp") {
      systemPrompt = isEs
        ? `Eres un experto en ventas consultivas para una app de finanzas personales llamada EvoFinz. Genera mensajes de WhatsApp cortos (máx 200 palabras), personalizados, empáticos y con un CTA claro. No uses jerga de ventas agresiva. Tono: amigable, profesional, con emojis moderados.`
        : `You're a consultative sales expert for a personal finance app called EvoFinz. Generate short WhatsApp messages (max 200 words), personalized, empathetic with a clear CTA. No aggressive sales jargon. Tone: friendly, professional, moderate emojis.`;

      userPrompt = isEs
        ? `Genera un mensaje de WhatsApp personalizado para este lead:
- Nombre: ${lead.name}
- País: ${lead.country}
- Score del quiz: ${lead.quiz_score}%
- Nivel: ${lead.quiz_level}
- Situación: ${lead.situation}
- Meta financiera: ${lead.goal}
- Obstáculo principal: ${lead.obstacle}
- Tiempo disponible: ${lead.time_spent || "no especificado"}
- Comentario personal: ${lead.comments || "ninguno"}
- Fuente: ${lead.source || "evofinz"}

El mensaje debe:
1. Saludar por nombre
2. Hacer referencia a su meta y obstáculo específico
3. Ofrecer una solución concreta relacionada con la app
4. Incluir un CTA suave (agendar llamada, ver recurso, etc.)`
        : `Generate a personalized WhatsApp message for this lead:
- Name: ${lead.name}
- Country: ${lead.country}
- Quiz score: ${lead.quiz_score}%
- Level: ${lead.quiz_level}
- Situation: ${lead.situation}
- Financial goal: ${lead.goal}
- Main obstacle: ${lead.obstacle}
- Available time: ${lead.time_spent || "not specified"}
- Personal comment: ${lead.comments || "none"}
- Source: ${lead.source || "evofinz"}

The message should:
1. Greet by name
2. Reference their specific goal and obstacle
3. Offer a concrete solution related to the app
4. Include a soft CTA (schedule call, view resource, etc.)`;
    } else if (messageType === "email") {
      systemPrompt = isEs
        ? `Eres un copywriter experto en email marketing para EvoFinz, una app de finanzas personales. Genera emails profesionales, persuasivos pero no agresivos. Incluye subject line y body. Formato: primero el subject entre [SUBJECT: ...], luego el body.`
        : `You're an expert email copywriter for EvoFinz, a personal finance app. Generate professional, persuasive but not aggressive emails. Include subject line and body. Format: subject first in [SUBJECT: ...], then body.`;

      userPrompt = isEs
        ? `Genera un email personalizado para:
- Nombre: ${lead.name}
- País: ${lead.country}  
- Score: ${lead.quiz_score}% (Nivel: ${lead.quiz_level})
- Meta: ${lead.goal}
- Obstáculo: ${lead.obstacle}
- Situación: ${lead.situation}
- Comentario: ${lead.comments || "ninguno"}
- Fuente: ${lead.source || "evofinz"}

Debe ser empático, ofrecer valor real y un CTA claro.`
        : `Generate a personalized email for:
- Name: ${lead.name}
- Country: ${lead.country}
- Score: ${lead.quiz_score}% (Level: ${lead.quiz_level})
- Goal: ${lead.goal}
- Obstacle: ${lead.obstacle}
- Situation: ${lead.situation}
- Comment: ${lead.comments || "none"}
- Source: ${lead.source || "evofinz"}

Should be empathetic, offer real value and a clear CTA.`;
    } else {
      // Offer generation
      systemPrompt = isEs
        ? `Eres un estratega de ventas para EvoFinz. Genera una oferta personalizada basada en el perfil del lead. La oferta debe incluir: (1) beneficio principal personalizado, (2) descuento o trial sugerido, (3) urgencia natural sin ser agresivo, (4) formato listo para enviar por WhatsApp o email. Máximo 150 palabras.`
        : `You're a sales strategist for EvoFinz. Generate a personalized offer based on the lead's profile. The offer should include: (1) personalized main benefit, (2) suggested discount or trial, (3) natural urgency without being aggressive, (4) ready-to-send format for WhatsApp or email. Max 150 words.`;

      userPrompt = isEs
        ? `Genera una oferta personalizada para:
- Nombre: ${lead.name}
- País: ${lead.country}
- Score: ${lead.quiz_score}% / Nivel: ${lead.quiz_level}
- Meta: ${lead.goal}
- Obstáculo: ${lead.obstacle}
- Situación: ${lead.situation}
- Prioridad del lead: ${lead.priority || "warm"}

Sugiere un descuento o beneficio apropiado basado en su perfil.`
        : `Generate a personalized offer for:
- Name: ${lead.name}
- Country: ${lead.country}
- Score: ${lead.quiz_score}% / Level: ${lead.quiz_level}
- Goal: ${lead.goal}
- Obstacle: ${lead.obstacle}
- Situation: ${lead.situation}
- Lead priority: ${lead.priority || "warm"}

Suggest an appropriate discount or benefit based on their profile.`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ success: true, message, messageType }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-lead-message error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
