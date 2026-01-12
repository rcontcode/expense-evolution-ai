import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

// Aggressive cleanup of service workers and caches to prevent 404 errors on SPA routes.
// This runs on ALL environments to ensure fresh content delivery.
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
  } catch (e) {
    // Silently ignore - cleanup is best effort
    console.debug("[SW Cleanup]", e);
  }
};

// Run cleanup immediately on load
cleanupServiceWorkers();

// Also run cleanup periodically to catch any new SW registrations
const isPreviewHost = typeof window !== "undefined" && /lovableproject\.com$/i.test(window.location.hostname);
if (import.meta.env.DEV || isPreviewHost) {
  // In dev/preview, run cleanup every 30 seconds
  setInterval(cleanupServiceWorkers, 30000);
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
