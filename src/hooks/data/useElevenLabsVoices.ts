import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ElevenLabsVoice = {
  id: string;
  name: string;
  previewUrl: string | null;
  labels: Record<string, string>;
  description: string | null;
  category: string | null;
};

type RawVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  labels?: Record<string, string>;
  description?: string | null;
  category?: string | null;
};

function labelsToText(labels: Record<string, string> | undefined) {
  return Object.values(labels ?? {}).join(' ').toLowerCase();
}

function detectLang(voice: ElevenLabsVoice): 'es' | 'en' | null {
  const text = `${voice.name} ${voice.description ?? ''} ${labelsToText(voice.labels)}`.toLowerCase();

  // Spanish / LatAm
  if (
    /spanish|español|latam|latin america|es-419|mexic|chile|chilena|chileno|mexicana|mexicano/.test(text)
  ) {
    return 'es';
  }

  // English
  if (/english|en-us|en-gb|american|british|canadian|australian/.test(text)) {
    return 'en';
  }

  return null;
}

function detectGender(voice: ElevenLabsVoice): 'female' | 'male' {
  const labelGender = (voice.labels?.gender ?? '').toLowerCase();
  if (labelGender === 'male' || labelGender === 'm') return 'male';
  if (labelGender === 'female' || labelGender === 'f') return 'female';

  const text = `${voice.name} ${labelsToText(voice.labels)}`.toLowerCase();
  if (/\bmale\b|\bman\b|\bmasculin/.test(text)) return 'male';
  return 'female';
}

function isRecommendedLatamEs(voice: ElevenLabsVoice): boolean {
  const text = `${voice.name} ${voice.description ?? ''} ${labelsToText(voice.labels)}`.toLowerCase();
  // Must look Spanish/LatAm
  const isSpanish = /spanish|español|latam|latin america|es-419|mexic|chile|argentin|colombi/.test(text);
  if (!isSpanish) return false;

  // Must NOT look English-region (stricter check)
  if (/english|en-us|en-gb|american|british|australian|united states/.test(text)) return false;

  // Prefer Mexico/Chile/neutral latam/Colombia/Argentina
  return /mexic|chile|latin america|latam|neutral|neutro|colombi|argentin/.test(text);
}

// Known-bad IDs that were incorrectly mapped as Spanish and sound “gringo” in-app.
const BLOCKED_SPANISH_VOICE_IDS = new Set<string>([
  'jsCqWAovK2LkecY7zXl4', // “Sofía” (reported)
  'z9fAnlkpzviPz146aGWa', // “Valentina” (reported)
  'oWAxZDx7w5VEj9dCyTzz', // “Isabella” (reported)
  'LcfcDJNUP1GQjkzn1xUU', // “Daniela” (reported too slow)
  'GBv7mTt0atIp3Br8iCZE', // “Diego” (reported too slow)
  'JBFqnCBsd6RMkjVDRZzb', // George (EN) was wrongly used as ES
]);

export function useElevenLabsVoices() {
  return useQuery({
    queryKey: ['elevenlabs', 'voices'],
    queryFn: async (): Promise<{ voices: ElevenLabsVoice[] }> => {
      const { data, error } = await supabase.functions.invoke('elevenlabs-voices');
      if (error) throw error;

      const raw = (data?.voices ?? []) as RawVoice[];
      const voices: ElevenLabsVoice[] = raw
        .map((v) => ({
          id: v.voice_id,
          name: v.name,
          previewUrl: v.preview_url ?? null,
          labels: v.labels ?? {},
          description: v.description ?? null,
          category: v.category ?? null,
        }))
        .filter((v) => v.id && v.name);

      return { voices };
    },
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 12,
  });
}

export function buildVoiceOptions(
  voices: ElevenLabsVoice[],
  lang: 'es' | 'en',
): { female: ElevenLabsVoice[]; male: ElevenLabsVoice[] } {
  const filtered = voices.filter((v) => {
    if (lang === 'es' && BLOCKED_SPANISH_VOICE_IDS.has(v.id)) return false;
    const detected = detectLang(v);
    return detected === lang;
  });

  const female = filtered.filter((v) => detectGender(v) === 'female');
  const male = filtered.filter((v) => detectGender(v) === 'male');

  // Prefer “neutral LatAm” for Spanish by default.
  const femaleRecommended = lang === 'es'
    ? female.filter(isRecommendedLatamEs)
    : female;
  const maleRecommended = lang === 'es'
    ? male.filter(isRecommendedLatamEs)
    : male;

  // Guarantee at least ~10 options by topping up with non-recommended voices.
  const topUp = (preferred: ElevenLabsVoice[], pool: ElevenLabsVoice[]) => {
    if (preferred.length >= 10) return preferred;
    const used = new Set(preferred.map((v) => v.id));
    const extras = pool.filter((v) => !used.has(v.id));
    return [...preferred, ...extras].slice(0, 10);
  };

  return {
    female: topUp(femaleRecommended, female),
    male: topUp(maleRecommended, male),
  };
}
