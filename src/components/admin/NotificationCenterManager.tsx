import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Bell, Webhook, Shield, TrendingUp, Calendar, AlertTriangle, 
  Activity, Target, Plus, Trash2, RefreshCw, CheckCircle2, XCircle,
  Settings, Users, Send
} from 'lucide-react';

interface NotificationChannel {
  id: string;
  channel_name: string;
  description: string;
  channel_type: string;
  is_active: boolean;
}

interface Subscription {
  id: string;
  channel_id: string;
  is_active: boolean;
  delivery_methods: string[];
  channel?: NotificationChannel;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  channel_id: string;
  events: string[];
  last_triggered_at: string | null;
  failure_count: number;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  success: boolean;
  response_status: number | null;
  duration_ms: number;
  error_message: string | null;
  created_at: string;
}

import { FileText } from 'lucide-react';

const channelIcons: Record<string, React.ReactNode> = {
  'dora_nis2_compliance': <Shield className="h-4 w-4" />,
  'fraud_detection': <AlertTriangle className="h-4 w-4" />,
  'risk_profile_changes': <TrendingUp className="h-4 w-4" />,
  'goal_deadlines': <Target className="h-4 w-4" />,
  'visit_reminders': <Calendar className="h-4 w-4" />,
  'security_incidents': <Shield className="h-4 w-4" />,
  'system_health': <Activity className="h-4 w-4" />,
  'high_value_opportunities': <TrendingUp className="h-4 w-4" />,
  'compliance_normativas': <FileText className="h-4 w-4" />,
};

const channelLabels: Record<string, string> = {
  'dora_nis2_compliance': 'Cumplimiento DORA/NIS2',
  'fraud_detection': 'Detección de Fraude',
  'risk_profile_changes': 'Cambios de Riesgo',
  'goal_deadlines': 'Vencimiento Objetivos',
  'visit_reminders': 'Recordatorios Visitas',
  'security_incidents': 'Incidentes Seguridad',
  'system_health': 'Estado del Sistema',
  'high_value_opportunities': 'Oportunidades Alto Valor',
  'compliance_normativas': 'Compliance y Normativas',
};

const channelDescriptions: Record<string, string> = {
  'compliance_normativas': 'Notificaciones de nuevas normativas oficiales, documentos internos, firmas pendientes, renovaciones y alertas de incumplimiento',
};

export function NotificationCenterManager() {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', channel_id: '', events: ['*'] });

  const canManageWebhooks = isAdmin || isSuperAdmin;

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch channels
      const { data: channelsData } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('is_active', true)
        .order('channel_name');

      setChannels(channelsData || []);

      // Fetch user subscriptions
      const { data: subsData } = await supabase
        .from('notification_subscriptions')
        .select('*, channel:notification_channels(*)')
        .eq('user_id', user.id);

      setSubscriptions(subsData || []);

      // Fetch webhooks (admin only)
      if (canManageWebhooks) {
        const { data: webhooksData } = await supabase
          .from('notification_webhooks')
          .select('*')
          .order('created_at', { ascending: false });

        setWebhooks(webhooksData || []);

        // Fetch recent webhook logs
        const { data: logsData } = await supabase
          .from('webhook_delivery_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        setWebhookLogs(logsData || []);
      }
    } catch (error) {
      console.error('Error fetching notification data:', error);
      toast.error('Error al cargar configuración de notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (channelId: string, currentlyActive: boolean) => {
    if (!user) return;

    try {
      const existingSub = subscriptions.find(s => s.channel_id === channelId);

      if (existingSub) {
        await supabase
          .from('notification_subscriptions')
          .update({ is_active: !currentlyActive })
          .eq('id', existingSub.id);
      } else {
        await supabase
          .from('notification_subscriptions')
          .insert({
            user_id: user.id,
            channel_id: channelId,
            is_active: true,
            delivery_methods: ['in_app', 'browser'],
          });
      }

      toast.success(currentlyActive ? 'Desuscrito del canal' : 'Suscrito al canal');
      fetchData();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Error al actualizar suscripción');
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || !newWebhook.channel_id) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      const { error } = await supabase
        .from('notification_webhooks')
        .insert({
          name: newWebhook.name,
          url: newWebhook.url,
          channel_id: newWebhook.channel_id,
          events: newWebhook.events,
          created_by: user?.id,
        });

      if (error) throw error;

      toast.success('Webhook creado correctamente');
      setShowWebhookDialog(false);
      setNewWebhook({ name: '', url: '', channel_id: '', events: ['*'] });
      fetchData();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Error al crear webhook');
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('notification_webhooks')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      toast.success('Webhook eliminado');
      fetchData();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Error al eliminar webhook');
    }
  };

  const toggleWebhook = async (webhookId: string, currentlyActive: boolean) => {
    try {
      await supabase
        .from('notification_webhooks')
        .update({ is_active: !currentlyActive })
        .eq('id', webhookId);

      toast.success(currentlyActive ? 'Webhook desactivado' : 'Webhook activado');
      fetchData();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Error al actualizar webhook');
    }
  };

  const testWebhook = async (webhookId: string) => {
    try {
      const { error } = await supabase.functions.invoke('dispatch-webhook', {
        body: {
          notification_id: crypto.randomUUID(),
          channel_name: 'system_health',
          event_type: 'test',
        },
      });

      if (error) throw error;
      toast.success('Test de webhook enviado');
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Error al probar webhook');
    }
  };

  const isSubscribed = (channelId: string) => {
    const sub = subscriptions.find(s => s.channel_id === channelId);
    return sub?.is_active ?? false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Centro de Notificaciones
          </h2>
          <p className="text-muted-foreground">
            Sistema centralizado de notificaciones con pub/sub y webhooks
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mis Suscripciones
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2" disabled={!canManageWebhooks}>
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2" disabled={!canManageWebhooks}>
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {channels.map((channel) => (
              <Card key={channel.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {channelIcons[channel.channel_name] || <Bell className="h-4 w-4" />}
                      {channelLabels[channel.channel_name] || channel.channel_name}
                    </CardTitle>
                    <Switch
                      checked={isSubscribed(channel.id)}
                      onCheckedChange={() => toggleSubscription(channel.id, isSubscribed(channel.id))}
                    />
                  </div>
                  <CardDescription>{channel.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {channel.channel_type}
                    </Badge>
                    {isSubscribed(channel.id) && (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Suscrito
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuración de Webhooks</CardTitle>
                  <CardDescription>
                    Integra sistemas externos como Kafka, RabbitMQ o AWS SNS/SQS
                  </CardDescription>
                </div>
                <Dialog open={showWebhookDialog} onOpenChange={setShowWebhookDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Webhook</DialogTitle>
                      <DialogDescription>
                        Configura un webhook para recibir notificaciones en sistemas externos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhook-name">Nombre</Label>
                        <Input
                          id="webhook-name"
                          placeholder="Mi Webhook"
                          value={newWebhook.name}
                          onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url">URL del Endpoint</Label>
                        <Input
                          id="webhook-url"
                          placeholder="https://api.example.com/webhook"
                          value={newWebhook.url}
                          onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-channel">Canal</Label>
                        <select
                          id="webhook-channel"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={newWebhook.channel_id}
                          onChange={(e) => setNewWebhook({ ...newWebhook, channel_id: e.target.value })}
                        >
                          <option value="">Seleccionar canal...</option>
                          {channels.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              {channelLabels[ch.channel_name] || ch.channel_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button onClick={createWebhook} className="w-full">
                        Crear Webhook
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay webhooks configurados</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {webhooks.map((webhook) => (
                    <AccordionItem key={webhook.id} value={webhook.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {webhook.is_active ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{webhook.name}</span>
                          </div>
                          {webhook.failure_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {webhook.failure_count} fallos
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">URL:</span>
                              <p className="font-mono text-xs break-all">{webhook.url}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Eventos:</span>
                              <p>{webhook.events.join(', ')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Última ejecución:</span>
                              <p>{webhook.last_triggered_at ? new Date(webhook.last_triggered_at).toLocaleString() : 'Nunca'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              {webhook.is_active ? 'Desactivar' : 'Activar'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testWebhook(webhook.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Test
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteWebhook(webhook.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Entrega de Webhooks</CardTitle>
              <CardDescription>Historial de entregas recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {webhookLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay logs disponibles</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {webhookLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg border ${
                          log.success ? 'bg-green-500/5 border-green-500/20' : 'bg-destructive/5 border-destructive/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {log.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                            <span className="font-mono text-sm">
                              {log.response_status || 'Error'}
                            </span>
                            <span className="text-muted-foreground text-sm">
                              {log.duration_ms}ms
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
