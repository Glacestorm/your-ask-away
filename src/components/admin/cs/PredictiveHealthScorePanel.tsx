/**
 * PredictiveHealthScorePanel - Customer Health Score with ML Explainability
 * Predicts churn 90 days ahead with explained factors
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Heart,
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Eye,
  Lightbulb,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  BarChart3,
  LineChart,
  Zap,
  Target,
  Users,
  DollarSign,
  Calendar,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { usePredictiveHealthScore, type CustomerHealthScore, type ExplainableFactor } from '@/hooks/admin/usePredictiveHealthScore';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

const RISK_COLORS = {
  healthy: 'bg-green-500',
  at_risk: 'bg-yellow-500',
  high_risk: 'bg-orange-500',
  critical: 'bg-red-500',
};

const CATEGORY_ICONS = {
  usage: <Activity className="h-4 w-4" />,
  engagement: <Users className="h-4 w-4" />,
  support: <Shield className="h-4 w-4" />,
  financial: <DollarSign className="h-4 w-4" />,
  relationship: <Heart className="h-4 w-4" />,
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

interface PredictiveHealthScorePanelProps {
  className?: string;
}

export function PredictiveHealthScorePanel({ className }: PredictiveHealthScorePanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAccount, setSelectedAccount] = useState<CustomerHealthScore | null>(null);
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());

  const {
    healthScores,
    modelPerformance,
    isLoading,
    lastRefresh,
    fetchHealthScores,
    fetchModelPerformance,
    updateActionStatus,
    criticalAccounts,
    highRiskAccounts,
    atRiskAccounts,
    healthyAccounts,
    averageScore,
    averageChurnProbability,
    totalValueAtRisk,
    getScoreColor,
    getRiskBadgeVariant,
  } = usePredictiveHealthScore();

  useEffect(() => {
    fetchHealthScores();
    fetchModelPerformance();
  }, [fetchHealthScores, fetchModelPerformance]);

  const toggleFactorExpanded = useCallback((id: string) => {
    setExpandedFactors(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderScoreGauge = (score: number, size: 'sm' | 'lg' = 'sm') => {
    const radius = size === 'lg' ? 70 : 40;
    const strokeWidth = size === 'lg' ? 10 : 6;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';

    return (
      <div className="relative" style={{ width: (radius + strokeWidth) * 2, height: (radius + strokeWidth) * 2 }}>
        <svg className="transform -rotate-90" width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2}>
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", size === 'lg' ? "text-3xl" : "text-xl")}>{score}</span>
        </div>
      </div>
    );
  };

  const renderAccountCard = (account: CustomerHealthScore) => (
    <Card 
      key={account.id}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        selectedAccount?.id === account.id && "ring-2 ring-primary"
      )}
      onClick={() => setSelectedAccount(account)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {renderScoreGauge(account.overallScore)}
            <div>
              <h4 className="font-semibold">{account.companyName}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getRiskBadgeVariant(account.riskLevel)}>
                  {account.riskLevel.replace('_', ' ').toUpperCase()}
                </Badge>
                {account.trend === 'improving' && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {account.trend === 'declining' && (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                {account.trend === 'stable' && (
                  <Minus className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Prob. Churn 90d</p>
            <p className={cn(
              "text-2xl font-bold",
              account.churnProbability90Days > 0.5 ? "text-red-500" : 
              account.churnProbability90Days > 0.25 ? "text-orange-500" : "text-green-500"
            )}>
              {formatPercent(account.churnProbability90Days)}
            </p>
          </div>
        </div>

        {/* Early Warning Signals */}
        {account.earlyWarningSignals.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {account.earlyWarningSignals.slice(0, 2).map(signal => (
              <Badge 
                key={signal.id} 
                variant="outline" 
                className={cn(
                  "text-xs",
                  signal.severity === 'critical' && "border-red-500 text-red-500",
                  signal.severity === 'high' && "border-orange-500 text-orange-500"
                )}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {signal.signal}
              </Badge>
            ))}
            {account.earlyWarningSignals.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{account.earlyWarningSignals.length - 2} más
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderExplainableFactor = (factor: ExplainableFactor) => (
    <Collapsible
      key={factor.id}
      open={expandedFactors.has(factor.id)}
      onOpenChange={() => toggleFactorExpanded(factor.id)}
    >
      <div className={cn(
        "p-3 rounded-lg border-l-4",
        factor.direction === 'positive' ? "border-l-green-500 bg-green-500/5" : "border-l-red-500 bg-red-500/5"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                factor.direction === 'positive' ? "bg-green-500/20" : "bg-red-500/20"
              )}>
                {CATEGORY_ICONS[factor.category]}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{factor.factor}</p>
                <p className="text-xs text-muted-foreground capitalize">{factor.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={factor.direction === 'positive' ? 'default' : 'destructive'}>
                {factor.direction === 'positive' ? '+' : ''}{formatPercent(factor.impact)} impacto
              </Badge>
              {expandedFactors.has(factor.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          {/* Explanation */}
          <div className="p-3 rounded bg-background/50">
            <p className="text-sm flex items-start gap-2">
              <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              {factor.explanation}
            </p>
          </div>

          {/* Trend */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-background/50">
              <p className="text-xs text-muted-foreground">Anterior</p>
              <p className="font-medium">{factor.trend.previous}</p>
            </div>
            <div className="p-2 rounded bg-background/50">
              <p className="text-xs text-muted-foreground">Actual</p>
              <p className="font-medium">{factor.trend.current}</p>
            </div>
            <div className={cn(
              "p-2 rounded",
              factor.trend.change > 0 ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              <p className="text-xs text-muted-foreground">Cambio</p>
              <p className={cn(
                "font-medium",
                factor.trend.change > 0 ? "text-green-600" : "text-red-600"
              )}>
                {factor.trend.change > 0 ? '+' : ''}{factor.trend.change.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {factor.dataPoints} datos analizados
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {formatPercent(factor.confidence)} confianza
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Peso: {formatPercent(factor.weight)}
            </span>
          </div>

          {/* Suggested Action */}
          {factor.actionable && factor.suggestedAction && (
            <div className="p-3 rounded bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary font-medium flex items-center gap-1">
                <Lightbulb className="h-3 w-3" />
                Acción Sugerida
              </p>
              <p className="text-sm mt-1">{factor.suggestedAction}</p>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );

  const renderAccountDetail = () => {
    if (!selectedAccount) return null;

    const radarData = selectedAccount.dimensions.map(dim => ({
      dimension: dim.name,
      score: dim.score,
      benchmark: 70,
    }));

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {renderScoreGauge(selectedAccount.overallScore, 'lg')}
                <div>
                  <h2 className="text-2xl font-bold">{selectedAccount.companyName}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant={getRiskBadgeVariant(selectedAccount.riskLevel)} className="text-sm">
                      {selectedAccount.riskLevel.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground flex items-center gap-1">
                      {selectedAccount.trend === 'improving' ? (
                        <><TrendingUp className="h-4 w-4 text-green-500" /> Mejorando</>
                      ) : selectedAccount.trend === 'declining' ? (
                        <><TrendingDown className="h-4 w-4 text-red-500" /> Declinando</>
                      ) : (
                        <><Minus className="h-4 w-4 text-yellow-500" /> Estable</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Prob. Churn 90d</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    selectedAccount.churnProbability90Days > 0.5 ? "text-red-500" : "text-green-500"
                  )}>
                    {formatPercent(selectedAccount.churnProbability90Days)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Confianza ML</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatPercent(selectedAccount.confidence)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Dimensiones de Salud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {selectedAccount.dimensions.map(dim => (
                  <div key={dim.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{dim.name}</span>
                      <div className="flex items-center gap-2">
                        {dim.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                        {dim.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                        <span className={cn("font-bold", getScoreColor(dim.score))}>{dim.score}</span>
                      </div>
                    </div>
                    <Progress value={dim.score} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Peso: {formatPercent(dim.weight)}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Explainable Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Factores Explicables (ML Explainability)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedAccount.explainableFactors.map(renderExplainableFactor)}
            </div>
          </CardContent>
        </Card>

        {/* Early Warning Signals */}
        {selectedAccount.earlyWarningSignals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Señales de Alerta Temprana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedAccount.earlyWarningSignals.map(signal => (
                  <div 
                    key={signal.id}
                    className={cn(
                      "p-4 rounded-lg border-l-4",
                      signal.severity === 'critical' && "border-l-red-500 bg-red-500/5",
                      signal.severity === 'high' && "border-l-orange-500 bg-orange-500/5",
                      signal.severity === 'medium' && "border-l-yellow-500 bg-yellow-500/5",
                      signal.severity === 'low' && "border-l-blue-500 bg-blue-500/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <AlertTriangle className={cn(
                          "h-4 w-4",
                          signal.severity === 'critical' && "text-red-500",
                          signal.severity === 'high' && "text-orange-500"
                        )} />
                        {signal.signal}
                      </h4>
                      <Badge variant={
                        signal.severity === 'critical' ? 'destructive' : 
                        signal.severity === 'high' ? 'default' : 'secondary'
                      }>
                        {signal.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{signal.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Detectado: {formatDistanceToNow(new Date(signal.detectedAt), { addSuffix: true, locale: es })}
                      </span>
                      <span className="text-destructive font-medium">
                        +{formatPercent(signal.associatedChurnRisk)} riesgo
                      </span>
                    </div>
                    {signal.autoResponse && (
                      <div className="mt-2 p-2 rounded bg-background/50 text-xs">
                        <span className="font-medium">Auto-respuesta:</span> {signal.autoResponse.type}
                        <Badge variant="outline" className="ml-2">{signal.autoResponse.status}</Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommended Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Acciones Recomendadas por IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedAccount.recommendedActions.map(action => (
                <div key={action.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">P{action.priority}</Badge>
                        <h4 className="font-semibold">{action.action}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {action.category} • {action.timeline} • {action.owner}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.status === 'completed' && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completada
                        </Badge>
                      )}
                      {action.status === 'in_progress' && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" /> En Progreso
                        </Badge>
                      )}
                      {action.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateActionStatus(selectedAccount.id, action.id, 'in_progress')}
                        >
                          Iniciar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 rounded bg-muted/50 mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Razonamiento IA:</p>
                    <p className="text-sm">{action.aiReasoning}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Impacto Esperado</p>
                      <p className="font-medium text-green-600">+{formatPercent(action.expectedImpact)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Prob. Éxito</p>
                      <p className="font-medium">{formatPercent(action.successProbability)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Esfuerzo</p>
                      <Badge variant="outline" className="capitalize">{action.effort}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historical Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Evolución Histórica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedAccount.historicalScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM', { locale: es })}
                    className="text-xs"
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy', { locale: es })}
                    formatter={(value: number, name: string) => [
                      name === 'score' ? value : formatPercent(value),
                      name === 'score' ? 'Health Score' : 'Prob. Churn'
                    ]}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  Predictive Health Score
                </h2>
                <p className="text-muted-foreground">
                  ML predictivo con explicabilidad - Predicción de churn a 90 días
                </p>
              </div>
            </div>
            <Button onClick={() => fetchHealthScores()} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Actualizar
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Score Promedio</p>
              <p className={cn("text-2xl font-bold", getScoreColor(averageScore))}>
                {averageScore.toFixed(0)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Críticos</p>
              <p className="text-2xl font-bold text-red-500">{criticalAccounts.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Alto Riesgo</p>
              <p className="text-2xl font-bold text-orange-500">{highRiskAccounts.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">En Riesgo</p>
              <p className="text-2xl font-bold text-yellow-500">{atRiskAccounts.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Saludables</p>
              <p className="text-2xl font-bold text-green-500">{healthyAccounts.length}</p>
            </div>
          </div>

          {/* Model Performance */}
          {modelPerformance && (
            <div className="mt-4 p-4 rounded-lg bg-background/50 border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Rendimiento del Modelo ML
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Precisión: <strong>{formatPercent(modelPerformance.accuracy)}</strong></span>
                  <span>Recall: <strong>{formatPercent(modelPerformance.recall)}</strong></span>
                  <span>F1: <strong>{formatPercent(modelPerformance.f1Score)}</strong></span>
                  <span>AUC: <strong>{formatPercent(modelPerformance.auc)}</strong></span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account List */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Cuentas por Riesgo</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3 pr-4">
                  {/* Critical */}
                  {criticalAccounts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-500 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> CRÍTICO ({criticalAccounts.length})
                      </p>
                      {criticalAccounts.map(renderAccountCard)}
                    </div>
                  )}
                  
                  {/* High Risk */}
                  {highRiskAccounts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-orange-500 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> ALTO RIESGO ({highRiskAccounts.length})
                      </p>
                      {highRiskAccounts.map(renderAccountCard)}
                    </div>
                  )}

                  {/* At Risk */}
                  {atRiskAccounts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-yellow-500 mb-2">
                        EN RIESGO ({atRiskAccounts.length})
                      </p>
                      {atRiskAccounts.map(renderAccountCard)}
                    </div>
                  )}

                  {/* Healthy */}
                  {healthyAccounts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-500 mb-2">
                        SALUDABLE ({healthyAccounts.length})
                      </p>
                      {healthyAccounts.map(renderAccountCard)}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Account Detail */}
        <div className="lg:col-span-2">
          <ScrollArea className="h-[800px]">
            {selectedAccount ? (
              renderAccountDetail()
            ) : (
              <Card className="p-12 text-center">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium mb-2">Selecciona una cuenta</h3>
                <p className="text-muted-foreground">
                  Haz clic en una cuenta para ver el análisis detallado de health score
                </p>
              </Card>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default PredictiveHealthScorePanel;
