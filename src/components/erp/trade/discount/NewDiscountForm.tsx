/**
 * Formulario para crear nueva operación de descuento
 */

import { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useERPDiscountOperations } from '@/hooks/erp/useERPDiscountOperations';
import { useERPTradeFinance } from '@/hooks/erp/useERPTradeFinance';

interface NewDiscountFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewDiscountForm({ onSuccess, onCancel }: NewDiscountFormProps) {
  const [loading, setLoading] = useState(false);
  const [entityId, setEntityId] = useState<string>('');
  const [operationType, setOperationType] = useState<'national' | 'international'>('national');
  const [discountDate, setDiscountDate] = useState<Date>(new Date());
  const [valueDate, setValueDate] = useState<Date>(new Date());
  const [interestRate, setInterestRate] = useState<number>(5);
  const [commissionRate, setCommissionRate] = useState<number>(0.25);
  const [expenses, setExpenses] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');

  const { createDiscount } = useERPDiscountOperations();
  const { entities, fetchEntities } = useERPTradeFinance();

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entityId) {
      return;
    }

    setLoading(true);
    try {
      const result = await createDiscount({
        company_id: crypto.randomUUID(), // TODO: Get from context
        entity_id: entityId,
        operation_type: operationType,
        discount_date: format(discountDate, 'yyyy-MM-dd'),
        value_date: format(valueDate, 'yyyy-MM-dd'),
        interest_rate: interestRate / 100,
        commission_rate: commissionRate / 100,
        expenses: expenses,
        currency: 'EUR',
        internal_notes: notes || null
      });

      if (result) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Entity */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="entity">Entidad Financiera *</Label>
          <Select value={entityId} onValueChange={setEntityId}>
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

        {/* Operation Type */}
        <div className="space-y-2">
          <Label>Tipo de Operación</Label>
          <Select value={operationType} onValueChange={(v) => setOperationType(v as 'national' | 'international')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national">Nacional</SelectItem>
              <SelectItem value="international">Internacional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Currency - disabled for now */}
        <div className="space-y-2">
          <Label>Moneda</Label>
          <Input value="EUR" disabled />
        </div>

        {/* Discount Date */}
        <div className="space-y-2">
          <Label>Fecha Descuento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !discountDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {discountDate ? format(discountDate, "PPP", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={discountDate}
                onSelect={(date) => date && setDiscountDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Value Date */}
        <div className="space-y-2">
          <Label>Fecha Valor</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !valueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {valueDate ? format(valueDate, "PPP", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={valueDate}
                onSelect={(date) => date && setValueDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Interest Rate */}
        <div className="space-y-2">
          <Label htmlFor="interestRate">Tipo Interés (%)</Label>
          <Input
            id="interestRate"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            min={0}
            max={50}
            step={0.1}
          />
        </div>

        {/* Commission Rate */}
        <div className="space-y-2">
          <Label htmlFor="commissionRate">Comisión (%)</Label>
          <Input
            id="commissionRate"
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(Number(e.target.value))}
            min={0}
            max={10}
            step={0.05}
          />
        </div>

        {/* Expenses */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="expenses">Gastos Fijos (€)</Label>
          <Input
            id="expenses"
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(Number(e.target.value))}
            min={0}
            step={5}
          />
        </div>

        {/* Notes */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="notes">Notas Internas</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones..."
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !entityId}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear Descuento
        </Button>
      </div>
    </form>
  );
}

export default NewDiscountForm;
