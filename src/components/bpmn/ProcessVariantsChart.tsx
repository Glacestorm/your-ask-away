import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GitBranch, TrendingUp, Hash } from 'lucide-react';
import type { ProcessEvent } from '@/types/bpmn';

interface ProcessVariantsChartProps {
  events: ProcessEvent[];
}

interface Variant {
  path: string[];
  count: number;
  avgDuration: number;
  entities: string[];
}

export function ProcessVariantsChart({ events }: ProcessVariantsChartProps) {
  const variants = useMemo(() => {
    // Group events by entity
    const byEntity = new Map<string, ProcessEvent[]>();
    events.forEach(e => {
      if (!byEntity.has(e.entity_id)) byEntity.set(e.entity_id, []);
      byEntity.get(e.entity_id)!.push(e);
    });

    // Extract paths for each entity
    const variantMap = new Map<string, Variant>();
    
    byEntity.forEach((entityEvents, entityId) => {
      const sorted = entityEvents.sort(
        (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
      );
      
      const path = sorted.map(e => e.to_state || e.action);
      const pathKey = path.join(' → ');
      
      const duration = sorted.length >= 2
        ? new Date(sorted[sorted.length - 1].occurred_at).getTime() - 
          new Date(sorted[0].occurred_at).getTime()
        : 0;

      if (!variantMap.has(pathKey)) {
        variantMap.set(pathKey, {
          path,
          count: 0,
          avgDuration: 0,
          entities: []
        });
      }

      const variant = variantMap.get(pathKey)!;
      variant.avgDuration = (variant.avgDuration * variant.count + duration) / (variant.count + 1);
      variant.count++;
      variant.entities.push(entityId);
    });

    return Array.from(variantMap.values())
      .sort((a, b) => b.count - a.count);
  }, [events]);

  const totalCases = variants.reduce((acc, v) => acc + v.count, 0);
  const uniqueVariants = variants.length;
  const topVariantPercentage = totalCases > 0 
    ? (variants[0]?.count || 0) / totalCases * 100 
    : 0;

  const formatDuration = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) return `${Math.round(ms / (1000 * 60))} min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const getVariantColor = (index: number) => {
    const colors = [
      'bg-primary',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-cyan-500',
      'bg-yellow-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Hash className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{uniqueVariants}</div>
                <p className="text-sm text-muted-foreground">Variantes únicas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{topVariantPercentage.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Variante principal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/10">
                <GitBranch className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalCases}</div>
                <p className="text-sm text-muted-foreground">Casos analizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Distribución de Variantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length > 0 ? (
            <div className="space-y-1 mb-6">
              <div className="h-8 flex rounded-lg overflow-hidden">
                {variants.slice(0, 8).map((variant, idx) => {
                  const percentage = (variant.count / totalCases) * 100;
                  return (
                    <div
                      key={idx}
                      className={`${getVariantColor(idx)} transition-all hover:opacity-80`}
                      style={{ width: `${percentage}%` }}
                      title={`Variante ${idx + 1}: ${variant.count} casos (${percentage.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {variants.slice(0, 8).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs">
                    <div className={`w-3 h-3 rounded ${getVariantColor(idx)}`} />
                    <span>V{idx + 1}</span>
                  </div>
                ))}
                {variants.length > 8 && (
                  <span className="text-xs text-muted-foreground">
                    +{variants.length - 8} más
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No hay variantes para mostrar
            </p>
          )}
        </CardContent>
      </Card>

      {/* Variant Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Variantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {variants.slice(0, 10).map((variant, idx) => {
              const percentage = (variant.count / totalCases) * 100;
              return (
                <div 
                  key={idx}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${getVariantColor(idx)}`} />
                      <span className="font-medium">Variante {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {variant.count} casos
                      </Badge>
                      <Badge variant="outline">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Progress value={percentage} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {variant.path.slice(0, 8).map((step, stepIdx) => (
                      <React.Fragment key={stepIdx}>
                        <Badge variant="outline" className="text-xs">
                          {step}
                        </Badge>
                        {stepIdx < Math.min(variant.path.length - 1, 7) && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </React.Fragment>
                    ))}
                    {variant.path.length > 8 && (
                      <Badge variant="secondary" className="text-xs">
                        +{variant.path.length - 8} pasos
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Duración promedio: {formatDuration(variant.avgDuration)} • 
                    {variant.path.length} pasos
                  </div>
                </div>
              );
            })}

            {variants.length === 0 && (
              <div className="text-center py-8">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No hay suficientes eventos para analizar variantes
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conformance Hints */}
      {variants.length > 5 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <h4 className="font-medium">Alta variabilidad detectada</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Se han detectado {uniqueVariants} variantes diferentes del proceso.
                  Considere revisar la definición del proceso para estandarizar 
                  los flujos y reducir la variabilidad no deseada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
