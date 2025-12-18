import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, Plus, Clock, User, ArrowRight, CheckCircle2, 
  FileEdit, Eye, Archive, Send, MoreVertical, History,
  AlertCircle, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Workflow {
  id: string;
  content_id: string;
  content_type: string;
  content_title: string | null;
  status: string;
  assignee: string | null;
  reviewer: string | null;
  due_date: string | null;
  priority: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowHistory {
  id: string;
  workflow_id: string;
  content_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  comment: string | null;
  created_at: string;
}

const statusConfig = {
  draft: { label: 'Borrador', icon: FileEdit, color: 'bg-slate-500', textColor: 'text-slate-500' },
  review: { label: 'En Revisión', icon: Eye, color: 'bg-amber-500', textColor: 'text-amber-500' },
  approved: { label: 'Aprobado', icon: CheckCircle2, color: 'bg-green-500', textColor: 'text-green-500' },
  published: { label: 'Publicado', icon: Send, color: 'bg-blue-500', textColor: 'text-blue-500' },
  archived: { label: 'Archivado', icon: Archive, color: 'bg-gray-500', textColor: 'text-gray-500' },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  medium: { label: 'Media', color: 'bg-amber-500/20 text-amber-500 border-amber-500/30' },
  high: { label: 'Alta', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
};

const statusFlow = ['draft', 'review', 'approved', 'published', 'archived'];

export const WorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [history, setHistory] = useState<WorkflowHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [statusComment, setStatusComment] = useState('');

  const [formData, setFormData] = useState({
    content_title: '',
    content_type: 'page',
    priority: 'medium',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_content_workflow')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows((data || []) as Workflow[]);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Error al cargar flujos de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (workflowId: string) => {
    try {
      const { data, error } = await supabase
        .from('cms_workflow_history')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data || []) as WorkflowHistory[]);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_content_workflow')
        .insert({
          content_id: crypto.randomUUID(),
          content_title: formData.content_title,
          content_type: formData.content_type,
          priority: formData.priority,
          due_date: formData.due_date || null,
          notes: formData.notes || null,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      // Add to history
      await supabase.from('cms_workflow_history').insert({
        workflow_id: data.id,
        content_id: data.content_id,
        to_status: 'draft',
        comment: 'Contenido creado',
      });

      toast.success('Flujo de trabajo creado');
      setIsDialogOpen(false);
      resetForm();
      fetchWorkflows();
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Error al crear flujo de trabajo');
    }
  };

  const handleStatusChange = async (workflow: Workflow, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('cms_content_workflow')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflow.id);

      if (error) throw error;

      // Add to history
      await supabase.from('cms_workflow_history').insert({
        workflow_id: workflow.id,
        content_id: workflow.content_id,
        from_status: workflow.status,
        to_status: newStatus,
        comment: statusComment || null,
      });

      toast.success(`Estado cambiado a ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`);
      setStatusComment('');
      fetchWorkflows();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('cms_content_workflow')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;
      toast.success('Flujo de trabajo eliminado');
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Error al eliminar');
    }
  };

  const resetForm = () => {
    setFormData({
      content_title: '',
      content_type: 'page',
      priority: 'medium',
      due_date: '',
      notes: '',
    });
  };

  const openHistory = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    fetchHistory(workflow.id);
    setIsHistoryOpen(true);
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const getWorkflowsByStatus = (status: string) => {
    return workflows.filter(w => w.status === status);
  };

  const WorkflowCard = ({ workflow }: { workflow: Workflow }) => {
    const config = statusConfig[workflow.status as keyof typeof statusConfig];
    const priorityConf = priorityConfig[workflow.priority as keyof typeof priorityConfig];
    const nextStatus = getNextStatus(workflow.status);
    const isOverdue = workflow.due_date && new Date(workflow.due_date) < new Date();

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-card border border-border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium truncate">{workflow.content_title || 'Sin título'}</h4>
            <Badge variant="outline" className="mt-1 text-xs">
              {workflow.content_type === 'page' ? 'Página' : 'Artículo'}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openHistory(workflow)}>
                <History className="h-4 w-4 mr-2" />
                Ver historial
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDeleteWorkflow(workflow.id)}
                className="text-destructive"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={priorityConf?.color || ''}>
            {priorityConf?.label || workflow.priority}
          </Badge>
          {workflow.due_date && (
            <Badge 
              variant="outline" 
              className={isOverdue ? 'border-red-500 text-red-500' : ''}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(workflow.due_date), 'dd/MM')}
              {isOverdue && <AlertCircle className="h-3 w-3 ml-1" />}
            </Badge>
          )}
        </div>

        {workflow.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{workflow.notes}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(workflow.updated_at), { addSuffix: true, locale: es })}
          </span>
          {nextStatus && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleStatusChange(workflow, nextStatus)}
              className="gap-1"
            >
              <ArrowRight className="h-3 w-3" />
              {statusConfig[nextStatus as keyof typeof statusConfig]?.label}
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Gestor de Flujos de Trabajo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              Lista
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Contenido
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const StatusIcon = config.icon;
            const statusWorkflows = getWorkflowsByStatus(status);

            return (
              <Card key={status} className="bg-muted/30 border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <Badge variant="secondary">{statusWorkflows.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-2">
                    <AnimatePresence>
                      <div className="space-y-3">
                        {statusWorkflows.map(workflow => (
                          <WorkflowCard key={workflow.id} workflow={workflow} />
                        ))}
                        {statusWorkflows.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            Sin contenidos
                          </div>
                        )}
                      </div>
                    </AnimatePresence>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Contenido</th>
                  <th className="text-left p-4 font-medium">Tipo</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                  <th className="text-left p-4 font-medium">Prioridad</th>
                  <th className="text-left p-4 font-medium">Fecha límite</th>
                  <th className="text-left p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map(workflow => {
                  const config = statusConfig[workflow.status as keyof typeof statusConfig];
                  const priorityConf = priorityConfig[workflow.priority as keyof typeof priorityConfig];
                  const nextStatus = getNextStatus(workflow.status);

                  return (
                    <tr key={workflow.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4 font-medium">{workflow.content_title || 'Sin título'}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {workflow.content_type === 'page' ? 'Página' : 'Artículo'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`${config?.color} text-white`}>
                          {config?.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={priorityConf?.color}>
                          {priorityConf?.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {workflow.due_date 
                          ? format(new Date(workflow.due_date), 'dd/MM/yyyy')
                          : '-'
                        }
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {nextStatus && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(workflow, nextStatus)}
                            >
                              Avanzar
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => openHistory(workflow)}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Contenido</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                value={formData.content_title}
                onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                placeholder="Título del contenido"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Página</SelectItem>
                    <SelectItem value="post">Artículo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Fecha límite</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWorkflow}>
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Cambios
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sin historial</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                {history.map((item, index) => {
                  const toConfig = statusConfig[item.to_status as keyof typeof statusConfig];
                  const fromConfig = item.from_status 
                    ? statusConfig[item.from_status as keyof typeof statusConfig]
                    : null;

                  return (
                    <div key={item.id} className="relative pl-10 pb-6">
                      <div className={`absolute left-2 w-5 h-5 rounded-full ${toConfig?.color || 'bg-primary'} flex items-center justify-center`}>
                        {toConfig?.icon && <toConfig.icon className="h-3 w-3 text-white" />}
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm">
                          {fromConfig && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {fromConfig.label}
                              </Badge>
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                          <Badge className={`${toConfig?.color} text-white text-xs`}>
                            {toConfig?.label}
                          </Badge>
                        </div>
                        {item.comment && (
                          <p className="text-sm text-muted-foreground mt-2">{item.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(item.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
