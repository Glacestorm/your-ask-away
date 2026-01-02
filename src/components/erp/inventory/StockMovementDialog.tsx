/**
 * Dialog para registrar Movimientos de Stock
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowDown, ArrowUp, ArrowLeftRight, Settings } from 'lucide-react';
import { useERPInventory } from '@/hooks/erp/useERPInventory';
import { useMaestros } from '@/hooks/erp/useMaestros';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type MovementType = 'in' | 'out' | 'adjustment';

const movementTypes = [
  { value: 'in', label: 'Entrada', icon: ArrowDown, color: 'text-green-600' },
  { value: 'out', label: 'Salida', icon: ArrowUp, color: 'text-red-600' },
  { value: 'adjustment', label: 'Ajuste', icon: Settings, color: 'text-yellow-600' },
];

export function StockMovementDialog({ open, onOpenChange, onSuccess }: StockMovementDialogProps) {
  const { fetchWarehouses, createMovement, isLoading } = useERPInventory();
  const { items } = useMaestros();
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [movementType, setMovementType] = useState<MovementType>('in');
  const [warehouseId, setWarehouseId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [movementDate, setMovementDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [referenceType, setReferenceType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      loadWarehouses();
      resetForm();
    }
  }, [open]);

  const loadWarehouses = async () => {
    const data = await fetchWarehouses({ isActive: true });
    setWarehouses(data);
    const defaultWh = data.find(w => w.is_default);
    if (defaultWh) setWarehouseId(defaultWh.id);
  };

  const resetForm = () => {
    setMovementType('in');
    setItemId('');
    setQuantity(1);
    setUnitCost(0);
    setMovementDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setReferenceType('');
    setNotes('');
  };

  const handleItemChange = (id: string) => {
    setItemId(id);
    const item = items?.find(i => i.id === id);
    if (item) {
      setUnitCost(item.standard_cost || 0);
    }
  };

  const handleSubmit = async () => {
    if (!warehouseId) {
      toast.error('Selecciona un almacén');
      return;
    }
    if (!itemId) {
      toast.error('Selecciona un artículo');
      return;
    }
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor que 0');
      return;
    }

    const result = await createMovement({
      warehouse_id: warehouseId,
      item_id: itemId,
      movement_type: movementType,
      quantity,
      unit_cost: unitCost,
      movement_date: new Date(movementDate).toISOString(),
      reference_type: referenceType || undefined,
      notes: notes || undefined,
    });

    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento de Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de movimiento */}
          <div className="space-y-2">
            <Label>Tipo de Movimiento *</Label>
            <div className="grid grid-cols-3 gap-2">
              {movementTypes.map(type => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={movementType === type.value ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                    onClick={() => setMovementType(type.value as MovementType)}
                  >
                    <Icon className={`h-4 w-4 ${movementType !== type.value ? type.color : ''}`} />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Almacén */}
          <div className="space-y-2">
            <Label>Almacén *</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona almacén" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.code} - {w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Artículo */}
          <div className="space-y-2">
            <Label>Artículo *</Label>
            <Select value={itemId} onValueChange={handleItemChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona artículo" />
              </SelectTrigger>
              <SelectContent>
                {items?.filter(i => i.is_stocked).map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.sku} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad y Coste */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                min={0.0001}
                step={0.01}
              />
            </div>
            <div className="space-y-2">
              <Label>Coste Unitario</Label>
              <Input
                type="number"
                value={unitCost}
                onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
              />
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha y Hora</Label>
            <Input
              type="datetime-local"
              value={movementDate}
              onChange={e => setMovementDate(e.target.value)}
            />
          </div>

          {/* Referencia */}
          <div className="space-y-2">
            <Label>Tipo de Referencia</Label>
            <Select value={referenceType} onValueChange={setReferenceType}>
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin referencia</SelectItem>
                <SelectItem value="purchase_order">Pedido de compra</SelectItem>
                <SelectItem value="goods_receipt">Albarán de entrada</SelectItem>
                <SelectItem value="sales_order">Pedido de venta</SelectItem>
                <SelectItem value="delivery_note">Albarán de salida</SelectItem>
                <SelectItem value="production">Producción</SelectItem>
                <SelectItem value="inventory_count">Inventario</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones del movimiento..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Movimiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StockMovementDialog;
