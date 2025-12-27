/**
 * ModuleRollbackPanel - Sistema de rollback inteligente
 * Selector visual, preview de cambios, validación pre-rollback
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  RefreshCw, 
  RotateCcw,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Plus,
  Play
} from 'lucide-react';
import { useModuleRollback, RollbackPoint, RollbackValidation } from '@/hooks/admin/useModuleRollback';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleRollbackPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleRollbackPanel({ moduleKey, className }: ModuleRollbackPanelProps) {
  const [selectedPoint, setSelectedPoint] = useState<RollbackPoint | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const {
    rollbackPoints,
    rollbackHistory,
    validation,
    isLoading,
    isValidating,
    isExecuting,
    fetchRollbackPoints,
    fetchRollbackHistory,
    validateRollback,
    executeRollback,
    createRollbackPoint,
    clearValidation
  } = useModuleRollback(moduleKey);

  useEffect(() => {
    if (moduleKey) {
      fetchRollbackPoints();
      fetchRollbackHistory();
    }
  }, [moduleKey, fetchRollbackPoints, fetchRollbackHistory]);

  const handleSelectPoint = async (point: RollbackPoint) => {
    setSelectedPoint(point);
    clearValidation();
    setShowValidation(false);
  };

  const handleValidate = async () => {
    if (!selectedPoint) return;
    await validateRollback(selectedPoint.version);
    setShowValidation(true);
  };

  const handleExecuteRollback = async () => {
    if (!selectedPoint) return;
    const success = await executeRollback(selectedPoint.version, rollbackReason);
    if (success) {
      setSelectedPoint(null);
      setRollbackReason('');
      clearValidation();
      setShowValidation(false);
    }
  };

  const handleCreatePoint = async () => {
    await createRollbackPoint('Manual backup before changes');
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'none': return 'text-green-600 bg-green-500/10';
      case 'low': return 'text-yellow-600 bg-yellow-500/10';
      case 'medium': return 'text-orange-600 bg-orange-500/10';
      case 'high': return 'text-red-600 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para gestionar rollbacks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
              <RotateCcw className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Rollback</CardTitle>
              <CardDescription className="text-xs">
                {rollbackPoints.length} puntos disponibles
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCreatePoint} className="gap-1">
              <Plus className="h-4 w-4" /> Crear Punto
            </Button>
            <Button variant="ghost" size="icon" onClick={() => fetchRollbackPoints()} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Selected Point & Validation */}
        <AnimatePresence>
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">Rollback a v{selectedPoint.version}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedPoint.timestamp), "dd MMM yyyy HH:mm", { locale: es })}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleValidate}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-1" /> Validar
                    </>
                  )}
                </Button>
              </div>

              {/* Validation Results */}
              {showValidation && validation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-3 border-t"
                >
                  <div className="flex items-center gap-2">
                    {validation.isValid ? (
                      <Badge variant="default" className="gap-1 bg-green-500">
                        <CheckCircle className="h-3 w-3" /> Validación OK
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Errores detectados
                      </Badge>
                    )}
                    <Badge className={cn("text-xs", getRiskColor(validation.dataLossRisk))}>
                      Riesgo: {validation.dataLossRisk}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" /> {validation.estimatedDowntime}
                    </Badge>
                  </div>

                  {validation.warnings.length > 0 && (
                    <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <span className="text-xs font-medium text-yellow-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Advertencias
                      </span>
                      <ul className="text-xs text-yellow-600/80 mt-1">
                        {validation.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </div>
                  )}

                  {validation.errors.length > 0 && (
                    <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                      <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Errores
                      </span>
                      <ul className="text-xs text-red-600/80 mt-1">
                        {validation.errors.map((e, i) => <li key={i}>• {e}</li>)}
                      </ul>
                    </div>
                  )}

                  {validation.affectedDependencies.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">Dependencias afectadas:</span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {validation.affectedDependencies.map(d => (
                          <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Execute Rollback */}
                  {validation.isValid && (
                    <div className="pt-3 border-t space-y-2">
                      <Input
                        placeholder="Razón del rollback..."
                        value={rollbackReason}
                        onChange={(e) => setRollbackReason(e.target.value)}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            className="w-full gap-1" 
                            variant="destructive"
                            disabled={!rollbackReason || isExecuting}
                          >
                            {isExecuting ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Play className="h-4 w-4" /> Ejecutar Rollback
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar Rollback?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se revertirá el módulo a la versión {selectedPoint.version}. 
                              Esta acción puede afectar a usuarios activos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleExecuteRollback}>
                              Confirmar Rollback
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rollback Points */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Puntos de Rollback
          </h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {rollbackPoints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Sin puntos de rollback</p>
                </div>
              ) : (
                rollbackPoints.map((point) => (
                  <div
                    key={point.id}
                    className={cn(
                      "p-3 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-sm",
                      selectedPoint?.id === point.id && "ring-2 ring-primary",
                      point.status !== 'available' && "opacity-50"
                    )}
                    onClick={() => point.status === 'available' && handleSelectPoint(point)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">v{point.version}</span>
                        <Badge 
                          variant={point.status === 'available' ? 'secondary' : 'outline'} 
                          className="text-xs"
                        >
                          {point.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(point.timestamp), { locale: es, addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{point.reason}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Rollback History */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de Rollbacks
          </h4>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {rollbackHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sin historial</p>
              ) : (
                rollbackHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    {getStatusIcon(entry.status)}
                    <div className="flex-1">
                      <span className="text-sm">
                        v{entry.fromVersion} → v{entry.toVersion}
                      </span>
                      <p className="text-xs text-muted-foreground">{entry.notes}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.executedAt), { locale: es, addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModuleRollbackPanel;
