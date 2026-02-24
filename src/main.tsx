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
  }

  mountApp();
};

void bootstrap();
