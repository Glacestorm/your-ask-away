/**
 * Panel de Predicción de Demanda
 * 
 * Visualiza predicciones de demanda con:
 * - Forecast de demanda por producto/servicio
 * - Optimización de inventario
 * - Patrones estacionales
 * - Drivers de demanda
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
  Package,
  TrendingUp,
  Calendar,
  Maximize2,
  Minimize2,
  BarChart3,
  Layers,
  Zap,
} from 'lucide-react';
import { usePredictiveDemand } from '@/hooks/admin/predictive/usePredictiveDemand';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PredictiveDemandPanelProps {
  context?: {
    entityId: string;
  } | null;
  className?: string;
}

export function PredictiveDemandPanel({ context, className }: PredictiveDemandPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('forecast');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const {
    predictions,
    optimizations,
    drivers,
    patterns,
    isLoading,
    predictDemand,
    optimizeInventory,
  } = usePredictiveDemand();

  useEffect(() => {
    if (context?.entityId) {
      predictDemand();
      optimizeInventory();
      setLastRefresh(new Date());
    }
  }, [context?.entityId, predictDemand, optimizeInventory]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([predictDemand(), optimizeInventory()]);
    setLastRefresh(new Date());
  }, [predictDemand, optimizeInventory]);

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === 'decreasing') return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
    return <BarChart3 className="h-3 w-3 text-yellow-500" />;
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Predicción de demanda inactiva
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
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Predicción de Demanda</CardTitle>
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
            <TabsTrigger value="inventory" className="text-xs">Inventario</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs">Patrones</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((pred, idx) => {
                    const predAny = pred as any;
                    const trend = predAny.trend || 'stable';
                    return (
                      <div 
                        key={idx} 
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{predAny.product_name || `Producto ${predAny.product_id?.slice(0, 8)}`}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                {getTrendIcon(trend)}
                                {trend === 'increasing' ? 'Creciendo' : 
                                 trend === 'decreasing' ? 'Bajando' : 'Estable'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Confianza: {Math.round((predAny.confidence || 0) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-blue-500">
                              {predAny.predicted_demand?.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">unidades</p>
                          </div>
                        </div>

                        <Progress 
                          value={(predAny.confidence || 0) * 100} 
                          className="h-1.5 mb-2"
                        />

                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>Período: {predAny.forecast_period || pred.period}</span>
                          <span>Variación: ±{(predAny.variance_percentage ?? 5).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Sin predicciones de demanda</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inventory" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {optimizations.length > 0 ? (
                <div className="space-y-3">
                  {optimizations.map((opt, idx) => {
                    const optAny = opt as any;
                    const action = optAny.action || opt.recommended_action;
                    return (
                      <div 
                        key={idx} 
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{optAny.product_name || `Producto ${opt.product_id?.slice(0, 8)}`}</p>
                            <Badge 
                              variant={action === 'restock' ? 'default' : 
                                      action === 'reduce' ? 'secondary' : 'outline'}
                              className="text-xs mt-1"
                            >
                              {action === 'restock' ? 'Reabastecer' : 
                               action === 'reduce' ? 'Reducir' : 'Mantener'}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{optAny.recommended_quantity || opt.optimal_quantity}</p>
                            <p className="text-xs text-muted-foreground">unidades sugeridas</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs mt-2 pt-2 border-t">
                          <div>
                            <span className="text-muted-foreground">Stock Actual:</span>
                            <span className="ml-1 font-medium">{opt.current_stock}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Seguridad:</span>
                            <span className="ml-1 font-medium">{optAny.safety_stock ?? opt.reorder_point}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Días Cobertura:</span>
                            <span className="ml-1 font-medium">{optAny.days_of_coverage ?? 14}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                  <Layers className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Sin optimizaciones de inventario</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="patterns" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-4">
                {patterns.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Patrones Estacionales
                    </h4>
                    {patterns.map((pattern, idx) => {
                      const patAny = pattern as any;
                      return (
                        <div 
                          key={idx} 
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{pattern.pattern_name}</p>
                              <p className="text-xs text-muted-foreground">{patAny.description || pattern.pattern_type}</p>
                            </div>
                            <Badge variant="outline">
                              {(patAny.impact_percentage ?? pattern.strength * 100) > 0 ? '+' : ''}{(patAny.impact_percentage ?? pattern.strength * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {drivers.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      Drivers de Demanda
                    </h4>
                    {drivers.map((driver, idx) => {
                      const drvAny = driver as any;
                      return (
                        <div 
                          key={idx} 
                          className="p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{drvAny.driver_name || driver.driver}</p>
                            <Badge variant={driver.correlation > 0.5 ? 'default' : 'secondary'}>
                              {(driver.correlation * 100).toFixed(0)}% correlación
                            </Badge>
                          </div>
                          <Progress value={driver.correlation * 100} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {patterns.length === 0 && drivers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Sin patrones detectados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PredictiveDemandPanel;
