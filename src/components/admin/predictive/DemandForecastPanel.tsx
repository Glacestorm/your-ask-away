import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Package, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Boxes,
  BarChart
} from 'lucide-react';
import { usePredictiveDemand } from '@/hooks/admin/predictive';
import { cn } from '@/lib/utils';

export function DemandForecastPanel() {
  const [activeTab, setActiveTab] = useState('forecast');
  const { predictions, optimizations, drivers, patterns, isLoading, predictDemand, optimizeInventory } = usePredictiveDemand();

  useEffect(() => {
    predictDemand();
    optimizeInventory();
  }, [predictDemand, optimizeInventory]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'urgent_order': return 'bg-destructive text-destructive-foreground';
      case 'order_now': return 'bg-orange-500 text-white';
      case 'reduce_stock': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Forecast de Demanda</CardTitle>
              <p className="text-xs text-muted-foreground">Predicción y optimización de inventario</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => predictDemand()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="forecast" className="text-xs">Demanda</TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs">Inventario</TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs">Drivers</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {predictions.map((pred) => (
                  <div key={pred.product_id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate flex-1">{pred.product_name}</span>
                      {pred.trend_direction === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : pred.trend_direction === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      ) : (
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-lg font-bold">{pred.predicted_demand?.toLocaleString()} uds</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={pred.confidence} className="flex-1 h-1.5" />
                      <span className="text-xs text-muted-foreground">{pred.confidence}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estacionalidad: {pred.seasonality_factor?.toFixed(2)}x • Stock recom: {pred.recommended_stock}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inventory" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {optimizations.map((opt) => (
                  <div key={opt.product_id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Producto {opt.product_id.slice(0, 8)}</span>
                      </div>
                      <Badge className={getActionColor(opt.recommended_action)}>
                        {opt.recommended_action.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Stock Actual</span>
                        <p className="font-medium">{opt.current_stock}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock Óptimo</span>
                        <p className="font-medium">{opt.optimal_stock}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Días Suministro</span>
                        <p className="font-medium">{opt.days_of_supply}d</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Riesgo Rotura</span>
                        <p className={cn("font-medium", opt.stockout_risk > 50 && "text-destructive")}>
                          {opt.stockout_risk}%
                        </p>
                      </div>
                    </div>
                    {opt.order_quantity > 0 && (
                      <p className="text-xs mt-2 text-primary font-medium">
                        → Pedir: {opt.order_quantity} unidades
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="drivers" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {drivers.map((driver, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{driver.driver}</span>
                      <Badge variant={driver.forecast_impact === 'positive' ? 'default' : driver.forecast_impact === 'negative' ? 'destructive' : 'secondary'}>
                        {driver.forecast_impact}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Correlación</span>
                        <p className="font-medium">{driver.correlation?.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Poder Predictivo</span>
                        <p className="font-medium">{driver.predictive_power}%</p>
                      </div>
                    </div>
                  </div>
                ))}
                {patterns.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Patrones Estacionales</p>
                    {patterns.map((pattern, idx) => (
                      <div key={idx} className="p-2 rounded border bg-muted/50 mb-1">
                        <span className="text-xs font-medium">{pattern.pattern_name}</span>
                        <p className="text-xs text-muted-foreground">
                          Amplitud: {pattern.amplitude?.toFixed(2)} • Confianza: {pattern.confidence}%
                        </p>
                      </div>
                    ))}
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

export default DemandForecastPanel;
