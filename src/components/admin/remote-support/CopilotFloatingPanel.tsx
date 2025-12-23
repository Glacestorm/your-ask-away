import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  RefreshCw, 
  Shield, 
  AlertTriangle, 
  Lightbulb, 
  FileText,
  X,
  Sparkles,
  TrendingUp,
  Activity,
  Zap,
  Brain,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  MessageSquare
} from 'lucide-react';
import { useSupportCopilot, SessionContext, SessionSummary, ActionAnalysis } from '@/hooks/admin/useSupportCopilot';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CopilotFloatingPanelProps {
  sessionContext: SessionContext | null;
  onActionAnalyzed?: (analysis: ActionAnalysis) => void;
  className?: string;
}

export function CopilotFloatingPanel({ 
  sessionContext, 
  onActionAnalyzed,
  className 
}: CopilotFloatingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [predictions, setPredictions] = useState<{
    predictions: Array<{ issue: string; probability: number; preventiveAction: string; severity: string }>;
    sessionHealthScore: number;
    alerts: string[];
  } | null>(null);
  const [pendingActionAnalysis, setPendingActionAnalysis] = useState<ActionAnalysis | null>(null);
  
  const {
    isLoading,
    suggestions,
    riskAssessment,
    nextBestActions,
    lastRefresh,
    getSuggestions,
    analyzeAction,
    generateSummary,
    predictIssues,
    dismissSuggestion,
    startAutoRefresh,
    stopAutoRefresh
  } = useSupportCopilot();

  useEffect(() => {
    if (sessionContext) {
      startAutoRefresh(sessionContext, 90000); // Refresh every 90 seconds
    } else {
      stopAutoRefresh();
    }
    return () => stopAutoRefresh();
  }, [sessionContext?.sessionId]);

  const handleRefresh = useCallback(async () => {
    if (sessionContext) {
      await getSuggestions(sessionContext);
    }
  }, [sessionContext, getSuggestions]);

  const handleGenerateSummary = useCallback(async () => {
    if (sessionContext) {
      const result = await generateSummary(sessionContext);
      if (result) {
        setSessionSummary(result);
        setActiveTab('summary');
      }
    }
  }, [sessionContext, generateSummary]);

  const handlePredictIssues = useCallback(async () => {
    if (sessionContext) {
      const result = await predictIssues(sessionContext);
      if (result) {
        setPredictions(result);
        setActiveTab('predictions');
      }
    }
  }, [sessionContext, predictIssues]);

  const handleAnalyzeAction = useCallback(async (actionType: string, description: string) => {
    const result = await analyzeAction(actionType, description);
    if (result) {
      setPendingActionAnalysis(result);
      onActionAnalyzed?.(result);
      
      if (result.riskLevel === 'critical' || result.riskLevel === 'high') {
        toast.warning(`Acción de riesgo ${result.riskLevel === 'critical' ? 'crítico' : 'alto'} detectada`, {
          description: result.recommendations[0] || 'Revise antes de continuar'
        });
      }
    }
    return result;
  }, [analyzeAction, onActionAnalyzed]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  if (!sessionContext) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Copiloto IA inactivo
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
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Copiloto IA
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
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
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="suggestions" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Sugerencias
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Predicciones
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Resumen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              {/* Risk Assessment Card */}
              {riskAssessment && (
                <div className={cn("p-3 rounded-lg mb-3", getRiskColor(riskAssessment.level))}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Nivel de Riesgo
                    </span>
                    <Badge variant="outline">
                      {riskAssessment.level === 'high' ? 'Alto' : 
                       riskAssessment.level === 'medium' ? 'Medio' : 'Bajo'}
                    </Badge>
                  </div>
                  <p className="text-xs opacity-80">{riskAssessment.recommendation}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {riskAssessment.factors.map((factor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions List */}
              <div className="space-y-2">
                {isLoading && suggestions.length === 0 ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin sugerencias</p>
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 mt-0.5 text-primary" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-sm font-medium">{suggestion.title}</h5>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => dismissSuggestion(suggestion.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Next Best Actions */}
              {nextBestActions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    Acciones Recomendadas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {nextBestActions.map((action, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              {pendingActionAnalysis ? (
                <div className="space-y-4">
                  <div className={cn("p-4 rounded-lg", getRiskColor(pendingActionAnalysis.riskLevel))}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Análisis de Acción</span>
                      <Badge variant="outline">
                        Riesgo: {pendingActionAnalysis.riskScore}/100
                      </Badge>
                    </div>
                    <Progress 
                      value={pendingActionAnalysis.riskScore} 
                      className="h-2 mb-3"
                    />
                    
                    {pendingActionAnalysis.requiresApproval && (
                      <div className="flex items-center gap-2 text-sm text-orange-500 mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        Requiere aprobación dual
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm">{pendingActionAnalysis.betterDescription}</p>
                      
                      {pendingActionAnalysis.complianceFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pendingActionAnalysis.complianceFlags.map((flag, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Recomendaciones</h5>
                    {pendingActionAnalysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Registra una acción para ver el análisis</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="predictions" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              {predictions ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Salud de Sesión</span>
                      <span className={cn("text-2xl font-bold", getHealthColor(predictions.sessionHealthScore))}>
                        {predictions.sessionHealthScore}%
                      </span>
                    </div>
                    <Progress 
                      value={predictions.sessionHealthScore} 
                      className="h-3"
                    />
                  </div>

                  {predictions.alerts.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-yellow-600">Alertas Activas</h5>
                      {predictions.alerts.map((alert, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          {alert}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Predicciones</h5>
                    {predictions.predictions.map((pred, i) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{pred.issue}</span>
                          <Badge variant={
                            pred.probability >= 70 ? 'destructive' : 
                            pred.probability >= 40 ? 'secondary' : 'outline'
                          }>
                            {pred.probability}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{pred.preventiveAction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={handlePredictIssues} disabled={isLoading}>
                    <Activity className="h-4 w-4 mr-2" />
                    Analizar Predicciones
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="summary" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              {sessionSummary ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Puntuación de Calidad</span>
                      <Badge variant={sessionSummary.qualityScore >= 70 ? 'default' : 'secondary'}>
                        {sessionSummary.qualityScore}/100
                      </Badge>
                    </div>
                    <p className="text-sm">{sessionSummary.executiveSummary}</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Acciones Clave</h5>
                    {sessionSummary.keyActions.map((action, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {action}
                      </div>
                    ))}
                  </div>

                  {sessionSummary.risksIdentified.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-yellow-600">Riesgos Identificados</h5>
                      {sessionSummary.risksIdentified.map((risk, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-yellow-600">
                          <AlertTriangle className="h-4 w-4" />
                          {risk}
                        </div>
                      ))}
                    </div>
                  )}

                  {sessionSummary.followUpRequired && (
                    <div className="p-3 rounded-lg bg-blue-500/10 text-sm">
                      <div className="flex items-center gap-2 text-blue-600 font-medium mb-1">
                        <Clock className="h-4 w-4" />
                        Seguimiento Requerido
                      </div>
                      <p className="text-muted-foreground">{sessionSummary.followUpNotes}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Recomendaciones</h5>
                    {sessionSummary.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={handleGenerateSummary} disabled={isLoading}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Resumen IA
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CopilotFloatingPanel;
