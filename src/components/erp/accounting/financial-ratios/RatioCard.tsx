/**
 * RatioCard - Componente para mostrar un ratio individual
 */

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertTriangle, XCircle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RatioStatus = 'excellent' | 'good' | 'warning' | 'critical' | 'neutral';

export interface RatioCardProps {
  name: string;
  value: number | null;
  formattedValue: string;
  status: RatioStatus;
  benchmark?: number;
  description: string;
  icon: React.ElementType;
}

const statusColors: Record<RatioStatus, string> = {
  excellent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  good: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  critical: 'bg-red-500/10 text-red-600 border-red-500/30',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const statusIcons: Record<RatioStatus, React.ElementType> = {
  excellent: CheckCircle,
  good: CheckCircle,
  warning: AlertTriangle,
  critical: XCircle,
  neutral: Minus,
};

export function RatioCard({
  name,
  value,
  formattedValue,
  status,
  benchmark,
  description,
  icon: Icon
}: RatioCardProps) {
  const StatusIcon = statusIcons[status];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "p-4 rounded-lg border transition-all hover:shadow-md cursor-help",
            statusColors[status]
          )}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-70" />
                <span className="text-xs font-medium">{name}</span>
              </div>
              <StatusIcon className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold mb-1">{formattedValue}</div>
            {benchmark !== undefined && (
              <div className="text-xs opacity-70">
                Benchmark: {benchmark.toFixed(2)}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default RatioCard;
