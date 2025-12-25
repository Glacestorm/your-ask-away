import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  TrendingDown, 
  AlertTriangle,
  Users,
  DollarSign,
  Shield,
  Target
} from 'lucide-react';
import { usePredictiveChurn } from '@/hooks/admin/predictive';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function ChurnPredictionPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const { predictions, analytics, isLoading, predictChurn } = usePredictiveChurn();

  useEffect(() => {
    predictChurn();
  }, [predictChurn]);

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 bg-gradient-to-r from-destructive/10 via-orange-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-destructive to-orange-500">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Predicción de Churn</CardTitle>
              <p className="text-xs text-muted-foreground">Análisis predictivo de abandono</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => predictChurn()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="overview" className="text-xs">Resumen</TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">Predicciones</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Acciones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            {analytics && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">En Riesgo</span>
                  </div>
                  <p className="text-xl font-bold">{analytics.total_at_risk}</p>
                  <p className="text-xs text-destructive">{analytics.critical_count} críticos</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Revenue en Riesgo</span>
                  </div>
                  <p className="text-xl font-bold">€{(analytics.revenue_at_risk / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Prob. Media</span>
                  </div>
                  <p className="text-xl font-bold">{analytics.avg_churn_probability?.toFixed(0)}%</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Éxito Intervención</span>
                  </div>
                  <p className="text-xl font-bold">{analytics.intervention_success_rate?.toFixed(0)}%</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {predictions.map((pred) => (
                  <div key={pred.company_id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{pred.company_name}</span>
                      <Badge className={getSeverityColor(pred.risk_level)}>{pred.risk_level}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Progress value={pred.churn_probability} className="flex-1 h-2" />
                      <span className="text-xs font-medium">{pred.churn_probability}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ~{pred.days_to_churn} días • Confianza: {pred.confidence}%
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {predictions.slice(0, 5).flatMap((pred) => 
                  pred.recommended_actions?.slice(0, 2).map((action, idx) => (
                    <div key={`${pred.company_id}-${idx}`} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className={cn("h-4 w-4 mt-0.5", 
                          action.priority === 'urgent' ? 'text-destructive' : 'text-yellow-500'
                        )} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{pred.company_name}</p>
                          <p className="text-xs text-muted-foreground">{action.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{action.priority}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Impacto: {action.expected_impact}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ChurnPredictionPanel;
