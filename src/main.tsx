import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

// Dev/preview safety: disable PWA caching that can prevent the preview from updating.
// Clean up service workers + caches silently in background without forcing reload.
const isPreviewHost = typeof window !== "undefined" && /lovableproject\.com$/i.test(window.location.hostname);

if (import.meta.env.DEV || isPreviewHost) {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }

  if (typeof window !== "undefined" && "caches" in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
