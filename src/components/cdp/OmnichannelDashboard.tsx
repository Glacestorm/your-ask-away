import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, MessageSquare, Phone, Bell, Send, CheckCircle, 
  XCircle, Clock, Eye, MousePointerClick, TrendingUp
} from 'lucide-react';
import { useOmnichannelMessages, useChannelConnectors, useMessageAnalytics } from '@/hooks/useOmnichannelMessages';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
  push: Bell,
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pendiente' },
  sent: { icon: Send, color: 'text-blue-500', label: 'Enviado' },
  delivered: { icon: CheckCircle, color: 'text-green-500', label: 'Entregado' },
  opened: { icon: Eye, color: 'text-purple-500', label: 'Abierto' },
  clicked: { icon: MousePointerClick, color: 'text-indigo-500', label: 'Clicado' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Fallido' },
  bounced: { icon: XCircle, color: 'text-orange-500', label: 'Rebotado' },
};

export function OmnichannelDashboard() {
  const { messages, isLoading } = useOmnichannelMessages();
  const { connectors } = useChannelConnectors();
  const { data: analytics } = useMessageAnalytics();

  const getChannelIcon = (channel: string) => {
    const Icon = CHANNEL_ICONS[channel] || Mail;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" />
          Centro Omnicanal
        </h2>
        <p className="text-muted-foreground">
          Gestiona todas tus comunicaciones desde un solo lugar
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{analytics?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Mensajes</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        {Object.entries(analytics?.byChannel || {}).slice(0, 3).map(([channel, stats]) => (
          <Card key={channel}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground capitalize">{channel}</p>
                </div>
                {getChannelIcon(channel)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Mensajes Recientes</TabsTrigger>
          <TabsTrigger value="channels">Canales</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimos Mensajes</CardTitle>
              <CardDescription>Historial de comunicaciones</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay mensajes aún
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="p-2 rounded-full bg-muted">
                          {getChannelIcon(msg.channel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="capitalize">
                              {msg.channel}
                            </Badge>
                            {getStatusBadge(msg.status)}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(msg.created_at), 'dd/MM HH:mm', { locale: es })}
                            </span>
                          </div>
                          {msg.subject && (
                            <p className="font-medium truncate">{msg.subject}</p>
                          )}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {connectors.map((connector) => (
              <Card key={connector.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 capitalize">
                      {getChannelIcon(connector.channel_type)}
                      {connector.channel_type}
                    </CardTitle>
                    <Badge variant={connector.is_active ? 'default' : 'secondary'}>
                      {connector.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <CardDescription>Proveedor: {connector.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{connector.stats?.total_sent || 0}</p>
                      <p className="text-xs text-muted-foreground">Enviados</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{connector.stats?.total_delivered || 0}</p>
                      <p className="text-xs text-muted-foreground">Entregados</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{connector.stats?.total_failed || 0}</p>
                      <p className="text-xs text-muted-foreground">Fallidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
