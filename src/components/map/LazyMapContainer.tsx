import React, { Suspense, lazy, useEffect, useState } from 'react';
import { MapSkeleton } from './MapSkeleton';
import type { MapContainerProps } from './MapContainerTypes';

// Lazy load the heavy MapContainer component
const MapContainerLazy = lazy(() => 
  import('./MapContainer').then(module => ({ 
    default: module.MapContainer 
  }))
);

// Re-export types
export type { MapContainerProps } from './MapContainerTypes';

export function LazyMapContainer(props: MapContainerProps) {
  const [isClient, setIsClient] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Ensure we're on client side before rendering map
  useEffect(() => {
    setIsClient(true);
    
    // Use requestIdleCallback for non-critical rendering
    // This improves TTI by deferring map load until browser is idle
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        setShouldRender(true);
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        setShouldRender(true);
      }, 100);
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
}

export default LazyMapContainer;
