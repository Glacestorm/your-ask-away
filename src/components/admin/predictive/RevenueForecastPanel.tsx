import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { usePredictiveRevenue } from '@/hooks/admin/predictive';
import { cn } from '@/lib/utils';

export function RevenueForecastPanel() {
  const [activeTab, setActiveTab] = useState('forecast');
  const { predictions, breakdown, cohorts, isLoading, predictRevenue, analyzeCohorts } = usePredictiveRevenue();

  useEffect(() => {
    predictRevenue(12);
    analyzeCohorts();
  }, [predictRevenue, analyzeCohorts]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Forecast de Revenue</CardTitle>
              <p className="text-xs text-muted-foreground">Predicción financiera con escenarios</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => predictRevenue(12)} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="forecast" className="text-xs">Forecast</TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs">Desglose</TabsTrigger>
            <TabsTrigger value="cohorts" className="text-xs">Cohortes</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {predictions.slice(0, 6).map((pred) => (
                  <div key={pred.period} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{pred.period}</span>
                      <Badge variant={pred.growth_rate >= 0 ? 'default' : 'destructive'}>
                        {pred.growth_rate >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                        {pred.growth_rate?.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xl font-bold">€{(pred.predicted_revenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">
                      Rango: €{(pred.confidence_low / 1000).toFixed(0)}K - €{(pred.confidence_high / 1000).toFixed(0)}K
                    </p>
                    <div className="mt-2 flex gap-1">
                      {pred.scenarios?.map((s) => (
                        <Badge key={s.name} variant="outline" className="text-xs">
                          {s.name}: €{(s.revenue / 1000).toFixed(0)}K
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-0">
            {breakdown && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Recurrente</span>
                  </div>
                  <p className="text-xl font-bold text-green-500">€{(breakdown.recurring / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Expansión</span>
                  </div>
                  <p className="text-xl font-bold text-blue-500">€{(breakdown.expansion / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Nuevo Negocio</span>
                  </div>
                  <p className="text-xl font-bold text-purple-500">€{(breakdown.new_business / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Impacto Churn</span>
                  </div>
                  <p className="text-xl font-bold text-destructive">-€{(Math.abs(breakdown.churn_impact) / 1000).toFixed(0)}K</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cohorts" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {cohorts.map((cohort) => (
                  <div key={cohort.cohort} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{cohort.cohort}</span>
                      <Badge variant="outline">LTV: €{(cohort.ltv_predicted / 1000).toFixed(0)}K</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Retención</span>
                        <p className="font-medium">{cohort.retention_rate}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expansión</span>
                        <p className="font-medium">{cohort.expansion_rate}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Payback</span>
                        <p className="font-medium">{cohort.months_to_payback}m</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RevenueForecastPanel;
