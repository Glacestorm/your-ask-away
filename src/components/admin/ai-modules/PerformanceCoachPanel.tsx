import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Trophy,
  Target,
  TrendingUp,
  Maximize2,
  Minimize2,
  Lightbulb
} from 'lucide-react';
import { usePerformanceCoach } from '@/hooks/admin/usePerformanceCoach';
import { cn } from '@/lib/utils';

interface PerformanceCoachPanelProps {
  context?: { entityId: string; entityName?: string } | null;
  className?: string;
}

export function PerformanceCoachPanel({ context, className }: PerformanceCoachPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('coaching');

  const {
    isLoading,
    metrics,
    insights,
    growthPlan,
    analyzePerformance,
    fetchGrowthPlan,
    getCategoryColor
  } = usePerformanceCoach();

  useEffect(() => {
    if (context?.entityId) {
      analyzePerformance(context.entityId);
      fetchGrowthPlan(context.entityId);
    }
  }, [context?.entityId, analyzePerformance, fetchGrowthPlan]);

  const handleRefresh = useCallback(async () => {
    if (context?.entityId) {
      await analyzePerformance(context.entityId);
      await fetchGrowthPlan(context.entityId);
    }
  }, [context, analyzePerformance, fetchGrowthPlan]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un usuario para coaching</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Performance Coach IA</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="coaching" className="text-xs">Coaching</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Métricas</TabsTrigger>
            <TabsTrigger value="plan" className="text-xs">Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="coaching" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className={cn("p-1.5 rounded-lg", insight.priority === 'high' ? 'bg-red-500/20' : insight.priority === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20')}>
                        <Lightbulb className={cn("h-4 w-4", getCategoryColor(insight.category))} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        <Badge variant="outline" className="text-xs mt-2">{insight.category}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {insights.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Analizando rendimiento...</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metrics" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-3">
                {metrics.map((metric, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{metric.metric_name}</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={cn("h-4 w-4", metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-yellow-500')} />
                      </div>
                    </div>
                    <Progress value={(metric.current_value / metric.target_value) * 100} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Actual: {metric.current_value}</span>
                      <span className="text-xs text-muted-foreground">Meta: {metric.target_value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="plan" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {growthPlan ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <h4 className="font-medium text-sm mb-2">{growthPlan.title}</h4>
                    <Progress value={growthPlan.progress_percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{growthPlan.progress_percentage}% completado</p>
                  </div>
                  {growthPlan.objectives.map((obj, idx) => (
                    <div key={idx} className="p-2 rounded-lg border bg-muted/30 flex items-center gap-2">
                      <Target className={cn("h-4 w-4", obj.completed ? 'text-green-500' : 'text-muted-foreground')} />
                      <span className={cn("text-sm", obj.completed && 'line-through text-muted-foreground')}>{obj.description}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Sin plan de crecimiento</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PerformanceCoachPanel;
