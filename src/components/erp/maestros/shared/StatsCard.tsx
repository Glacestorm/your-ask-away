/**
 * Card de estadísticas reutilizable
 * @version 2.0 - Mejoras: Sparkline, comparación, formato de números, variantes
 */

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
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
  previousValue?: number | string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  format?: 'number' | 'currency' | 'percent';
  tooltip?: string;
  sparklineData?: number[];
}

// Simple sparkline component
const Sparkline = memo(function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
});

const formatValue = (value: number | string, format?: 'number' | 'currency' | 'percent'): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('es-ES').format(value);
  }
};

export const StatsCard = memo(function StatsCard({
  label,
  value,
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  trend,
  trendLabel,
  previousValue,
  loading = false,
  className,
  onClick,
  variant = 'default',
  format,
  tooltip,
  sparklineData
}: StatsCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 
    ? 'text-green-600 dark:text-green-400' 
    : trend && trend < 0 
      ? 'text-red-600 dark:text-red-400' 
      : 'text-muted-foreground';

  const formattedValue = formatValue(value, format);
  const formattedPrevious = previousValue !== undefined ? formatValue(previousValue, format) : undefined;

  const content = (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <Card 
        className={cn(
          "transition-all duration-200",
          onClick && "cursor-pointer hover:shadow-md hover:border-primary/20",
          variant === 'compact' && "p-0",
          className
        )}
        onClick={onClick}
      >
        <CardContent className={cn(
          variant === 'compact' ? "p-3" : "p-4"
        )}>
          {variant === 'compact' ? (
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md shrink-0", iconBgColor)}>
                <div className={iconColor}>
                  {icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-lg font-bold truncate">{formattedValue}</p>
                )}
                <p className="text-[10px] text-muted-foreground truncate">{label}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className={cn("p-2.5 rounded-lg shrink-0", iconBgColor)}>
                <div className={iconColor}>
                  {icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold truncate">{formattedValue}</p>
                      {tooltip && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {formattedPrevious && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Anterior: {formattedPrevious}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {trend !== undefined && !loading && (
                  <Badge 
                    variant="outline" 
                    className={cn("gap-1 text-[10px] shrink-0", trendColor)}
                  >
                    <TrendIcon className="h-3 w-3" />
                    {Math.abs(trend)}%
                  </Badge>
                )}
                {sparklineData && sparklineData.length > 1 && !loading && (
                  <Sparkline data={sparklineData} />
                )}
              </div>
            </div>
          )}
          {trendLabel && !loading && variant !== 'compact' && (
            <p className="text-[10px] text-muted-foreground mt-2 text-right">
              {trendLabel}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return content;
});

export default StatsCard;
