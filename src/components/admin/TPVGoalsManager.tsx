import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const goalSchema = z.object({
  metric_type: z.enum(['tpv_revenue', 'tpv_affiliation', 'tpv_commission'], {
    required_error: 'El tipo de métrica es obligatorio',
  }),
  target_value: z.number().positive({ message: 'El valor debe ser positivo' }),
  period_type: z.string().min(1, { message: 'El tipo de período es obligatorio' }).max(50),
  period_start: z.string().min(1, { message: 'La fecha de inicio es obligatoria' }),
  period_end: z.string().min(1, { message: 'La fecha de fin es obligatoria' }),
  description: z.string().max(500, { message: 'La descripción no puede exceder 500 caracteres' }).optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface TPVGoal {
  id: string;
  metric_type: string;
  target_value: number;
  period_type: string;
  period_start: string;
  period_end: string;
  description: string | null;
  created_at: string;
}

export function TPVGoalsManager() {
  const [goals, setGoals] = useState<TPVGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<TPVGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    metric_type: 'tpv_revenue',
    target_value: 0,
    period_type: 'monthly',
    period_start: '',
    period_end: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .in('metric_type', ['tpv_revenue', 'tpv_affiliation', 'tpv_commission'])
        .order('period_start', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error: any) {
      console.error('Error fetching goals:', error);
      toast.error('Error al cargar objetivos');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    try {
      goalSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({
            metric_type: formData.metric_type,
            target_value: formData.target_value,
            period_type: formData.period_type,
            period_start: formData.period_start,
            period_end: formData.period_end,
            description: formData.description || null,
          })
          .eq('id', editingGoal.id);

        if (error) throw error;
        toast.success('Objetivo actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('goals')
          .insert({
            metric_type: formData.metric_type,
            target_value: formData.target_value,
            period_type: formData.period_type,
            period_start: formData.period_start,
            period_end: formData.period_end,
            description: formData.description || null,
          });

        if (error) throw error;
        toast.success('Objetivo creado correctamente');
      }

      setDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      toast.error('Error al guardar el objetivo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este objetivo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Objetivo eliminado correctamente');
      fetchGoals();
    } catch (error: any) {
      console.error('Error deleting goal:', error);
      toast.error('Error al eliminar el objetivo');
    }
  };

  const openEditDialog = (goal: TPVGoal) => {
    setEditingGoal(goal);
    setFormData({
      metric_type: goal.metric_type as 'tpv_revenue' | 'tpv_affiliation' | 'tpv_commission',
      target_value: goal.target_value,
      period_type: goal.period_type,
      period_start: goal.period_start,
      period_end: goal.period_end,
      description: goal.description || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingGoal(null);
    setFormData({
      metric_type: 'tpv_revenue',
      target_value: 0,
      period_type: 'monthly',
      period_start: '',
      period_end: '',
      description: '',
    });
    setErrors({});
  };

  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'tpv_revenue':
        return 'Facturación TPV';
      case 'tpv_affiliation':
        return 'Vinculación TPV';
      case 'tpv_commission':
        return 'Comisión Tarjetas';
      default:
        return type;
    }
  };

  const formatValue = (type: string, value: number) => {
    switch (type) {
      case 'tpv_revenue':
        return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
      case 'tpv_affiliation':
      case 'tpv_commission':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString('es-ES');
    }
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
              Gestión de Objetivos TPV
            </CardTitle>
            <CardDescription>
              Crear, editar y eliminar metas de facturación, vinculación y comisiones
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingGoal ? 'Editar Objetivo' : 'Nuevo Objetivo TPV'}
                </DialogTitle>
                <DialogDescription>
                  Define las metas de TPV para diferentes períodos
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="metric_type">Tipo de Métrica</Label>
                  <Select
                    value={formData.metric_type}
                    onValueChange={(value: any) => setFormData({ ...formData, metric_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tpv_revenue">Facturación TPV</SelectItem>
                      <SelectItem value="tpv_affiliation">Vinculación TPV (%)</SelectItem>
                      <SelectItem value="tpv_commission">Comisión Tarjetas (%)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.metric_type && (
                    <p className="text-sm text-destructive">{errors.metric_type}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_value">Valor Objetivo</Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.metric_type === 'tpv_revenue' ? '100000' : '50.00'}
                  />
                  {errors.target_value && (
                    <p className="text-sm text-destructive">{errors.target_value}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period_type">Tipo de Período</Label>
                  <Select
                    value={formData.period_type}
                    onValueChange={(value) => setFormData({ ...formData, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.period_type && (
                    <p className="text-sm text-destructive">{errors.period_type}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period_start">Fecha Inicio</Label>
                    <Input
                      id="period_start"
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    />
                    {errors.period_start && (
                      <p className="text-sm text-destructive">{errors.period_start}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period_end">Fecha Fin</Label>
                    <Input
                      id="period_end"
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    />
                    {errors.period_end && (
                      <p className="text-sm text-destructive">{errors.period_end}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el objetivo..."
                    maxLength={500}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingGoal ? 'Actualizar' : 'Crear'} Objetivo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay objetivos de TPV configurados
                </TableCell>
              </TableRow>
            ) : (
              goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>
                    <Badge variant="outline">{getMetricLabel(goal.metric_type)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {formatValue(goal.metric_type, goal.target_value)}
                  </TableCell>
                  <TableCell className="capitalize">{goal.period_type}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(goal.period_start).toLocaleDateString('es-ES')} - {new Date(goal.period_end).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {goal.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(goal)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
