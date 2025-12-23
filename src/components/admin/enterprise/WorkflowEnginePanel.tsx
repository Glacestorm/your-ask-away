/**
 * WorkflowEnginePanel
 * Motor de Automatización de Workflows
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Workflow, 
  AlertTriangle,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  History,
  Settings
} from 'lucide-react';
import { useWorkflowEngine, type WorkflowContext } from '@/hooks/admin/useWorkflowEngine';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface WorkflowEnginePanelProps {
  context?: WorkflowContext;
  className?: string;
}

export function WorkflowEnginePanel({ 
  context = { organizationId: 'default' },
  className 
}: WorkflowEnginePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    isLoading,
    workflows,
    executions,
    rules,
    error,
    lastRefresh,
    getWorkflows,
    executeWorkflow,
    toggleWorkflow,
    generateWorkflow,
    startAutoRefresh,
    stopAutoRefresh
  } = useWorkflowEngine();

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    startAutoRefresh(context, 60000);
    return () => stopAutoRefresh();
  }, [context.organizationId]);

  const handleRefresh = useCallback(async () => {
    await getWorkflows(context);
  }, [context, getWorkflows]);

  const handleGenerateWorkflow = useCallback(async () => {
    if (!aiPrompt.trim()) {
      toast.error('Describe el workflow que quieres crear');
      return;
    }
    setIsGenerating(true);
    const result = await generateWorkflow(aiPrompt, context as unknown as Record<string, unknown>);
    if (result) {
      toast.success('Workflow generado con IA');
      setAiPrompt('');
    }
    setIsGenerating(false);
  }, [aiPrompt, context, generateWorkflow]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Activo</Badge>;
      case 'paused': return <Badge variant="secondary">Pausado</Badge>;
      case 'completed': return <Badge className="bg-blue-500">Completado</Badge>;
      case 'failed': return <Badge variant="destructive">Fallido</Badge>;
      case 'running': return <Badge className="bg-yellow-500 text-black animate-pulse">Ejecutando</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExecutionIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Workflow Engine
                <Badge variant="outline" className="text-xs">
                  {workflows.filter(w => w.status === 'active').length} activos
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
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
        {error ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-3">
              <TabsTrigger value="workflows" className="text-xs">Workflows</TabsTrigger>
              <TabsTrigger value="executions" className="text-xs">Ejecuciones</TabsTrigger>
              <TabsTrigger value="rules" className="text-xs">Reglas</TabsTrigger>
              <TabsTrigger value="create" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Crear IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workflows" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {workflows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Workflow className="h-8 w-8 mb-2" />
                    <p className="text-sm">Sin workflows configurados</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">{workflow.name}</p>
                            <p className="text-xs text-muted-foreground">{workflow.description}</p>
                          </div>
                          {getStatusBadge(workflow.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Zap className="h-3 w-3" />
                            <span>{workflow.trigger ? 1 : 0} trigger</span>
                            <span>•</span>
                            <span>{workflow.steps?.length || 0} pasos</span>
                          </div>
                          <div className="flex gap-1">
                            {workflow.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleWorkflow(workflow.id, 'pause')}
                                className="h-7 w-7 p-0"
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleWorkflow(workflow.id, 'resume')}
                                className="h-7 w-7 p-0"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => executeWorkflow(workflow.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Zap className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="executions" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {executions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <History className="h-8 w-8 mb-2" />
                    <p className="text-sm">Sin ejecuciones recientes</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {executions.map((execution) => (
                      <div key={execution.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          {getExecutionIcon(execution.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{execution.workflowId}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(execution.startedAt), { locale: es, addSuffix: true })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {execution.duration ? `${execution.duration}ms` : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="rules" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[280px]"}>
                {rules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Settings className="h-8 w-8 mb-2" />
                    <p className="text-sm">Sin reglas de automatización</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
                        <div key={rule.id} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{rule.name}</p>
                              <p className="text-xs text-muted-foreground">{rule.condition}</p>
                            </div>
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create" className="flex-1 mt-0">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Generador de Workflows con IA</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Describe en lenguaje natural el proceso que quieres automatizar y la IA creará el workflow.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: Cuando un cliente no paga en 30 días, enviar recordatorio y crear tarea..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleGenerateWorkflow}
                      disabled={isGenerating || !aiPrompt.trim()}
                    >
                      {isGenerating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-2">Ejemplos de prompts:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Notificar al gestor cuando un cliente supere 50k€ en ventas</li>
                    <li>Crear tarea de seguimiento 7 días después de cada visita</li>
                    <li>Enviar email de bienvenida cuando se registre una empresa</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

export default WorkflowEnginePanel;
