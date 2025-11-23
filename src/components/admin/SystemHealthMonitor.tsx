import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Database, Server, HardDrive, Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface HealthData {
  overall: {
    status: 'healthy' | 'degraded' | 'error';
    timestamp: string;
    uptime?: any;
  };
  database: {
    connected: boolean;
    responseTime: number;
    status: string;
    error?: string | null;
  };
  authentication: {
    status: string;
    responseTime: number;
    error?: string | null;
  };
  tables: Record<string, {
    count: number;
    status: string;
    error?: string | null;
  }>;
  storage: Record<string, {
    accessible: boolean;
    status: string;
    error?: string | null;
  }>;
  recentErrors: any[];
  metrics: {
    totalCompanies: number;
    totalUsers: number;
    totalVisits: number;
    totalProducts: number;
  };
}

export function SystemHealthMonitor() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase.functions.invoke('system-health');

      if (error) throw error;

      setHealthData(data);
      
      if (isRefresh) {
        toast.success('Estado del sistema actualizado');
      }
    } catch (error: any) {
      console.error('Error fetching health data:', error);
      toast.error('Error al obtener el estado del sistema');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchHealthData(true), 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500">Saludable</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degradado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-500';
    if (time < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No se pudo cargar el estado del sistema</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitor de Salud del Sistema</h2>
          <p className="text-muted-foreground">
            Estado actualizado: {new Date(healthData.overall.timestamp).toLocaleString('es-ES')}
          </p>
        </div>
        <Button
          onClick={() => fetchHealthData(true)}
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(healthData.overall.status)}
              <CardTitle>Estado General</CardTitle>
            </div>
            {getStatusBadge(healthData.overall.status)}
          </div>
        </CardHeader>
      </Card>

      {/* Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Empresas</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalCompanies}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Usuarios</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Visitas</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalVisits}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Productos</CardDescription>
            <CardTitle className="text-3xl">{healthData.metrics.totalProducts}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Base de Datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(healthData.database.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tiempo de respuesta</span>
              <span className={`text-sm font-mono ${getResponseTimeColor(healthData.database.responseTime)}`}>
                {healthData.database.responseTime}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conectado</span>
              <span className="text-sm">
                {healthData.database.connected ? '✓ Sí' : '✗ No'}
              </span>
            </div>
            {healthData.database.error && (
              <div className="rounded-md bg-destructive/10 p-2">
                <p className="text-xs text-destructive">{healthData.database.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Autenticación</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {getStatusBadge(healthData.authentication.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tiempo de respuesta</span>
              <span className={`text-sm font-mono ${getResponseTimeColor(healthData.authentication.responseTime)}`}>
                {healthData.authentication.responseTime}ms
              </span>
            </div>
            {healthData.authentication.error && (
              <div className="rounded-md bg-destructive/10 p-2">
                <p className="text-xs text-destructive">{healthData.authentication.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <CardTitle>Estado de Tablas</CardTitle>
          </div>
          <CardDescription>Estadísticas de las tablas principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(healthData.tables).map(([table, stats]) => (
              <div key={table} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.status)}
                    <span className="text-sm font-medium">{table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stats.count.toLocaleString()} registros
                    </span>
                    {getStatusBadge(stats.status)}
                  </div>
                </div>
                {stats.error && (
                  <div className="ml-7 rounded-md bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">{stats.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            <CardTitle>Almacenamiento</CardTitle>
          </div>
          <CardDescription>Estado de los buckets de almacenamiento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(healthData.storage).map(([bucket, stats]) => (
              <div key={bucket} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(stats.status)}
                    <span className="text-sm font-medium">{bucket}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {stats.accessible ? 'Accesible' : 'No accesible'}
                    </span>
                    {getStatusBadge(stats.status)}
                  </div>
                </div>
                {stats.error && (
                  <div className="ml-7 rounded-md bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">{stats.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {healthData.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Actividad Reciente</CardTitle>
            </div>
            <CardDescription>Últimas 10 entradas del registro de auditoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.recentErrors.map((error, index) => (
                <div key={error.id || index} className="rounded-md border p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{error.action} - {error.table_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(error.created_at).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
