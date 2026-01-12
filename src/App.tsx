import { lazy, Suspense, Component, type ReactNode, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EntityProvider } from "@/contexts/EntityContext";
import { HighlightProvider } from "@/contexts/HighlightContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLoginMissionListener } from "@/hooks/data/useMissions";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loader with retry on failure (handles transient network/build errors)
function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
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

// Lazy load all pages for better initial load performance
const Landing = lazyWithRetry(() => import("./pages/Landing"));
const Legal = lazyWithRetry(() => import("./pages/Legal"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
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
const NetWorth = lazyWithRetry(() => import("./pages/NetWorth"));
const Banking = lazyWithRetry(() => import("./pages/Banking"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));
const Mentorship = lazyWithRetry(() => import("./pages/Mentorship"));
const TaxCalendar = lazyWithRetry(() => import("./pages/TaxCalendar"));
const BetaWelcome = lazyWithRetry(() => import("./pages/BetaWelcome"));
const BetaFeatures = lazyWithRetry(() => import("./pages/BetaFeatures"));
const BetaCodesAdmin = lazyWithRetry(() => import("./pages/admin/BetaCodes"));
const BetaDashboardAdmin = lazyWithRetry(() => import("./pages/admin/BetaDashboard"));
const FinancialQuiz = lazyWithRetry(() => import("./pages/FinancialQuiz"));
const BetaFeedback = lazyWithRetry(() => import("./pages/BetaFeedback"));

// Lazy load heavy global components with retry
const ChatAssistant = lazyWithRetry(() =>
  import("./components/chat/ChatAssistant").then((m) => ({ default: m.ChatAssistant }))
);
const OnboardingTutorial = lazyWithRetry(() =>
  import("./components/guidance/OnboardingTutorial").then((m) => ({ default: m.OnboardingTutorial }))
);
const CookieConsent = lazyWithRetry(() =>
  import("./components/CookieConsent").then((m) => ({ default: m.CookieConsent }))
);
const FeedbackButton = lazyWithRetry(() =>
  import("./components/FeedbackButton").then((m) => ({ default: m.FeedbackButton }))
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
      // Reduce unnecessary refetches
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Component to initialize mission listeners
function MissionListenerInitializer() {
  useLoginMissionListener();
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
              <EntityProvider>
                <HighlightProvider>
                  <MissionListenerInitializer />
                  <LazyErrorBoundary name="Routes" fallback={<PageErrorFallback />}>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<FinancialQuiz />} />
                        <Route path="/quiz" element={<FinancialQuiz />} />
                        <Route path="/landing" element={<Landing />} />
                        <Route path="/legal" element={<Legal />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                        <Route path="/beta-welcome" element={<ProtectedRoute><BetaWelcome /></ProtectedRoute>} />
                        <Route path="/beta-features" element={<ProtectedRoute><BetaFeatures /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/chaos" element={<ProtectedRoute><ChaosInbox /></ProtectedRoute>} />
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
                        <Route path="/admin/beta-codes" element={<ProtectedRoute><BetaCodesAdmin /></ProtectedRoute>} />
                        <Route path="/admin/beta-dashboard" element={<ProtectedRoute><BetaDashboardAdmin /></ProtectedRoute>} />
                        <Route path="/beta-feedback" element={<ProtectedRoute><BetaFeedback /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </LazyErrorBoundary>
                  {/* Lazy load global components with null fallback (non-blocking) */}
                  <LazyErrorBoundary name="ChatAssistant">
                    <Suspense fallback={null}>
                      <ChatAssistant />
                    </Suspense>
                  </LazyErrorBoundary>
                  <Suspense fallback={null}>
                    <OnboardingTutorial />
                  </Suspense>
                  <Suspense fallback={null}>
                    <CookieConsent />
                  </Suspense>
                  <Suspense fallback={null}>
                    <FeedbackButton />
                  </Suspense>
                </HighlightProvider>
              </EntityProvider>
            </AuthProvider>
          </LanguageProvider>
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
