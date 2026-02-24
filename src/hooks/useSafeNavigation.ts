import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    __APP_RENDERED_PATH__?: string;
  }
}

/**
 * Safe navigation hook that validates the *rendered* route, not just the URL.
 * 
 * The root cause of the "stuck in Settings" bug is that React Router's internal
 * state can desynchronize from the browser URL. The URL changes but the component
 * tree doesn't re-render. This hook detects that condition by comparing against
 * `window.__APP_RENDERED_PATH__` (set by RouteRenderHeartbeat in App.tsx) and
 * forces a hard navigation only when a true desync is detected.
 */
export function useSafeNavigation() {
  const navigate = useNavigate();

  const safeNavigate = useCallback((path: string) => {
    // If already on the target path AND rendered path matches, force reload to unstick
    if (window.location.pathname === path && window.__APP_RENDERED_PATH__ === path) {
      window.location.replace(path);
      return;
    }

    // Attempt SPA navigation
    navigate(path);

    // Check 1 (fast): Did the URL change?
    setTimeout(() => {
      if (window.location.pathname !== path) {
        // URL didn't change at all — force hard navigation
        window.location.assign(path);
        return;
      }

      // Check 2 (render validation): URL changed but did React actually render?
      // Give React a bit more time to flush the render
      setTimeout(() => {
        const renderedPath = window.__APP_RENDERED_PATH__;
        if (renderedPath && renderedPath !== path) {
          // URL changed but React Router didn't re-render — this is the exact bug
          console.warn(
            `[SafeNav] Desync detected: URL=${path}, rendered=${renderedPath}. Forcing reload.`
          );
          window.location.replace(path);
        }
      }, 200);
    }, 100);
  }, [navigate]);

  return safeNavigate;
}

/**
 * Standalone function for use outside React components.
 * Always does a hard navigation — no SPA attempt.
 */
export function hardNavigate(path: string) {
  window.location.assign(path);
}
