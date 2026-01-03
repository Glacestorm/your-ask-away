/**
 * New Factoring Assignment Form (Invoice Assignment)
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useERPFactoring, FactoringContract } from '@/hooks/erp/useERPFactoring';
import { supabase } from '@/integrations/supabase/client';

interface NewAssignmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: FactoringContract[];
}

interface TradePartner {
  id: string;
  legal_name: string;
  tax_id: string | null;
}

export function NewAssignmentForm({ open, onOpenChange, contracts }: NewAssignmentFormProps) {
  const { createAssignment } = useERPFactoring();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<TradePartner[]>([]);
  const [selectedContract, setSelectedContract] = useState<FactoringContract | null>(null);

  const [formData, setFormData] = useState({
    contract_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    debtor_id: '',
    debtor_name: '',
    debtor_tax_id: '',
    invoice_amount: '',
    assigned_amount: '',
    advance_percentage: '80',
    currency: 'EUR',
    notes: '',
  });

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase
        .from('erp_trade_partners')
        .select('id, legal_name, tax_id')
        .eq('is_active', true)
        .order('legal_name');
      
      if (data) setPartners(data);
    };

    if (open) fetchPartners();
  }, [open]);

  // Update advance percentage when contract changes
  useEffect(() => {
    if (formData.contract_id) {
      const contract = contracts.find(c => c.id === formData.contract_id);
      if (contract) {
        setSelectedContract(contract);
        setFormData(prev => ({
          ...prev,
          advance_percentage: contract.advance_percentage.toString(),
          currency: contract.currency,
        }));
      }
    }
  }, [formData.contract_id, contracts]);

  // Calculate advance amount
  useEffect(() => {
    if (formData.assigned_amount && formData.advance_percentage) {
      const advanceAmount = (parseFloat(formData.assigned_amount) * parseFloat(formData.advance_percentage)) / 100;
      // We don't auto-fill this to allow manual override
    }
  }, [formData.assigned_amount, formData.advance_percentage]);

  // Update debtor info when partner selected
  const handlePartnerChange = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    if (partner) {
      setFormData(prev => ({
        ...prev,
        debtor_id: partnerId,
        debtor_name: partner.legal_name,
        debtor_tax_id: partner.tax_id || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const invoiceAmount = parseFloat(formData.invoice_amount) || 0;
      const assignedAmount = parseFloat(formData.assigned_amount) || invoiceAmount;
      const advancePercentage = parseFloat(formData.advance_percentage) || 80;
      const advanceAmount = (assignedAmount * advancePercentage) / 100;

      await createAssignment({
        contract_id: formData.contract_id,
        invoice_number: formData.invoice_number,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date,
        debtor_id: formData.debtor_id || null,
        debtor_name: formData.debtor_name,
        debtor_tax_id: formData.debtor_tax_id || null,
        invoice_amount: invoiceAmount,
        assigned_amount: assignedAmount,
        advance_amount: advanceAmount,
        advance_percentage: advancePercentage,
        currency: formData.currency,
        notes: formData.notes || null,
      });

      onOpenChange(false);
      setFormData({
        contract_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        debtor_id: '',
        debtor_name: '',
        debtor_tax_id: '',
        invoice_amount: '',
        assigned_amount: '',
        advance_percentage: '80',
        currency: 'EUR',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Cesión de Factura</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract_id">Contrato de Factoring *</Label>
            <Select
              value={formData.contract_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, contract_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar contrato" />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.contract_number} - {contract.financial_entity?.name || 'Sin entidad'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContract && (
              <p className="text-xs text-muted-foreground">
                Disponible: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: selectedContract.currency }).format(Number(selectedContract.available_limit))}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Nº Factura *</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_number: e.target.value }))}
                placeholder="FV-2025-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_date">Fecha Factura *</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debtor_id">Deudor</Label>
            <Select
              value={formData.debtor_id}
              onValueChange={handlePartnerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar deudor" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.legal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!formData.debtor_id && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="debtor_name">Nombre Deudor *</Label>
                <Input
                  id="debtor_name"
                  value={formData.debtor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, debtor_name: e.target.value }))}
                  placeholder="Nombre del deudor"
                  required={!formData.debtor_id}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="debtor_tax_id">NIF/CIF Deudor</Label>
                <Input
                  id="debtor_tax_id"
                  value={formData.debtor_tax_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, debtor_tax_id: e.target.value }))}
                  placeholder="B12345678"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="due_date">Fecha Vencimiento *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_amount">Importe Factura *</Label>
              <Input
                id="invoice_amount"
                type="number"
                step="0.01"
                value={formData.invoice_amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  invoice_amount: e.target.value,
                  assigned_amount: e.target.value, // Default to same as invoice
                }))}
                placeholder="10000.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_amount">Importe Cedido</Label>
              <Input
                id="assigned_amount"
                type="number"
                step="0.01"
                value={formData.assigned_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_amount: e.target.value }))}
                placeholder="10000.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advance_percentage">% Anticipo</Label>
              <Input
                id="advance_percentage"
                type="number"
                step="0.01"
                max="100"
                value={formData.advance_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, advance_percentage: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Anticipo Estimado</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground">
                {formData.assigned_amount && formData.advance_percentage
                  ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: formData.currency }).format(
                      (parseFloat(formData.assigned_amount) * parseFloat(formData.advance_percentage)) / 100
                    )
                  : '-'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observaciones..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.contract_id}>
              {loading ? 'Guardando...' : 'Crear Cesión'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewAssignmentForm;
