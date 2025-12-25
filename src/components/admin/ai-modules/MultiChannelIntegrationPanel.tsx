import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Share2,
  MessageCircle,
  Mail,
  Phone,
  Maximize2,
  Minimize2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useMultiChannelIntegration } from '@/hooks/admin/useMultiChannelIntegration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MultiChannelIntegrationPanelProps {
  context?: {
    entityId: string;
    entityName?: string;
  } | null;
  className?: string;
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  chat: <MessageCircle className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4 text-green-500" />,
};

export function MultiChannelIntegrationPanel({ 
  context, 
  className 
}: MultiChannelIntegrationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('channels');

  const {
    isLoading,
    channels,
    unifiedHistory,
    syncStatus,
    lastRefresh,
    getChannelStatus,
    getUnifiedHistory,
    syncChannels
  } = useMultiChannelIntegration();

  useEffect(() => {
    getChannelStatus();
  }, [getChannelStatus]);

  useEffect(() => {
    if (context?.entityId) {
      getUnifiedHistory(context.entityId);
    }
  }, [context?.entityId, getUnifiedHistory]);

  const handleSync = useCallback(async () => {
    await syncChannels();
  }, [syncChannels]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Share2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un cliente para ver historial unificado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Multi-Channel IA</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Sincronizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Conectando...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSync}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="channels" className="text-xs">Canales</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Historial</TabsTrigger>
            <TabsTrigger value="sync" className="text-xs">Sync</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <div key={channel.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {channelIcons[channel.type] || <Share2 className="h-4 w-4" />}
                        <span className="font-medium text-sm capitalize">{channel.type}</span>
                      </div>
                      <Badge 
                        variant={channel.status === 'connected' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {channel.status === 'connected' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Conectado</>
                        ) : (
                          <><AlertCircle className="h-3 w-3 mr-1" /> Desconectado</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Última actividad: {formatDistanceToNow(new Date(channel.lastActivity), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                ))}
                {channels.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay canales configurados</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {unifiedHistory.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {channelIcons[item.channel] || <Share2 className="h-4 w-4" />}
                        <span className="text-xs text-muted-foreground capitalize">{item.channel}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{item.content}</p>
                    <Badge variant="outline" className="text-xs mt-2">{item.direction}</Badge>
                  </div>
                ))}
                {unifiedHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin historial de comunicaciones</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sync" className="flex-1 mt-0">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm">Estado de Sincronización</span>
                  <Badge variant={syncStatus.inProgress ? 'secondary' : 'default'}>
                    {syncStatus.inProgress ? 'Sincronizando...' : 'Sincronizado'}
                  </Badge>
                </div>
                <Progress value={syncStatus.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Última sync: {syncStatus.lastSync 
                    ? formatDistanceToNow(new Date(syncStatus.lastSync), { locale: es, addSuffix: true })
                    : 'Nunca'
                  }
                </p>
              </div>
              <Button 
                onClick={handleSync} 
                disabled={isLoading || syncStatus.inProgress}
                className="w-full"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", syncStatus.inProgress && "animate-spin")} />
                Sincronizar Canales
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default MultiChannelIntegrationPanel;
