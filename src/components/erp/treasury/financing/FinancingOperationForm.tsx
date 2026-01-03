import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FinancingOperationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

const OPERATION_TYPES = [
  { value: 'loan', label: 'Préstamo' },
  { value: 'credit_line', label: 'Línea de Crédito' },
  { value: 'leasing', label: 'Leasing' },
  { value: 'renting', label: 'Renting' },
  { value: 'factoring', label: 'Factoring' },
  { value: 'confirming', label: 'Confirming' },
  { value: 'mortgage', label: 'Hipoteca' },
];

const INTEREST_TYPES = [
  { value: 'fixed', label: 'Fijo' },
  { value: 'variable', label: 'Variable' },
  { value: 'mixed', label: 'Mixto' },
];

const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export function FinancingOperationForm({ 
  open, 
  onOpenChange, 
  companyId, 
  onSuccess 
}: FinancingOperationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    operation_type: 'loan',
    contract_number: '',
    financial_entity_name: '',
    financial_entity_code: '',
    principal_amount: '',
    currency: 'EUR',
    interest_rate: '',
    interest_type: 'fixed',
    reference_rate: '',
    spread: '',
    start_date: new Date(),
    term_months: '12',
    payment_frequency: 'monthly',
    guarantee_type: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.financial_entity_name || !formData.principal_amount || !formData.interest_rate || !formData.contract_number) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const principalAmount = parseFloat(formData.principal_amount);
      const interestRate = parseFloat(formData.interest_rate);
      const termMonths = parseInt(formData.term_months);
      const startDate = formData.start_date;
      const endDate = addMonths(startDate, termMonths);
      
      const { error } = await supabase
        .from('erp_financing_operations')
        .insert({
          company_id: companyId,
          operation_type: formData.operation_type,
          contract_number: formData.contract_number,
          financial_entity_name: formData.financial_entity_name,
          financial_entity_code: formData.financial_entity_code || null,
          principal_amount: principalAmount,
          outstanding_balance: principalAmount,
          currency: formData.currency,
          interest_rate: interestRate,
          interest_type: formData.interest_type,
          reference_rate: formData.reference_rate || null,
          spread: formData.spread ? parseFloat(formData.spread) : null,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          term_months: termMonths,
          payment_frequency: formData.payment_frequency,
          guarantee_type: formData.guarantee_type || null,
          description: formData.description || null,
          status: 'active',
        });

      if (error) throw error;

      toast.success('Operación de financiación creada');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating financing operation:', error);
      toast.error('Error al crear la operación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      operation_type: 'loan',
      contract_number: '',
      financial_entity_name: '',
      financial_entity_code: '',
      principal_amount: '',
      currency: 'EUR',
      interest_rate: '',
      interest_type: 'fixed',
      reference_rate: '',
      spread: '',
      start_date: new Date(),
      term_months: '12',
      payment_frequency: 'monthly',
      guarantee_type: '',
      description: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Operación de Financiación</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Operación *</Label>
              <Select
                value={formData.operation_type}
                onValueChange={(v) => setFormData({ ...formData, operation_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nº Contrato *</Label>
              <Input
                value={formData.contract_number}
                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                placeholder="REF-2024-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entidad Financiera *</Label>
              <Input
                value={formData.financial_entity_name}
                onChange={(e) => setFormData({ ...formData, financial_entity_name: e.target.value })}
                placeholder="Nombre del banco"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Código Entidad</Label>
              <Input
                value={formData.financial_entity_code}
                onChange={(e) => setFormData({ ...formData, financial_entity_code: e.target.value })}
                placeholder="0049"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Importe Principal *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                placeholder="100000.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(v) => setFormData({ ...formData, currency: v })}
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

            <div className="space-y-2">
              <Label>Tipo de Interés (%) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                placeholder="3.50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo Interés</Label>
              <Select
                value={formData.interest_type}
                onValueChange={(v) => setFormData({ ...formData, interest_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.interest_type !== 'fixed' && (
              <>
                <div className="space-y-2">
                  <Label>Índice Referencia</Label>
                  <Input
                    value={formData.reference_rate}
                    onChange={(e) => setFormData({ ...formData, reference_rate: e.target.value })}
                    placeholder="Euribor 12M"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Diferencial (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.spread}
                    onChange={(e) => setFormData({ ...formData, spread: e.target.value })}
                    placeholder="1.50"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.start_date, 'dd/MM/yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(d) => d && setFormData({ ...formData, start_date: d })}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Plazo (meses) *</Label>
              <Input
                type="number"
                value={formData.term_months}
                onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
                placeholder="12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Frecuencia Pago</Label>
              <Select
                value={formData.payment_frequency}
                onValueChange={(v) => setFormData({ ...formData, payment_frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Garantía</Label>
            <Input
              value={formData.guarantee_type}
              onChange={(e) => setFormData({ ...formData, guarantee_type: e.target.value })}
              placeholder="Aval personal, hipoteca..."
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Observaciones adicionales..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Operación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
