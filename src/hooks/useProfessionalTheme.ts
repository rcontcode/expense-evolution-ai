import { useCallback, useEffect, useState } from 'react';
import {
  PROFESSIONAL_THEME_PRESETS,
  ProfessionalThemePresetId,
  DEFAULT_PROFESSIONAL_THEME,
  getProfessionalTheme,
} from '@/config/professionalThemePresets';

const STORAGE_KEY = 'evofinz.professionalTheme';
const EVENT = 'evofinz:professionalThemeUpdated';

const TOKEN_KEYS: Array<[keyof ReturnType<typeof getProfessionalTheme>['tokens'], string]> = [
  ['background', '--background'],
  ['foreground', '--foreground'],
  ['card', '--card'],
  ['cardForeground', '--card-foreground'],
  ['primary', '--primary'],
  ['primaryForeground', '--primary-foreground'],
  ['secondary', '--secondary'],
  ['secondaryForeground', '--secondary-foreground'],
  ['muted', '--muted'],
  ['mutedForeground', '--muted-foreground'],
  ['accent', '--accent'],
  ['accentForeground', '--accent-foreground'],
  ['border', '--border'],
  ['input', '--input'],
  ['ring', '--ring'],
];

function readStored(): ProfessionalThemePresetId {
  if (typeof window === 'undefined') return DEFAULT_PROFESSIONAL_THEME;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && PROFESSIONAL_THEME_PRESETS.some((p) => p.id === v)) {
      return v as ProfessionalThemePresetId;
    }
  } catch {}
  return DEFAULT_PROFESSIONAL_THEME;
}

function clearOverrides() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  TOKEN_KEYS.forEach(([, cssVar]) => root.style.removeProperty(cssVar));
  root.removeAttribute('data-pro-theme');
}

function applyToRoot(id: ProfessionalThemePresetId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (id === 'none') {
    clearOverrides();
    return;
  }
  const preset = getProfessionalTheme(id);
  // Only override tokens when the preset's mode matches the current mode.
  // This way, toggling dark/light reveals the base theme instead of being
  // locked to the preset's palette.
  const currentMode: 'light' | 'dark' = root.classList.contains('dark') ? 'dark' : 'light';
  if (preset.mode !== currentMode) {
    clearOverrides();
    return;
  }
  TOKEN_KEYS.forEach(([key, cssVar]) => {
    const v = preset.tokens[key];
    if (v) root.style.setProperty(cssVar, v);
  });
  root.setAttribute('data-pro-theme', id);
}

export function useProfessionalTheme(opts: { autoApply?: boolean } = {}) {
  const { autoApply = true } = opts;
  const [presetId, setPresetIdState] = useState<ProfessionalThemePresetId>(readStored);

  useEffect(() => {
    if (autoApply) applyToRoot(presetId);
  }, [presetId, autoApply]);

  useEffect(() => {
    const handler = () => setPresetIdState(readStored());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    const reapply = () => applyToRoot(readStored());
    const observer = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.attributeName === 'class') { reapply(); break; }
      }
    });
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
      observer.disconnect();
    };
  }, []);

  const setPresetId = useCallback((id: ProfessionalThemePresetId) => {
    try { window.localStorage.setItem(STORAGE_KEY, id); } catch {}
    setPresetIdState(id);
    applyToRoot(id);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return {
    presetId,
    preset: getProfessionalTheme(presetId),
    presets: PROFESSIONAL_THEME_PRESETS,
    setPresetId,
  };
}
