/**
 * New Bank Guarantee Form
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Shield, Save } from 'lucide-react';
import { useERPBankGuarantees, CreateGuaranteeInput } from '@/hooks/erp/useERPBankGuarantees';
import { useERPTradeFinance } from '@/hooks/erp/useERPTradeFinance';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';

interface NewGuaranteeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface TradePartner {
  id: string;
  trade_name: string;
}

const GUARANTEE_TYPES = [
  { value: 'bid_bond', label: 'Aval de Licitación' },
  { value: 'performance_bond', label: 'Aval de Cumplimiento' },
  { value: 'advance_payment', label: 'Aval de Anticipo' },
  { value: 'warranty', label: 'Aval de Garantía' },
  { value: 'customs', label: 'Aval Aduanero' },
  { value: 'rental', label: 'Aval de Alquiler' },
  { value: 'other', label: 'Otro' },
];

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY'];

export function NewGuaranteeForm({ onSuccess, onCancel }: NewGuaranteeFormProps) {
  const { createGuarantee } = useERPBankGuarantees();
  const { entities, fetchEntities } = useERPTradeFinance();
  const { currentCompany } = useERPContext();
  const [partners, setPartners] = useState<TradePartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateGuaranteeInput>({
    guarantee_number: '',
    guarantee_type: 'performance_bond',
    applicant_id: undefined,
    beneficiary_id: undefined,
    issuing_bank_id: undefined,
    amount: 0,
    currency: 'EUR',
    issue_date: new Date().toISOString().split('T')[0],
    effective_date: undefined,
    expiry_date: '',
    underlying_contract: '',
    purpose: '',
    terms_conditions: '',
    auto_renewal: false,
    renewal_period_months: undefined,
    commission_rate: undefined,
    commission_amount: undefined,
    issuance_fee: undefined,
    notes: '',
  });

  const fetchPartners = useCallback(async () => {
    if (!currentCompany?.id) return;
    try {
      const { data } = await supabase
        .from('erp_trade_partners')
        .select('id, trade_name')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true);
      setPartners((data || []) as TradePartner[]);
    } catch (err) {
      console.error('Error fetching partners:', err);
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    fetchEntities();
    fetchPartners();
  }, [fetchEntities, fetchPartners]);

  const banks = entities.filter(e => e.entity_type === 'bank');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createGuarantee(formData);
      if (result) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof CreateGuaranteeInput>(
    field: K, 
    value: CreateGuaranteeInput[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Nuevo Aval Bancario</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guarantee_number">Número de Aval *</Label>
              <Input
                id="guarantee_number"
                value={formData.guarantee_number}
                onChange={(e) => updateField('guarantee_number', e.target.value)}
                placeholder="AV-2026-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guarantee_type">Tipo de Aval *</Label>
              <Select
                value={formData.guarantee_type}
                onValueChange={(value) => updateField('guarantee_type', value as CreateGuaranteeInput['guarantee_type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GUARANTEE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuing_bank_id">Banco Emisor</Label>
              <Select
                value={formData.issuing_bank_id || ''}
                onValueChange={(value) => updateField('issuing_bank_id', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicant_id">Ordenante</Label>
              <Select
                value={formData.applicant_id || ''}
                onValueChange={(value) => updateField('applicant_id', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ordenante" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.trade_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiary_id">Beneficiario</Label>
              <Select
                value={formData.beneficiary_id || ''}
                onValueChange={(value) => updateField('beneficiary_id', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar beneficiario" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.trade_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Importe *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Divisa *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => updateField('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(cur => (
                    <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">Tasa Comisión (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.commission_rate || ''}
                onChange={(e) => updateField('commission_rate', parseFloat(e.target.value) || undefined)}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issue_date">Fecha Emisión *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => updateField('issue_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_date">Fecha Efectiva</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date || ''}
                onChange={(e) => updateField('effective_date', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Fecha Vencimiento *</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => updateField('expiry_date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Auto Renewal */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto_renewal"
                checked={formData.auto_renewal || false}
                onCheckedChange={(checked) => updateField('auto_renewal', checked)}
              />
              <Label htmlFor="auto_renewal">Renovación Automática</Label>
            </div>

            {formData.auto_renewal && (
              <div className="flex items-center gap-2">
                <Label htmlFor="renewal_period_months">Período (meses):</Label>
                <Input
                  id="renewal_period_months"
                  type="number"
                  min="1"
                  className="w-20"
                  value={formData.renewal_period_months || ''}
                  onChange={(e) => updateField('renewal_period_months', parseInt(e.target.value) || undefined)}
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="underlying_contract">Contrato Subyacente</Label>
              <Input
                id="underlying_contract"
                value={formData.underlying_contract || ''}
                onChange={(e) => updateField('underlying_contract', e.target.value)}
                placeholder="Referencia del contrato"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Objeto del Aval</Label>
              <Input
                id="purpose"
                value={formData.purpose || ''}
                onChange={(e) => updateField('purpose', e.target.value)}
                placeholder="Propósito del aval"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-1" />
              {loading ? 'Guardando...' : 'Guardar Aval'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default NewGuaranteeForm;
