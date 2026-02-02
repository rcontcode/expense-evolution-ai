import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  labels?: Record<string, string>;
  description?: string | null;
  category?: string | null;
};

type ElevenLabsSharedVoice = {
  public_owner_id: string;
  voice_id: string;
  name: string;
  accent?: string | null;
  gender?: string | null;
  language?: string | null;
  description?: string | null;
  category?: string | null;
  preview_url?: string | null;
  featured?: boolean | null;
  rate?: number | null;
  usage_character_count_7d?: number | null;
};

// Explicitly block voices users reported as “gringo”/slow in Spanish.
// Note: these are raw voice IDs (not the `shared:<owner>:<id>` format).
const BLOCKED_SPANISH_VOICE_IDS = new Set<string>([
  "jsCqWAovK2LkecY7zXl4", // Sofía
  "z9fAnlkpzviPz146aGWa", // Valentina
  "oWAxZDx7w5VEj9dCyTzz", // Isabella
  "LcfcDJNUP1GQjkzn1xUU", // Daniela (too slow)
  "GBv7mTt0atIp3Br8iCZE", // Diego (too slow)
  "JBFqnCBsd6RMkjVDRZzb", // George (EN) was wrongly used as ES
]);

const SPANISH_ACCENT_ALLOW_RE = /(mexic|chile|latin|latam|neutral|es-419)/i;
const ENGLISH_ACCENT_BLOCK_RE = /(american|british|australian|canadian)/i;

function buildSharedVoiceId(publicOwnerId: string, voiceId: string) {
  return `shared:${publicOwnerId}:${voiceId}`;
}

function normalizeGender(g: string | null | undefined): string {
  const v = (g ?? "").toLowerCase();
  if (v === "female") return "female";
  if (v === "male") return "male";
  return v;
}

async function fetchSharedSpanishVoices(
  ELEVENLABS_API_KEY: string,
  gender: "Female" | "Male",
): Promise<ElevenLabsSharedVoice[]> {
  const url = new URL("https://api.elevenlabs.io/v1/shared-voices");
  url.searchParams.set("page_size", "100");
  url.searchParams.set("language", "es");
  url.searchParams.set("gender", gender);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `ElevenLabs shared voices fetch failed [${response.status}]: ${JSON.stringify(data)}`,
    );
  }

  return (data?.voices ?? []) as ElevenLabsSharedVoice[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    // Require auth to avoid exposing your ElevenLabs usage surface.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        `ElevenLabs voices fetch failed [${response.status}]: ${JSON.stringify(data)}`,
      );
    }

    const rawVoices: ElevenLabsVoice[] = (data?.voices ?? []) as ElevenLabsVoice[];
    const voicesFromAccount = rawVoices.map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      preview_url: v.preview_url ?? null,
      labels: v.labels ?? {},
      description: v.description ?? null,
      category: v.category ?? null,
    }));

    // Also fetch a curated set of real Spanish (LatAm) voices from the shared Voice Library.
    // This fixes cases where the account voice list is mostly English.
    let sharedSpanish: ElevenLabsVoice[] = [];
    try {
      const [sharedFemale, sharedMale] = await Promise.all([
        fetchSharedSpanishVoices(ELEVENLABS_API_KEY, "Female"),
        fetchSharedSpanishVoices(ELEVENLABS_API_KEY, "Male"),
      ]);

      const pickTop = (items: ElevenLabsSharedVoice[], target: number) => {
        const sorted = [...items].sort((a, b) => {
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

        const primary: ElevenLabsSharedVoice[] = [];
        const used = new Set<string>();

        // Pass 1: strict allowed accents
        for (const v of sorted) {
          if (primary.length >= target) break;
          if (!v?.voice_id || !v?.public_owner_id || !v?.name) continue;
          if (BLOCKED_SPANISH_VOICE_IDS.has(v.voice_id)) continue;

          const accent = (v.accent ?? "").toLowerCase();
          if (ENGLISH_ACCENT_BLOCK_RE.test(accent)) continue;
          if (!SPANISH_ACCENT_ALLOW_RE.test(accent)) continue;

          if (used.has(v.voice_id)) continue;
          used.add(v.voice_id);
          primary.push(v);
        }

        // Pass 2: top up with any ES voices that are not clearly English-accented.
        if (primary.length < target) {
          for (const v of sorted) {
            if (primary.length >= target) break;
            if (!v?.voice_id || !v?.public_owner_id || !v?.name) continue;
            if (BLOCKED_SPANISH_VOICE_IDS.has(v.voice_id)) continue;
            if (used.has(v.voice_id)) continue;

            const accent = (v.accent ?? "").toLowerCase();
            if (ENGLISH_ACCENT_BLOCK_RE.test(accent)) continue;

            used.add(v.voice_id);
            primary.push(v);
          }
        }

        return primary;
      };

      const selectedShared = [
        ...pickTop(sharedFemale, 12),
        ...pickTop(sharedMale, 12),
      ];

      sharedSpanish = selectedShared.map((v) => {
        const accent = (v.accent ?? "").trim();
        const gender = normalizeGender(v.gender ?? null);
        return {
          voice_id: buildSharedVoiceId(v.public_owner_id, v.voice_id),
          name: accent ? `${v.name} (${accent})` : v.name,
          preview_url: v.preview_url ?? null,
          labels: {
            language: "es",
            accent: accent || "latam",
            gender,
            source: "shared",
            public_owner_id: v.public_owner_id,
          },
          description: v.description ?? null,
          category: v.category ?? "shared",
        };
      });
    } catch (e) {
      // Don't fail the whole endpoint if shared voices fetch fails.
      console.warn("Shared Spanish voices fetch failed:", e);
    }

    // Merge: account voices (typically EN) + shared curated ES voices.
    const voices = [...voicesFromAccount, ...sharedSpanish];

    return new Response(JSON.stringify({ voices }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ElevenLabs voices error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
