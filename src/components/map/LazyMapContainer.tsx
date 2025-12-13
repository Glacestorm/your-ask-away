import React, { Suspense, lazy, useEffect, useState, memo } from 'react';
import { MapSkeleton } from './MapSkeleton';
import type { MapContainerProps } from './MapContainerTypes';

// Lazy load the heavy MapContainer component with preload hint
const MapContainerLazy = lazy(() => 
  import('./MapContainer').then(module => ({ 
    default: module.MapContainer 
  }))
);

// Preload the MapContainer module when component mounts
let preloadStarted = false;
const preloadMapContainer = () => {
  if (!preloadStarted) {
    preloadStarted = true;
    import('./MapContainer');
  }
};

// Re-export types
export type { MapContainerProps } from './MapContainerTypes';

export const LazyMapContainer = memo(function LazyMapContainer(props: MapContainerProps) {
  const [isClient, setIsClient] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Ensure we're on client side before rendering map
  useEffect(() => {
    setIsClient(true);
    
    // Start preloading immediately
    preloadMapContainer();
    
    // Use requestIdleCallback with shorter timeout for faster map load
    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(() => {
        setShouldRender(true);
      }, { timeout: 500 }); // Reduced from 2000ms to 500ms
      
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleId);
        }
      };
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(() => {
        setShouldRender(true);
      }, 50); // Reduced from 100ms to 50ms
      
      return () => clearTimeout(timeoutId);
    }
  }, []);

  if (!isClient) {
    return <MapSkeleton />;
  }

  if (!shouldRender) {
    return <MapSkeleton />;
  }

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapContainerLazy {...props} />
    </Suspense>
  );
});

export default LazyMapContainer;
