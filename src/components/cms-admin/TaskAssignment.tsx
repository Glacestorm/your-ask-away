import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, UserPlus, Clock, CheckCircle2, AlertCircle, 
  Calendar, MoreVertical, Send, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
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

interface Profile {
  id: string;
  full_name: string | null;
  email?: string;
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  review: 'En Revisión',
  approved: 'Aprobado',
  published: 'Publicado',
  archived: 'Archivado',
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-green-500' },
  medium: { label: 'Media', color: 'bg-amber-500' },
  high: { label: 'Alta', color: 'bg-red-500' },
};

export const TaskAssignment: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  const [assignmentData, setAssignmentData] = useState({
    assignee: '',
    reviewer: '',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchWorkflows();
    fetchProfiles();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_content_workflow')
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setWorkflows((data || []) as Workflow[]);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleAssignment = async () => {
    if (!selectedWorkflow) return;

    try {
      const updates: Partial<Workflow> = {
        updated_at: new Date().toISOString(),
      };

      if (assignmentData.assignee) updates.assignee = assignmentData.assignee;
      if (assignmentData.reviewer) updates.reviewer = assignmentData.reviewer;
      if (assignmentData.due_date) updates.due_date = assignmentData.due_date;
      if (assignmentData.notes) updates.notes = assignmentData.notes;

      const { error } = await supabase
        .from('cms_content_workflow')
        .update(updates)
        .eq('id', selectedWorkflow.id);

      if (error) throw error;

      // Log to history
      await supabase.from('cms_workflow_history').insert({
        workflow_id: selectedWorkflow.id,
        content_id: selectedWorkflow.content_id,
        from_status: selectedWorkflow.status,
        to_status: selectedWorkflow.status,
        comment: `Tarea asignada${assignmentData.assignee ? ' a nuevo responsable' : ''}${assignmentData.reviewer ? ', revisor asignado' : ''}`,
      });

      toast.success('Asignación actualizada');
      setIsAssignDialogOpen(false);
      resetAssignmentData();
      fetchWorkflows();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error('Error al actualizar asignación');
    }
  };

  const handleQuickAssign = async (workflowId: string, field: 'assignee' | 'reviewer', userId: string) => {
    try {
      const { error } = await supabase
        .from('cms_content_workflow')
        .update({ 
          [field]: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflowId);

      if (error) throw error;
      toast.success(field === 'assignee' ? 'Responsable asignado' : 'Revisor asignado');
      fetchWorkflows();
    } catch (error) {
      console.error('Error quick assign:', error);
      toast.error('Error al asignar');
    }
  };

  const resetAssignmentData = () => {
    setAssignmentData({
      assignee: '',
      reviewer: '',
      due_date: '',
      notes: '',
    });
  };

  const openAssignDialog = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setAssignmentData({
      assignee: workflow.assignee || '',
      reviewer: workflow.reviewer || '',
      due_date: workflow.due_date ? format(new Date(workflow.due_date), 'yyyy-MM-dd') : '',
      notes: workflow.notes || '',
    });
    setIsAssignDialogOpen(true);
  };

  const getProfileName = (profileId: string | null) => {
    if (!profileId) return null;
    const profile = profiles.find(p => p.id === profileId);
    return profile?.full_name || 'Usuario';
  };

  const getProfileInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredWorkflows = workflows.filter(w => {
    if (filterStatus !== 'all' && w.status !== filterStatus) return false;
    if (filterAssignee === 'unassigned' && w.assignee) return false;
    if (filterAssignee !== 'all' && filterAssignee !== 'unassigned' && w.assignee !== filterAssignee) return false;
    return true;
  });

  const getDeadlineStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'overdue';
    if (isToday(date)) return 'today';
    return 'upcoming';
  };

  // Statistics
  const stats = {
    total: workflows.length,
    unassigned: workflows.filter(w => !w.assignee).length,
    overdue: workflows.filter(w => w.due_date && isPast(new Date(w.due_date)) && !isToday(new Date(w.due_date))).length,
    inReview: workflows.filter(w => w.status === 'review').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tareas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sin Asignar</p>
                <p className="text-2xl font-bold text-amber-500">{stats.unassigned}</p>
              </div>
              <UserPlus className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Revisión</p>
                <p className="text-2xl font-bold text-blue-500">{stats.inReview}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Asignación de Tareas
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Asignado a" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay tareas que coincidan con los filtros
              </div>
            ) : (
              filteredWorkflows.map(workflow => {
                const deadlineStatus = getDeadlineStatus(workflow.due_date);
                const assigneeName = getProfileName(workflow.assignee);
                const reviewerName = getProfileName(workflow.reviewer);
                const priorityConf = priorityConfig[workflow.priority as keyof typeof priorityConfig];

                return (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-12 rounded-full ${priorityConf?.color || 'bg-gray-500'}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{workflow.content_title || 'Sin título'}</h4>
                          <Badge variant="outline" className="text-xs">
                            {statusLabels[workflow.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{workflow.content_type === 'page' ? 'Página' : 'Artículo'}</span>
                          {workflow.due_date && (
                            <span className={`flex items-center gap-1 ${
                              deadlineStatus === 'overdue' ? 'text-red-500' : 
                              deadlineStatus === 'today' ? 'text-amber-500' : ''
                            }`}>
                              <Calendar className="h-3 w-3" />
                              {format(new Date(workflow.due_date), 'dd/MM/yyyy')}
                              {deadlineStatus === 'overdue' && ' (Vencida)'}
                              {deadlineStatus === 'today' && ' (Hoy)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Assignee */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Responsable:</span>
                        {assigneeName ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                {getProfileInitials(assigneeName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assigneeName}</span>
                          </div>
                        ) : (
                          <Select onValueChange={(value) => handleQuickAssign(workflow.id, 'assignee', value)}>
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="Asignar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.map(profile => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.full_name || 'Sin nombre'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Reviewer */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Revisor:</span>
                        {reviewerName ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                                {getProfileInitials(reviewerName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{reviewerName}</span>
                          </div>
                        ) : (
                          <Select onValueChange={(value) => handleQuickAssign(workflow.id, 'reviewer', value)}>
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue placeholder="Asignar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.map(profile => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.full_name || 'Sin nombre'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAssignDialog(workflow)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Editar asignación
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Asignar Tarea
            </DialogTitle>
          </DialogHeader>
          
          {selectedWorkflow && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium">{selectedWorkflow.content_title || 'Sin título'}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedWorkflow.content_type === 'page' ? 'Página' : 'Artículo'} • 
                  Estado: {statusLabels[selectedWorkflow.status]}
                </p>
              </div>

              <div>
                <Label>Responsable</Label>
                <Select
                  value={assignmentData.assignee}
                  onValueChange={(value) => setAssignmentData({ ...assignmentData, assignee: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Revisor</Label>
                <Select
                  value={assignmentData.reviewer}
                  onValueChange={(value) => setAssignmentData({ ...assignmentData, reviewer: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar revisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fecha límite</Label>
                <Input
                  type="date"
                  value={assignmentData.due_date}
                  onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Notas</Label>
                <Textarea
                  value={assignmentData.notes}
                  onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })}
                  placeholder="Instrucciones o notas adicionales"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAssignment} className="gap-2">
                  <Send className="h-4 w-4" />
                  Guardar Asignación
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
