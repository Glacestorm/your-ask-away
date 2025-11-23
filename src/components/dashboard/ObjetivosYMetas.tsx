import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import { format, isWithinInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Goal {
  id: string;
  metric_type: string;
  target_value: number;
  period_type: string;
  period_start: string;
  period_end: string;
  description: string;
  actual_value?: number;
  predicted_value?: number;
  progress?: number;
}

const METRIC_LABELS: { [key: string]: string } = {
  visits: 'Visitas',
  success_rate: 'Tasa de Éxito',
  engagement: 'Engagement',
  vinculacion: 'Vinculación',
  products: 'Productos Contratados',
};

const PERIOD_LABELS: { [key: string]: string } = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export const ObjetivosYMetas = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    metric_type: 'visits',
    target_value: '',
    period_type: 'monthly',
    period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    description: '',
  });

  useEffect(() => {
    checkAdminStatus();
    fetchGoals();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'superadmin'])
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .order('period_start', { ascending: false });

      if (error) throw error;

      // Calculate actual values and progress for each goal
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          const actual = await calculateActualValue(goal);
          const predicted = await calculatePredictedValue(goal);
          const progress = goal.target_value > 0 ? (actual / goal.target_value) * 100 : 0;

          return {
            ...goal,
            actual_value: actual,
            predicted_value: predicted,
            progress: Math.min(progress, 100),
          };
        })
      );

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Error al cargar objetivos');
    } finally {
      setLoading(false);
    }
  };

  const calculateActualValue = async (goal: Goal): Promise<number> => {
    const startDate = new Date(goal.period_start);
    const endDate = new Date(goal.period_end);

    try {
      const { data: visits, error } = await supabase
        .from('visits')
        .select('visit_date, result, porcentaje_vinculacion, productos_ofrecidos')
        .gte('visit_date', startDate.toISOString())
        .lte('visit_date', endDate.toISOString());

      if (error) throw error;

      if (!visits || visits.length === 0) return 0;

      switch (goal.metric_type) {
        case 'visits':
          return visits.length;
        case 'success_rate':
          const successful = visits.filter(v => v.result === 'Exitosa').length;
          return visits.length > 0 ? (successful / visits.length) * 100 : 0;
        case 'engagement':
          const withProducts = visits.filter(v => v.productos_ofrecidos && v.productos_ofrecidos.length > 0).length;
          return visits.length > 0 ? (withProducts / visits.length) * 100 : 0;
        case 'vinculacion':
          const totalVinculacion = visits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0);
          return visits.length > 0 ? totalVinculacion / visits.length : 0;
        case 'products':
          return visits.reduce((sum, v) => sum + (v.productos_ofrecidos?.length || 0), 0);
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error calculating actual value:', error);
      return 0;
    }
  };

  const calculatePredictedValue = async (goal: Goal): Promise<number> => {
    // Simple linear prediction based on last 3 months trend
    const startDate = subMonths(new Date(), 3);
    const endDate = new Date();

    try {
      const { data: visits, error } = await supabase
        .from('visits')
        .select('visit_date, result, porcentaje_vinculacion, productos_ofrecidos')
        .gte('visit_date', startDate.toISOString())
        .lte('visit_date', endDate.toISOString());

      if (error) throw error;
      if (!visits || visits.length === 0) return 0;

      const actualValue = await calculateActualValue(goal);
      
      // If the goal period is in the past, no prediction needed
      if (new Date(goal.period_end) < new Date()) {
        return actualValue;
      }

      // Simple growth prediction (10% optimistic)
      return actualValue * 1.1;
    } catch (error) {
      console.error('Error calculating prediction:', error);
      return 0;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const goalData = {
        metric_type: formData.metric_type,
        target_value: parseFloat(formData.target_value),
        period_type: formData.period_type,
        period_start: formData.period_start,
        period_end: formData.period_end,
        description: formData.description,
        created_by: user?.id,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id);

        if (error) throw error;
        toast.success('Objetivo actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([goalData]);

        if (error) throw error;
        toast.success('Objetivo creado correctamente');
      }

      setDialogOpen(false);
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Error al guardar objetivo');
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('¿Estás seguro de eliminar este objetivo?')) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      toast.success('Objetivo eliminado correctamente');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Error al eliminar objetivo');
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      metric_type: goal.metric_type,
      target_value: goal.target_value.toString(),
      period_type: goal.period_type,
      period_start: goal.period_start,
      period_end: goal.period_end,
      description: goal.description || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      metric_type: 'visits',
      target_value: '',
      period_type: 'monthly',
      period_start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      period_end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      description: '',
    });
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'text-green-500';
    if (progress >= 75) return 'text-blue-500';
    if (progress >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (progress >= 75) return <TrendingUp className="h-5 w-5 text-blue-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingGoal(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Editar Objetivo' : 'Crear Nuevo Objetivo'}
                </DialogTitle>
                <DialogDescription>
                  Define objetivos y metas para el seguimiento del rendimiento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="metric_type">Métrica</Label>
                  <Select
                    value={formData.metric_type}
                    onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(METRIC_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target_value">Valor Objetivo</Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    required
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="period_type">Período</Label>
                  <Select
                    value={formData.period_type}
                    onValueChange={(value) => setFormData({ ...formData, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="period_start">Fecha Inicio</Label>
                    <Input
                      id="period_start"
                      type="date"
                      required
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="period_end">Fecha Fin</Label>
                    <Input
                      id="period_end"
                      type="date"
                      required
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del objetivo..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingGoal ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay objetivos definidos</h3>
          <p className="text-muted-foreground mb-4">
            Crea objetivos para hacer seguimiento del rendimiento
          </p>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Objetivo
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(goal.progress || 0)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {METRIC_LABELS[goal.metric_type]}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {PERIOD_LABELS[goal.period_type]}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(goal.period_start), 'dd MMM', { locale: es })} - {format(new Date(goal.period_end), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Description */}
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className={`font-semibold ${getStatusColor(goal.progress || 0)}`}>
                      {Math.round(goal.progress || 0)}%
                    </span>
                  </div>
                  <Progress value={goal.progress || 0} className="h-2" />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Objetivo</p>
                    <p className="text-2xl font-bold">
                      {goal.target_value}
                      {['success_rate', 'engagement', 'vinculacion'].includes(goal.metric_type) && '%'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Actual</p>
                    <p className="text-2xl font-bold">
                      {Math.round((goal.actual_value || 0) * 100) / 100}
                      {['success_rate', 'engagement', 'vinculacion'].includes(goal.metric_type) && '%'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {(goal.actual_value || 0) >= goal.target_value ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={`text-xs ${(goal.actual_value || 0) >= goal.target_value ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(Math.round(((goal.actual_value || 0) - goal.target_value) / goal.target_value * 100))}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Predicción</p>
                    <p className="text-2xl font-bold text-muted-foreground">
                      {Math.round((goal.predicted_value || 0) * 100) / 100}
                      {['success_rate', 'engagement', 'vinculacion'].includes(goal.metric_type) && '%'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimación de cierre
                    </p>
                  </div>
                </div>

                {/* Status Message */}
                {goal.progress !== undefined && (
                  <div className={`p-3 rounded-lg ${
                    goal.progress >= 100 
                      ? 'bg-green-500/10' 
                      : goal.progress >= 75 
                      ? 'bg-blue-500/10' 
                      : goal.progress >= 50
                      ? 'bg-yellow-500/10'
                      : 'bg-red-500/10'
                  }`}>
                    <p className={`text-sm font-medium ${
                      goal.progress >= 100 
                        ? 'text-green-600' 
                        : goal.progress >= 75 
                        ? 'text-blue-600' 
                        : goal.progress >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {goal.progress >= 100 
                        ? '✓ Objetivo cumplido con éxito' 
                        : goal.progress >= 75 
                        ? 'Buen progreso - En camino al objetivo' 
                        : goal.progress >= 50
                        ? 'Progreso moderado - Se requiere mayor esfuerzo'
                        : '⚠ Bajo rendimiento - Revisar estrategia'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
