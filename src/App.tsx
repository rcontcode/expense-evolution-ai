import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLoginMissionListener } from "@/hooks/data/useMissions";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ChaosInbox from "./pages/ChaosInbox";
import Expenses from "./pages/Expenses";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Contracts from "./pages/Contracts";
import Mileage from "./pages/Mileage";
import Reconciliation from "./pages/Reconciliation";
import Settings from "./pages/Settings";
import BusinessProfile from "./pages/BusinessProfile";
import Tags from "./pages/Tags";
import Income from "./pages/Income";
import Install from "./pages/Install";
import MobileCapture from "./pages/MobileCapture";
import NotFound from "./pages/NotFound";
import NetWorth from "./pages/NetWorth";

const queryClient = new QueryClient();

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
              <MissionListenerInitializer />
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
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
                <Route path="/install" element={<Install />} />
                <Route path="/capture" element={<ProtectedRoute><MobileCapture /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
