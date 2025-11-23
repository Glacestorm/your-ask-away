import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BankAffiliation {
  id: string;
  company_id: string;
  bank_name: string;
  priority_order: number;
  affiliation_percentage: number;
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

    try {
      if (editingAffiliation) {
        const { error } = await supabase
          .from('company_bank_affiliations' as any)
          .update({
            bank_name: formData.bank_name,
            priority_order: formData.priority_order,
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
            affiliation_percentage: formData.affiliation_percentage,
          });

        if (error) throw error;
        toast.success('Vinculación añadida');
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
      affiliation_percentage: affiliation.affiliation_percentage,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      bank_name: '',
      priority_order: 1,
      affiliation_percentage: 0,
    });
    setEditingAffiliation(null);
  };

  const getTotalPercentage = () => {
    return affiliations.reduce((sum, aff) => sum + aff.affiliation_percentage, 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vinculación Bancaria</CardTitle>
            <CardDescription>
              Gestiona las entidades bancarias y porcentajes de vinculación
            </CardDescription>
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
                  <Label htmlFor="affiliation_percentage">
                    Porcentaje de Vinculación (%)
                  </Label>
                  <Input
                    id="affiliation_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.affiliation_percentage}
                    onChange={(e) => setFormData({ ...formData, affiliation_percentage: parseFloat(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Porcentaje sobre facturación total anual
                  </p>
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliations.map((affiliation) => (
                  <TableRow key={affiliation.id}>
                    <TableCell>
                      <span className="font-medium">{affiliation.priority_order}</span>
                    </TableCell>
                    <TableCell>{affiliation.bank_name}</TableCell>
                    <TableCell>{affiliation.affiliation_percentage.toFixed(2)}%</TableCell>
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
            <div className="mt-4 flex justify-between border-t pt-4">
              <span className="font-semibold">Total Vinculación:</span>
              <span className={`font-bold ${getTotalPercentage() > 100 ? 'text-destructive' : 'text-green-600'}`}>
                {getTotalPercentage().toFixed(2)}%
              </span>
            </div>
            {getTotalPercentage() > 100 && (
              <p className="mt-2 text-sm text-destructive">
                ⚠️ El porcentaje total supera el 100%
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
