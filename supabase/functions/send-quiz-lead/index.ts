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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save to quiz_leads table
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

    console.log("Lead saved to database:", savedLead.id);

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
          source: "EvoFinz Quiz",
          lead_id: savedLead.id,
        };

        const ghlResponse = await fetch(ghlWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ghlPayload),
        });

        if (ghlResponse.ok) {
          console.log("Lead sent to GHL successfully");
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
