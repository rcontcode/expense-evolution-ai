import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import "./index.css";

// Clean up any stale service workers (best-effort, non-blocking)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  ).catch(() => {});
}
if ("caches" in window) {
  caches.keys().then((keys) =>
    keys.forEach((k) => caches.delete(k))
  ).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
