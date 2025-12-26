import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Brain,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
  Target,
  Award,
  Activity,
  ThumbsUp,
  ThumbsDown,
  Lightbulb
} from 'lucide-react';
import { useReinforcementLearning } from '@/hooks/admin/support/useReinforcementLearning';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReinforcementLearningDashboardProps {
  selectedAgentKey?: string;
  className?: string;
}

export function ReinforcementLearningDashboard({ 
  selectedAgentKey,
  className 
}: ReinforcementLearningDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    isLoading,
    feedback,
    patterns,
    metrics,
    fetchFeedback,
    fetchPatterns,
    fetchMetrics,
    getAgentPerformance
  } = useReinforcementLearning();

  useEffect(() => {
    fetchFeedback(selectedAgentKey);
    fetchPatterns(selectedAgentKey);
    fetchMetrics(selectedAgentKey);
  }, [selectedAgentKey, fetchFeedback, fetchPatterns, fetchMetrics]);

  const performance = selectedAgentKey ? getAgentPerformance(selectedAgentKey) : null;

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPatternTypeIcon = (type: string) => {
    switch (type) {
      case 'success_pattern': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'failure_pattern': return <TrendingDown className="h-4 w-4 text-red-400" />;
      case 'escalation_pattern': return <Activity className="h-4 w-4 text-yellow-400" />;
      case 'optimization': return <Zap className="h-4 w-4 text-blue-400" />;
      case 'context_rule': return <Target className="h-4 w-4 text-purple-400" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'explicit_rating': return <Star className="h-4 w-4 text-yellow-400" />;
      case 'implicit_signal': return <Activity className="h-4 w-4 text-blue-400" />;
      case 'outcome_based': return <Target className="h-4 w-4 text-green-400" />;
      case 'correction': return <Zap className="h-4 w-4 text-orange-400" />;
      case 'escalation_trigger': return <TrendingUp className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Aprendizaje por Refuerzo
                <Badge variant="outline" className="text-xs">RL</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {patterns.length} patrones • {feedback.length} feedbacks
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              fetchFeedback(selectedAgentKey);
              fetchPatterns(selectedAgentKey);
              fetchMetrics(selectedAgentKey);
            }}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="overview" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Patrones
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              Recompensas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Tasa de Éxito</span>
                </div>
                <p className="text-2xl font-bold text-green-400">
                  {performance?.successRate.toFixed(1) || 0}%
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-yellow-500/10 to-amber-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">Rating Promedio</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {performance?.avgUserRating.toFixed(1) || 0}/5
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Score Outcome</span>
                </div>
                <p className={cn("text-2xl font-bold", getScoreColor(performance?.avgOutcomeScore || 0))}>
                  {((performance?.avgOutcomeScore || 0) * 100).toFixed(0)}%
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-purple-500/10 to-violet-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Patrones Activos</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">
                  {performance?.patternsCount || patterns.length}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg border">
              <h4 className="text-sm font-medium mb-2">Métricas por Período</h4>
              <div className="space-y-2">
                {metrics.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{m.metric_date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-green-400">{m.successful_tasks} éxitos</span>
                      <span className="text-red-400">{m.failed_tasks} fallos</span>
                      <span className="text-yellow-400">{m.escalated_tasks} escalados</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {patterns.map((pattern) => (
                  <div 
                    key={pattern.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getPatternTypeIcon(pattern.pattern_type)}
                        <div>
                          <p className="font-medium text-sm">{pattern.pattern_name}</p>
                          <p className="text-xs text-muted-foreground">{pattern.pattern_description}</p>
                        </div>
                      </div>
                      <Badge 
                        className={cn(
                          "text-xs",
                          pattern.is_active 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        {pattern.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-green-400" />
                        {pattern.success_count} éxitos
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3 text-red-400" />
                        {pattern.failure_count} fallos
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-400" />
                        +{(pattern.confidence_boost * 100).toFixed(0)}% confianza
                      </span>
                    </div>

                    {pattern.last_applied_at && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Última aplicación: {formatDistanceToNow(new Date(pattern.last_applied_at), { locale: es, addSuffix: true })}
                      </p>
                    )}
                  </div>
                ))}

                {patterns.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay patrones aprendidos</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="feedback" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {feedback.slice(0, 20).map((fb) => (
                  <div 
                    key={fb.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFeedbackIcon(fb.feedback_type)}
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {fb.feedback_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Agente: {fb.agent_key}
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "text-sm font-bold",
                        fb.outcome_score >= 0.5 ? "text-green-400" : "text-red-400"
                      )}>
                        {fb.outcome_score >= 0 ? '+' : ''}{(fb.outcome_score * 100).toFixed(0)}%
                      </div>
                    </div>
                    
                    {fb.feedback_text && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {fb.feedback_text}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {fb.user_rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star}
                                className={cn(
                                  "h-3 w-3",
                                  star <= fb.user_rating! ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                        )}
                        {fb.applied_to_training && (
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                            Aplicado
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(fb.created_at), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}

                {feedback.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay feedback registrado</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rewards" className="mt-0">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  Sistema de Recompensas
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resolución Automática</span>
                    <Badge className="bg-green-500/20 text-green-400">+1.0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Satisfacción Usuario ≥4</span>
                    <Badge className="bg-green-500/20 text-green-400">+0.5</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tiempo &lt; Promedio</span>
                    <Badge className="bg-blue-500/20 text-blue-400">+0.3</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Escalación Necesaria</span>
                    <Badge className="bg-yellow-500/20 text-yellow-400">-0.2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fallo de Resolución</span>
                    <Badge className="bg-red-500/20 text-red-400">-0.5</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <h4 className="text-sm font-medium mb-3">Distribución de Recompensas</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20">Positivas</span>
                    <Progress value={feedback.filter(f => f.outcome_score > 0).length / Math.max(1, feedback.length) * 100} className="flex-1 h-2" />
                    <span className="text-xs text-green-400">{feedback.filter(f => f.outcome_score > 0).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20">Negativas</span>
                    <Progress value={feedback.filter(f => f.outcome_score < 0).length / Math.max(1, feedback.length) * 100} className="flex-1 h-2 [&>div]:bg-red-500" />
                    <span className="text-xs text-red-400">{feedback.filter(f => f.outcome_score < 0).length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20">Neutrales</span>
                    <Progress value={feedback.filter(f => f.outcome_score === 0).length / Math.max(1, feedback.length) * 100} className="flex-1 h-2 [&>div]:bg-gray-500" />
                    <span className="text-xs text-gray-400">{feedback.filter(f => f.outcome_score === 0).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ReinforcementLearningDashboard;
