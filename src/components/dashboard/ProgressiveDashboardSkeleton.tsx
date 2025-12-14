import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ProgressiveDashboardSkeletonProps {
  showStats?: boolean;
  showCharts?: boolean;
  showTable?: boolean;
}

export function ProgressiveDashboardSkeleton({ 
  showStats = true, 
  showCharts = true, 
  showTable = true 
}: ProgressiveDashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards - Always show first with shimmer animation */}
      {showStats && (
        <motion.div 
          className="grid gap-4 md:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </Card>
          ))}
        </motion.div>
      )}

      {/* Charts - Show after stats */}
      {showCharts && (
        <motion.div 
          className="grid gap-6 md:grid-cols-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Card>
          <Card className="relative overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Card>
        </motion.div>
      )}

      {/* Table - Show last */}
      {showTable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Mini skeleton for inline loading states
export function InlineLoadingSkeleton({ width = 'w-16' }: { width?: string }) {
  return (
    <Skeleton className={`h-4 ${width} inline-block`} />
  );
}

// Chart-specific skeleton with proper aspect ratio
export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`${height} w-full bg-muted/50 rounded-lg animate-pulse flex items-center justify-center`}>
      <div className="flex gap-1">
        {[40, 60, 35, 80, 55, 45].map((h, i) => (
          <div 
            key={i}
            className="w-6 bg-muted-foreground/20 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
