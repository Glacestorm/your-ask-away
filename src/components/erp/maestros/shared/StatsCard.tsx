/**
 * Card de estadísticas reutilizable
 */

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatsCard = memo(function StatsCard({
  label,
  value,
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  trend,
  trendLabel,
  loading = false,
  className,
  onClick
}: StatsCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 
    ? 'text-green-600 dark:text-green-400' 
    : trend && trend < 0 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-muted-foreground';

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <Card 
        className={cn(
          "transition-colors",
          onClick && "cursor-pointer hover:bg-muted/50",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", iconBgColor)}>
              <div className={iconColor}>
                {icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold truncate">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </>
              )}
            </div>
            {trend !== undefined && !loading && (
              <Badge 
                variant="outline" 
                className={cn("gap-1 text-[10px] shrink-0", trendColor)}
              >
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend)}%
              </Badge>
            )}
          </div>
          {trendLabel && !loading && (
            <p className="text-[10px] text-muted-foreground mt-2 text-right">
              {trendLabel}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default StatsCard;
