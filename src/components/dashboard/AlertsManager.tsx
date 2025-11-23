import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Alert {
  id: string;
  alert_name: string;
  metric_type: string;
  condition_type: string;
  threshold_value: number;
  period_type: string;
  active: boolean;
  last_checked: string | null;
  created_at: string;
}

export const AlertsManager = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [formData, setFormData] = useState({
    alert_name: '',
    metric_type: 'visits',
    condition_type: 'below',
    threshold_value: 0,
    period_type: 'daily',
    active: true,
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Error al cargar las alertas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAlert) {
        const { error } = await supabase
          .from('alerts')
          .update(formData)
          .eq('id', editingAlert.id);

        if (error) throw error;
        toast.success('Alerta actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('alerts')
          .insert([{ ...formData, created_by: user?.id }]);

        if (error) throw error;
        toast.success('Alerta creada correctamente');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAlerts();
    } catch (error) {
      console.error('Error saving alert:', error);
      toast.error('Error al guardar la alerta');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta alerta?')) return;

    try {
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Alerta eliminada correctamente');
      fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Error al eliminar la alerta');
    }
  };

  const handleToggleActive = async (alert: Alert) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ active: !alert.active })
        .eq('id', alert.id);

      if (error) throw error;
      toast.success(alert.active ? 'Alerta desactivada' : 'Alerta activada');
      fetchAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('Error al cambiar el estado de la alerta');
    }
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setFormData({
      alert_name: alert.alert_name,
      metric_type: alert.metric_type,
      condition_type: alert.condition_type,
      threshold_value: alert.threshold_value,
      period_type: alert.period_type,
      active: alert.active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAlert(null);
    setFormData({
      alert_name: '',
      metric_type: 'visits',
      condition_type: 'below',
      threshold_value: 0,
      period_type: 'daily',
      active: true,
    });
  };

  const getMetricLabel = (metric: string) => {
    const labels: { [key: string]: string } = {
      visits: 'Visitas',
      success_rate: 'Tasa de Éxito',
      vinculacion: 'Vinculación',
      engagement: 'Engagement',
      products: 'Productos',
    };
    return labels[metric] || metric;
  };

  const getConditionLabel = (condition: string) => {
    const labels: { [key: string]: string } = {
      below: 'Por debajo de',
      above: 'Por encima de',
      equals: 'Igual a',
    };
    return labels[condition] || condition;
  };

  const getPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      daily: 'Diario',
      weekly: 'Semanal',
      monthly: 'Mensual',
    };
    return labels[period] || period;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Gestión de Alertas</h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Alerta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingAlert ? 'Editar Alerta' : 'Crear Nueva Alerta'}</DialogTitle>
              <DialogDescription>
                Define las condiciones para recibir notificaciones automáticas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert_name">Nombre de la Alerta</Label>
                <Input
                  id="alert_name"
                  value={formData.alert_name}
                  onChange={(e) => setFormData({ ...formData, alert_name: e.target.value })}
                  placeholder="Ej: Visitas por debajo del objetivo"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metric_type">Métrica</Label>
                  <Select
                    value={formData.metric_type}
                    onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visits">Visitas</SelectItem>
                      <SelectItem value="success_rate">Tasa de Éxito</SelectItem>
                      <SelectItem value="vinculacion">Vinculación</SelectItem>
                      <SelectItem value="engagement">Engagement</SelectItem>
                      <SelectItem value="products">Productos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period_type">Período</Label>
                  <Select
                    value={formData.period_type}
                    onValueChange={(value) => setFormData({ ...formData, period_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition_type">Condición</Label>
                  <Select
                    value={formData.condition_type}
                    onValueChange={(value) => setFormData({ ...formData, condition_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below">Por debajo de</SelectItem>
                      <SelectItem value="above">Por encima de</SelectItem>
                      <SelectItem value="equals">Igual a</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold_value">Umbral</Label>
                  <Input
                    id="threshold_value"
                    type="number"
                    step="0.01"
                    value={formData.threshold_value}
                    onChange={(e) => setFormData({ ...formData, threshold_value: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Alerta Activa</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAlert ? 'Actualizar' : 'Crear'} Alerta
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts List */}
      <div className="grid gap-4 md:grid-cols-2">
        {alerts.length === 0 ? (
          <Card className="p-6 col-span-2">
            <p className="text-center text-muted-foreground">
              No hay alertas configuradas. Crea una para recibir notificaciones automáticas.
            </p>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{alert.alert_name}</h4>
                    <Badge variant={alert.active ? 'default' : 'secondary'}>
                      {alert.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getMetricLabel(alert.metric_type)} {getConditionLabel(alert.condition_type)}{' '}
                    <span className="font-semibold">{alert.threshold_value}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Período: {getPeriodLabel(alert.period_type)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(alert)}
                  >
                    <Bell className={`h-4 w-4 ${alert.active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(alert)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(alert.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
