import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";
// Force rebuild trigger

// Dev/preview safety: disable PWA caching that can prevent the preview from updating.
// This also removes any previously-registered service workers from older builds.
if (import.meta.env.DEV && typeof window !== "undefined") {
  const flagKey = "__dev_sw_cleanup_done__";
  if (!sessionStorage.getItem(flagKey)) {
    sessionStorage.setItem(flagKey, "1");

    Promise.all([
      "serviceWorker" in navigator
        ? navigator.serviceWorker.getRegistrations().then((regs) =>
            Promise.all(regs.map((r) => r.unregister()))
          )
        : Promise.resolve(),
      "caches" in window
        ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        : Promise.resolve(),
    ]).finally(() => {
      // One-time reload to ensure we’re running the latest assets.
      window.location.reload();
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

