import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Target, Plus, TrendingUp, Users, Package, Calendar, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';

interface PersonalGoal {
  id: string;
  metric_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  period_type: string;
  description: string | null;
  created_at: string;
}

interface GoalProgress {
  current: number;
  percentage: number;
}

export function PersonalGoalsTracker() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [progress, setProgress] = useState<Record<string, GoalProgress>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PersonalGoal | null>(null);
  
  const [formData, setFormData] = useState({
    metric_type: 'visits',
    target_value: 0,
    period_start: '',
    period_end: '',
    period_type: 'monthly',
    description: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchGoals();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user?.id]);

  useEffect(() => {
    if (goals.length > 0) {
      calculateProgress();
    }
  }, [goals]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('personal-goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `created_by=eq.${user?.id}`
        },
        () => {
          fetchGoals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visits',
          filter: `gestor_id=eq.${user?.id}`
        },
        () => {
          calculateProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('created_by', user?.id)
        .gte('period_end', new Date().toISOString().split('T')[0])
        .order('period_start', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      toast.error(t('gestor.dashboard.errors.loadGoals'));
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async () => {
    try {
      const progressData: Record<string, GoalProgress> = {};

      for (const goal of goals) {
        let current = 0;

        switch (goal.metric_type) {
          case 'visits':
            const { count: visitsCount } = await supabase
              .from('visits')
              .select('*', { count: 'exact', head: true })
              .eq('gestor_id', user?.id)
              .gte('visit_date', goal.period_start)
              .lte('visit_date', goal.period_end);
            current = visitsCount || 0;
            break;

          case 'successful_visits':
            const { count: successCount } = await supabase
              .from('visits')
              .select('*', { count: 'exact', head: true })
              .eq('gestor_id', user?.id)
              .eq('result', 'Exitosa')
              .gte('visit_date', goal.period_start)
              .lte('visit_date', goal.period_end);
            current = successCount || 0;
            break;

          case 'companies':
            const { count: companiesCount } = await supabase
              .from('companies')
              .select('*', { count: 'exact', head: true })
              .eq('gestor_id', user?.id);
            current = companiesCount || 0;
            break;

          case 'products_offered':
            const { data: visitsData } = await supabase
              .from('visits')
              .select('productos_ofrecidos')
              .eq('gestor_id', user?.id)
              .gte('visit_date', goal.period_start)
              .lte('visit_date', goal.period_end)
              .not('productos_ofrecidos', 'is', null);
            
            const totalProducts = visitsData?.reduce((sum, visit) => {
              return sum + (visit.productos_ofrecidos?.length || 0);
            }, 0) || 0;
            current = totalProducts;
            break;

          case 'average_vinculacion':
            const { data: companiesData } = await supabase
              .from('companies')
              .select('vinculacion_entidad_1')
              .eq('gestor_id', user?.id)
              .not('vinculacion_entidad_1', 'is', null);
            
            const avgVinculacion = companiesData && companiesData.length > 0
              ? companiesData.reduce((sum, c) => sum + (c.vinculacion_entidad_1 || 0), 0) / companiesData.length
              : 0;
            current = avgVinculacion;
            break;
        }

        const percentage = goal.target_value > 0 
          ? Math.min(100, (current / goal.target_value) * 100)
          : 0;

        progressData[goal.id] = { current, percentage };
      }

      setProgress(progressData);
    } catch (error: any) {
      console.error('Error calculating progress:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const goalData = {
        ...formData,
        created_by: user?.id,
        target_value: Number(formData.target_value)
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id);

        if (error) throw error;
        toast.success(t('gestor.dashboard.goals.updated'));
      } else {
        const { error } = await supabase
          .from('goals')
          .insert([goalData]);

        if (error) throw error;
        toast.success(t('gestor.dashboard.goals.created'));
      }

      setDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      toast.error(t('gestor.dashboard.errors.saveGoal'));
    }
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm(t('gestor.dashboard.goals.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
      toast.success(t('gestor.dashboard.goals.deleted'));
      fetchGoals();
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast.error(t('gestor.dashboard.errors.deleteGoal'));
    }
  };

  const openEditDialog = (goal: PersonalGoal) => {
    setEditingGoal(goal);
    setFormData({
      metric_type: goal.metric_type,
      target_value: goal.target_value,
      period_start: goal.period_start,
      period_end: goal.period_end,
      period_type: goal.period_type,
      description: goal.description || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGoal(null);
    setFormData({
      metric_type: 'visits',
      target_value: 0,
      period_start: '',
      period_end: '',
      period_type: 'monthly',
      description: ''
    });
  };

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'visits':
      case 'successful_visits':
        return <Target className="h-5 w-5 text-primary" />;
      case 'companies':
        return <Users className="h-5 w-5 text-primary" />;
      case 'products_offered':
        return <Package className="h-5 w-5 text-primary" />;
      case 'average_vinculacion':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      default:
        return <Target className="h-5 w-5 text-primary" />;
    }
  };

  const getMetricLabel = (metricType: string) => {
    return t(`gestor.dashboard.goals.metrics.${metricType}`);
  };

  const formatValue = (metricType: string, value: number) => {
    if (metricType === 'average_vinculacion') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('es-ES');
  };

  const getStatusVariant = (percentage: number): "default" | "secondary" | "destructive" => {
    if (percentage >= 100) return 'default';
    if (percentage >= 75) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 100) return t('gestor.dashboard.goals.status.completed');
    if (percentage >= 75) return t('gestor.dashboard.goals.status.onTrack');
    if (percentage >= 50) return t('gestor.dashboard.goals.status.inProgress');
    return t('gestor.dashboard.goals.status.needsAttention');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('gestor.dashboard.goals.title')}
            </CardTitle>
            <CardDescription>{t('gestor.dashboard.goals.description')}</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('gestor.dashboard.goals.addGoal')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? t('gestor.dashboard.goals.editGoal') : t('gestor.dashboard.goals.createGoal')}
                </DialogTitle>
                <DialogDescription>{t('gestor.dashboard.goals.dialogDescription')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('gestor.dashboard.goals.metricType')}</Label>
                  <Select
                    value={formData.metric_type}
                    onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visits">{t('gestor.dashboard.goals.metrics.visits')}</SelectItem>
                      <SelectItem value="successful_visits">{t('gestor.dashboard.goals.metrics.successful_visits')}</SelectItem>
                      <SelectItem value="companies">{t('gestor.dashboard.goals.metrics.companies')}</SelectItem>
                      <SelectItem value="products_offered">{t('gestor.dashboard.goals.metrics.products_offered')}</SelectItem>
                      <SelectItem value="average_vinculacion">{t('gestor.dashboard.goals.metrics.average_vinculacion')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('gestor.dashboard.goals.targetValue')}</Label>
                  <Input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
                    required
                    min="0"
                    step={formData.metric_type === 'average_vinculacion' ? '0.1' : '1'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('gestor.dashboard.goals.periodStart')}</Label>
                    <Input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('gestor.dashboard.goals.periodEnd')}</Label>
                    <Input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('gestor.dashboard.goals.periodType')}</Label>
                  <Select
                    value={formData.period_type}
                    onValueChange={(value) => setFormData({ ...formData, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">{t('gestor.dashboard.goals.periods.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('gestor.dashboard.goals.periods.monthly')}</SelectItem>
                      <SelectItem value="quarterly">{t('gestor.dashboard.goals.periods.quarterly')}</SelectItem>
                      <SelectItem value="annual">{t('gestor.dashboard.goals.periods.annual')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('gestor.dashboard.goals.descriptionLabel')}</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t('gestor.dashboard.goals.cancel')}
                  </Button>
                  <Button type="submit">
                    {editingGoal ? t('gestor.dashboard.goals.update') : t('gestor.dashboard.goals.create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('gestor.dashboard.goals.noGoals')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => {
              const goalProgress = progress[goal.id] || { current: 0, percentage: 0 };
              const statusVariant = getStatusVariant(goalProgress.percentage);
              const statusLabel = getStatusLabel(goalProgress.percentage);

              return (
                <div key={goal.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMetricIcon(goal.metric_type)}
                      <div>
                        <div className="font-semibold">{getMetricLabel(goal.metric_type)}</div>
                        <div className="text-sm text-muted-foreground">
                          {goal.description || t('gestor.dashboard.goals.defaultDescription')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(goal)}
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('gestor.dashboard.goals.progress')}</span>
                      <span className="font-mono font-semibold">
                        {formatValue(goal.metric_type, goalProgress.current)} / {formatValue(goal.metric_type, goal.target_value)}
                      </span>
                    </div>
                    <Progress value={goalProgress.percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(goal.period_start), 'dd/MM/yyyy')} - {format(new Date(goal.period_end), 'dd/MM/yyyy')}
                      </span>
                      <span className="font-semibold">{goalProgress.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
