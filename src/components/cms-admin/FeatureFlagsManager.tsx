import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Flag, Plus, Save, Trash2, Calendar, Users, Loader2 } from 'lucide-react';

interface FeatureFlag {
  id: string;
  flag_key: string;
  flag_name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
  target_roles: string[];
  target_offices: string[];
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, any>;
}

const roles = ['gestor', 'director_oficina', 'director_comercial', 'responsable_comercial', 'superadmin'];

export function FeatureFlagsManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeatureFlag | null>(null);

  useEffect(() => { loadFlags(); }, []);

  const loadFlags = async () => {
    try {
      const { data, error } = await supabase.from('cms_feature_flags').select('*').order('flag_name');
      if (error) throw error;
      setFlags(data?.map(f => ({
        ...f,
        target_roles: (f.target_roles as string[]) || [],
        target_offices: (f.target_offices as string[]) || [],
        metadata: (f.metadata as Record<string, any>) || {}
      })) || []);
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFlag = async () => {
    const key = prompt('Key del flag (ej: new_dashboard):');
    if (!key) return;
    try {
      await supabase.from('cms_feature_flags').insert({
        flag_key: key,
        flag_name: key.replace(/_/g, ' '),
        is_enabled: false,
        rollout_percentage: 0,
        target_roles: [],
        target_offices: []
      });
      toast.success('Flag creado');
      loadFlags();
    } catch (error) {
      toast.error('Error al crear flag');
    }
  };

  const saveFlag = async () => {
    if (!selected) return;
    try {
      await supabase.from('cms_feature_flags').update({
        flag_name: selected.flag_name,
        description: selected.description,
        is_enabled: selected.is_enabled,
        rollout_percentage: selected.rollout_percentage,
        target_roles: selected.target_roles as any,
        target_offices: selected.target_offices,
        start_date: selected.start_date,
        end_date: selected.end_date,
        metadata: selected.metadata
      }).eq('id', selected.id);
      toast.success('Flag guardado');
      loadFlags();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const deleteFlag = async (id: string) => {
    if (!confirm('¿Eliminar este flag?')) return;
    try {
      await supabase.from('cms_feature_flags').delete().eq('id', id);
      toast.success('Flag eliminado');
      if (selected?.id === id) setSelected(null);
      loadFlags();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const toggleRole = (role: string) => {
    if (!selected) return;
    const newRoles = selected.target_roles.includes(role)
      ? selected.target_roles.filter(r => r !== role)
      : [...selected.target_roles, role];
    setSelected({ ...selected, target_roles: newRoles });
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Flag className="h-6 w-6" />Feature Flags</h2>
        <Button onClick={createFlag}><Plus className="h-4 w-4 mr-2" />Nuevo Flag</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Flags</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {flags.map(flag => (
              <div key={flag.id} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${selected?.id === flag.id ? 'border-primary bg-primary/10' : ''}`} onClick={() => setSelected(flag)}>
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${flag.is_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">{flag.flag_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{flag.rollout_percentage}%</p>
                </div>
                <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteFlag(flag.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader><CardTitle>{selected ? `Editar: ${selected.flag_key}` : 'Selecciona un flag'}</CardTitle></CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input value={selected.flag_name} onChange={e => setSelected(p => p ? { ...p, flag_name: e.target.value } : null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Key</Label>
                    <Input value={selected.flag_key} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={selected.description || ''} onChange={e => setSelected(p => p ? { ...p, description: e.target.value } : null)} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Estado</Label>
                    <p className="text-sm text-muted-foreground">{selected.is_enabled ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <Switch checked={selected.is_enabled} onCheckedChange={is_enabled => setSelected(p => p ? { ...p, is_enabled } : null)} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Rollout Progresivo</Label>
                    <span className="text-sm font-medium">{selected.rollout_percentage}%</span>
                  </div>
                  <Slider value={[selected.rollout_percentage]} onValueChange={([v]) => setSelected(p => p ? { ...p, rollout_percentage: v } : null)} max={100} step={5} />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Users className="h-4 w-4" />Targeting por Rol</Label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map(role => (
                      <Button key={role} variant={selected.target_roles.includes(role) ? 'default' : 'outline'} size="sm" onClick={() => toggleRole(role)}>
                        {role.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha inicio</Label>
                    <Input type="datetime-local" value={selected.start_date || ''} onChange={e => setSelected(p => p ? { ...p, start_date: e.target.value } : null)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha fin</Label>
                    <Input type="datetime-local" value={selected.end_date || ''} onChange={e => setSelected(p => p ? { ...p, end_date: e.target.value } : null)} />
                  </div>
                </div>

                <Button onClick={saveFlag} className="w-full"><Save className="h-4 w-4 mr-2" />Guardar</Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Selecciona un flag para editar</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
