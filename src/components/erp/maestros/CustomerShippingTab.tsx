/**
 * Pestaña de Logística/Envío para Clientes
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock,
  Save,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerShipping {
  customer_id: string;
  portes_mode: 'debidos' | 'pagados';
  free_shipping_threshold: number | null;
  preferred_carrier?: string | null;
  delivery_notes?: string | null;
  requires_appointment?: boolean;
  partial_delivery_allowed?: boolean;
  default_warehouse_id?: string | null;
}

interface CustomerShippingTabProps {
  customerId: string;
}

export const CustomerShippingTab: React.FC<CustomerShippingTabProps> = ({ 
  customerId 
}) => {
  const [shipping, setShipping] = useState<CustomerShipping | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  
  const [formData, setFormData] = useState({
    portes_mode: 'debidos' as 'debidos' | 'pagados',
    free_shipping_threshold: '',
    preferred_carrier: '',
    delivery_notes: '',
    requires_appointment: false,
    partial_delivery_allowed: true,
    default_warehouse_id: ''
  });

  useEffect(() => {
    loadShippingData();
    loadWarehouses();
  }, [customerId]);

  const loadWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setWarehouses(data);
      }
    } catch (err) {
      console.error('[CustomerShippingTab] Error loading warehouses:', err);
    }
  };

  const loadShippingData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_shipping')
        .select('*')
        .eq('customer_id', customerId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const shippingData = data as unknown as CustomerShipping;
        setShipping(shippingData);
        setFormData({
          portes_mode: shippingData.portes_mode || 'debidos',
          free_shipping_threshold: shippingData.free_shipping_threshold?.toString() || '',
          preferred_carrier: shippingData.preferred_carrier || '',
          delivery_notes: shippingData.delivery_notes || '',
          requires_appointment: shippingData.requires_appointment || false,
          partial_delivery_allowed: shippingData.partial_delivery_allowed ?? true,
          default_warehouse_id: shippingData.default_warehouse_id || ''
        });
      }
    } catch (err) {
      console.error('[CustomerShippingTab] Error loading shipping:', err);
      toast.error('Error al cargar datos de logística');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const shippingData = {
        customer_id: customerId,
        portes_mode: formData.portes_mode,
        free_shipping_threshold: formData.free_shipping_threshold 
          ? parseFloat(formData.free_shipping_threshold) 
          : null,
        preferred_carrier: formData.preferred_carrier || null,
        delivery_notes: formData.delivery_notes || null,
        requires_appointment: formData.requires_appointment,
        partial_delivery_allowed: formData.partial_delivery_allowed,
        default_warehouse_id: formData.default_warehouse_id || null
      };

      const { error } = await supabase
        .from('customer_shipping')
        .upsert(shippingData as any);
      
      if (error) throw error;
      
      toast.success('Configuración de logística guardada');
      loadShippingData();
    } catch (err) {
      console.error('[CustomerShippingTab] Error saving shipping:', err);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portes y Envío Gratuito */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Condiciones de Envío
          </CardTitle>
          <CardDescription>
            Configura cómo se gestionan los portes para este cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modo de Portes</Label>
            <Select 
              value={formData.portes_mode} 
              onValueChange={(v) => setFormData({ ...formData, portes_mode: v as 'debidos' | 'pagados' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debidos">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Debidos</Badge>
                    <span className="text-sm text-muted-foreground">Cliente paga portes</span>
                  </div>
                </SelectItem>
                <SelectItem value="pagados">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Pagados</Badge>
                    <span className="text-sm text-muted-foreground">Portes incluidos</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Umbral de Envío Gratuito</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.free_shipping_threshold}
                onChange={(e) => setFormData({ ...formData, free_shipping_threshold: e.target.value })}
                placeholder="Sin umbral"
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pedidos por encima de este importe tendrán portes gratuitos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preferencias de Entrega */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Preferencias de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Transportista Preferido</Label>
            <Input
              value={formData.preferred_carrier}
              onChange={(e) => setFormData({ ...formData, preferred_carrier: e.target.value })}
              placeholder="Ej: SEUR, MRW, DHL..."
            />
          </div>

          <div className="space-y-2">
            <Label>Almacén por Defecto</Label>
            <Select 
              value={formData.default_warehouse_id} 
              onValueChange={(v) => setFormData({ ...formData, default_warehouse_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin preferencia</SelectItem>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label>Requiere Cita Previa</Label>
                <p className="text-xs text-muted-foreground">
                  Coordinar horario antes de entregar
                </p>
              </div>
              <Switch
                checked={formData.requires_appointment}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_appointment: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <Label>Permite Entregas Parciales</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar productos disponibles sin esperar stock completo
                </p>
              </div>
              <Switch
                checked={formData.partial_delivery_allowed}
                onCheckedChange={(checked) => setFormData({ ...formData, partial_delivery_allowed: checked })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas de Entrega</Label>
            <Input
              value={formData.delivery_notes}
              onChange={(e) => setFormData({ ...formData, delivery_notes: e.target.value })}
              placeholder="Instrucciones especiales para entregas..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumen actual */}
      {shipping && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Configuración Actual</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Portes:</span>
                <Badge variant={shipping.portes_mode === 'pagados' ? 'default' : 'secondary'} className="ml-2">
                  {shipping.portes_mode === 'pagados' ? 'Incluidos' : 'A cargo del cliente'}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Envío gratis desde:</span>
                <span className="ml-2 font-mono">
                  {shipping.free_shipping_threshold 
                    ? `${shipping.free_shipping_threshold.toLocaleString('es-ES')} €` 
                    : 'No aplicable'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón guardar */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Guardando...' : 'Guardar Configuración de Logística'}
      </Button>
    </div>
  );
};

export default CustomerShippingTab;
