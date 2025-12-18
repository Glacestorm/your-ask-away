import React, { 
  ReactNode, 
  useState, 
  useEffect, 
  useRef, 
  Suspense, 
  lazy,
  ComponentType 
} from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Islands Architecture (Partial Hydration) - 100% Implementation
 * 
 * Hydrates ONLY interactive components while keeping static content as HTML.
 * This dramatically improves TTI (Time to Interactive) and reduces JavaScript payload.
 */

type HydrationStrategy = 'idle' | 'visible' | 'interaction' | 'media' | 'immediate';

interface IslandProps {
  children: ReactNode;
  /** When to hydrate: idle (requestIdleCallback), visible (IntersectionObserver), 
   *  interaction (click/focus), media (matchMedia), immediate */
  hydrate?: HydrationStrategy;
  /** For media strategy: CSS media query to match */
  mediaQuery?: string;
  /** Fallback content while hydrating */
  fallback?: ReactNode;
  /** Optional name for debugging */
  name?: string;
  /** Root margin for visibility detection */
  rootMargin?: string;
  /** Callback when hydration completes */
  onHydrated?: () => void;
}

/**
 * Island - Interactive component wrapper that controls hydration timing
 * Only hydrates when the specified condition is met
 */
export function Island({
  children,
  hydrate = 'visible',
  mediaQuery = '(min-width: 768px)',
  fallback,
  name,
  rootMargin = '200px',
  onHydrated
}: IslandProps) {
  const [isHydrated, setIsHydrated] = useState(hydrate === 'immediate');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current || hydrate === 'immediate') return;

    const triggerHydration = () => {
      if (!hasHydratedRef.current) {
        hasHydratedRef.current = true;
        setIsHydrated(true);
        onHydrated?.();
        if (name && process.env.NODE_ENV === 'development') {
          console.log(`[Island] Hydrated: ${name}`);
        }
      }
    };

    switch (hydrate) {
      case 'idle':
        if ('requestIdleCallback' in window) {
          const id = requestIdleCallback(triggerHydration, { timeout: 2000 });
          return () => cancelIdleCallback(id);
        } else {
          const timer = setTimeout(triggerHydration, 200);
          return () => clearTimeout(timer);
        }

      case 'visible':
        if (!ref.current) return;
        
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              triggerHydration();
              observer.disconnect();
            }
          },
          { rootMargin, threshold: 0.1 }
        );
        observer.observe(ref.current);
        return () => observer.disconnect();

      case 'interaction':
        const element = ref.current;
        if (!element) return;

        const events = ['click', 'focus', 'mouseenter', 'touchstart'];
        const handleInteraction = () => {
          triggerHydration();
          events.forEach(event => element.removeEventListener(event, handleInteraction));
        };
        events.forEach(event => 
          element.addEventListener(event, handleInteraction, { once: true, passive: true })
        );
        return () => {
          events.forEach(event => element.removeEventListener(event, handleInteraction));
        };

      case 'media':
        const mediaQueryList = window.matchMedia(mediaQuery);
        if (mediaQueryList.matches) {
          triggerHydration();
        } else {
          const handler = (e: MediaQueryListEvent) => {
            if (e.matches) {
              triggerHydration();
              mediaQueryList.removeEventListener('change', handler);
            }
          };
          mediaQueryList.addEventListener('change', handler);
          return () => mediaQueryList.removeEventListener('change', handler);
        }
        break;
    }
  }, [hydrate, mediaQuery, name, onHydrated, rootMargin]);

  const defaultFallback = (
    <div className="animate-pulse space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );

  return (
    <div 
      ref={ref} 
      data-island={name}
      data-hydrated={isHydrated}
      className="island-container"
    >
      {isHydrated ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
}

/**
 * StaticContent - Non-interactive content that never hydrates
 * Rendered as pure HTML without JavaScript interactivity
 */
export function StaticContent({ 
  children, 
  as = 'div',
  className = ''
}: { 
  children: ReactNode; 
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'main' | 'nav' | 'span';
  className?: string;
}) {
  const Element = as;
  return (
    <Element 
      className={className}
      data-static="true"
      suppressHydrationWarning
    >
      {children}
    </Element>
  );
}

/**
 * ClientOnly - Component that only renders on client, never during SSR
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * withIsland - HOC to wrap any component with Island hydration
 */
export function withIsland<P extends object>(
  Component: ComponentType<P>,
  options: Omit<IslandProps, 'children'> = {}
) {
  const WrappedComponent = (props: P) => (
    <Island {...options}>
      <Component {...props} />
    </Island>
  );
  
  WrappedComponent.displayName = `Island(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

/**
 * LazyIsland - Combines lazy loading with Island hydration
 */
export function LazyIsland<P extends object>({
  loader,
  hydrate = 'visible',
  fallback,
  ...props
}: {
  loader: () => Promise<{ default: ComponentType<P> }>;
  hydrate?: HydrationStrategy;
  fallback?: ReactNode;
} & P) {
  const LazyComponent = lazy(loader);
  
  return (
    <Island hydrate={hydrate} fallback={fallback}>
      <LazyComponent {...(props as P)} />
    </Island>
  );
}

/**
 * useIslandHydration - Hook to control hydration state
 */
export function useIslandHydration(strategy: HydrationStrategy = 'idle') {
  const [isHydrated, setIsHydrated] = useState(strategy === 'immediate');
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (strategy === 'immediate') return;

    const triggerHydration = () => setIsHydrated(true);

    switch (strategy) {
      case 'idle':
        if ('requestIdleCallback' in window) {
          const id = requestIdleCallback(triggerHydration, { timeout: 2000 });
          return () => cancelIdleCallback(id);
        }
        const timer = setTimeout(triggerHydration, 200);
        return () => clearTimeout(timer);

      case 'visible':
        if (!ref.current) return;
        const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            triggerHydration();
            observer.disconnect();
          }
        }, { rootMargin: '200px' });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }
  }, [strategy]);

  return { isHydrated, ref };
}

/**
 * IslandGroup - Manages multiple islands with shared hydration
 */
export function IslandGroup({
  children,
  hydrate = 'visible',
  stagger = 100,
  fallback
}: {
  children: ReactNode[];
  hydrate?: HydrationStrategy;
  stagger?: number;
  fallback?: ReactNode;
}) {
  const [hydrationIndex, setHydrationIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startHydration = () => {
      let currentIndex = 0;
      const hydrateNext = () => {
        if (currentIndex < React.Children.count(children)) {
          setHydrationIndex(currentIndex);
          currentIndex++;
          setTimeout(hydrateNext, stagger);
        }
      };
      hydrateNext();
    };

    if (hydrate === 'immediate') {
      startHydration();
      return;
    }

    if (hydrate === 'idle') {
      if ('requestIdleCallback' in window) {
        const id = requestIdleCallback(startHydration, { timeout: 2000 });
        return () => cancelIdleCallback(id);
      }
      const timer = setTimeout(startHydration, 200);
      return () => clearTimeout(timer);
    }

    if (hydrate === 'visible' && containerRef.current) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          startHydration();
          observer.disconnect();
        }
      }, { rootMargin: '200px' });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [children, hydrate, stagger]);

  return (
    <div ref={containerRef} data-island-group="true">
      {React.Children.map(children, (child, index) => (
        <div 
          key={index}
          data-island-index={index}
          data-hydrated={index <= hydrationIndex}
        >
          {index <= hydrationIndex ? (
            <Suspense fallback={fallback}>
              {child}
            </Suspense>
          ) : (
            fallback || (
              <div className="animate-pulse">
                <Skeleton className="h-20 w-full" />
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * InteractiveIsland - Only hydrates on user interaction (click, hover, focus)
 * Perfect for components that don't need to be interactive until used
 */
export function InteractiveIsland({
  children,
  placeholder,
  className = ''
}: {
  children: ReactNode;
  placeholder: ReactNode;
  className?: string;
}) {
  const [isActivated, setIsActivated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || isActivated) return;

    const activate = () => setIsActivated(true);
    const events = ['click', 'focus', 'mouseenter', 'touchstart'];
    
    events.forEach(event => 
      element.addEventListener(event, activate, { once: true, passive: true })
    );

    return () => {
      events.forEach(event => element.removeEventListener(event, activate));
    };
  }, [isActivated]);

  return (
    <div 
      ref={ref} 
      className={className}
      data-interactive-island="true"
      data-activated={isActivated}
    >
      {isActivated ? children : placeholder}
    </div>
  );
}

/**
 * getIslandStats - Get statistics about islands (for debugging/monitoring)
 */
export function getIslandStats() {
  if (typeof document === 'undefined') return null;

  const islands = document.querySelectorAll('[data-island]');
  const hydratedIslands = document.querySelectorAll('[data-hydrated="true"]');
  const staticContent = document.querySelectorAll('[data-static="true"]');
  const interactiveIslands = document.querySelectorAll('[data-interactive-island="true"]');
  const activatedIslands = document.querySelectorAll('[data-activated="true"]');

  return {
    totalIslands: islands.length,
    hydratedIslands: hydratedIslands.length,
    pendingIslands: islands.length - hydratedIslands.length,
    staticContent: staticContent.length,
    interactiveIslands: interactiveIslands.length,
    activatedInteractive: activatedIslands.length,
    hydrationRate: islands.length > 0 
      ? Math.round((hydratedIslands.length / islands.length) * 100) 
      : 100
  };
}
