import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bot, 
  RefreshCw, 
  Shield, 
  AlertTriangle, 
  Lightbulb, 
  CheckSquare, 
  Clock, 
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';
import { useSupportCopilot, CopilotSuggestion, SessionContext } from '@/hooks/admin/useSupportCopilot';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SupportAIAssistantProps {
  sessionContext: SessionContext | null;
  onActionSuggested?: (action: string) => void;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Shield,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  Clock,
  FileText
};

const typeColors: Record<string, string> = {
  action: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  tip: 'bg-green-500/10 text-green-500 border-green-500/20',
  checklist: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

export function SupportAIAssistant({ 
  sessionContext, 
  onActionSuggested,
  className 
}: SupportAIAssistantProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPredictions, setShowPredictions] = useState(false);
  
  const {
    isLoading,
    suggestions,
    riskAssessment,
    nextBestActions,
    lastRefresh,
    getSuggestions,
    predictIssues,
    dismissSuggestion,
    startAutoRefresh,
    stopAutoRefresh
  } = useSupportCopilot();

  const [predictions, setPredictions] = useState<{
    predictions: Array<{ issue: string; probability: number; preventiveAction: string; severity: string }>;
    sessionHealthScore: number;
    alerts: string[];
  } | null>(null);

  // Refresh suggestions when session context changes
  useEffect(() => {
    if (sessionContext) {
      startAutoRefresh(sessionContext, 120000); // Refresh every 2 minutes
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

  const handlePredictIssues = useCallback(async () => {
    if (sessionContext) {
      const result = await predictIssues(sessionContext);
      if (result) {
        setPredictions(result);
        setShowPredictions(true);
      }
    }
  }, [sessionContext, predictIssues]);

  const handleApplySuggestion = (suggestion: CopilotSuggestion) => {
    if (onActionSuggested && suggestion.type === 'action') {
      onActionSuggested(suggestion.title);
    }
    dismissSuggestion(suggestion.id);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  if (!sessionContext) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-8 text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Inicia una sesión para activar el Copiloto IA
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Copiloto IA
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Cargando sugerencias...'
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
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-4 space-y-4">
            {/* Risk Assessment */}
            {riskAssessment && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Evaluación de Riesgo
                  </span>
                  <Badge 
                    variant="outline" 
                    className={getRiskColor(riskAssessment.level)}
                  >
                    {riskAssessment.level === 'high' ? 'Alto' : 
                     riskAssessment.level === 'medium' ? 'Medio' : 'Bajo'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {riskAssessment.recommendation}
                </p>
                {riskAssessment.factors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {riskAssessment.factors.map((factor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Sugerencias Inteligentes</h4>
                <Badge variant="secondary" className="text-xs">
                  {suggestions.length}
                </Badge>
              </div>
              
              <ScrollArea className="h-[250px] pr-3">
                <div className="space-y-2">
                  {isLoading && suggestions.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin sugerencias activas</p>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => {
                      const IconComponent = iconMap[suggestion.icon] || Lightbulb;
                      return (
                        <div
                          key={suggestion.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all hover:shadow-sm",
                            typeColors[suggestion.type]
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="text-sm font-medium truncate">
                                  {suggestion.title}
                                </h5>
                                <div className="flex items-center gap-1">
                                  <div 
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      priorityColors[suggestion.priority]
                                    )}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => dismissSuggestion(suggestion.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-xs mt-1 line-clamp-2 opacity-80">
                                {suggestion.description}
                              </p>
                              {suggestion.type === 'action' && onActionSuggested && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="mt-2 h-7 text-xs"
                                  onClick={() => handleApplySuggestion(suggestion)}
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  Aplicar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Next Best Actions */}
            {nextBestActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Próximas Acciones Recomendadas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {nextBestActions.map((action, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => onActionSuggested?.(action)}
                    >
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Predictions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handlePredictIssues}
                disabled={isLoading}
              >
                <Activity className="h-4 w-4 mr-2" />
                Predecir Posibles Problemas
              </Button>

              {showPredictions && predictions && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Salud de Sesión</span>
                    <Badge 
                      variant={predictions.sessionHealthScore >= 70 ? 'default' : 'destructive'}
                    >
                      {predictions.sessionHealthScore}%
                    </Badge>
                  </div>
                  
                  {predictions.alerts.length > 0 && (
                    <div className="space-y-1">
                      {predictions.alerts.map((alert, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-2 text-xs text-yellow-600"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {alert}
                        </div>
                      ))}
                    </div>
                  )}

                  {predictions.predictions.length > 0 && (
                    <div className="space-y-2">
                      {predictions.predictions.map((pred, i) => (
                        <div 
                          key={i}
                          className="p-2 rounded bg-background text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{pred.issue}</span>
                            <Badge variant="outline" className="text-xs">
                              {pred.probability}%
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">
                            {pred.preventiveAction}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default SupportAIAssistant;
