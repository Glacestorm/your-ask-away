/**
 * Panel de Predicción de Revenue
 * 
 * Visualiza predicciones de ingresos con:
 * - Forecast mensual/trimestral
 * - Análisis de escenarios
 * - Breakdown por tipo de ingreso
 * - Análisis de cohortes
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { usePredictiveRevenue } from '@/hooks/admin/predictive/usePredictiveRevenue';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PredictiveRevenuePanelProps {
  context?: {
    entityId: string;
  } | null;
  className?: string;
}

export function PredictiveRevenuePanel({ context, className }: PredictiveRevenuePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('forecast');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const {
    predictions,
    breakdown,
    cohorts,
    isLoading,
    predictRevenue,
    analyzeCohorts,
  } = usePredictiveRevenue();

  useEffect(() => {
    if (context?.entityId) {
      predictRevenue(12);
      analyzeCohorts();
      setLastRefresh(new Date());
    }
  }, [context?.entityId, predictRevenue, analyzeCohorts]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([predictRevenue(12), analyzeCohorts()]);
    setLastRefresh(new Date());
  }, [predictRevenue, analyzeCohorts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Predicción de revenue inactiva
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Predicción de Revenue</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Analizando...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="forecast" className="text-xs">Forecast</TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs">Breakdown</TabsTrigger>
            <TabsTrigger value="cohorts" className="text-xs">Cohortes</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.slice(0, 6).map((pred, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{pred.period}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {pred.growth_rate > 0 ? (
                              <Badge className="bg-green-500 text-xs">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                +{pred.growth_rate.toFixed(1)}%
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                {pred.growth_rate.toFixed(1)}%
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Confianza: {Math.round(pred.confidence_level)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-500">
                            {formatCurrency(pred.predicted_revenue)}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Rango: {formatCurrency(pred.confidence_low)}</span>
                        <span>a {formatCurrency(pred.confidence_high)}</span>
                      </div>
                      <Progress 
                        value={pred.confidence_level} 
                        className="h-1.5 mt-2"
                      />

                      {pred.scenarios && pred.scenarios.length > 0 && (
                        <div className="mt-2 pt-2 border-t flex gap-2">
                          {pred.scenarios.map((scenario, sIdx) => (
                            <Badge key={sIdx} variant="outline" className="text-xs">
                              {scenario.name}: {formatCurrency(scenario.revenue)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Sin predicciones de revenue</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="breakdown" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {breakdown ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-muted-foreground">Recurrente</p>
                      <p className="text-lg font-bold text-green-500">
                        {formatCurrency(breakdown.recurring)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-muted-foreground">Expansión</p>
                      <p className="text-lg font-bold text-blue-500">
                        {formatCurrency(breakdown.expansion)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-xs text-muted-foreground">Nuevos</p>
                      <p className="text-lg font-bold text-purple-500">
                        {formatCurrency(breakdown.new_business)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-muted-foreground">Impacto Churn</p>
                      <p className="text-lg font-bold text-red-500">
                        -{formatCurrency(Math.abs(breakdown.churn_impact))}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-primary" />
                      Composición de Ingresos
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Recurrente', value: breakdown.recurring, color: 'bg-green-500' },
                        { label: 'Expansión', value: breakdown.expansion, color: 'bg-blue-500' },
                        { label: 'Nuevos', value: breakdown.new_business, color: 'bg-purple-500' },
                      ].map((item, idx) => {
                        const total = breakdown.recurring + breakdown.expansion + breakdown.new_business;
                        const percentage = total > 0 ? (item.value / total) * 100 : 0;
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{item.label}</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full", item.color)} 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <PieChart className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Cargando breakdown...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="cohorts" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {cohorts.length > 0 ? (
                <div className="space-y-3">
                  {cohorts.map((cohort, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{cohort.cohort}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Retención: {(cohort.retention_rate * 100).toFixed(0)}%
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Expansión: {(cohort.expansion_rate * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatCurrency(cohort.ltv_predicted)}
                          </p>
                          <p className="text-xs text-muted-foreground">LTV Predicho</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Avg Revenue:</span>
                          <span className="ml-1 font-medium">{formatCurrency(cohort.avg_revenue)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payback:</span>
                          <span className="ml-1 font-medium">{cohort.months_to_payback} meses</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Sin datos de cohortes</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PredictiveRevenuePanel;
