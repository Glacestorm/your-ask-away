/**
 * Dialog para crear Transferencias de Stock
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { useERPInventory } from '@/hooks/erp/useERPInventory';
import { useMaestros } from '@/hooks/erp/useMaestros';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StockTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface TransferLine {
  item_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
}

export function StockTransferDialog({ open, onOpenChange, onSuccess }: StockTransferDialogProps) {
  const { fetchWarehouses, createTransfer, isLoading } = useERPInventory();
  const { items } = useMaestros();
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferDate, setTransferDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<TransferLine[]>([]);

  useEffect(() => {
    if (open) {
      loadWarehouses();
      resetForm();
    }
  }, [open]);

  const loadWarehouses = async () => {
    const data = await fetchWarehouses({ isActive: true });
    setWarehouses(data);
  };

  const resetForm = () => {
    setFromWarehouseId('');
    setToWarehouseId('');
    setTransferDate(format(new Date(), 'yyyy-MM-dd'));
    setNotes('');
    setLines([]);
  };

  const addLine = () => {
    setLines([...lines, {
      item_id: '',
      item_code: '',
      item_name: '',
      quantity: 1,
    }]);
  };

  const updateLine = (index: number, field: keyof TransferLine, value: string | number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const selectItem = (index: number, itemId: string) => {
    const item = itemsQuery.data?.find(i => i.id === itemId);
    if (item) {
      const newLines = [...lines];
      newLines[index] = {
        ...newLines[index],
        item_id: item.id,
        item_code: item.sku,
        item_name: item.name,
      };
      setLines(newLines);
    }
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!fromWarehouseId) {
      toast.error('Selecciona el almacén de origen');
      return;
    }
    if (!toWarehouseId) {
      toast.error('Selecciona el almacén de destino');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error('Los almacenes de origen y destino deben ser diferentes');
      return;
    }
    if (lines.length === 0) {
      toast.error('Añade al menos una línea');
      return;
    }

    const transferData = {
      from_warehouse_id: fromWarehouseId,
      to_warehouse_id: toWarehouseId,
      transfer_date: transferDate,
      status: 'draft' as const,
      notes: notes || undefined,
    };

    const linesData = lines.map(l => ({
      item_id: l.item_id,
      quantity: l.quantity,
      received_qty: 0,
    }));

    const result = await createTransfer(transferData, linesData);
    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Transferencia de Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Almacenes */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label>Almacén Origen *</Label>
              <Select value={fromWarehouseId} onValueChange={setFromWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona origen" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === toWarehouseId}>
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />

            <div className="flex-1 space-y-2">
              <Label>Almacén Destino *</Label>
              <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona destino" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>
                      {w.code} - {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha */}
          <div className="w-48 space-y-2">
            <Label>Fecha de Transferencia</Label>
            <Input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} />
          </div>

          {/* Líneas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Artículos a Transferir</Label>
              <Button variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Añadir Línea
              </Button>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Artículo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[120px]">Cantidad</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay artículos. Haz clic en "Añadir Línea"
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={line.item_id} onValueChange={v => selectItem(idx, v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Selecciona artículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {itemsQuery.data?.filter(i => i.is_stocked).map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.sku} - {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {line.item_name || '-'}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8"
                            value={line.quantity}
                            onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            min={0.01}
                            step={0.01}
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
              placeholder="Observaciones sobre la transferencia..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Transferencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StockTransferDialog;
