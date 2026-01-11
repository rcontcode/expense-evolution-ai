import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { EntityProvider } from "@/contexts/EntityContext";
import { HighlightProvider } from "@/contexts/HighlightContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLoginMissionListener } from "@/hooks/data/useMissions";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load all pages for better initial load performance
const Landing = lazy(() => import("./pages/Landing"));
const Legal = lazy(() => import("./pages/Legal"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChaosInbox = lazy(() => import("./pages/ChaosInbox"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Clients = lazy(() => import("./pages/Clients"));
const Projects = lazy(() => import("./pages/Projects"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Mileage = lazy(() => import("./pages/Mileage"));
const Reconciliation = lazy(() => import("./pages/Reconciliation"));
const Settings = lazy(() => import("./pages/Settings"));
const BusinessProfile = lazy(() => import("./pages/BusinessProfile"));
const Tags = lazy(() => import("./pages/Tags"));
const Income = lazy(() => import("./pages/Income"));
const Install = lazy(() => import("./pages/Install"));
const MobileCapture = lazy(() => import("./pages/MobileCapture"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NetWorth = lazy(() => import("./pages/NetWorth"));
const Banking = lazy(() => import("./pages/Banking"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Mentorship = lazy(() => import("./pages/Mentorship"));
const TaxCalendar = lazy(() => import("./pages/TaxCalendar"));
const BetaWelcome = lazy(() => import("./pages/BetaWelcome"));
const BetaFeatures = lazy(() => import("./pages/BetaFeatures"));
const BetaCodesAdmin = lazy(() => import("./pages/admin/BetaCodes"));

// Lazy load heavy global components
const ChatAssistant = lazy(() => import("./components/chat/ChatAssistant").then(m => ({ default: m.ChatAssistant })));
const OnboardingTutorial = lazy(() => import("./components/guidance/OnboardingTutorial").then(m => ({ default: m.OnboardingTutorial })));
const CookieConsent = lazy(() => import("./components/CookieConsent").then(m => ({ default: m.CookieConsent })));
const FeedbackButton = lazy(() => import("./components/FeedbackButton").then(m => ({ default: m.FeedbackButton })));

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <EntityProvider>
                <HighlightProvider>
                  <MissionListenerInitializer />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Landing />} />
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
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  {/* Lazy load global components with null fallback (non-blocking) */}
                  <Suspense fallback={null}>
                    <ChatAssistant />
                  </Suspense>
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
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
