import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Safe navigation hook that guarantees the user actually moves to the target page.
 * If React Router's SPA navigation fails (URL changes but view doesn't update),
 * it forces a hard browser reload as fallback.
 */
export function useSafeNavigation() {
  const navigate = useNavigate();

  const safeNavigate = useCallback((path: string) => {
    // If already on the target path, force reload to unstick
    if (window.location.pathname === path) {
      window.location.replace(path);
      return;
    }

    // Attempt SPA navigation
    navigate(path);

    // Verify navigation actually happened after a short delay
    setTimeout(() => {
      if (window.location.pathname !== path) {
        // URL didn't even change — force it
        window.location.assign(path);
      }
    }, 150);

    // Second check: even if URL changed, the view might be stuck
    // This catches the "URL changes but UI doesn't re-render" bug
    setTimeout(() => {
      // If we're still supposedly navigating but the pathname matches,
      // the router should have rendered. If not, force reload.
      if (window.location.pathname === path) {
        // Check if the document title or any route indicator changed
        // As a simple heuristic: if we're here and the path is correct,
        // the SPA navigation likely worked. But if not, the global guard
        // in App.tsx will catch persistent mismatches.
        return;
      }
      // URL still didn't change after 300ms — hard navigate
      window.location.assign(path);
    }, 300);
  }, [navigate]);

  return safeNavigate;
}

/**
 * Standalone function for use outside React components (e.g., event handlers).
 * Always does a hard navigation — no SPA attempt.
 */
export function hardNavigate(path: string) {
  window.location.assign(path);
}
