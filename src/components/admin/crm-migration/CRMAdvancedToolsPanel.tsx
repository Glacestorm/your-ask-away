import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RotateCcw, 
  Calendar, 
  Copy, 
  Download, 
  History,
  Clock,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  Save,
  Play
} from 'lucide-react';
import { useCRMMigration, CRMMigration } from '@/hooks/admin/integrations/useCRMMigration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CRMAdvancedToolsPanelProps {
  migration: CRMMigration | null;
  onMigrationUpdate?: (migration: CRMMigration) => void;
  className?: string;
}

export function CRMAdvancedToolsPanel({ 
  migration, 
  onMigrationUpdate,
  className 
}: CRMAdvancedToolsPanelProps) {
  const [activeTab, setActiveTab] = useState('rollback');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [templateName, setTemplateName] = useState('');
  const [templatePublic, setTemplatePublic] = useState(false);
  const [history, setHistory] = useState<Array<{ event: string; timestamp: string; details: Record<string, unknown> }>>([]);
  const [rollbackPreview, setRollbackPreview] = useState<{ total: number; message: string } | null>(null);

  const {
    rollbackMigration,
    scheduleMigration,
    createTemplateFromMigration,
    exportMigration,
    getMigrationHistory,
    cloneMigration,
    dryRunRollback
  } = useCRMMigration();

  // === ROLLBACK HANDLERS ===
  const handleDryRunRollback = useCallback(async () => {
    if (!migration) return;
    setIsProcessing(true);
    
    const result = await dryRunRollback(migration.id);
    if (result) {
      setRollbackPreview(result);
      toast.info(result.message);
    }
    
    setIsProcessing(false);
  }, [migration, dryRunRollback]);

  const handleRollback = useCallback(async () => {
    if (!migration) return;
    
    if (!confirm('¿Estás seguro? Esta acción eliminará todos los registros migrados.')) {
      return;
    }
    
    setIsProcessing(true);
    const success = await rollbackMigration(migration.id);
    if (success) {
      toast.success('Rollback completado');
    }
    setIsProcessing(false);
    setRollbackPreview(null);
  }, [migration, rollbackMigration]);

  // === SCHEDULE HANDLERS ===
  const handleSchedule = useCallback(async () => {
    if (!migration) return;
    
    setIsProcessing(true);
    const nextRun = scheduleDate && scheduleTime 
      ? new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString()
      : undefined;
    
    const result = await scheduleMigration(migration.id, {
      enabled: scheduleEnabled,
      next_run: nextRun,
      timezone: 'Europe/Madrid'
    });
    
    if (result) {
      onMigrationUpdate?.(result);
    }
    setIsProcessing(false);
  }, [migration, scheduleEnabled, scheduleDate, scheduleTime, scheduleMigration, onMigrationUpdate]);

  // === TEMPLATE HANDLERS ===
  const handleCreateTemplate = useCallback(async () => {
    if (!migration || !templateName.trim()) {
      toast.error('Ingresa un nombre para el template');
      return;
    }
    
    setIsProcessing(true);
    const result = await createTemplateFromMigration(migration.id, {
      name: templateName,
      is_public: templatePublic
    });
    
    if (result) {
      setTemplateName('');
      toast.success('Template guardado');
    }
    setIsProcessing(false);
  }, [migration, templateName, templatePublic, createTemplateFromMigration]);

  // === EXPORT HANDLERS ===
  const handleExport = useCallback(async (format: 'json' | 'csv') => {
    if (!migration) return;
    
    setIsProcessing(true);
    const result = await exportMigration(migration.id, format);
    
    if (result) {
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(result.data, null, 2) : result.data as string],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsProcessing(false);
  }, [migration, exportMigration]);

  // === HISTORY HANDLERS ===
  const handleLoadHistory = useCallback(async () => {
    if (!migration) return;
    
    setIsProcessing(true);
    const result = await getMigrationHistory(migration.id);
    if (result) {
      setHistory(result.history);
    }
    setIsProcessing(false);
  }, [migration, getMigrationHistory]);

  // === CLONE HANDLER ===
  const handleClone = useCallback(async () => {
    if (!migration) return;
    
    setIsProcessing(true);
    const result = await cloneMigration(migration.id);
    if (result) {
      onMigrationUpdate?.(result);
    }
    setIsProcessing(false);
  }, [migration, cloneMigration, onMigrationUpdate]);

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'created': return <Sparkles className="h-4 w-4 text-blue-500" />;
      case 'started': return <Play className="h-4 w-4 text-green-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'rollback': return <RotateCcw className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!migration) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-8 text-center">
          <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona una migración para ver herramientas avanzadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Herramientas Avanzadas</CardTitle>
              <p className="text-xs text-muted-foreground">
                {migration.migration_name}
              </p>
            </div>
          </div>
          <Badge variant={migration.can_rollback ? 'default' : 'secondary'}>
            {migration.can_rollback ? 'Rollback disponible' : 'Sin rollback'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="rollback" className="text-xs">
              <RotateCcw className="h-3 w-3 mr-1" />
              Rollback
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              Programar
            </TabsTrigger>
            <TabsTrigger value="template" className="text-xs">
              <Save className="h-3 w-3 mr-1" />
              Template
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-3 w-3 mr-1" />
              Exportar
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* ROLLBACK TAB */}
          <TabsContent value="rollback" className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Rollback de Migración</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revertir todos los registros migrados. Esta acción eliminará los datos insertados.
                  </p>
                </div>
              </div>

              {rollbackPreview && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm">
                    <strong>{rollbackPreview.total}</strong> registros serán afectados
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{rollbackPreview.message}</p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDryRunRollback}
                  disabled={isProcessing || !migration.can_rollback}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-1", isProcessing && "animate-spin")} />
                  Simular
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleRollback}
                  disabled={isProcessing || !migration.can_rollback}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Ejecutar Rollback
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Clonar Migración</h4>
                  <p className="text-xs text-muted-foreground">
                    Crear una copia con los mismos mapeos
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClone}
                  disabled={isProcessing}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Clonar
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* SCHEDULE TAB */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-sm">Programación Automática</h4>
                  <p className="text-xs text-muted-foreground">
                    Ejecutar migración en fecha/hora específica
                  </p>
                </div>
                <Switch 
                  checked={scheduleEnabled}
                  onCheckedChange={setScheduleEnabled}
                />
              </div>

              {scheduleEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Fecha</Label>
                    <Input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Hora</Label>
                    <Input 
                      type="time" 
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSchedule}
                disabled={isProcessing}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {scheduleEnabled ? 'Guardar Programación' : 'Cancelar Programación'}
              </Button>
            </div>
          </TabsContent>

          {/* TEMPLATE TAB */}
          <TabsContent value="template" className="space-y-4">
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <div>
                <h4 className="font-medium text-sm">Guardar como Template</h4>
                <p className="text-xs text-muted-foreground">
                  Reutiliza los mapeos en futuras migraciones
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Nombre del Template</Label>
                <Input 
                  placeholder="Ej: Migración desde Salesforce v2"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Template Público</p>
                  <p className="text-xs text-muted-foreground">
                    Compartir con otros usuarios
                  </p>
                </div>
                <Switch 
                  checked={templatePublic}
                  onCheckedChange={setTemplatePublic}
                />
              </div>

              <Button 
                onClick={handleCreateTemplate}
                disabled={isProcessing || !templateName.trim()}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Crear Template
              </Button>
            </div>
          </TabsContent>

          {/* EXPORT TAB */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleExport('json')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FileJson className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">JSON</h4>
                    <p className="text-xs text-muted-foreground">
                      Formato completo
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleExport('csv')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileSpreadsheet className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">CSV</h4>
                    <p className="text-xs text-muted-foreground">
                      Para Excel
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">
                Registros: {migration.total_records} | 
                Migrados: {migration.migrated_records} | 
                Fallidos: {migration.failed_records}
              </p>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Línea de Tiempo</h4>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadHistory}
                disabled={isProcessing}
              >
                <RefreshCw className={cn("h-4 w-4 mr-1", isProcessing && "animate-spin")} />
                Cargar
              </Button>
            </div>

            <ScrollArea className="h-[250px]">
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((entry, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-lg border">
                      {getEventIcon(entry.event)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium capitalize">{entry.event}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(entry.timestamp), { 
                              addSuffix: true, 
                              locale: es 
                            })}
                          </span>
                        </div>
                        {entry.details && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {JSON.stringify(entry.details).substring(0, 100)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Pulsa "Cargar" para ver el historial</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CRMAdvancedToolsPanel;
