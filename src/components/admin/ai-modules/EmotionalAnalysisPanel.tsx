import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Heart, 
  TrendingUp,
  TrendingDown,
  Minus,
  Maximize2,
  Minimize2,
  Activity
} from 'lucide-react';
import { useEmotionalAnalysis, EmotionResult } from '@/hooks/admin/useEmotionalAnalysis';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmotionalAnalysisPanelProps {
  context?: {
    entityId: string;
    entityType: 'ticket' | 'email' | 'chat' | 'review' | 'feedback';
    text?: string;
  } | null;
  className?: string;
}

const emotionColors: Record<string, string> = {
  joy: 'bg-green-500',
  sadness: 'bg-blue-500',
  anger: 'bg-red-500',
  fear: 'bg-purple-500',
  surprise: 'bg-yellow-500',
  trust: 'bg-cyan-500',
  neutral: 'bg-gray-500',
};

const sentimentIcons = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
  mixed: Activity,
};

export function EmotionalAnalysisPanel({ context, className }: EmotionalAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isLoading,
    result,
    error,
    lastRefresh,
    analyzeText,
  } = useEmotionalAnalysis();

  useEffect(() => {
    if (context?.entityId && context?.text) {
      analyzeText({
        entityId: context.entityId,
        entityType: context.entityType,
        text: context.text
      });
    }
  }, [context?.entityId]);

  const handleRefresh = useCallback(async () => {
    if (context?.entityId && context?.text) {
      await analyzeText({
        entityId: context.entityId,
        entityType: context.entityType,
        text: context.text
      });
    }
  }, [context, analyzeText]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Heart className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Análisis emocional inactivo
          </p>
        </CardContent>
      </Card>
    );
  }

  const SentimentIcon = result?.emotion 
    ? sentimentIcons[result.emotion as keyof typeof sentimentIcons] || Minus
    : Minus;

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-pink-500/10 via-red-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-red-500">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Análisis Emocional IA</CardTitle>
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
        <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
          {error ? (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
              <Activity className="h-4 w-4 text-destructive" />
              {error}
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Sentiment Overview */}
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sentimiento General</span>
                  <Badge variant={result.emotion === 'positive' ? 'default' : result.emotion === 'negative' ? 'destructive' : 'secondary'}>
                    <SentimentIcon className="h-3 w-3 mr-1" />
                    {result.emotion === 'positive' ? 'Positivo' : result.emotion === 'negative' ? 'Negativo' : result.emotion === 'mixed' ? 'Mixto' : 'Neutral'}
                  </Badge>
                </div>
                <Progress value={result.confidence * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Confianza: {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>

              {/* Emotions Breakdown */}
              {result.emotions_detected && (
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium mb-3 block">Emociones Detectadas</span>
                  <div className="space-y-2">
                    {Object.entries(result.emotions_detected).map(([emotion, value]) => (
                      <div key={emotion} className="flex items-center gap-2">
                        <span className="text-xs capitalize w-20">{emotion}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", emotionColors[emotion] || 'bg-primary')}
                            style={{ width: `${(value as number) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {((value as number) * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-sm font-medium mb-2 block">Recomendaciones</span>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Heart className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Sin datos de análisis</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EmotionalAnalysisPanel;
