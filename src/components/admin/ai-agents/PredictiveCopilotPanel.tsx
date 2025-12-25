import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Brain,
  Settings,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';
import { usePredictiveCopilot, CopilotPrediction } from '@/hooks/admin/usePredictiveCopilot';
import { cn } from '@/lib/utils';

const suggestionIcons: Record<string, React.ReactNode> = {
  optimization: <Zap className="h-4 w-4" />,
  alert: <AlertCircle className="h-4 w-4" />,
  opportunity: <TrendingUp className="h-4 w-4" />,
  action: <Target className="h-4 w-4" />
};

const priorityColors: Record<number, string> = {
  1: 'bg-red-500/10 text-red-500 border-red-500/20',
  2: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  3: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
};

const priorityLabels: Record<number, string> = {
  1: 'high',
  2: 'medium',
  3: 'low'
};

export function PredictiveCopilotPanel() {
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState({
    is_enabled: true,
    learning_enabled: true
  });

  const {
    predictions,
    config,
    isLoading,
    fetchConfig,
    fetchSuggestions,
    updateConfig,
    executeSuggestion,
    provideFeedback
  } = usePredictiveCopilot();

  useEffect(() => {
    fetchConfig();
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (config) {
      setLocalConfig({
        is_enabled: config.is_enabled,
        learning_enabled: config.learning_enabled
      });
    }
  }, [config]);

  const handleExecuteSuggestion = async (suggestionId: string) => {
    await executeSuggestion(suggestionId);
    fetchSuggestions();
  };

  const handleFeedback = async (suggestionId: string, wasHelpful: boolean) => {
    await provideFeedback(suggestionId, { rating: wasHelpful ? 5 : 1, helpful: wasHelpful });
  };

  const handleConfigChange = async (key: string, value: boolean) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    await updateConfig({ [key]: value } as any);
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Copiloto Predictivo</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {predictions.length} sugerencias activas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className={cn("h-4 w-4", showSettings && "text-primary")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchSuggestions}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {showSettings ? (
          <div className="space-y-4 p-3 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Copiloto Activo</p>
                <p className="text-xs text-muted-foreground">Generar predicciones automáticas</p>
              </div>
              <Switch 
                checked={localConfig.is_enabled}
                onCheckedChange={(checked) => handleConfigChange('is_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aprendizaje Activo</p>
                <p className="text-xs text-muted-foreground">Aprender de tus patrones</p>
              </div>
              <Switch 
                checked={localConfig.learning_enabled}
                onCheckedChange={(checked) => handleConfigChange('learning_enabled', checked)}
              />
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[380px] pr-2">
            <div className="space-y-3">
              {predictions.map((prediction) => (
                <PredictionCard 
                  key={prediction.id}
                  prediction={prediction}
                  onExecute={handleExecuteSuggestion}
                  onFeedback={handleFeedback}
                />
              ))}

              {predictions.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin sugerencias activas</p>
                  <p className="text-xs mt-1">El copiloto está analizando patrones</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function PredictionCard({ 
  prediction, 
  onExecute, 
  onFeedback 
}: { 
  prediction: CopilotPrediction;
  onExecute: (id: string) => void;
  onFeedback: (id: string, helpful: boolean) => void;
}) {
  const data = prediction.prediction_data;
  const priority = data?.priority || 2;
  
  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all group">
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg border shrink-0",
          priorityColors[priority] || priorityColors[2]
        )}>
          {suggestionIcons[data?.type] || <Lightbulb className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium text-sm line-clamp-1">
              {data?.title || 'Sugerencia'}
            </p>
            <Badge 
              variant="outline" 
              className={cn("text-[10px] shrink-0", priorityColors[priority] || priorityColors[2])}
            >
              {priorityLabels[priority] || 'medium'}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {data?.description}
          </p>

          {prediction.confidence_score && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Confianza IA
                </span>
                <span>{Math.round(prediction.confidence_score * 100)}%</span>
              </div>
              <Progress value={prediction.confidence_score * 100} className="h-1" />
            </div>
          )}

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="sm" 
              className="h-7 text-xs flex-1"
              onClick={() => onExecute(prediction.id)}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Aplicar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onFeedback(prediction.id, true)}
            >
              👍
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onFeedback(prediction.id, false)}
            >
              👎
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PredictiveCopilotPanel;
