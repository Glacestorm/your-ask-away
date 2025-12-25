import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  context?: { entityId: string; entityName?: string } | null;
  className?: string;
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4 text-green-500" />,
  sms: <Phone className="h-4 w-4" />,
  push: <MessageCircle className="h-4 w-4" />,
  in_app: <MessageCircle className="h-4 w-4" />,
};

export function MultiChannelIntegrationPanel({ context, className }: MultiChannelIntegrationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('channels');

  const {
    isLoading,
    channels,
    threads,
    messages,
    fetchChannelStatus,
    fetchThreads,
    getChannelIcon
  } = useMultiChannelIntegration();

  useEffect(() => {
    fetchChannelStatus();
  }, [fetchChannelStatus]);

  useEffect(() => {
    if (context?.entityId) {
      fetchThreads();
    }
  }, [context?.entityId, fetchThreads]);

  const handleRefresh = useCallback(async () => {
    await fetchChannelStatus();
    await fetchThreads();
  }, [fetchChannelStatus, fetchThreads]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Share2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un cliente para ver historial</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Multi-Channel IA</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="channels" className="text-xs">Canales</TabsTrigger>
            <TabsTrigger value="threads" className="text-xs">Conversaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {channels.map((channel, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {channelIcons[channel.channel] || <Share2 className="h-4 w-4" />}
                        <span className="font-medium text-sm capitalize">{channel.channel}</span>
                      </div>
                      <Badge variant={channel.enabled ? 'default' : 'secondary'} className="text-xs">
                        {channel.enabled ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
                        ) : (
                          <><AlertCircle className="h-3 w-3 mr-1" /> Inactivo</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {channel.api_configured ? 'API configurada' : 'API pendiente'} • {channel.templates_count} plantillas
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

          <TabsContent value="threads" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              <div className="space-y-2">
                {threads.map((thread) => (
                  <div key={thread.id} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{thread.contact_name}</span>
                      {thread.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs">{thread.unread_count}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{thread.last_message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {thread.channels_used.map((ch, idx) => (
                        <span key={idx} className="text-xs">{getChannelIcon(ch)}</span>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(thread.last_message_at), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
                {threads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin conversaciones</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default MultiChannelIntegrationPanel;
