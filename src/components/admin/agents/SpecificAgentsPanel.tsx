/**
 * Specific AI Agents Panel
 * Panel de gestión de agentes IA específicos (Sales, CS, Finance, Operations)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot,
  TrendingUp,
  Users,
  DollarSign,
  Settings2,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  Target,
  HeadphonesIcon,
  Calculator,
  Cog
} from 'lucide-react';
import { useAutonomousAgents, type AutonomousAgent } from '@/hooks/admin/useAutonomousAgents';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// Definición de agentes específicos
const SPECIFIC_AGENTS = [
  {
    type: 'sales',
    name: 'Sales Agent',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    description: 'Automatiza seguimientos, calificación de leads y gestión del pipeline de ventas',
    capabilities: [
      'Seguimiento automático de leads',
      'Calificación inteligente',
      'Emails personalizados',
      'Predicción de cierre',
      'Scheduling de reuniones'
    ],
    metrics: [
      { label: 'Leads procesados', value: 847, change: '+12%' },
      { label: 'Conversión', value: '34%', change: '+5%' },
      { label: 'Tiempo respuesta', value: '< 5min', change: '-40%' }
    ]
  },
  {
    type: 'customer_success',
    name: 'CS Agent',
    icon: HeadphonesIcon,
    color: 'from-blue-500 to-indigo-600',
    description: 'Gestión proactiva de clientes, detección de churn y optimización de satisfacción',
    capabilities: [
      'Detección proactiva de churn',
      'Intervenciones automáticas',
      'Health score dinámico',
      'Onboarding asistido',
      'Upsell inteligente'
    ],
    metrics: [
      { label: 'Churn prevenido', value: 23, change: '+8' },
      { label: 'NPS', value: 72, change: '+4' },
      { label: 'CSAT', value: '94%', change: '+2%' }
    ]
  },
  {
    type: 'finance',
    name: 'Finance Agent',
    icon: Calculator,
    color: 'from-amber-500 to-orange-600',
    description: 'Reconciliación automática, alertas de cash flow y gestión de cobros',
    capabilities: [
      'Reconciliación bancaria',
      'Alertas de cash flow',
      'Cobros automatizados',
      'Predicción de ingresos',
      'Detección de anomalías'
    ],
    metrics: [
      { label: 'Reconciliado', value: '€2.4M', change: '+15%' },
      { label: 'Cobros', value: 156, change: '+23' },
      { label: 'Ahorro tiempo', value: '20h/sem', change: '' }
    ]
  },
  {
    type: 'operations',
    name: 'Operations Agent',
    icon: Cog,
    color: 'from-purple-500 to-violet-600',
    description: 'Optimización de recursos, scheduling inteligente y predicción de demanda',
    capabilities: [
      'Asignación de recursos',
      'Scheduling optimizado',
      'Predicción de demanda',
      'Alertas operativas',
      'Automatización de procesos'
    ],
    metrics: [
      { label: 'Eficiencia', value: '+35%', change: '+5%' },
      { label: 'Tareas auto', value: 1240, change: '+180' },
      { label: 'SLA cumplido', value: '99.2%', change: '+0.4%' }
    ]
  }
];

interface AgentConfig {
  isActive: boolean;
  confidenceThreshold: number;
  maxActionsPerHour: number;
  systemPrompt: string;
  executionMode: 'autonomous' | 'supervised' | 'manual';
}

export function SpecificAgentsPanel() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentConfigs, setAgentConfigs] = useState<Record<string, AgentConfig>>({});
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AgentConfig | null>(null);

  const {
    agents,
    executions,
    pendingActions,
    isLoading,
    lastRefresh,
    fetchAgents,
    executeAgent,
    approveAction,
    configureAgent,
    startAutoRefresh,
    stopAutoRefresh
  } = useAutonomousAgents();

  useEffect(() => {
    startAutoRefresh(30000);
    return () => stopAutoRefresh();
  }, []);

  // Map agents to specific types
  const getAgentByType = (type: string): AutonomousAgent | undefined => {
    return agents.find(a => a.agent_type === type || a.agent_name.toLowerCase().includes(type));
  };

  const handleToggleAgent = async (agentType: string, isActive: boolean) => {
    const agent = getAgentByType(agentType);
    if (agent) {
      await configureAgent(agent.id, { is_active: isActive });
    } else {
      // Create agent if doesn't exist
      toast.info(`Agente ${agentType} será creado cuando se configure`);
    }
  };

  const handleExecuteAgent = async (agentType: string) => {
    const agent = getAgentByType(agentType);
    if (agent) {
      await executeAgent(agent.id, {
        metrics: {},
        recentActivity: [],
        currentUser: { id: 'system', role: 'admin' }
      });
    } else {
      toast.error('Agente no encontrado');
    }
  };

  const handleConfigureAgent = (agentType: string) => {
    const agent = getAgentByType(agentType);
    setEditingConfig({
      isActive: agent?.is_active ?? false,
      confidenceThreshold: agent?.confidence_threshold ?? 80,
      maxActionsPerHour: agent?.max_actions_per_hour ?? 10,
      systemPrompt: agent?.system_prompt ?? '',
      executionMode: (agent?.execution_mode as AgentConfig['executionMode']) ?? 'supervised'
    });
    setSelectedAgent(agentType);
    setShowConfigDialog(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedAgent || !editingConfig) return;

    const agent = getAgentByType(selectedAgent);
    if (agent) {
      await configureAgent(agent.id, {
        is_active: editingConfig.isActive,
        confidence_threshold: editingConfig.confidenceThreshold,
        max_actions_per_hour: editingConfig.maxActionsPerHour,
        system_prompt: editingConfig.systemPrompt,
        execution_mode: editingConfig.executionMode
      });
    }
    
    setShowConfigDialog(false);
    toast.success('Configuración guardada');
  };

  const getAgentStatus = (agentType: string) => {
    const agent = getAgentByType(agentType);
    if (!agent) return 'inactive';
    if (!agent.is_active) return 'paused';
    return 'active';
  };

  const getRecentExecutions = (agentType: string) => {
    return executions.filter(e => {
      const agent = getAgentByType(agentType);
      return agent && e.agent_id === agent.id;
    }).slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Agentes IA Específicos
          </h2>
          <p className="text-muted-foreground">
            Agentes autónomos especializados para ventas, CS, finanzas y operaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAgents} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Actualizado {formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SPECIFIC_AGENTS.map((agentDef) => {
          const status = getAgentStatus(agentDef.type);
          const agent = getAgentByType(agentDef.type);
          const Icon = agentDef.icon;
          const recentExecs = getRecentExecutions(agentDef.type);

          return (
            <Card key={agentDef.type} className="overflow-hidden">
              <CardHeader className={cn(
                "pb-2 bg-gradient-to-r text-white",
                agentDef.color
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agentDef.name}</CardTitle>
                      <p className="text-xs text-white/80">{agentDef.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-xs",
                      status === 'active' ? 'bg-green-500' : 
                      status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                    )}>
                      {status === 'active' ? 'Activo' : status === 'paused' ? 'Pausado' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {agentDef.metrics.map((metric, idx) => (
                    <div key={idx} className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      {metric.change && (
                        <Badge variant="outline" className="text-xs text-success mt-1">
                          {metric.change}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {/* Capabilities */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Capacidades:</p>
                  <div className="flex flex-wrap gap-1">
                    {agentDef.capabilities.slice(0, 3).map((cap, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                    {agentDef.capabilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agentDef.capabilities.length - 3} más
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                {recentExecs.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Actividad reciente:</p>
                    <ScrollArea className="h-20">
                      <div className="space-y-1">
                        {recentExecs.map((exec) => (
                          <div key={exec.id} className="flex items-center gap-2 text-xs">
                            {exec.status === 'completed' ? (
                              <CheckCircle className="h-3 w-3 text-success" />
                            ) : exec.status === 'running' ? (
                              <Activity className="h-3 w-3 text-primary animate-pulse" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            )}
                            <span className="flex-1 truncate">{exec.trigger_type}</span>
                            <span className="text-muted-foreground">
                              {exec.started_at && formatDistanceToNow(new Date(exec.started_at), { locale: es, addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={status === 'active'}
                      onCheckedChange={(checked) => handleToggleAgent(agentDef.type, checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {status === 'active' ? 'Encendido' : 'Apagado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExecuteAgent(agentDef.type)}
                      disabled={status !== 'active' || isLoading}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Ejecutar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleConfigureAgent(agentDef.type)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Acciones Pendientes de Aprobación
              <Badge variant="destructive" className="ml-2">{pendingActions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {pendingActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{action.action_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.ai_autonomous_agents?.agent_name} • Confianza: {action.confidence_score}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => approveAction(action.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Agente</DialogTitle>
          </DialogHeader>

          {editingConfig && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Agente activo</Label>
                <Switch 
                  checked={editingConfig.isActive}
                  onCheckedChange={(checked) => setEditingConfig({...editingConfig, isActive: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label>Modo de ejecución</Label>
                <div className="flex gap-2">
                  {['autonomous', 'supervised', 'manual'].map((mode) => (
                    <Button
                      key={mode}
                      variant={editingConfig.executionMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditingConfig({...editingConfig, executionMode: mode as AgentConfig['executionMode']})}
                    >
                      {mode === 'autonomous' ? 'Autónomo' : mode === 'supervised' ? 'Supervisado' : 'Manual'}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Umbral de confianza: {editingConfig.confidenceThreshold}%</Label>
                <Slider
                  value={[editingConfig.confidenceThreshold]}
                  onValueChange={([val]) => setEditingConfig({...editingConfig, confidenceThreshold: val})}
                  min={50}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Máx. acciones por hora: {editingConfig.maxActionsPerHour}</Label>
                <Slider
                  value={[editingConfig.maxActionsPerHour]}
                  onValueChange={([val]) => setEditingConfig({...editingConfig, maxActionsPerHour: val})}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Prompt del sistema</Label>
                <Textarea
                  value={editingConfig.systemPrompt}
                  onChange={(e) => setEditingConfig({...editingConfig, systemPrompt: e.target.value})}
                  placeholder="Instrucciones personalizadas para el agente..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig}>
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SpecificAgentsPanel;
