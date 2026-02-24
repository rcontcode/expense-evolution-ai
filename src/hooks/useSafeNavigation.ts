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
 * Navigation hook with post-navigate render verification.
 *
 * After calling navigate(), it waits a short window and then dispatches
 * a custom event so RouteSyncGuard can verify and repair if needed.
 *
 * Anti-spam: cancels pending verification if user navigates again quickly.
 */
export function useSafeNavigation() {
  const navigate = useNavigate();
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeNavigate = useCallback((path: string) => {
    const normalized = normalizePath(path);
    const currentRendered = normalizePath(window.__APP_RENDERED_PATH__ ?? "/");
    const currentBrowser = normalizePath(window.location.pathname || "/");

    // Skip navigation to same route
    if (normalized === currentRendered || normalized === currentBrowser) return;

    // Hard-exit safeguard from Settings (root cause path where UI can stay visually stuck)
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
    }, 350);
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
