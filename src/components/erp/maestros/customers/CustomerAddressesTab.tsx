/**
 * Tab de Direcciones del Cliente
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, MapPin, Trash2, Check } from 'lucide-react';
import { CustomerAddress } from '@/hooks/erp/useMaestros';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomerAddressesTabProps {
  customerId: string;
  addresses: CustomerAddress[];
  onRefresh: () => void;
}

interface AddressFormData {
  address_type: 'billing' | 'shipping';
  line1: string;
  line2: string;
  city: string;
  postal_code: string;
  region: string;
  country: string;
  is_default: boolean;
}

const emptyAddress: AddressFormData = {
  address_type: 'billing',
  line1: '',
  line2: '',
  city: '',
  postal_code: '',
  region: '',
  country: 'ES',
  is_default: false
};

export const CustomerAddressesTab: React.FC<CustomerAddressesTabProps> = ({
  customerId,
  addresses,
  onRefresh
}) => {
  const [newAddress, setNewAddress] = useState<AddressFormData>(emptyAddress);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddAddress = async () => {
    if (!newAddress.line1) return;
    setIsAdding(true);
    
    try {
      const { error } = await supabase
        .from('customer_addresses')
        .insert([{ customer_id: customerId, ...newAddress }] as any);
      
      if (error) throw error;
      
      toast.success('Dirección añadida');
      onRefresh();
      setNewAddress(emptyAddress);
    } catch {
      toast.error('Error al añadir dirección');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId);
    
    if (!error) {
      toast.success('Dirección eliminada');
      onRefresh();
    } else {
      toast.error('Error al eliminar dirección');
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista de direcciones */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {addresses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-muted-foreground"
            >
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay direcciones registradas</p>
            </motion.div>
          ) : (
            addresses.map((addr, index) => (
              <motion.div 
                key={addr.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg flex items-start justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={addr.address_type === 'billing' ? 'default' : 'secondary'}>
                      {addr.address_type === 'billing' ? 'Facturación' : 'Envío'}
                    </Badge>
                    {addr.is_default && (
                      <Badge variant="outline" className="gap-1">
                        <Check className="h-3 w-3" /> Principal
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium">{addr.line1}</p>
                  {addr.line2 && <p className="text-sm text-muted-foreground">{addr.line2}</p>}
                  <p className="text-sm text-muted-foreground">
                    {[addr.postal_code, addr.city, addr.region, addr.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <Separator />

      {/* Formulario nueva dirección */}
      <div className="space-y-4">
        <h4 className="font-medium">Añadir Dirección</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select 
              value={newAddress.address_type} 
              onValueChange={(v) => setNewAddress({ ...newAddress, address_type: v as 'billing' | 'shipping' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billing">Facturación</SelectItem>
                <SelectItem value="shipping">Envío</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>País</Label>
            <Input
              value={newAddress.country}
              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value.toUpperCase() })}
              placeholder="ES"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Dirección *</Label>
          <Input
            value={newAddress.line1}
            onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
            placeholder="Calle Principal 123"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Input
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              placeholder="Madrid"
            />
          </div>
          <div className="space-y-2">
            <Label>CP</Label>
            <Input
              value={newAddress.postal_code}
              onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
              placeholder="28001"
            />
          </div>
          <div className="space-y-2">
            <Label>Provincia</Label>
            <Input
              value={newAddress.region}
              onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
              placeholder="Madrid"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={newAddress.is_default}
              onCheckedChange={(checked) => setNewAddress({ ...newAddress, is_default: checked })}
            />
            <Label>Dirección principal</Label>
          </div>
          <Button onClick={handleAddAddress} disabled={!newAddress.line1 || isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerAddressesTab;
