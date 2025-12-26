import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plug, RefreshCw, Activity } from 'lucide-react';
import { useExternalIntegrations } from '@/hooks/admin/integrations';
import { useEffect } from 'react';

export default function ExternalIntegrationsPanel() {
  const { integrations, isLoading, fetchIntegrations, checkHealth } = useExternalIntegrations();

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'down': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          Integraciones Externas
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => checkHealth()} title="Check Health">
            <Activity className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => fetchIntegrations()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">
          {integrations.filter(i => i.status === 'active').length} activas de {integrations.length}
        </div>
        {integrations.slice(0, 5).map((integration) => (
          <div key={integration.id} className="flex items-center justify-between p-2 border rounded-lg">
            <div className="flex items-center gap-2">
              <span>{getHealthIcon(integration.health_status)}</span>
              <div>
                <p className="font-medium text-sm">{integration.name}</p>
                <p className="text-xs text-muted-foreground">{integration.provider}</p>
              </div>
            </div>
            <Badge variant={getStatusColor(integration.status)}>{integration.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
