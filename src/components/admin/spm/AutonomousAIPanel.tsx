import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Zap, Brain, Target, Clock, CheckCircle2, 
  XCircle, Play, Pause, ListTodo, AlertCircle,
  ArrowRight, Calendar, DollarSign, Sparkles
} from 'lucide-react';
import { useAITasks, useSalesPerformanceMutations } from '@/hooks/useSalesPerformance';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const TASK_TYPE_ICONS: Record<string, React.ReactNode> = {
  'follow_up': <ArrowRight className="h-4 w-4" />,
  'call': <Clock className="h-4 w-4" />,
  'meeting': <Calendar className="h-4 w-4" />,
  'proposal': <Target className="h-4 w-4" />,
  'cross_sell': <DollarSign className="h-4 w-4" />,
  'retention': <AlertCircle className="h-4 w-4" />,
  'analysis': <Brain className="h-4 w-4" />,
};

const PRIORITY_COLORS: Record<number, string> = {
  10: 'bg-red-500 text-white',
  9: 'bg-red-400 text-white',
  8: 'bg-orange-500 text-white',
  7: 'bg-orange-400 text-white',
  6: 'bg-yellow-500 text-black',
  5: 'bg-yellow-400 text-black',
  4: 'bg-blue-400 text-white',
  3: 'bg-blue-300 text-black',
  2: 'bg-gray-400 text-white',
  1: 'bg-gray-300 text-black',
};

export function AutonomousAIPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [resultNotes, setResultNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: pendingTasks, isLoading: pendingLoading } = useAITasks(undefined, 'pending');
  const { data: inProgressTasks } = useAITasks(undefined, 'in_progress');
  const { data: completedTasks } = useAITasks(undefined, 'completed');
  
  const { updateTaskStatus } = useSalesPerformanceMutations();

  const handleStartTask = async (taskId: string) => {
    if (user?.id) {
      await updateTaskStatus.mutateAsync({ 
        taskId, 
        status: 'in_progress', 
        userId: user.id 
      });
    }
  };

  const handleCompleteTask = async () => {
    if (selectedTask && user?.id) {
      await updateTaskStatus.mutateAsync({ 
        taskId: selectedTask, 
        status: 'completed', 
        userId: user.id,
        notes: resultNotes 
      });
      setDialogOpen(false);
      setSelectedTask(null);
      setResultNotes('');
    }
  };

  const handleDismissTask = async (taskId: string) => {
    if (user?.id) {
      await updateTaskStatus.mutateAsync({ 
        taskId, 
        status: 'dismissed', 
        userId: user.id 
      });
    }
  };

  const openCompleteDialog = (taskId: string) => {
    setSelectedTask(taskId);
    setDialogOpen(true);
  };

  const renderTaskCard = (task: any, showActions: boolean = true) => (
    <div 
      key={task.id}
      className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${PRIORITY_COLORS[task.priority] || 'bg-gray-300'}`}>
          {TASK_TYPE_ICONS[task.task_type] || <ListTodo className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{task.task_title}</h4>
            <Badge variant="outline" className="text-xs">
              P{task.priority}
            </Badge>
          </div>
          {task.task_description && (
            <p className="text-sm text-muted-foreground mb-2">{task.task_description}</p>
          )}
          {task.suggested_action && (
            <div className="text-sm bg-primary/10 p-2 rounded mb-2">
              <span className="font-medium text-primary">Acción sugerida:</span> {task.suggested_action}
            </div>
          )}
          {task.ai_reasoning && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Ver razonamiento IA
              </summary>
              <p className="mt-2 pl-4 border-l-2 border-muted">{task.ai_reasoning}</p>
            </details>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            {task.estimated_value > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(task.estimated_value)}
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'dd MMM', { locale: es })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
          {showActions && task.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => handleStartTask(task.id)}
                className="gap-1"
              >
                <Play className="h-3 w-3" />
                Iniciar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDismissTask(task.id)}
                className="gap-1"
              >
                <XCircle className="h-3 w-3" />
                Descartar
              </Button>
            </div>
          )}
          {showActions && task.status === 'in_progress' && (
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => openCompleteDialog(task.id)}
                className="gap-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                Completar
              </Button>
            </div>
          )}
          {task.status === 'completed' && task.result_notes && (
            <div className="mt-2 text-sm bg-green-500/10 p-2 rounded">
              <span className="font-medium text-green-600">Resultado:</span> {task.result_notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* AI Status Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
                Agente IA Autónomo
              </h2>
              <p className="text-muted-foreground">
                Análisis continuo de tu cartera para detectar oportunidades y riesgos
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-1">
                {pendingTasks?.length || 0} tareas pendientes
              </Badge>
              <p className="text-xs text-muted-foreground">
                Última actualización: hace 5 min
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{pendingTasks?.length || 0}</p>
              </div>
              <ListTodo className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">{inProgressTasks?.length || 0}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{completedTasks?.length || 0}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alta Prioridad</p>
                <p className="text-2xl font-bold">
                  {pendingTasks?.filter(t => t.priority >= 8).length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Cola de Tareas IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <ListTodo className="h-4 w-4" />
                Pendientes
                {(pendingTasks?.length || 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">{pendingTasks?.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-2">
                <Play className="h-4 w-4" />
                En Progreso
                {(inProgressTasks?.length || 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">{inProgressTasks?.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completadas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-0">
              <div className="space-y-3">
                {pendingLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-lg" />
                  ))
                ) : pendingTasks && pendingTasks.length > 0 ? (
                  pendingTasks.map(task => renderTaskCard(task))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No hay tareas pendientes</p>
                    <p className="text-sm">El agente IA generará tareas automáticamente</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in_progress" className="mt-0">
              <div className="space-y-3">
                {inProgressTasks && inProgressTasks.length > 0 ? (
                  inProgressTasks.map(task => renderTaskCard(task))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No hay tareas en progreso</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <div className="space-y-3">
                {completedTasks && completedTasks.length > 0 ? (
                  completedTasks.slice(0, 10).map(task => renderTaskCard(task, false))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No hay tareas completadas</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Complete Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notas del resultado</label>
              <Textarea
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                placeholder="Describe el resultado de la tarea..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCompleteTask}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Completar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
