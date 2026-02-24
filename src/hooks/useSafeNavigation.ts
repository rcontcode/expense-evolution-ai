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
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTokenRef = useRef(0);

  const safeNavigate = useCallback((path: string) => {
    const normalized = normalizePath(path);
    const currentBrowser = normalizePath(window.location.pathname || "/");

    // Skip navigation to same route
    if (normalized === currentBrowser) return;

    // Cancel timers from previous rapid navigations
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    // New navigation token to invalidate stale checks
    navTokenRef.current += 1;
    const navToken = navTokenRef.current;

    navigate(path);

    // Ask RouteSyncGuard for a soft verification first
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null;
      if (navToken !== navTokenRef.current) return;
      window.dispatchEvent(new Event("__route_sync_check__"));
    }, 350);

    // Last-resort fallback ONLY when leaving settings and still visually desynced
    if (currentBrowser === "/settings" && normalized !== "/settings") {
      fallbackTimerRef.current = setTimeout(() => {
        fallbackTimerRef.current = null;
        if (navToken !== navTokenRef.current) return;

        const browserPath = normalizePath(window.location.pathname || "/");
        const renderedPath = normalizePath(window.__APP_RENDERED_PATH__ ?? "/");
        if (browserPath === normalized && renderedPath !== normalized) {
          window.location.assign(path);
        }
      }, 1200);
    }
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
