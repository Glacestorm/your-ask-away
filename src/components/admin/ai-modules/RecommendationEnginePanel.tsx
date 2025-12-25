import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Lightbulb, ThumbsUp, ThumbsDown, Maximize2, Minimize2, Star } from 'lucide-react';
import { useRecommendationEngine } from '@/hooks/admin/useRecommendationEngine';
import { cn } from '@/lib/utils';

interface RecommendationEnginePanelProps {
  context?: { entityId: string } | null;
  className?: string;
}

export function RecommendationEnginePanel({ context, className }: RecommendationEnginePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLoading, recommendations, getRecommendations, submitFeedback } = useRecommendationEngine();

  useEffect(() => {
    if (context?.entityId) getRecommendations(context.entityId, 'customer');
  }, [context?.entityId, getRecommendations]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Lightbulb className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un contexto para recomendaciones</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Recommendation Engine</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => getRecommendations(context.entityId, 'customer')} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="font-medium text-sm">{rec.title}</span>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs">{Math.round(rec.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => submitFeedback({ recommendation_id: rec.id, accepted: true })}>
                      <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => submitFeedback({ recommendation_id: rec.id, accepted: false })}>
                      <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                <p className="text-sm">Generando recomendaciones...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default RecommendationEnginePanel;
