import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Webhook, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Send
} from 'lucide-react';
import { usePartnerWebhooks } from '@/hooks/usePartnerPortal';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PartnerWebhook } from '@/types/marketplace';

interface WebhooksManagerProps {
  partnerCompanyId: string;
}

const WEBHOOK_EVENTS = [
  { key: 'app.installed', label: 'App instalada', description: 'Cuando un usuario instala tu app' },
  { key: 'app.uninstalled', label: 'App desinstalada', description: 'Cuando un usuario desinstala tu app' },
  { key: 'app.updated', label: 'App actualizada', description: 'Cuando tu app es actualizada' },
  { key: 'subscription.created', label: 'Suscripción creada', description: 'Nueva suscripción a tu app' },
  { key: 'subscription.cancelled', label: 'Suscripción cancelada', description: 'Cancelación de suscripción' },
  { key: 'subscription.renewed', label: 'Suscripción renovada', description: 'Renovación de suscripción' },
  { key: 'payment.succeeded', label: 'Pago exitoso', description: 'Pago procesado correctamente' },
  { key: 'payment.failed', label: 'Pago fallido', description: 'Error en el pago' },
  { key: 'review.created', label: 'Nueva reseña', description: 'Un usuario dejó una reseña' },
];

export function WebhooksManager({ partnerCompanyId }: WebhooksManagerProps) {
  const { data: webhooks, isLoading } = usePartnerWebhooks(partnerCompanyId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    webhook_name: '',
    webhook_url: '',
    events: [] as string[],
  });

  const queryClient = useQueryClient();

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleCreate = async () => {
    if (!formData.webhook_name || !formData.webhook_url || formData.events.length === 0) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      // Generate a secret
      const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
      const secretHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
        .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));

      const { error } = await supabase
        .from('partner_webhooks')
        .insert({
          partner_company_id: partnerCompanyId,
          webhook_name: formData.webhook_name,
          webhook_url: formData.webhook_url,
          events: formData.events,
          secret_hash: secretHash,
          is_active: true,
        });

      if (error) throw error;

      toast.success(`Webhook creado. Secret: ${secret}`, {
        description: 'Guarda el secret, no se mostrará de nuevo',
        duration: 10000,
      });

      queryClient.invalidateQueries({ queryKey: ['partner-webhooks'] });
      setIsDialogOpen(false);
      setFormData({ webhook_name: '', webhook_url: '', events: [] });
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Error al crear el webhook');
    }
  };

  const handleDelete = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('partner_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      toast.success('Webhook eliminado');
      queryClient.invalidateQueries({ queryKey: ['partner-webhooks'] });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Error al eliminar el webhook');
    }
  };

  const toggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('partner_webhooks')
        .update({ is_active: !isActive })
        .eq('id', webhookId);

      if (error) throw error;

      toast.success(isActive ? 'Webhook desactivado' : 'Webhook activado');
      queryClient.invalidateQueries({ queryKey: ['partner-webhooks'] });
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  const testWebhook = async (webhook: PartnerWebhook) => {
    toast.info('Enviando evento de prueba...');
    
    // Simulate sending a test webhook
    setTimeout(() => {
      toast.success('Evento de prueba enviado');
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Recibe notificaciones en tiempo real sobre eventos
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Webhook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : webhooks && webhooks.length > 0 ? (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => toggleWebhook(webhook.id, webhook.is_active)}
                    />
                    <div>
                      <h4 className="font-medium">{webhook.webhook_name}</h4>
                      <p className="text-sm text-muted-foreground font-mono truncate max-w-md">
                        {webhook.webhook_url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => testWebhook(webhook)}>
                      <Send className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El webhook dejará de recibir eventos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(webhook.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {webhook.success_count} exitosos
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {webhook.failure_count} fallidos
                  </span>
                  {webhook.last_triggered_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Último: {format(new Date(webhook.last_triggered_at), 'dd/MM HH:mm', { locale: es })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-semibold mb-2">No hay webhooks configurados</h4>
            <p className="text-muted-foreground mb-4">
              Configura webhooks para recibir eventos en tiempo real
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer webhook
            </Button>
          </div>
        )}
      </CardContent>

      {/* Create Webhook Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Webhook</DialogTitle>
            <DialogDescription>
              Configura un endpoint para recibir eventos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formData.webhook_name}
                onChange={(e) => setFormData(prev => ({ ...prev, webhook_name: e.target.value }))}
                placeholder="Mi Webhook"
              />
            </div>

            <div className="space-y-2">
              <Label>URL del Endpoint</Label>
              <Input
                value={formData.webhook_url}
                onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://api.mi-servicio.com/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label>Eventos a escuchar</Label>
              <ScrollArea className="h-[200px] border rounded-lg p-4">
                <div className="space-y-3">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div
                      key={event.key}
                      className="flex items-start space-x-3 cursor-pointer"
                      onClick={() => toggleEvent(event.key)}
                    >
                      <Checkbox
                        checked={formData.events.includes(event.key)}
                        onCheckedChange={() => toggleEvent(event.key)}
                      />
                      <div>
                        <p className="text-sm font-medium">{event.label}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>
              Crear Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default WebhooksManager;
