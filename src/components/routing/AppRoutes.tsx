/**
 * AppRoutes - Componente que renderiza todas las rutas
 * Usa la configuración centralizada de routes.ts
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { 
  allRoutes, 
  notFoundRoute, 
  redirects,
  type RouteConfig 
} from '@/config/routes';
import { PageStreamingSkeleton, StreamingBoundary } from '@/components/performance/StreamingBoundary';
import { PublicLayout, DashboardLayout, MinimalLayout } from '@/layouts';
import { ModuleStudioProvider } from '@/contexts/ModuleStudioContext';
import ModuleStudioLayout from '@/layouts/ModuleStudioLayout';

// Lazy load Module Studio pages
const ModuleStudioHubPage = lazy(() => import('@/pages/admin/module-studio/ModuleStudioHubPage'));
const ModuleDevelopmentPage = lazy(() => import('@/pages/admin/module-studio/ModuleDevelopmentPage'));
const ModuleOperationsPage = lazy(() => import('@/pages/admin/module-studio/ModuleOperationsPage'));
const ModuleAnalyticsPage = lazy(() => import('@/pages/admin/module-studio/ModuleAnalyticsPage'));
const ModuleGovernancePage = lazy(() => import('@/pages/admin/module-studio/ModuleGovernancePage'));
const ModuleEcosystemPage = lazy(() => import('@/pages/admin/module-studio/ModuleEcosystemPage'));

// Module Studio paths to exclude from regular rendering
const moduleStudioPaths = [
  '/obelixia-admin/module-studio',
  '/obelixia-admin/module-studio/development',
  '/obelixia-admin/module-studio/operations',
  '/obelixia-admin/module-studio/analytics',
  '/obelixia-admin/module-studio/governance',
  '/obelixia-admin/module-studio/ecosystem',
];

/**
 * Envuelve un componente con su layout correspondiente
 */
function withLayout(RouteComponent: React.LazyExoticComponent<React.ComponentType<any>>, config: RouteConfig) {
  const WrappedComponent = () => {
    const Component = <RouteComponent />;

    switch (config.layout) {
      case 'public':
        // Para páginas públicas que no son la landing principal
        return (
          <PublicLayout navbarPadding={true}>
            {Component}
          </PublicLayout>
        );
      case 'dashboard':
        return (
          <DashboardLayout title={config.meta?.title}>
            {Component}
          </DashboardLayout>
        );
      case 'minimal':
        return (
          <MinimalLayout background="gradient" centerContent>
            {Component}
          </MinimalLayout>
        );
      case 'none':
      default:
        // Sin layout wrapper - el componente maneja su propia estructura
        return Component;
    }
  };

  return WrappedComponent;
}

/**
 * Renderiza una ruta individual con streaming boundary
 */
function renderRoute(config: RouteConfig) {
  // Skip module studio routes - they're handled separately with nested routing
  if (moduleStudioPaths.includes(config.path)) {
    return null;
  }

  const LayoutWrappedComponent = withLayout(config.component, config);
  
  return (
    <Route
      key={config.path}
      path={config.path}
      element={
        <StreamingBoundary priority={config.priority} delay={config.delay}>
          <LayoutWrappedComponent />
        </StreamingBoundary>
      }
    />
  );
}

/**
 * Module Studio Layout Wrapper con Provider
 */
function ModuleStudioWrapper() {
  return (
    <ModuleStudioProvider>
      <ModuleStudioLayout>
        <Outlet />
      </ModuleStudioLayout>
    </ModuleStudioProvider>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageStreamingSkeleton />}>
      <Routes>
        {/* Redirects */}
        {redirects.map((redirect) => (
          <Route
            key={redirect.from}
            path={redirect.from}
            element={<Navigate to={redirect.to} replace />}
          />
        ))}

        {/* Module Studio routes with shared provider */}
        <Route path="/obelixia-admin/module-studio" element={<ModuleStudioWrapper />}>
          <Route index element={<ModuleStudioHubPage />} />
          <Route path="development" element={<ModuleDevelopmentPage />} />
          <Route path="operations" element={<ModuleOperationsPage />} />
          <Route path="analytics" element={<ModuleAnalyticsPage />} />
          <Route path="governance" element={<ModuleGovernancePage />} />
          <Route path="ecosystem" element={<ModuleEcosystemPage />} />
        </Route>

        {/* All other configured routes */}
        {allRoutes.map(renderRoute)}

        {/* 404 */}
        <Route
          path={notFoundRoute.path}
          element={<notFoundRoute.component />}
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
