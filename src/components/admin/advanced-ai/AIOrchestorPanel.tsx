/**
 * AI Orchestrator Panel - FASE 12
 * Multi-agent AI orchestration and workflow management
 * Enhanced with metrics, monitoring and automation
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Clock,
  Download,
  Zap,
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  Timer
} from 'lucide-react';
import { useAIOrchestrator, AIAgent, AgentWorkflow, AgentTask } from '@/hooks/admin/advanced/useAIOrchestrator';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

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

// Colores para gráficos
const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4'];

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

  // Datos para gráficos
  const agentStatusData = useMemo(() => {
    const counts = { running: 0, idle: 0, paused: 0, error: 0 };
    agents.forEach(a => {
      const status = a.status as keyof typeof counts;
      if (counts[status] !== undefined) counts[status]++;
    });
    return [
      { name: 'Activos', value: counts.running, color: '#22c55e' },
      { name: 'Inactivos', value: counts.idle, color: '#f59e0b' },
      { name: 'Pausados', value: counts.paused, color: '#3b82f6' },
      { name: 'Error', value: counts.error, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [agents]);

  const tasksByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: status === 'pending' ? 'Pendiente' : 
              status === 'running' ? 'Ejecutando' : 
              status === 'completed' ? 'Completada' : 
              status === 'failed' ? 'Fallida' : status,
      count
    }));
  }, [tasks]);

  const agentPerformance = useMemo(() => {
    return agents.map(a => ({
      name: a.name.substring(0, 10),
      tareas: a.metrics?.tasksCompleted || 0,
      exito: a.metrics?.successRate || 0
    }));
  }, [agents]);

  // Métricas globales
  const globalMetrics = useMemo(() => {
    const totalTasks = agents.reduce((acc, a) => acc + (a.metrics?.tasksCompleted || 0), 0);
    const avgSuccess = agents.length > 0 
      ? Math.round(agents.reduce((acc, a) => acc + (a.metrics?.successRate || 0), 0) / agents.length)
      : 0;
    const activeAgents = agents.filter(a => a.status === 'running').length;
    const activeWorkflows = workflows.filter(w => w.status === 'active').length;
    
    return { totalTasks, avgSuccess, activeAgents, activeWorkflows };
  }, [agents, workflows]);

  // Exportar PDF
  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('AI Orchestrator Report', 20, 25);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('es'), pageWidth - 40, 25);

    // Métricas globales
    doc.setTextColor(0, 0, 0);
    let y = 55;
    doc.setFontSize(14);
    doc.text('Métricas Globales', 20, y);
    y += 10;

    doc.setFontSize(11);
    const metricsData = [
      ['Total Agentes', String(agents.length)],
      ['Agentes Activos', String(globalMetrics.activeAgents)],
      ['Workflows Activos', String(globalMetrics.activeWorkflows)],
      ['Total Tareas Completadas', String(globalMetrics.totalTasks)],
      ['Tasa de Éxito Promedio', `${globalMetrics.avgSuccess}%`]
    ];

    metricsData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 25, y);
      y += 7;
    });

    // Agentes
    y += 10;
    doc.setFontSize(14);
    doc.text('Estado de Agentes', 20, y);
    y += 10;

    doc.setFontSize(10);
    agents.forEach(agent => {
      doc.text(`• ${agent.name} (${agent.type}): ${agent.status} - ${agent.metrics?.successRate || 0}% éxito`, 25, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // Workflows
    y += 10;
    doc.setFontSize(14);
    doc.text('Workflows', 20, y);
    y += 10;

    doc.setFontSize(10);
    workflows.forEach(wf => {
      doc.text(`• ${wf.name}: ${wf.status} - Paso ${wf.currentStep}/${wf.steps?.length || 0}`, 25, y);
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`AI_Orchestrator_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Report exportado correctamente');
  }, [agents, workflows, globalMetrics]);

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
                  {globalMetrics.activeAgents} activos
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Orquestación multi-agente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              className="h-8 gap-1"
            >
              <Download className="h-3 w-3" />
              PDF
            </Button>
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
        {/* Métricas rápidas */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 rounded-lg bg-violet-500/10 text-center">
            <p className="text-lg font-bold">{agents.length}</p>
            <p className="text-xs text-muted-foreground">Agentes</p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10 text-center">
            <p className="text-lg font-bold">{globalMetrics.activeAgents}</p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-center">
            <p className="text-lg font-bold">{globalMetrics.totalTasks}</p>
            <p className="text-xs text-muted-foreground">Tareas</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-center">
            <p className="text-lg font-bold">{globalMetrics.avgSuccess}%</p>
            <p className="text-xs text-muted-foreground">Éxito</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="agents" className="text-xs">Agentes</TabsTrigger>
            <TabsTrigger value="workflows" className="text-xs">Workflows</TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs">Tareas</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[250px]"}>
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
                    <Progress value={agent.metrics?.successRate || 0} className="h-1 mt-2" />
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
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[250px]"}>
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
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[250px]"}>
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

          <TabsContent value="analytics" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[250px]"}>
              <div className="space-y-4">
                {/* Estado de agentes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Network className="h-4 w-4 text-violet-500" />
                      Estado Agentes
                    </h4>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={agentStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {agentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      Tareas por Estado
                    </h4>
                    <div className="h-[150px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tasksByStatus}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Rendimiento de agentes */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Rendimiento por Agente
                  </h4>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={agentPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar yAxisId="left" dataKey="tareas" fill="#8b5cf6" name="Tareas" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="exito" fill="#22c55e" name="% Éxito" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-amber-500" />
                    Insights
                  </h4>
                  {globalMetrics.avgSuccess < 70 && (
                    <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>Tasa de éxito por debajo del objetivo (70%)</span>
                      </div>
                    </div>
                  )}
                  {globalMetrics.activeAgents === 0 && agents.length > 0 && (
                    <div className="p-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-500" />
                        <span>No hay agentes activos actualmente</span>
                      </div>
                    </div>
                  )}
                  {globalMetrics.avgSuccess >= 80 && (
                    <div className="p-2 rounded-lg border border-green-500/30 bg-green-500/10 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Excelente rendimiento del sistema</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default AIOrchestorPanel;
