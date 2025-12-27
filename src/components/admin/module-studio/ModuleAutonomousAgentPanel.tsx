/**
 * ModuleAutonomousAgentPanel - Phase 3
 * Panel del agente autónomo para gestión automática de módulos
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Pause,
  Zap,
  GitBranch,
  RotateCcw,
  Wrench,
  Eye,
  ChevronRight,
  Clock,
  Loader2,
  Heart,
  Network
} from 'lucide-react';
import { useModuleAutonomousAgent, type ModuleAgentContext, type PropagationPlan, type SelfHealingAction, type ModuleHealthStatus } from '@/hooks/admin/useModuleAutonomousAgent';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleAutonomousAgentPanelProps {
  context: ModuleAgentContext | null;
  onChangesApplied?: (changes: Record<string, unknown>) => void;
  className?: string;
}

export function ModuleAutonomousAgentPanel({
  context,
  onChangesApplied,
  className
}: ModuleAutonomousAgentPanelProps) {
  const [activeTab, setActiveTab] = useState('health');
  const [selectedPlan, setSelectedPlan] = useState<PropagationPlan | null>(null);

  const {
    isProcessing,
    healthStatuses,
    propagationPlans,
    selfHealingActions,
    executions,
    agentActive,
    setAgentActive,
    checkModuleHealth,
    analyzeChangePropagation,
    executePropagation,
    approvePlan,
    rejectPlan,
    autoFixIssue,
    applySelfHealing,
    smartRollback,
    getHealthColor,
    getRiskColor
  } = useModuleAutonomousAgent();

  // Get current module health
  const currentHealth = context 
    ? healthStatuses.find(h => h.moduleKey === context.moduleKey)
    : null;

  // Check health on context change
  useEffect(() => {
    if (context && agentActive) {
      checkModuleHealth(context);
    }
  }, [context?.moduleKey, agentActive]);

  // === HANDLERS ===
  const handleCheckHealth = useCallback(() => {
    if (context) {
      checkModuleHealth(context);
    }
  }, [context, checkModuleHealth]);

  const handleAnalyzePropagation = useCallback(async () => {
    if (context) {
      // Mock proposed changes for demo
      const mockChanges = {
        version: '2.0.0',
        features: { newFeature: true }
      };
      await analyzeChangePropagation(context, mockChanges);
      setActiveTab('propagation');
    }
  }, [context, analyzeChangePropagation]);

  const handleSmartRollback = useCallback(async () => {
    if (context) {
      await smartRollback(context);
    }
  }, [context, smartRollback]);

  const handleAutoFix = useCallback(async (issue: ModuleHealthStatus['issues'][0]) => {
    if (context) {
      await autoFixIssue(context, issue);
      setActiveTab('healing');
    }
  }, [context, autoFixIssue]);

  // === RENDER STATUS ICON ===
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // === INACTIVE STATE ===
  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-8 text-center">
          <Bot className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un módulo para activar el agente autónomo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Header */}
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Agente Autónomo
                <Badge variant={agentActive ? "default" : "secondary"} className="text-[10px]">
                  {agentActive ? 'ACTIVO' : 'PAUSADO'}
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {context.moduleName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={agentActive}
              onCheckedChange={setAgentActive}
              className="data-[state=checked]:bg-violet-500"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCheckHealth}
              disabled={isProcessing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-3 overflow-hidden flex flex-col">
        {/* Quick Actions */}
        <div className="flex gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyzePropagation}
            disabled={isProcessing}
            className="flex-1 text-xs"
          >
            <GitBranch className="h-3 w-3 mr-1" />
            Propagar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSmartRollback}
            disabled={isProcessing}
            className="flex-1 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Rollback
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mb-2">
            <TabsTrigger value="health" className="text-xs px-2">
              <Heart className="h-3 w-3 mr-1" />
              Salud
            </TabsTrigger>
            <TabsTrigger value="propagation" className="text-xs px-2">
              <Network className="h-3 w-3 mr-1" />
              Prop.
            </TabsTrigger>
            <TabsTrigger value="healing" className="text-xs px-2">
              <Wrench className="h-3 w-3 mr-1" />
              Fix
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-2">
              <Clock className="h-3 w-3 mr-1" />
              Log
            </TabsTrigger>
          </TabsList>

          {/* Health Tab */}
          <TabsContent value="health" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {/* Health Score */}
                {currentHealth ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Estado General</span>
                      {renderStatusIcon(currentHealth.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Puntuación de Salud</span>
                        <span className={cn("font-bold", getHealthColor(currentHealth.status))}>
                          {currentHealth.healthScore}%
                        </span>
                      </div>
                      <Progress 
                        value={currentHealth.healthScore} 
                        className="h-2"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Última verificación: {formatDistanceToNow(new Date(currentHealth.lastChecked), { locale: es, addSuffix: true })}
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                    Analizando salud del módulo...
                  </div>
                )}

                {/* Issues */}
                {currentHealth?.issues && currentHealth.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Problemas Detectados ({currentHealth.issues.length})
                    </h4>
                    <AnimatePresence>
                      {currentHealth.issues.map((issue, idx) => (
                        <motion.div
                          key={issue.id || idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                                  className="text-[10px]"
                                >
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {issue.type}
                                </Badge>
                              </div>
                              <p className="text-xs">{issue.description}</p>
                              {issue.suggestedFix && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  💡 {issue.suggestedFix}
                                </p>
                              )}
                            </div>
                            {issue.autoFixable && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAutoFix(issue)}
                                className="h-6 px-2 text-[10px]"
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Fix
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Recommendations */}
                {currentHealth?.recommendations && currentHealth.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">
                      Recomendaciones
                    </h4>
                    {currentHealth.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg border border-dashed bg-muted/30 text-xs flex items-start gap-2"
                      >
                        <ChevronRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Propagation Tab */}
          <TabsContent value="propagation" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {propagationPlans.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay planes de propagación pendientes</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAnalyzePropagation}
                      className="mt-2"
                    >
                      Analizar Cambios
                    </Button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {propagationPlans.map((plan, idx) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          "p-3 rounded-lg border bg-card",
                          selectedPlan?.id === plan.id && "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-medium">{plan.changeDescription}</h4>
                            <p className="text-[10px] text-muted-foreground">
                              Desde: {plan.sourceModule}
                            </p>
                          </div>
                          <Badge className={cn("text-[10px]", getRiskColor(plan.totalRisk))}>
                            Riesgo {plan.totalRisk}
                          </Badge>
                        </div>

                        <div className="space-y-1 mb-2">
                          <p className="text-xs text-muted-foreground">
                            Módulos afectados: {plan.affectedModules.length}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {plan.affectedModules.slice(0, 3).map((mod, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {mod.moduleName}
                              </Badge>
                            ))}
                            {plan.affectedModules.length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{plan.affectedModules.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground mb-2">
                          {plan.estimatedImpact}
                        </p>

                        {plan.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                approvePlan(plan.id);
                                executePropagation(plan.id);
                              }}
                              disabled={isProcessing}
                              className="flex-1 h-7 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprobar y Ejecutar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => rejectPlan(plan.id)}
                              className="h-7 text-xs"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {plan.status === 'executing' && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Ejecutando...
                          </div>
                        )}

                        {plan.status === 'completed' && (
                          <Badge variant="default" className="text-[10px]">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completado
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Self-Healing Tab */}
          <TabsContent value="healing" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-2">
                {selfHealingActions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay acciones de auto-reparación</p>
                    <p className="text-xs mt-1">
                      Las reparaciones se generan automáticamente al detectar problemas
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {selfHealingActions.map((action, idx) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="text-[10px] mb-1">
                              {action.issue.type}
                            </Badge>
                            <p className="text-xs">{action.issue.description}</p>
                          </div>
                          <Badge
                            variant={action.status === 'applied' ? 'default' : 'secondary'}
                            className="text-[10px]"
                          >
                            {action.status}
                          </Badge>
                        </div>

                        <div className="p-2 rounded bg-muted/50 mb-2">
                          <p className="text-[10px] font-medium">Reparación propuesta:</p>
                          <p className="text-xs text-muted-foreground">{action.proposedFix}</p>
                        </div>

                        {action.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => applySelfHealing(action.id)}
                            disabled={isProcessing}
                            className="w-full h-7 text-xs"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Aplicar Reparación
                          </Button>
                        )}

                        {action.status === 'applied' && action.result && (
                          <p className="text-[10px] text-green-600">
                            ✓ {action.result}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                {executions.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay ejecuciones registradas</p>
                  </div>
                ) : (
                  executions.map((exec, idx) => (
                    <motion.div
                      key={exec.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-2 rounded-lg border bg-card text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {exec.status === 'running' && (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                          )}
                          {exec.status === 'completed' && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                          {exec.status === 'failed' && (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className="font-medium">{exec.action}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(exec.startedAt), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                      {exec.error && (
                        <p className="text-[10px] text-red-500 mt-1">{exec.error}</p>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleAutonomousAgentPanel;
