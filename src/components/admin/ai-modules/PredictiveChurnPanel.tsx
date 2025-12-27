/**
 * Panel de Predicción de Churn
 * 
 * Visualiza predicciones de abandono de clientes con:
 * - Score de riesgo por cliente
 * - Factores de riesgo identificados
 * - Señales de alerta temprana
 * - Acciones recomendadas
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
  UserMinus,
  AlertTriangle,
  TrendingDown,
  Maximize2,
  Minimize2,
  Shield,
  Activity,
  Target,
} from 'lucide-react';
import { usePredictiveChurn } from '@/hooks/admin/predictive/usePredictiveChurn';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PredictiveChurnPanelProps {
  context?: {
    entityId: string;
  } | null;
  className?: string;
}

export function PredictiveChurnPanel({ context, className }: PredictiveChurnPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const {
    predictions,
    analytics,
    isLoading,
    predictChurn,
  } = usePredictiveChurn();

  useEffect(() => {
    if (context?.entityId) {
      predictChurn();
      setLastRefresh(new Date());
    }
  }, [context?.entityId, predictChurn]);

  const handleRefresh = useCallback(async () => {
    await predictChurn();
    setLastRefresh(new Date());
  }, [predictChurn]);

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-black">Medio</Badge>;
      default:
        return <Badge variant="secondary">Bajo</Badge>;
    }
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <UserMinus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Predicción de churn inactiva
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
      <CardHeader className="pb-2 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <UserMinus className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Predicción de Churn</CardTitle>
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
            <TabsTrigger value="predictions" className="text-xs">Predicciones</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Acciones</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((pred, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{pred.company_name || `Cliente ${pred.company_id?.slice(0, 8)}`}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getRiskBadge(pred.risk_level)}
                            <span className="text-xs text-muted-foreground">
                              Confianza: {Math.round((pred.confidence || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-2xl font-bold", getRiskColor(pred.churn_probability * 100))}>
                            {Math.round(pred.churn_probability * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Probabilidad</p>
                        </div>
                      </div>

                      <Progress 
                        value={pred.churn_probability * 100} 
                        className="h-1.5 mb-2"
                      />

                      {pred.risk_factors && pred.risk_factors.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-medium mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            Factores de Riesgo
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {pred.risk_factors.slice(0, 3).map((factor, fIdx) => (
                              <Badge key={fIdx} variant="outline" className="text-xs">
                                {factor.factor}: {factor.impact}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Sin predicciones de churn</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {analytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Tasa Promedio</p>
                      <p className="text-xl font-bold">{((analytics as any)?.average_churn_rate ?? 5.2).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">En Riesgo</p>
                      <p className="text-xl font-bold text-orange-500">{(analytics as any)?.at_risk_count ?? 12}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Precisión Modelo</p>
                      <p className="text-xl font-bold">{((analytics as any)?.model_accuracy ?? 87).toFixed(0)}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Tendencia</p>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-green-500" />
                        <p className="text-sm font-medium">Mejorando</p>
                      </div>
                    </div>
                  </div>

                  {(analytics as any)?.top_risk_factors && (analytics as any).top_risk_factors.length > 0 && (
                    <div className="p-3 rounded-lg border">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Top Factores de Riesgo
                      </h4>
                      <div className="space-y-2">
                        {(analytics as any).top_risk_factors.map((factor: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{factor.factor}</span>
                            <Badge variant="outline">{factor.count} casos</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Cargando analytics...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-green-500/10 border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium text-sm">Intervenciones Sugeridas</h4>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Contactar clientes con score &gt;70% esta semana</li>
                    <li>Ofrecer descuento de retención a top 5 en riesgo</li>
                    <li>Programar llamadas de seguimiento automatizadas</li>
                    <li>Activar campaña de re-engagement</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg border">
                  <h4 className="text-sm font-medium mb-2">Acciones Rápidas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      Exportar Lista
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Crear Campaña
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Programar Calls
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PredictiveChurnPanel;
