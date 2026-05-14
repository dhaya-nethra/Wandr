import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import NewTrip from "./pages/NewTrip";
import TripHistory from "./pages/TripHistory";
import Profile from "./pages/Profile";
import ActiveTrip from "./pages/ActiveTrip";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import Signup from "./pages/Signup";
import { AdminAuthProvider, useAdminAuth } from "./hooks/useAdminAuth";
import { AdminSecretTrigger } from "./components/AdminSecretTrigger";
import { TripsProvider } from "./context/TripsContext";

const queryClient = new QueryClient();

/** Redirects to /admin/login if no valid admin session exists */
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminAuthProvider>
      <TripsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/Wandr/">
            <Routes>
              {/* ── Participant routes ── */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/new-trip" element={<NewTrip />} />
              <Route path="/active-trip" element={<ActiveTrip />} />
              <Route path="/trips" element={<TripHistory />} />
              <Route path="/profile" element={<Profile />} />

              {/* ── Government admin / researcher portal ── */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedAdminRoute><AdminAnalytics /></ProtectedAdminRoute>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Secret keyword trigger — type "natpac" anywhere to reveal admin portal link */}
            <AdminSecretTrigger />
          </BrowserRouter>
        </TooltipProvider>
      </TripsProvider>
    </AdminAuthProvider>
  </QueryClientProvider>
);

export default App;
