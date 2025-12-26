import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Webhook, RefreshCw, Send } from 'lucide-react';
import { useWebhookManager } from '@/hooks/admin/integrations';
import { useEffect } from 'react';

export default function WebhookManagerPanel() {
  const { webhooks, isLoading, fetchWebhooks, testWebhook } = useWebhookManager();

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const getSuccessRate = (webhook: { success_count: number; failure_count: number }) => {
    const total = webhook.success_count + webhook.failure_count;
    if (total === 0) return 0;
    return ((webhook.success_count / total) * 100).toFixed(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          Gestor de Webhooks
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => fetchWebhooks()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">
          {webhooks.filter(w => w.is_active).length} activos · {webhooks.length} total
        </div>
        {webhooks.slice(0, 4).map((webhook) => (
          <div key={webhook.id} className="flex items-center justify-between p-2 border rounded-lg">
            <div>
              <p className="font-medium text-sm">{webhook.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">{webhook.direction}</Badge>
                <span>{getSuccessRate(webhook)}% éxito</span>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => testWebhook(webhook.id)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
