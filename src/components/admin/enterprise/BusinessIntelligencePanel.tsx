/**
 * BusinessIntelligencePanel
 * Panel de Business Intelligence con IA Predictiva
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Brain, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  Sparkles,
  Download,
  BarChart3,
  LineChart,
  Lightbulb,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useBusinessIntelligence, type BIContext } from '@/hooks/admin/useBusinessIntelligence';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface BusinessIntelligencePanelProps {
  context?: BIContext;
  className?: string;
}

export function BusinessIntelligencePanel({ 
  context = { organizationId: 'default', timeRange: '30d', includeInsights: true, includePredictions: true },
  className 
}: BusinessIntelligencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('kpis');
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const {
    isLoading,
    kpis,
    insights,
    predictions,
    correlations,
    error,
    lastRefresh,
    getAnalyticsData,
    generateInsights,
    askQuestion,
    exportData,
    startAutoRefresh,
    stopAutoRefresh
  } = useBusinessIntelligence();

  // Auto-refresh cada 90 segundos
  useEffect(() => {
    startAutoRefresh(context, 90000);
    return () => stopAutoRefresh();
  }, [context.organizationId, context.timeRange]);

  const handleRefresh = useCallback(async () => {
    await getAnalyticsData(context);
  }, [context, getAnalyticsData]);

  const handleAskQuestion = useCallback(async () => {
    if (!question.trim()) {
      toast.error('Escribe una pregunta');
      return;
    }
    setIsAsking(true);
    setAiAnswer(null);
    const answer = await askQuestion(question, { timeRange: context.timeRange });
    if (answer) {
      setAiAnswer(answer);
    }
    setIsAsking(false);
  }, [question, context, askQuestion]);

  const handleExport = useCallback(async (format: 'csv' | 'json' | 'excel') => {
    await exportData('all', format);
    toast.success(`Datos exportados en formato ${format.toUpperCase()}`);
  }, [exportData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <span className="text-muted-foreground">—</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">Alta</Badge>;
      case 'medium': return <Badge className="bg-yellow-500 text-black">Media</Badge>;
      default: return <Badge variant="secondary">Baja</Badge>;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Business Intelligence
                <Badge variant="outline" className="text-xs">
                  {kpis.length} KPIs
                </Badge>
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
              onClick={() => handleExport('csv')}
              className="h-8 w-8"
              title="Exportar CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
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
        {error ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error.message}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-3">
              <TabsTrigger value="kpis" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                KPIs
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">
                <Lightbulb className="h-3 w-3 mr-1" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="predictions" className="text-xs">
                <LineChart className="h-3 w-3 mr-1" />
                Predicciones
              </TabsTrigger>
              <TabsTrigger value="ask" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                Preguntar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kpis" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {kpis.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mb-2" />
                    <p className="text-sm">Cargando KPIs...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {kpis.map((kpi) => (
                      <div key={kpi.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{kpi.name}</span>
                          {getTrendIcon(kpi.trend)}
                        </div>
                        <p className="text-xl font-bold">{kpi.value}{kpi.unit}</p>
                        {kpi.change !== undefined && (
                          <p className={cn(
                            "text-xs",
                            kpi.change >= 0 ? "text-green-600" : "text-destructive"
                          )}>
                            {kpi.change >= 0 ? '+' : ''}{kpi.change}% vs anterior
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => generateInsights(context)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar Nuevos Insights con IA
                  </Button>

                  {insights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Lightbulb className="h-8 w-8 mb-2" />
                      <p className="text-sm">Sin insights disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {insights.map((insight) => (
                        <div key={insight.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline" className="text-xs">{insight.type}</Badge>
                            {getPriorityBadge(insight.severity)}
                          </div>
                          <p className="text-sm font-medium mb-1">{insight.title}</p>
                          <p className="text-xs text-muted-foreground">{insight.description}</p>
                          {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                            <p className="text-xs text-primary mt-2">💡 {insight.suggestedActions[0]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="predictions" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {predictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <LineChart className="h-8 w-8 mb-2" />
                    <p className="text-sm">Sin predicciones disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {predictions.map((prediction) => (
                      <div key={prediction.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{prediction.metric}</span>
                          <Badge variant="outline">
                            {Math.round(prediction.confidence * 100)}% confianza
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {prediction.scenarios?.slice(0, 3).map((scenario, idx) => (
                            <div key={scenario.name} className={cn(
                              "p-2 rounded",
                              idx === 0 ? "bg-green-500/10" : idx === 1 ? "bg-blue-500/10" : "bg-orange-500/10"
                            )}>
                              <p className="text-muted-foreground">{scenario.name}</p>
                              <p className={cn(
                                "font-semibold",
                                idx === 0 ? "text-green-600" : idx === 1 ? "text-blue-600" : "text-orange-600"
                              )}>{scenario.value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Horizonte: {prediction.horizon}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ask" className="flex-1 mt-0">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Pregunta a la IA</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Haz preguntas sobre tus datos en lenguaje natural.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: ¿Cuáles son los clientes con mayor crecimiento?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAskQuestion}
                      disabled={isAsking || !question.trim()}
                    >
                      {isAsking ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {aiAnswer && (
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Respuesta IA</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiAnswer}</p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-2">Ejemplos de preguntas:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>¿Cuál es la tendencia de ventas este trimestre?</li>
                    <li>¿Qué productos tienen mejor margen?</li>
                    <li>¿Cuántos clientes nuevos hay este mes?</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default BusinessIntelligencePanel;
