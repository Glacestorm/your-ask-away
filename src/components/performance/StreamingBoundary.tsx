import React, { Suspense, ReactNode, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ObelixiaLogo, ObelixiaLoadingSpinner, ObelixiaFullscreenLoader } from '@/components/ui/ObelixiaLogo';


interface StreamingBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: 'high' | 'medium' | 'low';
  delay?: number;
}

/**
 * StreamingBoundary - Progressive loading with React 19 Suspense
 * Implements streaming SSR patterns for improved TTI
 */
export function StreamingBoundary({ 
  children, 
  fallback, 
  priority = 'medium',
  delay = 0 
}: StreamingBoundaryProps) {
  const [shouldRender, setShouldRender] = useState(priority === 'high');

  useEffect(() => {
    if (priority !== 'high' && delay > 0) {
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    }
    setShouldRender(true);
  }, [priority, delay]);

  if (!shouldRender) {
    return fallback || <DefaultFallback priority={priority} />;
  }

  return (
    <Suspense fallback={fallback || <DefaultFallback priority={priority} />}>
      {children}
    </Suspense>
  );
}

function DefaultFallback({ priority }: { priority: string }) {
  const baseClass = priority === 'high' ? 'animate-pulse' : 'animate-pulse opacity-60';
  
  return (
    <div className={`space-y-3 ${baseClass}`}>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

/**
 * Card skeleton for streaming dashboard cards
 */
export function CardStreamingSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <Card className="animate-pulse">
      {showHeader && (
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
      )}
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Table skeleton for streaming data tables
 */
export function TableStreamingSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex gap-4 border-b pb-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Chart skeleton for streaming visualizations
 */
export function ChartStreamingSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1" 
            style={{ height: `${30 + Math.random() * 60}%` }} 
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard grid skeleton for streaming multiple cards
 */
export function DashboardStreamingSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <CardStreamingSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Full page streaming skeleton with ObelixIA branding (Brain + "ObelixIA" + Symbol)
 */
export function PageStreamingSkeleton() {
  return <ObelixiaFullscreenLoader text="Cargando ObelixIA..." />;
}


/**
 * Inline loading indicator for streaming content
 */
export function InlineStreamingIndicator({ text = 'Carregant...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <ObelixiaLoadingSpinner size="sm" showText={false} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * Progressive reveal wrapper - shows content progressively
 */
export function ProgressiveReveal({ 
  children, 
  delay = 100,
  stagger = 50 
}: { 
  children: ReactNode[];
  delay?: number;
  stagger?: number;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const showNext = () => {
      setVisibleCount(prev => {
        if (prev < React.Children.count(children)) {
          setTimeout(showNext, stagger);
          return prev + 1;
        }
        return prev;
      });
    };

    const timer = setTimeout(showNext, delay);
    return () => clearTimeout(timer);
  }, [children, delay, stagger]);

  return (
    <>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={`transition-all duration-300 ${
            index < visibleCount 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}
        >
          {child}
        </div>
      ))}
    </>
  );
}
