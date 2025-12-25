import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Plug, Activity, CheckCircle, XCircle } from 'lucide-react';
import { useAPIConnectors } from '@/hooks/admin/integrations/useAPIConnectors';
import { cn } from '@/lib/utils';

export function APIConnectorsPanel({ className }: { className?: string }) {
  const { connectors, healthStatus, isLoading, fetchConnectors, checkHealth, testConnection } = useAPIConnectors();

  useEffect(() => { fetchConnectors(); }, [fetchConnectors]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            API Connectors
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => { fetchConnectors(); checkHealth(); }} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {connectors.map((c) => (
              <div key={c.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.endpoint}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => testConnection(c.id)}>Test</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default APIConnectorsPanel;
