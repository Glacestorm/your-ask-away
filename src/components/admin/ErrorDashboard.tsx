import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  RefreshCw,
  CheckCircle,
  Clock,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ErrorLog {
  id: string;
  error_message: string;
  error_stack: string | null;
  error_code: string | null;
  severity: 'info' | 'warn' | 'error' | 'critical';
  component_name: string | null;
  url: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface PerformanceAlert {
  id: string;
  alert_type: string;
  metric_name: string;
  threshold_value: number;
  actual_value: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  created_at: string;
  acknowledged_at: string | null;
}

const severityConfig = {
  info: { icon: Info, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  warn: { icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  warning: { icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  error: { icon: AlertCircle, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  critical: { icon: XCircle, color: 'bg-red-600/10 text-red-600 border-red-600/20' },
};

export function ErrorDashboard() {
  const [selectedTab, setSelectedTab] = useState('errors');
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch error logs
  const { data: errorLogs, isLoading: loadingErrors, refetch: refetchErrors } = useQuery({
    queryKey: ['error-logs', severityFilter],
    queryFn: async () => {
      let query = supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter) {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ErrorLog[];
    },
  });

  // Fetch performance alerts
  const { data: perfAlerts, isLoading: loadingAlerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['performance-alerts', severityFilter],
    queryFn: async () => {
      let query = supabase
        .from('performance_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter) {
        query = query.eq('severity', severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PerformanceAlert[];
    },
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: string) => {
      const { error } = await supabase
        .from('error_logs')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', errorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
      toast.success('Error marcado como resuelto');
    },
    onError: () => {
      toast.error('Error al resolver');
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('performance_alerts')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-alerts'] });
      toast.success('Alerta reconocida');
    },
    onError: () => {
      toast.error('Error al reconocer alerta');
    },
  });

  // Calculate stats
  const errorStats = {
    total: errorLogs?.length || 0,
    critical: errorLogs?.filter(e => e.severity === 'critical').length || 0,
    error: errorLogs?.filter(e => e.severity === 'error').length || 0,
    unresolved: errorLogs?.filter(e => !e.resolved_at).length || 0,
  };

  const alertStats = {
    total: perfAlerts?.length || 0,
    critical: perfAlerts?.filter(a => a.severity === 'critical').length || 0,
    warning: perfAlerts?.filter(a => a.severity === 'warning').length || 0,
    unacknowledged: perfAlerts?.filter(a => !a.acknowledged_at).length || 0,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel de Errores y Alertas</h1>
          <p className="text-muted-foreground">
            Monitorización centralizada de errores frontend y alertas de rendimiento
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            refetchErrors();
            refetchAlerts();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Errores Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {errorStats.unresolved} sin resolver
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Errores Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{errorStats.critical}</div>
            <p className="text-xs text-muted-foreground">
              +{errorStats.error} errores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {alertStats.unacknowledged} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{alertStats.critical}</div>
            <p className="text-xs text-muted-foreground">
              +{alertStats.warning} advertencias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filtrar por severidad:</span>
        <div className="flex gap-2">
          <Button
            variant={severityFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSeverityFilter(null)}
          >
            Todos
          </Button>
          <Button
            variant={severityFilter === 'critical' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSeverityFilter('critical')}
          >
            Crítico
          </Button>
          <Button
            variant={severityFilter === 'error' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSeverityFilter('error')}
          >
            Error
          </Button>
          <Button
            variant={severityFilter === 'warning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSeverityFilter('warning')}
          >
            Advertencia
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="errors">
            Errores ({errorStats.total})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas Rendimiento ({alertStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Errores Frontend</CardTitle>
              <CardDescription>
                Lista de errores capturados en la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loadingErrors ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : errorLogs?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2" />
                    <p>No hay errores registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {errorLogs?.map((error) => {
                      const config = severityConfig[error.severity] || severityConfig.error;
                      const Icon = config.icon;
                      
                      return (
                        <div
                          key={error.id}
                          className={`p-4 rounded-lg border ${config.color}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 mt-0.5" />
                              <div className="space-y-1">
                                <div className="font-medium">{error.error_message}</div>
                                {error.component_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {error.component_name}
                                  </Badge>
                                )}
                                {error.url && (
                                  <p className="text-xs text-muted-foreground">
                                    {error.url}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(error.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {error.resolved_at ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                  Resuelto
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resolveErrorMutation.mutate(error.id)}
                                  disabled={resolveErrorMutation.isPending}
                                >
                                  Resolver
                                </Button>
                              )}
                            </div>
                          </div>
                          {error.error_stack && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-muted-foreground">
                                Ver stack trace
                              </summary>
                              <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-x-auto">
                                {error.error_stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Rendimiento</CardTitle>
              <CardDescription>
                Alertas generadas por métricas Core Web Vitals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {loadingAlerts ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : perfAlerts?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mb-2" />
                    <p>No hay alertas de rendimiento</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {perfAlerts?.map((alert) => {
                      const config = severityConfig[alert.severity] || severityConfig.warning;
                      const Icon = config.icon;
                      
                      return (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border ${config.color}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 mt-0.5" />
                              <div className="space-y-1">
                                <div className="font-medium">{alert.message}</div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{alert.metric_name}</Badge>
                                  <span className="text-sm">
                                    {alert.actual_value} / {alert.threshold_value}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {alert.acknowledged_at ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                  Reconocida
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                                  disabled={acknowledgeAlertMutation.isPending}
                                >
                                  Reconocer
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ErrorDashboard;
