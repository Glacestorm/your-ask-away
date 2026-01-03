/**
 * Formulario para registrar nuevo efecto
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useERPDiscountOperations } from '@/hooks/erp/useERPDiscountOperations';

interface NewEffectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NewEffectForm({ onSuccess, onCancel }: NewEffectFormProps) {
  const [loading, setLoading] = useState(false);
  const [effectType, setEffectType] = useState<'bill' | 'promissory_note' | 'receipt' | 'check'>('promissory_note');
  const [effectNumber, setEffectNumber] = useState('');
  const [draweeName, setDraweeName] = useState('');
  const [draweeTaxId, setDraweeTaxId] = useState('');
  const [draweeAddress, setDraweeAddress] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [maturityDate, setMaturityDate] = useState<Date>(addDays(new Date(), 90));
  const [bankIban, setBankIban] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const { createEffect } = useERPDiscountOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!draweeName || amount <= 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await createEffect({
        company_id: crypto.randomUUID(), // TODO: Get from context
        effect_type: effectType,
        effect_number: effectNumber || null,
        drawee_name: draweeName,
        drawee_tax_id: draweeTaxId || null,
        drawee_address: draweeAddress || null,
        amount: amount,
        currency: 'EUR',
        issue_date: format(issueDate, 'yyyy-MM-dd'),
        maturity_date: format(maturityDate, 'yyyy-MM-dd'),
        bank_iban: bankIban || null,
        invoice_number: invoiceNumber || null,
        status: 'pending'
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
        {/* Effect Type */}
        <div className="space-y-2">
          <Label>Tipo de Efecto *</Label>
          <Select value={effectType} onValueChange={(v) => setEffectType(v as typeof effectType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bill">Letra de Cambio</SelectItem>
              <SelectItem value="promissory_note">Pagaré</SelectItem>
              <SelectItem value="receipt">Recibo</SelectItem>
              <SelectItem value="check">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Effect Number */}
        <div className="space-y-2">
          <Label htmlFor="effectNumber">Nº Efecto</Label>
          <Input
            id="effectNumber"
            value={effectNumber}
            onChange={(e) => setEffectNumber(e.target.value)}
            placeholder="PAG-001"
          />
        </div>

        {/* Drawee Name */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="draweeName">Librado / Deudor *</Label>
          <Input
            id="draweeName"
            value={draweeName}
            onChange={(e) => setDraweeName(e.target.value)}
            placeholder="Nombre o razón social"
            required
          />
        </div>

        {/* Drawee Tax ID */}
        <div className="space-y-2">
          <Label htmlFor="draweeTaxId">NIF/CIF</Label>
          <Input
            id="draweeTaxId"
            value={draweeTaxId}
            onChange={(e) => setDraweeTaxId(e.target.value)}
            placeholder="B12345678"
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Importe (€) *</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={0.01}
            step={0.01}
            required
          />
        </div>

        {/* Issue Date */}
        <div className="space-y-2">
          <Label>Fecha Emisión *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !issueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {issueDate ? format(issueDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={issueDate}
                onSelect={(date) => date && setIssueDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Maturity Date */}
        <div className="space-y-2">
          <Label>Fecha Vencimiento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !maturityDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {maturityDate ? format(maturityDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={maturityDate}
                onSelect={(date) => date && setMaturityDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Bank IBAN */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="bankIban">IBAN Domiciliación</Label>
          <Input
            id="bankIban"
            value={bankIban}
            onChange={(e) => setBankIban(e.target.value)}
            placeholder="ES12 1234 5678 9012 3456 7890"
          />
        </div>

        {/* Invoice Number */}
        <div className="col-span-2 space-y-2">
          <Label htmlFor="invoiceNumber">Nº Factura Asociada</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="FAC-2025-001"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !draweeName || amount <= 0}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Registrar Efecto
        </Button>
      </div>
    </form>
  );
}

export default NewEffectForm;
