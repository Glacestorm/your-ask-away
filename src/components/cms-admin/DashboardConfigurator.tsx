import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LayoutDashboard, Plus, Save, Trash2, Copy, GripVertical, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Widget { id: string; type: string; title: string; config: Record<string, any>; enabled: boolean; }
interface DashboardConfig { id: string; config_name: string; target_role: string; widgets: Widget[]; is_default: boolean; }

const roles = ['gestor', 'director_oficina', 'director_comercial', 'responsable_comercial', 'superadmin'];
const widgetTypes = [
  { type: 'kpi_card', label: 'KPI Card' },
  { type: 'chart_line', label: 'Gráfico Líneas' },
  { type: 'chart_bar', label: 'Gráfico Barras' },
  { type: 'chart_pie', label: 'Gráfico Pastel' },
  { type: 'table', label: 'Tabla' },
  { type: 'calendar', label: 'Calendario' },
  { type: 'tasks', label: 'Tareas' },
  { type: 'notifications', label: 'Notificaciones' },
];

function SortableWidget({ widget, onUpdate, onDelete }: { widget: Widget; onUpdate: (w: Widget) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: widget.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="p-4 border rounded-lg bg-card" {...attributes}>
      <div className="flex items-center gap-3">
        <div {...listeners} className="cursor-grab"><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
        <Input value={widget.title} onChange={e => onUpdate({ ...widget, title: e.target.value })} className="flex-1" />
        <Select value={widget.type} onValueChange={type => onUpdate({ ...widget, type })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{widgetTypes.map(wt => <SelectItem key={wt.type} value={wt.type}>{wt.label}</SelectItem>)}</SelectContent>
        </Select>
        <Switch checked={widget.enabled} onCheckedChange={enabled => onUpdate({ ...widget, enabled })} />
        <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export function DashboardConfigurator() {
  const [configs, setConfigs] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConfig, setSelectedConfig] = useState<DashboardConfig | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await (supabase as any).from('cms_dashboard_configs').select('*').order('target_role');
      if (error) throw error;
      setConfigs((data as any[])?.map(c => ({ ...c, widgets: (c.widgets as Widget[]) || [] })) || []);
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConfig = async (role: string) => {
    try {
      const { data, error } = await (supabase as any).from('cms_dashboard_configs').insert({ config_name: `Dashboard ${role}`, target_role: role, widgets: [], is_default: false }).select().single();
      if (error) throw error;
      toast.success('Configuración creada');
      loadConfigs();
    } catch (error) {
      toast.error('Error al crear');
    }
  };

  const saveConfig = async () => {
    if (!selectedConfig) return;
    try {
      await (supabase as any).from('cms_dashboard_configs').update({ widgets: widgets as any[], updated_at: new Date().toISOString() }).eq('id', selectedConfig.id);
      toast.success('Configuración guardada');
      loadConfigs();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const duplicateConfig = async () => {
    if (!selectedConfig) return;
    try {
      await (supabase as any).from('cms_dashboard_configs').insert({ config_name: `${selectedConfig.config_name} (copia)`, target_role: selectedConfig.target_role, widgets: widgets as any[], is_default: false });
      toast.success('Configuración duplicada');
      loadConfigs();
    } catch (error) {
      toast.error('Error al duplicar');
    }
  };

  const addWidget = () => {
    setWidgets(prev => [...prev, { id: `widget-${Date.now()}`, type: 'kpi_card', title: 'Nuevo Widget', config: {}, enabled: true }]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets(items => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><LayoutDashboard className="h-6 w-6" />Configurador de Dashboards</h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Por Rol</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {roles.map(role => {
              const config = configs.find(c => c.target_role === role);
              return (
                <div key={role} className="space-y-2">
                  <Label className="capitalize">{role.replace('_', ' ')}</Label>
                  {config ? (
                    <Button variant={selectedConfig?.id === config.id ? 'default' : 'outline'} className="w-full justify-start" onClick={() => { setSelectedConfig(config); setWidgets(config.widgets); }}>
                      {config.config_name}
                    </Button>
                  ) : (
                    <Button variant="ghost" className="w-full justify-start" onClick={() => createConfig(role)}>
                      <Plus className="h-4 w-4 mr-2" />Crear
                    </Button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selectedConfig ? selectedConfig.config_name : 'Selecciona una configuración'}</CardTitle>
              {selectedConfig && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={duplicateConfig}><Copy className="h-4 w-4 mr-2" />Duplicar</Button>
                  <Button size="sm" onClick={addWidget}><Plus className="h-4 w-4 mr-2" />Widget</Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedConfig ? (
              <div className="space-y-4">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {widgets.map((widget, i) => (
                        <SortableWidget key={widget.id} widget={widget} onUpdate={updated => setWidgets(prev => prev.map((w, idx) => idx === i ? updated : w))} onDelete={() => setWidgets(prev => prev.filter((_, idx) => idx !== i))} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {widgets.length === 0 && <p className="text-muted-foreground text-center py-8">Sin widgets. Añade uno.</p>}
                <Button onClick={saveConfig} className="w-full"><Save className="h-4 w-4 mr-2" />Guardar</Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Selecciona un rol para configurar su dashboard</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
