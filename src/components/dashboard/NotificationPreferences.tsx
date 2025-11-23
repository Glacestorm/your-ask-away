import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Settings, Mail, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

interface NotificationPreference {
  id: string;
  alert_type: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  min_severity: 'info' | 'warning' | 'critical';
}

const alertTypes = [
  { value: 'visits', label: 'Visitas' },
  { value: 'success_rate', label: 'Tasa de Éxito' },
  { value: 'vinculacion', label: 'Vinculación' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'products', label: 'Productos' },
];

// Validation schema
const preferenceSchema = z.object({
  alert_type: z.enum(['visits', 'success_rate', 'vinculacion', 'engagement', 'products']),
  email_enabled: z.boolean(),
  in_app_enabled: z.boolean(),
  min_severity: z.enum(['info', 'warning', 'critical']),
});

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Initialize preferences for all alert types if not exists
      const existingTypes = new Set(data?.map(p => p.alert_type) || []);
      const missingPreferences: Partial<NotificationPreference>[] = alertTypes
        .filter(type => !existingTypes.has(type.value))
        .map(type => ({
          alert_type: type.value,
          email_enabled: true,
          in_app_enabled: true,
          min_severity: 'info' as const,
        }));

      const typedData = (data || []).map(d => ({
        ...d,
        min_severity: d.min_severity as 'info' | 'warning' | 'critical'
      }));

      setPreferences([
        ...typedData,
        ...missingPreferences as NotificationPreference[],
      ]);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Error al cargar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (alertType: string, field: keyof Omit<NotificationPreference, 'id' | 'alert_type'>, value: boolean | string) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.alert_type === alertType
          ? { ...pref, [field]: value }
          : pref
      )
    );
  };

  const savePreferences = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Validate all preferences
      const validationResults = preferences.map(pref => {
        try {
          preferenceSchema.parse({
            alert_type: pref.alert_type,
            email_enabled: pref.email_enabled,
            in_app_enabled: pref.in_app_enabled,
            min_severity: pref.min_severity,
          });
          return { valid: true, pref };
        } catch (error) {
          return { valid: false, error, pref };
        }
      });

      const invalidPrefs = validationResults.filter(r => !r.valid);
      if (invalidPrefs.length > 0) {
        console.error('Invalid preferences:', invalidPrefs);
        toast.error('Error: Preferencias inválidas');
        return;
      }

      // Upsert all preferences
      for (const pref of preferences) {
        const { id, ...prefData } = pref;
        
        if (id) {
          // Update existing preference
          const { error } = await supabase
            .from('notification_preferences')
            .update(prefData)
            .eq('id', id)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          // Insert new preference
          const { error } = await supabase
            .from('notification_preferences')
            .insert([{ ...prefData, user_id: user.id }]);

          if (error) throw error;
        }
      }

      toast.success('Preferencias guardadas correctamente');
      fetchPreferences(); // Refresh to get IDs
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar las preferencias');
    } finally {
      setSaving(false);
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
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Preferencias de Notificaciones</h3>
          <p className="text-sm text-muted-foreground">
            Configura cómo quieres recibir notificaciones para cada tipo de alerta
          </p>
        </div>
      </div>

      {/* Preferences Grid */}
      <div className="space-y-4">
        {alertTypes.map((alertType) => {
          const pref = preferences.find(p => p.alert_type === alertType.value);
          if (!pref) return null;

          return (
            <Card key={alertType.value} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{alertType.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      Alertas relacionadas con {alertType.label.toLowerCase()}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3 pt-4 border-t">
                  {/* Email Notifications */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${alertType.value}-email`}>Email</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${alertType.value}-email`}
                        checked={pref.email_enabled}
                        onCheckedChange={(checked) =>
                          updatePreference(alertType.value, 'email_enabled', checked)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {pref.email_enabled ? 'Activado' : 'Desactivado'}
                      </span>
                    </div>
                  </div>

                  {/* In-App Notifications */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${alertType.value}-app`}>En la App</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`${alertType.value}-app`}
                        checked={pref.in_app_enabled}
                        onCheckedChange={(checked) =>
                          updatePreference(alertType.value, 'in_app_enabled', checked)
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {pref.in_app_enabled ? 'Activado' : 'Desactivado'}
                      </span>
                    </div>
                  </div>

                  {/* Minimum Severity */}
                  <div className="space-y-2">
                    <Label htmlFor={`${alertType.value}-severity`}>Severidad Mínima</Label>
                    <Select
                      value={pref.min_severity}
                      onValueChange={(value) =>
                        updatePreference(alertType.value, 'min_severity', value)
                      }
                    >
                      <SelectTrigger id={`${alertType.value}-severity`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">ℹ️ Información</SelectItem>
                        <SelectItem value="warning">⚠️ Advertencia</SelectItem>
                        <SelectItem value="critical">🚨 Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Solo notificaciones de esta severidad o superior
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Preferencias
            </>
          )}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-muted/50">
        <div className="flex gap-3">
          <Bell className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Sobre las Notificaciones</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Las notificaciones por email solo se envían para alertas críticas</li>
              <li>• Las notificaciones en la app se muestran en tiempo real</li>
              <li>• La severidad mínima filtra qué alertas recibes</li>
              <li>• Puedes desactivar completamente un tipo de alerta desactivando ambos canales</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
