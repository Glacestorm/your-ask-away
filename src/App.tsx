import { Suspense, lazy, startTransition, useEffect, useState } from "react";
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
import { FloatingLanguageSelector } from "@/components/FloatingLanguageSelector";
import { AppRoutes } from "@/components/routing";

// Lazy load non-critical components for better initial load
const CookieConsent = lazy(() => import("@/components/cookies/CookieConsent"));
const ObelixiaChatbot = lazy(() => import("@/components/chat/ObelixiaChatbot").then(m => ({ default: m.ObelixiaChatbot })));

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

// Deferred components that load after initial render
const DeferredComponents = () => {
  const [showDeferred, setShowDeferred] = useState(false);

  useEffect(() => {
    // Load non-critical components after a short delay
    const timer = requestIdleCallback 
      ? requestIdleCallback(() => setShowDeferred(true), { timeout: 2000 })
      : setTimeout(() => setShowDeferred(true), 1000);
    
    return () => {
      if (requestIdleCallback && typeof timer === 'number') {
        cancelIdleCallback(timer);
      } else {
        clearTimeout(timer as number);
      }
    };
  }, []);

  if (!showDeferred) return null;

  return (
    <Suspense fallback={null}>
      <ObelixiaChatbot />
      <CookieConsent />
    </Suspense>
  );
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
                      {/* Critical UI Components - load immediately */}
                      <MFAEnforcementDialog />
                      <Toaster />
                      <Sonner />
                      <FloatingLanguageSelector />
                      <DemoBanner />
                      <DemoTour />
                      
                      {/* Routes */}
                      <StreamingBoundary priority="high" fallback={<PageStreamingSkeleton />}>
                        <AppRoutes />
                      </StreamingBoundary>
                      
                      {/* Deferred non-critical components */}
                      <DeferredComponents />
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
