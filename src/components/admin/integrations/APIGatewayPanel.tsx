import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, RefreshCw, Key } from 'lucide-react';
import { useAPIGateway } from '@/hooks/admin/integrations';
import { useEffect } from 'react';

export default function APIGatewayPanel() {
  const { endpoints, apiKeys, isLoading, fetchEndpoints, fetchApiKeys } = useAPIGateway();

  useEffect(() => { 
    fetchEndpoints(); 
    fetchApiKeys(); 
  }, [fetchEndpoints, fetchApiKeys]);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/10 text-green-600';
      case 'POST': return 'bg-blue-500/10 text-blue-600';
      case 'PUT': return 'bg-yellow-500/10 text-yellow-600';
      case 'DELETE': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          API Gateway
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => { fetchEndpoints(); fetchApiKeys(); }} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          {endpoints.filter(e => e.is_active).length} endpoints · {apiKeys.filter(k => k.is_active).length} API keys
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Endpoints</p>
          {endpoints.slice(0, 3).map((ep) => (
            <div key={ep.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${getMethodColor(ep.method)}`}>{ep.method}</Badge>
                <span className="text-sm font-mono">{ep.path}</span>
              </div>
              <Badge variant={ep.is_public ? 'secondary' : 'outline'}>
                {ep.is_public ? 'Público' : 'Privado'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Key className="h-3 w-3" /> API Keys
          </p>
          {apiKeys.slice(0, 2).map((key) => (
            <div key={key.id} className="flex items-center justify-between p-2 border rounded-lg">
              <div>
                <p className="text-sm font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}</p>
              </div>
              <Badge variant={key.is_active ? 'default' : 'secondary'}>
                {key.is_active ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
