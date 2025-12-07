import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <PresenceProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/map" element={<Navigate to="/admin?section=map" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </PresenceProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
