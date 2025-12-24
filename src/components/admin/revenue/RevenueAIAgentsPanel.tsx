/**
 * RevenueAIAgentsPanel - Enterprise Revenue Operations AI Agents Dashboard
 * Autonomous agents for forecasting, deal coaching, and risk monitoring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Brain,
  Bot,
  TrendingUp,
  Target,
  AlertTriangle,
  Shield,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  LineChart,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Lightbulb,
  Trophy,
  Users,
  Activity,
  Eye,
  BarChart3,
} from 'lucide-react';
import { useRevenueAIAgents, type AgentType, type ForecastInsight, type DealCoachingInsight, type RiskMonitoringInsight } from '@/hooks/admin/useRevenueAIAgents';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const AGENT_ICONS: Record<AgentType, React.ReactNode> = {
  forecasting: <LineChart className="h-5 w-5" />,
  deal_coaching: <Target className="h-5 w-5" />,
  risk_monitoring: <Shield className="h-5 w-5" />,
  expansion_detection: <TrendingUp className="h-5 w-5" />,
  churn_prevention: <AlertTriangle className="h-5 w-5" />,
};

const AGENT_COLORS: Record<AgentType, string> = {
  forecasting: 'from-blue-500 to-cyan-500',
  deal_coaching: 'from-green-500 to-emerald-500',
  risk_monitoring: 'from-orange-500 to-red-500',
  expansion_detection: 'from-purple-500 to-pink-500',
  churn_prevention: 'from-yellow-500 to-orange-500',
};

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => 
  `${(value * 100).toFixed(1)}%`;

export function RevenueAIAgentsPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const {
    agents,
    forecastInsights,
    dealCoachingInsights,
    riskInsights,
    isLoading,
    lastRefresh,
    initializeAgents,
    runAgent,
    runAllAgents,
    toggleAgent,
    activeAgentsCount,
    totalInsights,
    highRiskCount,
    totalValueAtRisk,
  } = useRevenueAIAgents();

  useEffect(() => {
    initializeAgents();
  }, [initializeAgents]);

  const toggleInsightExpanded = useCallback((id: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderAgentCard = (agent: typeof agents[0]) => (
    <Card key={agent.id} className="overflow-hidden">
      <div className={cn(
        "h-1 bg-gradient-to-r",
        AGENT_COLORS[agent.type]
      )} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br text-white",
              AGENT_COLORS[agent.type]
            )}>
              {AGENT_ICONS[agent.type]}
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                {agent.name}
                {agent.status === 'analyzing' && (
                  <Badge variant="secondary" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Analizando
                  </Badge>
                )}
              </h4>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
            </div>
          </div>
          <Switch 
            checked={agent.isActive} 
            onCheckedChange={() => toggleAgent(agent.id)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{agent.accuracy.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Precisión</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{agent.insightsGenerated}</p>
            <p className="text-xs text-muted-foreground">Insights</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Última ejecución</p>
            <p className="text-xs font-medium">
              {agent.lastRun 
                ? formatDistanceToNow(agent.lastRun, { addSuffix: true, locale: es })
                : 'Nunca'}
            </p>
          </div>
        </div>

        <Button 
          className="w-full mt-4" 
          size="sm"
          variant={agent.isActive ? "default" : "outline"}
          onClick={() => runAgent(agent.type)}
          disabled={isLoading || !agent.isActive}
        >
          <Play className="h-4 w-4 mr-2" />
          Ejecutar Ahora
        </Button>
      </CardContent>
    </Card>
  );

  const renderForecastInsight = (insight: ForecastInsight) => (
    <Collapsible
      key={insight.id}
      open={expandedInsights.has(insight.id)}
      onOpenChange={() => toggleInsightExpanded(insight.id)}
    >
      <Card className="overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {insight.metric}
                    <Badge variant={insight.trend === 'up' ? 'default' : 'secondary'}>
                      {insight.trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {insight.horizon}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(insight.currentValue)} → {formatCurrency(insight.predictedValue)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">
                  {formatPercent(insight.confidence)} confianza
                </Badge>
                {expandedInsights.has(insight.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Explainability Factors */}
            <div>
              <h5 className="text-sm font-medium flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                Factores de Explicabilidad
              </h5>
              <div className="space-y-3">
                {insight.factors.map((factor, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{factor.factor}</span>
                      <Badge variant={factor.direction === 'positive' ? 'default' : 'destructive'}>
                        {factor.direction === 'positive' ? '+' : '-'}{formatPercent(factor.contribution)}
                      </Badge>
                    </div>
                    <Progress value={factor.contribution * 100} className="h-1.5 mb-2" />
                    <p className="text-xs text-muted-foreground">{factor.humanReadable}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {factor.dataPoints} puntos de datos
                      <span className="mx-1">•</span>
                      {formatPercent(factor.confidence)} confianza
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario Analysis */}
            <div>
              <h5 className="text-sm font-medium flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                Análisis de Escenarios
              </h5>
              <div className="grid grid-cols-3 gap-3">
                {insight.scenarioAnalysis.map((scenario) => (
                  <div 
                    key={scenario.scenario}
                    className={cn(
                      "p-3 rounded-lg border text-center",
                      scenario.scenario === 'base' && "border-primary bg-primary/5",
                      scenario.scenario === 'optimistic' && "border-green-500 bg-green-500/5",
                      scenario.scenario === 'pessimistic' && "border-red-500 bg-red-500/5"
                    )}
                  >
                    <p className="text-xs text-muted-foreground capitalize">{scenario.scenario}</p>
                    <p className="text-lg font-bold">{formatCurrency(scenario.value)}</p>
                    <Badge variant="outline" className="text-xs">
                      {formatPercent(scenario.probability)} prob.
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h5 className="text-sm font-medium flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Recomendaciones
              </h5>
              <ul className="space-y-2">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  const renderDealCoachingInsight = (insight: DealCoachingInsight) => (
    <Card key={insight.id} className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold">{insight.dealName}</h4>
            <p className="text-sm text-muted-foreground">Stage: {insight.currentStage}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Progress value={insight.winProbability * 100} className="w-20 h-2" />
              <span className="text-sm font-medium">{formatPercent(insight.winProbability)}</span>
            </div>
            <Badge variant={insight.urgencyScore > 7 ? 'destructive' : 'secondary'}>
              Urgencia: {insight.urgencyScore.toFixed(1)}
            </Badge>
          </div>
        </div>

        {/* Next Best Action */}
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-3">
          <p className="text-xs text-primary font-medium mb-1">
            <Zap className="h-3 w-3 inline mr-1" />
            Próxima Mejor Acción
          </p>
          <p className="text-sm font-medium">{insight.nextBestAction}</p>
        </div>

        {/* Risk Factors */}
        {insight.riskFactors.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-muted-foreground">Factores de Riesgo</p>
            {insight.riskFactors.map((risk, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-orange-500/10">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  {risk.factor}
                </span>
                <Badge variant="outline">{formatPercent(risk.severity)}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Acciones Recomendadas</p>
          {insight.recommendedActions.slice(0, 2).map((action, idx) => (
            <div key={idx} className="p-2 rounded bg-muted/50 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{action.action}</span>
                <Badge variant="outline">{action.timeline}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{action.reasoning}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderRiskInsight = (insight: RiskMonitoringInsight) => (
    <Card key={insight.id} className={cn(
      "overflow-hidden border-l-4",
      insight.riskLevel === 'critical' && "border-l-red-500",
      insight.riskLevel === 'high' && "border-l-orange-500",
      insight.riskLevel === 'medium' && "border-l-yellow-500",
      insight.riskLevel === 'low' && "border-l-green-500"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Badge variant={
              insight.riskLevel === 'critical' ? 'destructive' : 
              insight.riskLevel === 'high' ? 'default' : 'secondary'
            } className="mb-2">
              {insight.riskLevel.toUpperCase()}
            </Badge>
            <h4 className="font-semibold">{insight.entityName}</h4>
            <p className="text-sm text-muted-foreground capitalize">{insight.entityType}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-destructive">{formatCurrency(insight.impactAmount)}</p>
            <p className="text-xs text-muted-foreground">en riesgo</p>
          </div>
        </div>

        {/* Explanation */}
        <div className="p-3 rounded-lg bg-muted/50 mb-3">
          <p className="text-sm">{insight.explanation}</p>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2 mb-3">
          {insight.riskFactors.map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {factor.trend === 'worsening' ? (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                ) : factor.trend === 'improving' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <Activity className="h-3 w-3 text-yellow-500" />
                )}
                {factor.factor}
              </span>
              <Progress value={factor.severity * 100} className="w-16 h-1.5" />
            </div>
          ))}
        </div>

        {/* Mitigation Actions */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Acciones de Mitigación</p>
          {insight.mitigationActions.slice(0, 2).map((action, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1">
              <span className="flex items-center gap-2">
                {action.status === 'completed' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : action.status === 'in_progress' ? (
                  <Activity className="h-3 w-3 text-blue-500" />
                ) : (
                  <Clock className="h-3 w-3 text-muted-foreground" />
                )}
                {action.action}
              </span>
              <Badge variant="outline">{action.deadline}</Badge>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" className="w-full mt-3">
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalle Completo
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Revenue AI Agents
                </h2>
                <p className="text-muted-foreground">
                  Agentes autónomos para Revenue Operations con explicabilidad
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => runAllAgents()} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Ejecutar Todos
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Agentes Activos</p>
              <p className="text-2xl font-bold">{activeAgentsCount}/{agents.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Insights Generados</p>
              <p className="text-2xl font-bold">{totalInsights}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Alertas Alto Riesgo</p>
              <p className="text-2xl font-bold text-destructive">{highRiskCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground">Valor en Riesgo</p>
              <p className="text-2xl font-bold text-orange-500">{formatCurrency(totalValueAtRisk)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Bot className="h-4 w-4" />
            Agentes
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="gap-2">
            <LineChart className="h-4 w-4" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger value="coaching" className="gap-2">
            <Target className="h-4 w-4" />
            Deal Coaching
          </TabsTrigger>
          <TabsTrigger value="risks" className="gap-2">
            <Shield className="h-4 w-4" />
            Riesgos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(renderAgentCard)}
          </div>
        </TabsContent>

        <TabsContent value="forecasting" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {forecastInsights.length > 0 ? (
                forecastInsights.map(renderForecastInsight)
              ) : (
                <Card className="p-12 text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Ejecuta el agente de Forecasting para ver insights</p>
                  <Button onClick={() => runAgent('forecasting')} className="mt-4">
                    <Play className="h-4 w-4 mr-2" />
                    Ejecutar Forecasting
                  </Button>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="coaching" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dealCoachingInsights.length > 0 ? (
                dealCoachingInsights.map(renderDealCoachingInsight)
              ) : (
                <Card className="p-12 text-center col-span-2">
                  <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Ejecuta el agente de Deal Coaching para ver insights</p>
                  <Button onClick={() => runAgent('deal_coaching')} className="mt-4">
                    <Play className="h-4 w-4 mr-2" />
                    Ejecutar Deal Coaching
                  </Button>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="risks" className="mt-6">
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskInsights.length > 0 ? (
                riskInsights.map(renderRiskInsight)
              ) : (
                <Card className="p-12 text-center col-span-2">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Ejecuta el agente de Risk Monitoring para ver alertas</p>
                  <Button onClick={() => runAgent('risk_monitoring')} className="mt-4">
                    <Play className="h-4 w-4 mr-2" />
                    Ejecutar Risk Monitoring
                  </Button>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RevenueAIAgentsPanel;
