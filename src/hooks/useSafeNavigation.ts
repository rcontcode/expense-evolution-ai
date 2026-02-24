import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    __APP_RENDERED_PATH__?: string;
  }
}

function normalizePath(path: string) {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Navigation hook with Settings-exit safeguard.
 *
 * React Router v7 uses startTransition internally for all navigations.
 * When leaving a heavy page like Settings (with multiple Suspense boundaries),
 * the transition keeps the old page visible indefinitely.
 *
 * Fix: when leaving /settings, use a controlled page navigation instead of
 * SPA navigate() to guarantee immediate unmount.
 */
export function useSafeNavigation() {
  const navigate = useNavigate();
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeNavigate = useCallback((path: string) => {
    const normalized = normalizePath(path);
    const currentBrowser = normalizePath(window.location.pathname || "/");

    // Skip navigation to same route
    if (normalized === currentBrowser) return;

    // Settings has heavy Suspense children that block React Router v7's
    // transition mechanism. Use controlled navigation to guarantee exit.
    if (currentBrowser === "/settings" && normalized !== "/settings") {
      window.location.assign(path);
      return;
    }

    // Cancel any pending verification from a previous rapid navigation
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    navigate(path);

    // After a short buffer, ask RouteSyncGuard to verify render matched
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null;
      window.dispatchEvent(new Event("__route_sync_check__"));
    }, 600);
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
