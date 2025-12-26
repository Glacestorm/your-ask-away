import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Sparkles, 
  Bot,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Users,
  Target,
  TrendingUp,
  Settings,
  Eye
} from 'lucide-react';
import { useSupportAgentOrchestrator } from '@/hooks/admin/support/useSupportAgentOrchestrator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AgentOrchestrationPanelProps {
  ticketId?: string;
  ticketContext?: {
    title: string;
    description: string;
    priority: string;
    category: string;
  };
  onSessionCreated?: (sessionId: string) => void;
  className?: string;
}

export function AgentOrchestrationPanel({ 
  ticketId,
  ticketContext,
  onSessionCreated,
  className 
}: AgentOrchestrationPanelProps) {
  const [activeTab, setActiveTab] = useState('agents');

  const {
    isLoading,
    agents,
    sessions,
    activeTasks,
    fetchAgents,
    fetchSessions,
    startOrchestration
  } = useSupportAgentOrchestrator();

  const activeSessions = sessions.filter(s => s.status === 'in_progress');
  const currentSession = activeSessions[0] || null;
  const sessionTasks = activeTasks;

  useEffect(() => {
    fetchAgents();
    fetchSessions();
  }, [fetchAgents, fetchSessions]);

  const handleStartOrchestration = useCallback(async () => {
    if (!ticketId || !ticketContext) return;

    const session = await startOrchestration({
      ticketId,
      issueType: ticketContext.category,
      priorityLevel: ticketContext.priority === 'high' ? 3 : ticketContext.priority === 'medium' ? 2 : 1,
      initialContext: ticketContext as Record<string, unknown>
    });

    if (session) {
      onSessionCreated?.(session.id);
    }
  }, [ticketId, ticketContext, startOrchestration, onSessionCreated]);

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'diagnostic': return <Target className="h-4 w-4" />;
      case 'resolution': return <Zap className="h-4 w-4" />;
      case 'documentation': return <Eye className="h-4 w-4" />;
      case 'escalation': return <Users className="h-4 w-4" />;
      case 'triage': return <Settings className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Activo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Orquestación Multi-Agente
                <Badge variant="outline" className="text-xs">Fase 1</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {agents.length} agentes disponibles • {activeSessions.length} sesiones activas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { fetchAgents(); fetchActiveSessions(); }}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            {ticketId && !currentSession && (
              <Button 
                size="sm"
                onClick={handleStartOrchestration}
                className="bg-gradient-to-r from-violet-500 to-purple-600 text-white"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="agents" className="text-xs">
              <Bot className="h-3 w-3 mr-1" />
              Agentes
            </TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Sesiones
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div 
                    key={agent.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded-md",
                          agent.is_active 
                            ? "bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {getAgentIcon(agent.agent_type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{agent.agent_name}</p>
                          <p className="text-xs text-muted-foreground">{agent.description}</p>
                        </div>
                      </div>
                      {agent.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">Activo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Inactivo</Badge>
                      )}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Umbral: {(agent.confidence_threshold * 100).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Máx: {agent.max_autonomous_actions} acciones
                      </span>
                    </div>

                    {agent.capabilities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 3).map((cap, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] py-0">
                            {cap}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            +{agent.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {agents.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay agentes configurados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {currentSession && (
                  <div className="p-3 rounded-lg border-2 border-violet-500/50 bg-violet-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-violet-400">Sesión Actual</span>
                      {getStatusBadge(currentSession.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Iniciada {formatDistanceToNow(new Date(currentSession.started_at), { locale: es, addSuffix: true })}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progreso</span>
                        <span>{currentSession.overall_confidence}%</span>
                      </div>
                      <Progress value={currentSession.overall_confidence || 0} className="h-1.5" />
                    </div>

                    {sessionTasks.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium">Tareas ({sessionTasks.length})</p>
                        {sessionTasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-xs">
                            {task.status === 'completed' ? (
                              <CheckCircle className="h-3 w-3 text-green-400" />
                            ) : task.status === 'in_progress' ? (
                              <Clock className="h-3 w-3 text-yellow-400 animate-pulse" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="truncate">{task.task_description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSessions.filter(s => s.id !== currentSession?.id).map((session) => (
                  <div 
                    key={session.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Sesión #{session.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.started_at), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  </div>
                ))}

                {activeSessions.length === 0 && !currentSession && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay sesiones activas</p>
                    {ticketId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleStartOrchestration}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Iniciar orquestación
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metrics" className="mt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Auto-resolución</span>
                </div>
                <p className="text-2xl font-bold text-green-400">78%</p>
                <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Tiempo promedio</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">2.5m</p>
                <p className="text-xs text-muted-foreground">-45% vs manual</p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-violet-500/10 to-purple-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-muted-foreground">Agentes activos</span>
                </div>
                <p className="text-2xl font-bold text-violet-400">{agents.filter(a => a.is_active).length}</p>
                <p className="text-xs text-muted-foreground">de {agents.length} configurados</p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-muted-foreground">Confianza media</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">
                  {agents.length > 0 
                    ? (agents.reduce((acc, a) => acc + a.confidence_threshold, 0) / agents.length * 100).toFixed(0)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">umbral de autonomía</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AgentOrchestrationPanel;
