/**
 * WorkspaceIntegrationsPanel Component
 * Fase 4 - Microsoft 365 & Google Workspace Integrations
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Mail,
  Calendar,
  HardDrive,
  Video,
  Cloud,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeftRight,
  Settings,
  Unplug,
  Send,
  Upload,
  History,
  Zap
} from 'lucide-react';
import { useWorkspaceIntegrations } from '@/hooks/admin/integrations/useWorkspaceIntegrations';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Microsoft & Google Icons
const MicrosoftIcon = () => (
  <svg viewBox="0 0 23 23" className="h-5 w-5">
    <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
    <rect x="12" y="1" width="10" height="10" fill="#7fba00"/>
    <rect x="1" y="12" width="10" height="10" fill="#00a4ef"/>
    <rect x="12" y="12" width="10" height="10" fill="#ffb900"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface WorkspaceIntegrationsPanelProps {
  className?: string;
}

export function WorkspaceIntegrationsPanel({ className }: WorkspaceIntegrationsPanelProps) {
  const [activeTab, setActiveTab] = useState('microsoft');
  const [activeService, setActiveService] = useState<string | null>(null);

  const {
    isLoading,
    microsoftStatus,
    googleStatus,
    syncHistory,
    lastRefresh,
    fetchAllStatus,
    fetchSyncHistory,
    syncOutlook,
    syncTeams,
    syncOneDrive,
    syncGmail,
    syncCalendar,
    syncDrive,
    startAutoRefresh,
    stopAutoRefresh,
    disconnectIntegration
  } = useWorkspaceIntegrations();

  useEffect(() => {
    startAutoRefresh(120000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  useEffect(() => {
    if (activeTab) {
      fetchSyncHistory(activeTab as 'microsoft' | 'google');
    }
  }, [activeTab, fetchSyncHistory]);

  const handleSync = useCallback(async (service: string) => {
    setActiveService(service);
    switch (service) {
      case 'outlook':
        await syncOutlook();
        break;
      case 'teams':
        await syncTeams();
        break;
      case 'onedrive':
        await syncOneDrive();
        break;
      case 'gmail':
        await syncGmail();
        break;
      case 'calendar':
        await syncCalendar();
        break;
      case 'drive':
        await syncDrive();
        break;
    }
    setActiveService(null);
  }, [syncOutlook, syncTeams, syncOneDrive, syncGmail, syncCalendar, syncDrive]);

  const renderServiceCard = (
    service: string,
    icon: React.ReactNode,
    title: string,
    status: { enabled: boolean; lastSync: string; itemsSynced: number } | undefined,
    provider: 'microsoft' | 'google'
  ) => (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              status?.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {icon}
            </div>
            <div>
              <h4 className="font-medium text-sm">{title}</h4>
              {status?.lastSync && (
                <p className="text-xs text-muted-foreground">
                  Última sync: {formatDistanceToNow(new Date(status.lastSync), { locale: es, addSuffix: true })}
                </p>
              )}
            </div>
          </div>
          <Badge variant={status?.enabled ? "default" : "secondary"} className="text-xs">
            {status?.enabled ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{status?.itemsSynced || 0} items sincronizados</span>
          <ArrowLeftRight className="h-3 w-3" />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={() => handleSync(service)}
            disabled={isLoading && activeService === service}
          >
            {isLoading && activeService === service ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Sincronizar
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderMicrosoftTab = () => (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className={cn(
        "border-2 transition-colors",
        microsoftStatus?.connected ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MicrosoftIcon />
              <div>
                <h3 className="font-semibold">Microsoft 365</h3>
                {microsoftStatus?.user && (
                  <p className="text-xs text-muted-foreground">{microsoftStatus.user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {microsoftStatus?.connected ? (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Button size="sm" variant="outline">
                  Conectar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderServiceCard(
          'outlook',
          <Mail className="h-4 w-4" />,
          'Outlook',
          microsoftStatus?.services?.outlook,
          'microsoft'
        )}
        {renderServiceCard(
          'teams',
          <Video className="h-4 w-4" />,
          'Teams',
          microsoftStatus?.services?.teams,
          'microsoft'
        )}
        {renderServiceCard(
          'onedrive',
          <HardDrive className="h-4 w-4" />,
          'OneDrive',
          microsoftStatus?.services?.onedrive,
          'microsoft'
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Send className="h-3 w-3 mr-1" />
            Enviar Email
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Crear Evento
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Video className="h-3 w-3 mr-1" />
            Reunión Teams
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Subir Archivo
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderGoogleTab = () => (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className={cn(
        "border-2 transition-colors",
        googleStatus?.connected ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GoogleIcon />
              <div>
                <h3 className="font-semibold">Google Workspace</h3>
                {googleStatus?.user && (
                  <p className="text-xs text-muted-foreground">{googleStatus.user.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleStatus?.connected ? (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Button size="sm" variant="outline">
                  Conectar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderServiceCard(
          'gmail',
          <Mail className="h-4 w-4" />,
          'Gmail',
          googleStatus?.services?.gmail,
          'google'
        )}
        {renderServiceCard(
          'calendar',
          <Calendar className="h-4 w-4" />,
          'Calendar',
          googleStatus?.services?.calendar,
          'google'
        )}
        {renderServiceCard(
          'drive',
          <HardDrive className="h-4 w-4" />,
          'Drive',
          googleStatus?.services?.drive,
          'google'
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Send className="h-3 w-3 mr-1" />
            Enviar Email
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Crear Evento
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Video className="h-3 w-3 mr-1" />
            Google Meet
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Subir a Drive
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Historial de Sincronización
        </h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => fetchSyncHistory(activeTab as 'microsoft' | 'google')}
        >
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {syncHistory.map((item) => (
            <Card key={item.id} className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-1.5 rounded",
                      item.status === 'completed' ? "bg-green-500/10 text-green-500" :
                      item.status === 'partial' ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-red-500/10 text-red-500"
                    )}>
                      {item.status === 'completed' ? <CheckCircle className="h-3 w-3" /> :
                       item.status === 'partial' ? <Clock className="h-3 w-3" /> :
                       <XCircle className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{item.type} Sync</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.startedAt), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{item.itemsSynced} items</p>
                    {item.errors > 0 && (
                      <p className="text-xs text-destructive">{item.errors} errores</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Integraciones Workspace</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchAllStatus}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="microsoft" className="text-xs gap-1">
              <MicrosoftIcon />
              Microsoft 365
            </TabsTrigger>
            <TabsTrigger value="google" className="text-xs gap-1">
              <GoogleIcon />
              Google
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1">
              <History className="h-3 w-3" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="microsoft" className="mt-0">
            {renderMicrosoftTab()}
          </TabsContent>

          <TabsContent value="google" className="mt-0">
            {renderGoogleTab()}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {renderHistoryTab()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default WorkspaceIntegrationsPanel;
