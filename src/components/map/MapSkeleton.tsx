import { Skeleton } from '@/components/ui/skeleton';

export function MapSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-background animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 border-b border-border flex items-center px-4 gap-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      <div className="flex flex-1 min-h-0">
        {/* Map area skeleton */}
        <div className="flex-1 relative bg-muted/30">
          {/* Fake map tiles pattern */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-px opacity-20">
            {Array.from({ length: 16 }).map((_, i) => (
              <div 
                key={i} 
                className="bg-primary/10 animate-pulse" 
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
          
          {/* Center loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-background/80 backdrop-blur-sm shadow-lg">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/30 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">Carregant mapa GIS</p>
                <p className="text-sm text-muted-foreground">Optimitzant renderització...</p>
              </div>
            </div>
          </div>

          {/* Fake markers skeleton */}
          <div className="absolute top-1/4 left-1/3">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="absolute top-1/2 left-1/2">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="absolute top-1/3 right-1/4">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="absolute bottom-1/3 left-1/4">
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
          <div className="absolute bottom-1/4 right-1/3">
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
