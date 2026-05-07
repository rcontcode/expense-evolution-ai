import { useCallback, useEffect, useState } from 'react';
import { useDisplayPreferences } from '@/hooks/data/useDisplayPreferences';
import { useSurfaceTexture } from '@/hooks/useSurfaceTexture';
import type { SurfaceTextureId } from '@/config/surfaceTextures';

export type ExperienceModeId = 'tranquilo' | 'equilibrado' | 'pro';

export interface ExperienceModePreset {
  id: ExperienceModeId;
  uiMode: 'simple' | 'advanced';
  texture: SurfaceTextureId;
}

export const EXPERIENCE_MODES: Record<ExperienceModeId, ExperienceModePreset> = {
  tranquilo: { id: 'tranquilo', uiMode: 'simple', texture: 'none' },
  equilibrado: { id: 'equilibrado', uiMode: 'simple', texture: 'dot-paper' },
  pro: { id: 'pro', uiMode: 'advanced', texture: 'linen' },
};

const STORAGE_KEY = 'evofinz.experienceMode';

function readStored(): ExperienceModeId | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && (v === 'tranquilo' || v === 'equilibrado' || v === 'pro')) return v;
  } catch {}
  return null;
}

export function useExperienceMode() {
  const { setUiMode } = useDisplayPreferences();
  const { setTextureId } = useSurfaceTexture({ autoApply: false });
  const [mode, setMode] = useState<ExperienceModeId | null>(readStored);

  useEffect(() => {
    const handler = () => setMode(readStored());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const applyMode = useCallback((id: ExperienceModeId) => {
    const preset = EXPERIENCE_MODES[id];
    setUiMode(preset.uiMode);
    setTextureId(preset.texture);
    try { window.localStorage.setItem(STORAGE_KEY, id); } catch {}
    setMode(id);
  }, [setUiMode, setTextureId]);

  return { mode, applyMode, modes: EXPERIENCE_MODES };
}
