import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Users, User, ChevronRight, Plus, Target, 
  TrendingUp, ArrowDownToLine, Loader2, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Goal {
  id: string;
  metric_type: string;
  target_value: number;
  period_type: string;
  period_start: string;
  period_end: string;
  description: string | null;
  assigned_to: string | null;
  goal_level: string;
  office: string | null;
  parent_goal_id: string | null;
  weight: number;
  contributes_to_parent: boolean;
  created_by: string;
}

interface Profile {
  id: string;
  full_name: string;
  oficina: string | null;
}

const METRIC_TYPES = [
  { value: 'new_clients', label: 'Nuevos clientes' },
  { value: 'visit_sheets', label: 'Fichas de visita' },
  { value: 'tpv_volume', label: 'Volumen TPV' },
  { value: 'conversion_rate', label: 'Tasa de conversión' },
  { value: 'client_facturacion', label: 'Facturación clientes' },
  { value: 'products_per_client', label: 'Productos por cliente' },
  { value: 'follow_ups', label: 'Seguimientos' }
];

const PERIOD_TYPES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annual', label: 'Anual' }
];

export function CascadeGoalsManager() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<'empresa' | 'oficina' | 'individual'>('empresa');
  
  // Form state
  const [formData, setFormData] = useState({
    metric_type: '',
    target_value: '',
    period_type: 'monthly',
    period_start: format(new Date(), 'yyyy-MM-dd'),
    period_end: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    description: '',
    goal_level: 'empresa' as 'empresa' | 'oficina' | 'individual',
    office: '',
    assigned_to: '',
    parent_goal_id: '',
    weight: '1'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsRes, profilesRes] = await Promise.all([
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, oficina')
      ]);

      if (goalsRes.error) throw goalsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      setGoals(goalsRes.data as Goal[]);
      setProfiles(profilesRes.data || []);
      
      // Extract unique offices
      const uniqueOffices = [...new Set(profilesRes.data?.map(p => p.oficina).filter(Boolean))] as string[];
      setOffices(uniqueOffices);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getGoalsByLevel = (level: string) => {
    return goals.filter(g => g.goal_level === level);
  };

  const getChildGoals = (parentId: string) => {
    return goals.filter(g => g.parent_goal_id === parentId);
  };

  const calculateProgress = (goal: Goal): number => {
    // This would normally calculate based on actual metrics
    // For now, return a mock value
    return Math.floor(Math.random() * 100);
  };

  const handleCreateGoal = async () => {
    if (!formData.metric_type || !formData.target_value) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const goalData: any = {
        metric_type: formData.metric_type,
        target_value: parseFloat(formData.target_value),
        period_type: formData.period_type,
        period_start: formData.period_start,
        period_end: formData.period_end,
        description: formData.description || null,
        goal_level: formData.goal_level,
        weight: parseFloat(formData.weight) || 1,
        contributes_to_parent: true,
        created_by: user?.id
      };

      if (formData.goal_level === 'oficina') {
        goalData.office = formData.office;
      } else if (formData.goal_level === 'individual') {
        goalData.assigned_to = formData.assigned_to;
      }

      if (formData.parent_goal_id) {
        goalData.parent_goal_id = formData.parent_goal_id;
      }

      const { data, error } = await supabase
        .from('goals')
        .insert(goalData)
        .select()
        .single();

      if (error) throw error;

      setGoals([data as Goal, ...goals]);
      setShowCreateDialog(false);
      resetForm();
      toast.success('Objetivo creado correctamente');
    } catch (error: any) {
      console.error('Error creating goal:', error);
      toast.error('Error al crear el objetivo: ' + error.message);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(goals.filter(g => g.id !== goalId));
      toast.success('Objetivo eliminado');
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast.error('Error al eliminar el objetivo');
    }
  };

  const distributeToOffices = async (parentGoal: Goal) => {
    // Distribute parent goal to all offices proportionally
    const officeCount = offices.length;
    if (officeCount === 0) {
      toast.error('No hay oficinas configuradas');
      return;
    }

    const valuePerOffice = parentGoal.target_value / officeCount;

    try {
      const newGoals = offices.map(office => ({
        metric_type: parentGoal.metric_type,
        target_value: valuePerOffice,
        period_type: parentGoal.period_type,
        period_start: parentGoal.period_start,
        period_end: parentGoal.period_end,
        description: `Objetivo de ${office} - ${parentGoal.description || METRIC_TYPES.find(m => m.value === parentGoal.metric_type)?.label}`,
        goal_level: 'oficina',
        office: office,
        parent_goal_id: parentGoal.id,
        weight: 1,
        contributes_to_parent: true,
        created_by: user?.id
      }));

      const { data, error } = await supabase
        .from('goals')
        .insert(newGoals)
        .select();

      if (error) throw error;

      setGoals([...goals, ...(data as Goal[])]);
      toast.success(`Objetivo distribuido a ${officeCount} oficinas`);
    } catch (error: any) {
      console.error('Error distributing goal:', error);
      toast.error('Error al distribuir el objetivo');
    }
  };

  const distributeToGestores = async (parentGoal: Goal) => {
    // Get gestores from the office
    const gestores = profiles.filter(p => p.oficina === parentGoal.office);
    if (gestores.length === 0) {
      toast.error('No hay gestores en esta oficina');
      return;
    }

    const valuePerGestor = parentGoal.target_value / gestores.length;

    try {
      const newGoals = gestores.map(gestor => ({
        metric_type: parentGoal.metric_type,
        target_value: valuePerGestor,
        period_type: parentGoal.period_type,
        period_start: parentGoal.period_start,
        period_end: parentGoal.period_end,
        description: `Objetivo de ${gestor.full_name}`,
        goal_level: 'individual',
        assigned_to: gestor.id,
        parent_goal_id: parentGoal.id,
        weight: 1,
        contributes_to_parent: true,
        created_by: user?.id
      }));

      const { data, error } = await supabase
        .from('goals')
        .insert(newGoals)
        .select();

      if (error) throw error;

      setGoals([...goals, ...(data as Goal[])]);
      toast.success(`Objetivo distribuido a ${gestores.length} gestores`);
    } catch (error: any) {
      console.error('Error distributing goal:', error);
      toast.error('Error al distribuir el objetivo');
    }
  };

  const resetForm = () => {
    setFormData({
      metric_type: '',
      target_value: '',
      period_type: 'monthly',
      period_start: format(new Date(), 'yyyy-MM-dd'),
      period_end: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      description: '',
      goal_level: 'empresa',
      office: '',
      assigned_to: '',
      parent_goal_id: '',
      weight: '1'
    });
  };

  const GoalCard = ({ goal, level }: { goal: Goal; level: number }) => {
    const progress = calculateProgress(goal);
    const childGoals = getChildGoals(goal.id);
    const metricLabel = METRIC_TYPES.find(m => m.value === goal.metric_type)?.label || goal.metric_type;

    return (
      <Card className="mb-2" style={{ marginLeft: level * 20 }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {goal.goal_level === 'empresa' && <Building2 className="h-4 w-4 text-primary" />}
                {goal.goal_level === 'oficina' && <Users className="h-4 w-4 text-blue-500" />}
                {goal.goal_level === 'individual' && <User className="h-4 w-4 text-green-500" />}
                <span className="font-medium">{metricLabel}</span>
                <Badge variant="outline" className="text-xs">
                  {goal.goal_level === 'empresa' ? 'Empresa' : 
                   goal.goal_level === 'oficina' ? goal.office : 
                   profiles.find(p => p.id === goal.assigned_to)?.full_name || 'Individual'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                Objetivo: {goal.target_value.toLocaleString()} | 
                {format(new Date(goal.period_start), ' dd MMM', { locale: es })} - 
                {format(new Date(goal.period_end), ' dd MMM yyyy', { locale: es })}
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {progress}% completado
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {goal.goal_level === 'empresa' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => distributeToOffices(goal)}
                  title="Distribuir a oficinas"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </Button>
              )}
              {goal.goal_level === 'oficina' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => distributeToGestores(goal)}
                  title="Distribuir a gestores"
                >
                  <ArrowDownToLine className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteGoal(goal.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {childGoals.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                {childGoals.length} objetivo(s) derivado(s)
              </div>
              {childGoals.map(child => (
                <GoalCard key={child.id} goal={child} level={level + 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Objetivos en Cascada
          </h2>
          <p className="text-muted-foreground">
            Gestiona objetivos jerárquicos: Empresa → Oficina → Gestor
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Objetivo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Objetivo</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 p-1">
                <div>
                  <Label>Nivel *</Label>
                  <Select
                    value={formData.goal_level}
                    onValueChange={(v: 'empresa' | 'oficina' | 'individual') => 
                      setFormData({ ...formData, goal_level: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Empresa (Global)
                        </div>
                      </SelectItem>
                      <SelectItem value="oficina">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Oficina
                        </div>
                      </SelectItem>
                      <SelectItem value="individual">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Individual (Gestor)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.goal_level === 'oficina' && (
                  <div>
                    <Label>Oficina *</Label>
                    <Select
                      value={formData.office}
                      onValueChange={(v) => setFormData({ ...formData, office: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar oficina..." />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map(office => (
                          <SelectItem key={office} value={office}>{office}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {formData.goal_level === 'individual' && (
                  <div>
                    <Label>Gestor *</Label>
                    <Select
                      value={formData.assigned_to}
                      onValueChange={(v) => setFormData({ ...formData, assigned_to: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar gestor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name} {profile.oficina && `(${profile.oficina})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Objetivo padre (opcional)</Label>
                  <Select
                    value={formData.parent_goal_id}
                    onValueChange={(v) => setFormData({ ...formData, parent_goal_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin objetivo padre..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin objetivo padre</SelectItem>
                      {goals.filter(g => 
                        (formData.goal_level === 'oficina' && g.goal_level === 'empresa') ||
                        (formData.goal_level === 'individual' && g.goal_level === 'oficina')
                      ).map(goal => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {METRIC_TYPES.find(m => m.value === goal.metric_type)?.label} - 
                          {goal.goal_level === 'empresa' ? ' Empresa' : ` ${goal.office}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Métrica *</Label>
                  <Select
                    value={formData.metric_type}
                    onValueChange={(v) => setFormData({ ...formData, metric_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar métrica..." />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_TYPES.map(metric => (
                        <SelectItem key={metric.value} value={metric.value}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Valor objetivo *</Label>
                  <Input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    placeholder="Ej: 100"
                  />
                </div>

                <div>
                  <Label>Período</Label>
                  <Select
                    value={formData.period_type}
                    onValueChange={(v) => setFormData({ ...formData, period_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_TYPES.map(period => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Fecha inicio</Label>
                    <Input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del objetivo..."
                  />
                </div>

                <Button onClick={handleCreateGoal} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Objetivo
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as any)}>
        <TabsList>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa ({getGoalsByLevel('empresa').length})
          </TabsTrigger>
          <TabsTrigger value="oficina" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Oficinas ({getGoalsByLevel('oficina').length})
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Individuales ({getGoalsByLevel('individual').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Objetivos de Empresa
              </CardTitle>
              <CardDescription>
                Objetivos globales que se distribuyen a oficinas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getGoalsByLevel('empresa').filter(g => !g.parent_goal_id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay objetivos de empresa. Crea uno para empezar.
                </div>
              ) : (
                getGoalsByLevel('empresa').filter(g => !g.parent_goal_id).map(goal => (
                  <GoalCard key={goal.id} goal={goal} level={0} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oficina" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Objetivos de Oficina
              </CardTitle>
              <CardDescription>
                Objetivos por oficina que se distribuyen a gestores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getGoalsByLevel('oficina').filter(g => !g.parent_goal_id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay objetivos de oficina. Crea uno o distribúyelo desde un objetivo de empresa.
                </div>
              ) : (
                getGoalsByLevel('oficina').filter(g => !g.parent_goal_id).map(goal => (
                  <GoalCard key={goal.id} goal={goal} level={0} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Objetivos Individuales
              </CardTitle>
              <CardDescription>
                Objetivos asignados a gestores específicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getGoalsByLevel('individual').filter(g => !g.parent_goal_id).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay objetivos individuales. Crea uno o distribúyelo desde un objetivo de oficina.
                </div>
              ) : (
                getGoalsByLevel('individual').filter(g => !g.parent_goal_id).map(goal => (
                  <GoalCard key={goal.id} goal={goal} level={0} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
