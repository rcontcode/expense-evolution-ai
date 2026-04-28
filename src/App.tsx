import { lazy, Suspense, Component, type ReactNode, ComponentType, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EntityProvider } from "@/contexts/EntityContext";
import { HighlightProvider } from "@/contexts/HighlightContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { UndoRedoProvider } from "@/contexts/UndoRedoContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AuthenticatedRedirect } from "@/components/AuthenticatedRedirect";
import { useLoginMissionListener } from "@/hooks/data/useMissions";
import { useAutoReminders } from "@/hooks/data/useAutoReminders";
import { useGlobalReminders } from "@/hooks/utils/useGlobalReminders";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loader with retry on failure (handles transient network/build errors)
// Preview/dev: shorter backoff (200ms base) for faster interactive navigation
const IS_PREVIEW = typeof window !== "undefined" &&
  (/lovableproject\.com$/i.test(window.location.hostname) ||
    window.location.hostname.includes("preview"));
const RETRY_BASE_DELAY = IS_PREVIEW ? 200 : 1000;

function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 2,
  delay = RETRY_BASE_DELAY
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
      }
    }
    throw new Error("Failed to load module after retries");
  });
}

// Route preload map for hover/touch/idle-based prefetching.
// Keep in sync with the lazy() routes below — every authenticated route
// should have an entry so preloadRoute() and the IdlePreloader can warm it up.
const routeImportMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import("./pages/Dashboard"),
  '/income': () => import("./pages/Income"),
  '/expenses': () => import("./pages/Expenses"),
  '/settings': () => import("./pages/Settings"),
  '/budget': () => import("./pages/Budget"),
  '/chaos': () => import("./pages/ChaosInbox"),
  '/chaos-inbox': () => import("./pages/ChaosInbox"),
  '/clients': () => import("./pages/Clients"),
  '/projects': () => import("./pages/Projects"),
  '/bills': () => import("./pages/Bills"),
  '/analytics': () => import("./pages/Analytics"),
  '/tax-optimizer': () => import("./pages/TaxOptimizer"),
  '/investments': () => import("./pages/Investments"),
  '/subscriptions': () => import("./pages/Subscriptions"),
  '/banking': () => import("./pages/Banking"),
  '/net-worth': () => import("./pages/NetWorth"),
  '/notifications': () => import("./pages/Notifications"),
  '/mentorship': () => import("./pages/Mentorship"),
  '/tax-calendar': () => import("./pages/TaxCalendar"),
  '/files': () => import("./pages/Files"),
  '/data-health': () => import("./pages/DataHealth"),
  '/reports': () => import("./pages/Reports"),
  '/contracts': () => import("./pages/Contracts"),
  '/mileage': () => import("./pages/Mileage"),
  '/reconciliation': () => import("./pages/Reconciliation"),
  '/tags': () => import("./pages/Tags"),
  '/trash': () => import("./pages/Trash"),
  '/business-profile': () => import("./pages/BusinessProfile"),
  '/capture': () => import("./pages/MobileCapture"),
  '/mobile-capture': () => import("./pages/MobileCapture"),
  '/adventure': () => import("./pages/FinancialAdventure"),
  '/user-guide': () => import("./pages/UserGuide"),
  '/beta-feedback': () => import("./pages/BetaFeedback"),
  '/beta-guide': () => import("./pages/BetaGuide"),
  '/tax-report': () => import("./pages/TaxReportFlow"),
  '/tax-report-flow': () => import("./pages/TaxReportFlow"),
};

// Priority order for IdlePreloader — most-likely-next routes first.
const CORE_PRELOAD_ORDER: string[] = [
  '/dashboard',
  '/expenses',
  '/budget',
  '/mobile-capture',
  '/income',
  '/bills',
  '/chaos',
  '/banking',
  '/settings',
];

const preloadedRoutes = new Set<string>();

/** Preload a route chunk on hover/focus/touchstart. Safe to call multiple times. */
export function preloadRoute(path: string) {
  if (!path) return;
  const routeKey = normalizeRouteForPreload(path);
  if (preloadedRoutes.has(routeKey)) return;
  const importer = routeImportMap[routeKey];
  if (importer) {
    preloadedRoutes.add(routeKey);
    importer().catch(() => {
      // If preload fails, allow retry next time
      preloadedRoutes.delete(routeKey);
    });
  }
}

function normalizeRouteForPreload(path: string) {
  const cleanPath = path.split('#')[0].split('?')[0] || '/';
  return cleanPath !== '/' && cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath;
}

/** Returns true if the user is on a slow/save-data connection. */
function shouldSkipBackgroundPreload(): boolean {
  if (typeof navigator === "undefined") return true;
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  if (conn.effectiveType === "2g" || conn.effectiveType === "slow-2g") return true;
  return false;
}

/**
 * Sequentially preloads route chunks during browser idle time so that
 * navigation to a not-yet-visited page feels instant. Staggered to avoid
 * saturating the network. No-op on slow / Save-Data connections.
 */
function preloadCoreRoutes() {
  if (shouldSkipBackgroundPreload()) return;

  const queue = CORE_PRELOAD_ORDER.filter((p) => !preloadedRoutes.has(p));
  if (queue.length === 0) return;

  const ric: (cb: () => void, opts?: { timeout: number }) => number =
    (typeof window !== "undefined" &&
      (window as unknown as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback) ||
    ((cb: () => void) => window.setTimeout(cb, 1500) as unknown as number);

  let i = 0;
  const tick = () => {
    if (i >= queue.length) return;
    const path = queue[i++];
    preloadRoute(path);
    // Stagger the next chunk so we don't fight critical requests.
    window.setTimeout(() => ric(tick, { timeout: 2000 }), 150);
  };

  ric(tick, { timeout: 2000 });
}

// Lazy load all pages for better initial load performance
const Landing = lazyWithRetry(() => import("./pages/Landing"));
const Legal = lazyWithRetry(() => import("./pages/Legal"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Status = lazyWithRetry(() => import("./pages/Status"));
const About = lazyWithRetry(() => import("./pages/About"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const ChaosInbox = lazyWithRetry(() => import("./pages/ChaosInbox"));
const Expenses = lazyWithRetry(() => import("./pages/Expenses"));
const Clients = lazyWithRetry(() => import("./pages/Clients"));
const Projects = lazyWithRetry(() => import("./pages/Projects"));
const Contracts = lazyWithRetry(() => import("./pages/Contracts"));
const Mileage = lazyWithRetry(() => import("./pages/Mileage"));
const Reconciliation = lazyWithRetry(() => import("./pages/Reconciliation"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const BusinessProfile = lazyWithRetry(() => import("./pages/BusinessProfile"));
const Tags = lazyWithRetry(() => import("./pages/Tags"));
const Income = lazyWithRetry(() => import("./pages/Income"));
const Install = lazyWithRetry(() => import("./pages/Install"));
const MobileCapture = lazyWithRetry(() => import("./pages/MobileCapture"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"));
const NetWorth = lazyWithRetry(() => import("./pages/NetWorth"));
const Banking = lazyWithRetry(() => import("./pages/Banking"));
const BudgetPage = lazyWithRetry(() => import("./pages/Budget"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));
const Mentorship = lazyWithRetry(() => import("./pages/Mentorship"));
const TaxCalendar = lazyWithRetry(() => import("./pages/TaxCalendar"));
const BetaWelcome = lazyWithRetry(() => import("./pages/BetaWelcome"));
const BetaFeatures = lazyWithRetry(() => import("./pages/BetaFeatures"));
const BetaCodesAdmin = lazyWithRetry(() => import("./pages/admin/BetaCodes"));
const BetaDashboardAdmin = lazyWithRetry(() => import("./pages/admin/BetaDashboard"));
const LeadsManagementAdmin = lazyWithRetry(() => import("./pages/admin/LeadsManagement"));
const EcosystemLabAdmin = lazyWithRetry(() => import("./pages/admin/EcosystemLab"));
const AdminCRM = lazyWithRetry(() => import("./pages/admin/AdminCRM"));
const DemoStudio = lazyWithRetry(() => import("./pages/admin/DemoStudio"));
import { RecModeFab } from "@/components/RecModeFab";
const FinancialQuiz = lazyWithRetry(() => import("./pages/FinancialQuiz"));
const BetaFeedback = lazyWithRetry(() => import("./pages/BetaFeedback"));
const BetaGuide = lazyWithRetry(() => import("./pages/BetaGuide"));
const FinancialAdventure = lazyWithRetry(() => import("./pages/FinancialAdventure"));
const Trash = lazyWithRetry(() => import("./pages/Trash"));
const Bills = lazyWithRetry(() => import("./pages/Bills"));
const AnalyticsPage = lazyWithRetry(() => import("./pages/Analytics"));
const TaxOptimizerPage = lazyWithRetry(() => import("./pages/TaxOptimizer"));
const InvestmentsPage = lazyWithRetry(() => import("./pages/Investments"));
const SubscriptionsPage = lazyWithRetry(() => import("./pages/Subscriptions"));
const DataHealth = lazyWithRetry(() => import("./pages/DataHealth"));
const FilesPage = lazyWithRetry(() => import("./pages/Files"));
const UserGuide = lazyWithRetry(() => import("./pages/UserGuide"));
const TaxReportFlow = lazyWithRetry(() => import("./pages/TaxReportFlow"));
const Reports = lazyWithRetry(() => import("./pages/Reports"));
const CookieConsent = lazyWithRetry(() =>
  import("./components/CookieConsent").then((m) => ({ default: m.CookieConsent }))
);
const SessionTimeoutWarning = lazyWithRetry(() =>
  import("./components/SessionTimeoutWarning").then((m) => ({ default: m.SessionTimeoutWarning }))
);

// Page loading fallback - minimal skeleton
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="space-y-4 w-full max-w-md px-4">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

// Critical page error fallback - allows retry
const PageErrorFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-4 p-8">
      <p className="text-lg text-muted-foreground">Error cargando la página</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
      >
        Reintentar
      </button>
    </div>
  </div>
);

// Error boundary for lazy components with visual feedback
class LazyErrorBoundary extends Component<
  { children: ReactNode; name?: string; fallback?: ReactNode },
  { hasError: boolean; error?: unknown }
> {
  state = { hasError: false, error: undefined as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown) {
    console.warn(
      `[LazyErrorBoundary] Failed to load: ${this.props.name ?? "lazy component"}`,
      error
    );
  }

  render() {
    if (this.state.hasError) {
      // For critical components like pages, show a retry option instead of blank
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // For non-critical components (like ChatAssistant), return null
      return null;
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching: data stays fresh longer → fewer refetches on navigation
      staleTime: 1000 * 60 * 5, // 5 minutes (was 1 min)
      gcTime: 1000 * 60 * 15, // 15 minutes (was 5 min)
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch if data is fresh
      retry: 1,
    },
  },
});

// Component to initialize mission listeners
function MissionListenerInitializer() {
  useLoginMissionListener();
  return null;
}

function GlobalBackgroundServices() {
  useGlobalReminders();
  useAutoReminders();
  return null;
}

/**
 * Mounts after auth providers and triggers background preloading of route
 * chunks during idle time. Eliminates the multi-second wait when a user
 * navigates to a not-yet-visited page (the chunk is already in memory).
 */
function IdlePreloader() {
  useEffect(() => {
    // Wait a tick so the initial render is not delayed.
    const t = window.setTimeout(() => preloadCoreRoutes(), 2500);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

// Simple Suspense wrapper — Settings exit is handled by useSafeNavigation
// using controlled navigation to bypass React Router v7's transition blocking.

/**
 * Normaliza paths para evitar falsos mismatches ("/a/" vs "/a").
 */
function normalizePath(path: string) {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Devuelve la ruta activa del navegador compatible con BrowserRouter y HashRouter.
 * - BrowserRouter: pathname
 * - HashRouter: hash con formato #/ruta
 */
function getBrowserRoutePath() {
  if (typeof window === "undefined") return "/";

  const { hash, pathname } = window.location;
  if (hash.startsWith("#/")) {
    const hashPath = hash.slice(1).split("?")[0] || "/";
    return normalizePath(hashPath.startsWith("/") ? hashPath : `/${hashPath}`);
  }

  return normalizePath(pathname || "/");
}

/**
 * Heartbeat: writes the *actually rendered* React Router path to a global variable.
 * This is the source of truth for detecting URL-vs-render desynchronization.
 */
function RouteRenderHeartbeat() {
  const location = useLocation();

  useEffect(() => {
    window.__APP_RENDERED_PATH__ = normalizePath(location.pathname);
  }, [location.pathname]);

  return null;
}

/**
 * Guard conservador anti-desync URL/UI.
 * - Compatible con BrowserRouter y HashRouter
 * - Sin polling continuo (solo eventos + cambios de ruta)
 * - Cooldown para evitar loops
 */
/**
 * Hardened guard: covers popstate, hashchange, visibilitychange,
 * AND exposes a global channel for useSafeNavigation to request checks.
 * Conservative: cooldown per route, max 1 repair per navigation attempt.
 */
function RouteSyncGuard() {
  const navigate = useNavigate();
  const lastRepairRef = useRef(0);
  const lastRepairedPathRef = useRef("");

  useEffect(() => {
    const checkSync = () => {
      const browserPath = getBrowserRoutePath();
      const renderedPath = normalizePath(window.__APP_RENDERED_PATH__ ?? "/");
      const now = Date.now();

      if (browserPath === renderedPath) return;
      // Cooldown: don't repair same path within 3s
      if (now - lastRepairRef.current < 3000 && lastRepairedPathRef.current === browserPath) return;

      lastRepairRef.current = now;
      lastRepairedPathRef.current = browserPath;
      // Buffer for lazy routes to mount before deciding
      window.setTimeout(() => {
        const currentRendered = normalizePath(window.__APP_RENDERED_PATH__ ?? "/");
        const currentBrowser = getBrowserRoutePath();
        if (currentBrowser !== currentRendered) {
          navigate(currentBrowser, { replace: true });
        }
      }, 400);
    };

    const handlePopstate = () => checkSync();
    const handleHashchange = () => checkSync();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Slight extra delay when returning to tab
        window.setTimeout(checkSync, 300);
      }
    };

    // Global channel: useSafeNavigation dispatches this after navigate()
    const handleNavRequest = () => {
      // Give lazy route time to mount, then verify
      window.setTimeout(checkSync, 500);
    };

    window.addEventListener("popstate", handlePopstate);
    window.addEventListener("hashchange", handleHashchange);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("__route_sync_check__", handleNavRequest);

    return () => {
      window.removeEventListener("popstate", handlePopstate);
      window.removeEventListener("hashchange", handleHashchange);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("__route_sync_check__", handleNavRequest);
    };
  }, [navigate]);

  return null;
}

// Router selection:
// - Prefer clean URLs via BrowserRouter
// - If the host redirected a deep-link to hash-based fallback (see public/404.html), use HashRouter.
const shouldUseHashRouter =
  typeof window !== "undefined" && window.location.hash.startsWith("#/");
const Router = shouldUseHashRouter ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <LanguageProvider>
            <AuthProvider>
              <UndoRedoProvider>
              <EntityProvider>
                <HighlightProvider>
                  <GamificationProvider>
                  <MissionListenerInitializer />
                  <GlobalBackgroundServices />
                  <IdlePreloader />
                  <RouteRenderHeartbeat />
                  <RouteSyncGuard />
                  <LazyErrorBoundary name="Routes" fallback={<PageErrorFallback />}>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<AuthenticatedRedirect><Landing /></AuthenticatedRedirect>} />
                        <Route path="/quiz" element={<FinancialQuiz />} />
                        <Route path="/landing" element={<Navigate to="/" replace />} />
                        <Route path="/legal" element={<Legal />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/status" element={<Status />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                        <Route path="/beta-welcome" element={<ProtectedRoute><BetaWelcome /></ProtectedRoute>} />
                        <Route path="/beta-features" element={<ProtectedRoute><BetaFeatures /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/chaos" element={<ProtectedRoute><ChaosInbox /></ProtectedRoute>} />
                        {/* Backwards-compatible alias (used by assistant + older deep links) */}
                        <Route path="/chaos-inbox" element={<ProtectedRoute><ChaosInbox /></ProtectedRoute>} />
                        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                        <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
                        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
                        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                        <Route path="/tags" element={<ProtectedRoute><Tags /></ProtectedRoute>} />
                        <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
                        <Route path="/mileage" element={<ProtectedRoute><Mileage /></ProtectedRoute>} />
                        <Route path="/reconciliation" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/business-profile" element={<ProtectedRoute><BusinessProfile /></ProtectedRoute>} />
                        <Route path="/net-worth" element={<ProtectedRoute><NetWorth /></ProtectedRoute>} />
                        <Route path="/banking" element={<ProtectedRoute><Banking /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        <Route path="/mentorship" element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />
                        <Route path="/tax-calendar" element={<ProtectedRoute><TaxCalendar /></ProtectedRoute>} />
                        <Route path="/install" element={<Install />} />
                        <Route path="/capture" element={<ProtectedRoute><MobileCapture /></ProtectedRoute>} />
                        {/* Backwards-compatible alias (some UI + assistant maps use this) */}
                        <Route path="/mobile-capture" element={<ProtectedRoute><MobileCapture /></ProtectedRoute>} />
                        <Route path="/admin/beta-codes" element={<AdminRoute><BetaCodesAdmin /></AdminRoute>} />
                        <Route path="/admin/beta-dashboard" element={<AdminRoute><BetaDashboardAdmin /></AdminRoute>} />
                        <Route path="/admin/leads" element={<AdminRoute><LeadsManagementAdmin /></AdminRoute>} />
                        <Route path="/admin/ecosystem-lab" element={<AdminRoute><EcosystemLabAdmin /></AdminRoute>} />
                        <Route path="/admin/crm" element={<AdminRoute><AdminCRM /></AdminRoute>} />
                        <Route path="/admin/demo-studio" element={<AdminRoute><DemoStudio /></AdminRoute>} />
                        <Route path="/beta-feedback" element={<ProtectedRoute><BetaFeedback /></ProtectedRoute>} />
                        <Route path="/beta-guide" element={<ProtectedRoute><BetaGuide /></ProtectedRoute>} />
                        <Route path="/adventure" element={<ProtectedRoute><FinancialAdventure /></ProtectedRoute>} />
                        <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
                        <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
                        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                        <Route path="/tax-optimizer" element={<ProtectedRoute><TaxOptimizerPage /></ProtectedRoute>} />
                        <Route path="/investments" element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
                        <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
                        <Route path="/trash" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
                        <Route path="/data-health" element={<ProtectedRoute><DataHealth /></ProtectedRoute>} />
                        <Route path="/files" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
                        <Route path="/user-guide" element={<ProtectedRoute><UserGuide /></ProtectedRoute>} />
                        <Route path="/tax-report-flow" element={<ProtectedRoute><TaxReportFlow /></ProtectedRoute>} />
                        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                        <Route path="/unsubscribe" element={<Unsubscribe />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </LazyErrorBoundary>
                  
                  <Suspense fallback={null}>
                    <CookieConsent />
                  </Suspense>
                  <Suspense fallback={null}>
                    <SessionTimeoutWarning />
                  </Suspense>
                  <RecModeFab />
                  </GamificationProvider>
                </HighlightProvider>
              </EntityProvider>
              </UndoRedoProvider>
            </AuthProvider>
          </LanguageProvider>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
