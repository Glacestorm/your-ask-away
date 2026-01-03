import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  Plus, 
  Search, 
  Globe, 
  MapPin,
  Mail,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useERPTradePartners, TradePartner } from '@/hooks/erp/useERPTradePartners';
import { NewPartnerForm } from './NewPartnerForm';
import { PartnerDetailView } from './PartnerDetailView';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function TradePartnersPanel() {
  const { partners, loading, createPartner, updatePartner } = useERPTradePartners();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<TradePartner | null>(null);

  const filteredPartners = partners.filter(p => 
    p.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.trade_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tax_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (isActive: boolean | null) => {
    if (isActive) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Activo
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Inactivo
      </Badge>
    );
  };

  const getPartnerTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      customer: 'Cliente',
      supplier: 'Proveedor',
      both: 'Cliente/Proveedor'
    };
    return (
      <Badge variant="outline">
        {labels[type] || type}
      </Badge>
    );
  };

  const stats = {
    total: partners.length,
    active: partners.filter(p => p.is_active).length,
    international: partners.filter(p => p.is_international).length,
    withCredit: partners.filter(p => (p.credit_limit || 0) > 0).length
  };

  const handleCreatePartner = async (data: Partial<TradePartner>) => {
    const result = await createPartner(data);
    if (result) {
      setShowNewForm(false);
    }
    return result;
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Socios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.international}</p>
                <p className="text-xs text-muted-foreground">Internacionales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.withCredit}</p>
                <p className="text-xs text-muted-foreground">Con Crédito</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Socios Comerciales
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar socio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Nuevo Socio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Nuevo Socio Comercial</DialogTitle>
                  </DialogHeader>
                  <NewPartnerForm 
                    onSubmit={handleCreatePartner}
                    onCancel={() => setShowNewForm(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Socio</TableHead>
                  <TableHead>NIF/CIF</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Límite Crédito</TableHead>
                  <TableHead>Última Actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron socios comerciales
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow 
                      key={partner.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-muted">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{partner.trade_name || partner.legal_name}</p>
                            {partner.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {partner.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {partner.tax_id || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {partner.country || 'ES'}
                        </div>
                      </TableCell>
                      <TableCell>{getPartnerTypeBadge(partner.partner_type)}</TableCell>
                      <TableCell>{getStatusBadge(partner.is_active)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {partner.credit_limit 
                          ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: partner.default_currency || 'EUR' }).format(partner.credit_limit)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {partner.updated_at 
                          ? formatDistanceToNow(new Date(partner.updated_at), { addSuffix: true, locale: es })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Partner Detail Dialog */}
      <Dialog open={!!selectedPartner} onOpenChange={(open) => !open && setSelectedPartner(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedPartner?.trade_name || selectedPartner?.legal_name}
            </DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <PartnerDetailView 
              partner={selectedPartner} 
              onUpdate={async (data) => {
                const result = await updatePartner(selectedPartner.id, data);
                if (result) {
                  setSelectedPartner(null);
                }
              }}
              onClose={() => setSelectedPartner(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
