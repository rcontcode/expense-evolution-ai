import { useSurfaceTexture } from '@/hooks/useSurfaceTexture';

/**
 * Invisible component that activates the surface texture preference
 * (read from localStorage) and applies it to <body> on mount.
 */
export function SurfaceTextureMount() {
  useSurfaceTexture({ autoApply: true });
  return null;
}
