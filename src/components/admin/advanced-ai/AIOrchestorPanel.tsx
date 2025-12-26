/**
 * AI Orchestrator Panel - FASE 12
 * Multi-agent AI orchestration and workflow management
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Maximize2,
  Minimize2,
  Network,
  Play,
  Pause,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useAIOrchestrator, AIAgent, AgentWorkflow, AgentTask } from '@/hooks/admin/advanced/useAIOrchestrator';
import { cn } from '@/lib/utils';

interface AIOrchestorPanelProps {
  className?: string;
}

const statusIcons = {
  idle: <Clock className="h-3 w-3 text-yellow-500" />,
  running: <Activity className="h-3 w-3 text-green-500 animate-pulse" />,
  paused: <Pause className="h-3 w-3 text-orange-500" />,
  error: <XCircle className="h-3 w-3 text-red-500" />,
  completed: <CheckCircle className="h-3 w-3 text-blue-500" />,
  pending: <Clock className="h-3 w-3 text-muted-foreground" />,
  failed: <XCircle className="h-3 w-3 text-red-500" />,
  assigned: <Activity className="h-3 w-3 text-blue-500" />,
  cancelled: <XCircle className="h-3 w-3 text-gray-500" />,
  draft: <Clock className="h-3 w-3 text-gray-400" />,
  active: <Activity className="h-3 w-3 text-green-500" />
};

export function AIOrchestorPanel({ className }: AIOrchestorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('agents');

  const {
    isLoading,
    agents,
    workflows,
    tasks,
    initialize,
    refreshAgentStatus,
    executeWorkflow,
    toggleWorkflow
  } = useAIOrchestrator();

  useEffect(() => {
    initialize({ environment: 'production' });
  }, [initialize]);

  const handleRefresh = useCallback(() => {
    refreshAgentStatus();
  }, [refreshAgentStatus]);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                AI Orchestrator
                <Badge variant="outline" className="text-xs">
                  {agents.filter(a => a.status === 'running').length} activos
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Orquestación multi-agente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="agents" className="text-xs">Agentes</TabsTrigger>
            <TabsTrigger value="workflows" className="text-xs">Workflows</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tareas</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-2">
                {agents.map((agent: AIAgent) => (
                  <div 
                    key={agent.id} 
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {statusIcons[agent.status as keyof typeof statusIcons]}
                        <span className="font-medium text-sm">{agent.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {agent.type}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">
                        Tareas: {agent.metrics?.tasksCompleted || 0}
                      </span>
                      <span className="text-muted-foreground">
                        Éxito: {agent.metrics?.successRate || 0}%
                      </span>
                    </div>
                  </div>
                ))}
                {agents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay agentes configurados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="workflows" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-2">
                {workflows.map((workflow: AgentWorkflow) => (
                  <div 
                    key={workflow.id} 
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {statusIcons[workflow.status as keyof typeof statusIcons]}
                        <span className="font-medium text-sm">{workflow.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => executeWorkflow(workflow.id)}
                          disabled={workflow.status === 'active'}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => toggleWorkflow(workflow.id, workflow.status === 'active')}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Paso actual</span>
                        <span>{workflow.currentStep}/{workflow.steps?.length || 0}</span>
                      </div>
                      <Progress 
                        value={workflow.steps?.length ? (workflow.currentStep / workflow.steps.length) * 100 : 0} 
                        className="h-1.5" 
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {workflow.steps?.slice(0, 3).map((step, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {step.action}
                        </Badge>
                      ))}
                      {(workflow.steps?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(workflow.steps?.length || 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {workflows.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay workflows configurados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[300px]"}>
              <div className="space-y-2">
                {tasks.map((task: AgentTask) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcons[task.status as keyof typeof statusIcons]}
                        <span className="text-sm">{task.description}</span>
                      </div>
                      <Badge variant={task.priority >= 8 ? 'destructive' : 'secondary'} className="text-xs">
                        P{task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tipo: {task.type}
                    </p>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay tareas pendientes</p>
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

export default AIOrchestorPanel;
