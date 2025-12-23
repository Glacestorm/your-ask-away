import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Bell, BellOff, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ReminderPreference {
  id?: string;
  user_id: string;
  enabled: boolean;
  minutes_before: number;
  created_at?: string;
  updated_at?: string;
}

const REMINDER_OPTIONS = [
  { value: '15', label: '15 minutos antes' },
  { value: '30', label: '30 minutos antes' },
  { value: '60', label: '1 hora antes' },
  { value: '120', label: '2 horas antes' },
  { value: '240', label: '4 horas antes' },
  { value: '480', label: '8 horas antes' },
  { value: '1440', label: '1 día antes' },
  { value: '2880', label: '2 días antes' },
];

export const VisitReminders = () => {
  const { user } = useAuth();
  const { permission, supported, requestPermission, showNotification } = useNotifications();
  const navigate = useNavigate();
  const [preference, setPreference] = useState<ReminderPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreference();
    }
  }, [user]);

  const fetchPreference = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Check if preference exists
      const { data, error } = await supabase
        .from('visit_reminder_preferences' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreference(data as unknown as ReminderPreference);
      } else {
        // Create default preference
        const defaultPref: ReminderPreference = {
          user_id: user.id,
          enabled: false,
          minutes_before: 60,
        };
        setPreference(defaultPref);
      }
    } catch (error: any) {
      console.error('Error fetching preference:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableToggle = async (enabled: boolean) => {
    if (!user || !preference) return;

    // Request permission first if enabling and not granted
    if (enabled && permission !== 'granted') {
      const result = await requestPermission();
      if (result !== 'granted') {
        toast.error('Debes permitir notificaciones para activar recordatorios');
        return;
      }
    }

    try {
      setSaving(true);

      const updatedPref = { ...preference, enabled };

      if (preference.id) {
        // Update existing
        const { error } = await supabase
          .from('visit_reminder_preferences' as any)
          .update({
            enabled,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', preference.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('visit_reminder_preferences' as any)
          .insert(updatedPref as any)
          .select()
          .single();

        if (error) throw error;
        updatedPref.id = (data as any).id;
      }

      setPreference(updatedPref);
      toast.success(enabled ? 'Recordatorios activados' : 'Recordatorios desactivados');
      
      if (enabled) {
        showNotification({
          title: '🔔 Recordatorios de Visitas Activados',
          body: `Recibirás notificaciones ${REMINDER_OPTIONS.find(o => o.value === String(preference.minutes_before))?.label || 'antes de cada visita'}`,
          requireInteraction: false,
        });
      }
    } catch (error: any) {
      console.error('Error saving preference:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleMinutesChange = async (value: string) => {
    if (!user || !preference) return;

    try {
      setSaving(true);

      const minutesBefore = parseInt(value);
      const updatedPref = { ...preference, minutes_before: minutesBefore };

      if (preference.id) {
        const { error } = await supabase
          .from('visit_reminder_preferences' as any)
          .update({
            minutes_before: minutesBefore,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', preference.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('visit_reminder_preferences' as any)
          .insert(updatedPref as any)
          .select()
          .single();

        if (error) throw error;
        updatedPref.id = (data as any).id;
      }

      setPreference(updatedPref);
      toast.success('Tiempo de recordatorio actualizado');
    } catch (error: any) {
      console.error('Error updating preference:', error);
      toast.error('Error al actualizar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = () => {
    showNotification({
      title: '📅 Recordatorio de Visita',
      body: 'Tienes una visita programada a Empresa de Prueba en 1 hora',
      requireInteraction: true,
      onClick: () => {
        navigate('/admin?section=map');
      },
    });
    toast.success('Notificación de prueba enviada');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recordatorios de Visitas
            </CardTitle>
            <CardDescription>
              Recibe notificaciones antes de tus visitas programadas
            </CardDescription>
          </div>
          <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
            {permission === 'granted' ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Activado
              </>
            ) : permission === 'denied' ? (
              <>
                <BellOff className="h-3 w-3 mr-1" />
                Bloqueado
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Sin permisos
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!supported && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Tu navegador no soporta notificaciones push. Prueba con Chrome, Firefox o Edge.
            </AlertDescription>
          </Alert>
        )}

        {supported && permission === 'denied' && (
          <Alert variant="destructive">
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Has bloqueado las notificaciones. Por favor, habilítalas en la configuración del
              navegador para usar esta función.
            </AlertDescription>
          </Alert>
        )}

        {supported && permission === 'default' && (
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              Para recibir recordatorios, primero debes permitir notificaciones.
              <Button
                variant="link"
                className="ml-2 p-0 h-auto"
                onClick={requestPermission}
              >
                Solicitar permisos
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Activar Recordatorios</Label>
              <p className="text-sm text-muted-foreground">
                Recibe notificaciones automáticas antes de cada visita
              </p>
            </div>
            <Switch
              checked={preference?.enabled || false}
              onCheckedChange={handleEnableToggle}
              disabled={saving || permission !== 'granted'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minutes-before" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tiempo de Anticipación
            </Label>
            <Select
              value={String(preference?.minutes_before || 60)}
              onValueChange={handleMinutesChange}
              disabled={saving || !preference?.enabled}
            >
              <SelectTrigger id="minutes-before">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Recibirás una notificación con esta anticipación antes de cada visita programada
            </p>
          </div>

          {permission === 'granted' && (
            <Button
              variant="outline"
              onClick={testNotification}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Enviar Notificación de Prueba
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
