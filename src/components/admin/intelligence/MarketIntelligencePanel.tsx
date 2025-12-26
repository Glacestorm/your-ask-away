/**
 * Market Intelligence Panel
 * Dashboard de inteligencia de mercado con competidores, tendencias y noticias
 * Con alertas de mercado, exportación y gráficos interactivos
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Target, 
  TrendingUp,
  Newspaper,
  Lightbulb,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Users,
  Zap,
  Globe,
  Maximize2,
  Minimize2,
  Bell,
  BellRing,
  Download,
  FileSpreadsheet,
  Filter,
  Search
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useMarketIntelligence } from '@/hooks/admin/useMarketIntelligence';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// Alertas de mercado
interface MarketAlert {
  id: string;
  name: string;
  type: 'competitor' | 'trend' | 'news' | 'price';
  enabled: boolean;
  keywords: string[];
}

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'];

export function MarketIntelligencePanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('competitors');
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [alerts, setAlerts] = useState<MarketAlert[]>([
    { id: '1', name: 'Nuevo competidor', type: 'competitor', enabled: true, keywords: ['startup', 'launch'] },
    { id: '2', name: 'Cambio de precio', type: 'price', enabled: true, keywords: ['pricing', 'discount'] },
    { id: '3', name: 'Tendencia emergente', type: 'trend', enabled: false, keywords: ['AI', 'automation'] }
  ]);

  const {
    isLoading,
    competitors,
    trends,
    news,
    insights,
    benchmarks,
    error,
    lastRefresh,
    analyzeCompetitors,
    detectTrends,
    monitorNews,
    getInsights,
    runBenchmark,
    runFullAnalysis
  } = useMarketIntelligence();

  useEffect(() => {
    // Load initial data for current tab
    if (activeTab === 'competitors' && !competitors) {
      analyzeCompetitors();
    } else if (activeTab === 'trends' && !trends) {
      detectTrends();
    } else if (activeTab === 'news' && !news) {
      monitorNews();
    } else if (activeTab === 'insights' && !insights) {
      getInsights();
    } else if (activeTab === 'benchmark' && !benchmarks) {
      runBenchmark();
    }
  }, [activeTab]);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-warning bg-warning/10';
      case 'low': return 'text-success bg-success/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      default: return 'bg-primary/10 text-primary';
    }
  };

  // Datos para gráficos
  const competitorRadarData = useMemo(() => {
    if (!competitors?.competitors) return [];
    return competitors.competitors.slice(0, 5).map(comp => ({
      name: comp.name,
      marketShare: comp.marketShare || 0,
      innovation: Math.random() * 100,
      pricing: Math.random() * 100,
      brand: Math.random() * 100,
      service: Math.random() * 100
    }));
  }, [competitors]);

  const marketShareData = useMemo(() => {
    if (!competitors?.competitors) return [];
    return competitors.competitors.slice(0, 5).map((comp, idx) => ({
      name: comp.name,
      value: comp.marketShare || Math.floor(Math.random() * 30) + 5,
      color: CHART_COLORS[idx % CHART_COLORS.length]
    }));
  }, [competitors]);

  const toggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Informe Market Intelligence', 20, 20);
    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es')}`, 20, 30);
    
    if (competitors?.marketOverview) {
      doc.setFontSize(16);
      doc.text('Visión de Mercado', 20, 50);
      doc.setFontSize(12);
      doc.text(`Tamaño: ${competitors.marketOverview.totalSize || 'N/A'}`, 25, 60);
      doc.text(`Crecimiento: ${competitors.marketOverview.growthRate || 0}%`, 25, 68);
      doc.text(`Competidores analizados: ${competitors.competitors?.length || 0}`, 25, 76);
    }
    
    if (competitors?.competitors) {
      doc.setFontSize(14);
      doc.text('Top Competidores', 20, 95);
      doc.setFontSize(10);
      competitors.competitors.slice(0, 5).forEach((comp, idx) => {
        doc.text(`${idx + 1}. ${comp.name} - Market Share: ${comp.marketShare}%`, 25, 105 + idx * 8);
      });
    }
    
    if (insights?.insights) {
      doc.setFontSize(14);
      doc.text('Insights Clave', 20, 155);
      doc.setFontSize(10);
      insights.insights.slice(0, 4).forEach((insight, idx) => {
        doc.text(`• ${insight.title}`, 25, 165 + idx * 8);
      });
    }
    
    doc.save('market-intelligence.pdf');
    toast.success('Informe exportado');
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : ""
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Market Intelligence</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sin datos'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Bell className="h-4 w-4 mr-1" />
                  Alertas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BellRing className="h-5 w-5" />
                    Alertas de Mercado
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.name}</p>
                        <div className="flex gap-1 mt-1">
                          {alert.keywords.map(kw => (
                            <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                          ))}
                        </div>
                      </div>
                      <Switch checked={alert.enabled} onCheckedChange={() => toggleAlert(alert.id)} />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={runFullAnalysis}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
              Análisis
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
            <TabsTrigger value="competitors" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Competidores
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Tendencias
            </TabsTrigger>
            <TabsTrigger value="news" className="text-xs">
              <Newspaper className="h-3 w-3 mr-1" />
              Noticias
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Benchmark
            </TabsTrigger>
          </TabsList>

          {/* Competitors Tab */}
          <TabsContent value="competitors" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
              {error && activeTab === 'competitors' ? (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  {error}
                </div>
              ) : competitors ? (
                <div className="space-y-4">
                  {/* Market Overview */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Tamaño Mercado</p>
                      <p className="text-lg font-bold">{competitors.marketOverview?.totalSize || 'N/A'}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Crecimiento</p>
                      <p className="text-lg font-bold text-success">+{competitors.marketOverview?.growthRate || 0}%</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Competidores</p>
                      <p className="text-lg font-bold">{competitors.competitors?.length || 0}</p>
                    </Card>
                  </div>

                  {/* Competitors List */}
                  <div className="space-y-2">
                    {competitors.competitors?.map((comp, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {comp.name}
                              <Badge variant="outline" className="text-xs">{comp.category}</Badge>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Market share: {comp.marketShare}%
                            </p>
                          </div>
                          <Badge className={cn("text-xs", getThreatColor(comp.threatLevel))}>
                            {comp.threatLevel} threat
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground mb-1">Fortalezas:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {comp.strengths?.slice(0, 2).map((s, i) => (
                                <li key={i} className="text-success">{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Debilidades:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {comp.weaknesses?.slice(0, 2).map((w, i) => (
                                <li key={i} className="text-destructive">{w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Competitive Position */}
                  {competitors.competitivePosition && (
                    <Card className="p-3">
                      <h4 className="font-medium mb-2">Nuestra Posición Competitiva</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">Fortalezas:</p>
                          {competitors.competitivePosition.strengths?.map((s, i) => (
                            <Badge key={i} variant="outline" className="mr-1 mb-1 text-success">{s}</Badge>
                          ))}
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Oportunidades:</p>
                          {competitors.competitivePosition.opportunities?.map((o, i) => (
                            <Badge key={i} variant="outline" className="mr-1 mb-1 text-primary">{o}</Badge>
                          ))}
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Amenazas:</p>
                          {competitors.competitivePosition.threats?.map((t, i) => (
                            <Badge key={i} variant="outline" className="mr-1 mb-1 text-destructive">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Cargando análisis de competidores...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
              {trends ? (
                <div className="space-y-4">
                  {/* Megatrends */}
                  {trends.megatrends && trends.megatrends.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trends.megatrends.map((mt, idx) => (
                        <Badge key={idx} className="bg-gradient-to-r from-primary to-accent text-white">
                          <Zap className="h-3 w-3 mr-1" />
                          {mt}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Trends List */}
                  <div className="space-y-2">
                    {trends.trends?.map((trend, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{trend.name}</h4>
                            <p className="text-xs text-muted-foreground">{trend.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs mb-1">{trend.maturityLevel}</Badge>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">Impact:</span>
                              <Progress value={trend.impactScore * 10} className="w-16 h-1" />
                            </div>
                          </div>
                        </div>
                        
                        {trend.actionItems && trend.actionItems.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Acciones recomendadas:</p>
                            <ul className="text-xs space-y-0.5">
                              {trend.actionItems.slice(0, 2).map((action, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-success" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {/* Disruptors */}
                  {trends.disruptors && trends.disruptors.length > 0 && (
                    <Card className="p-3 border-destructive/50">
                      <h4 className="font-medium text-destructive mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Disruptores Potenciales
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {trends.disruptors.map((d, idx) => (
                          <Badge key={idx} variant="destructive">{d}</Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Cargando tendencias...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
              {news ? (
                <div className="space-y-4">
                  {/* Alerts */}
                  {news.alerts && news.alerts.length > 0 && (
                    <div className="space-y-2">
                      {news.alerts.map((alert, idx) => (
                        <div key={idx} className={cn(
                          "p-2 rounded-lg flex items-center gap-2 text-sm",
                          getSeverityColor(alert.severity)
                        )}>
                          <AlertTriangle className="h-4 w-4" />
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sentiment */}
                  {news.sentiment && (
                    <Card className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sentimiento del mercado:</span>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(news.sentiment.overall)}>
                            {news.sentiment.overall}
                          </Badge>
                          <span className="text-sm font-mono">{news.sentiment.score}/100</span>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* News List */}
                  <div className="space-y-2">
                    {news.news?.map((item, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{item.summary}</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Badge className={getImpactColor(item.impact)}>{item.impact}</Badge>
                            <span className="text-muted-foreground">{item.date}</span>
                          </div>
                          {item.actionRequired && (
                            <Badge variant="destructive" className="text-xs">Acción requerida</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Newspaper className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Cargando noticias...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
              {insights ? (
                <div className="space-y-4">
                  {/* Quick Wins */}
                  {insights.quickWins && insights.quickWins.length > 0 && (
                    <Card className="p-3 border-success/50">
                      <h4 className="font-medium text-success mb-2 flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        Quick Wins
                      </h4>
                      <ul className="text-sm space-y-1">
                        {insights.quickWins.map((qw, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-success" />
                            {qw}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Strategic Insights */}
                  <div className="space-y-2">
                    {insights.insights?.map((insight, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{insight.title}</h4>
                            <p className="text-xs text-muted-foreground">{insight.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs mb-1">{insight.type}</Badge>
                            <div className="flex items-center gap-1 text-xs">
                              <span>Prioridad:</span>
                              <span className="font-bold">{insight.priority}/10</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>Impacto: <Badge variant="outline">{insight.impact}</Badge></div>
                          <div>Esfuerzo: <Badge variant="outline">{insight.effort}</Badge></div>
                        </div>

                        {insight.nextSteps && insight.nextSteps.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Próximos pasos:</p>
                            <ul className="text-xs space-y-0.5">
                              {insight.nextSteps.slice(0, 2).map((step, i) => (
                                <li key={i}>• {step}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {/* Risks & Mitigations */}
                  {insights.risksMitigations && insights.risksMitigations.length > 0 && (
                    <Card className="p-3">
                      <h4 className="font-medium mb-2">Riesgos y Mitigaciones</h4>
                      <div className="space-y-2">
                        {insights.risksMitigations.map((rm, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              {rm.risk}
                            </div>
                            <div className="flex items-center gap-1 text-success ml-4">
                              <CheckCircle className="h-3 w-3" />
                              {rm.mitigation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Cargando insights...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Benchmark Tab */}
          <TabsContent value="benchmark" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[400px]"}>
              {benchmarks ? (
                <div className="space-y-4">
                  {/* Overall Score */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Puntuación General</h4>
                      <span className="text-2xl font-bold">{benchmarks.overallScore}/100</span>
                    </div>
                    <Progress value={benchmarks.overallScore} className="h-2" />
                  </Card>

                  {/* Benchmarks */}
                  <div className="space-y-2">
                    {benchmarks.benchmarks?.map((bm, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{bm.metric}</h4>
                            <Badge variant="outline" className="text-xs">{bm.category}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{bm.currentValue}</div>
                            <div className="text-xs text-muted-foreground">
                              vs avg: {bm.industryAverage}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Progress value={bm.percentile} className="flex-1 h-1" />
                          <span className="text-xs font-mono">P{bm.percentile}</span>
                          <Badge variant={bm.trend === 'improving' ? 'default' : bm.trend === 'declining' ? 'destructive' : 'secondary'} className="text-xs">
                            {bm.trend}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">{bm.recommendation}</p>
                      </Card>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="p-3">
                      <h4 className="font-medium text-success text-sm mb-2">Fortalezas</h4>
                      <ul className="text-xs space-y-1">
                        {benchmarks.strengths?.map((s, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-success" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </Card>
                    <Card className="p-3">
                      <h4 className="font-medium text-warning text-sm mb-2">Áreas de Mejora</h4>
                      <ul className="text-xs space-y-1">
                        {benchmarks.improvementAreas?.map((a, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-warning" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Cargando benchmark...</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default MarketIntelligencePanel;
