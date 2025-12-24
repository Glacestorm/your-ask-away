import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GitMerge, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Correlation {
  metricA: string;
  metricB: string;
  coefficient: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  interpretation: string;
}

const CORRELATIONS: Correlation[] = [
  {
    metricA: 'NPS',
    metricB: 'NRR',
    coefficient: 0.78,
    strength: 'strong',
    direction: 'positive',
    interpretation: 'Clientes promotores tienden a expandir su uso y gasto'
  },
  {
    metricA: 'NPS',
    metricB: 'Churn',
    coefficient: -0.72,
    strength: 'strong',
    direction: 'negative',
    interpretation: 'Alto NPS reduce significativamente el riesgo de churn'
  },
  {
    metricA: 'CES',
    metricB: 'Churn',
    coefficient: 0.65,
    strength: 'moderate',
    direction: 'positive',
    interpretation: 'Mayor esfuerzo del cliente aumenta probabilidad de abandono'
  },
  {
    metricA: 'CSAT',
    metricB: 'Retention',
    coefficient: 0.68,
    strength: 'moderate',
    direction: 'positive',
    interpretation: 'Satisfacción alta correlaciona con mayor retención'
  },
  {
    metricA: 'TTV',
    metricB: 'Activation',
    coefficient: -0.82,
    strength: 'strong',
    direction: 'negative',
    interpretation: 'Menor tiempo al valor = mayor tasa de activación'
  },
  {
    metricA: 'Feature Adoption',
    metricB: 'NRR',
    coefficient: 0.71,
    strength: 'strong',
    direction: 'positive',
    interpretation: 'Mayor adopción de features impulsa expansión de ingresos'
  },
  {
    metricA: 'Health Score',
    metricB: 'Churn',
    coefficient: -0.85,
    strength: 'strong',
    direction: 'negative',
    interpretation: 'Health Score es el mejor predictor de churn'
  },
  {
    metricA: 'Engagement',
    metricB: 'CLV',
    coefficient: 0.63,
    strength: 'moderate',
    direction: 'positive',
    interpretation: 'Mayor engagement aumenta el valor del cliente'
  }
];

const METRICS = ['NPS', 'CSAT', 'CES', 'Churn', 'NRR', 'GRR', 'Health Score', 'Engagement'];

interface MetricsCorrelationMatrixProps {
  className?: string;
}

export function MetricsCorrelationMatrix({ className }: MetricsCorrelationMatrixProps) {
  const matrix = useMemo(() => {
    const result: Record<string, Record<string, Correlation | null>> = {};
    
    METRICS.forEach(m1 => {
      result[m1] = {};
      METRICS.forEach(m2 => {
        if (m1 === m2) {
          result[m1][m2] = null; // Diagonal
        } else {
          // Find correlation
          const corr = CORRELATIONS.find(
            c => (c.metricA === m1 && c.metricB === m2) || 
                 (c.metricA === m2 && c.metricB === m1)
          );
          result[m1][m2] = corr || null;
        }
      });
    });
    
    return result;
  }, []);

  const getCellColor = (corr: Correlation | null) => {
    if (!corr) return 'bg-muted/30';
    
    const absCoeff = Math.abs(corr.coefficient);
    const isPositive = corr.direction === 'positive';
    
    if (absCoeff >= 0.7) {
      return isPositive ? 'bg-green-500/40' : 'bg-red-500/40';
    } else if (absCoeff >= 0.4) {
      return isPositive ? 'bg-green-500/20' : 'bg-red-500/20';
    } else {
      return isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
    }
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <GitMerge className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Matriz de Correlaciones</CardTitle>
            <p className="text-xs text-muted-foreground">
              Relaciones entre métricas CS
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground">Correlación:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500/40" />
            <span>Positiva fuerte</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500/20" />
            <span>Positiva moderada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500/40" />
            <span>Negativa fuerte</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500/20" />
            <span>Negativa moderada</span>
          </div>
        </div>

        {/* Matrix */}
        <div className="overflow-x-auto">
          <TooltipProvider>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left font-medium text-muted-foreground" />
                  {METRICS.map(m => (
                    <th key={m} className="p-1 text-center font-medium text-muted-foreground">
                      <span className="inline-block transform -rotate-45 origin-center whitespace-nowrap">
                        {m}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map(m1 => (
                  <tr key={m1}>
                    <td className="p-1 font-medium text-muted-foreground whitespace-nowrap">
                      {m1}
                    </td>
                    {METRICS.map(m2 => {
                      const corr = matrix[m1]?.[m2];
                      const isDiagonal = m1 === m2;
                      
                      return (
                        <td key={m2} className="p-0.5">
                          {isDiagonal ? (
                            <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
                              <span className="text-muted-foreground">—</span>
                            </div>
                          ) : corr ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "w-8 h-8 rounded flex items-center justify-center cursor-help transition-all hover:scale-110",
                                    getCellColor(corr)
                                  )}
                                >
                                  <span className="font-mono font-semibold">
                                    {corr.coefficient > 0 ? '+' : ''}{corr.coefficient.toFixed(1)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-semibold">{corr.metricA} ↔ {corr.metricB}</p>
                                  <p className="text-muted-foreground">{corr.interpretation}</p>
                                  <div className="flex items-center gap-2 pt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {corr.strength}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "text-xs",
                                        corr.direction === 'positive' 
                                          ? "text-green-500 border-green-500/30" 
                                          : "text-red-500 border-red-500/30"
                                      )}
                                    >
                                      {corr.direction}
                                    </Badge>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted/10 flex items-center justify-center">
                              <span className="text-muted-foreground/30">·</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>

        {/* Key insights */}
        <div className="pt-3 border-t border-border/50">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Insights clave
          </h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Health Score → Churn</strong>: La correlación más fuerte (-0.85). Prioriza Health Score como indicador principal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <span><strong>Time-to-Value → Activación</strong>: Reducir TTV tiene impacto directo en activación (-0.82).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span><strong>NPS → NRR</strong>: Promotores expanden su uso (+0.78). Invierte en crear promotores.</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default MetricsCorrelationMatrix;
