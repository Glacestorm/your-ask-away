/**
 * IntegrationsHubPanel
 * Phase 11A: APIs, ERPs, Banks, Electronic Invoicing
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Plug, Database, Building2, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useObelixiaIntegrationsHub } from '@/hooks/admin/obelixia-accounting/useObelixiaIntegrationsHub';
import { cn } from '@/lib/utils';

export function IntegrationsHubPanel() {
  const [activeTab, setActiveTab] = useState('all');
  const { isLoading, integrations, syncLogs, fetchIntegrations, syncIntegration, testConnection } = useObelixiaIntegrationsHub();

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hub de Integraciones</h2>
          <p className="text-muted-foreground">Conectores con ERPs, bancos y sistemas externos</p>
        </div>
        <Button onClick={() => fetchIntegrations()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all"><Plug className="h-4 w-4 mr-2" />Todas</TabsTrigger>
          <TabsTrigger value="erp"><Database className="h-4 w-4 mr-2" />ERPs</TabsTrigger>
          <TabsTrigger value="bank"><Building2 className="h-4 w-4 mr-2" />Bancos</TabsTrigger>
          <TabsTrigger value="invoicing"><FileText className="h-4 w-4 mr-2" />Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.filter(i => activeTab === 'all' || i.type === activeTab).map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    {getStatusIcon(integration.status)}
                  </div>
                  <Badge variant="outline">{integration.provider}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Última sincronización: {integration.lastSync || 'Nunca'}</p>
                    {integration.metrics && (
                      <p>Tasa de éxito: {integration.metrics.successRate}%</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => testConnection(integration.id)}>
                      Probar
                    </Button>
                    <Button size="sm" onClick={() => syncIntegration(integration.id)}>
                      Sincronizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logs de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {syncLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{log.integrationId}</span>
                <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>{log.status}</Badge>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default IntegrationsHubPanel;
