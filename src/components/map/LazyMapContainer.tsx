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

  // Ensure we're on client side before rendering map
  useEffect(() => {
    setIsClient(true);
    // Start preloading immediately
    preloadMapContainer();
  }, []);

  if (!isClient) {
    return <MapSkeleton />;
  }

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapContainerLazy {...props} />
    </Suspense>
  );
});

export default LazyMapContainer;
