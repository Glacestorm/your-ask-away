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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess: () => void;
}

const INVESTMENT_TYPES = [
  { value: 'deposit', label: 'Depósito' },
  { value: 'bond', label: 'Bono/Obligación' },
  { value: 'stock', label: 'Acciones' },
  { value: 'fund', label: 'Fondo de Inversión' },
  { value: 'real_estate', label: 'Inmobiliario' },
  { value: 'other', label: 'Otro' },
];

const COUPON_FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
  { value: 'at_maturity', label: 'Al vencimiento' },
];

export function InvestmentForm({ 
  open, 
  onOpenChange, 
  companyId, 
  onSuccess 
}: InvestmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    investment_type: 'deposit',
    investment_name: '',
    financial_entity_name: '',
    nominal_amount: '',
    currency: 'EUR',
    interest_rate: '',
    purchase_date: new Date(),
    maturity_date: null as Date | null,
    isin_code: '',
    coupon_frequency: 'annual',
    units_quantity: '',
    unit_price: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.investment_name || !formData.nominal_amount) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const nominalAmount = parseFloat(formData.nominal_amount);
      
      const { error } = await supabase
        .from('erp_investments')
        .insert({
          company_id: companyId,
          investment_type: formData.investment_type,
          investment_name: formData.investment_name,
          financial_entity_name: formData.financial_entity_name || null,
          nominal_amount: nominalAmount,
          current_value: nominalAmount,
          currency: formData.currency,
          interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
          purchase_date: format(formData.purchase_date, 'yyyy-MM-dd'),
          maturity_date: formData.maturity_date ? format(formData.maturity_date, 'yyyy-MM-dd') : null,
          isin_code: formData.isin_code || null,
          coupon_frequency: formData.coupon_frequency || null,
          units_quantity: formData.units_quantity ? parseFloat(formData.units_quantity) : null,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
          description: formData.description || null,
          status: 'active',
        });

      if (error) throw error;

      toast.success('Inversión creada correctamente');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating investment:', error);
      toast.error('Error al crear la inversión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      investment_type: 'deposit',
      investment_name: '',
      financial_entity_name: '',
      nominal_amount: '',
      currency: 'EUR',
      interest_rate: '',
      purchase_date: new Date(),
      maturity_date: null,
      isin_code: '',
      coupon_frequency: 'annual',
      units_quantity: '',
      unit_price: '',
      description: '',
    });
  };

  const showInterestRate = ['deposit', 'bond'].includes(formData.investment_type);
  const showISIN = ['bond', 'stock', 'fund'].includes(formData.investment_type);
  const showUnits = ['stock', 'fund'].includes(formData.investment_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Inversión</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Inversión *</Label>
              <Select
                value={formData.investment_type}
                onValueChange={(v) => setFormData({ ...formData, investment_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVESTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nombre/Referencia *</Label>
              <Input
                value={formData.investment_name}
                onChange={(e) => setFormData({ ...formData, investment_name: e.target.value })}
                placeholder="Depósito BBVA 12M"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Entidad/Emisor</Label>
            <Input
              value={formData.financial_entity_name}
              onChange={(e) => setFormData({ ...formData, financial_entity_name: e.target.value })}
              placeholder="Banco, empresa emisora..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Importe Nominal *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.nominal_amount}
                onChange={(e) => setFormData({ ...formData, nominal_amount: e.target.value })}
                placeholder="50000.00"
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

            {showInterestRate && (
              <div className="space-y-2">
                <Label>Tipo Interés (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  placeholder="2.50"
                />
              </div>
            )}
          </div>

          {showUnits && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad/Unidades</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.units_quantity}
                  onChange={(e) => setFormData({ ...formData, units_quantity: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Unitario</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="150.50"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Compra/Contratación *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.purchase_date, 'dd/MM/yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.purchase_date}
                    onSelect={(d) => d && setFormData({ ...formData, purchase_date: d })}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha Vencimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.maturity_date 
                      ? format(formData.maturity_date, 'dd/MM/yyyy', { locale: es })
                      : 'Sin vencimiento'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.maturity_date || undefined}
                    onSelect={(d) => setFormData({ ...formData, maturity_date: d || null })}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {showISIN && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código ISIN</Label>
                <Input
                  value={formData.isin_code}
                  onChange={(e) => setFormData({ ...formData, isin_code: e.target.value })}
                  placeholder="ES0000000000"
                />
              </div>
              <div className="space-y-2">
                <Label>Frecuencia Cupón</Label>
                <Select
                  value={formData.coupon_frequency}
                  onValueChange={(v) => setFormData({ ...formData, coupon_frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUPON_FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
              Crear Inversión
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
