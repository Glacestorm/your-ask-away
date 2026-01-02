import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Bell, 
  Shield, 
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AgentConfig {
  is_active: boolean;
  country_code: string;
  specializations: string[];
  alert_thresholds_json: {
    balance_mismatch: number;
    overdue_days: number;
    reconciliation_pending_days: number;
    vat_filing_reminder_days: number;
  };
  notification_preferences: {
    email: boolean;
    in_app: boolean;
    critical_only: boolean;
  };
}

interface AdvisorSettingsProps {
  companyId: string;
  onUpdate?: () => void;
}

export function AdvisorSettings({ companyId, onUpdate }: AdvisorSettingsProps) {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('erp-advisor-agent', {
        body: {
          action: 'get_config',
          company_id: companyId
        }
      });

      if (error) throw error;
      setConfig(data?.config);
    } catch (err) {
      console.error('[AdvisorSettings] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [companyId]);

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('erp-advisor-agent', {
        body: {
          action: 'update_config',
          company_id: companyId,
          params: {
            is_active: config.is_active,
            alert_thresholds_json: config.alert_thresholds_json,
            notification_preferences: config.notification_preferences
          }
        }
      });

      if (error) throw error;
      toast.success('Configuración guardada');
      onUpdate?.();
    } catch (err) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Error al cargar configuración
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Agente Activo</p>
              <p className="text-xs text-muted-foreground">Vigilancia automática</p>
            </div>
          </div>
          <Switch
            checked={config.is_active}
            onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
          />
        </div>
      </Card>

      {/* Specializations */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-primary" />
          <h5 className="font-medium text-sm">Especializaciones</h5>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.specializations?.map((spec) => (
            <Badge key={spec} variant="secondary">{spec}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">País: {config.country_code}</p>
      </Card>

      {/* Thresholds */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-primary" />
          <h5 className="font-medium text-sm">Umbrales de Alerta</h5>
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 items-center">
            <Label className="text-xs">Días vencimiento</Label>
            <Input
              type="number"
              className="h-8 text-sm"
              value={config.alert_thresholds_json?.overdue_days || 30}
              onChange={(e) => setConfig({
                ...config,
                alert_thresholds_json: {
                  ...config.alert_thresholds_json,
                  overdue_days: parseInt(e.target.value) || 30
                }
              })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 items-center">
            <Label className="text-xs">Días conciliación pendiente</Label>
            <Input
              type="number"
              className="h-8 text-sm"
              value={config.alert_thresholds_json?.reconciliation_pending_days || 7}
              onChange={(e) => setConfig({
                ...config,
                alert_thresholds_json: {
                  ...config.alert_thresholds_json,
                  reconciliation_pending_days: parseInt(e.target.value) || 7
                }
              })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 items-center">
            <Label className="text-xs">Días aviso IVA</Label>
            <Input
              type="number"
              className="h-8 text-sm"
              value={config.alert_thresholds_json?.vat_filing_reminder_days || 5}
              onChange={(e) => setConfig({
                ...config,
                alert_thresholds_json: {
                  ...config.alert_thresholds_json,
                  vat_filing_reminder_days: parseInt(e.target.value) || 5
                }
              })}
            />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-primary" />
          <h5 className="font-medium text-sm">Notificaciones</h5>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Notificaciones en app</Label>
            <Switch
              checked={config.notification_preferences?.in_app ?? true}
              onCheckedChange={(checked) => setConfig({
                ...config,
                notification_preferences: {
                  ...config.notification_preferences,
                  in_app: checked
                }
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Notificaciones por email</Label>
            <Switch
              checked={config.notification_preferences?.email ?? false}
              onCheckedChange={(checked) => setConfig({
                ...config,
                notification_preferences: {
                  ...config.notification_preferences,
                  email: checked
                }
              })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Solo alertas críticas</Label>
            <Switch
              checked={config.notification_preferences?.critical_only ?? false}
              onCheckedChange={(checked) => setConfig({
                ...config,
                notification_preferences: {
                  ...config.notification_preferences,
                  critical_only: checked
                }
              })}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <Button onClick={saveConfig} disabled={saving} className="w-full">
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Guardar Configuración
      </Button>
    </div>
  );
}

export default AdvisorSettings;
