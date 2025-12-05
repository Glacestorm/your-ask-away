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
import { Bell, Plus, Trash2, Edit, Loader2, Globe, Building, User } from 'lucide-react';
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
  target_type: string | null;
  target_office: string | null;
  target_gestor_id: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  oficina: string | null;
}

export const AlertsManager = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [gestores, setGestores] = useState<Profile[]>([]);
  const [offices, setOffices] = useState<string[]>([]);
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
    target_type: 'global',
    target_office: '',
    target_gestor_id: '',
  });

  useEffect(() => {
    fetchAlerts();
    fetchGestoresAndOffices();
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

  const fetchGestoresAndOffices = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, oficina')
        .order('full_name');

      if (error) throw error;

      setGestores(profiles || []);
      
      const uniqueOffices = [...new Set(
        (profiles || [])
          .map(p => p.oficina)
          .filter((o): o is string => o != null && o !== '')
      )].sort();
      setOffices(uniqueOffices);
    } catch (error) {
      console.error('Error fetching gestores:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSave = {
        ...formData,
        target_office: formData.target_type === 'office' ? formData.target_office : null,
        target_gestor_id: formData.target_type === 'gestor' ? formData.target_gestor_id : null,
      };

      if (editingAlert) {
        const { error } = await supabase
          .from('alerts')
          .update(dataToSave)
          .eq('id', editingAlert.id);

        if (error) throw error;
        toast.success('Alerta actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('alerts')
          .insert([{ ...dataToSave, created_by: user?.id }]);

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
      target_type: alert.target_type || 'global',
      target_office: alert.target_office || '',
      target_gestor_id: alert.target_gestor_id || '',
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
      target_type: 'global',
      target_office: '',
      target_gestor_id: '',
    });
  };

  const getMetricLabel = (metric: string) => {
    const labels: { [key: string]: string } = {
      visits: 'Visitas Totales',
      success_rate: 'Tasa de Éxito (%)',
      vinculacion: 'Vinculación Promedio (%)',
      engagement: 'Engagement (%)',
      products: 'Productos Ofrecidos',
      tpv_volume: 'Volumen TPV (€)',
      facturacion: 'Facturación Total (€)',
      visit_sheets: 'Fichas de Visita',
      new_clients: 'Nuevos Clientes',
      avg_visits_per_gestor: 'Visitas/Gestor Promedio',
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

  const getTargetLabel = (alert: Alert) => {
    if (alert.target_type === 'office' && alert.target_office) {
      return `Oficina: ${alert.target_office}`;
    }
    if (alert.target_type === 'gestor' && alert.target_gestor_id) {
      const gestor = gestores.find(g => g.id === alert.target_gestor_id);
      return `Gestor: ${gestor?.full_name || 'Desconocido'}`;
    }
    return 'Global';
  };

  const getTargetIcon = (targetType: string | null) => {
    switch (targetType) {
      case 'office': return <Building className="h-3 w-3" />;
      case 'gestor': return <User className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  const checkAlertsNow = async () => {
    try {
      toast.info('Verificando alertas...');
      const { error } = await supabase.functions.invoke('check-alerts');
      if (error) throw error;
      toast.success('Alertas verificadas correctamente');
      fetchAlerts();
    } catch (error) {
      console.error('Error checking alerts:', error);
      toast.error('Error al verificar alertas');
    }
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Alertas Automáticas de KPIs</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkAlertsNow}>
            <Bell className="h-4 w-4 mr-2" />
            Verificar Ahora
          </Button>
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
            <DialogContent className="sm:max-w-[550px]">
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

                {/* Target Type Selection */}
                <div className="space-y-2">
                  <Label>Ámbito de la Alerta</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value) => setFormData({ ...formData, target_type: value, target_office: '', target_gestor_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Global (Toda la organización)
                        </div>
                      </SelectItem>
                      <SelectItem value="office">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Por Oficina
                        </div>
                      </SelectItem>
                      <SelectItem value="gestor">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Por Gestor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Office Selection */}
                {formData.target_type === 'office' && (
                  <div className="space-y-2">
                    <Label>Oficina</Label>
                    <Select
                      value={formData.target_office}
                      onValueChange={(value) => setFormData({ ...formData, target_office: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar oficina" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office} value={office}>
                            {office}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Gestor Selection */}
                {formData.target_type === 'gestor' && (
                  <div className="space-y-2">
                    <Label>Gestor</Label>
                    <Select
                      value={formData.target_gestor_id}
                      onValueChange={(value) => setFormData({ ...formData, target_gestor_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar gestor" />
                      </SelectTrigger>
                      <SelectContent>
                        {gestores.map((gestor) => (
                          <SelectItem key={gestor.id} value={gestor.id}>
                            {gestor.full_name || gestor.id} {gestor.oficina && `(${gestor.oficina})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                        <SelectItem value="visits">Visitas Totales</SelectItem>
                        <SelectItem value="success_rate">Tasa de Éxito (%)</SelectItem>
                        <SelectItem value="vinculacion">Vinculación Promedio (%)</SelectItem>
                        <SelectItem value="engagement">Engagement (%)</SelectItem>
                        <SelectItem value="products">Productos Ofrecidos</SelectItem>
                        <SelectItem value="tpv_volume">Volumen TPV (€)</SelectItem>
                        <SelectItem value="facturacion">Facturación Total (€)</SelectItem>
                        <SelectItem value="visit_sheets">Fichas de Visita</SelectItem>
                        <SelectItem value="new_clients">Nuevos Clientes</SelectItem>
                        <SelectItem value="avg_visits_per_gestor">Visitas/Gestor Promedio</SelectItem>
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold">{alert.alert_name}</h4>
                    <Badge variant={alert.active ? 'default' : 'secondary'}>
                      {alert.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTargetIcon(alert.target_type)}
                      {getTargetLabel(alert)}
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