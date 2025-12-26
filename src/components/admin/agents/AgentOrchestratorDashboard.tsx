import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  Shield,
  DollarSign,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Users,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useAIAgentsV2, type AIAgent, type DealCoachingResult, type ChurnPreventionResult, type RevenueOptimizationResult } from '@/hooks/admin/agents/useAIAgentsV2';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const agentIcons: Record<string, React.ElementType> = {
  deal_coaching: Target,
  churn_prevention: Shield,
  revenue_optimization: DollarSign,
};

const agentColors: Record<string, string> = {
  deal_coaching: 'from-blue-500 to-indigo-600',
  churn_prevention: 'from-orange-500 to-red-600',
  revenue_optimization: 'from-green-500 to-emerald-600',
};

// Animación de estados con transiciones suaves
const statusConfig: Record<string, { color: string; icon: React.ElementType; animate: boolean }> = {
  active: { color: 'bg-green-500', icon: CheckCircle, animate: false },
  idle: { color: 'bg-muted-foreground/50', icon: Clock, animate: false },
  analyzing: { color: 'bg-blue-500', icon: Loader2, animate: true },
  error: { color: 'bg-destructive', icon: AlertTriangle, animate: false },
};

// Variantes de animación para tarjetas de agentes
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

// Variantes para indicador de estado
const statusIndicatorVariants = {
  idle: { scale: 1 },
  analyzing: { 
    scale: [1, 1.2, 1],
    transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
  },
  active: { scale: 1 },
  error: { 
    x: [-2, 2, -2, 2, 0],
    transition: { duration: 0.4 }
  },
};

export function AgentOrchestratorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [dealContext, setDealContext] = useState('');
  const [customerContext, setCustomerContext] = useState('');
  const [dealResult, setDealResult] = useState<DealCoachingResult | null>(null);
  const [churnResult, setChurnResult] = useState<ChurnPreventionResult | null>(null);
  const [revenueResult, setRevenueResult] = useState<RevenueOptimizationResult | null>(null);

  const {
    isLoading,
    agents,
    orchestratorStatus,
    lastRefresh,
    fetchAgentsStatus,
    runDealCoaching,
    runChurnPrevention,
    runRevenueOptimization,
    orchestrateAgents,
    executeAgentAction,
    startAutoRefresh,
    stopAutoRefresh,
  } = useAIAgentsV2();

  useEffect(() => {
    startAutoRefresh(90000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  // Track previous agent statuses for animations
  const prevStatusRef = useRef<Record<string, string>>({});

  // Detectar cambios de estado y mostrar notificaciones
  useEffect(() => {
    agents.forEach(agent => {
      const prevStatus = prevStatusRef.current[agent.id];
      if (prevStatus && prevStatus !== agent.status) {
        // Notificación cuando un agente completa análisis
        if (prevStatus === 'analyzing' && agent.status === 'active') {
          const metrics = Object.entries(agent.metrics).slice(0, 2);
          toast.success(`${agent.name} completó análisis`, {
            description: metrics.map(([k, v]) => `${k}: ${v}`).join(' | '),
            duration: 5000,
          });
        } else if (agent.status === 'error') {
          toast.error(`${agent.name} encontró un error`, {
            description: 'Revisa la configuración del agente',
            duration: 5000,
          });
        } else if (agent.status === 'analyzing') {
          toast.info(`${agent.name} iniciando análisis...`, {
            duration: 3000,
          });
        }
      }
      prevStatusRef.current[agent.id] = agent.status;
    });
  }, [agents]);

  const handleRunDealCoaching = async () => {
    const context = dealContext ? JSON.parse(dealContext) : { deal: { name: 'Demo Deal', value: 50000 } };
    const result = await runDealCoaching(context);
    if (result) {
      setDealResult(result);
      toast.success('Deal Coaching completado', {
        description: `Probabilidad de cierre: ${result.dealAnalysis.winProbability}% | ${result.nextActions.length} acciones recomendadas`,
        duration: 5000,
      });
    }
  };

  const handleRunChurnPrevention = async () => {
    const context = customerContext ? JSON.parse(customerContext) : { customer: { name: 'Demo Customer', mrr: 2000 } };
    const result = await runChurnPrevention(context);
    if (result) {
      setChurnResult(result);
      toast.success('Análisis de Churn completado', {
        description: `Riesgo: ${result.churnAnalysis.riskLevel.toUpperCase()} (${result.churnAnalysis.churnRisk}%) | Valor en riesgo: €${result.churnAnalysis.valueAtRisk.toLocaleString()}`,
        duration: 5000,
      });
    }
  };

  const handleRunRevenueOptimization = async () => {
    const result = await runRevenueOptimization({ customers: [], products: [] });
    if (result) {
      setRevenueResult(result);
      const totalOpportunity = result.revenueOpportunities.reduce((sum, o) => sum + (o.potentialMRR - o.currentMRR), 0);
      toast.success('Revenue Optimization completado', {
        description: `${result.revenueOpportunities.length} oportunidades | Potencial: +€${totalOpportunity.toLocaleString()}/mes`,
        duration: 5000,
      });
    }
  };

  const getAgentIcon = (type: string) => {
    const Icon = agentIcons[type] || Bot;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Agents 2.0 Orchestrator
          </h2>
          <p className="text-sm text-muted-foreground">
            {lastRefresh 
              ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
              : 'Sincronizando...'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgentsStatus} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => orchestrateAgents({ objective: 'Optimización general' })}>
            <Zap className="h-4 w-4 mr-2" />
            Orquestar
          </Button>
        </div>
      </div>

      {/* Orchestrator Stats */}
      {orchestratorStatus && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orchestratorStatus.activeWorkflows}</p>
                  <p className="text-xs text-muted-foreground">Workflows Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orchestratorStatus.queuedTasks}</p>
                  <p className="text-xs text-muted-foreground">Tareas en Cola</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orchestratorStatus.completedToday}</p>
                  <p className="text-xs text-muted-foreground">Completadas Hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orchestratorStatus.resourceUtilization}%</p>
                  <p className="text-xs text-muted-foreground">Utilización</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", orchestratorStatus.status === 'running' ? 'bg-green-500/10' : 'bg-gray-500/10')}>
                  <Bot className={cn("h-5 w-5", orchestratorStatus.status === 'running' ? 'text-green-500' : 'text-gray-500')} />
                </div>
                <div>
                  <p className="text-sm font-medium capitalize">{orchestratorStatus.status}</p>
                  <p className="text-xs text-muted-foreground">Estado Orchestrator</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="deal-coaching">Deal Coaching</TabsTrigger>
          <TabsTrigger value="churn-prevention">Churn Prevention</TabsTrigger>
          <TabsTrigger value="revenue-optimization">Revenue Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {agents.map((agent, index) => {
                const Icon = getAgentIcon(agent.type);
                const statusConf = statusConfig[agent.status] || statusConfig.idle;
                const StatusIcon = statusConf.icon;
                
                return (
                  <motion.div
                    key={agent.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    layout
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer h-full transition-shadow duration-300",
                        selectedAgent?.id === agent.id && "ring-2 ring-primary shadow-lg"
                      )}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <CardHeader className="pb-2 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <motion.div 
                            className={cn("p-2.5 sm:p-3 rounded-xl bg-gradient-to-br text-white shadow-md", agentColors[agent.type])}
                            whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.3 } }}
                          >
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </motion.div>
                          
                          {/* Status indicator con animación */}
                          <motion.div 
                            className="flex items-center gap-2"
                            variants={statusIndicatorVariants}
                            animate={agent.status}
                          >
                            <motion.span 
                              className={cn("w-2.5 h-2.5 rounded-full", statusConf.color)}
                              animate={statusConf.animate ? { opacity: [1, 0.5, 1] } : {}}
                              transition={statusConf.animate ? { duration: 1, repeat: Infinity } : {}}
                            />
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs capitalize flex items-center gap-1",
                                agent.status === 'analyzing' && "border-blue-500 text-blue-600",
                                agent.status === 'error' && "border-destructive text-destructive"
                              )}
                            >
                              <StatusIcon className={cn("h-3 w-3", statusConf.animate && "animate-spin")} />
                              <span className="hidden xs:inline">{agent.status}</span>
                            </Badge>
                          </motion.div>
                        </div>
                        
                        <div>
                          <CardTitle className="text-base sm:text-lg line-clamp-1">{agent.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Última actividad: {formatDistanceToNow(new Date(agent.lastActivity), { locale: es, addSuffix: true })}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Métricas responsivas */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:text-sm">
                          {Object.entries(agent.metrics).slice(0, 4).map(([key, value]) => (
                            <motion.div 
                              key={key} 
                              className="flex justify-between items-center min-w-0"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <span className="text-muted-foreground capitalize truncate mr-1 text-xs">
                                {key.replace(/([A-Z])/g, ' $1').trim().slice(0, 12)}:
                              </span>
                              <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                                {typeof value === 'number' && key.toLowerCase().includes('rate') 
                                  ? `${value}%` 
                                  : typeof value === 'number' && key.toLowerCase().includes('revenue')
                                    ? `€${value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`
                                    : value
                                }
                              </span>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Capabilities con responsive wrap */}
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((cap, capIndex) => (
                            <motion.div
                              key={cap}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + capIndex * 0.05 }}
                            >
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                                {cap.replace(/_/g, ' ')}
                              </Badge>
                            </motion.div>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                              +{agent.capabilities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Deal Coaching Tab */}
        <TabsContent value="deal-coaching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Deal Coaching Agent
              </CardTitle>
              <CardDescription>
                Análisis de deals, coaching de ventas y recomendaciones de next best actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Contexto del Deal (JSON)</label>
                <Textarea
                  placeholder='{"deal": {"name": "Enterprise Deal", "value": 100000, "stage": "negotiation"}}'
                  value={dealContext}
                  onChange={(e) => setDealContext(e.target.value)}
                  className="mt-1 font-mono text-xs"
                  rows={4}
                />
              </div>
              <Button onClick={handleRunDealCoaching} disabled={isLoading}>
                <Play className="h-4 w-4 mr-2" />
                Ejecutar Análisis
              </Button>

              {dealResult && (
                <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Análisis del Deal</h4>
                      <div className="space-y-1 text-sm">
                        <p>Probabilidad de cierre: <span className="font-bold text-green-600">{dealResult.dealAnalysis.winProbability}%</span></p>
                        <p>Etapa actual: {dealResult.dealAnalysis.currentStage}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Factores de Riesgo</h4>
                      <ul className="text-sm space-y-1">
                        {dealResult.dealAnalysis.riskFactors.slice(0, 3).map((risk, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Próximas Acciones</h4>
                    <div className="space-y-2">
                      {dealResult.nextActions.slice(0, 3).map((action, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-background rounded border">
                          <span className="text-sm">{action.action}</span>
                          <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                            {action.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Prevention Tab */}
        <TabsContent value="churn-prevention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Churn Prevention Agent
              </CardTitle>
              <CardDescription>
                Detección de riesgos de churn, análisis de health score y estrategias de retención
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Contexto del Cliente (JSON)</label>
                <Textarea
                  placeholder='{"customer": {"name": "Acme Corp", "mrr": 5000, "tenure_months": 12}}'
                  value={customerContext}
                  onChange={(e) => setCustomerContext(e.target.value)}
                  className="mt-1 font-mono text-xs"
                  rows={4}
                />
              </div>
              <Button onClick={handleRunChurnPrevention} disabled={isLoading}>
                <Play className="h-4 w-4 mr-2" />
                Analizar Riesgo
              </Button>

              {churnResult && (
                <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Análisis de Churn</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Riesgo:</span>
                          <Badge variant={
                            churnResult.churnAnalysis.riskLevel === 'critical' ? 'destructive' :
                            churnResult.churnAnalysis.riskLevel === 'high' ? 'destructive' :
                            churnResult.churnAnalysis.riskLevel === 'medium' ? 'default' : 'secondary'
                          }>
                            {churnResult.churnAnalysis.riskLevel.toUpperCase()} ({churnResult.churnAnalysis.churnRisk}%)
                          </Badge>
                        </div>
                        <p className="text-sm">Valor en riesgo: <span className="font-bold text-red-600">€{churnResult.churnAnalysis.valueAtRisk.toLocaleString()}</span></p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Health Score</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20">General</span>
                          <Progress value={churnResult.healthScore.overall} className="flex-1" />
                          <span className="text-xs font-medium">{churnResult.healthScore.overall}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20">Engagement</span>
                          <Progress value={churnResult.healthScore.engagement} className="flex-1" />
                          <span className="text-xs font-medium">{churnResult.healthScore.engagement}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-20">Adoption</span>
                          <Progress value={churnResult.healthScore.adoption} className="flex-1" />
                          <span className="text-xs font-medium">{churnResult.healthScore.adoption}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Intervenciones Recomendadas</h4>
                    <div className="space-y-2">
                      {churnResult.retentionStrategy.interventions.slice(0, 3).map((intervention, i) => (
                        <div key={i} className="p-2 bg-background rounded border">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">{intervention.type}</Badge>
                            <Badge variant={intervention.timing === 'immediate' ? 'destructive' : 'secondary'}>
                              {intervention.timing}
                            </Badge>
                          </div>
                          <p className="text-sm">{intervention.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Optimization Tab */}
        <TabsContent value="revenue-optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Revenue Optimization Agent
              </CardTitle>
              <CardDescription>
                Identificación de oportunidades de upsell/cross-sell, optimización de pricing y forecasting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleRunRevenueOptimization} disabled={isLoading}>
                <Play className="h-4 w-4 mr-2" />
                Buscar Oportunidades
              </Button>

              {revenueResult && (
                <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <p className="text-2xl font-bold text-green-600">€{revenueResult.forecast.currentMRR.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">MRR Actual</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <p className="text-2xl font-bold text-blue-600">€{revenueResult.forecast.projectedMRR.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">MRR Proyectado</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg border">
                      <div className="flex items-center justify-center gap-1">
                        <p className="text-2xl font-bold">{revenueResult.forecast.growthRate}%</p>
                        {revenueResult.forecast.growthRate > 0 
                          ? <ArrowUpRight className="h-5 w-5 text-green-500" />
                          : <ArrowDownRight className="h-5 w-5 text-red-500" />
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">Crecimiento</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Oportunidades de Revenue</h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {revenueResult.revenueOpportunities.map((opp, i) => (
                          <div key={i} className="p-3 bg-background rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={opp.type === 'upsell' ? 'default' : opp.type === 'cross-sell' ? 'secondary' : 'outline'}>
                                {opp.type}
                              </Badge>
                              <span className="text-sm font-medium text-green-600">+€{(opp.potentialMRR - opp.currentMRR).toLocaleString()}/mes</span>
                            </div>
                            <p className="text-sm">{opp.reasoning}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={opp.probability} className="flex-1" />
                              <span className="text-xs">{opp.probability}% prob.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Plan de Acción</h4>
                    <div className="space-y-2">
                      {revenueResult.actionPlan.slice(0, 3).map((action, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">#{action.priority}</Badge>
                            <span className="text-sm">{action.action}</span>
                          </div>
                          <span className="text-sm font-medium text-green-600">€{action.expectedRevenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AgentOrchestratorDashboard;
