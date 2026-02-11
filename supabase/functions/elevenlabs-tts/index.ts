import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Voice options - default to native Latin American Spanish voices
// Jessica (cgSgspJ2msm6clMCkdW9) - Mexicana, cálida y clara - native Spanish speaker
const DEFAULT_VOICE_ID = "cgSgspJ2msm6clMCkdW9";

// Prefer real Spanish (LatAm) voices from Voice Library when no explicit voiceId is provided.
let cachedDefaultSpanishShared:
  | { publicOwnerId: string; voiceId: string }
  | null = null;

const BLOCKED_SPANISH_VOICE_IDS = new Set<string>([
  "jsCqWAovK2LkecY7zXl4", // Sofía
  "z9fAnlkpzviPz146aGWa", // Valentina
  "oWAxZDx7w5VEj9dCyTzz", // Isabella
  "LcfcDJNUP1GQjkzn1xUU", // Daniela (too slow)
  "GBv7mTt0atIp3Br8iCZE", // Diego (too slow)
  "JBFqnCBsd6RMkjVDRZzb", // George (EN)
]);

const SPANISH_ACCENT_ALLOW_RE = /(mexic|chile|latin|latam|neutral|es-419)/i;
const ENGLISH_ACCENT_BLOCK_RE = /(american|british|australian|canadian)/i;

type SharedVoice = {
  public_owner_id: string;
  voice_id: string;
  name: string;
  accent?: string | null;
  gender?: string | null;
  language?: string | null;
  preview_url?: string | null;
  featured?: boolean | null;
  rate?: number | null;
  usage_character_count_7d?: number | null;
};

function parseVoiceId(input: string):
  | { kind: "regular"; voiceId: string }
  | { kind: "shared"; publicOwnerId: string; sharedVoiceId: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith("shared:")) {
    const parts = trimmed.split(":");
    const publicOwnerId = parts[1] ?? "";
    const sharedVoiceId = parts.slice(2).join(":");
    return { kind: "shared", publicOwnerId, sharedVoiceId };
  }
  return { kind: "regular", voiceId: trimmed };
}

async function fetchDefaultSpanishSharedVoice(ELEVENLABS_API_KEY: string) {
  if (cachedDefaultSpanishShared) return cachedDefaultSpanishShared;

  const url = new URL("https://api.elevenlabs.io/v1/shared-voices");
  url.searchParams.set("page_size", "60");
  url.searchParams.set("language", "es");
  url.searchParams.set("gender", "Female");

  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: { "xi-api-key": ELEVENLABS_API_KEY },
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(
      `ElevenLabs shared voices (default ES) fetch failed [${resp.status}]: ${JSON.stringify(data)}`,
    );
  }

  const raw: SharedVoice[] = (data?.voices ?? []) as SharedVoice[];
  const sorted = [...raw].sort((a, b) => {
    const af = a.featured ? 1 : 0;
    const bf = b.featured ? 1 : 0;
    if (af !== bf) return bf - af;
    const ar = Number(a.rate ?? 0);
    const br = Number(b.rate ?? 0);
    if (ar !== br) return br - ar;
    const au = Number(a.usage_character_count_7d ?? 0);
    const bu = Number(b.usage_character_count_7d ?? 0);
    return bu - au;
  });

  const picked = sorted.find((v) => {
    if (!v?.public_owner_id || !v?.voice_id) return false;
    if (BLOCKED_SPANISH_VOICE_IDS.has(v.voice_id)) return false;
    const accent = (v.accent ?? "").toLowerCase();
    if (ENGLISH_ACCENT_BLOCK_RE.test(accent)) return false;
    return SPANISH_ACCENT_ALLOW_RE.test(accent);
  });

  if (!picked) return null;
  cachedDefaultSpanishShared = {
    publicOwnerId: picked.public_owner_id,
    voiceId: picked.voice_id,
  };
  return cachedDefaultSpanishShared;
}

async function addSharedVoiceToCollection(
  ELEVENLABS_API_KEY: string,
  publicOwnerId: string,
  sharedVoiceId: string,
): Promise<string> {
  // Adding requires a name; we keep it deterministic.
  const addResp = await fetch(
    `https://api.elevenlabs.io/v1/voices/add/${publicOwnerId}/${sharedVoiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        new_name: `Evo ES ${sharedVoiceId.slice(0, 8)}`,
      }),
    },
  );

  const addData = await addResp.json().catch(() => null);
  if (!addResp.ok) {
    throw new Error(
      `ElevenLabs add shared voice failed [${addResp.status}]: ${JSON.stringify(addData)}`,
    );
  }

  const newVoiceId = (addData?.voice_id ?? "") as string;
  if (!newVoiceId) {
    throw new Error("ElevenLabs add shared voice failed: missing voice_id");
  }

  return newVoiceId;
}

// Plan limits in minutes per month
const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  premium: 30,
  pro: 120,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { text, voiceId, lang } = await req.json();
    
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin (bypass limits) - use user_roles table (same as frontend)
    let isAdmin = false;
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      if (!roleError && roleData) {
        isAdmin = true;
      }
    } catch (e) {
      // If table doesn't exist or query fails, assume not admin
      console.log("Admin check failed, assuming non-admin:", e);
    }

    // Get user's subscription plan
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

    // Check if user has remaining minutes
    if (!isAdmin && currentUsage >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: "voice_limit_exceeded",
          message: "Has alcanzado tu límite de voz premium este mes",
          currentUsage,
          limit: monthlyLimit,
          useFallback: true
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate estimated minutes for this request (chars / 600 = approx 1 minute)
    const estimatedMinutes = Math.max(0.1, text.length / 600);

    // Check if this request would exceed the limit
    if (!isAdmin && (currentUsage + estimatedMinutes) > monthlyLimit) {
      // Allow partial use if close to limit
      const remainingMinutes = monthlyLimit - currentUsage;
      if (remainingMinutes < 0.1) {
        return new Response(
          JSON.stringify({ 
            error: "voice_limit_exceeded",
            message: "Has alcanzado tu límite de voz premium este mes",
            currentUsage,
            limit: monthlyLimit,
            useFallback: true
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Clean text for TTS (remove markdown, emojis, etc.)
    const cleanedText = text
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, "") // Emojis
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

    // Decide voice
    let selectedVoiceInput: string | null = typeof voiceId === "string" ? voiceId : null;

    // Always use the curated DEFAULT_VOICE_ID (Jessica) for Spanish when no voice is specified.
    // Shared Voice Library voices were disabled due to inconsistent audio quality (background noise).

    if (!selectedVoiceInput || !selectedVoiceInput.trim()) {
      selectedVoiceInput = DEFAULT_VOICE_ID;
    }

    const parsed = parseVoiceId(selectedVoiceInput);
    let selectedVoiceIdForTts = parsed.kind === "shared" ? parsed.sharedVoiceId : parsed.voiceId;
    
    const callTts = async (voiceId: string) => {
      return await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: cleanedText,
            model_id: "eleven_turbo_v2_5", // Fastest, cheapest, multilingual
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
    };

    let response = await callTts(selectedVoiceIdForTts);

    // If it's a shared voice and it wasn't usable directly, add it to the collection and retry.
    if (!response.ok && parsed.kind === "shared" && (response.status === 404 || response.status === 401)) {
      try {
        const addedVoiceId = await addSharedVoiceToCollection(
          ELEVENLABS_API_KEY,
          parsed.publicOwnerId,
          parsed.sharedVoiceId,
        );
        selectedVoiceIdForTts = addedVoiceId;
        response = await callTts(selectedVoiceIdForTts);
      } catch (e) {
        console.warn("Failed adding shared voice to collection:", e);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      
      // Return error but suggest fallback
      return new Response(
        JSON.stringify({ 
          error: "elevenlabs_error",
          message: "Error generando voz premium",
          useFallback: true
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only increment usage tracking for non-admin users
    if (!isAdmin) {
      await supabase.rpc("increment_voice_usage", {
        p_user_id: user.id,
        p_minutes: estimatedMinutes,
      });
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();

    // Return audio with usage info headers
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
