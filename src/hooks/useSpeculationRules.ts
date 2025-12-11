import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  supportsSpeculationRules,
  initDefaultSpeculationRules,
  prefetchUrl,
  setupHoverPrefetch,
  setPriorityHints,
  getAppRoutes
} from '@/lib/speculationRules';

interface UseSpeculationRulesOptions {
  enableHoverPrefetch?: boolean;
  hoverDelay?: number;
  enablePriorityHints?: boolean;
  customRoutes?: string[];
}

/**
 * Hook for managing Speculation Rules API
 * Enables intelligent prefetching and prerendering for improved navigation performance
 */
export function useSpeculationRules(options: UseSpeculationRulesOptions = {}) {
  const {
    enableHoverPrefetch = true,
    hoverDelay = 100,
    enablePriorityHints = true,
    customRoutes
  } = options;
  
  const location = useLocation();

  // Initialize speculation rules on mount
  useEffect(() => {
    initDefaultSpeculationRules();
    
    if (enablePriorityHints) {
      setPriorityHints();
    }
    
    console.log('[useSpeculationRules] Initialized, API supported:', supportsSpeculationRules());
  }, [enablePriorityHints]);

  // Setup hover prefetch
  useEffect(() => {
    if (!enableHoverPrefetch) return;
    
    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      const cleanup = setupHoverPrefetch('a[href^="/"]', hoverDelay);
      return cleanup;
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [enableHoverPrefetch, hoverDelay, location.pathname]);

  // Prefetch adjacent routes based on current location
  useEffect(() => {
    const routes = customRoutes || getAppRoutes();
    const currentIndex = routes.indexOf(location.pathname);
    
    if (currentIndex !== -1) {
      // Prefetch next and previous routes
      const adjacentRoutes = [
        routes[currentIndex - 1],
        routes[currentIndex + 1]
      ].filter(Boolean);
      
      adjacentRoutes.forEach(route => {
        if (route) prefetchUrl(route);
      });
    }
  }, [location.pathname, customRoutes]);

  // Manual prefetch function
  const prefetch = useCallback((url: string, prerender: boolean = false) => {
    prefetchUrl(url, prerender);
  }, []);

  // Check API support
  const isSupported = supportsSpeculationRules();

  return {
    prefetch,
    isSupported,
    currentPath: location.pathname
  };
}

export default useSpeculationRules;
