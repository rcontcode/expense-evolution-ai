import { useCallback, useEffect, useState } from 'react';
import {
  SURFACE_TEXTURES,
  SurfaceTextureId,
  DEFAULT_SURFACE_TEXTURE,
  getSurfaceTexture,
} from '@/config/surfaceTextures';

const STORAGE_KEY = 'evofinz.surfaceTexture';
const EVENT = 'evofinz:surfaceTextureUpdated';

function readStored(): SurfaceTextureId {
  if (typeof window === 'undefined') return DEFAULT_SURFACE_TEXTURE;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && SURFACE_TEXTURES.some((t) => t.id === v)) return v as SurfaceTextureId;
  } catch {}
  return DEFAULT_SURFACE_TEXTURE;
}

function applyToBody(id: SurfaceTextureId) {
  if (typeof document === 'undefined') return;
  const tx = getSurfaceTexture(id);
  const body = document.body;
  if (id === 'none') {
    body.style.removeProperty('--surface-texture');
    body.style.removeProperty('--surface-texture-size');
  } else {
    body.style.setProperty('--surface-texture', tx.cssImage.trim());
    body.style.setProperty('--surface-texture-size', tx.cssSize ?? 'auto');
  }
  body.setAttribute('data-surface-texture', id);
}

export function useSurfaceTexture(opts: { autoApply?: boolean } = {}) {
  const { autoApply = true } = opts;
  const [textureId, setTextureIdState] = useState<SurfaceTextureId>(readStored);

  useEffect(() => {
    if (autoApply) applyToBody(textureId);
  }, [textureId, autoApply]);

  useEffect(() => {
    const handler = () => setTextureIdState(readStored());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const setTextureId = useCallback((id: SurfaceTextureId) => {
    try { window.localStorage.setItem(STORAGE_KEY, id); } catch {}
    setTextureIdState(id);
    applyToBody(id);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return {
    textureId,
    texture: getSurfaceTexture(textureId),
    textures: SURFACE_TEXTURES,
    setTextureId,
  };
}
