/**
 * useRoutePreload - Hook para precargar rutas de forma eficiente
 * Mejora la velocidad de navegación precargando componentes al hacer hover
 */

import { useCallback, useRef } from 'react';

// Cache de rutas ya precargadas para evitar duplicados
const preloadedRoutes = new Set<string>();

// Mapeo de rutas a sus imports dinámicos
const routeImports: Record<string, () => Promise<unknown>> = {
  // Academia
  '/academia': () => import('@/pages/academia/AcademiaLanding'),
  '/academia/cursos': () => import('@/pages/academia/CourseCatalog'),
  
  // Sectores
  '/sectores': () => import('@/pages/sectors/SectorLanding'),
  '/sectores/banca': () => import('@/pages/sectors/BancaLanding'),
  '/sectores/seguros': () => import('@/pages/sectors/SegurosLanding'),
  '/sectores/retail': () => import('@/pages/sectors/RetailLanding'),
  '/sectores/manufactura': () => import('@/pages/sectors/ManufacturaLanding'),
  '/sectores/empresas': () => import('@/pages/sectors/EmpresasLanding'),
  
  // Store
  '/store': () => import('@/pages/store/StoreLanding'),
  '/store/modules': () => import('@/pages/store/StoreModules'),
  
  // Developers
  '/developers': () => import('@/pages/DeveloperPortal'),
  
  // Otros
  '/pricing': () => import('@/pages/pricing/PreciosPage'),
  '/marketplace': () => import('@/pages/Marketplace'),
  '/docs': () => import('@/pages/resources/Documentation'),
  '/blog': () => import('@/pages/resources/Blog'),
  '/about': () => import('@/pages/company/About'),
  '/contact': () => import('@/pages/company/Contact'),
  '/demo': () => import('@/pages/DemoInteractiva'),
  '/chat': () => import('@/pages/Chat'),
};

export function useRoutePreload() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Precarga una ruta específica
   * Se ejecuta tras un pequeño delay para evitar precargas innecesarias
   */
  const preloadRoute = useCallback((path: string) => {
    // Cancelar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Pequeño delay para evitar precargas en hovers rápidos
    timeoutRef.current = setTimeout(() => {
      // No precargar si ya está en cache
      if (preloadedRoutes.has(path)) return;
      
      // Buscar la ruta exacta o una que coincida como prefijo
      const importFn = routeImports[path] || 
        Object.entries(routeImports).find(([route]) => path.startsWith(route))?.[1];
      
      if (importFn) {
        preloadedRoutes.add(path);
        // Ejecutar el import para que webpack precargue el chunk
        importFn().catch(() => {
          // Si falla, remover del cache para reintentar
          preloadedRoutes.delete(path);
        });
      }
    }, 50);
  }, []);
  
  /**
   * Cancela cualquier precarga pendiente
   */
  const cancelPreload = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  /**
   * Precarga múltiples rutas a la vez
   */
  const preloadRoutes = useCallback((paths: string[]) => {
    paths.forEach(path => {
      if (!preloadedRoutes.has(path) && routeImports[path]) {
        preloadedRoutes.add(path);
        routeImports[path]().catch(() => {
          preloadedRoutes.delete(path);
        });
      }
    });
  }, []);
  
  /**
   * Handler para onMouseEnter que precarga la ruta
   */
  const createPreloadHandler = useCallback((path: string) => {
    return () => preloadRoute(path);
  }, [preloadRoute]);
  
  return {
    preloadRoute,
    cancelPreload,
    preloadRoutes,
    createPreloadHandler,
  };
}

export default useRoutePreload;
