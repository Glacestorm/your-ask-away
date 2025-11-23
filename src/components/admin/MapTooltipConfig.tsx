import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Settings, Save, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TooltipConfig {
  id: string;
  field_name: string;
  field_label: string;
  display_order: number;
  enabled: boolean;
}

export function MapTooltipConfig() {
  const [configs, setConfigs] = useState<TooltipConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('map_tooltip_config')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('map_tooltip_config')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;

      setConfigs(prev => 
        prev.map(c => c.id === id ? { ...c, enabled } : c)
      );
      toast.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleLabelChange = (id: string, field_label: string) => {
    setConfigs(prev => 
      prev.map(c => c.id === id ? { ...c, field_label } : c)
    );
  };

  const handleOrderChange = (id: string, display_order: number) => {
    setConfigs(prev => 
      prev.map(c => c.id === id ? { ...c, display_order } : c)
    );
  };

  const saveAllChanges = async () => {
    try {
      setSaving(true);
      
      for (const config of configs) {
        const { error } = await supabase
          .from('map_tooltip_config')
          .update({ 
            field_label: config.field_label,
            display_order: config.display_order 
          })
          .eq('id', config.id);

        if (error) throw error;
      }

      toast.success('Todos los cambios guardados');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const getFieldDescription = (fieldName: string) => {
    const descriptions: Record<string, string> = {
      name: 'Nombre de la empresa',
      address: 'Dirección completa',
      phone: 'Teléfono de contacto',
      email: 'Correo electrónico',
      employees: 'Número de empleados',
      turnover: 'Facturación anual',
      sector: 'Sector de actividad',
      status_name: 'Estado actual de la empresa',
    };
    return descriptions[fieldName] || fieldName;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de Tooltip del Mapa
        </CardTitle>
        <CardDescription>
          Selecciona qué información mostrar al pasar el cursor sobre las empresas en el mapa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-muted/50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Información</p>
            <p className="text-sm text-muted-foreground">
              Los campos habilitados se mostrarán en el tooltip cuando los usuarios pasen el cursor sobre una empresa en el mapa.
              El orden determina en qué secuencia aparecerán los datos.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {configs.map((config) => (
            <div 
              key={config.id}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => handleToggle(config.id, enabled)}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">
                      {config.field_label}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {config.field_name}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getFieldDescription(config.field_name)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Etiqueta</Label>
                  <Input
                    value={config.field_label}
                    onChange={(e) => handleLabelChange(config.id, e.target.value)}
                    className="w-32"
                    disabled={!config.enabled}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Orden</Label>
                  <Input
                    type="number"
                    value={config.display_order}
                    onChange={(e) => handleOrderChange(config.id, parseInt(e.target.value))}
                    className="w-20"
                    disabled={!config.enabled}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={saveAllChanges} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
