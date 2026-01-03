/**
 * New Factoring Contract Form
 */

import { useState, useEffect, useMemo } from 'react';
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
import { Building2 } from 'lucide-react';
import { useERPFactoring } from '@/hooks/erp/useERPFactoring';
import { useERPTradePartners } from '@/hooks/erp/useERPTradePartners';
import { TradePartnerSearchSelect } from '../TradePartnerSearchSelect';
import { AccountingEntriesPreview, AccountingEntry } from '../AccountingEntriesPreview';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewContractFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FinancialEntity {
  id: string;
  name: string;
}

export function NewContractForm({ open, onOpenChange }: NewContractFormProps) {
  const { createContract } = useERPFactoring();
  const { partners, getActivePartners } = useERPTradePartners();
  const [loading, setLoading] = useState(false);
  const [entities, setEntities] = useState<FinancialEntity[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  const [showAccountingSection, setShowAccountingSection] = useState(false);

  const activePartners = getActivePartners();

  const [formData, setFormData] = useState({
    contract_number: '',
    financial_entity_id: '',
    customer_id: '',
    contract_type: 'with_recourse',
    global_limit: '',
    advance_percentage: '80',
    interest_rate: '',
    commission_rate: '',
    currency: 'EUR',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
  });

  // Calcular datos de operación para contabilidad
  const operationData = useMemo(() => {
    const amount = parseFloat(formData.global_limit) || 0;
    const advancePercent = parseFloat(formData.advance_percentage) || 80;
    const interestRate = parseFloat(formData.interest_rate) || 0;
    const commissionRate = parseFloat(formData.commission_rate) || 0;
    
    const advanceAmount = amount * (advancePercent / 100);
    const interestAmount = advanceAmount * (interestRate / 100);
    const commissionAmount = advanceAmount * (commissionRate / 100);
    const netAmount = advanceAmount - interestAmount - commissionAmount;
    
    return {
      amount: advanceAmount,
      interestAmount,
      commissionAmount,
      expenses: 0,
      netAmount,
      currency: formData.currency
    };
  }, [formData.global_limit, formData.advance_percentage, formData.interest_rate, formData.commission_rate, formData.currency]);

  useEffect(() => {
    const fetchEntities = async () => {
      const { data } = await supabase
        .from('erp_financial_entities')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (data) setEntities(data as FinancialEntity[]);
    };

    if (open) fetchEntities();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      toast.error('Debe seleccionar un cliente');
      return;
    }
    
    setLoading(true);

    try {
      await createContract({
        contract_number: formData.contract_number,
        financial_entity_id: formData.financial_entity_id || null,
        customer_id: formData.customer_id,
        contract_type: formData.contract_type as 'with_recourse' | 'without_recourse' | 'reverse_factoring',
        global_limit: parseFloat(formData.global_limit) || 0,
        advance_percentage: parseFloat(formData.advance_percentage) || 80,
        interest_rate: parseFloat(formData.interest_rate) || 0,
        commission_rate: parseFloat(formData.commission_rate) || 0,
        currency: formData.currency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
      });

      onOpenChange(false);
      setFormData({
        contract_number: '',
        financial_entity_id: '',
        customer_id: '',
        contract_type: 'with_recourse',
        global_limit: '',
        advance_percentage: '80',
        interest_rate: '',
        commission_rate: '',
        currency: 'EUR',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = activePartners.find(p => p.id === formData.customer_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Contrato de Factoring</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente - OBLIGATORIO */}
          <div className="space-y-2">
            <Label htmlFor="customer_id" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Cliente *
            </Label>
            <TradePartnerSearchSelect
              partners={activePartners}
              value={formData.customer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              placeholder="Buscar cliente por nombre, código, NIF o email..."
              required
              partnerTypeFilter="customer"
            />
            {!formData.customer_id && (
              <p className="text-xs text-destructive">
                Debe seleccionar un cliente
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_number">Nº Contrato *</Label>
              <Input
                id="contract_number"
                value={formData.contract_number}
                onChange={(e) => setFormData(prev => ({ ...prev, contract_number: e.target.value }))}
                placeholder="FACT-2025-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_type">Tipo de Contrato</Label>
              <Select
                value={formData.contract_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, contract_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="with_recourse">Con Recurso</SelectItem>
                  <SelectItem value="without_recourse">Sin Recurso</SelectItem>
                  <SelectItem value="reverse_factoring">Confirming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="financial_entity_id">Entidad Financiera</Label>
            <Select
              value={formData.financial_entity_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, financial_entity_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar entidad" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="global_limit">Límite Global *</Label>
              <Input
                id="global_limit"
                type="number"
                step="0.01"
                value={formData.global_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, global_limit: e.target.value }))}
                placeholder="500000.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Divisa</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <Label htmlFor="interest_rate">Tipo Interés (%)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.0001"
                value={formData.interest_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: e.target.value }))}
                placeholder="3.50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">Comisión (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.0001"
                value={formData.commission_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
                placeholder="0.50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha Inicio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observaciones del contrato..."
              rows={2}
            />
          </div>

          {/* Sección de Partidas Contables */}
          <AccountingEntriesPreview
            operationType="factoring"
            operationData={operationData}
            entries={accountingEntries}
            onEntriesChange={setAccountingEntries}
            isExpanded={showAccountingSection}
            onExpandChange={setShowAccountingSection}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.customer_id}>
              {loading ? 'Guardando...' : 'Crear Contrato'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewContractForm;
