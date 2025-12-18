import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Menu, Plus, Save, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MenuItem { id: string; label: string; url: string; icon?: string; }
interface NavMenu { id: string; menu_name: string; menu_location: string; menu_items: MenuItem[]; }

const locations = ['header', 'sidebar', 'breadcrumbs', 'footer', 'quick_actions'];

function SortableMenuItem({ item, onUpdate, onDelete }: { item: MenuItem; onUpdate: (item: MenuItem) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 border rounded-lg bg-card" {...attributes}>
      <div {...listeners} className="cursor-grab"><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
      <Input value={item.label} onChange={e => onUpdate({ ...item, label: e.target.value })} placeholder="Label" className="flex-1" />
      <Input value={item.url} onChange={e => onUpdate({ ...item, url: e.target.value })} placeholder="URL" className="flex-1" />
      <Input value={item.icon || ''} onChange={e => onUpdate({ ...item, icon: e.target.value })} placeholder="Icon" className="w-24" />
      <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}

export function NavigationManager() {
  const [menus, setMenus] = useState<NavMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState<NavMenu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => { loadMenus(); }, []);

  const loadMenus = async () => {
    try {
      const { data, error } = await (supabase as any).from('cms_navigation_menus').select('*').order('menu_name');
      if (error) throw error;
      setMenus((data as any[])?.map(m => ({ ...m, menu_items: (m.menu_items as MenuItem[]) || [] })) || []);
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMenu = async (location: string) => {
    try {
      const { data, error } = await (supabase as any).from('cms_navigation_menus').insert({ menu_name: `Menu ${location}`, menu_location: location, menu_items: [] }).select().single();
      if (error) throw error;
      toast.success('Menú creado');
      loadMenus();
    } catch (error) {
      toast.error('Error al crear menú');
    }
  };

  const saveMenu = async () => {
    if (!selectedMenu) return;
    try {
      await (supabase as any).from('cms_navigation_menus').update({ menu_items: items as any[], updated_at: new Date().toISOString() }).eq('id', selectedMenu.id);
      toast.success('Menú guardado');
      loadMenus();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: `item-${Date.now()}`, label: '', url: '' }]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(currentItems => {
        const oldIndex = currentItems.findIndex(i => i.id === active.id);
        const newIndex = currentItems.findIndex(i => i.id === over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Menu className="h-6 w-6" />Gestión de Navegación</h2>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Ubicaciones</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {locations.map(loc => {
              const menu = menus.find(m => m.menu_location === loc);
              return (
                <div key={loc} className="space-y-2">
                  <Label className="capitalize">{loc.replace('_', ' ')}</Label>
                  {menu ? (
                    <Button variant={selectedMenu?.id === menu.id ? 'default' : 'outline'} className="w-full justify-start" onClick={() => { setSelectedMenu(menu); setItems(menu.menu_items); }}>
                      {menu.menu_name}
                    </Button>
                  ) : (
                    <Button variant="ghost" className="w-full justify-start" onClick={() => createMenu(loc)}>
                      <Plus className="h-4 w-4 mr-2" />Crear menú
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
              <CardTitle>{selectedMenu ? `Editar: ${selectedMenu.menu_name}` : 'Selecciona un menú'}</CardTitle>
              {selectedMenu && <Button onClick={addItem}><Plus className="h-4 w-4 mr-2" />Añadir Item</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {selectedMenu ? (
              <div className="space-y-4">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {items.map((item, i) => (
                        <SortableMenuItem key={item.id} item={item} onUpdate={updated => setItems(prev => prev.map((it, idx) => idx === i ? updated : it))} onDelete={() => setItems(prev => prev.filter((_, idx) => idx !== i))} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {items.length === 0 && <p className="text-muted-foreground text-center py-8">No hay items. Añade uno.</p>}
                <Button onClick={saveMenu} className="w-full"><Save className="h-4 w-4 mr-2" />Guardar Menú</Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Selecciona una ubicación para editar su menú</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
