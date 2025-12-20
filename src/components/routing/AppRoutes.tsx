/**
 * AppRoutes - Componente que renderiza todas las rutas
 * Usa la configuración centralizada de routes.ts
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  allRoutes, 
  notFoundRoute, 
  redirects,
  type RouteConfig 
} from '@/config/routes';
import { PageStreamingSkeleton, StreamingBoundary } from '@/components/performance/StreamingBoundary';
import { PublicLayout, DashboardLayout, MinimalLayout } from '@/layouts';

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

        {/* All configured routes */}
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
