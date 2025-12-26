import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  RefreshCw, 
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  FileWarning,
  Eye,
  DownloadCloud,
  Sparkles,
  ArrowUpRight,
  Activity,
  Zap
} from 'lucide-react';
import { useCRMMigration, CRMMigration, CRMMigrationRecord } from '@/hooks/admin/integrations/useCRMMigration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CRMMigrationDashboardProps {
  className?: string;
}

export function CRMMigrationDashboard({ className }: CRMMigrationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMigration, setSelectedMigration] = useState<CRMMigration | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const {
    migrations,
    activeMigration,
    records,
    stats,
    isLoading,
    isRunning,
    progress,
    fetchMigrations,
    fetchRecords,
    fetchStats,
    pauseMigration,
    resumeMigration,
    cancelMigration,
    rollbackMigration,
    startProgressPolling,
    stopProgressPolling
  } = useCRMMigration();

  // Auto-refresh data
  useEffect(() => {
    fetchMigrations();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchMigrations();
      fetchStats();
    }, 30000); // Refresh cada 30s

    return () => clearInterval(interval);
  }, [fetchMigrations, fetchStats]);

  // Polling para migración activa
  useEffect(() => {
    if (activeMigration?.status === 'running') {
      startProgressPolling(activeMigration.id);
    } else {
      stopProgressPolling();
    }
    return () => stopProgressPolling();
  }, [activeMigration?.id, activeMigration?.status, startProgressPolling, stopProgressPolling]);

  // Métricas calculadas
  const dashboardMetrics = useMemo(() => {
    const total = migrations.length;
    const completed = migrations.filter(m => m.status === 'completed').length;
    const failed = migrations.filter(m => m.status === 'failed').length;
    const running = migrations.filter(m => m.status === 'running').length;
    
    const totalRecords = migrations.reduce((acc, m) => acc + (m.total_records || 0), 0);
    const migratedRecords = migrations.reduce((acc, m) => acc + (m.migrated_records || 0), 0);
    const failedRecords = migrations.reduce((acc, m) => acc + (m.failed_records || 0), 0);
    
    const successRate = totalRecords > 0 ? ((migratedRecords / totalRecords) * 100).toFixed(1) : '0';
    
    return {
      total,
      completed,
      failed,
      running,
      totalRecords,
      migratedRecords,
      failedRecords,
      successRate
    };
  }, [migrations]);

  const handleViewMigration = useCallback(async (migration: CRMMigration) => {
    setSelectedMigration(migration);
    await fetchRecords(migration.id);
    setActiveTab('details');
  }, [fetchRecords]);

  const handleRetryFailed = useCallback(async () => {
    if (!selectedMigration) return;
    // Re-run migration for failed records only
    toast.info('Reintentando registros fallidos...');
    await fetchRecords(selectedMigration.id, 'failed');
  }, [selectedMigration, fetchRecords]);

  const handleRollback = useCallback(async () => {
    if (!selectedMigration) return;
    const success = await rollbackMigration(selectedMigration.id);
    if (success) {
      toast.success('Rollback completado');
      fetchMigrations();
    }
  }, [selectedMigration, rollbackMigration, fetchMigrations]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; className: string }> = {
      completed: { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" />, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      running: { variant: 'default', icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      paused: { variant: 'outline', icon: <Pause className="h-3 w-3 mr-1" />, className: 'text-yellow-400 border-yellow-500/30' },
      failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" />, className: '' },
      cancelled: { variant: 'secondary', icon: <XCircle className="h-3 w-3 mr-1" />, className: '' },
      rollback: { variant: 'outline', icon: <RotateCcw className="h-3 w-3 mr-1" />, className: 'text-orange-400 border-orange-500/30' },
      pending: { variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" />, className: '' },
      analyzing: { variant: 'outline', icon: <Sparkles className="h-3 w-3 mr-1 animate-pulse" />, className: 'text-purple-400 border-purple-500/30' },
    };
    
    const config = statusConfig[status] || { variant: 'outline' as const, icon: null, className: '' };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.icon}{status}
      </Badge>
    );
  };

  const getRecordStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Éxito</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Omitido</Badge>;
      case 'duplicate':
        return <Badge variant="outline" className="text-yellow-400">Duplicado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Migraciones</p>
                <p className="text-2xl font-bold">{dashboardMetrics.total}</p>
              </div>
              <Database className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-green-500">{dashboardMetrics.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-blue-500">{dashboardMetrics.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Registros Fallidos</p>
                <p className="text-2xl font-bold text-red-500">{dashboardMetrics.failedRecords.toLocaleString()}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Migration */}
      {activeMigration && activeMigration.status === 'running' && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                <CardTitle className="text-lg">Migración Activa</CardTitle>
              </div>
              {getStatusBadge(activeMigration.status)}
            </div>
            <CardDescription>{activeMigration.migration_name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span className="font-medium">
                  {activeMigration.migrated_records?.toLocaleString()} / {activeMigration.total_records?.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={activeMigration.total_records ? ((activeMigration.migrated_records || 0) / activeMigration.total_records) * 100 : 0} 
                className="h-3"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{activeMigration.migrated_records || 0}</p>
                <p className="text-xs text-muted-foreground">Migrados</p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <p className="text-lg font-bold text-red-500">{activeMigration.failed_records || 0}</p>
                <p className="text-xs text-muted-foreground">Errores</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <p className="text-lg font-bold text-yellow-500">{activeMigration.skipped_records || 0}</p>
                <p className="text-xs text-muted-foreground">Omitidos</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">
                  {activeMigration.estimated_completion 
                    ? formatDistanceToNow(new Date(activeMigration.estimated_completion), { locale: es })
                    : '--'}
                </p>
                <p className="text-xs text-muted-foreground">Tiempo est.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pauseMigration(activeMigration.id)}
                className="gap-1"
              >
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelMigration(activeMigration.id)}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewMigration(activeMigration)}
                className="gap-1 ml-auto"
              >
                Ver detalles
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Migrations Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Migraciones Recientes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => fetchMigrations()} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CRM Origen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Registros</TableHead>
                  <TableHead className="text-right">Éxito</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {migrations.map((migration) => {
                  const successRate = migration.total_records > 0 
                    ? ((migration.migrated_records || 0) / migration.total_records * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <TableRow key={migration.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{migration.migration_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{migration.source_crm}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(migration.status)}</TableCell>
                      <TableCell className="text-right">{migration.total_records.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-medium",
                          parseFloat(successRate) >= 90 ? "text-green-500" : 
                          parseFloat(successRate) >= 70 ? "text-yellow-500" : "text-red-500"
                        )}>
                          {successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(migration.created_at), { addSuffix: true, locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewMigration(migration)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  // Migration Details Tab
  const renderDetails = () => {
    if (!selectedMigration) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Selecciona una migración para ver detalles</p>
        </div>
      );
    }

    const failedRecordsList = records.filter(r => r.status === 'failed');
    const successfulRecords = records.filter(r => r.status === 'success');

    return (
      <div className="space-y-6">
        {/* Migration Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedMigration.migration_name}</CardTitle>
                <CardDescription>
                  CRM: {selectedMigration.source_crm} • 
                  Creada: {format(new Date(selectedMigration.created_at), 'PPp', { locale: es })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedMigration.status)}
                {selectedMigration.can_rollback && selectedMigration.status === 'completed' && (
                  <Button variant="outline" size="sm" onClick={handleRollback} className="gap-1">
                    <RotateCcw className="h-4 w-4" />
                    Rollback
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{selectedMigration.total_records.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-500">{(selectedMigration.migrated_records || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Exitosos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-500">{(selectedMigration.failed_records || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Fallidos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-500">{(selectedMigration.skipped_records || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Omitidos</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-2xl font-bold text-primary">
                  {selectedMigration.total_records > 0 
                    ? ((selectedMigration.migrated_records || 0) / selectedMigration.total_records * 100).toFixed(1)
                    : '0'}%
                </p>
                <p className="text-xs text-muted-foreground">Tasa Éxito</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Log */}
        {failedRecordsList.length > 0 && (
          <Card className="border-red-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">Registros con Errores ({failedRecordsList.length})</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRetryFailed} className="gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowErrorDetails(true)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {failedRecordsList.slice(0, 10).map((record) => (
                    <div 
                      key={record.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm font-medium">Registro #{record.record_index}</p>
                          <p className="text-xs text-red-400">{record.error_message}</p>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles del Error - Registro #{record.record_index}</DialogTitle>
                            <DialogDescription>
                              Información completa del error de migración
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Mensaje de Error</h4>
                              <p className="text-sm text-red-400 p-3 rounded-lg bg-red-500/10">
                                {record.error_message}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2">Datos Originales</h4>
                              <pre className="text-xs p-3 rounded-lg bg-muted overflow-auto max-h-48">
                                {JSON.stringify(record.source_data, null, 2)}
                              </pre>
                            </div>
                            {record.validation_errors && record.validation_errors.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Errores de Validación</h4>
                                <ul className="space-y-1">
                                  {record.validation_errors.map((err, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-yellow-500">
                                      <AlertTriangle className="h-3 w-3" />
                                      <span>{err.field}: {err.message}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                  {failedRecordsList.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      Y {failedRecordsList.length - 10} errores más...
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Warnings */}
        {selectedMigration.warnings && selectedMigration.warnings.length > 0 && (
          <Card className="border-yellow-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-base">Advertencias ({selectedMigration.warnings.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {selectedMigration.warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-yellow-500 p-2 rounded-lg bg-yellow-500/5">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{warning.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {selectedMigration.statistics && Object.keys(selectedMigration.statistics).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Estadísticas de Migración</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs p-3 rounded-lg bg-muted overflow-auto max-h-48">
                {JSON.stringify(selectedMigration.statistics, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Dashboard de Migraciones CRM</CardTitle>
              <CardDescription>
                Monitoreo en tiempo real y gestión de errores
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dashboardMetrics.running > 0 && (
              <Badge variant="default" className="bg-blue-500/20 text-blue-400 animate-pulse">
                <Activity className="h-3 w-3 mr-1" />
                {dashboardMetrics.running} activa(s)
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { fetchMigrations(); fetchStats(); }}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs gap-1">
              <Eye className="h-3 w-3" />
              Detalles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            {renderDetails()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CRMMigrationDashboard;
