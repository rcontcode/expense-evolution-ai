const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExternalLeadPayload {
  name: string;
  email: string;
  phone?: string;
  score?: number;
  level?: string;
  quiz_score?: number;
  quiz_level?: string;
  source?: string;
  timestamp?: string;
  // Direct fields (EvoFinz-native format)
  country?: string;
  situation?: string;
  goal?: string;
  obstacle?: string;
  time_spent?: string;
  comments?: string;
  failed_questions?: number[];
  // Fokuspark quiz answers
  quiz_answers?: Array<{ question: string; answer_value: number; answer_label: string }>;
  // Universmind returning lead fields
  returning_lead?: boolean;
  previous_sources?: string[];
  // Nested metadata (Universmind format)
  metadata?: {
    situacion?: string;
    objetivo?: string;
    obstaculo?: string;
    tiempo_disponible?: string;
    conocimiento_previo?: string;
    producto_recomendado?: string;
    precio_producto?: number;
    respuestas_best_practices?: Record<string, boolean>;
    guide?: string;
    [key: string]: unknown;
  };
  // Allow additional custom fields
  [key: string]: unknown;
}

function sanitize(s: string | undefined | null): string {
  return s ? s.replace(/<[^>]*>/g, "").trim() : "";
}

/**
 * Extract a field by checking multiple possible locations/aliases.
 * Priority: direct field → metadata field → fallback
 */
function extractField(payload: ExternalLeadPayload, directKey: string, metadataKeys: string[]): string {
  // 1. Check direct top-level field
  const directVal = (payload as Record<string, unknown>)[directKey];
  if (directVal && typeof directVal === "string" && directVal.trim()) {
    return sanitize(directVal);
  }

  // 2. Check metadata aliases
  if (payload.metadata) {
    for (const key of metadataKeys) {
      const val = (payload.metadata as Record<string, unknown>)[key];
      if (val && typeof val === "string" && val.trim()) {
        return sanitize(val);
      }
    }
  }

  return "";
}

function calculatePriority(lead: {
  score: number;
  comments: string;
  level: string;
  obstacle: string;
  goal: string;
  situation: string;
  phone: string | null;
  time_spent: string;
  failed_questions: number[];
  conocimiento_previo?: string;
  precio_producto?: number;
  returning_lead?: boolean;
  previous_sources?: string[];
}): { leadScore: number; priority: string } {
  let score = 0;

  // Quiz score bajo = más necesidad (max +30)
  if (lead.score <= 25) score += 30;
  else if (lead.score <= 40) score += 25;
  else if (lead.score <= 50) score += 20;
  else if (lead.score <= 60) score += 10;

  // Comentario = interés alto (max +30)
  if (lead.comments && lead.comments.trim().length > 0) {
    score += 25;
    if (lead.comments.length > 50) score += 5;
  }

  // Nivel principiante = urgencia (max +15)
  const level = lead.level?.toLowerCase();
  if (level === "principiante" || level === "novato") score += 15;
  else if (level === "emergente" || level === "aprendiz") score += 10;
  else if (level === "evolucionando" || level === "intermedio" || level === "enfocado") score += 5;

  // Obstáculos críticos (max +10)
  const criticalObstacles = ["no sé por dónde empezar", "gastos descontrolados", "falta de conocimiento", "deudas abrumadoras", "falta de tiempo", "falta de información", "me distraigo", "procrastino"];
  if (lead.obstacle && criticalObstacles.some(obs => lead.obstacle.toLowerCase().includes(obs.toLowerCase()))) {
    score += 10;
  }

  // Metas ambiciosas (max +10)
  const ambitiousGoals = ["jubilación anticipada", "fire", "crecer patrimonio", "independencia financiera", "libertad financiera", "estimular desarrollo", "colección completa"];
  if (lead.goal && ambitiousGoals.some(g => lead.goal.toLowerCase().includes(g.toLowerCase()))) {
    score += 10;
  }

  // Situación especial (max +5)
  const businessSituations = ["dueño de negocio", "empresario", "emprendedor"];
  if (lead.situation && businessSituations.some(sit => lead.situation.toLowerCase().includes(sit.toLowerCase()))) {
    score += 5;
  }

  // Tiene teléfono (max +5)
  if (lead.phone && lead.phone.trim().length > 0) {
    score += 5;
  }

  // Tiempo invertido alto (max +5)
  const highEngagement = ["1 - 3 horas", "más de 3 horas", "1-3 horas", "más de 1 hora"];
  if (lead.time_spent && highEngagement.some(t => lead.time_spent.toLowerCase().includes(t.toLowerCase()))) {
    score += 5;
  }

  // Muchas preguntas fallidas (max +5)
  if (lead.failed_questions && lead.failed_questions.length >= 5) {
    score += 5;
  }

  // Conocimiento previo bajo = más necesidad (max +10)
  const conocimiento = lead.conocimiento_previo?.toLowerCase();
  if (conocimiento && (conocimiento.includes("no tengo") || conocimiento.includes("principiante") || conocimiento.includes("poco"))) {
    score += 10;
  }

  // Producto recomendado de alto valor (max +5)
  if (lead.precio_producto && lead.precio_producto >= 100) {
    score += 5;
  }

  // Returning lead = multiple touchpoints = high interest (max +20)
  if (lead.returning_lead) {
    score += 20;
    // Extra bonus for multiple previous sources
    if (lead.previous_sources && lead.previous_sources.length > 1) {
      score += 5;
    }
  }

  const capped = Math.min(100, score);
  let priority: string;
  if (capped >= 80) priority = "hot";
  else if (capped >= 50) priority = "warm";
  else if (capped >= 25) priority = "cool";
  else priority = "cold";

  return { leadScore: capped, priority };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: ExternalLeadPayload = await req.json();

    // 🔍 Log raw payload for diagnostics
    console.log(`[WEBHOOK-LEADS] RAW payload from ${payload.source || "unknown"}:`, JSON.stringify(payload).substring(0, 2000));

    // Validate required fields
    if (!payload.name || !payload.email) {
      return new Response(
        JSON.stringify({ error: "Fields 'name' and 'email' are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(payload.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.name.length > 255 || payload.email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Name or email too long (max 255)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract fields from direct OR metadata (with alias mapping per app)
    const cleanName = sanitize(payload.name);
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanPhone = payload.phone?.trim() || null;
    const quizScore = typeof payload.score === "number" ? payload.score
      : typeof payload.quiz_score === "number" ? payload.quiz_score
      : 0;
    const quizLevel = sanitize(payload.level) || sanitize(payload.quiz_level) || "unknown";
    const source = sanitize(payload.source) || "external-webhook";

    // Smart field extraction: direct fields → metadata aliases → empty
    const country = extractField(payload, "country", ["pais", "country"]);
    const situation = extractField(payload, "situation", ["situacion", "situación"]);
    const goal = extractField(payload, "goal", ["objetivo", "goal", "meta"]);
    const obstacle = extractField(payload, "obstacle", ["obstaculo", "obstáculo", "obstacle"]);
    const timeSpent = extractField(payload, "time_spent", ["tiempo_disponible", "time_spent", "tiempo"]);
    const comments = extractField(payload, "comments", ["comments", "comentarios", "comentario"]);

    // Failed questions: direct or from metadata best practices
    let failedQuestions: number[] = [];
    if (Array.isArray(payload.failed_questions)) {
      failedQuestions = payload.failed_questions;
    } else if (payload.metadata?.respuestas_best_practices) {
      // Convert boolean map to failed indices (false = failed)
      const practices = payload.metadata.respuestas_best_practices;
      failedQuestions = Object.entries(practices)
        .map(([_, val], idx) => (!val ? idx + 1 : -1))
        .filter(idx => idx > 0);
    }

    // Build enriched metadata to store extra app-specific fields
    const extraMetadata: Record<string, unknown> = {};
    if (payload.metadata?.producto_recomendado) extraMetadata.producto_recomendado = payload.metadata.producto_recomendado;
    if (payload.metadata?.precio_producto) extraMetadata.precio_producto = payload.metadata.precio_producto;
    if (payload.metadata?.conocimiento_previo) extraMetadata.conocimiento_previo = payload.metadata.conocimiento_previo;
    if (payload.metadata?.guide) extraMetadata.guide = payload.metadata.guide;
    if (payload.metadata?.respuestas_best_practices) extraMetadata.respuestas_detail = payload.metadata.respuestas_best_practices;
    // Fokuspark quiz_answers — store directly in metadata
    if (Array.isArray(payload.quiz_answers) && payload.quiz_answers.length > 0) {
      extraMetadata.quiz_answers = payload.quiz_answers;
    }
    // Universmind returning lead data
    if (payload.returning_lead) {
      extraMetadata.returning_lead = true;
    }
    if (Array.isArray(payload.previous_sources) && payload.previous_sources.length > 0) {
      extraMetadata.previous_sources = payload.previous_sources;
    }

    // Calculate lead priority with ALL available data
    const { leadScore, priority } = calculatePriority({
      score: quizScore,
      comments,
      level: quizLevel,
      obstacle,
      goal,
      situation,
      phone: cleanPhone,
      time_spent: timeSpent,
      failed_questions: failedQuestions,
      conocimiento_previo: payload.metadata?.conocimiento_previo as string | undefined,
      precio_producto: payload.metadata?.precio_producto as number | undefined,
      returning_lead: payload.returning_lead,
      previous_sources: payload.previous_sources,
    });

    console.log(`[WEBHOOK-LEADS] ${cleanEmail} | source: ${source} | quiz: ${quizScore} | fields: country=${!!country}, situation=${!!situation}, goal=${!!goal}, obstacle=${!!obstacle}, comments=${!!comments} | leadScore: ${leadScore}, priority: ${priority}`);

    // Save to quiz_leads
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Comments stays clean — only user-written text
    const cleanComments = comments || null;

    // Dedup: find existing leads with same email for cross-referencing
    const { data: existingLeads } = await supabase
      .from("quiz_leads")
      .select("id, source")
      .eq("email", cleanEmail)
      .limit(10);

    if (existingLeads && existingLeads.length > 0) {
      extraMetadata.related_lead_ids = existingLeads.map((l: { id: string }) => l.id);
      extraMetadata.related_sources = existingLeads.map((l: { source: string }) => l.source);
      console.log(`[WEBHOOK-LEADS] Dedup: ${cleanEmail} has ${existingLeads.length} existing lead(s)`);
    }

    // Store full metadata object in JSONB column
    const metadataToStore = Object.keys(extraMetadata).length > 0 ? extraMetadata : {};

    const { data: savedLead, error: dbError } = await supabase
      .from("quiz_leads")
      .insert({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        country,
        situation,
        goal,
        obstacle,
        time_spent: timeSpent,
        quiz_score: quizScore,
        quiz_level: quizLevel,
        failed_questions: failedQuestions,
        comments: cleanComments,
        lead_score: leadScore,
        priority,
        source,
        metadata: metadataToStore,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[WEBHOOK-LEADS] DB error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save lead", details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to GHL if configured
    const ghlWebhookUrl = Deno.env.get("GHL_WEBHOOK_URL");
    if (ghlWebhookUrl) {
      try {
        const ghlPayload = {
          first_name: cleanName.split(" ")[0],
          last_name: cleanName.split(" ").slice(1).join(" ") || "",
          email: cleanEmail,
          phone: cleanPhone || "",
          source,
          country,
          situation,
          goal,
          obstacle,
          quiz_score: quizScore,
          quiz_level: quizLevel,
          lead_score: leadScore,
          lead_priority: priority,
          lead_id: savedLead.id,
          comments: comments || "",
          returning_lead: !!payload.returning_lead,
          previous_sources: payload.previous_sources || [],
        };
        const ghlRes = await fetch(ghlWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ghlPayload),
        });
        console.log(`[WEBHOOK-LEADS] GHL forward: ${ghlRes.ok ? "OK" : "FAILED"}`);
        if (!ghlRes.ok) await ghlRes.text();
      } catch (e) {
        console.error("[WEBHOOK-LEADS] GHL error:", e);
      }
    }

    // Trigger automation rules asynchronously
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      fetch(`${supabaseUrl}/functions/v1/run-automations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: { ...savedLead, priority } }),
      }).catch(e => console.error('[WEBHOOK-LEADS] Automation trigger error:', e));
    } catch (e) {
      console.error('[WEBHOOK-LEADS] Automation trigger error:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: savedLead.id,
        lead_score: leadScore,
        priority,
        fields_received: {
          country: !!country,
          situation: !!situation,
          goal: !!goal,
          obstacle: !!obstacle,
          comments: !!comments,
          failed_questions: failedQuestions.length,
          extra_metadata: Object.keys(extraMetadata).length,
        },
        message: "Lead received successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WEBHOOK-LEADS] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
