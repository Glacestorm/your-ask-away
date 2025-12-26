import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Heart, 
  Mic, 
  MessageSquare, 
  Video,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Smile,
  Frown,
  Meh,
  Zap,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useEmotionalAnalysis } from '@/hooks/admin/support/useEmotionalAnalysis';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmotionalAnalysisPanelProps {
  sessionId?: string;
  customerId?: string;
  className?: string;
}

export function EmotionalAnalysisPanel({ sessionId, customerId, className }: EmotionalAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState('realtime');
  const [isMonitoring, setIsMonitoring] = useState(false);

  const {
    isAnalyzing,
    currentState,
    timeline,
    abandonmentRisk,
    adaptiveResponse,
    analyzeText,
    getEmotionalTrends
  } = useEmotionalAnalysis();

  const currentEmotion = currentState ? {
    primary: currentState.dominantEmotion,
    intensity: Math.round(currentState.overallSentiment * 100),
    confidence: Math.round(currentState.confidence * 100),
    trend: 0,
    secondary: []
  } : null;

  const emotionHistory = timeline?.emotions || [];
  const agentRecommendations = adaptiveResponse?.recommendations || [];

  useEffect(() => {
    if (customerId) {
      getEmotionalTrends(customerId, 'week');
    }
  }, [customerId, getEmotionalTrends]);

  const handleAnalyzeText = useCallback(async (text: string) => {
    await analyzeText(text);
  }, [analyzeText]);

  const getEmotionIcon = (emotion: string) => {
    switch (emotion?.toLowerCase()) {
      case 'happy':
      case 'satisfied':
      case 'positive':
        return <Smile className="h-5 w-5 text-green-400" />;
      case 'frustrated':
      case 'angry':
      case 'negative':
        return <Frown className="h-5 w-5 text-red-400" />;
      default:
        return <Meh className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (risk >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-green-400 bg-green-500/20 border-green-500/30';
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-pink-600/20 via-rose-600/20 to-red-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Análisis Emocional
                <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 text-xs">
                  Multimodal
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Detección en tiempo real: voz + texto + video
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Monitoreo</span>
              <Switch 
                checked={isMonitoring} 
                onCheckedChange={setIsMonitoring}
              />
            </div>
          </div>
        </div>

        {/* Current Emotional State */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <div className="flex justify-center mb-1">
              {currentEmotion ? getEmotionIcon(currentEmotion.primary) : <Meh className="h-5 w-5 text-muted-foreground" />}
            </div>
            <p className="text-xs font-medium capitalize">{currentEmotion?.primary || 'Neutro'}</p>
            <p className="text-xs text-muted-foreground">Emoción</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            <Activity className="h-5 w-5 mx-auto text-cyan-400 mb-1" />
            <p className="text-sm font-bold">{currentEmotion?.intensity || 0}%</p>
            <p className="text-xs text-muted-foreground">Intensidad</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border text-center",
            getRiskColor(abandonmentRisk?.score || 0)
          )}>
            <AlertTriangle className="h-5 w-5 mx-auto mb-1" />
            <p className="text-sm font-bold">{abandonmentRisk?.score || 0}%</p>
            <p className="text-xs opacity-80">Riesgo Abandono</p>
          </div>
          <div className="p-2 rounded-lg bg-background/50 border text-center">
            {(currentEmotion?.trend || 0) > 0 ? (
              <TrendingUp className="h-5 w-5 mx-auto text-green-400 mb-1" />
            ) : (
              <TrendingDown className="h-5 w-5 mx-auto text-red-400 mb-1" />
            )}
            <p className="text-sm font-bold">{currentEmotion?.trend || 0}%</p>
            <p className="text-xs text-muted-foreground">Tendencia</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="realtime" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Tiempo Real
            </TabsTrigger>
            <TabsTrigger value="channels" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Canales
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Acciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4">
            {/* Real-time Emotion Display */}
            <div className="p-4 rounded-lg border bg-gradient-to-br from-card to-muted/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm">Estado Emocional Actual</h4>
                {isMonitoring && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    En vivo
                  </Badge>
                )}
              </div>

              {currentEmotion ? (
                <div className="space-y-3">
                  {/* Primary Emotion */}
                  <div className="flex items-center gap-3">
                    {getEmotionIcon(currentEmotion.primary)}
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{currentEmotion.primary}</span>
                        <span className="font-medium">{currentEmotion.confidence}%</span>
                      </div>
                      <Progress value={currentEmotion.confidence} className="h-2" />
                    </div>
                  </div>

                  {/* Secondary Emotions */}
                  {currentEmotion.secondary?.map((emotion: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 opacity-70">
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary/50" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize">{emotion.name}</span>
                          <span>{emotion.score}%</span>
                        </div>
                        <Progress value={emotion.score} className="h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inicia el monitoreo para ver el estado emocional</p>
                </div>
              )}
            </div>

            {/* Quick Test */}
            <div className="p-3 rounded-lg border bg-card">
              <h4 className="font-medium text-sm mb-2">Analizar Texto</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje para analizar..."
                  className="flex-1 px-3 py-2 text-sm rounded-md border bg-background"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAnalyzeText((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <Button size="sm" disabled={isAnalyzing}>
                  {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Analizar'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            {/* Multimodal Channels */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="p-3 rounded-full bg-blue-500/20 w-fit mx-auto mb-2">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
                <h4 className="font-medium text-sm">Texto</h4>
                <p className="text-xs text-muted-foreground mt-1">NLP + Sentiment</p>
                <Badge variant="outline" className="mt-2 text-xs">Activo</Badge>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="p-3 rounded-full bg-green-500/20 w-fit mx-auto mb-2">
                  <Mic className="h-6 w-6 text-green-400" />
                </div>
                <h4 className="font-medium text-sm">Voz</h4>
                <p className="text-xs text-muted-foreground mt-1">Tono + Prosodia</p>
                <Badge variant="outline" className="mt-2 text-xs">Disponible</Badge>
              </div>
              <div className="p-4 rounded-lg border bg-card text-center">
                <div className="p-3 rounded-full bg-purple-500/20 w-fit mx-auto mb-2">
                  <Video className="h-6 w-6 text-purple-400" />
                </div>
                <h4 className="font-medium text-sm">Video</h4>
                <p className="text-xs text-muted-foreground mt-1">Expresiones Faciales</p>
                <Badge variant="secondary" className="mt-2 text-xs">Premium</Badge>
              </div>
            </div>

            {/* Channel Weights */}
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium text-sm mb-3">Ponderación de Canales</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Texto</span>
                    <span>40%</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Voz</span>
                    <span>35%</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Video</span>
                    <span>25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <ScrollArea className="h-[280px]">
              {emotionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay historial emocional</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emotionHistory.map((entry, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getEmotionIcon(entry.emotion)}
                          <span className="font-medium text-sm capitalize">{entry.emotion}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.timestamp), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={entry.intensity} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground">{entry.intensity}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {/* Agent Recommendations */}
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Recomendaciones para el Agente
              </h4>
              {agentRecommendations.length > 0 ? (
                <div className="space-y-2">
                  {agentRecommendations.map((rec, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border text-sm",
                        rec.priority === 'high' ? 'bg-red-500/10 border-red-500/30' :
                        rec.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                        'bg-green-500/10 border-green-500/30'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5",
                          rec.priority === 'high' ? 'bg-red-400' :
                          rec.priority === 'medium' ? 'bg-yellow-400' :
                          'bg-green-400'
                        )} />
                        <div>
                          <p className="font-medium">{rec.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Las recomendaciones aparecerán basadas en el análisis emocional
                </p>
              )}
            </div>

            {/* Abandonment Prevention */}
            {abandonmentRisk && abandonmentRisk.riskScore >= 40 && (
              <div className={cn(
                "p-4 rounded-lg border",
                getRiskColor(abandonmentRisk.riskScore)
              )}>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alerta de Abandono
                </h4>
                <p className="text-xs opacity-80 mb-3">Riesgo detectado: {abandonmentRisk.riskLevel}</p>
                <div className="flex gap-2">
                  {abandonmentRisk.triggers?.slice(0, 2).map((trigger: string, idx: number) => (
                    <Button key={idx} size="sm" variant="secondary">
                      Atender: {trigger}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EmotionalAnalysisPanel;
