import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Webhook, Send } from 'lucide-react';
import { useWebhooks } from '@/hooks/admin/integrations/useWebhooks';
import { cn } from '@/lib/utils';

export function WebhooksPanel({ className }: { className?: string }) {
  const { webhooks, deliveries, isLoading, fetchWebhooks, fetchDeliveries } = useWebhooks();

  useEffect(() => { fetchWebhooks(); fetchDeliveries(); }, [fetchWebhooks, fetchDeliveries]);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            Webhooks Manager
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => fetchWebhooks()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {webhooks.map((w) => (
              <div key={w.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{w.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{w.url}</p>
                  </div>
                  <Badge variant={w.is_active ? 'default' : 'secondary'}>{w.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {w.events.slice(0, 3).map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default WebhooksPanel;
