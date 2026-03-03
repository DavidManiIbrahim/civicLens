import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import HearingPage from "./pages/HearingPage";
import SentimentDashboard from "./pages/SentimentDashboard";
import PeoplesView from "./pages/PeoplesView";
import InsightsPage from "./pages/InsightsPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    },
  },
});

import ProtectedRoute from "./components/ProtectedRoute";

// suppress noisy React Router future-flag warnings in console
const originalWarn = console.warn.bind(console);
console.warn = (...args: any[]) => {
  const msg = args[0] && args[0].toString();
  if (msg && msg.includes("React Router Future Flag Warning")) {
    return; // ignore
  }
  originalWarn(...args);
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hearing" element={<HearingPage />} />
            <Route path="/sentiment" element={<ProtectedRoute><SentimentDashboard /></ProtectedRoute>} />
            <Route path="/peoples-view" element={<ProtectedRoute><PeoplesView /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
