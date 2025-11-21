import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ChaosInbox from "./pages/ChaosInbox";
import Expenses from "./pages/Expenses";
import Clients from "./pages/Clients";
import Contracts from "./pages/Contracts";
import Mileage from "./pages/Mileage";
import Reconciliation from "./pages/Reconciliation";
import Settings from "./pages/Settings";
import Tags from "./pages/Tags";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chaos" element={<ChaosInbox />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/mileage" element={<Mileage />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
