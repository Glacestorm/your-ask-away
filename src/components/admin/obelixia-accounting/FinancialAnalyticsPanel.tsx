/**
 * FinancialAnalyticsPanel - Fase 10: Advanced Financial Analytics & Executive Dashboard
 * Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Sparkles, 
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Brain,
  FileText,
  Maximize2,
  Minimize2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Zap
} from 'lucide-react';
import { useObelixiaFinancialAnalytics, ExecutiveKPI, BenchmarkAnalysis, StrategicInsight } from '@/hooks/admin/obelixia-accounting/useObelixiaFinancialAnalytics';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface FinancialAnalyticsPanelProps {
  className?: string;
}

export function FinancialAnalyticsPanel({ className }: FinancialAnalyticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('kpis');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<{
    answer: string;
    confidence: number;
    suggestedActions: string[];
  } | null>(null);
  const [askingAI, setAskingAI] = useState(false);

  const {
    isLoading,
    kpis,
    benchmarks,
    insights,
    health,
    error,
    lastRefresh,
    loadDashboard,
    askAIAnalyst,
    generateExecutiveReport
  } = useObelixiaFinancialAnalytics();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  const handleAskAI = useCallback(async () => {
    if (!aiQuestion.trim()) return;
    setAskingAI(true);
    const response = await askAIAnalyst(aiQuestion);
    if (response) {
      setAiResponse(response);
    }
    setAskingAI(false);
  }, [aiQuestion, askAIAnalyst]);

  const handleGenerateReport = useCallback(async () => {
    const report = await generateExecutiveReport('quarterly', 'pdf');
    if (report) {
      toast.success(`Informe "${report.title}" generado`);
    }
  }, [generateExecutiveReport]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      profitability: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      liquidity: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      efficiency: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      growth: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      risk: 'bg-red-500/10 text-red-600 border-red-500/20'
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const getHealthStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      excellent: 'text-emerald-600',
      good: 'text-green-600',
      fair: 'text-yellow-600',
      poor: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[status] || 'text-muted-foreground';
  };

  const getInsightIcon = (category: string) => {
    switch (category) {
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-emerald-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'action': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Analytics Ejecutivo
                <Badge variant="outline" className="text-[10px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                  <Sparkles className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Cargando...'
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
          <TabsList className="grid w-full grid-cols-5 mb-3">
            <TabsTrigger value="kpis" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="benchmarks" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Benchmark
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs">
              <Heart className="h-3 w-3 mr-1" />
              Salud
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Analista
            </TabsTrigger>
          </TabsList>

          {/* KPIs Tab */}
          <TabsContent value="kpis" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[350px]"}>
              {error ? (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {error}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kpis.map((kpi) => (
                    <div key={kpi.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{kpi.name}</p>
                          <Badge variant="outline" className={cn("text-[10px] mt-1", getCategoryColor(kpi.category))}>
                            {kpi.category}
                          </Badge>
                        </div>
                        {getTrendIcon(kpi.trend)}
                      </div>
                      
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold">{kpi.value.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                        <span className={cn(
                          "text-xs flex items-center",
                          kpi.changePercent >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {kpi.changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(kpi.changePercent).toFixed(1)}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Target: {kpi.target}{kpi.unit}</span>
                          <span>{kpi.targetProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={kpi.targetProgress} className="h-1.5" />
                      </div>

                      {kpi.benchmark !== undefined && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Benchmark: {kpi.benchmark}{kpi.unit} 
                          <span className={cn("ml-1", kpi.benchmarkDiff! >= 0 ? "text-green-600" : "text-red-600")}>
                            ({kpi.benchmarkDiff! >= 0 ? '+' : ''}{kpi.benchmarkDiff?.toFixed(1)})
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[350px]"}>
              <div className="space-y-3">
                {benchmarks.map((bench) => (
                  <div key={bench.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{bench.metric}</p>
                        <Badge variant="outline" className={cn(
                          "text-[10px] mt-1",
                          bench.priority === 'high' ? 'bg-red-500/10 text-red-600' :
                          bench.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-green-500/10 text-green-600'
                        )}>
                          Prioridad {bench.priority}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{bench.companyValue}</p>
                        <p className="text-xs text-muted-foreground">Percentil {bench.percentile}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-muted-foreground">Media</p>
                        <p className="font-medium">{bench.industryAverage}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-muted-foreground">Mediana</p>
                        <p className="font-medium">{bench.industryMedian}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-muted-foreground">Top 25%</p>
                        <p className="font-medium">{bench.industryTop25}</p>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-primary/5 text-xs">
                      <p className="text-muted-foreground">{bench.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[350px]"}>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start gap-2 mb-2">
                      {getInsightIcon(insight.category)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {insight.category}
                          </Badge>
                          <Badge variant="outline" className={cn(
                            "text-[10px]",
                            insight.impact === 'high' ? 'bg-red-500/10 text-red-600' :
                            insight.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                            'bg-green-500/10 text-green-600'
                          )}>
                            Impacto {insight.impact}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {(insight.confidence * 100).toFixed(0)}% confianza
                          </span>
                        </div>
                      </div>
                      {insight.potentialValue && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            €{insight.potentialValue.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">potencial</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {insight.actions.slice(0, 3).map((action, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px]">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[350px]"}>
              {health ? (
                <div className="space-y-4">
                  {/* Overall Score */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Puntuación General</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold">{health.overallScore}</span>
                      <span className="text-2xl text-muted-foreground">/100</span>
                      {health.trend === 'improving' ? (
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      ) : health.trend === 'declining' ? (
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      ) : (
                        <Minus className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      vs {health.previousScore} anterior ({health.trend})
                    </p>
                  </div>

                  {/* Dimensions */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Dimensiones</p>
                    {health.dimensions.map((dim, idx) => (
                      <div key={idx} className="p-2 rounded-lg border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{dim.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-medium", getHealthStatusColor(dim.status))}>
                              {dim.score}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {dim.status}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={dim.score} className="h-1.5" />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dim.factors.map((f, i) => (
                            <span key={i} className="text-[10px] text-muted-foreground">{f}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Fortalezas
                      </p>
                      <ul className="space-y-1">
                        {health.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Debilidades
                      </p>
                      <ul className="space-y-1">
                        {health.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Activity className="h-8 w-8 animate-pulse" />
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* AI Analyst Tab */}
          <TabsContent value="ai" className="flex-1 mt-0">
            <div className={cn("flex flex-col", isExpanded ? "h-[calc(100vh-280px)]" : "h-[350px]")}>
              <div className="flex-1 overflow-auto mb-3">
                {aiResponse ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Respuesta del Analista IA</span>
                        <Badge variant="outline" className="text-[10px]">
                          {(aiResponse.confidence * 100).toFixed(0)}% confianza
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {aiResponse.answer}
                      </p>
                    </div>

                    {aiResponse.suggestedActions.length > 0 && (
                      <div className="p-3 rounded-lg border">
                        <p className="text-xs font-medium mb-2">Acciones Sugeridas</p>
                        <div className="space-y-1">
                          {aiResponse.suggestedActions.map((action, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <Zap className="h-3 w-3 text-primary" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Brain className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium">Analista Financiero IA</p>
                    <p className="text-xs text-muted-foreground">
                      Pregunta sobre métricas, tendencias o estrategias financieras
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="¿Cuál es nuestra situación de liquidez?"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                  className="flex-1"
                />
                <Button onClick={handleAskAI} disabled={askingAI || !aiQuestion.trim()}>
                  {askingAI ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={handleGenerateReport}>
                  <FileText className="h-4 w-4 mr-1" />
                  Generar Informe
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default FinancialAnalyticsPanel;
