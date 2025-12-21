import { Suspense, lazy, startTransition, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { AppRoutes } from "@/components/routing";

// Lazy load non-critical components for better initial load and reduced bundle size
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const FloatingLanguageSelector = lazy(() => import("@/components/FloatingLanguageSelector").then(m => ({ default: m.FloatingLanguageSelector })));
const DemoBanner = lazy(() => import("@/components/demo/DemoBanner").then(m => ({ default: m.DemoBanner })));
const DemoTour = lazy(() => import("@/components/demo/DemoTour").then(m => ({ default: m.DemoTour })));
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

// Deferred components that load after initial render using requestIdleCallback
const DeferredComponents = () => {
  const [showDeferred, setShowDeferred] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to mount widgets in background, with startTransition to avoid blocking
    const loadDeferredWidgets = () => {
      startTransition(() => {
        setShowDeferred(true);
      });
    };

    const timer = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback(loadDeferredWidgets, { timeout: 2000 })
      : setTimeout(loadDeferredWidgets, 1000);
    
    return () => {
      if (typeof requestIdleCallback !== 'undefined' && typeof timer === 'number') {
        cancelIdleCallback(timer);
      } else {
        clearTimeout(timer as number);
      }
    };
  }, []);

  if (!showDeferred) return null;

  return (
    <Suspense fallback={null}>
      <Toaster />
      <Sonner />
      <FloatingLanguageSelector />
      <DemoBanner />
      <DemoTour />
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
                      {/* Critical UI Components - MFA enforcement only */}
                      <MFAEnforcementDialog />
                      
                      {/* Routes */}
                      <StreamingBoundary priority="high" fallback={<PageStreamingSkeleton />}>
                        <AppRoutes />
                      </StreamingBoundary>
                      
                      {/* Deferred non-critical components - loaded in background */}
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
