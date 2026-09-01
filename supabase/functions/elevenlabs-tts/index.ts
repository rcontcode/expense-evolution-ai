import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_VOICE_ID = "cgSgspJ2msm6clMCkdW9";

// ElevenLabs cobra por CARACTER, asi que la voz es el unico costo que se acerca al precio de la
// suscripcion: los 120 minutos que traia Pro costaban $11,90-$14,40 al mes contra $14,26 que
// quedan de los $14,99. Estos son los topes MENSUALES de los planes de pago.
const PLAN_LIMITS: Record<string, number> = {
  premium: 30,
  pro: 60,
};

// El plan gratis no recibe minutos todos los meses: recibe una PRUEBA de la voz buena que se
// gasta UNA SOLA VEZ. La diferencia cuenta en las dos direcciones. En el dinero: 3 minutos
// mensuales por usuario gratis son ~$4 al ano cada uno y no paran nunca; una prueba de 5 minutos
// cuesta ~$0,60 una vez. Y en la venta: un regalo que se renueva el 1 le ENSENA a la persona a
// esperar el proximo mes en vez de pagar. Al agotarse pasa a la voz del navegador, que es gratis
// y ya existia como respaldo: el plan gratis nunca se queda sin asistente de voz.
const VOICE_TRIAL_MINUTES = 5;

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
    // Sin plan de pago, lo que hay es la prueba de una sola vez.
    const isTrial = PLAN_LIMITS[planType] === undefined;
    const monthlyLimit = isAdmin
      ? Infinity
      : (isTrial ? VOICE_TRIAL_MINUTES : PLAN_LIMITS[planType]);

    // La prueba se cuenta desde SIEMPRE (todos los periodos); el tope de un plan de pago, solo
    // desde el 1. Si la prueba se leyera por mes se renovaria sola y dejaria de ser una prueba.
    let usageQuery = supabase
      .from("usage_tracking")
      .select("voice_minutes_used")
      .eq("user_id", user.id);

    if (!isTrial) {
      const currentPeriod = new Date().toISOString().slice(0, 7) + "-01";
      usageQuery = usageQuery.eq("period_start", currentPeriod);
    }

    const { data: usageRows } = await usageQuery;
    const currentUsage = (usageRows ?? []).reduce(
      (total: number, row: { voice_minutes_used?: number | null }) =>
        total + Number(row.voice_minutes_used || 0),
      0,
    );

    if (!isAdmin && currentUsage >= monthlyLimit) {
      const reset = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString();
      return new Response(
        JSON.stringify({ 
          error: "quota_exceeded",
          feature: "voice_premium",
          currentPlan: planType,
          requiredPlan: planType === "free" ? "premium" : (planType === "premium" ? "pro" : undefined),
          isTrial,
          message: isTrial
            ? `Usaste tus ${monthlyLimit} minutos de regalo de la voz premium. Desde ahora escuchas la voz del navegador; con Premium recuperas la voz buena.`
            : `Has usado ${currentUsage}/${monthlyLimit} minutos de voz este mes. Se renueva el ${reset.slice(0, 10)}.`,
          currentUsage,
          limit: monthlyLimit,
          resetDate: reset,
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
            isTrial,
            message: isTrial
              ? "Se acabó tu prueba de voz premium"
              : "Has alcanzado tu límite de voz premium este mes",
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
        "X-Voice-Trial": String(isTrial),
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
