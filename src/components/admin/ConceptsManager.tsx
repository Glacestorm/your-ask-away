import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Concept } from '@/types/database';

export function ConceptsManager() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    concept_type: '',
    concept_key: '',
    concept_value: '',
    description: '',
    active: true,
  });

  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    try {
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .order('concept_type, concept_value');

      if (error) throw error;
      setConcepts(data || []);
    } catch (error: any) {
      console.error('Error fetching concepts:', error);
      toast.error('Error al cargar conceptos');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!formData.concept_type || !formData.concept_key || !formData.concept_value) {
        toast.error('Todos los campos obligatorios deben completarse');
        return;
      }

      if (editingConcept) {
        const { error } = await supabase
          .from('concepts')
          .update(formData)
          .eq('id', editingConcept.id);

        if (error) throw error;
        toast.success('Concepto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('concepts')
          .insert(formData);

        if (error) throw error;
        toast.success('Concepto creado correctamente');
      }

      setDialogOpen(false);
      setEditingConcept(null);
      resetForm();
      fetchConcepts();
    } catch (error: any) {
      console.error('Error saving concept:', error);
      toast.error('Error al guardar el concepto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este concepto?')) return;

    try {
      const { error } = await supabase
        .from('concepts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Concepto eliminado correctamente');
      fetchConcepts();
    } catch (error: any) {
      console.error('Error deleting concept:', error);
      toast.error('Error al eliminar el concepto');
    }
  };

  const handleEdit = (concept: Concept) => {
    setEditingConcept(concept);
    setFormData({
      concept_type: concept.concept_type,
      concept_key: concept.concept_key,
      concept_value: concept.concept_value,
      description: concept.description || '',
      active: concept.active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      concept_type: '',
      concept_key: '',
      concept_value: '',
      description: '',
      active: true,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-end">
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Concepto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Clave</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {concepts.map((concept) => (
                <TableRow key={concept.id}>
                  <TableCell className="font-medium">{concept.concept_type}</TableCell>
                  <TableCell>{concept.concept_key}</TableCell>
                  <TableCell>{concept.concept_value}</TableCell>
                  <TableCell>{concept.description || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={concept.active ? 'text-green-600' : 'text-red-600'}>
                      {concept.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(concept)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(concept.id)}>
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
            <DialogTitle>{editingConcept ? 'Editar Concepto' : 'Nuevo Concepto'}</DialogTitle>
            <DialogDescription>Configurar el parámetro del sistema</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="concept_type">Tipo *</Label>
              <Input
                id="concept_type"
                value={formData.concept_type}
                onChange={(e) => setFormData({ ...formData, concept_type: e.target.value })}
                placeholder="parroquia, oficina, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept_key">Clave *</Label>
              <Input
                id="concept_key"
                value={formData.concept_key}
                onChange={(e) => setFormData({ ...formData, concept_key: e.target.value })}
                placeholder="andorra_la_vella"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="concept_value">Valor *</Label>
              <Input
                id="concept_value"
                value={formData.concept_value}
                onChange={(e) => setFormData({ ...formData, concept_value: e.target.value })}
                placeholder="Andorra la Vella"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Activo</Label>
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
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
