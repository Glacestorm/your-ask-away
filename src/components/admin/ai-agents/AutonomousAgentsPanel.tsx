import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity,
  TrendingUp,
  Users,
  DollarSign,
  Settings,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAutonomousAgents } from '@/hooks/admin/useAutonomousAgents';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const agentIcons: Record<string, React.ReactNode> = {
  sales: <TrendingUp className="h-4 w-4" />,
  customer_success: <Users className="h-4 w-4" />,
  finance: <DollarSign className="h-4 w-4" />,
  operations: <Settings className="h-4 w-4" />
};

const agentColors: Record<string, string> = {
  sales: 'bg-green-500/10 text-green-500 border-green-500/20',
  customer_success: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  finance: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  operations: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

export function AutonomousAgentsPanel() {
  const [activeTab, setActiveTab] = useState('agents');
  const {
    agents,
    executions,
    pendingActions,
    isLoading,
    fetchAgents,
    fetchExecutions,
    fetchPendingActions,
    executeAgent,
    approveAction
  } = useAutonomousAgents();

  useEffect(() => {
    fetchAgents();
    fetchExecutions();
    fetchPendingActions();
  }, []);

  const handleExecuteAgent = async (agentId: string) => {
    await executeAgent(agentId, {
      metrics: {},
      recentActivity: []
    });
    fetchExecutions();
  };

  const handleApproveAction = async (actionId: string) => {
    await approveAction(actionId);
    fetchPendingActions();
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Agentes Autónomos IA</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {agents.filter(a => a.is_active).length} agentes activos
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => { fetchAgents(); fetchExecutions(); fetchPendingActions(); }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="agents" className="text-xs">Agentes</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs relative">
              Pendientes
              {pendingActions.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                  {pendingActions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-0">
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div 
                    key={agent.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      agent.is_active 
                        ? "bg-card hover:bg-muted/50" 
                        : "bg-muted/30 opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded-lg border",
                          agentColors[agent.agent_type] || 'bg-muted'
                        )}>
                          {agentIcons[agent.agent_type] || <Bot className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{agent.agent_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {agent.agent_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={agent.is_active} 
                          className="scale-75"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => handleExecuteAgent(agent.id)}
                          disabled={!agent.is_active || isLoading}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Ejecutar
                        </Button>
                      </div>
                    </div>
                    
                    {agent.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {agent.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>Confianza: {(agent.confidence_threshold || 0.8) * 100}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        <span>Max: {agent.max_actions_per_hour || 10}/h</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {agent.execution_mode || 'assisted'}
                      </Badge>
                    </div>
                  </div>
                ))}

                {agents.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay agentes configurados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-3">
                {pendingActions.map((action) => (
                  <div 
                    key={action.id}
                    className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{action.action_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {action.action_type}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendiente
                      </Badge>
                    </div>

                    {action.confidence_score && (
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Confianza</span>
                          <span>{Math.round(action.confidence_score * 100)}%</span>
                        </div>
                        <Progress value={action.confidence_score * 100} className="h-1.5" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleApproveAction(action.id)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Aprobar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 h-7 text-xs"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}

                {pendingActions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30 text-green-500" />
                    <p className="text-sm">No hay acciones pendientes</p>
                    <p className="text-xs mt-1">Todas las acciones han sido procesadas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-2">
                {executions.slice(0, 20).map((exec) => (
                  <div 
                    key={exec.id}
                    className="p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {exec.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : exec.status === 'failed' ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{exec.trigger_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {exec.started_at ? formatDistanceToNow(new Date(exec.started_at), { 
                              addSuffix: true, 
                              locale: es 
                            }) : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {exec.execution_time_ms && (
                          <span>{exec.execution_time_ms}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {executions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin ejecuciones recientes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AutonomousAgentsPanel;
