/**
 * Editor de Documentos de Ventas ERP
 * Soporta: Presupuestos, Pedidos, Albaranes, Facturas, Abonos
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Save, FileText, AlertTriangle, CheckCircle,
  Plus, Trash2, X, Loader2
} from 'lucide-react';
import { useERPSales, SalesQuoteLine } from '@/hooks/erp/useERPSales';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export type DocumentType = 'quote' | 'order' | 'delivery' | 'invoice' | 'credit';

interface SalesDocumentEditorProps {
  documentType: DocumentType;
  documentId?: string;
  onClose: () => void;
  onSave?: () => void;
}

interface Customer {
  id: string;
  name: string;
  tax_id?: string | null;
  source?: 'erp' | 'maestros';
}

interface Series {
  id: string;
  name: string;
  prefix: string;
  document_type?: string;
}

interface Item {
  id: string;
  code: string;
  name: string;
  default_price: number;
  tax_rate: number;
}

interface LineItem {
  id?: string;
  item_id?: string;
  item_code?: string;
  description: string;
  qty: number;
  unit_price: number;
  discount_percent: number;
  discount_total: number;
  tax_rate: number;
  tax_total: number;
  line_total: number;
}

const documentTypeLabels: Record<DocumentType, string> = {
  quote: 'Presupuesto',
  order: 'Pedido',
  delivery: 'Albarán',
  invoice: 'Factura',
  credit: 'Abono',
};

export function SalesDocumentEditor({ 
  documentType, 
  documentId, 
  onClose, 
  onSave 
}: SalesDocumentEditorProps) {
  const { currentCompany, hasPermission } = useERPContext();
  const { createQuote, createOrder, checkCustomerCredit } = useERPSales();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [series, setSeries] = useState<Series[]>([]);;

  // Portal container for Select dropdowns inside Dialog (prevents click/overlay issues)
  const [selectPortalContainer, setSelectPortalContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSelectPortalContainer(document.getElementById('erp-sales-editor-dialog') as HTMLElement | null);
  }, []);
  
  // Form state
  const [customerId, setCustomerId] = useState('');
  const [seriesId, setSeriesId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validUntil, setValidUntil] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  
  // Credit check
  const [creditCheck, setCreditCheck] = useState<{ allowed: boolean; can_override: boolean; current_debt: number; overdue_debt: number; credit_limit: number } | null>(null);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  
  // Totals
  const [subtotal, setSubtotal] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [total, setTotal] = useState(0);

  // Load master data
  useEffect(() => {
    if (currentCompany) {
      loadMasterData();
    }
  }, [currentCompany]);

  // Recalculate totals when lines change
  useEffect(() => {
    calculateTotals();
  }, [lines]);

  const loadMasterData = async () => {
    if (!currentCompany) return;
    
    setIsLoading(true);
    try {
      // Load series for this document type
      const docTypeMap: Record<DocumentType, string | string[]> = {
        quote: 'quote',
        order: 'order',
        // compat: algunas pantallas usan "delivery" y otras "delivery_note"
        delivery: ['delivery_note', 'delivery'],
        invoice: 'invoice',
        credit: 'credit_note',
      };

      const docTypeFilter = docTypeMap[documentType];

      const seriesQuery = supabase
        .from('erp_series')
        .select('id, name, prefix, document_type')
        .eq('company_id', currentCompany.id)
        .eq('module', 'sales')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      const seriesResult = Array.isArray(docTypeFilter)
        ? await seriesQuery.in('document_type', docTypeFilter)
        : await seriesQuery.eq('document_type', docTypeFilter);

      const [erpCustomersResult, customersResult, itemsResult] = await Promise.all([
        supabase
          .from('erp_customers')
          .select('id, name, tax_id')
          .eq('company_id', currentCompany.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('customers')
          .select('id, legal_name, trade_name, tax_id')
          .eq('company_id', currentCompany.id)
          .eq('is_active', true)
          .order('legal_name'),
        supabase
          .from('erp_items')
          .select('id, code, name, default_price, tax_rate')
          .eq('company_id', currentCompany.id)
          .eq('is_active', true)
          .order('code'),
      ]);

      if (seriesResult.data) {
        setSeries(seriesResult.data.map((s: any) => ({ ...s, source: 'erp' })) as Series[]);
        if (seriesResult.data.length > 0) {
          setSeriesId(seriesResult.data[0].id);
        }
      }

      const mergedCustomers: Customer[] = [];

      if (erpCustomersResult.data) {
        mergedCustomers.push(
          ...(erpCustomersResult.data as any[]).map((c) => ({
            id: c.id,
            name: c.name || '-',
            tax_id: c.tax_id || null,
            source: 'erp' as const,
          }))
        );
      }

      if (customersResult.data) {
        mergedCustomers.push(
          ...(customersResult.data as any[]).map((c) => ({
            id: c.id,
            name: (c.trade_name || c.legal_name || '').trim() || '-',
            tax_id: c.tax_id || null,
            source: 'maestros' as const,
          }))
        );
      }

      // dedupe por id (por si existe en ambas fuentes)
      const uniqueCustomers = Array.from(new Map(mergedCustomers.map((c) => [c.id, c])).values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setCustomers(uniqueCustomers);

      if (itemsResult.data) {
        setItems(itemsResult.data.map(i => ({
          id: i.id,
          code: i.code,
          name: i.name,
          default_price: Number(i.default_price) || 0,
          tax_rate: Number(i.tax_rate) || 21,
        })));
      }
    } catch (error) {
      console.error('[SalesDocumentEditor] Error loading master data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotals = useCallback(() => {
    let sub = 0;
    let tax = 0;
    
    lines.forEach(line => {
      sub += line.line_total - line.tax_total;
      tax += line.tax_total;
    });
    
    setSubtotal(sub);
    setTaxTotal(tax);
    setTotal(sub + tax);
  }, [lines]);

  const handleCustomerChange = async (id: string) => {
    setCustomerId(id);
    
    // Check credit if needed
    if (['order', 'delivery', 'invoice'].includes(documentType)) {
      const check = await checkCustomerCredit(id, total);
      if (check) {
        setCreditCheck({
          allowed: check.passed,
          can_override: !check.blocked,
          current_debt: check.current_debt,
          overdue_debt: check.overdue_debt,
          credit_limit: check.credit_limit,
        });
      }
    }
  };

  const addLine = () => {
    setLines([...lines, {
      description: '',
      qty: 1,
      unit_price: 0,
      discount_percent: 0,
      discount_total: 0,
      tax_rate: 21,
      tax_total: 0,
      line_total: 0,
    }]);
  };

  const updateLine = (index: number, field: keyof LineItem, value: number | string) => {
    const newLines = [...lines];
    const line = { ...newLines[index], [field]: value };
    
    // Recalculate line totals
    const baseAmount = line.qty * line.unit_price;
    line.discount_total = baseAmount * (line.discount_percent / 100);
    const afterDiscount = baseAmount - line.discount_total;
    line.tax_total = afterDiscount * (line.tax_rate / 100);
    line.line_total = afterDiscount + line.tax_total;
    
    newLines[index] = line;
    setLines(newLines);
  };

  const selectItem = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newLines = [...lines];
      const qty = newLines[index].qty || 1;
      const baseAmount = qty * item.default_price;
      const taxAmount = baseAmount * (item.tax_rate / 100);
      
      newLines[index] = {
        ...newLines[index],
        item_id: item.id,
        item_code: item.code,
        description: item.name,
        unit_price: item.default_price,
        tax_rate: item.tax_rate,
        qty,
        discount_percent: 0,
        discount_total: 0,
        tax_total: taxAmount,
        line_total: baseAmount + taxAmount,
      };
      setLines(newLines);
    }
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSave = async (status: string = 'draft') => {
    if (!customerId) {
      toast.error('Selecciona un cliente');
      return;
    }
    if (lines.length === 0) {
      toast.error('Añade al menos una línea');
      return;
    }
    if (!seriesId) {
      toast.error('Selecciona una serie');
      return;
    }

    // Credit check for non-drafts
    if (status !== 'draft' && creditCheck && !creditCheck.allowed) {
      if (!hasPermission('sales.post') || !creditCheck.can_override) {
        toast.error('Cliente bloqueado por riesgo. No tienes permiso para continuar.');
        return;
      }
      setShowCreditWarning(true);
      return;
    }

    await saveDocument(status);
  };

  const saveDocument = async (status: string) => {
    if (!currentCompany) return;
    
    setIsSaving(true);
    try {
      const customer = customers.find(c => c.id === customerId);
      
      // Only quote creation is implemented for now via hook
      if (documentType === 'quote') {
        const quoteData = {
          series_id: seriesId,
          customer_id: customerId,
          customer_name: customer?.name,
          customer_tax_id: customer?.tax_id,
          date,
          valid_until: validUntil || undefined,
          status: status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted',
          currency: currentCompany.currency,
          notes,
          subtotal,
          discount_total: 0,
          tax_total: taxTotal,
          total,
        };

        const linesData: Omit<SalesQuoteLine, 'id' | 'quote_id'>[] = lines.map((line, idx) => ({
          line_number: idx + 1,
          item_id: line.item_id,
          item_code: line.item_code,
          description: line.description,
          qty: line.qty,
          unit: 'UND',
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          discount_total: line.discount_total,
          tax_rate: line.tax_rate,
          tax_total: line.tax_total,
          line_total: line.line_total,
        }));

        const result = await createQuote(quoteData, linesData);
        if (result) {
          toast.success(`${documentTypeLabels[documentType]} guardado correctamente`);
          onSave?.();
          onClose();
        }
      } else if (documentType === 'order') {
        const orderData = {
          series_id: seriesId,
          customer_id: customerId,
          customer_name: customer?.name,
          customer_tax_id: customer?.tax_id,
          date,
          delivery_date: deliveryDate || undefined,
          status: status as 'draft' | 'confirmed' | 'partial' | 'completed' | 'cancelled',
          currency: currentCompany.currency,
          notes,
          subtotal,
          discount_total: 0,
          tax_total: taxTotal,
          total,
          credit_check_passed: !creditCheck || creditCheck.allowed,
        };

        const linesData = lines.map((line, idx) => ({
          line_number: idx + 1,
          item_id: line.item_id,
          item_code: line.item_code,
          description: line.description,
          qty: line.qty,
          qty_delivered: 0,
          qty_invoiced: 0,
          unit: 'UND',
          unit_price: line.unit_price,
          discount_percent: line.discount_percent,
          discount_total: line.discount_total,
          tax_rate: line.tax_rate,
          tax_total: line.tax_total,
          line_total: line.line_total,
        }));

        const result = await createOrder(orderData, linesData);
        if (result) {
          toast.success(`${documentTypeLabels[documentType]} guardado correctamente`);
          onSave?.();
          onClose();
        }
      } else {
        toast.info(`Creación de ${documentTypeLabels[documentType]} próximamente`);
      }
    } catch (error) {
      console.error('[SalesDocumentEditor] Save error:', error);
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: currentCompany?.currency || 'EUR' 
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {documentId ? 'Editar' : 'Nuevo'} {documentTypeLabels[documentType]}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Credit Warning */}
      {creditCheck && !creditCheck.allowed && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Cliente con riesgo crediticio</p>
            <p className="text-sm text-muted-foreground">
              Deuda actual: {formatCurrency(creditCheck.current_debt)} | 
              Vencida: {formatCurrency(creditCheck.overdue_debt)} | 
              Límite: {formatCurrency(creditCheck.credit_limit)}
            </p>
            {creditCheck.can_override && hasPermission('sales.post') && (
              <p className="text-sm text-amber-600 mt-1">Puedes continuar con override</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Customer & Details */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos Generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent portalContainer={selectPortalContainer} position="popper">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {c.tax_id ? `${c.name} (${c.tax_id})` : c.name}
                        {c.source === 'erp' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">ERP</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Serie *</Label>
              <Select value={seriesId} onValueChange={setSeriesId}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Seleccionar serie" />
                </SelectTrigger>
                <SelectContent portalContainer={selectPortalContainer} position="popper">
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        {`${s.name} (${s.prefix})`}
                        {s.document_type && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">{s.document_type}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {documentType === 'quote' && (
              <div className="space-y-2">
                <Label>Válido hasta</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            )}

            {['order', 'delivery'].includes(documentType) && (
              <div className="space-y-2">
                <Label>Fecha entrega</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Notas internas..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Lines */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Líneas</CardTitle>
              <Button size="sm" variant="outline" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" />
                Añadir
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Artículo</TableHead>
                    <TableHead className="w-[60px]">Cant.</TableHead>
                    <TableHead className="w-[80px]">Precio</TableHead>
                    <TableHead className="w-[60px]">Dto.%</TableHead>
                    <TableHead className="w-[60px]">IVA%</TableHead>
                    <TableHead className="w-[90px] text-right">Total</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Añade líneas al documento
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={line.item_id || ''} onValueChange={(v) => selectItem(idx, v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Buscar artículo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.code} - {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={line.qty} 
                            onChange={(e) => updateLine(idx, 'qty', parseFloat(e.target.value) || 0)}
                            className="h-8 w-16 text-xs"
                            min={0}
                            step={1}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={line.unit_price} 
                            onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="h-8 w-20 text-xs"
                            min={0}
                            step={0.01}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={line.discount_percent} 
                            onChange={(e) => updateLine(idx, 'discount_percent', parseFloat(e.target.value) || 0)}
                            className="h-8 w-14 text-xs"
                            min={0}
                            max={100}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={line.tax_rate} 
                            onChange={(e) => updateLine(idx, 'tax_rate', parseFloat(e.target.value) || 0)}
                            className="h-8 w-14 text-xs"
                            min={0}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(line.line_total)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => removeLine(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Totals */}
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div className="w-[250px] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base imponible</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA</span>
                  <span>{formatCurrency(taxTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="secondary" onClick={() => handleSave('draft')} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar borrador
        </Button>
        <Button onClick={() => handleSave('confirmed')} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Confirmar
        </Button>
      </div>

      {/* Credit Override Dialog */}
      <AlertDialog open={showCreditWarning} onOpenChange={setShowCreditWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cliente con riesgo crediticio
            </AlertDialogTitle>
            <AlertDialogDescription>
              El cliente supera su límite de crédito o tiene deuda vencida.
              <br /><br />
              <strong>Deuda actual:</strong> {formatCurrency(creditCheck?.current_debt || 0)}<br />
              <strong>Deuda vencida:</strong> {formatCurrency(creditCheck?.overdue_debt || 0)}<br />
              <strong>Límite de crédito:</strong> {formatCurrency(creditCheck?.credit_limit || 0)}
              <br /><br />
              ¿Deseas continuar de todos modos? Esta acción quedará registrada en auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                setShowCreditWarning(false);
                saveDocument('confirmed');
              }}
            >
              Continuar con Override
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SalesDocumentEditor;
