import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Plug, 
  Send, 
  Bell,
  Ticket,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Settings,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useSupportExternalIntegrations } from '@/hooks/admin/support';
import { cn } from '@/lib/utils';

interface ExternalIntegrationsPanelProps {
  sessionId?: string;
  className?: string;
}

export function ExternalIntegrationsPanel({ sessionId, className }: ExternalIntegrationsPanelProps) {
  const [activeTab, setActiveTab] = useState('integrations');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  const {
    integrations,
    isLoading,
    getIntegrations,
    testConnection,
    sendWebhook,
    sendNotification,
    createTicket,
    configureIntegration
  } = useSupportExternalIntegrations();

  useEffect(() => {
    getIntegrations();
  }, []);

  const handleTestConnection = async (integrationId: string) => {
    await testConnection(integrationId);
  };

  const handleSendWebhook = async () => {
    if (!webhookUrl) return;
    await sendWebhook({ 
      webhook_url: webhookUrl,
      event_type: 'test',
      payload: {
        sessionId,
        timestamp: new Date().toISOString() 
      }
    });
    setWebhookUrl('');
  };

  const handleSendNotification = async (channel: 'slack' | 'teams' | 'email') => {
    await sendNotification({
      type: channel,
      recipients: ['admin@example.com'],
      title: 'Notificación de Soporte',
      message: notificationMessage || 'Notificación de prueba desde Soporte Remoto',
      priority: 'normal'
    });
  };

  const handleCreateTicket = async (system: 'jira' | 'zendesk') => {
    await createTicket({
      external_system: system,
      title: 'Ticket desde Soporte Remoto',
      description: 'Ticket creado automáticamente desde el sistema de soporte',
      priority: 'medium'
    });
  };

  const handleToggleIntegration = async (integrationId: string, enabled: boolean) => {
    await configureIntegration(integrationId, { enabled });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'ticketing': return '🎫';
      case 'notifications': return '🔔';
      case 'webhooks': return '🔗';
      case 'alerting': return '⚠️';
      default: return '🔌';
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Plug className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Integraciones Externas</CardTitle>
              <p className="text-xs text-muted-foreground">
                {integrations.filter(i => i.status === 'connected').length} activas de {integrations.length}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => getIntegrations()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="integrations" className="text-xs">Conexiones</TabsTrigger>
            <TabsTrigger value="webhooks" className="text-xs">Webhooks</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">Notificaciones</TabsTrigger>
            <TabsTrigger value="tickets" className="text-xs">Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="mt-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getIntegrationIcon(integration.type)}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium capitalize">{integration.name}</p>
                            {getStatusIcon(integration.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {integration.type} • {integration.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integration.status === 'connected'}
                          onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTestConnection(integration.id)}
                          disabled={isLoading}
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {integration.last_sync && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Última sincronización: {new Date(integration.last_sync).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}

                {integrations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay integraciones configuradas</p>
                    <Button variant="outline" size="sm" className="mt-3">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-0 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">URL del Webhook</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://tu-servidor.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <Button 
                  onClick={handleSendWebhook}
                  disabled={!webhookUrl || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="text-sm font-medium mb-2">Payload de Ejemplo</h4>
              <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{JSON.stringify({
  event: 'support_session',
  sessionId: sessionId || 'session-123',
  action: 'completed',
  timestamp: new Date().toISOString()
}, null, 2)}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">24</div>
                  <p className="text-xs text-muted-foreground">Enviados Hoy</p>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-500">98%</div>
                  <p className="text-xs text-muted-foreground">Tasa Éxito</p>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Mensaje</label>
              <Input
                placeholder="Mensaje de notificación..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleSendNotification('slack')}
                disabled={isLoading}
                className="flex flex-col h-20 gap-1"
              >
                <span className="text-2xl">💬</span>
                <span className="text-xs">Slack</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSendNotification('teams')}
                disabled={isLoading}
                className="flex flex-col h-20 gap-1"
              >
                <span className="text-2xl">👥</span>
                <span className="text-xs">Teams</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSendNotification('email')}
                disabled={isLoading}
                className="flex flex-col h-20 gap-1"
              >
                <span className="text-2xl">📧</span>
                <span className="text-xs">Email</span>
              </Button>
            </div>

            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4" />
                <h4 className="text-sm font-medium">Notificaciones Recientes</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Slack - Canal #soporte</span>
                  <Badge variant="outline" className="text-xs">Hace 5 min</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Email - admin@empresa.com</span>
                  <Badge variant="outline" className="text-xs">Hace 1 hora</Badge>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="mt-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateTicket('jira')}
                disabled={isLoading}
                className="flex flex-col h-24 gap-2"
              >
                <span className="text-3xl">🎫</span>
                <span className="text-sm font-medium">Crear en Jira</span>
                <span className="text-xs text-muted-foreground">Issue tracking</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreateTicket('zendesk')}
                disabled={isLoading}
                className="flex flex-col h-24 gap-2"
              >
                <span className="text-3xl">💬</span>
                <span className="text-sm font-medium">Crear en Zendesk</span>
                <span className="text-xs text-muted-foreground">Soporte al cliente</span>
              </Button>
            </div>

            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="h-4 w-4" />
                <h4 className="text-sm font-medium">Tickets Sincronizados</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-background">
                  <div className="flex items-center gap-2">
                    <span>🎫</span>
                    <div>
                      <p className="text-sm font-medium">SUPPORT-1234</p>
                      <p className="text-xs text-muted-foreground">Jira • En Progreso</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-background">
                  <div className="flex items-center gap-2">
                    <span>💬</span>
                    <div>
                      <p className="text-sm font-medium">#45678</p>
                      <p className="text-xs text-muted-foreground">Zendesk • Abierto</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ExternalIntegrationsPanel;
