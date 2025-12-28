/**
 * LicenseAIAgentPanel - Panel completo del Agente IA para Licencias
 * Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  Zap,
  RefreshCw,
  Play,
  Pause,
  Settings,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Activity,
  Sparkles,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useLicenseAIAgent, type AgentAction, type LicensePrediction, type LicenseAnomaly, type AgentInsight } from '@/hooks/admin/enterprise/useLicenseAIAgent';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function LicenseAIAgentPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [nlQuery, setNlQuery] = useState('');
  const [nlResponse, setNlResponse] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const {
    isLoading,
    isAnalyzing,
    config,
    predictions,
    anomalies,
    actions,
    insights,
    metrics,
    lastRefresh,
    pendingActions,
    activeAnomalies,
    highRiskItems,
    runFullAnalysis,
    queryNaturalLanguage,
    approveAction,
    rejectAction,
    resolveAnomaly,
    updateConfig,
    startMonitoring,
    stopMonitoring,
  } = useLicenseAIAgent();

  // Toggle monitoring
  const toggleMonitoring = useCallback(() => {
    if (isMonitoring) {
      stopMonitoring();
      setIsMonitoring(false);
    } else {
      startMonitoring(300000); // 5 minutos
      setIsMonitoring(true);
    }
  }, [isMonitoring, startMonitoring, stopMonitoring]);

  // Handle NL query
  const handleNLQuery = async () => {
    if (!nlQuery.trim()) return;
    
    const result = await queryNaturalLanguage(nlQuery);
    if (result) {
      setNlResponse(result.answer);
    }
    setNlQuery('');
  };

  // Severity badge
  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      low: { variant: 'secondary', className: 'bg-green-500/20 text-green-400' },
      medium: { variant: 'secondary', className: 'bg-yellow-500/20 text-yellow-400' },
      high: { variant: 'secondary', className: 'bg-orange-500/20 text-orange-400' },
      critical: { variant: 'destructive', className: '' },
    };
    return variants[severity] || variants.low;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  Agente IA de Licencias
                  <Badge variant="outline" className="ml-2 bg-primary/10">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Enterprise
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {lastRefresh 
                    ? `Última actualización: ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                    : 'Sistema de IA autónomo para gestión inteligente'
                  }
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={isMonitoring ? 'default' : 'outline'}
                size="sm"
                onClick={toggleMonitoring}
                className={cn(isMonitoring && 'bg-green-600 hover:bg-green-700')}
              >
                {isMonitoring ? (
                  <>
                    <Activity className="h-4 w-4 mr-1 animate-pulse" />
                    Monitoreando
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar Monitoreo
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={runFullAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Quick Stats */}
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Brain className="h-4 w-4" />
                Predicciones
              </div>
              <p className="text-2xl font-bold">{predictions.length}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <AlertTriangle className="h-4 w-4" />
                Anomalías
              </div>
              <p className="text-2xl font-bold text-orange-500">{activeAnomalies.length}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="h-4 w-4" />
                Acciones Pendientes
              </div>
              <p className="text-2xl font-bold text-primary">{pendingActions.length}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-background/50 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Target className="h-4 w-4" />
                Precisión
              </div>
              <p className="text-2xl font-bold text-green-500">{metrics?.accuracyRate || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-1">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Predicciones</span>
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Anomalías</span>
            {activeAnomalies.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                {activeAnomalies.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Acciones</span>
            {pendingActions.length > 0 && (
              <Badge className="ml-1 h-5 w-5 p-0 justify-center bg-primary">
                {pendingActions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat IA</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Insights */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Insights del Agente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {insights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Brain className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm">Ejecuta un análisis para obtener insights</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {insights.map((insight) => (
                        <div
                          key={insight.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            insight.impact === 'high' && 'border-primary/50 bg-primary/5',
                            insight.impact === 'medium' && 'border-yellow-500/50 bg-yellow-500/5',
                            insight.impact === 'low' && 'border-muted'
                          )}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-medium text-sm">{insight.title}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {insight.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          {insight.metricChange && (
                            <div className="flex items-center gap-1 mt-2 text-xs">
                              <TrendingUp className={cn(
                                "h-3 w-3",
                                insight.metricChange > 0 ? 'text-green-500' : 'text-red-500'
                              )} />
                              <span className={insight.metricChange > 0 ? 'text-green-500' : 'text-red-500'}>
                                {insight.metricChange > 0 ? '+' : ''}{insight.metricChange}%
                              </span>
                              <span className="text-muted-foreground">{insight.metric}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* High Risk Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Alertas de Alto Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {highRiskItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <CheckCircle className="h-10 w-10 mb-2 text-green-500 opacity-50" />
                      <p className="text-sm">Sin alertas de alto riesgo</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {highRiskItems.slice(0, 5).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5"
                        >
                          {'probability' in item ? (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{(item as LicensePrediction).licenseKey}</span>
                                <Badge variant="destructive" className="text-xs">
                                  {(item as LicensePrediction).probability}% churn
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {(item as LicensePrediction).companyName}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{(item as LicenseAnomaly).licenseKey}</span>
                                <Badge 
                                  variant="destructive" 
                                  className={cn(
                                    "text-xs capitalize",
                                    (item as LicenseAnomaly).severity === 'high' && 'bg-orange-500'
                                  )}
                                >
                                  {(item as LicenseAnomaly).severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {(item as LicenseAnomaly).description}
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Agent Configuration Quick View */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración del Agente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Autonomía</Label>
                  <Badge variant="outline" className="capitalize">
                    {config.autonomyLevel.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Umbral de Confianza</Label>
                  <div className="flex items-center gap-2">
                    <Progress value={config.confidenceThreshold} className="h-2" />
                    <span className="text-sm font-medium">{config.confidenceThreshold}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Predicciones</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={config.enablePredictions}
                      onCheckedChange={(checked) => updateConfig({ enablePredictions: checked })}
                    />
                    <span className="text-sm">{config.enablePredictions ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Detección Anomalías</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={config.enableAnomalyDetection}
                      onCheckedChange={(checked) => updateConfig({ enableAnomalyDetection: checked })}
                    />
                    <span className="text-sm">{config.enableAnomalyDetection ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[500px]">
                {predictions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <Brain className="h-12 w-12 mb-3 opacity-50" />
                    <p>No hay predicciones disponibles</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={runFullAnalysis}>
                      Generar Predicciones
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {predictions.map((prediction, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-4 rounded-lg border transition-colors hover:bg-muted/50",
                          prediction.predictionType === 'churn' && prediction.probability > 50 && 'border-red-500/30',
                          prediction.predictionType === 'renewal' && prediction.probability > 70 && 'border-green-500/30'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{prediction.licenseKey}</p>
                            <p className="text-sm text-muted-foreground">{prediction.companyName}</p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={prediction.predictionType === 'churn' ? 'destructive' : 'default'}
                              className="capitalize"
                            >
                              {prediction.predictionType}
                            </Badge>
                            <p className="text-2xl font-bold mt-1">{prediction.probability}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Target className="h-3 w-3" />
                            Confianza: {prediction.confidence}%
                          </div>
                          {prediction.estimatedValue && (
                            <div className="flex items-center gap-1 text-green-500">
                              <TrendingUp className="h-3 w-3" />
                              ${prediction.estimatedValue.toLocaleString()}
                            </div>
                          )}
                        </div>
                        
                        {prediction.factors.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Factores:</p>
                            <div className="flex flex-wrap gap-2">
                              {prediction.factors.slice(0, 3).map((factor, fIdx) => (
                                <Badge 
                                  key={fIdx}
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    factor.impact === 'positive' && 'border-green-500/50 text-green-500',
                                    factor.impact === 'negative' && 'border-red-500/50 text-red-500'
                                  )}
                                >
                                  {factor.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {prediction.suggestedAction && (
                          <div className="mt-3 p-2 rounded bg-primary/5 text-sm">
                            <span className="text-muted-foreground">Sugerencia:</span>{' '}
                            {prediction.suggestedAction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[500px]">
                {anomalies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <Shield className="h-12 w-12 mb-3 opacity-50 text-green-500" />
                    <p>No se han detectado anomalías</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalies.map((anomaly) => {
                      const badge = getSeverityBadge(anomaly.severity);
                      return (
                        <div
                          key={anomaly.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            anomaly.status === 'new' && 'border-orange-500/30 bg-orange-500/5'
                          )}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{anomaly.licenseKey}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {anomaly.anomalyType.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <Badge className={badge.className}>
                              {anomaly.severity}
                            </Badge>
                          </div>
                          
                          <p className="text-sm mb-3">{anomaly.description}</p>
                          
                          {anomaly.evidence.length > 0 && (
                            <div className="mb-3 p-2 rounded bg-muted/50 text-xs">
                              <p className="font-medium mb-1">Evidencia:</p>
                              {anomaly.evidence.map((e, eIdx) => (
                                <p key={eIdx}>
                                  {e.type}: <span className="text-orange-500">{e.value}</span>
                                  {e.expected && <span className="text-muted-foreground"> (esperado: {e.expected})</span>}
                                </p>
                              ))}
                            </div>
                          )}
                          
                          {anomaly.status === 'new' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => resolveAnomaly(anomaly.id, 'resolved')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => resolveAnomaly(anomaly.id, 'false_positive')}
                              >
                                Falso Positivo
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <ScrollArea className="h-[500px]">
                {actions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <Zap className="h-12 w-12 mb-3 opacity-50" />
                    <p>No hay acciones sugeridas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          action.status === 'pending' && 'border-primary/30 bg-primary/5'
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {action.actionType}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  action.status === 'pending' && 'bg-yellow-500/20 text-yellow-500',
                                  action.status === 'approved' && 'bg-blue-500/20 text-blue-500',
                                  action.status === 'executed' && 'bg-green-500/20 text-green-500',
                                  action.status === 'rejected' && 'bg-red-500/20 text-red-500'
                                )}
                              >
                                {action.status}
                              </Badge>
                            </div>
                            <p className="font-medium mt-1">{action.targetLicenseKey}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Confianza</p>
                            <p className="text-xl font-bold">{action.confidence}%</p>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-2">{action.reason}</p>
                        
                        <div className="p-2 rounded bg-muted/50 text-xs mb-3">
                          <p className="font-medium mb-1">Razonamiento IA:</p>
                          <p className="text-muted-foreground">{action.aiReasoning}</p>
                        </div>
                        
                        {action.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => approveAction(action.id)}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Aprobar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rejectAction(action.id)}
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col h-[500px]">
                <ScrollArea className="flex-1 mb-4">
                  {nlResponse ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{nlResponse}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                      <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-center mb-4">
                        Pregúntame cualquier cosa sobre tus licencias
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-md">
                        {[
                          '¿Cuántas licencias expiran este mes?',
                          '¿Cuál es el riesgo de churn?',
                          '¿Qué licencias generan más revenue?',
                          '¿Hay actividad sospechosa?'
                        ].map((q, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setNlQuery(q);
                            }}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </ScrollArea>
                
                <div className="flex gap-2">
                  <Input
                    value={nlQuery}
                    onChange={(e) => setNlQuery(e.target.value)}
                    placeholder="Escribe tu pregunta sobre licencias..."
                    onKeyDown={(e) => e.key === 'Enter' && handleNLQuery()}
                  />
                  <Button onClick={handleNLQuery} disabled={isLoading || !nlQuery.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LicenseAIAgentPanel;
