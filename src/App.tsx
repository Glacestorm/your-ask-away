import { Suspense, lazy, useTransition, startTransition } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { CartProvider } from "@/contexts/CartContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageStreamingSkeleton, StreamingBoundary } from "@/components/performance/StreamingBoundary";
import { MFAEnforcementDialog } from "@/components/security/MFAEnforcementDialog";
import { HelpButton } from "@/components/help/HelpButton";
import { FloatingChatButton } from "@/components/chat/FloatingChatButton";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { DemoTour } from "@/components/demo/DemoTour";

// Lazy load pages with React 19 preload hints for better streaming SSR
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Map3D = lazy(() => import("./pages/Map3D"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Store pages
const StoreLanding = lazy(() => import("./pages/store/StoreLanding"));
const StoreModules = lazy(() => import("./pages/store/StoreModules"));
const StoreDeployment = lazy(() => import("./pages/store/StoreDeployment"));
const StoreCheckout = lazy(() => import("./pages/store/StoreCheckout"));
const CheckoutSuccess = lazy(() => import("./pages/store/CheckoutSuccess"));

// Preload critical routes on hover/focus for faster navigation
const preloadRoute = (importFn: () => Promise<unknown>) => {
  startTransition(() => {
    importFn();
  });
};

// Route preloaders for progressive enhancement
export const routePreloaders = {
  home: () => preloadRoute(() => import("./pages/Home")),
  dashboard: () => preloadRoute(() => import("./pages/Dashboard")),
  admin: () => preloadRoute(() => import("./pages/Admin")),
  profile: () => preloadRoute(() => import("./pages/Profile")),
};

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <DemoProvider>
              <CartProvider>
                <PresenceProvider>
                  <TooltipProvider>
                    <MFAEnforcementDialog />
                    <Toaster />
                    <Sonner />
                    <HelpButton />
                    <FloatingChatButton />
                    <DemoBanner />
                    <DemoTour />
                    {/* React 19 Streaming SSR with progressive Suspense boundaries */}
                    <StreamingBoundary priority="high" fallback={<PageStreamingSkeleton />}>
                      <Routes>
                        <Route path="/" element={<Navigate to="/store" replace />} />
                        <Route path="/auth" element={
                          <StreamingBoundary priority="high">
                            <Auth />
                          </StreamingBoundary>
                        } />
                        <Route path="/home" element={
                          <StreamingBoundary priority="high">
                            <Home />
                          </StreamingBoundary>
                        } />
                        <Route path="/map" element={<Navigate to="/admin?section=map" replace />} />
                        <Route path="/dashboard" element={
                          <StreamingBoundary priority="medium" delay={50}>
                            <Dashboard />
                          </StreamingBoundary>
                        } />
                        <Route path="/admin" element={
                          <StreamingBoundary priority="medium" delay={50}>
                            <Admin />
                          </StreamingBoundary>
                        } />
                        <Route path="/profile" element={
                          <StreamingBoundary priority="low" delay={100}>
                            <Profile />
                          </StreamingBoundary>
                        } />
                        <Route path="/map-3d" element={
                          <StreamingBoundary priority="medium">
                            <Map3D />
                          </StreamingBoundary>
                        } />
                        {/* Store routes */}
                        <Route path="/store" element={
                          <StreamingBoundary priority="high">
                            <StoreLanding />
                          </StreamingBoundary>
                        } />
                        <Route path="/store/modules" element={
                          <StreamingBoundary priority="high">
                            <StoreModules />
                          </StreamingBoundary>
                        } />
                        <Route path="/store/deployment" element={
                          <StreamingBoundary priority="high">
                            <StoreDeployment />
                          </StreamingBoundary>
                        } />
                        <Route path="/store/checkout" element={
                          <StreamingBoundary priority="high">
                            <StoreCheckout />
                          </StreamingBoundary>
                        } />
                        <Route path="/store/success" element={
                          <StreamingBoundary priority="high">
                            <CheckoutSuccess />
                          </StreamingBoundary>
                        } />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </StreamingBoundary>
                  </TooltipProvider>
                </PresenceProvider>
              </CartProvider>
            </DemoProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
