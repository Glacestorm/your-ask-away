import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Package, 
  Eye, 
  MessageSquare,
  Shield,
  Code,
  FileText,
  ExternalLink,
  AlertTriangle,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PartnerApplication } from '@/types/marketplace';

interface ReviewDialogProps {
  app: PartnerApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'approve' | 'reject', notes: string) => void;
  isPending: boolean;
}

function ReviewDialog({ app, isOpen, onClose, onAction, isPending }: ReviewDialogProps) {
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  if (!app) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>{app.app_name}</span>
              <Badge variant="outline" className="ml-2">v{app.version}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Revisión de aplicación para marketplace
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <FileText className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="technical">
              <Code className="h-4 w-4 mr-2" />
              Técnico
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="review">
              <MessageSquare className="h-4 w-4 mr-2" />
              Decisión
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoría</label>
                  <p className="font-medium capitalize">{app.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de precio</label>
                  <p className="font-medium capitalize">{app.price_type}</p>
                </div>
                {app.price_amount > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Precio</label>
                    <p className="font-medium">{app.price_currency}{app.price_amount}/{app.billing_period}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Enviado</label>
                  <p className="font-medium">
                    {format(new Date(app.submitted_at || app.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="mt-1">{app.description}</p>
              </div>

              {app.short_description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descripción corta</label>
                  <p className="mt-1">{app.short_description}</p>
                </div>
              )}

              {app.tags && app.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {app.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {app.screenshots && app.screenshots.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Screenshots</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {app.screenshots.map((url, idx) => (
                      <img key={idx} src={url} alt={`Screenshot ${idx + 1}`} className="rounded-lg border" />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">App Key</label>
                  <code className="block mt-1 p-2 bg-muted rounded text-sm">{app.app_key}</code>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Versión</label>
                  <p className="font-medium">{app.version}</p>
                </div>
              </div>

              {app.webhook_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Webhook URL</label>
                  <code className="block mt-1 p-2 bg-muted rounded text-sm break-all">{app.webhook_url}</code>
                </div>
              )}

              {app.documentation_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Documentación API</label>
                  <a 
                    href={app.documentation_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline mt-1"
                  >
                    Ver documentación <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {app.api_scopes && app.api_scopes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Permisos API (Scopes)</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {app.api_scopes.map((scope, idx) => (
                      <Badge key={idx} variant="outline">{scope}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {app.tags && app.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {app.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Checklist de seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Verificar que el webhook usa HTTPS
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Revisar permisos solicitados
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Validar manejo de datos sensibles
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Comprobar política de privacidad
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Política de privacidad</label>
                {app.privacy_policy_url ? (
                  <a 
                    href={app.privacy_policy_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline mt-1"
                  >
                    Ver política <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-amber-500 mt-1">No proporcionada</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Términos de servicio</label>
                {app.terms_url ? (
                  <a 
                    href={app.terms_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline mt-1"
                  >
                    Ver términos <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-amber-500 mt-1">No proporcionados</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Notas de revisión</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade notas sobre tu decisión, feedback para el desarrollador..."
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  variant="default"
                  onClick={() => onAction('approve', notes)}
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Aprobar y publicar
                </Button>
                <Button 
                  className="flex-1" 
                  variant="destructive"
                  onClick={() => onAction('reject', notes)}
                  disabled={isPending || !notes.trim()}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar
                </Button>
              </div>
              {!notes.trim() && (
                <p className="text-xs text-muted-foreground text-center">
                  * Las notas son requeridas para rechazar una app
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppReviewPanel() {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('in_review');

  // Fetch apps pending review
  const { data: apps, isLoading } = useQuery({
    queryKey: ['admin-app-reviews', statusFilter],
    queryFn: async () => {
      const query = supabase
        .from('partner_applications')
        .select(`
          *,
          partner_company:partner_companies(company_name, partner_tier)
        `)
        .order('submitted_at', { ascending: true });

      if (statusFilter !== 'all') {
        query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (PartnerApplication & { partner_company: { company_name: string; partner_tier: string } })[];
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ appId, action, notes }: { appId: string; action: 'approve' | 'reject'; notes: string }) => {
      const newStatus = action === 'approve' ? 'published' : 'rejected';
      const { error } = await supabase
        .from('partner_applications')
        .update({
          status: newStatus,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
          published_at: action === 'approve' ? new Date().toISOString() : null,
        })
        .eq('id', appId);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-app-reviews'] });
      toast.success(action === 'approve' ? 'App aprobada y publicada' : 'App rechazada');
      setSelectedApp(null);
    },
    onError: () => {
      toast.error('Error al procesar la revisión');
    },
  });

  const handleAction = (action: 'approve' | 'reject', notes: string) => {
    if (selectedApp) {
      reviewMutation.mutate({ appId: selectedApp.id, action, notes });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'in_review': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'draft': return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
      default: return '';
    }
  };

  const pendingCount = apps?.filter(a => a.status === 'in_review').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revisión de Apps</h2>
          <p className="text-muted-foreground">
            Gestiona las solicitudes de publicación en el marketplace
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingCount} pendientes
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['in_review', 'published', 'rejected', 'all'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'in_review' && <Clock className="h-4 w-4 mr-1" />}
            {status === 'published' && <CheckCircle2 className="h-4 w-4 mr-1" />}
            {status === 'rejected' && <XCircle className="h-4 w-4 mr-1" />}
            {status === 'in_review' ? 'Pendientes' :
             status === 'published' ? 'Aprobadas' :
             status === 'rejected' ? 'Rechazadas' : 'Todas'}
          </Button>
        ))}
      </div>

      {/* Apps List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : apps && apps.length > 0 ? (
        <div className="grid gap-4">
          {apps.map((app) => (
            <Card key={app.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      {app.icon_url ? (
                        <img src={app.icon_url} alt="" className="h-10 w-10 rounded-lg" />
                      ) : (
                        <Package className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{app.app_name}</h3>
                        <Badge variant="outline">v{app.version}</Badge>
                        <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {app.short_description || app.description?.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Partner: {app.partner_company?.company_name}</span>
                        <span>•</span>
                        <span>Categoría: {app.category}</span>
                        <span>•</span>
                        <span>
                          Enviado: {format(new Date(app.submitted_at || app.created_at), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedApp(app)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Revisar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No hay apps pendientes</h3>
            <p className="text-muted-foreground">
              Todas las solicitudes han sido procesadas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        app={selectedApp}
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        onAction={handleAction}
        isPending={reviewMutation.isPending}
      />
    </div>
  );
}

export default AppReviewPanel;
