/**
 * NotificationSystemPanel - Fase 9
 * Panel completo para sistema de notificaciones
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  RefreshCw, 
  Plus,
  Search,
  Mail,
  Smartphone,
  MessageSquare,
  Webhook,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Copy,
  Trash2,
  Settings
} from 'lucide-react';
import { useNotificationSystem } from '@/hooks/admin/automation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationSystemPanelProps {
  className?: string;
  expanded?: boolean;
}

export default function NotificationSystemPanel({ className, expanded = false }: NotificationSystemPanelProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    templates, 
    channels,
    logs,
    isLoading, 
    error,
    lastRefresh,
    fetchTemplates,
    fetchChannels,
    fetchLogs,
    sendNotification
  } = useNotificationSystem();

  useEffect(() => { 
    fetchTemplates();
    fetchChannels();
    fetchLogs();
  }, [fetchTemplates, fetchChannels, fetchLogs]);

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      case 'in_app': return <MessageSquare className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeChannels = channels.filter(c => c.is_active).length;
  const sentToday = logs?.filter(l => {
    const today = new Date();
    const logDate = new Date(l.sent_at);
    return logDate.toDateString() === today.toDateString();
  }).length || 0;
  const deliveryRate = logs?.length 
    ? Math.round((logs.filter(l => l.status === 'delivered').length / logs.length) * 100)
    : 0;

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Sistema de Notificaciones
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  Fase 9
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { fetchTemplates(); fetchChannels(); fetchLogs(); }}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Mail className="h-3.5 w-3.5" />
              Plantillas
            </div>
            <p className="text-2xl font-bold">{templates.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Webhook className="h-3.5 w-3.5" />
              Canales
            </div>
            <p className="text-2xl font-bold">{activeChannels}/{channels.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Send className="h-3.5 w-3.5" />
              Hoy
            </div>
            <p className="text-2xl font-bold">{sentToday}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Entrega
            </div>
            <p className="text-2xl font-bold">{deliveryRate}%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="templates" className="text-xs">Plantillas</TabsTrigger>
            <TabsTrigger value="channels" className="text-xs">Canales</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <ScrollArea className={expanded ? "h-[350px]" : "h-[250px]"}>
              <div className="space-y-2">
                {error ? (
                  <div className="p-4 text-center text-sm text-destructive">{error}</div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay plantillas configuradas</p>
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(template.type)}
                            <p className="font-medium text-sm">{template.name}</p>
                            <Badge 
                              variant={template.is_active ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {template.is_active ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          {template.subject && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6 line-clamp-1">
                              {template.subject}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 ml-6">
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                            {template.category && (
                              <span className="text-xs text-muted-foreground">
                                {template.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="channels" className="mt-0">
            <ScrollArea className={expanded ? "h-[350px]" : "h-[280px]"}>
              <div className="space-y-2">
                {channels.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Webhook className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay canales configurados</p>
                  </div>
                ) : (
                  channels.map((channel) => (
                    <div 
                      key={channel.id} 
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            channel.is_active ? "bg-green-500/10" : "bg-muted"
                          )}>
                            {getChannelIcon(channel.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{channel.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {channel.type} · {channel.provider || 'Sin proveedor'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Switch checked={channel.is_active} />
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <ScrollArea className={expanded ? "h-[350px]" : "h-[280px]"}>
              <div className="space-y-2">
                {logs?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No hay notificaciones enviadas</p>
                  </div>
                ) : (
                  logs?.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-medium text-sm">{log.template_name || 'Notificación'}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.recipient} · {log.channel}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              log.status === 'delivered' ? 'default' : 
                              log.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.sent_at && formatDistanceToNow(new Date(log.sent_at), { 
                              locale: es, 
                              addSuffix: true 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
