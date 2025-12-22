import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Eye, Clock, TrendingDown, Activity, XCircle } from 'lucide-react';
import { useRevenueAnomalyAlerts } from '@/hooks/useRevenueAnomalyAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const severityConfig = {
  critical: { color: 'bg-red-500', textColor: 'text-red-500', icon: XCircle },
  high: { color: 'bg-orange-500', textColor: 'text-orange-500', icon: AlertTriangle },
  medium: { color: 'bg-amber-500', textColor: 'text-amber-500', icon: Activity },
  low: { color: 'bg-blue-500', textColor: 'text-blue-500', icon: TrendingDown },
};

const statusConfig = {
  open: { label: 'Abierta', variant: 'destructive' as const },
  investigating: { label: 'Investigando', variant: 'secondary' as const },
  resolved: { label: 'Resuelta', variant: 'outline' as const },
  false_positive: { label: 'Falso Positivo', variant: 'outline' as const },
};

export const RevenueAnomalyMonitor = () => {
  const { alerts, isLoading, updateAlertStatus } = useRevenueAnomalyAlerts();

  const openAlerts = alerts?.filter(a => a.status === 'open') || [];
  const investigatingAlerts = alerts?.filter(a => a.status === 'investigating') || [];
  const resolvedAlerts = alerts?.filter(a => a.status === 'resolved' || a.status === 'false_positive') || [];

  const handleStatusChange = async (alertId: string, newStatus: 'investigating' | 'resolved' | 'false_positive') => {
    await updateAlertStatus({ id: alertId, status: newStatus });
  };

  const renderAlert = (alert: NonNullable<typeof alerts>[number]) => {
    const severity = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.medium;
    const status = statusConfig[alert.status as keyof typeof statusConfig] || statusConfig.open;
    const SeverityIcon = severity.icon;

    return (
      <div
        key={alert.id}
        className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={cn('p-1.5 rounded-full', severity.color.replace('bg-', 'bg-') + '/20')}>
            <SeverityIcon className={cn('h-4 w-4', severity.textColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{alert.title}</span>
              <Badge variant={status.variant} className="text-xs shrink-0">
                {status.label}
              </Badge>
            </div>
            {alert.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {alert.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true, locale: es })}
              </span>
              <Badge variant="outline" className="text-xs">
                {Math.round(alert.confidence * 100)}% confianza
              </Badge>
            </div>
            {alert.status === 'open' && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange(alert.id, 'investigating')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Investigar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange(alert.id, 'false_positive')}
                >
                  Falso Positivo
                </Button>
              </div>
            )}
            {alert.status === 'investigating' && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() => handleStatusChange(alert.id, 'resolved')}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolver
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Abiertas
            </span>
            {openAlerts.length > 0 && (
              <Badge variant="destructive">{openAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] px-4 pb-4">
            {openAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500/50" />
                Sin alertas abiertas
              </div>
            ) : (
              <div className="space-y-3">
                {openAlerts.map(renderAlert)}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-500" />
              En Investigación
            </span>
            {investigatingAlerts.length > 0 && (
              <Badge variant="secondary">{investigatingAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] px-4 pb-4">
            {investigatingAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sin alertas en investigación
              </div>
            ) : (
              <div className="space-y-3">
                {investigatingAlerts.map(renderAlert)}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resueltas
            </span>
            {resolvedAlerts.length > 0 && (
              <Badge variant="outline">{resolvedAlerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] px-4 pb-4">
            {resolvedAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sin alertas resueltas
              </div>
            ) : (
              <div className="space-y-3">
                {resolvedAlerts.map(renderAlert)}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
