const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExternalLeadPayload {
  name: string;
  email: string;
  phone?: string;
  score?: number;
  level?: string;
  source?: string;
  timestamp?: string;
  // Allow additional custom fields
  [key: string]: unknown;
}

function calculatePriority(score: number | undefined): { leadScore: number; priority: string } {
  if (!score || score <= 0) return { leadScore: 15, priority: "cold" };

  // Map external score (0-100) to internal lead scoring
  let leadScore = 0;

  if (score <= 25) leadScore += 30;
  else if (score <= 40) leadScore += 25;
  else if (score <= 50) leadScore += 20;
  else if (score <= 60) leadScore += 10;

  // Bonus for having a score at all
  leadScore += 10;

  const capped = Math.min(100, leadScore);
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

    // Sanitize
    const sanitize = (s: string | undefined): string =>
      s ? s.replace(/<[^>]*>/g, "").trim() : "";

    const cleanName = sanitize(payload.name);
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanPhone = payload.phone?.trim() || null;
    const quizScore = typeof payload.score === "number" ? payload.score : 0;
    const quizLevel = sanitize(payload.level) || "unknown";
    const source = sanitize(payload.source) || "external-webhook";

    // Calculate lead priority
    const { leadScore, priority } = calculatePriority(quizScore);

    console.log(`[WEBHOOK-LEADS] ${cleanEmail} | source: ${source} | score: ${quizScore} -> leadScore: ${leadScore}, priority: ${priority}`);

    // Save to quiz_leads
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: savedLead, error: dbError } = await supabase
      .from("quiz_leads")
      .insert({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        country: "",
        situation: "",
        goal: "",
        obstacle: "",
        time_spent: "",
        quiz_score: quizScore,
        quiz_level: quizLevel,
        failed_questions: [],
        comments: null,
        lead_score: leadScore,
        priority,
        source,
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
          quiz_score: quizScore,
          quiz_level: quizLevel,
          lead_score: leadScore,
          lead_priority: priority,
          lead_id: savedLead.id,
        };
        const ghlRes = await fetch(ghlWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ghlPayload),
        });
        console.log(`[WEBHOOK-LEADS] GHL forward: ${ghlRes.ok ? "OK" : "FAILED"}`);
      } catch (e) {
        console.error("[WEBHOOK-LEADS] GHL error:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: savedLead.id,
        lead_score: leadScore,
        priority,
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
