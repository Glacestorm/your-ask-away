/**
 * Dialog para crear Facturas de Proveedor
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, FileText } from 'lucide-react';
import { useERPPurchases, Supplier } from '@/hooks/erp/useERPPurchases';
import { useMaestros } from '@/hooks/erp/useMaestros';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface SupplierInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LineItem {
  item_id: string;
  item_code: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  subtotal: number;
}

export function SupplierInvoiceDialog({ open, onOpenChange, onSuccess }: SupplierInvoiceDialogProps) {
  const { fetchSuppliers, createSupplierInvoice, isLoading } = useERPPurchases();
  const { items } = useMaestros();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    if (open) {
      loadSuppliers();
      resetForm();
    }
  }, [open]);

  const loadSuppliers = async () => {
    const data = await fetchSuppliers({ isActive: true });
    setSuppliers(data);
  };

  const resetForm = () => {
    setSupplierId('');
    setSupplierInvoiceNumber('');
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    setNotes('');
    setLines([]);
  };

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
      setDueDate(format(addDays(new Date(invoiceDate), supplier.payment_terms), 'yyyy-MM-dd'));
    }
  };

  const addLine = () => {
    setLines([...lines, {
      item_id: '',
      item_code: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      tax_rate: 21,
      subtotal: 0,
    }]);
  };

  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    const line = newLines[index];
    const discountMultiplier = 1 - (line.discount_percent / 100);
    line.subtotal = line.quantity * line.unit_price * discountMultiplier;
    
    setLines(newLines);
  };

  const selectItem = (index: number, itemId: string) => {
    const item = items?.find(i => i.id === itemId);
    if (item) {
      const newLines = [...lines];
      newLines[index] = {
        ...newLines[index],
        item_id: item.id,
        item_code: item.sku,
        description: item.name,
        unit_price: item.standard_cost || 0,
      };
      const discountMultiplier = 1 - (newLines[index].discount_percent / 100);
      newLines[index].subtotal = newLines[index].quantity * newLines[index].unit_price * discountMultiplier;
      setLines(newLines);
    }
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const totals = lines.reduce((acc, line) => {
    const taxAmount = line.subtotal * (line.tax_rate / 100);
    return {
      subtotal: acc.subtotal + line.subtotal,
      tax: acc.tax + taxAmount,
      total: acc.total + line.subtotal + taxAmount,
    };
  }, { subtotal: 0, tax: 0, total: 0 });

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (!supplierInvoiceNumber.trim()) {
      toast.error('Introduce el número de factura del proveedor');
      return;
    }
    if (lines.length === 0) {
      toast.error('Añade al menos una línea');
      return;
    }

    const invoiceData = {
      supplier_id: supplierId,
      supplier_invoice_number: supplierInvoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      status: 'draft' as const,
      currency: 'EUR',
      exchange_rate: 1,
      subtotal: totals.subtotal,
      tax_total: totals.tax,
      total: totals.total,
      notes: notes || undefined,
    };

    const linesData = lines.map((l, idx) => ({
      line_number: idx + 1,
      item_id: l.item_id || undefined,
      item_code: l.item_code,
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_percent: l.discount_percent,
      tax_rate: l.tax_rate,
      subtotal: l.subtotal,
    }));

    const result = await createSupplierInvoice(invoiceData, linesData);
    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nueva Factura de Proveedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabecera */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={supplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nº Factura Proveedor *</Label>
              <Input
                value={supplierInvoiceNumber}
                onChange={e => setSupplierInvoiceNumber(e.target.value)}
                placeholder="Ej: FRA-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Factura</Label>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Vencimiento</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Líneas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Líneas de Factura</Label>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Añadir Línea
              </Button>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Artículo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-[80px]">Cant.</TableHead>
                    <TableHead className="w-[100px]">Precio</TableHead>
                    <TableHead className="w-[70px]">Dto%</TableHead>
                    <TableHead className="w-[70px]">IVA%</TableHead>
                    <TableHead className="w-[100px] text-right">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay líneas. Haz clic en "Añadir Línea"
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={line.item_id} onValueChange={v => selectItem(idx, v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Artículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {items?.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.sku} - {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8"
                            value={line.description}
                            onChange={e => updateLine(idx, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8"
                            value={line.quantity}
                            onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            min={0}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8"
                            value={line.unit_price}
                            onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            min={0}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8"
                            value={line.discount_percent}
                            onChange={e => updateLine(idx, 'discount_percent', parseFloat(e.target.value) || 0)}
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8"
                            value={line.tax_rate}
                            onChange={e => updateLine(idx, 'tax_rate', parseFloat(e.target.value) || 0)}
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(line.subtotal)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totales */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base imponible:</span>
                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuestos:</span>
                <span className="font-mono">{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span className="font-mono">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SupplierInvoiceDialog;
