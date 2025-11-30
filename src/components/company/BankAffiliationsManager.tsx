import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BankAffiliation {
  id: string;
  company_id: string;
  bank_name: string;
  bank_code: string | null;
  account_number: string | null;
  affiliation_type: string | null;
  priority_order: number;
  is_primary: boolean | null;
  active: boolean | null;
  notes: string | null;
  affiliation_percentage: number | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  companyId: string;
}

const BANKS = ['Creand', 'Morabanc', 'Andbank'];

export function BankAffiliationsManager({ companyId }: Props) {
  const [affiliations, setAffiliations] = useState<BankAffiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAffiliation, setEditingAffiliation] = useState<BankAffiliation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: '',
    priority_order: 1,
    is_primary: false,
    active: true,
    notes: '',
    affiliation_percentage: 0,
  });

  useEffect(() => {
    fetchAffiliations();
  }, [companyId]);

  const fetchAffiliations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_bank_affiliations' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('priority_order');

      if (error) throw error;
      setAffiliations(data as any || []);
    } catch (error: any) {
      console.error('Error fetching affiliations:', error);
      toast.error('Error al cargar vinculaciones bancarias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar porcentaje
    if (formData.affiliation_percentage < 0 || formData.affiliation_percentage > 100) {
      toast.error('El porcentaje debe estar entre 0 y 100');
      return;
    }

    try {
      // Calcular el total de porcentajes actuales (excluyendo el que estamos editando)
      const { data: existingAffiliations, error: fetchError } = await supabase
        .from('company_bank_affiliations' as any)
        .select('affiliation_percentage')
        .eq('company_id', companyId)
        .eq('active', true)
        .neq('id', editingAffiliation?.id || '00000000-0000-0000-0000-000000000000') as any;

      if (fetchError) throw fetchError;

      const currentTotal = (existingAffiliations || []).reduce(
        (sum: number, aff: any) => sum + (aff.affiliation_percentage || 0), 
        0
      );
      
      const newTotal = currentTotal + formData.affiliation_percentage;

      if (newTotal > 100) {
        toast.error(`La suma de porcentajes no puede superar 100%. Actualmente: ${currentTotal}%. Máximo disponible: ${100 - currentTotal}%`);
        return;
      }

      if (editingAffiliation) {
        const { error } = await supabase
          .from('company_bank_affiliations' as any)
          .update({
            bank_name: formData.bank_name,
            priority_order: formData.priority_order,
            is_primary: formData.is_primary,
            active: formData.active,
            notes: formData.notes,
            affiliation_percentage: formData.affiliation_percentage,
          })
          .eq('id', editingAffiliation.id);

        if (error) throw error;
        toast.success('Vinculación actualizada');
      } else {
        const { error } = await supabase
          .from('company_bank_affiliations' as any)
          .insert({
            company_id: companyId,
            bank_name: formData.bank_name,
            priority_order: formData.priority_order,
            is_primary: formData.is_primary,
            active: formData.active,
            notes: formData.notes,
            affiliation_percentage: formData.affiliation_percentage,
          });

        if (error) throw error;
        toast.success('Vinculación añadida');
      }

      // Advertir si no suma 100%
      if (newTotal !== 100) {
        toast.warning(`Atención: La vinculación total es ${newTotal}%. Se recomienda que sume 100%.`);
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAffiliations();
    } catch (error: any) {
      console.error('Error saving affiliation:', error);
      toast.error(error.message || 'Error al guardar vinculación');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta vinculación?')) return;

    try {
      const { error } = await supabase
        .from('company_bank_affiliations' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Vinculación eliminada');
      fetchAffiliations();
    } catch (error: any) {
      console.error('Error deleting affiliation:', error);
      toast.error('Error al eliminar vinculación');
    }
  };

  const handleEdit = (affiliation: BankAffiliation) => {
    setEditingAffiliation(affiliation);
    setFormData({
      bank_name: affiliation.bank_name,
      priority_order: affiliation.priority_order,
      is_primary: affiliation.is_primary || false,
      active: affiliation.active !== false,
      notes: affiliation.notes || '',
      affiliation_percentage: affiliation.affiliation_percentage || 0,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      priority_order: 1,
      is_primary: false,
      active: true,
      notes: '',
      affiliation_percentage: 0,
    });
    setEditingAffiliation(null);
  };

  // Calcular total de porcentajes
  const totalPercentage = affiliations
    .filter(aff => aff.active)
    .reduce((sum, aff) => sum + (aff.affiliation_percentage || 0), 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vinculación Bancaria</CardTitle>
            <CardDescription>
              Gestiona las entidades bancarias y porcentajes de vinculación
            </CardDescription>
            {affiliations.length > 0 && (
              <div className={`mt-2 text-sm font-medium ${
                totalPercentage === 100 ? 'text-green-600' : 
                totalPercentage > 100 ? 'text-red-600' : 
                'text-orange-600'
              }`}>
                Total vinculación: {totalPercentage}%
                {totalPercentage !== 100 && ` (Debe sumar 100%)`}
              </div>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Banco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAffiliation ? 'Editar' : 'Añadir'} Vinculación Bancaria
                </DialogTitle>
                <DialogDescription>
                  Configura la vinculación con una entidad bancaria
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Entidad Bancaria</Label>
                  <Select
                    value={formData.bank_name}
                    onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority_order">Orden de Prioridad</Label>
                  <Select
                    value={formData.priority_order.toString()}
                    onValueChange={(value) => setFormData({ ...formData, priority_order: parseInt(value) })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Principal</SelectItem>
                      <SelectItem value="2">2 - Secundario</SelectItem>
                      <SelectItem value="3">3 - Terciario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliation_percentage">Porcentaje de Vinculación (%)</Label>
                  <Input
                    id="affiliation_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.affiliation_percentage}
                    onChange={(e) => setFormData({ ...formData, affiliation_percentage: Number(e.target.value) })}
                    placeholder="% de vinculación"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    La suma total de todas las entidades debe ser 100%
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary"
                    checked={formData.is_primary}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_primary: checked as boolean })
                    }
                  />
                  <Label 
                    htmlFor="is_primary" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Marcar como principal
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Input
                    id="notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Notas adicionales (opcional)"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAffiliation ? 'Actualizar' : 'Añadir'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : affiliations.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay vinculaciones bancarias</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>% Vinculación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliations.map((affiliation) => (
                  <TableRow 
                    key={affiliation.id}
                    className={affiliation.is_primary ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{affiliation.priority_order}</span>
                        {affiliation.is_primary && (
                          <Badge variant="default" className="text-xs">Principal</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{affiliation.bank_name}</TableCell>
                    <TableCell>
                      <span className="font-bold text-lg">
                        {affiliation.affiliation_percentage || 0}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {affiliation.active ? (
                        <Badge variant="default" className="bg-green-500">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {affiliation.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(affiliation)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(affiliation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
