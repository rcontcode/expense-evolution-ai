import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    __APP_RENDERED_PATH__?: string;
  }
}

/**
 * Navigation hook that uses standard SPA navigation.
 * 
 * The RouteSyncGuard in App.tsx handles persistent desync recovery globally,
 * so this hook only needs to do a simple navigate() call.
 * 
 * Previously this hook had aggressive render-validation timeouts that caused
 * false-positive hard reloads on every navigation (because lazy-loaded routes
 * hadn't rendered within the check window). That has been removed.
 */
export function useSafeNavigation() {
  const navigate = useNavigate();

  const safeNavigate = useCallback((path: string) => {
    // Simple SPA navigation — RouteSyncGuard handles edge cases
    navigate(path);
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
