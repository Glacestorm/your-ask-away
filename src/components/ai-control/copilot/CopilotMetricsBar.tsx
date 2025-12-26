import { CopilotMetrics } from '@/hooks/useRoleCopilot';
import { 
  CheckCircle2, 
  XCircle, 
  Euro, 
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopilotMetricsBarProps {
  metrics: CopilotMetrics | null | undefined;
  isLoading?: boolean;
}

export function CopilotMetricsBar({ metrics, isLoading }: CopilotMetricsBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2 animate-pulse">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="space-y-1">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-4 w-8 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Sparkles className="h-4 w-4" />
        Genera suggeriments per veure mètriques
      </div>
    );
  }

  const totalValue = metrics.totalValueGenerated ?? metrics.totalMrrImpact ?? 0;
  const acceptanceRate = metrics.suggestionsTotal > 0 
    ? Math.round((metrics.suggestionsAccepted / metrics.suggestionsTotal) * 100) 
    : 0;

  const items = [
    {
      icon: CheckCircle2,
      label: 'Completades',
      value: metrics.actionsCompleted,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: XCircle,
      label: 'Descartades',
      value: metrics.actionsDismissed,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/50'
    },
    {
      icon: Euro,
      label: 'Valor Generat',
      value: totalValue > 1000 ? `${(totalValue / 1000).toFixed(1)}k€` : `${totalValue}€`,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Target,
      label: 'Taxa Acceptació',
      value: `${acceptanceRate}%`,
      color: acceptanceRate > 60 ? 'text-green-500' : acceptanceRate > 30 ? 'text-amber-500' : 'text-red-500',
      bgColor: acceptanceRate > 60 ? 'bg-green-500/10' : acceptanceRate > 30 ? 'bg-amber-500/10' : 'bg-red-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div 
          key={item.label}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
            item.bgColor
          )}
        >
          <item.icon className={cn("h-4 w-4", item.color)} />
          <div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={cn("text-sm font-semibold", item.color)}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
