import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuizLeadPayload {
  name: string;
  email: string;
  phone?: string;
  country: string;
  situation: string;
  goal: string;
  obstacle: string;
  time_spent: string;
  quiz_score: number;
  quiz_level: string;
  failed_questions: number[];
  comments?: string;
}

// Lead Scoring Functions
function calculateLeadScore(payload: QuizLeadPayload): number {
  let score = 0;

  // Quiz score bajo = más necesidad de ayuda (max +30)
  if (payload.quiz_score <= 25) score += 30;
  else if (payload.quiz_score <= 40) score += 25;
  else if (payload.quiz_score <= 50) score += 20;
  else if (payload.quiz_score <= 60) score += 10;

  // Comentario personal = interés alto (max +30)
  if (payload.comments && payload.comments.trim().length > 0) {
    score += 25;
    if (payload.comments.length > 50) score += 5;
  }

  // Nivel principiante = urgencia (max +15)
  const level = payload.quiz_level?.toLowerCase();
  if (level === 'principiante') score += 15;
  else if (level === 'emergente') score += 10;
  else if (level === 'evolucionando') score += 5;

  // Obstáculos críticos (max +10)
  const criticalObstacles = ['no sé por dónde empezar', 'gastos descontrolados', 
                             'falta de conocimiento', 'deudas abrumadoras'];
  if (payload.obstacle && criticalObstacles.some(obs => 
    payload.obstacle.toLowerCase().includes(obs.toLowerCase())
  )) {
    score += 10;
  }

  // Metas ambiciosas (max +10)
  const ambitiousGoals = ['jubilación anticipada', 'fire', 'crecer patrimonio', 
                          'independencia financiera', 'libertad financiera'];
  if (payload.goal && ambitiousGoals.some(goal => 
    payload.goal.toLowerCase().includes(goal.toLowerCase())
  )) {
    score += 10;
  }

  // Dueño de negocio (max +5)
  const businessSituations = ['dueño de negocio', 'empresario', 'emprendedor'];
  if (payload.situation && businessSituations.some(sit => 
    payload.situation.toLowerCase().includes(sit.toLowerCase())
  )) {
    score += 5;
  }

  // Tiene teléfono (max +5)
  if (payload.phone && payload.phone.trim().length > 0) {
    score += 5;
  }

  // Tiempo invertido alto (max +5)
  const highEngagement = ['1 - 3 horas', 'más de 3 horas', '1-3 horas'];
  if (payload.time_spent && highEngagement.some(time => 
    payload.time_spent.toLowerCase().includes(time.toLowerCase())
  )) {
    score += 5;
  }

  // Muchas preguntas fallidas (max +5)
  if (payload.failed_questions && payload.failed_questions.length >= 5) {
    score += 5;
  }

  return Math.min(100, score);
}

function getLeadPriority(score: number): string {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 25) return 'cool';
  return 'cold';
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'hot': return 'PRIORIDAD';
    case 'warm': return 'INTERESADO';
    case 'cool': return 'POTENCIAL';
    default: return 'NUEVO';
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: QuizLeadPayload = await req.json();

    // Validate required fields
    if (!payload.name || !payload.email) {
      return new Response(
        JSON.stringify({ error: "Name and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate lead score and priority
    const leadScore = calculateLeadScore(payload);
    const leadPriority = getLeadPriority(leadScore);

    console.log(`Lead scoring: ${payload.email} -> Score: ${leadScore}, Priority: ${leadPriority}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save to quiz_leads table with scoring
    const { data: savedLead, error: dbError } = await supabase
      .from("quiz_leads")
      .insert({
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        country: payload.country,
        situation: payload.situation,
        goal: payload.goal,
        obstacle: payload.obstacle,
        time_spent: payload.time_spent,
        quiz_score: payload.quiz_score,
        quiz_level: payload.quiz_level,
        failed_questions: payload.failed_questions,
        comments: payload.comments || null,
        lead_score: leadScore,
        priority: leadPriority,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save lead", details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lead saved to database:", savedLead.id, "Score:", leadScore, "Priority:", leadPriority);

    // Send to GHL webhook if configured
    const ghlWebhookUrl = Deno.env.get("GHL_WEBHOOK_URL");
    
    if (ghlWebhookUrl) {
      try {
        const ghlPayload = {
          // Standard GHL fields
          first_name: payload.name.split(" ")[0],
          last_name: payload.name.split(" ").slice(1).join(" ") || "",
          email: payload.email,
          phone: payload.phone || "",
          // Custom fields for GHL
          country: payload.country,
          situation: payload.situation,
          goal: payload.goal,
          obstacle: payload.obstacle,
          time_spent: payload.time_spent,
          quiz_score: payload.quiz_score,
          quiz_level: payload.quiz_level,
          failed_questions: payload.failed_questions.join(","),
          comments: payload.comments || "",
          source: "EvoFinz Quiz",
          lead_id: savedLead.id,
          // NEW: Lead scoring fields for GHL segmentation
          lead_score: leadScore,
          lead_priority: leadPriority,
          lead_priority_label: getPriorityLabel(leadPriority),
          is_high_priority: leadScore >= 80,
          is_warm_or_higher: leadScore >= 50,
        };

        const ghlResponse = await fetch(ghlWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ghlPayload),
        });

        if (ghlResponse.ok) {
          console.log("Lead sent to GHL successfully with scoring:", {
            lead_score: leadScore,
            lead_priority: leadPriority,
            is_high_priority: leadScore >= 80,
          });
        } else {
          console.error("GHL webhook failed:", await ghlResponse.text());
        }
      } catch (ghlError) {
        // Don't fail the request if GHL fails - lead is already saved
        console.error("GHL webhook error:", ghlError);
      }
    } else {
      console.log("GHL_WEBHOOK_URL not configured - skipping webhook");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: savedLead.id,
        lead_score: leadScore,
        lead_priority: leadPriority,
        message: "Lead captured successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing quiz lead:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
