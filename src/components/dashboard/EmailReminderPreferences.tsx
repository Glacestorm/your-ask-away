import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, AlertCircle, CheckCircle2, MailX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailPreferences {
  email_enabled: boolean;
  urgency_level: 'disabled' | 'urgent' | 'all';
}

export const EmailReminderPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    email_enabled: true,
    urgency_level: 'all'
  });

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_reminder_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          email_enabled: data.email_enabled,
          urgency_level: data.urgency_level as 'disabled' | 'urgent' | 'all'
        });
      } else {
        // Crear preferencias por defecto si no existen
        await createDefaultPreferences();
      }
    } catch (error: any) {
      console.error('Error fetching email preferences:', error);
      toast.error('Error al cargar preferencias de email');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    try {
      const { error } = await supabase
        .from('email_reminder_preferences')
        .insert({
          user_id: user!.id,
          email_enabled: true,
          urgency_level: 'all'
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error creating default preferences:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('email_reminder_preferences')
        .upsert({
          user_id: user!.id,
          email_enabled: preferences.email_enabled,
          urgency_level: preferences.urgency_level,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Preferencias de email guardadas correctamente', {
        icon: <CheckCircle2 className="h-5 w-5" />
      });
    } catch (error: any) {
      console.error('Error saving email preferences:', error);
      toast.error('Error al guardar preferencias de email');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailToggle = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, email_enabled: enabled }));
  };

  const handleUrgencyChange = (value: string) => {
    setPreferences(prev => ({ 
      ...prev, 
      urgency_level: value as 'disabled' | 'urgent' | 'all'
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Preferencias de Emails de Recordatorio
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Preferencias de Emails de Recordatorio
        </CardTitle>
        <CardDescription>
          Configura cuándo quieres recibir recordatorios por email sobre fechas importantes de fichas de visita
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Enable/Disable */}
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email-enabled" className="text-base font-medium">
              Emails de Recordatorio
            </Label>
            <p className="text-sm text-muted-foreground">
              Activar o desactivar el envío de recordatorios por email
            </p>
          </div>
          <Switch
            id="email-enabled"
            checked={preferences.email_enabled}
            onCheckedChange={handleEmailToggle}
          />
        </div>

        {/* Urgency Level Selection */}
        {preferences.email_enabled && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Nivel de Urgencia para Emails</Label>
            <RadioGroup
              value={preferences.urgency_level}
              onValueChange={handleUrgencyChange}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="all" id="all" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="all" className="font-medium cursor-pointer">
                    Todos los Recordatorios
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir emails para todas las fechas (hasta 7 días de anticipación)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="urgent" id="urgent" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="urgent" className="font-medium cursor-pointer">
                    Solo Urgentes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir emails solo para fechas críticas (1-2 días antes)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="disabled" id="disabled" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="disabled" className="font-medium cursor-pointer">
                    Desactivado
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    No recibir emails de recordatorio (solo notificaciones in-app)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {preferences.email_enabled ? (
              preferences.urgency_level === 'all' ? (
                'Recibirás emails para todos los recordatorios de fechas programadas en fichas de visita.'
              ) : preferences.urgency_level === 'urgent' ? (
                'Solo recibirás emails para recordatorios urgentes (1-2 días antes). Las notificaciones in-app seguirán funcionando normalmente.'
              ) : (
                'No recibirás emails de recordatorio, pero seguirás recibiendo notificaciones in-app.'
              )
            ) : (
              <>
                <MailX className="h-4 w-4 inline mr-1" />
                Los emails de recordatorio están desactivados. Seguirás recibiendo notificaciones in-app.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Preferencias'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
