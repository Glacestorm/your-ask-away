import { Suspense, lazy, startTransition } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { CartProvider } from "@/contexts/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageStreamingSkeleton, StreamingBoundary } from "@/components/performance/StreamingBoundary";
import { MFAEnforcementDialog } from "@/components/security/MFAEnforcementDialog";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { DemoTour } from "@/components/demo/DemoTour";
import CookieConsent from "@/components/cookies/CookieConsent";
import { ObelixiaChatbot } from "@/components/chat/ObelixiaChatbot";
import { FloatingLanguageSelector } from "@/components/FloatingLanguageSelector";
import { AppRoutes } from "@/components/routing";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Preload helpers for critical routes
const preloadRoute = (importFn: () => Promise<unknown>) => {
  startTransition(() => {
    importFn();
  });
};

export const routePreloaders = {
  home: () => preloadRoute(() => import("./pages/Home")),
  dashboard: () => preloadRoute(() => import("./pages/Dashboard")),
  admin: () => preloadRoute(() => import("./pages/Admin")),
  profile: () => preloadRoute(() => import("./pages/Profile")),
  store: () => preloadRoute(() => import("./pages/store/StoreLanding")),
  chat: () => preloadRoute(() => import("./pages/Chat")),
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DemoProvider>
                <CartProvider>
                  <PresenceProvider>
                    <TooltipProvider>
                      {/* Global UI Components */}
                      <MFAEnforcementDialog />
                      <Toaster />
                      <Sonner />
                      <ObelixiaChatbot />
                      <FloatingLanguageSelector />
                      <DemoBanner />
                      <DemoTour />
                      <CookieConsent />
                      
                      {/* Routes */}
                      <StreamingBoundary priority="high" fallback={<PageStreamingSkeleton />}>
                        <AppRoutes />
                      </StreamingBoundary>
                    </TooltipProvider>
                  </PresenceProvider>
                </CartProvider>
              </DemoProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
