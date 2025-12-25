import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  Globe, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  Star,
  TrendingUp,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Local interface matching the DB schema
interface PartnerRow {
  id: string;
  company_name: string;
  legal_name: string | null;
  tax_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  status: string;
  approved_by: string | null;
  revenue_share_percent: number | null;
  contract_signed_at: string | null;
  contract_expires_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export function PartnerManagementPanel() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<PartnerRow | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [newPartner, setNewPartner] = useState({
    company_name: '',
    legal_name: '',
    tax_id: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    description: '',
  });

  // Fetch partners
  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin-partners', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('partner_companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PartnerRow[];
    },
  });

  // Update partner status mutation
  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('partner_companies')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-admin-stats'] });
      toast.success('Partner actualizado correctamente');
      setIsDetailOpen(false);
    },
    onError: () => {
      toast.error('Error al actualizar partner');
    },
  });

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: async (partnerData: typeof newPartner) => {
      const { data, error } = await supabase
        .from('partner_companies')
        .insert({
          company_name: partnerData.company_name,
          legal_name: partnerData.legal_name || null,
          tax_id: partnerData.tax_id || null,
          contact_email: partnerData.contact_email || null,
          contact_phone: partnerData.contact_phone || null,
          website: partnerData.website || null,
          description: partnerData.description || null,
          status: 'active', // Create as active since admin is adding
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-admin-stats'] });
      toast.success('Partner creado correctamente');
      setIsCreateOpen(false);
      setNewPartner({
        company_name: '',
        legal_name: '',
        tax_id: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        description: '',
      });
    },
    onError: (error) => {
      toast.error('Error al crear partner: ' + (error as Error).message);
    },
  });

  // Filter partners by search term
  const filteredPartners = partners?.filter(partner => {
    const searchLower = searchTerm.toLowerCase();
    return (
      partner.company_name.toLowerCase().includes(searchLower) ||
      partner.contact_email?.toLowerCase().includes(searchLower) ||
      partner.website?.toLowerCase().includes(searchLower)
    );
  });

  // Separate partners by status
  const pendingPartners = filteredPartners?.filter(p => p.status === 'pending') || [];
  const activePartners = filteredPartners?.filter(p => p.status === 'active') || [];
  const rejectedPartners = filteredPartners?.filter(p => p.status === 'rejected' || p.status === 'suspended') || [];

  const handleApprove = (partner: PartnerRow) => {
    updatePartnerMutation.mutate({ id: partner.id, status: 'active' });
  };

  const handleReject = (partner: PartnerRow) => {
    updatePartnerMutation.mutate({ id: partner.id, status: 'rejected' });
  };

  const handleSuspend = (partner: PartnerRow) => {
    updatePartnerMutation.mutate({ id: partner.id, status: 'suspended' });
  };

  const handleReactivate = (partner: PartnerRow) => {
    updatePartnerMutation.mutate({ id: partner.id, status: 'active' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Activo</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendiente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rechazado</Badge>;
      case 'suspended':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Suspendido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const PartnerCard = ({ partner }: { partner: PartnerRow }) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              {partner.logo_url ? (
                <img src={partner.logo_url} alt={partner.company_name} className="h-8 w-8 rounded object-contain" />
              ) : (
                <Building2 className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold truncate">{partner.company_name}</h4>
                {getStatusBadge(partner.status)}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {partner.description || 'Sin descripción'}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                {partner.contact_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {partner.contact_email}
                  </span>
                )}
                {partner.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {partner.website}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(partner.created_at), { addSuffix: true, locale: es })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedPartner(partner);
                setIsDetailOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {partner.status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  onClick={() => handleApprove(partner)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => handleReject(partner)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {partner.status === 'active' && (
              <Button
                variant="ghost"
                size="icon"
                className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                onClick={() => handleSuspend(partner)}
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            )}
            {(partner.status === 'suspended' || partner.status === 'rejected') && (
              <Button
                variant="ghost"
                size="icon"
                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                onClick={() => handleReactivate(partner)}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search, Filters, and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar partners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Partner
        </Button>
      </div>

      {/* Tabs for different statuses */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendientes
            {pendingPartners.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                {pendingPartners.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Activos
            <Badge variant="secondary" className="ml-1">{activePartners.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="inactive" className="gap-2">
            <XCircle className="h-4 w-4" />
            Inactivos
            <Badge variant="secondary" className="ml-1">{rejectedPartners.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : pendingPartners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-semibold text-lg">No hay solicitudes pendientes</h3>
                <p className="text-muted-foreground">Todas las solicitudes han sido procesadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingPartners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : activePartners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No hay partners activos</h3>
                <p className="text-muted-foreground">Aprueba solicitudes pendientes para ver partners aquí</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activePartners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : rejectedPartners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-semibold text-lg">No hay partners inactivos</h3>
                <p className="text-muted-foreground">Todos los partners están activos o pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rejectedPartners.map(partner => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Partner Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedPartner?.logo_url ? (
                <img src={selectedPartner.logo_url} alt={selectedPartner.company_name} className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <Building2 className="h-10 w-10" />
              )}
              {selectedPartner?.company_name}
            </DialogTitle>
            <DialogDescription>
              Detalles y gestión del partner
            </DialogDescription>
          </DialogHeader>

          {selectedPartner && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Status */}
                <div>
                  <Label className="text-xs text-muted-foreground">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedPartner.status)}</div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs text-muted-foreground">Descripción</Label>
                  <p className="mt-1 text-sm">{selectedPartner.description || 'Sin descripción'}</p>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email de Contacto
                    </Label>
                    <p className="mt-1 text-sm">{selectedPartner.contact_email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Teléfono
                    </Label>
                    <p className="mt-1 text-sm">{selectedPartner.contact_phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Website
                    </Label>
                    {selectedPartner.website ? (
                      <a 
                        href={selectedPartner.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-1 text-sm text-primary hover:underline block"
                      >
                        {selectedPartner.website}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm">-</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Fecha de Registro
                    </Label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedPartner.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Legal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nombre Legal</Label>
                    <p className="mt-1 text-sm">{selectedPartner.legal_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CIF/NIF</Label>
                    <p className="mt-1 text-sm">{selectedPartner.tax_id || '-'}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="gap-2">
            {selectedPartner?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => selectedPartner && handleReject(selectedPartner)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => selectedPartner && handleApprove(selectedPartner)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
              </>
            )}
            {selectedPartner?.status === 'active' && (
              <Button
                variant="destructive"
                onClick={() => selectedPartner && handleSuspend(selectedPartner)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Suspender
              </Button>
            )}
            {(selectedPartner?.status === 'suspended' || selectedPartner?.status === 'rejected') && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => selectedPartner && handleReactivate(selectedPartner)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Reactivar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Partner Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Partner
            </DialogTitle>
            <DialogDescription>
              Crear un nuevo partner manualmente. Se creará con estado activo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="company_name">Nombre de la Empresa *</Label>
              <Input
                id="company_name"
                value={newPartner.company_name}
                onChange={(e) => setNewPartner(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Nombre comercial"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legal_name">Nombre Legal</Label>
                <Input
                  id="legal_name"
                  value={newPartner.legal_name}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, legal_name: e.target.value }))}
                  placeholder="Razón social"
                />
              </div>
              <div>
                <Label htmlFor="tax_id">CIF/NIF</Label>
                <Input
                  id="tax_id"
                  value={newPartner.tax_id}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, tax_id: e.target.value }))}
                  placeholder="B12345678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Email de Contacto</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={newPartner.contact_email}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Teléfono</Label>
                <Input
                  id="contact_phone"
                  value={newPartner.contact_phone}
                  onChange={(e) => setNewPartner(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={newPartner.website}
                onChange={(e) => setNewPartner(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.empresa.com"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newPartner.description}
                onChange={(e) => setNewPartner(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Breve descripción del partner..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createPartnerMutation.mutate(newPartner)}
              disabled={!newPartner.company_name || createPartnerMutation.isPending}
            >
              {createPartnerMutation.isPending ? 'Creando...' : 'Crear Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
