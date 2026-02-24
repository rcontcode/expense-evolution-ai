import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

// Dev/preview safety: aggressively remove any SW/cache that can pin an old UI build.
// In preview, force a single soft reload only when stale runtime caches are detected.
const PREVIEW_REFRESH_KEY = "__preview_fresh_once__";

const isPreviewHost =
  typeof window !== "undefined" &&
  (/lovableproject\.com$/i.test(window.location.hostname) ||
    (window.location.hostname.includes("preview") && window.location.hostname.endsWith(".lovable.app")));

const cleanupServiceWorkers = async () => {
  let hadStaleRuntime = false;

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) hadStaleRuntime = true;
      await Promise.all(registrations.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      if (cacheKeys.length > 0) hadStaleRuntime = true;
      await Promise.all(cacheKeys.map((k) => caches.delete(k)));
    }
  } catch {
    // best-effort
  }

  return hadStaleRuntime;
};

const mountApp = () => {
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
};

const bootstrap = async () => {
  if (import.meta.env.DEV || isPreviewHost) {
    const hadStaleRuntime = await cleanupServiceWorkers();

    if (isPreviewHost && hadStaleRuntime && !sessionStorage.getItem(PREVIEW_REFRESH_KEY)) {
      sessionStorage.setItem(PREVIEW_REFRESH_KEY, "1");
      window.location.replace(window.location.pathname + window.location.search + window.location.hash);
      return;
    }

    sessionStorage.removeItem(PREVIEW_REFRESH_KEY);
    window.setInterval(cleanupServiceWorkers, 30_000);

    // Deterministic freshness: detect stale HTML shell in preview.
    // If the shell was loaded >30min ago and a new module fails to load,
    // force a single hard refresh to pick up the latest build.
    if (isPreviewHost) {
      const shellAge = Date.now() - ((window as unknown as Record<string, unknown>).__BUILD_TS__ as number || Date.now());
      const STALE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
      if (shellAge > STALE_THRESHOLD && !sessionStorage.getItem("__build_refresh__")) {
        sessionStorage.setItem("__build_refresh__", "1");
        window.location.replace(
          window.location.pathname + "?v=" + Date.now() + window.location.hash
        );
        return;
      }
      // Clear flag on fresh loads
      if (shellAge < STALE_THRESHOLD) {
        sessionStorage.removeItem("__build_refresh__");
      }
    }
  }

  mountApp();
};

void bootstrap();
