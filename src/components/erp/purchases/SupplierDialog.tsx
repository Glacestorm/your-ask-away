/**
 * Dialog para crear/editar Proveedores
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useERPPurchases, Supplier } from '@/hooks/erp/useERPPurchases';

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSupplier?: Supplier | null;
  onSuccess?: () => void;
}

export function SupplierDialog({ open, onOpenChange, editSupplier, onSuccess }: SupplierDialogProps) {
  const { createSupplier, isLoading } = useERPPurchases();
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    legal_name: '',
    tax_id: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'ES',
    phone: '',
    email: '',
    website: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    payment_terms: 30,
    currency: 'EUR',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      if (editSupplier) {
        setFormData({
          code: editSupplier.code || '',
          name: editSupplier.name,
          legal_name: editSupplier.legal_name || '',
          tax_id: editSupplier.tax_id || '',
          address: editSupplier.address || '',
          city: editSupplier.city || '',
          postal_code: editSupplier.postal_code || '',
          country: editSupplier.country,
          phone: editSupplier.phone || '',
          email: editSupplier.email || '',
          website: editSupplier.website || '',
          contact_name: editSupplier.contact_name || '',
          contact_phone: editSupplier.contact_phone || '',
          contact_email: editSupplier.contact_email || '',
          payment_terms: editSupplier.payment_terms,
          currency: editSupplier.currency,
          notes: editSupplier.notes || '',
          is_active: editSupplier.is_active,
        });
      } else {
        resetForm();
      }
    }
  }, [open, editSupplier]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      legal_name: '',
      tax_id: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'ES',
      phone: '',
      email: '',
      website: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      payment_terms: 30,
      currency: 'EUR',
      notes: '',
      is_active: true,
    });
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return;
    }

    const result = await createSupplier({
      ...formData,
      code: formData.code || undefined,
      legal_name: formData.legal_name || undefined,
      tax_id: formData.tax_id || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postal_code: formData.postal_code || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      website: formData.website || undefined,
      contact_name: formData.contact_name || undefined,
      contact_phone: formData.contact_phone || undefined,
      contact_email: formData.contact_email || undefined,
      notes: formData.notes || undefined,
    });

    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={formData.code}
                  onChange={e => handleChange('code', e.target.value)}
                  placeholder="Ej: PROV001"
                />
              </div>
              <div className="space-y-2">
                <Label>CIF/NIF</Label>
                <Input
                  value={formData.tax_id}
                  onChange={e => handleChange('tax_id', e.target.value)}
                  placeholder="Ej: B12345678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre comercial *</Label>
              <Input
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Nombre comercial"
              />
            </div>

            <div className="space-y-2">
              <Label>Razón social</Label>
              <Input
                value={formData.legal_name}
                onChange={e => handleChange('legal_name', e.target.value)}
                placeholder="Razón social completa"
              />
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

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={v => handleChange('is_active', v)}
              />
              <Label>Activo</Label>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sitio web</Label>
              <Input
                type="url"
                value={formData.website}
                onChange={e => handleChange('website', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-4">Persona de Contacto</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={e => handleChange('contact_name', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={e => handleChange('contact_phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={e => handleChange('contact_email', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="commercial" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plazo de pago (días)</Label>
                <Input
                  type="number"
                  value={formData.payment_terms}
                  onChange={e => handleChange('payment_terms', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Input
                  value={formData.currency}
                  onChange={e => handleChange('currency', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={e => handleChange('notes', e.target.value)}
                placeholder="Observaciones sobre el proveedor..."
                rows={4}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.name.trim()}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SupplierDialog;
