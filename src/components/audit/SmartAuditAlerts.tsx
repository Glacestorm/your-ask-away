import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Calendar,
  FileWarning,
  XCircle
} from 'lucide-react';
import { useAuditAlerts, AuditAlert } from '@/hooks/useAuditAlerts';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function SmartAuditAlerts() {
  const { 
    alerts, 
    loading, 
    markAsRead, 
    resolveAlert, 
    getUnreadCount, 
    getCriticalAlerts,
    fetchAlerts 
  } = useAuditAlerts();

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <FileWarning className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-black">Medio</Badge>;
      default:
        return <Badge variant="secondary">Bajo</Badge>;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Calendar className="h-4 w-4" />;
      case 'requirement':
        return <FileWarning className="h-4 w-4" />;
      case 'compliance':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const criticalAlerts = getCriticalAlerts();
  const unreadCount = getUnreadCount();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alerts.length}</p>
                <p className="text-sm text-muted-foreground">Alertas Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Críticas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Sin Leer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {alerts.filter(a => a.days_until_due && a.days_until_due > 7).length}
                </p>
                <p className="text-sm text-muted-foreground">En Plazo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  ¡Atención! Tienes {criticalAlerts.length} alerta(s) crítica(s)
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Estas requieren acción inmediata para evitar incumplimientos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Inteligentes de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">¡Todo en orden!</p>
              <p className="text-sm">No hay alertas pendientes</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border transition-all ${
                      !alert.is_read 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-card hover:bg-muted/50'
                    }`}
                    onClick={() => !alert.is_read && markAsRead(alert.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.title}</span>
                            {getSeverityBadge(alert.severity)}
                            {!alert.is_read && (
                              <Badge variant="outline" className="text-xs">Nueva</Badge>
                            )}
                          </div>
                          {alert.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getAlertTypeIcon(alert.alert_type)}
                              {alert.alert_type}
                            </span>
                            {alert.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Vence: {format(new Date(alert.due_date), 'dd/MM/yyyy', { locale: es })}
                                {alert.days_until_due !== null && (
                                  <span className={
                                    alert.days_until_due <= 0 
                                      ? 'text-red-500' 
                                      : alert.days_until_due <= 7 
                                        ? 'text-orange-500' 
                                        : ''
                                  }>
                                    ({alert.days_until_due <= 0 
                                      ? 'Vencido' 
                                      : `${alert.days_until_due} días`})
                                  </span>
                                )}
                              </span>
                            )}
                            <span>
                              {formatDistanceToNow(new Date(alert.created_at), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveAlert(alert.id);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
