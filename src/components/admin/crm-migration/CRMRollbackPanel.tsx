import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  RotateCcw,
  History,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  FileWarning,
  Undo2,
  Archive,
  Download,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  ChevronRight,
  Activity,
  HardDrive,
  Lock,
  Unlock
} from 'lucide-react';
import { CRMMigration } from '@/hooks/admin/integrations';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface RollbackPoint {
  id: string;
  migration_id: string;
  migration_name: string;
  created_at: string;
  records_count: number;
  tables_affected: string[];
  size_bytes: number;
  status: 'available' | 'expired' | 'partial' | 'locked';
  is_automatic: boolean;
  expires_at?: string;
  metadata: {
    source_crm: string;
    batch_id?: string;
    checksum?: string;
  };
}

interface RollbackOperation {
  id: string;
  rollback_point_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  records_processed: number;
  records_total: number;
  errors: Array<{ message: string; record_id?: string; table?: string }>;
  performed_by?: string;
  reason?: string;
}

interface RecoveryOption {
  id: string;
  type: 'full' | 'partial' | 'selective';
  title: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
  estimated_time_minutes: number;
  affects_tables: string[];
}

interface CRMRollbackPanelProps {
  migration: CRMMigration | null;
}

export function CRMRollbackPanel({ migration }: CRMRollbackPanelProps) {
  const [activeTab, setActiveTab] = useState('points');
  const [rollbackPoints, setRollbackPoints] = useState<RollbackPoint[]>([]);
  const [rollbackOperations, setRollbackOperations] = useState<RollbackOperation[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<RollbackPoint | null>(null);
  const [selectedRecoveryOption, setSelectedRecoveryOption] = useState<RecoveryOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackProgress, setRollbackProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectiveTables, setSelectiveTables] = useState<string[]>([]);

  // Simulated recovery options
  const recoveryOptions: RecoveryOption[] = [
    {
      id: 'full',
      type: 'full',
      title: 'Rollback Completo',
      description: 'Revierte todos los cambios de la migración a su estado anterior',
      risk_level: 'high',
      estimated_time_minutes: 15,
      affects_tables: ['contacts', 'companies', 'deals', 'activities', 'custom_fields']
    },
    {
      id: 'partial',
      type: 'partial',
      title: 'Rollback Parcial',
      description: 'Revierte solo los registros con errores o conflictos',
      risk_level: 'medium',
      estimated_time_minutes: 5,
      affects_tables: ['contacts', 'companies']
    },
    {
      id: 'selective',
      type: 'selective',
      title: 'Rollback Selectivo',
      description: 'Selecciona manualmente qué tablas o registros revertir',
      risk_level: 'low',
      estimated_time_minutes: 10,
      affects_tables: []
    }
  ];

  // Load rollback points
  const loadRollbackPoints = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockPoints: RollbackPoint[] = migration ? [
        {
          id: 'rp-001',
          migration_id: migration.id,
          migration_name: migration.migration_name,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          records_count: 1250,
          tables_affected: ['contacts', 'companies', 'deals'],
          size_bytes: 2.5 * 1024 * 1024,
          status: 'available',
          is_automatic: true,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            source_crm: migration.source_crm,
            batch_id: 'batch-001',
            checksum: 'abc123def456'
          }
        },
        {
          id: 'rp-002',
          migration_id: migration.id,
          migration_name: migration.migration_name,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          records_count: 850,
          tables_affected: ['contacts', 'activities'],
          size_bytes: 1.8 * 1024 * 1024,
          status: 'available',
          is_automatic: true,
          expires_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            source_crm: migration.source_crm,
            batch_id: 'batch-002'
          }
        },
        {
          id: 'rp-003',
          migration_id: migration.id,
          migration_name: migration.migration_name,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          records_count: 500,
          tables_affected: ['contacts'],
          size_bytes: 0.9 * 1024 * 1024,
          status: 'partial',
          is_automatic: false,
          metadata: {
            source_crm: migration.source_crm
          }
        }
      ] : [];

      setRollbackPoints(mockPoints);
    } catch (error) {
      console.error('Error loading rollback points:', error);
      toast.error('Error al cargar puntos de rollback');
    } finally {
      setIsLoading(false);
    }
  }, [migration]);

  // Load rollback operations history
  const loadRollbackOperations = useCallback(async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockOperations: RollbackOperation[] = [
        {
          id: 'ro-001',
          rollback_point_id: 'rp-old-001',
          status: 'completed',
          started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
          records_processed: 320,
          records_total: 320,
          errors: [],
          performed_by: 'admin@empresa.com',
          reason: 'Errores de mapeo detectados'
        },
        {
          id: 'ro-002',
          rollback_point_id: 'rp-old-002',
          status: 'failed',
          started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          records_processed: 150,
          records_total: 500,
          errors: [
            { message: 'Registro bloqueado por dependencia', record_id: 'rec-123', table: 'deals' },
            { message: 'Conflicto de integridad referencial', table: 'activities' }
          ],
          performed_by: 'admin@empresa.com',
          reason: 'Migración duplicada'
        }
      ];

      setRollbackOperations(mockOperations);
    } catch (error) {
      console.error('Error loading rollback operations:', error);
    }
  }, []);

  useEffect(() => {
    loadRollbackPoints();
    loadRollbackOperations();
  }, [loadRollbackPoints, loadRollbackOperations]);

  // Execute rollback
  const executeRollback = useCallback(async () => {
    if (!selectedPoint || !selectedRecoveryOption) return;

    setShowConfirmDialog(false);
    setIsRollingBack(true);
    setRollbackProgress(0);

    try {
      // Simulate rollback process
      const totalSteps = 10;
      for (let i = 0; i <= totalSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setRollbackProgress((i / totalSteps) * 100);
      }

      toast.success('Rollback completado exitosamente');
      loadRollbackPoints();
      loadRollbackOperations();
    } catch (error) {
      console.error('Rollback error:', error);
      toast.error('Error durante el rollback');
    } finally {
      setIsRollingBack(false);
      setRollbackProgress(0);
      setSelectedPoint(null);
      setSelectedRecoveryOption(null);
    }
  }, [selectedPoint, selectedRecoveryOption, loadRollbackPoints, loadRollbackOperations]);

  // Create manual backup
  const createManualBackup = useCallback(async () => {
    if (!migration) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Punto de respaldo creado correctamente');
      loadRollbackPoints();
    } catch (error) {
      toast.error('Error al crear punto de respaldo');
    } finally {
      setIsLoading(false);
    }
  }, [migration, loadRollbackPoints]);

  // Download backup
  const downloadBackup = useCallback((point: RollbackPoint) => {
    toast.success(`Descargando backup: ${point.id}`);
  }, []);

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get status badge
  const getStatusBadge = (status: RollbackPoint['status']) => {
    const styles = {
      available: { variant: 'default' as const, icon: CheckCircle, text: 'Disponible', className: 'bg-green-500/10 text-green-600 border-green-500/30' },
      expired: { variant: 'secondary' as const, icon: Clock, text: 'Expirado', className: 'bg-muted text-muted-foreground' },
      partial: { variant: 'outline' as const, icon: AlertTriangle, text: 'Parcial', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
      locked: { variant: 'destructive' as const, icon: Lock, text: 'Bloqueado', className: 'bg-red-500/10 text-red-600 border-red-500/30' }
    };
    const style = styles[status];
    const Icon = style.icon;
    return (
      <Badge variant={style.variant} className={style.className}>
        <Icon className="h-3 w-3 mr-1" />
        {style.text}
      </Badge>
    );
  };

  // Get operation status badge
  const getOperationStatusBadge = (status: RollbackOperation['status']) => {
    const styles: Record<RollbackOperation['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock; text: string; className?: string }> = {
      pending: { variant: 'secondary', icon: Clock, text: 'Pendiente' },
      running: { variant: 'default', icon: RefreshCw, text: 'En Progreso' },
      completed: { variant: 'default', icon: CheckCircle, text: 'Completado', className: 'bg-green-500 text-white' },
      failed: { variant: 'destructive', icon: XCircle, text: 'Fallido' },
      cancelled: { variant: 'outline', icon: XCircle, text: 'Cancelado' }
    };
    const style = styles[status];
    const Icon = style.icon;
    return (
      <Badge variant={style.variant} className={style.className || ''}>
        <Icon className={cn("h-3 w-3 mr-1", status === 'running' && "animate-spin")} />
        {style.text}
      </Badge>
    );
  };

  // Get risk badge
  const getRiskBadge = (level: RecoveryOption['risk_level']) => {
    const styles = {
      low: { className: 'bg-green-500/10 text-green-600 border-green-500/30', text: 'Bajo' },
      medium: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/30', text: 'Medio' },
      high: { className: 'bg-red-500/10 text-red-600 border-red-500/30', text: 'Alto' }
    };
    const style = styles[level];
    return (
      <Badge variant="outline" className={style.className}>
        Riesgo: {style.text}
      </Badge>
    );
  };

  // Filter rollback points
  const filteredPoints = rollbackPoints.filter(point =>
    point.migration_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!migration) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Sistema de Rollback</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Selecciona una migración para gestionar sus puntos de recuperación y opciones de rollback.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
            <RotateCcw className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Rollback y Recuperación</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona puntos de restauración y recuperación de datos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadRollbackPoints()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button 
            size="sm"
            onClick={createManualBackup}
            disabled={isLoading}
          >
            <Archive className="h-4 w-4 mr-2" />
            Crear Backup Manual
          </Button>
        </div>
      </div>

      {/* Rollback in Progress Alert */}
      {isRollingBack && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <RefreshCw className="h-5 w-5 text-amber-500 animate-spin" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-700 dark:text-amber-400">
                  Rollback en Progreso
                </h4>
                <p className="text-sm text-muted-foreground">
                  Revirtiendo cambios... No cierres esta ventana.
                </p>
                <Progress value={rollbackProgress} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(rollbackProgress)}% completado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="points" className="gap-2">
            <Archive className="h-4 w-4" />
            Puntos de Restauración
          </TabsTrigger>
          <TabsTrigger value="recovery" className="gap-2">
            <Undo2 className="h-4 w-4" />
            Opciones de Recuperación
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Rollback Points Tab */}
        <TabsContent value="points" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar puntos de restauración..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Points List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredPoints.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Archive className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      No hay puntos de restauración disponibles
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredPoints.map((point) => (
                  <Card 
                    key={point.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedPoint?.id === point.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedPoint(point)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            point.is_automatic ? "bg-blue-500/10" : "bg-purple-500/10"
                          )}>
                            {point.is_automatic ? (
                              <Clock className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Archive className="h-5 w-5 text-purple-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{point.migration_name}</h4>
                              {getStatusBadge(point.status)}
                              {point.is_automatic && (
                                <Badge variant="outline" className="text-xs">
                                  Automático
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              ID: {point.id} • Creado {formatDistanceToNow(new Date(point.created_at), { locale: es, addSuffix: true })}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Database className="h-3 w-3" />
                                {point.records_count.toLocaleString()} registros
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive className="h-3 w-3" />
                                {formatBytes(point.size_bytes)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FileWarning className="h-3 w-3" />
                                {point.tables_affected.length} tablas
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {point.tables_affected.map((table) => (
                                <Badge key={table} variant="secondary" className="text-xs">
                                  {table}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadBackup(point);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      {point.expires_at && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Expira {formatDistanceToNow(new Date(point.expires_at), { locale: es, addSuffix: true })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Selected Point Actions */}
          {selectedPoint && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Punto seleccionado: {selectedPoint.id}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPoint.records_count.toLocaleString()} registros en {selectedPoint.tables_affected.length} tablas
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPoint(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab('recovery')}
                    >
                      Configurar Rollback
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recovery Options Tab */}
        <TabsContent value="recovery" className="space-y-4">
          {!selectedPoint ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Archive className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">
                  Selecciona un punto de restauración primero
                </p>
                <Button variant="outline" onClick={() => setActiveTab('points')}>
                  Ver Puntos de Restauración
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Current Selection Info */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Archive className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Punto de restauración seleccionado</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPoint.id} • {selectedPoint.records_count.toLocaleString()} registros
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('points')}>
                      Cambiar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Options */}
              <div className="grid gap-4">
                {recoveryOptions.map((option) => (
                  <Card 
                    key={option.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedRecoveryOption?.id === option.id && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedRecoveryOption(option);
                      if (option.type === 'selective') {
                        setSelectiveTables([]);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            option.type === 'full' && "bg-red-500/10",
                            option.type === 'partial' && "bg-amber-500/10",
                            option.type === 'selective' && "bg-green-500/10"
                          )}>
                            {option.type === 'full' && <RotateCcw className="h-5 w-5 text-red-500" />}
                            {option.type === 'partial' && <Undo2 className="h-5 w-5 text-amber-500" />}
                            {option.type === 'selective' && <Shield className="h-5 w-5 text-green-500" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{option.title}</h4>
                              {getRiskBadge(option.risk_level)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~{option.estimated_time_minutes} min
                              </span>
                              {option.affects_tables.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Database className="h-3 w-3" />
                                  {option.affects_tables.length} tablas afectadas
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            selectedRecoveryOption?.id === option.id 
                              ? "border-primary bg-primary" 
                              : "border-muted-foreground/30"
                          )}>
                            {selectedRecoveryOption?.id === option.id && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selective Tables Selection */}
              {selectedRecoveryOption?.type === 'selective' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Seleccionar Tablas</CardTitle>
                    <CardDescription>
                      Elige las tablas que deseas revertir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedPoint.tables_affected.map((table) => (
                        <label
                          key={table}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                            selectiveTables.includes(table)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          )}
                        >
                          <Checkbox
                            checked={selectiveTables.includes(table)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectiveTables([...selectiveTables, table]);
                              } else {
                                setSelectiveTables(selectiveTables.filter(t => t !== table));
                              }
                            }}
                          />
                          <span className="text-sm">{table}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Execute Button */}
              {selectedRecoveryOption && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedRecoveryOption(null);
                      setSelectiveTables([]);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={
                      selectedRecoveryOption.type === 'selective' && 
                      selectiveTables.length === 0
                    }
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Ejecutar Rollback
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-[450px]">
            <div className="space-y-3">
              {rollbackOperations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      No hay operaciones de rollback en el historial
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rollbackOperations.map((operation) => (
                  <Card key={operation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            operation.status === 'completed' && "bg-green-500/10",
                            operation.status === 'failed' && "bg-red-500/10",
                            operation.status === 'running' && "bg-blue-500/10",
                            operation.status === 'pending' && "bg-muted"
                          )}>
                            {operation.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {operation.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                            {operation.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                            {operation.status === 'pending' && <Clock className="h-5 w-5 text-muted-foreground" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">Operación {operation.id}</h4>
                              {getOperationStatusBadge(operation.status)}
                            </div>
                            {operation.reason && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Motivo: {operation.reason}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {operation.started_at && (
                                <span>
                                  Iniciado: {format(new Date(operation.started_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </span>
                              )}
                              <span>
                                {operation.records_processed}/{operation.records_total} registros
                              </span>
                              {operation.performed_by && (
                                <span>Por: {operation.performed_by}</span>
                              )}
                            </div>
                            
                            {/* Progress for running operations */}
                            {operation.status === 'running' && (
                              <Progress 
                                value={(operation.records_processed / operation.records_total) * 100} 
                                className="h-1.5 mt-2 w-48"
                              />
                            )}
                            
                            {/* Errors */}
                            {operation.errors.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {operation.errors.slice(0, 3).map((error, idx) => (
                                  <div 
                                    key={idx}
                                    className="flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1"
                                  >
                                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                    <span>{error.message}</span>
                                    {error.table && (
                                      <Badge variant="outline" className="text-xs">
                                        {error.table}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                                {operation.errors.length > 3 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{operation.errors.length - 3} errores más
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar Rollback
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Estás a punto de revertir los cambios de la migración. Esta acción:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Eliminará {selectedPoint?.records_count.toLocaleString()} registros migrados</li>
                  <li>Afectará {selectedRecoveryOption?.type === 'selective' 
                    ? selectiveTables.length 
                    : selectedPoint?.tables_affected.length} tablas</li>
                  <li>Puede tardar aproximadamente {selectedRecoveryOption?.estimated_time_minutes} minutos</li>
                </ul>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Advertencia:</strong> Esta operación no se puede deshacer fácilmente. 
                    Asegúrate de tener un backup reciente.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRollback}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Confirmar Rollback
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CRMRollbackPanel;
