import { CopilotMetrics } from '@/hooks/useRoleCopilot';
import { 
  CheckCircle2, 
  XCircle, 
  Euro, 
  TrendingUp,
  Target
} from 'lucide-react';

interface CopilotMetricsBarProps {
  metrics: CopilotMetrics | null | undefined;
}

export function CopilotMetricsBar({ metrics }: CopilotMetricsBarProps) {
  if (!metrics) return null;

  const totalValue = metrics.totalValueGenerated ?? metrics.totalMrrImpact ?? 0;
  const acceptanceRate = metrics.suggestionsTotal > 0 
    ? Math.round((metrics.suggestionsAccepted / metrics.suggestionsTotal) * 100) 
    : 0;

  const items = [
    {
      icon: CheckCircle2,
      label: 'Completades',
      value: metrics.actionsCompleted,
      color: 'text-green-500'
    },
    {
      icon: XCircle,
      label: 'Descartades',
      value: metrics.actionsDismissed,
      color: 'text-muted-foreground'
    },
    {
      icon: Euro,
      label: 'Valor Generat',
      value: `${(totalValue / 1000).toFixed(1)}k€`,
      color: 'text-green-600'
    },
    {
      icon: Target,
      label: 'Taxa Acceptació',
      value: `${acceptanceRate}%`,
      color: acceptanceRate > 60 ? 'text-green-500' : acceptanceRate > 30 ? 'text-amber-500' : 'text-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <div 
          key={item.label}
          className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2"
        >
          <item.icon className={`h-4 w-4 ${item.color}`} />
          <div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
