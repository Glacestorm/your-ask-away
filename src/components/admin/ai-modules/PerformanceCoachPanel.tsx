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
  Lightbulb,
  Award
} from 'lucide-react';
import { usePerformanceCoach } from '@/hooks/admin/usePerformanceCoach';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PerformanceCoachPanelProps {
  context?: {
    entityId: string;
    entityName?: string;
  } | null;
  className?: string;
}

export function PerformanceCoachPanel({ 
  context, 
  className 
}: PerformanceCoachPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('coaching');

  const {
    isLoading,
    coachingTips,
    performanceMetrics,
    goals,
    lastRefresh,
    getCoachingTips,
    getPerformanceMetrics,
    setGoal
  } = usePerformanceCoach();

  useEffect(() => {
    if (context?.entityId) {
      getCoachingTips(context.entityId);
      getPerformanceMetrics(context.entityId);
    }
  }, [context?.entityId, getCoachingTips, getPerformanceMetrics]);

  const handleRefresh = useCallback(async () => {
    if (context?.entityId) {
      await getCoachingTips(context.entityId);
      await getPerformanceMetrics(context.entityId);
    }
  }, [context, getCoachingTips, getPerformanceMetrics]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un usuario para coaching personalizado
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
      <CardHeader className="pb-2 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Performance Coach IA</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Analizando...'
                }
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
            <TabsTrigger value="coaching" className="text-xs">Coaching</TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">Métricas</TabsTrigger>
            <TabsTrigger value="goals" className="text-xs">Objetivos</TabsTrigger>
          </TabsList>

          <TabsContent value="coaching" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {coachingTips.map((tip, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        tip.priority === 'high' ? 'bg-red-500/20' :
                        tip.priority === 'medium' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                      )}>
                        <Lightbulb className={cn(
                          "h-4 w-4",
                          tip.priority === 'high' ? 'text-red-500' :
                          tip.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tip.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                        <Badge variant="outline" className="text-xs mt-2">{tip.category}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {coachingTips.length === 0 && (
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
                {performanceMetrics.map((metric, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className={cn(
                          "h-4 w-4",
                          metric.trend > 0 ? 'text-green-500' : 'text-red-500'
                        )} />
                        <span className={cn(
                          "text-xs font-medium",
                          metric.trend > 0 ? 'text-green-500' : 'text-red-500'
                        )}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend}%
                        </span>
                      </div>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Actual: {metric.value}%</span>
                      <span className="text-xs text-muted-foreground">Meta: {metric.target}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="goals" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {goals.map((goal, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{goal.title}</span>
                      </div>
                      <Badge 
                        variant={goal.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {goal.status === 'completed' ? (
                          <><Award className="h-3 w-3 mr-1" /> Completado</>
                        ) : (
                          `${goal.progress}%`
                        )}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Fecha límite: {new Date(goal.deadline).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
                {goals.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Sin objetivos configurados
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setGoal({ title: 'Nuevo objetivo', target: 100, deadline: new Date().toISOString() })}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Crear Objetivo
                    </Button>
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

export default PerformanceCoachPanel;
