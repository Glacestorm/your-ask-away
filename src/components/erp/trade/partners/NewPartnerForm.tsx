import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TradePartner } from '@/hooks/erp/useERPTradePartners';
import { Loader2 } from 'lucide-react';

interface NewPartnerFormProps {
  onSubmit: (data: Partial<TradePartner>) => Promise<TradePartner | null>;
  onCancel: () => void;
}

export function NewPartnerForm({ onSubmit, onCancel }: NewPartnerFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    legal_name: '',
    trade_name: '',
    tax_id: '',
    partner_type: 'customer',
    country: 'ES',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    credit_limit: '',
    payment_terms_days: '30',
    default_currency: 'EUR',
    default_incoterm: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({
        legal_name: formData.legal_name,
        trade_name: formData.trade_name || null,
        tax_id: formData.tax_id || null,
        partner_type: formData.partner_type,
        country: formData.country,
        is_international: formData.country !== 'ES',
        is_active: true,
        address: formData.address || null,
        city: formData.city || null,
        postal_code: formData.postal_code || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
        payment_terms_days: formData.payment_terms_days ? parseInt(formData.payment_terms_days) : 30,
        default_currency: formData.default_currency,
        default_incoterm: formData.default_incoterm || null,
        notes: formData.notes || null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="legal_name">Razón Social *</Label>
          <Input
            id="legal_name"
            value={formData.legal_name}
            onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
            placeholder="Empresa S.L."
            required
          />
        </div>

        <div>
          <Label htmlFor="trade_name">Nombre Comercial</Label>
          <Input
            id="trade_name"
            value={formData.trade_name}
            onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
            placeholder="Nombre comercial"
          />
        </div>

        <div>
          <Label htmlFor="tax_id">NIF/CIF</Label>
          <Input
            id="tax_id"
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            placeholder="B12345678"
          />
        </div>

        <div>
          <Label htmlFor="partner_type">Tipo de Socio *</Label>
          <Select 
            value={formData.partner_type} 
            onValueChange={(v) => setFormData({ ...formData, partner_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="supplier">Proveedor</SelectItem>
              <SelectItem value="both">Cliente/Proveedor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="country">País</Label>
          <Select 
            value={formData.country} 
            onValueChange={(v) => setFormData({ ...formData, country: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ES">España</SelectItem>
              <SelectItem value="PT">Portugal</SelectItem>
              <SelectItem value="FR">Francia</SelectItem>
              <SelectItem value="DE">Alemania</SelectItem>
              <SelectItem value="IT">Italia</SelectItem>
              <SelectItem value="GB">Reino Unido</SelectItem>
              <SelectItem value="US">Estados Unidos</SelectItem>
              <SelectItem value="CN">China</SelectItem>
              <SelectItem value="OTHER">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Madrid"
          />
        </div>

        <div>
          <Label htmlFor="postal_code">Código Postal</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            placeholder="28001"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Calle Principal 123"
          />
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+34 912 345 678"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contacto@empresa.com"
          />
        </div>

        <div>
          <Label htmlFor="credit_limit">Límite de Crédito</Label>
          <Input
            id="credit_limit"
            type="number"
            value={formData.credit_limit}
            onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
            placeholder="50000"
          />
        </div>

        <div>
          <Label htmlFor="default_currency">Divisa</Label>
          <Select 
            value={formData.default_currency} 
            onValueChange={(v) => setFormData({ ...formData, default_currency: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="USD">USD - Dólar</SelectItem>
              <SelectItem value="GBP">GBP - Libra</SelectItem>
              <SelectItem value="CHF">CHF - Franco Suizo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="payment_terms_days">Plazo de Pago (días)</Label>
          <Select 
            value={formData.payment_terms_days} 
            onValueChange={(v) => setFormData({ ...formData, payment_terms_days: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Contado</SelectItem>
              <SelectItem value="15">15 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="45">45 días</SelectItem>
              <SelectItem value="60">60 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default_incoterm">Incoterm</Label>
          <Select 
            value={formData.default_incoterm} 
            onValueChange={(v) => setFormData({ ...formData, default_incoterm: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXW">EXW - Ex Works</SelectItem>
              <SelectItem value="FCA">FCA - Free Carrier</SelectItem>
              <SelectItem value="CPT">CPT - Carriage Paid To</SelectItem>
              <SelectItem value="CIP">CIP - Carriage Insurance Paid</SelectItem>
              <SelectItem value="DAP">DAP - Delivered at Place</SelectItem>
              <SelectItem value="DPU">DPU - Delivered at Place Unloaded</SelectItem>
              <SelectItem value="DDP">DDP - Delivered Duty Paid</SelectItem>
              <SelectItem value="FAS">FAS - Free Alongside Ship</SelectItem>
              <SelectItem value="FOB">FOB - Free on Board</SelectItem>
              <SelectItem value="CFR">CFR - Cost and Freight</SelectItem>
              <SelectItem value="CIF">CIF - Cost Insurance Freight</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.legal_name}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Socio
        </Button>
      </div>
    </form>
  );
}
