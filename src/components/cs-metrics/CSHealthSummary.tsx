import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Target,
  Users,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthComponent {
  name: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  status: 'healthy' | 'warning' | 'critical';
}

interface CSHealthSummaryProps {
  npsScore?: number;
  csatScore?: number;
  cesScore?: number;
  churnRate?: number;
  nrrScore?: number;
  engagementScore?: number;
  className?: string;
}

export function CSHealthSummary({
  npsScore = 45,
  csatScore = 82,
  cesScore = 5.2,
  churnRate = 3.5,
  nrrScore = 108,
  engagementScore = 72,
  className
}: CSHealthSummaryProps) {
  
  const healthComponents = useMemo((): HealthComponent[] => {
    // Normalize scores to 0-100 scale
    const normalizeNPS = (val: number) => Math.max(0, Math.min(100, (val + 100) / 2));
    const normalizeCES = (val: number) => Math.max(0, Math.min(100, (7 - val) / 7 * 100)); // Lower is better for CES
    const normalizeChurn = (val: number) => Math.max(0, Math.min(100, 100 - (val * 10))); // Lower is better
    const normalizeNRR = (val: number) => Math.max(0, Math.min(100, val - 50)); // 100% = 50, 150% = 100

    const getStatus = (normalized: number): 'healthy' | 'warning' | 'critical' => {
      if (normalized >= 70) return 'healthy';
      if (normalized >= 40) return 'warning';
      return 'critical';
    };

    return [
      {
        name: 'NPS',
        score: normalizeNPS(npsScore),
        weight: 0.2,
        icon: <Users className="h-4 w-4" />,
        status: getStatus(normalizeNPS(npsScore))
      },
      {
        name: 'CSAT',
        score: csatScore,
        weight: 0.15,
        icon: <Heart className="h-4 w-4" />,
        status: getStatus(csatScore)
      },
      {
        name: 'CES',
        score: normalizeCES(cesScore),
        weight: 0.15,
        icon: <Zap className="h-4 w-4" />,
        status: getStatus(normalizeCES(cesScore))
      },
      {
        name: 'Retención',
        score: normalizeChurn(churnRate),
        weight: 0.2,
        icon: <Target className="h-4 w-4" />,
        status: getStatus(normalizeChurn(churnRate))
      },
      {
        name: 'NRR',
        score: normalizeNRR(nrrScore),
        weight: 0.2,
        icon: <DollarSign className="h-4 w-4" />,
        status: getStatus(normalizeNRR(nrrScore))
      },
      {
        name: 'Engagement',
        score: engagementScore,
        weight: 0.1,
        icon: <TrendingUp className="h-4 w-4" />,
        status: getStatus(engagementScore)
      }
    ];
  }, [npsScore, csatScore, cesScore, churnRate, nrrScore, engagementScore]);

  const overallScore = useMemo(() => {
    return healthComponents.reduce((acc, comp) => acc + (comp.score * comp.weight), 0);
  }, [healthComponents]);

  const overallStatus = useMemo(() => {
    if (overallScore >= 70) return 'healthy';
    if (overallScore >= 40) return 'at_risk';
    return 'critical';
  }, [overallScore]);

  const getStatusConfig = (status: 'healthy' | 'at_risk' | 'critical' | 'warning') => {
    const configs = {
      healthy: {
        label: 'Saludable',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />
      },
      at_risk: {
        label: 'En Riesgo',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      },
      warning: {
        label: 'Atención',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />
      },
      critical: {
        label: 'Crítico',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: <XCircle className="h-5 w-5 text-red-500" />
      }
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(overallStatus);

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    
    healthComponents.forEach(comp => {
      if (comp.status === 'critical') {
        switch (comp.name) {
          case 'NPS':
            recs.push('Implementar programa de mejora de NPS con seguimiento de detractores');
            break;
          case 'CSAT':
            recs.push('Revisar puntos de contacto críticos y mejorar soporte');
            break;
          case 'CES':
            recs.push('Simplificar procesos y reducir fricción en la experiencia');
            break;
          case 'Retención':
            recs.push('Activar programa de retención proactiva urgente');
            break;
          case 'NRR':
            recs.push('Implementar estrategia de upsell/cross-sell');
            break;
          case 'Engagement':
            recs.push('Aumentar comunicación y valor percibido');
            break;
        }
      } else if (comp.status === 'warning') {
        recs.push(`Monitorear ${comp.name} de cerca`);
      }
    });

    return recs.slice(0, 3);
  }, [healthComponents]);

  return (
    <Card className={cn("border-border/50 overflow-hidden", className)}>
      {/* Header with gradient */}
      <div className={cn(
        "p-4 border-b",
        statusConfig.bgColor,
        statusConfig.borderColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl",
              statusConfig.bgColor
            )}>
              <Heart className={cn("h-6 w-6", statusConfig.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Health Score CS</h3>
              <p className="text-sm text-muted-foreground">Puntuación compuesta de salud</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              {statusConfig.icon}
              <Badge 
                variant="outline" 
                className={cn("text-sm font-medium", statusConfig.color, statusConfig.borderColor)}
              >
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Overall score */}
        <div className="text-center py-4">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                className="stroke-muted"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                className={cn(
                  "transition-all duration-1000",
                  overallScore >= 70 ? "stroke-green-500" :
                  overallScore >= 40 ? "stroke-yellow-500" : "stroke-red-500"
                )}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overallScore / 100) * 352} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-4xl font-bold", statusConfig.color)}>
                {Math.round(overallScore)}
              </span>
              <span className="text-xs text-muted-foreground">de 100</span>
            </div>
          </div>
        </div>

        {/* Components breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Componentes</p>
          <div className="grid gap-2">
            {healthComponents.map((comp) => {
              const compConfig = getStatusConfig(comp.status);
              return (
                <div key={comp.name} className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    compConfig.bgColor
                  )}>
                    <span className={compConfig.color}>{comp.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{comp.name}</span>
                      <span className={cn("text-sm font-semibold", compConfig.color)}>
                        {Math.round(comp.score)}
                      </span>
                    </div>
                    <Progress 
                      value={comp.score} 
                      className="h-1.5"
                    />
                  </div>
                  <Badge variant="outline" className="text-xs opacity-60">
                    {(comp.weight * 100).toFixed(0)}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Acciones recomendadas
            </p>
            <ul className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CSHealthSummary;
