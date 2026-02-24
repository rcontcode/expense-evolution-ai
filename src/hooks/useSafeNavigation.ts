import { useCallback, useEffect, useRef } from 'react';
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
 * Strategy:
 * - Keep SPA navigation as the default (no full reloads).
 * - When leaving /settings, emit a pre-exit event so Settings can shed heavy UI.
 * - Run multiple sync checks to recover URL/UI desync without hard refresh.
 */
export function useSafeNavigation() {
  const navigate = useNavigate();
  const pendingChecksRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const navTokenRef = useRef(0);

  const clearPendingChecks = useCallback(() => {
    pendingChecksRef.current.forEach((timer) => clearTimeout(timer));
    pendingChecksRef.current = [];
  }, []);

  const queueSyncCheck = useCallback((delay: number, token: number) => {
    const timer = setTimeout(() => {
      if (token !== navTokenRef.current) return;
      window.dispatchEvent(new Event("__route_sync_check__"));
    }, delay);
    pendingChecksRef.current.push(timer);
  }, []);

  const safeNavigate = useCallback((path: string) => {
    const normalized = normalizePath(path);
    const currentBrowser = normalizePath(window.location.pathname || "/");

    // Skip navigation to same route
    if (normalized === currentBrowser) return;

    clearPendingChecks();

    // New navigation token to invalidate stale checks
    navTokenRef.current += 1;
    const navToken = navTokenRef.current;

    // Let Settings drop heavy content before transition starts
    if (currentBrowser === "/settings" && normalized !== "/settings") {
      window.dispatchEvent(new CustomEvent("__settings_exit__", { detail: { to: normalized } }));
    }

    navigate(path);

    // Multi-stage sync verification (no hard reload fallback)
    [250, 700, 1400].forEach((delay) => queueSyncCheck(delay, navToken));
  }, [clearPendingChecks, navigate, queueSyncCheck]);

  useEffect(() => {
    return () => clearPendingChecks();
  }, [clearPendingChecks]);

  return safeNavigate;
}

/**
 * Standalone function for use outside React components.
 * Always does a hard navigation — no SPA attempt.
 */
export function hardNavigate(path: string) {
  window.location.assign(path);
}

