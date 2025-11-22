import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StatusColor } from '@/types/database';

export function StatusColorsManager() {
  const [colors, setColors] = useState<StatusColor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<StatusColor | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status_name: '',
    color_hex: '#3B82F6',
    description: '',
    display_order: 0,
  });

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const { data, error } = await supabase
        .from('status_colors')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setColors(data || []);
    } catch (error: any) {
      console.error('Error fetching colors:', error);
      toast.error('Error al cargar colores');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.status_name || !formData.color_hex) {
        toast.error('El nombre y color son obligatorios');
        return;
      }

      if (editingColor) {
        const { error } = await supabase
          .from('status_colors')
          .update(formData)
          .eq('id', editingColor.id);

        if (error) throw error;
        toast.success('Color actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('status_colors')
          .insert(formData);

        if (error) throw error;
        toast.success('Color creado correctamente');
      }

      setDialogOpen(false);
      setEditingColor(null);
      resetForm();
      fetchColors();
    } catch (error: any) {
      console.error('Error saving color:', error);
      toast.error('Error al guardar el color');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este color de estado?')) return;

    try {
      const { error } = await supabase
        .from('status_colors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Color eliminado correctamente');
      fetchColors();
    } catch (error: any) {
      console.error('Error deleting color:', error);
      toast.error('Error al eliminar el color');
    }
  };

  const handleEdit = (color: StatusColor) => {
    setEditingColor(color);
    setFormData({
      status_name: color.status_name,
      color_hex: color.color_hex,
      description: color.description || '',
      display_order: color.display_order,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      status_name: '',
      color_hex: '#3B82F6',
      description: '',
      display_order: 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestión de Colores de Estado</CardTitle>
            <CardDescription>Configurar los estados y colores del mapa</CardDescription>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Color
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>{color.display_order}</TableCell>
                  <TableCell>
                    <div
                      className="h-8 w-8 rounded-full border"
                      style={{ backgroundColor: color.color_hex }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{color.status_name}</TableCell>
                  <TableCell>{color.description || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(color)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(color.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingColor ? 'Editar Color' : 'Nuevo Color'}</DialogTitle>
            <DialogDescription>Configurar el estado y color</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status_name">Nombre del Estado *</Label>
              <Input
                id="status_name"
                value={formData.status_name}
                onChange={(e) => setFormData({ ...formData, status_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color_hex">Color *</Label>
              <div className="flex gap-2">
                <Input
                  id="color_hex"
                  type="color"
                  value={formData.color_hex}
                  onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={formData.color_hex}
                  onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Orden de Visualización</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
