/**
 * Dialog para crear/editar Almacenes
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useERPInventory, Warehouse } from '@/hooks/erp/useERPInventory';

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editWarehouse?: Warehouse | null;
  onSuccess?: () => void;
}

export function WarehouseDialog({ open, onOpenChange, editWarehouse, onSuccess }: WarehouseDialogProps) {
  const { createWarehouse, isLoading } = useERPInventory();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'ES',
    is_default: false,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      if (editWarehouse) {
        setFormData({
          code: editWarehouse.code,
          name: editWarehouse.name,
          address: editWarehouse.address || '',
          city: editWarehouse.city || '',
          postal_code: editWarehouse.postal_code || '',
          country: editWarehouse.country,
          is_default: editWarehouse.is_default,
          is_active: editWarehouse.is_active,
        });
      } else {
        resetForm();
      }
    }
  }, [open, editWarehouse]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'ES',
      is_default: false,
      is_active: true,
    });
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      return;
    }

    const result = await createWarehouse({
      code: formData.code,
      name: formData.name,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postal_code: formData.postal_code || undefined,
      country: formData.country,
      is_default: formData.is_default,
      is_active: formData.is_active,
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
          <DialogTitle>{editWarehouse ? 'Editar Almacén' : 'Nuevo Almacén'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                value={formData.code}
                onChange={e => handleChange('code', e.target.value)}
                placeholder="Ej: ALM01"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Almacén Principal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={formData.address}
              onChange={e => handleChange('address', e.target.value)}
              placeholder="Calle, número..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Código Postal</Label>
              <Input
                value={formData.postal_code}
                onChange={e => handleChange('postal_code', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>País</Label>
              <Input
                value={formData.country}
                onChange={e => handleChange('country', e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_default}
                onCheckedChange={v => handleChange('is_default', v)}
              />
              <Label>Almacén por defecto</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={v => handleChange('is_active', v)}
              />
              <Label>Activo</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.code.trim() || !formData.name.trim()}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editWarehouse ? 'Guardar Cambios' : 'Crear Almacén'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WarehouseDialog;
