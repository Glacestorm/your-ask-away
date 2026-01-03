import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TradePartner } from '@/hooks/erp/useERPTradePartners';
import { 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard,
  Calendar,
  TrendingUp,
  Edit,
  Save,
  X,
  Loader2,
  Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PartnerDetailViewProps {
  partner: TradePartner;
  onUpdate: (data: Partial<TradePartner>) => Promise<void>;
  onClose: () => void;
}

export function PartnerDetailView({ partner, onUpdate, onClose }: PartnerDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    legal_name: partner.legal_name,
    trade_name: partner.trade_name || '',
    tax_id: partner.tax_id || '',
    is_active: partner.is_active ?? true,
    country: partner.country || 'ES',
    address: partner.address || '',
    city: partner.city || '',
    postal_code: partner.postal_code || '',
    phone: partner.phone || '',
    email: partner.email || '',
    credit_limit: partner.credit_limit?.toString() || '',
    payment_terms_days: partner.payment_terms_days?.toString() || '30',
    default_currency: partner.default_currency || 'EUR'
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await onUpdate({
        legal_name: editData.legal_name,
        trade_name: editData.trade_name || null,
        tax_id: editData.tax_id || null,
        is_active: editData.is_active,
        country: editData.country,
        address: editData.address || null,
        city: editData.city || null,
        postal_code: editData.postal_code || null,
        phone: editData.phone || null,
        email: editData.email || null,
        credit_limit: editData.credit_limit ? parseFloat(editData.credit_limit) : null,
        payment_terms_days: editData.payment_terms_days ? parseInt(editData.payment_terms_days) : 30,
        default_currency: editData.default_currency
      });
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (isActive: boolean | null) => {
    return isActive ? 'bg-green-500' : 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(partner.is_active)}`} />
          <Badge variant="outline">
            {partner.partner_type === 'customer' ? 'Cliente' : 
             partner.partner_type === 'supplier' ? 'Proveedor' : 'Cliente/Proveedor'}
          </Badge>
          {partner.tax_id && (
            <code className="text-xs bg-muted px-2 py-1 rounded">{partner.tax_id}</code>
          )}
          {partner.is_international && (
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              Internacional
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Razón Social</Label>
                <Input
                  value={editData.legal_name}
                  onChange={(e) => setEditData({ ...editData, legal_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Nombre Comercial</Label>
                <Input
                  value={editData.trade_name}
                  onChange={(e) => setEditData({ ...editData, trade_name: e.target.value })}
                />
              </div>
              <div>
                <Label>NIF/CIF</Label>
                <Input
                  value={editData.tax_id}
                  onChange={(e) => setEditData({ ...editData, tax_id: e.target.value })}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Select 
                  value={editData.is_active ? 'active' : 'inactive'} 
                  onValueChange={(v) => setEditData({ ...editData, is_active: v === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>País</Label>
                <Select value={editData.country} onValueChange={(v) => setEditData({ ...editData, country: v })}>
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
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ciudad</Label>
                <Input
                  value={editData.city}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Dirección</Label>
                <Input
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>{partner.address || 'Sin dirección'}</p>
                  <p>{partner.postal_code} {partner.city}</p>
                  <p className="font-medium">{partner.country || 'ES'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {partner.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {partner.phone}
                    </p>
                  )}
                  {partner.email && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {partner.email}
                    </p>
                  )}
                  {partner.website && (
                    <p className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {partner.website}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Límite de Crédito</Label>
                <Input
                  type="number"
                  value={editData.credit_limit}
                  onChange={(e) => setEditData({ ...editData, credit_limit: e.target.value })}
                />
              </div>
              <div>
                <Label>Divisa</Label>
                <Select value={editData.default_currency} onValueChange={(v) => setEditData({ ...editData, default_currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plazo de Pago (días)</Label>
                <Select value={editData.payment_terms_days} onValueChange={(v) => setEditData({ ...editData, payment_terms_days: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Contado</SelectItem>
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Límite de Crédito
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {partner.credit_limit 
                      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: partner.default_currency || 'EUR' }).format(partner.credit_limit)
                      : 'Sin límite'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Plazo de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{partner.payment_terms_days || 30} días</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Divisa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{partner.default_currency || 'EUR'}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Historial de Actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">
                    Creado el {partner.created_at ? format(new Date(partner.created_at), "d 'de' MMMM, yyyy", { locale: es }) : '-'}
                  </span>
                </div>
                {partner.updated_at && partner.updated_at !== partner.created_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">
                      Última actualización: {format(new Date(partner.updated_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                    </span>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground text-center py-4">
                El historial detallado de operaciones estará disponible próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
