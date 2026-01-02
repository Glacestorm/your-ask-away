/**
 * Dialog para crear Albaranes de Entrada
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, Package } from 'lucide-react';
import { useERPPurchases, PurchaseOrder, Supplier, GoodsReceiptLine } from '@/hooks/erp/useERPPurchases';
import { useERPInventory } from '@/hooks/erp/useERPInventory';
import { useMaestros } from '@/hooks/erp/useMaestros';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface GoodsReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromOrder?: PurchaseOrder | null;
  onSuccess?: () => void;
}

interface LineItem {
  order_line_id?: string;
  item_id: string;
  item_code: string;
  description: string;
  quantity: number;
  location_id?: string;
  lot_number?: string;
}

export function GoodsReceiptDialog({ open, onOpenChange, fromOrder, onSuccess }: GoodsReceiptDialogProps) {
  const { fetchSuppliers, fetchPurchaseOrders, createGoodsReceipt, isLoading } = useERPPurchases();
  const { fetchWarehouses } = useERPInventory();
  const { items } = useMaestros();
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  
  const [supplierId, setSupplierId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptDate, setReceiptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
      if (fromOrder) {
        setSupplierId(fromOrder.supplier_id || '');
        setOrderId(fromOrder.id);
        if (fromOrder.lines) {
          setLines(fromOrder.lines.map(l => ({
            order_line_id: l.id,
            item_id: l.item_id || '',
            item_code: l.item_code || '',
            description: l.description || '',
            quantity: l.quantity - l.received_qty,
          })));
        }
      } else {
        resetForm();
      }
    }
  }, [open, fromOrder]);

  const loadData = async () => {
    const [s, o, w] = await Promise.all([
      fetchSuppliers({ isActive: true }),
      fetchPurchaseOrders({ status: 'confirmed' }),
      fetchWarehouses({ isActive: true }),
    ]);
    setSuppliers(s);
    setOrders(o);
    setWarehouses(w);
    
    // Seleccionar almacén por defecto
    const defaultWh = w.find(wh => wh.is_default);
    if (defaultWh) setWarehouseId(defaultWh.id);
  };

  const resetForm = () => {
    setSupplierId('');
    setOrderId('');
    setReceiptDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setLines([]);
  };

  const loadOrderLines = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSupplierId(order.supplier_id || '');
      // Aquí cargaríamos las líneas del pedido si las tuviéramos
    }
  };

  const addLine = () => {
    setLines([...lines, {
      item_id: '',
      item_code: '',
      description: '',
      quantity: 1,
    }]);
  };

  const updateLine = (index: number, field: keyof LineItem, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
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
      };
      setLines(newLines);
    }
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (!warehouseId) {
      toast.error('Selecciona un almacén');
      return;
    }
    if (lines.length === 0) {
      toast.error('Añade al menos una línea');
      return;
    }

    const receiptData = {
      supplier_id: supplierId,
      purchase_order_id: orderId || undefined,
      warehouse_id: warehouseId,
      receipt_date: receiptDate,
      status: 'draft' as const,
      notes: notes || undefined,
    };

    const linesData = lines.map((l, idx) => ({
      line_number: idx + 1,
      order_line_id: l.order_line_id,
      item_id: l.item_id || undefined,
      item_code: l.item_code,
      description: l.description,
      quantity: l.quantity,
      location_id: l.location_id,
      lot_number: l.lot_number,
    }));

    const result = await createGoodsReceipt(receiptData, linesData);
    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nuevo Albarán de Entrada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabecera */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
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
              <Label>Pedido de Compra</Label>
              <Select 
                value={orderId || "_none_"} 
                onValueChange={v => { 
                  const val = v === "_none_" ? "" : v;
                  setOrderId(val); 
                  if (val) loadOrderLines(val); 
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional - vincular pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Sin pedido</SelectItem>
                  {orders.filter(o => !supplierId || o.supplier_id === supplierId).map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.document_number} - {o.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Almacén *</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona almacén" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Recepción</Label>
              <Input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
            </div>
          </div>

          {/* Líneas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Artículos Recibidos</Label>
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
                    <TableHead className="w-[100px]">Cantidad</TableHead>
                    <TableHead className="w-[120px]">Lote</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                              {items?.filter(i => i.is_stocked).map(item => (
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
                            className="h-8"
                            value={line.lot_number || ''}
                            onChange={e => updateLine(idx, 'lot_number', e.target.value)}
                            placeholder="Opcional"
                          />
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

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones sobre la recepción..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Albarán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GoodsReceiptDialog;
