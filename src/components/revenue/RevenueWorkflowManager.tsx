import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Workflow, Plus, Play, Pause, Trash2, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';
import { useRevenueWorkflows, WorkflowAction, WorkflowCondition } from '@/hooks/useRevenueWorkflows';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const triggerTypes = [
  { value: 'event', label: 'Evento', description: 'Se activa cuando ocurre un evento específico' },
  { value: 'threshold', label: 'Umbral', description: 'Se activa cuando una métrica supera un límite' },
  { value: 'schedule', label: 'Programado', description: 'Se ejecuta en horarios definidos' },
  { value: 'signal', label: 'Señal', description: 'Se activa por señales de otras automatizaciones' },
];

const actionTypes = [
  { value: 'create_alert', label: 'Crear Alerta' },
  { value: 'send_notification', label: 'Enviar Notificación' },
  { value: 'update_status', label: 'Actualizar Estado' },
  { value: 'create_task', label: 'Crear Tarea' },
];

export const RevenueWorkflowManager = () => {
  const { workflows, executions, isLoading, createWorkflow, toggleWorkflow, deleteWorkflow, executeWorkflow } = useRevenueWorkflows();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'event' as const,
    trigger_config: {} as Record<string, unknown>,
    conditions: [] as WorkflowCondition[],
    actions: [{ type: 'create_alert' as const, config: {} }] as WorkflowAction[],
    priority: 5,
    cooldown_minutes: 60,
  });

  const handleCreate = async () => {
    if (!newWorkflow.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    try {
      await createWorkflow({
        ...newWorkflow,
        is_active: true,
      });
      setIsDialogOpen(false);
      setNewWorkflow({
        name: '',
        description: '',
        trigger_type: 'event',
        trigger_config: {},
        conditions: [],
        actions: [{ type: 'create_alert', config: {} }],
        priority: 5,
        cooldown_minutes: 60,
      });
    } catch {
      toast.error('Error al crear workflow');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleWorkflow(id, !isActive);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este workflow?')) {
      await deleteWorkflow(id);
    }
  };

  const handleExecute = async (workflowId: string) => {
    await executeWorkflow({ workflowId });
  };

  const getRecentExecutions = (workflowId: string) => {
    return executions?.filter(e => e.workflow_id === workflowId).slice(0, 3) || [];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Automatizaciones de Revenue</h3>
          <p className="text-sm text-muted-foreground">
            Configura workflows automatizados para gestionar eventos de revenue
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Alerta de Churn Alto"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción opcional"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Trigger</Label>
                <Select
                  value={newWorkflow.trigger_type}
                  onValueChange={(v) => setNewWorkflow(prev => ({ ...prev, trigger_type: v as typeof prev.trigger_type }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <div className="font-medium">{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Acción Principal</Label>
                <Select
                  value={newWorkflow.actions[0]?.type || 'create_alert'}
                  onValueChange={(v) => setNewWorkflow(prev => ({
                    ...prev,
                    actions: [{ type: v as WorkflowAction['type'], config: {} }]
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridad (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={newWorkflow.priority}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, priority: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cooldown (min)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newWorkflow.cooldown_minutes}
                    onChange={(e) => setNewWorkflow(prev => ({ ...prev, cooldown_minutes: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">
                Crear Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows?.map((workflow) => {
          const recentExecs = getRecentExecutions(workflow.id);
          return (
            <Card key={workflow.id} className={workflow.is_active ? '' : 'opacity-60'}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${workflow.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Workflow className={`h-4 w-4 ${workflow.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{workflow.name}</CardTitle>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{workflow.description}</p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={workflow.is_active}
                    onCheckedChange={() => handleToggle(workflow.id, workflow.is_active)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {triggerTypes.find(t => t.value === workflow.trigger_type)?.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Prioridad: {workflow.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {workflow.cooldown_minutes}m cooldown
                  </Badge>
                </div>

                {workflow.last_triggered_at && (
                  <p className="text-xs text-muted-foreground">
                    Última ejecución: {formatDistanceToNow(new Date(workflow.last_triggered_at), { addSuffix: true, locale: es })}
                  </p>
                )}

                {recentExecs.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Ejecuciones recientes:</p>
                    {recentExecs.map(exec => (
                      <div key={exec.id} className="flex items-center gap-2 text-xs">
                        {exec.execution_status === 'completed' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : exec.execution_status === 'failed' ? (
                          <XCircle className="h-3 w-3 text-red-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-500" />
                        )}
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExecute(workflow.id)}
                    disabled={!workflow.is_active}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Ejecutar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(workflow.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!workflows || workflows.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Workflow className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No hay workflows configurados</p>
              <p className="text-sm text-muted-foreground">Crea tu primer workflow para automatizar acciones de revenue</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
