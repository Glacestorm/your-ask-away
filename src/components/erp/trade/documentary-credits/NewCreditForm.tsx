/**
 * Formulario para crear nuevo Crédito Documentario
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useERPDocumentaryCredits } from '@/hooks/erp/useERPDocumentaryCredits';
import { useERPTradeFinance } from '@/hooks/erp/useERPTradeFinance';

interface NewCreditFormProps {
  onSuccess: () => void;
}

const INCOTERMS = [
  'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP',
  'FAS', 'FOB', 'CFR', 'CIF'
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY'];

export function NewCreditForm({ onSuccess }: NewCreditFormProps) {
  const { createCredit, fetchPartners, partners } = useERPDocumentaryCredits();
  const { entities: financialEntities, fetchEntities: fetchFinancialEntities } = useERPTradeFinance();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    credit_number: '',
    credit_type: 'import' as 'import' | 'export',
    operation_type: 'irrevocable' as const,
    applicant_id: '',
    beneficiary_id: '',
    issuing_bank_id: '',
    advising_bank_id: '',
    amount: '',
    currency: 'EUR',
    tolerance_percentage: '0',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    latest_shipment_date: '',
    presentation_period_days: '21',
    incoterm: '',
    port_of_loading: '',
    port_of_discharge: '',
    partial_shipments_allowed: true,
    transshipment_allowed: true,
    special_conditions: '',
    notes: '',
  });

  useEffect(() => {
    fetchPartners();
    fetchFinancialEntities();
  }, [fetchPartners, fetchFinancialEntities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createCredit({
        credit_number: formData.credit_number,
        credit_type: formData.credit_type,
        operation_type: formData.operation_type,
        applicant_id: formData.applicant_id || null,
        beneficiary_id: formData.beneficiary_id || null,
        issuing_bank_id: formData.issuing_bank_id || null,
        advising_bank_id: formData.advising_bank_id || null,
        amount: parseFloat(formData.amount) || 0,
        currency: formData.currency,
        tolerance_percentage: parseFloat(formData.tolerance_percentage) || 0,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        latest_shipment_date: formData.latest_shipment_date || null,
        presentation_period_days: parseInt(formData.presentation_period_days) || 21,
        incoterm: formData.incoterm || null,
        port_of_loading: formData.port_of_loading || null,
        port_of_discharge: formData.port_of_discharge || null,
        partial_shipments_allowed: formData.partial_shipments_allowed,
        transshipment_allowed: formData.transshipment_allowed,
        special_conditions: formData.special_conditions || null,
        notes: formData.notes || null,
        status: 'draft',
      });

      if (result) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="credit_number">Número de L/C *</Label>
          <Input
            id="credit_number"
            value={formData.credit_number}
            onChange={(e) => setFormData(prev => ({ ...prev, credit_number: e.target.value }))}
            placeholder="LC-2026-001"
            required
          />
        </div>
        <div>
          <Label htmlFor="credit_type">Tipo *</Label>
          <Select
            value={formData.credit_type}
            onValueChange={(v) => setFormData(prev => ({ ...prev, credit_type: v as 'import' | 'export' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="import">Importación</SelectItem>
              <SelectItem value="export">Exportación</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="operation_type">Tipo de Operación *</Label>
        <Select
          value={formData.operation_type}
          onValueChange={(v) => setFormData(prev => ({ ...prev, operation_type: v as typeof formData.operation_type }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="irrevocable">Irrevocable</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="unconfirmed">Sin confirmar</SelectItem>
            <SelectItem value="transferable">Transferible</SelectItem>
            <SelectItem value="back_to_back">Back-to-Back</SelectItem>
            <SelectItem value="standby">Standby</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="applicant_id">Ordenante</Label>
          <Select
            value={formData.applicant_id}
            onValueChange={(v) => setFormData(prev => ({ ...prev, applicant_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {partners.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.legal_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="beneficiary_id">Beneficiario</Label>
          <Select
            value={formData.beneficiary_id}
            onValueChange={(v) => setFormData(prev => ({ ...prev, beneficiary_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {partners.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.legal_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issuing_bank_id">Banco Emisor</Label>
          <Select
            value={formData.issuing_bank_id}
            onValueChange={(v) => setFormData(prev => ({ ...prev, issuing_bank_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {financialEntities.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="advising_bank_id">Banco Avisador</Label>
          <Select
            value={formData.advising_bank_id}
            onValueChange={(v) => setFormData(prev => ({ ...prev, advising_bank_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {financialEntities.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Amounts */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="amount">Importe *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Divisa</Label>
          <Select
            value={formData.currency}
            onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="tolerance_percentage">Tolerancia %</Label>
          <Input
            id="tolerance_percentage"
            type="number"
            step="0.01"
            value={formData.tolerance_percentage}
            onChange={(e) => setFormData(prev => ({ ...prev, tolerance_percentage: e.target.value }))}
          />
        </div>
      </div>

      <Separator />

      {/* Dates */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="issue_date">Fecha Emisión *</Label>
          <Input
            id="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="expiry_date">Fecha Vencimiento *</Label>
          <Input
            id="expiry_date"
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="latest_shipment_date">Última Fecha Embarque</Label>
          <Input
            id="latest_shipment_date"
            type="date"
            value={formData.latest_shipment_date}
            onChange={(e) => setFormData(prev => ({ ...prev, latest_shipment_date: e.target.value }))}
          />
        </div>
      </div>

      <Separator />

      {/* Shipping Terms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="incoterm">Incoterm</Label>
          <Select
            value={formData.incoterm}
            onValueChange={(v) => setFormData(prev => ({ ...prev, incoterm: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {INCOTERMS.map(i => (
                <SelectItem key={i} value={i}>{i}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="presentation_period_days">Período Presentación (días)</Label>
          <Input
            id="presentation_period_days"
            type="number"
            value={formData.presentation_period_days}
            onChange={(e) => setFormData(prev => ({ ...prev, presentation_period_days: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="port_of_loading">Puerto Carga</Label>
          <Input
            id="port_of_loading"
            value={formData.port_of_loading}
            onChange={(e) => setFormData(prev => ({ ...prev, port_of_loading: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="port_of_discharge">Puerto Descarga</Label>
          <Input
            id="port_of_discharge"
            value={formData.port_of_discharge}
            onChange={(e) => setFormData(prev => ({ ...prev, port_of_discharge: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch
            id="partial_shipments"
            checked={formData.partial_shipments_allowed}
            onCheckedChange={(c) => setFormData(prev => ({ ...prev, partial_shipments_allowed: c }))}
          />
          <Label htmlFor="partial_shipments">Embarques parciales permitidos</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="transshipment"
            checked={formData.transshipment_allowed}
            onCheckedChange={(c) => setFormData(prev => ({ ...prev, transshipment_allowed: c }))}
          />
          <Label htmlFor="transshipment">Transbordo permitido</Label>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div>
        <Label htmlFor="special_conditions">Condiciones Especiales</Label>
        <Textarea
          id="special_conditions"
          value={formData.special_conditions}
          onChange={(e) => setFormData(prev => ({ ...prev, special_conditions: e.target.value }))}
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Carta de Crédito'}
        </Button>
      </div>
    </form>
  );
}

export default NewCreditForm;
