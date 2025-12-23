import React, { Suspense, lazy, useEffect, useState, memo } from 'react';
import { MapSkeleton } from './MapSkeleton';
import type { MapContainerProps } from './MapContainerTypes';
import { loadMapboxCSS } from '@/lib/loadMapboxCSS';

// Lazy load the heavy MapContainer component with preload hint
const MapContainerLazy = lazy(() => 
  import('./MapContainer').then(module => ({ 
    default: module.MapContainer 
  }))
);

// Preload the MapContainer module and CSS when component mounts
let preloadStarted = false;
const preloadMapContainer = () => {
  if (!preloadStarted) {
    preloadStarted = true;
    // Load both the module and CSS in parallel
    Promise.all([
      import('./MapContainer'),
      loadMapboxCSS()
    ]).catch(err => {
      console.error('Failed to preload map resources:', err);
    });
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
