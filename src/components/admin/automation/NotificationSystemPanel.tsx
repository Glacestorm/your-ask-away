import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, RefreshCw } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/admin/automation';
import { useEffect } from 'react';

export default function NotificationSystemPanel() {
  const { templates, channels, isLoading, fetchTemplates, fetchChannels } = useNotificationSystem();

  useEffect(() => { fetchTemplates(); fetchChannels(); }, [fetchTemplates, fetchChannels]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Sistema de Notificaciones
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => { fetchTemplates(); fetchChannels(); }} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">{templates.length} plantillas · {channels.length} canales</div>
        {templates.slice(0, 4).map((t) => (
          <div key={t.id} className="flex items-center justify-between p-2 border rounded-lg">
            <p className="font-medium text-sm">{t.name}</p>
            <Badge variant={t.is_active ? 'default' : 'secondary'}>{t.type}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
