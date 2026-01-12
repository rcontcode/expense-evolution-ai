import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

// Dev/preview safety: disable stale PWA caching that can cause route 404s during review.
// Best-effort cleanup (only in dev/preview) without forcing a reload.
const cleanupServiceWorkers = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }

    if ("caches" in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((k) => caches.delete(k)));
    }
  } catch {
    // best-effort
  }
};

const isPreviewHost =
  typeof window !== "undefined" && /lovableproject\.com$/i.test(window.location.hostname);

if (import.meta.env.DEV || isPreviewHost) {
  cleanupServiceWorkers();
  // In dev/preview, run cleanup periodically to catch any new SW registrations
  window.setInterval(cleanupServiceWorkers, 30_000);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
