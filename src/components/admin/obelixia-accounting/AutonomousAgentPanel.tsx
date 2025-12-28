/**
 * Autonomous Agent Panel
 * Panel UI para el motor de contabilidad autónoma
 * Fase 3: Autonomous Bookkeeping Engine
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bot,
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RefreshCw,
  FileText,
  ArrowRightLeft,
  BookOpen,
  AlertTriangle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { useObelixiaAccountingAgent, AgentDecision, LearningRule, AutonomyLevel } from '@/hooks/admin/obelixia-accounting/useObelixiaAccountingAgent';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function AutonomousAgentPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({ 
    ruleName: '', 
    ruleType: 'pattern' as const,
    conditions: [] as Array<{ field: string; operator: 'contains'; value: string }>,
    actions: [] as Array<{ actionType: 'assign_account'; parameters: { accountCode: string } }>,
    patternInput: '',
    accountInput: ''
  });

  const {
    isActive,
    isProcessing,
    config,
    recentDecisions,
    learningRules,
    metrics,
    updateConfig,
    setAutonomyLevel,
    toggleAgent,
    approveDecision,
    rejectDecision,
    fetchLearningRules,
    createLearningRule,
    deleteLearningRule,
    fetchMetrics
  } = useObelixiaAccountingAgent();

  useEffect(() => {
    fetchLearningRules();
    fetchMetrics();
  }, []);

  const pendingDecisions = recentDecisions.filter(d => d.wasApproved === undefined);

  const handleApprove = async (decision: AgentDecision) => {
    await approveDecision(decision.id);
    toast.success('Decisión aprobada y ejecutada');
  };

  const handleReject = async (decision: AgentDecision) => {
    await rejectDecision(decision.id, 'Rechazado manualmente por el usuario');
    toast.info('Decisión rechazada');
  };

  const handleCreateRule = async () => {
    if (!newRule.patternInput || !newRule.accountInput) {
      toast.error('Patrón y cuenta son obligatorios');
      return;
    }
    
    await createLearningRule({
      ruleName: `Regla: ${newRule.patternInput}`,
      ruleType: 'pattern',
      conditions: [{ field: 'description', operator: 'contains', value: newRule.patternInput }],
      actions: [{ actionType: 'assign_account', parameters: { accountCode: newRule.accountInput } }],
      confidence: 0.8,
      isActive: true,
      lastApplied: undefined
    });
    
    setNewRule({ 
      ruleName: '', 
      ruleType: 'pattern',
      conditions: [],
      actions: [],
      patternInput: '',
      accountInput: ''
    });
    setShowNewRuleForm(false);
    toast.success('Regla creada correctamente');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-500';
    if (confidence >= 0.7) return 'text-amber-500';
    return 'text-red-500';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return 'default';
    if (confidence >= 0.7) return 'secondary';
    return 'destructive';
  };

  const getAutonomyLabel = (level: AutonomyLevel) => {
    switch(level) {
      case 'suggestion': return 'Manual';
      case 'auto_register': return 'Supervisado';
      case 'full_autonomy': return 'Completo';
      default: return level;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Agente Autónomo
              <Badge variant={isActive ? 'default' : 'secondary'} className="ml-2">
                {isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Motor de contabilidad autónoma con IA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isActive ? 'destructive' : 'default'}
            onClick={toggleAgent}
            disabled={isProcessing}
            className="gap-2"
          >
            {isActive ? (
              <>
                <Pause className="h-4 w-4" />
                Detener
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Iniciar
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={fetchMetrics} disabled={isProcessing}>
            <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Decisiones Hoy</span>
            </div>
            <p className="text-2xl font-bold">{metrics?.decisionsToday || 0}</p>
            <p className="text-xs text-muted-foreground">procesadas hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">Auto-aprobadas</span>
            </div>
            <p className="text-2xl font-bold">{metrics?.autoApprovedDecisions || 0}</p>
            <p className="text-xs text-muted-foreground">
              {metrics?.totalDecisions ? 
                `${((metrics.autoApprovedDecisions / metrics.totalDecisions) * 100).toFixed(0)}% del total` 
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">Precisión</span>
            </div>
            <p className="text-2xl font-bold">{((metrics?.accuracyRate || 0) * 100).toFixed(1)}%</p>
            <Progress value={(metrics?.accuracyRate || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Pendientes</span>
            </div>
            <p className="text-2xl font-bold">{pendingDecisions.length}</p>
            <p className="text-xs text-muted-foreground">requieren revisión</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="decisions" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Decisiones
            {pendingDecisions.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                {pendingDecisions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Reglas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Agent Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Estado del Agente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nivel de Autonomía</span>
                  <Badge variant={
                    config.autonomyLevel === 'full_autonomy' ? 'default' :
                    config.autonomyLevel === 'auto_register' ? 'secondary' : 'outline'
                  }>
                    {getAutonomyLabel(config.autonomyLevel)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Umbral de Confianza</span>
                  <span className="font-medium">{config.confidenceThreshold}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Aprendizaje activo</span>
                  <Switch checked={config.learningEnabled} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notificar acciones</span>
                  <Switch checked={config.notifyOnAction} disabled />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {recentDecisions.length > 0 ? (
                      recentDecisions.slice(0, 5).map((decision) => (
                        <div key={decision.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                          <div className={cn(
                            "p-1.5 rounded-full",
                            decision.decisionType === 'classification' ? 'bg-blue-100 dark:bg-blue-950' :
                            decision.decisionType === 'entry_creation' ? 'bg-emerald-100 dark:bg-emerald-950' :
                            'bg-amber-100 dark:bg-amber-950'
                          )}>
                            {decision.decisionType === 'classification' ? (
                              <ArrowRightLeft className="h-3 w-3 text-blue-600" />
                            ) : decision.decisionType === 'entry_creation' ? (
                              <FileText className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-amber-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{decision.reasoning}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(decision.timestamp), { locale: es, addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin actividad reciente</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decisiones Pendientes de Aprobación</CardTitle>
              <CardDescription>
                Revisa y aprueba las clasificaciones sugeridas por el agente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {pendingDecisions.length > 0 ? (
                  <div className="space-y-3">
                    {pendingDecisions.map((decision) => (
                      <div 
                        key={decision.id} 
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getConfidenceBadge(decision.confidence / 100) as 'default' | 'secondary' | 'destructive'}>
                                {decision.confidence.toFixed(0)}% confianza
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(decision.timestamp), { locale: es, addSuffix: true })}
                              </span>
                            </div>
                            <p className="font-medium">{decision.decisionType}</p>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span className="font-medium">Razonamiento: </span>
                              <span className="text-primary">{decision.reasoning}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleApprove(decision)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(decision)}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-50" />
                    <p className="font-medium">No hay decisiones pendientes</p>
                    <p className="text-sm">El agente está procesando automáticamente</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Reglas de Aprendizaje</CardTitle>
                  <CardDescription>
                    Patrones aprendidos para clasificación automática
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowNewRuleForm(!showNewRuleForm)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Regla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showNewRuleForm && (
                <div className="p-4 mb-4 rounded-lg border bg-muted/30 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pattern">Patrón de texto</Label>
                      <Input
                        id="pattern"
                        placeholder="ej: AMAZON, MERCADONA..."
                        value={newRule.patternInput}
                        onChange={(e) => setNewRule({ ...newRule, patternInput: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountCode">Cuenta contable</Label>
                      <Input
                        id="accountCode"
                        placeholder="ej: 629"
                        value={newRule.accountInput}
                        onChange={(e) => setNewRule({ ...newRule, accountInput: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowNewRuleForm(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleCreateRule}>
                      Crear Regla
                    </Button>
                  </div>
                </div>
              )}

              <ScrollArea className="h-[350px]">
                {learningRules.length > 0 ? (
                  <div className="space-y-2">
                    {learningRules.map((rule) => {
                      const patternCondition = rule.conditions.find(c => c.field === 'description');
                      const accountAction = rule.actions.find(a => a.actionType === 'assign_account');
                      
                      return (
                        <div 
                          key={rule.id} 
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <BookOpen className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{rule.ruleName}</span>
                                {patternCondition && accountAction && (
                                  <>
                                    <span className="text-muted-foreground">→</span>
                                    <Badge variant="outline">
                                      {(accountAction.parameters as { accountCode: string }).accountCode}
                                    </Badge>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className={getConfidenceColor(rule.confidence)}>
                                  {(rule.confidence * 100).toFixed(0)}% confianza
                                </span>
                                <span>•</span>
                                <span>{rule.timesApplied} usos</span>
                                {rule.lastApplied && (
                                  <>
                                    <span>•</span>
                                    <span>Último: {formatDistanceToNow(new Date(rule.lastApplied), { locale: es, addSuffix: true })}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteLearningRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Sin reglas definidas</p>
                    <p className="text-sm">El agente aprenderá automáticamente de tus decisiones</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración del Agente</CardTitle>
              <CardDescription>
                Ajusta el comportamiento del motor autónomo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Autonomy Level */}
              <div className="space-y-3">
                <Label>Nivel de Autonomía</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(['suggestion', 'auto_register', 'full_autonomy'] as AutonomyLevel[]).map((level) => (
                    <Button
                      key={level}
                      variant={config.autonomyLevel === level ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => setAutonomyLevel(level)}
                    >
                      {getAutonomyLabel(level)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {config.autonomyLevel === 'suggestion' && 'Todas las decisiones requieren aprobación manual'}
                  {config.autonomyLevel === 'auto_register' && 'Solo decisiones con alta confianza se ejecutan automáticamente'}
                  {config.autonomyLevel === 'full_autonomy' && 'El agente opera con mínima supervisión'}
                </p>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Umbral de Confianza</Label>
                  <span className="text-sm font-medium">{config.confidenceThreshold}%</span>
                </div>
                <Slider
                  value={[config.confidenceThreshold]}
                  onValueChange={(values) => updateConfig({ confidenceThreshold: values[0] })}
                  min={50}
                  max={99}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Clasificaciones por debajo de este umbral requerirán revisión
                </p>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aprendizaje continuo</Label>
                    <p className="text-xs text-muted-foreground">
                      Aprender de las correcciones del usuario
                    </p>
                  </div>
                  <Switch 
                    checked={config.learningEnabled}
                    onCheckedChange={(checked) => updateConfig({ learningEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notificar acciones</Label>
                    <p className="text-xs text-muted-foreground">
                      Mostrar notificaciones de acciones automáticas
                    </p>
                  </div>
                  <Switch 
                    checked={config.notifyOnAction}
                    onCheckedChange={(checked) => updateConfig({ notifyOnAction: checked })}
                  />
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-amber-600 mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium text-sm">Zona de precaución</span>
                </div>
                <Button variant="outline" className="w-full text-red-600 hover:bg-red-50">
                  Reiniciar reglas de aprendizaje
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AutonomousAgentPanel;
