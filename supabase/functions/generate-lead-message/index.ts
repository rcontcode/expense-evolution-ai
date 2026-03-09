const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { lead, messageType, language, targetApp, templateType } = await req.json();
    // messageType: 'whatsapp' | 'email' | 'offer'
    // language: 'es' | 'en'
    // targetApp: 'evofinz' | 'fokuspark' | 'bundle' (optional)
    // templateType: 'first_contact' | 'follow_up' | 'reactivation' | 'invitation' | 'offer' (optional)

    const isEs = language === "es";
    const appName = targetApp === "fokuspark" ? "FokusPark" : targetApp === "bundle" ? "EvoFinz + FokusPark" : "EvoFinz";
    const appDescription = targetApp === "fokuspark"
      ? (isEs ? "una app de productividad y bienestar financiero con focus timers, journaling y hábitos" : "a productivity & financial wellness app with focus timers, journaling and habits")
      : targetApp === "bundle"
        ? (isEs ? "el ecosistema completo de finanzas + productividad (EvoFinz + FokusPark)" : "the complete finance + productivity ecosystem (EvoFinz + FokusPark)")
        : (isEs ? "una app de finanzas personales con IA, tracking de gastos y contratos" : "a personal finance app with AI, expense tracking and contracts");

    // Template context
    const tType = templateType || "first_contact";
    const templateContext = {
      first_contact: isEs
        ? "Este es el PRIMER contacto con el lead. Debe ser cálido, no invasivo, y generar curiosidad."
        : "This is the FIRST contact with the lead. It should be warm, non-invasive, and generate curiosity.",
      follow_up: isEs
        ? "Este es un FOLLOW-UP. El lead ya fue contactado antes. Sé más directo, recuerda el contacto anterior, y ofrece valor adicional."
        : "This is a FOLLOW-UP. The lead was already contacted. Be more direct, reference previous contact, and offer additional value.",
      reactivation: isEs
        ? "Este es un intento de REACTIVACIÓN. El lead lleva tiempo sin responder. Usa urgencia suave, nueva oferta o ángulo diferente."
        : "This is a REACTIVATION attempt. The lead hasn't responded in a while. Use soft urgency, new offer or different angle.",
      invitation: isEs
        ? `Este mensaje es una INVITACIÓN a probar ${appName}. El lead puede venir de otra app del ecosistema. Presenta ${appName} como complemento perfecto.`
        : `This message is an INVITATION to try ${appName}. The lead may come from another app in the ecosystem. Present ${appName} as the perfect complement.`,
      offer: isEs
        ? "Genera una OFERTA ESPECIAL personalizada con descuento, trial o beneficio exclusivo según el perfil del lead."
        : "Generate a personalized SPECIAL OFFER with discount, trial or exclusive benefit based on the lead's profile.",
    }[tType] || "";

    const leadContext = isEs
      ? `Lead:
- Nombre: ${lead.name}
- País: ${lead.country}
- Score quiz: ${lead.quiz_score}% (Nivel: ${lead.quiz_level})
- Situación: ${lead.situation}
- Meta financiera: ${lead.goal}
- Obstáculo: ${lead.obstacle}
- Tiempo disponible: ${lead.time_spent || "no especificado"}
- Comentario personal: ${lead.comments || "ninguno"}
- Fuente original: ${lead.source || "evofinz"}
- Prioridad: ${lead.priority || "warm"}`
      : `Lead:
- Name: ${lead.name}
- Country: ${lead.country}
- Quiz score: ${lead.quiz_score}% (Level: ${lead.quiz_level})
- Situation: ${lead.situation}
- Financial goal: ${lead.goal}
- Obstacle: ${lead.obstacle}
- Available time: ${lead.time_spent || "not specified"}
- Personal comment: ${lead.comments || "none"}
- Original source: ${lead.source || "evofinz"}
- Priority: ${lead.priority || "warm"}`;

    let systemPrompt = "";
    let userPrompt = "";

    if (messageType === "whatsapp") {
      systemPrompt = isEs
        ? `Eres un experto en ventas consultivas para ${appName} (${appDescription}). Genera mensajes de WhatsApp cortos (máx 200 palabras), personalizados, empáticos y con un CTA claro. No uses jerga agresiva. Tono: amigable, profesional, con emojis moderados. ${templateContext}`
        : `You're a consultative sales expert for ${appName} (${appDescription}). Generate short WhatsApp messages (max 200 words), personalized, empathetic with a clear CTA. No aggressive jargon. Tone: friendly, professional, moderate emojis. ${templateContext}`;

      userPrompt = isEs
        ? `Genera un mensaje de WhatsApp personalizado.

${leadContext}

App destino: ${appName}
Tipo: ${tType}

El mensaje debe:
1. Saludar por nombre
2. Hacer referencia a su meta y obstáculo específico
3. Presentar ${appName} como solución natural
4. Incluir un CTA suave (agendar llamada, ver demo, probar gratis, etc.)
5. Adaptar el tono según la prioridad del lead`
        : `Generate a personalized WhatsApp message.

${leadContext}

Target app: ${appName}
Type: ${tType}

The message should:
1. Greet by name
2. Reference their specific goal and obstacle
3. Present ${appName} as a natural solution
4. Include a soft CTA (schedule call, view demo, free trial, etc.)
5. Adapt tone based on lead priority`;

    } else if (messageType === "email") {
      systemPrompt = isEs
        ? `Eres un copywriter experto en email marketing para ${appName} (${appDescription}). Genera emails profesionales, persuasivos pero no agresivos. Formato: primero el subject entre [SUBJECT: ...], luego el body. ${templateContext}`
        : `You're an expert email copywriter for ${appName} (${appDescription}). Generate professional, persuasive but not aggressive emails. Format: subject first in [SUBJECT: ...], then body. ${templateContext}`;

      userPrompt = isEs
        ? `Genera un email personalizado.

${leadContext}

App destino: ${appName}
Tipo: ${tType}

Debe ser empático, ofrecer valor real, presentar ${appName} como solución y un CTA claro.`
        : `Generate a personalized email.

${leadContext}

Target app: ${appName}
Type: ${tType}

Should be empathetic, offer real value, present ${appName} as a solution and a clear CTA.`;

    } else {
      // Offer
      systemPrompt = isEs
        ? `Eres un estratega de ventas para ${appName}. Genera una oferta personalizada que incluya: (1) beneficio principal, (2) descuento o trial, (3) urgencia natural, (4) formato listo para WhatsApp o email. Máx 150 palabras. ${templateContext}`
        : `You're a sales strategist for ${appName}. Generate a personalized offer: (1) main benefit, (2) discount or trial, (3) natural urgency, (4) ready-to-send format. Max 150 words. ${templateContext}`;

      userPrompt = isEs
        ? `Genera una oferta personalizada.

${leadContext}

App destino: ${appName}
Tipo: ${tType}

Sugiere un descuento o beneficio apropiado para ${appName} basado en su perfil.`
        : `Generate a personalized offer.

${leadContext}

Target app: ${appName}
Type: ${tType}

Suggest an appropriate discount or benefit for ${appName} based on their profile.`;
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
          model: "google/gemini-3-flash-preview",
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
      JSON.stringify({ success: true, message, messageType, targetApp: targetApp || "evofinz", templateType: tType }),
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
