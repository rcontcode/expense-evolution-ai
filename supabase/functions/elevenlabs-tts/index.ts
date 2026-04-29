import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_VOICE_ID = "cgSgspJ2msm6clMCkdW9";

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  premium: 30,
  pro: 120,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { text, voiceId, lang } = await req.json();
    
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    let isAdmin = false;
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleData) isAdmin = true;
    } catch (_e) {
      console.log("Admin check failed, assuming non-admin");
    }

    // Get subscription plan
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("plan_type")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const planType = subscription?.plan_type || "free";
    const monthlyLimit = isAdmin ? Infinity : (PLAN_LIMITS[planType] || 3);

    // Get current month's usage
    const currentPeriod = new Date().toISOString().slice(0, 7) + "-01";
    const { data: usageData } = await supabase
      .from("usage_tracking")
      .select("voice_minutes_used")
      .eq("user_id", user.id)
      .eq("period_start", currentPeriod)
      .maybeSingle();

    const currentUsage = Number(usageData?.voice_minutes_used || 0);

    if (!isAdmin && currentUsage >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: "voice_limit_exceeded",
          feature: "voice_premium",
          currentPlan: planType,
          requiredPlan: planType === "free" ? "premium" : "pro",
          message: "Has alcanzado tu límite de voz premium este mes",
          currentUsage,
          limit: monthlyLimit,
          useFallback: true
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const estimatedMinutes = Math.max(0.1, text.length / 600);

    if (!isAdmin && (currentUsage + estimatedMinutes) > monthlyLimit) {
      const remainingMinutes = monthlyLimit - currentUsage;
      if (remainingMinutes < 0.1) {
        return new Response(
          JSON.stringify({ 
            error: "voice_limit_exceeded",
            feature: "voice_premium",
            currentPlan: planType,
            requiredPlan: planType === "free" ? "premium" : "pro",
            message: "Has alcanzado tu límite de voz premium este mes",
            currentUsage,
            limit: monthlyLimit,
            useFallback: true
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Clean text for TTS
    const cleanedText = text
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedText) {
      return new Response(
        JSON.stringify({ error: "No speakable text after cleaning" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine voice ID
    const selectedVoiceId = (typeof voiceId === "string" && voiceId.trim()) 
      ? voiceId.trim() 
      : DEFAULT_VOICE_ID;

    console.log(`[TTS] User: ${user.id}, voice: ${selectedVoiceId}, text length: ${cleanedText.length}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: "elevenlabs_error",
          message: "Error generando voz premium",
          detail: errorText,
          useFallback: true
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment usage for non-admin users
    if (!isAdmin) {
      await supabase.rpc("increment_voice_usage", {
        p_user_id: user.id,
        p_minutes: estimatedMinutes,
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "X-Voice-Minutes-Used": String(estimatedMinutes.toFixed(2)),
        "X-Voice-Minutes-Total": String((currentUsage + estimatedMinutes).toFixed(2)),
        "X-Voice-Minutes-Limit": String(monthlyLimit),
      },
    });
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        useFallback: true
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
