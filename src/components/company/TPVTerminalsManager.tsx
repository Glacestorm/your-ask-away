import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TPVTerminal {
  id: string;
  company_id: string;
  terminal_type: string;
  terminal_identifier: string;
  bank_name: string;
  annual_revenue: number;
  affiliation_percentage: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CommissionRate {
  id: string;
  terminal_id: string;
  card_type: string;
  commission_rate: number;
}

interface Props {
  companyId: string;
}

const TERMINAL_TYPES = ['Físico', 'LINK', 'Virtual', 'MONEI'];
const BANKS = ['Creand', 'Morabanc', 'Andbank'];
const CARD_TYPES = ['Nacional', 'Propia', 'Internacional'];

export function TPVTerminalsManager({ companyId }: Props) {
  const [terminals, setTerminals] = useState<TPVTerminal[]>([]);
  const [commissions, setCommissions] = useState<Record<string, CommissionRate[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingTerminal, setEditingTerminal] = useState<TPVTerminal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    terminal_type: '',
    terminal_identifier: '',
    bank_name: '',
    annual_revenue: 0,
    affiliation_percentage: 0,
    active: true,
    commissions: {
      'Nacional': 0,
      'Propia': 0,
      'Internacional': 0,
    },
  });

  useEffect(() => {
    fetchTerminals();
  }, [companyId]);

  const fetchTerminals = async () => {
    try {
      setLoading(true);
      const { data: terminalsData, error: terminalsError } = await supabase
        .from('company_tpv_terminals' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (terminalsError) throw terminalsError;
      setTerminals(terminalsData as any || []);

      // Fetch commissions for all terminals
      if (terminalsData && terminalsData.length > 0) {
        const terminalIds = terminalsData.map((t: any) => t.id);
        const { data: commissionsData, error: commissionsError } = await supabase
          .from('tpv_commission_rates' as any)
          .select('*')
          .in('terminal_id', terminalIds);

        if (commissionsError) throw commissionsError;

        const commissionsByTerminal: Record<string, CommissionRate[]> = {};
        commissionsData?.forEach((comm: any) => {
          if (!commissionsByTerminal[comm.terminal_id]) {
            commissionsByTerminal[comm.terminal_id] = [];
          }
          commissionsByTerminal[comm.terminal_id].push(comm);
        });
        setCommissions(commissionsByTerminal);
      }
    } catch (error: any) {
      console.error('Error fetching terminals:', error);
      toast.error('Error al cargar terminales TPV');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let terminalId: string;

      if (editingTerminal) {
        const { error } = await supabase
          .from('company_tpv_terminals' as any)
          .update({
            terminal_type: formData.terminal_type,
            terminal_identifier: formData.terminal_identifier,
            bank_name: formData.bank_name,
            annual_revenue: formData.annual_revenue,
            affiliation_percentage: formData.affiliation_percentage,
            active: formData.active,
          })
          .eq('id', editingTerminal.id);

        if (error) throw error;
        terminalId = editingTerminal.id;
        toast.success('Terminal actualizado');
      } else {
        const { data, error } = await supabase
          .from('company_tpv_terminals' as any)
          .insert({
            company_id: companyId,
            terminal_type: formData.terminal_type,
            terminal_identifier: formData.terminal_identifier,
            bank_name: formData.bank_name,
            annual_revenue: formData.annual_revenue,
            affiliation_percentage: formData.affiliation_percentage,
            active: formData.active,
          })
          .select()
          .single();

        if (error) throw error;
        terminalId = (data as any).id;
        toast.success('Terminal añadido');
      }

      // Save commissions
      for (const [cardType, rate] of Object.entries(formData.commissions)) {
        await supabase
          .from('tpv_commission_rates' as any)
          .upsert({
            terminal_id: terminalId,
            card_type: cardType,
            commission_rate: rate,
          }, {
            onConflict: 'terminal_id,card_type'
          });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTerminals();
    } catch (error: any) {
      console.error('Error saving terminal:', error);
      toast.error(error.message || 'Error al guardar terminal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este terminal?')) return;

    try {
      const { error } = await supabase
        .from('company_tpv_terminals' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Terminal eliminado');
      fetchTerminals();
    } catch (error: any) {
      console.error('Error deleting terminal:', error);
      toast.error('Error al eliminar terminal');
    }
  };

  const handleEdit = async (terminal: TPVTerminal) => {
    setEditingTerminal(terminal);
    
    // Load commissions for this terminal
    const terminalCommissions = commissions[terminal.id] || [];
    const commissionsObj = {
      'Nacional': terminalCommissions.find(c => c.card_type === 'Nacional')?.commission_rate || 0,
      'Propia': terminalCommissions.find(c => c.card_type === 'Propia')?.commission_rate || 0,
      'Internacional': terminalCommissions.find(c => c.card_type === 'Internacional')?.commission_rate || 0,
    };

    setFormData({
      terminal_type: terminal.terminal_type,
      terminal_identifier: terminal.terminal_identifier,
      bank_name: terminal.bank_name,
      annual_revenue: terminal.annual_revenue,
      affiliation_percentage: terminal.affiliation_percentage,
      active: terminal.active,
      commissions: commissionsObj,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      terminal_type: '',
      terminal_identifier: '',
      bank_name: '',
      annual_revenue: 0,
      affiliation_percentage: 0,
      active: true,
      commissions: {
        'Nacional': 0,
        'Propia': 0,
        'Internacional': 0,
      },
    });
    setEditingTerminal(null);
  };

  const getTotalRevenue = () => {
    return terminals.reduce((sum, terminal) => sum + (terminal.annual_revenue || 0), 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Terminales TPV
            </CardTitle>
            <CardDescription>
              Gestiona los terminales de punto de venta y comisiones
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Terminal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTerminal ? 'Editar' : 'Añadir'} Terminal TPV
                </DialogTitle>
                <DialogDescription>
                  Configura el terminal y sus comisiones
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="terminal_type">Tipo de Terminal</Label>
                    <Select
                      value={formData.terminal_type}
                      onValueChange={(value) => setFormData({ ...formData, terminal_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TERMINAL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terminal_identifier">Identificador</Label>
                    <Input
                      id="terminal_identifier"
                      value={formData.terminal_identifier}
                      onChange={(e) => setFormData({ ...formData, terminal_identifier: e.target.value })}
                      placeholder="Ej: TPV-001"
                      required
                    />
                  </div>
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="annual_revenue">Facturación Anual (€)</Label>
                    <Input
                      id="annual_revenue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.annual_revenue}
                      onChange={(e) => setFormData({ ...formData, annual_revenue: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="affiliation_percentage">% Vinculación</Label>
                    <Input
                      id="affiliation_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.affiliation_percentage}
                      onChange={(e) => setFormData({ ...formData, affiliation_percentage: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comisiones por Tipo de Tarjeta (%)</Label>
                  <div className="grid gap-3">
                    {CARD_TYPES.map((cardType) => (
                      <div key={cardType} className="flex items-center justify-between rounded-md border p-3">
                        <span className="text-sm font-medium">{cardType}</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.commissions[cardType as keyof typeof formData.commissions]}
                          onChange={(e) => setFormData({
                            ...formData,
                            commissions: {
                              ...formData.commissions,
                              [cardType]: parseFloat(e.target.value)
                            }
                          })}
                          className="w-24"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Terminal activo</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTerminal ? 'Actualizar' : 'Añadir'}
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
        ) : terminals.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay terminales TPV</p>
        ) : (
          <>
            <Accordion type="single" collapsible className="w-full">
              {terminals.map((terminal) => (
                <AccordionItem key={terminal.id} value={terminal.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-4">
                        <Badge variant={terminal.active ? "default" : "secondary"}>
                          {terminal.terminal_type}
                        </Badge>
                        <span className="font-medium">{terminal.terminal_identifier}</span>
                        <span className="text-sm text-muted-foreground">{terminal.bank_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">
                          {terminal.annual_revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {terminal.affiliation_percentage}% vinc.
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Comisiones</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {commissions[terminal.id]?.map((comm) => (
                            <div key={comm.id} className="rounded-md border p-2 text-center">
                              <p className="text-xs text-muted-foreground">{comm.card_type}</p>
                              <p className="text-sm font-medium">{comm.commission_rate}%</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(terminal)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(terminal.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-4 flex justify-between border-t pt-4">
              <span className="font-semibold">Facturación Total TPV:</span>
              <span className="font-bold text-green-600">
                {getTotalRevenue().toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
