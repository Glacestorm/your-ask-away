/**
 * WorkflowEnginePanel - Fase 9
 * Panel completo para gestión de workflows automatizados
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  GitBranch, 
  Play, 
  Pause,
  RefreshCw, 
  Plus,
  Settings,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Filter,
  MoreVertical,
  History,
  TrendingUp
} from 'lucide-react';
import { useWorkflowEngine } from '@/hooks/admin/automation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface WorkflowEnginePanelProps {
  className?: string;
  expanded?: boolean;
}

export default function WorkflowEnginePanel({ className, expanded = false }: WorkflowEnginePanelProps) {
  const [activeTab, setActiveTab] = useState('workflows');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { 
    workflows, 
    executions,
    isLoading, 
    error,
    lastRefresh,
    fetchWorkflows, 
    createWorkflow,
    executeWorkflow,
    toggleWorkflow
  } = useWorkflowEngine();

  useEffect(() => { 
    fetchWorkflows(); 
  }, [fetchWorkflows]);

  const handleGenerateWorkflow = useCallback(async () => {
    if (!newWorkflowDesc.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await createWorkflow({ 
        name: newWorkflowDesc.slice(0, 50),
        description: newWorkflowDesc
      });
      if (result) {
        toast.success('Workflow generado con IA');
        setShowCreateDialog(false);
        setNewWorkflowDesc('');
        fetchWorkflows();
      }
    } catch (err) {
      toast.error('Error al generar workflow');
    } finally {
      setIsGenerating(false);
    }
  }, [newWorkflowDesc, createWorkflow, fetchWorkflows]);

  const filteredWorkflows = workflows.filter(wf => 
    wf.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wf.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeWorkflows = workflows.filter(w => w.is_active).length;
  const totalExecutions = executions?.length || 0;
  const successRate = executions?.length 
    ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Motor de Workflows
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  Fase 9
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Sparkles className="h-4 w-4" />
                  Crear con IA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generar Workflow con IA
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder="Describe el workflow que necesitas en lenguaje natural. Ej: 'Cuando un cliente no tiene actividad en 30 días, enviar email de reactivación y crear tarea para el gestor'"
                    value={newWorkflowDesc}
                    onChange={(e) => setNewWorkflowDesc(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    La IA analizará tu descripción y generará un workflow optimizado con los pasos necesarios.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGenerateWorkflow} disabled={isGenerating || !newWorkflowDesc.trim()}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchWorkflows()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="h-3.5 w-3.5" />
              Activos
            </div>
            <p className="text-2xl font-bold">{activeWorkflows}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Activity className="h-3.5 w-3.5" />
              Ejecuciones
            </div>
            <p className="text-2xl font-bold">{totalExecutions}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Éxito
            </div>
            <p className="text-2xl font-bold">{successRate}%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="workflows" className="text-xs">Workflows</TabsTrigger>
            <TabsTrigger value="executions" className="text-xs">Ejecuciones</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="mt-0 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className={expanded ? "h-[400px]" : "h-[280px]"}>
              <div className="space-y-2">
                {error ? (
                  <div className="p-4 text-center text-sm text-destructive">
                    {error}
                  </div>
                ) : filteredWorkflows.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay workflows configurados</p>
                    <Button variant="link" size="sm" onClick={() => setShowCreateDialog(true)}>
                      Crear primer workflow
                    </Button>
                  </div>
                ) : (
                  filteredWorkflows.map((wf) => (
                    <div 
                      key={wf.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{wf.name}</p>
                            <Badge 
                              variant={wf.is_active ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {wf.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          {wf.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {wf.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {wf.trigger_type || 'manual'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {wf.steps?.length || 0} pasos
                            </span>
                            {wf.execution_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {wf.execution_count} ejecuciones
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => executeWorkflow(wf.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => toggleWorkflow(wf.id, !wf.is_active)}
                          >
                            {wf.is_active ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="executions" className="mt-0">
            <ScrollArea className={expanded ? "h-[400px]" : "h-[300px]"}>
              <div className="space-y-2">
                {executions?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay ejecuciones recientes</p>
                  </div>
                ) : (
                  executions?.map((exec) => (
                    <div key={exec.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(exec.status)}
                          <div>
                            <p className="font-medium text-sm">Workflow</p>
                            <p className="text-xs text-muted-foreground">
                              {exec.started_at && formatDistanceToNow(new Date(exec.started_at), { 
                                locale: es, 
                                addSuffix: true 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              exec.status === 'completed' ? 'default' : 
                              exec.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {exec.status}
                          </Badge>
                        </div>
                      </div>
                      {exec.status === 'running' && exec.current_step && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Paso actual:</span>
                            <span>{exec.current_step}</span>
                          </div>
                          <Progress value={50} className="h-1" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border bg-green-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Exitosas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {executions?.filter(e => e.status === 'completed').length || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg border bg-red-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Fallidas</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {executions?.filter(e => e.status === 'failed').length || 0}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <h4 className="text-sm font-medium mb-3">Workflows configurados</h4>
                <div className="space-y-2">
                  {workflows.slice(0, 5).map((wf, idx) => (
                    <div key={wf.id} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {idx + 1}. {wf.name}
                      </span>
                      <Badge variant={wf.is_active ? 'default' : 'secondary'} className="text-xs">
                        {wf.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
