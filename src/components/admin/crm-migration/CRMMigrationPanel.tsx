import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, 
  Upload,
  Database,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Sparkles,
  FileSpreadsheet,
  Zap,
  History,
  Target,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useCRMMigration, CRMConnector, CRMMigration, CRMFieldMapping, MigrationAnalysis } from '@/hooks/admin/integrations/useCRMMigration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CRMMigrationPanelProps {
  className?: string;
}

export function CRMMigrationPanel({ className }: CRMMigrationPanelProps) {
  const [activeTab, setActiveTab] = useState('import');
  const [selectedConnector, setSelectedConnector] = useState<CRMConnector | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<MigrationAnalysis | null>(null);
  const [localMappings, setLocalMappings] = useState<Partial<CRMFieldMapping>[]>([]);
  const [migrationName, setMigrationName] = useState('');

  const {
    connectors,
    migrations,
    activeMigration,
    isLoading,
    isAnalyzing,
    isRunning,
    progress,
    fetchConnectors,
    fetchMigrations,
    fetchTemplates,
    analyzeFile,
    createMigration,
    runMigration,
    pauseMigration,
    cancelMigration,
    resumeMigration,
    generateAIMappings
  } = useCRMMigration();

  useEffect(() => {
    fetchConnectors();
    fetchMigrations();
    fetchTemplates();
  }, [fetchConnectors, fetchMigrations, fetchTemplates]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsUploading(true);

    try {
      const content = await file.text();
      const fileType = file.name.endsWith('.csv') ? 'csv' : file.name.endsWith('.json') ? 'json' : 'csv';
      const analysis = await analyzeFile(content, fileType as 'csv' | 'json' | 'xml' | 'xlsx');
      
      if (analysis) {
        setCurrentAnalysis(analysis);
        setMigrationName(`Migración ${analysis.detected_crm || 'CRM'} - ${new Date().toLocaleDateString('es-ES')}`);
        
        if (analysis.detected_crm) {
          const connector = connectors.find(c => c.connector_key === analysis.detected_crm);
          if (connector) {
            setSelectedConnector(connector);
          }
        }
        
        // Pre-cargar mapeos sugeridos
        if (analysis.suggested_mappings) {
          setLocalMappings(analysis.suggested_mappings.map(m => ({
            source_field: m.source_field,
            target_table: m.target_table,
            target_field: m.target_field,
            ai_confidence: m.confidence
          })));
        }
        
        toast.success(`Archivo analizado: ${analysis.detected_fields?.length || 0} campos detectados`);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast.error('Error al analizar el archivo');
    } finally {
      setIsUploading(false);
    }
  }, [analyzeFile, connectors]);

  const handleGenerateAIMappings = useCallback(async () => {
    if (!currentAnalysis?.detected_fields) return;

    try {
      const mappings = await generateAIMappings(currentAnalysis.detected_fields, selectedConnector?.connector_key);
      if (mappings) {
        setLocalMappings(mappings);
        toast.success('Mapeos generados con IA');
      }
    } catch (error) {
      console.error('Error generating AI mappings:', error);
      toast.error('Error al generar mapeos con IA');
    }
  }, [currentAnalysis, selectedConnector, generateAIMappings]);

  const handleStartMigration = useCallback(async () => {
    if (!currentAnalysis || !uploadedFile) return;

    try {
      const content = await uploadedFile.text();
      const fileType = uploadedFile.name.endsWith('.csv') ? 'csv' : uploadedFile.name.endsWith('.json') ? 'json' : 'csv';
      
      const migration = await createMigration(
        migrationName,
        selectedConnector?.connector_key || 'universal',
        content,
        fileType as 'csv' | 'json' | 'xml' | 'xlsx',
        localMappings
      );

      if (migration) {
        await runMigration(migration.id, localMappings);
        toast.success('Migración iniciada');
        setActiveTab('progress');
      }
    } catch (error) {
      console.error('Error starting migration:', error);
      toast.error('Error al iniciar migración');
    }
  }, [currentAnalysis, uploadedFile, migrationName, selectedConnector, createMigration, runMigration, localMappings]);

  const handlePauseMigration = useCallback(async () => {
    if (!activeMigration) return;
    await pauseMigration(activeMigration.id);
    toast.info('Migración pausada');
  }, [activeMigration, pauseMigration]);

  const handleResumeMigration = useCallback(async () => {
    if (!activeMigration) return;
    await resumeMigration(activeMigration.id);
    toast.info('Migración reanudada');
  }, [activeMigration, resumeMigration]);

  const handleCancelMigration = useCallback(async () => {
    if (!activeMigration) return;
    await cancelMigration(activeMigration.id);
    toast.warning('Migración cancelada');
    setActiveTab('import');
  }, [activeMigration, cancelMigration]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />En progreso</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-500/30"><Pause className="h-3 w-3 mr-1" />Pausado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallido</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderConnectorSelection = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {connectors.map((connector) => (
        <Card 
          key={connector.id}
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            selectedConnector?.id === connector.id && "border-primary bg-primary/5"
          )}
          onClick={() => setSelectedConnector(connector)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            {connector.logo_url ? (
              <img src={connector.logo_url} alt={connector.connector_name} className="h-8 w-8 object-contain" />
            ) : (
              <Database className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{connector.connector_name}</p>
              <p className="text-xs text-muted-foreground">{connector.vendor}</p>
            </div>
            {selectedConnector?.id === connector.id && (
              <CheckCircle className="h-4 w-4 text-primary" />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFileUpload = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
        <Input
          type="file"
          accept=".csv,.json,.xlsx"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
          disabled={isUploading || isAnalyzing}
        />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            {isUploading || isAnalyzing ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">
                {isUploading || isAnalyzing ? 'Analizando archivo...' : 'Arrastra un archivo o haz clic para seleccionar'}
              </p>
              <p className="text-sm text-muted-foreground">
                Soporta CSV, JSON, XLSX
              </p>
            </div>
          </div>
        </Label>
      </div>

      {uploadedFile && currentAnalysis && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="font-medium">{uploadedFile.name}</span>
              </div>
              <Badge variant="outline">{currentAnalysis.detected_crm || 'Universal'}</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Registros</p>
                <p className="font-semibold text-lg">{currentAnalysis.total_records.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Campos</p>
                <p className="font-semibold text-lg">{currentAnalysis.detected_fields?.length || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Calidad</p>
                <div className="flex items-center gap-2">
                  <Progress value={currentAnalysis.data_quality_score} className="h-2 flex-1" />
                  <span className="font-semibold">{currentAnalysis.data_quality_score}%</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Mapeos sugeridos</p>
                <p className="font-semibold text-lg">{currentAnalysis.suggested_mappings?.length || 0}</p>
              </div>
            </div>

            {currentAnalysis.warnings && currentAnalysis.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {currentAnalysis.warnings.slice(0, 3).map((warning, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMappingConfig = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Mapeo de Campos</h3>
          <p className="text-sm text-muted-foreground">Configura cómo se transformarán los datos</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateAIMappings}
          disabled={!currentAnalysis || isLoading}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generar con IA
        </Button>
      </div>

      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-4 space-y-3">
          {currentAnalysis?.detected_fields?.map((field, idx) => {
            const mapping = localMappings.find(m => m.source_field === field.name);
            
            return (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{field.name}</span>
                    <Badge variant="outline" className="text-xs">{field.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Ej: {field.sample_values?.slice(0, 2).join(', ')}
                  </p>
                </div>
                
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1">
                  <Select
                    value={mapping?.target_field || ''}
                    onValueChange={(value) => {
                      setLocalMappings(prev => {
                        const existing = prev.findIndex(m => m.source_field === field.name);
                        if (existing >= 0) {
                          const updated = [...prev];
                          updated[existing] = { ...updated[existing], target_field: value };
                          return updated;
                        }
                        return [...prev, {
                          source_field: field.name,
                          target_field: value,
                          target_table: 'companies',
                          ai_confidence: 0.5
                        }];
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar campo destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Teléfono</SelectItem>
                      <SelectItem value="address">Dirección</SelectItem>
                      <SelectItem value="city">Ciudad</SelectItem>
                      <SelectItem value="country">País</SelectItem>
                      <SelectItem value="cif">CIF</SelectItem>
                      <SelectItem value="sector">Sector</SelectItem>
                      <SelectItem value="notes">Notas</SelectItem>
                      <SelectItem value="custom">Campo Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mapping?.ai_confidence && (
                  <Badge 
                    variant={mapping.ai_confidence > 0.8 ? "default" : mapping.ai_confidence > 0.5 ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {(mapping.ai_confidence * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const renderMigrationProgress = () => (
    <div className="space-y-6">
      {activeMigration && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{activeMigration.migration_name}</CardTitle>
                <CardDescription>
                  Iniciada {formatDistanceToNow(new Date(activeMigration.started_at || activeMigration.created_at), { addSuffix: true, locale: es })}
                </CardDescription>
              </div>
              {getStatusBadge(activeMigration.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{activeMigration.migrated_records || 0} / {activeMigration.total_records}</span>
              </div>
              <Progress 
                value={activeMigration.total_records ? ((activeMigration.migrated_records || 0) / activeMigration.total_records) * 100 : 0} 
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-500">{activeMigration.migrated_records || 0}</p>
                <p className="text-xs text-muted-foreground">Exitosos</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-500">{activeMigration.failed_records || 0}</p>
                <p className="text-xs text-muted-foreground">Errores</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-500">{activeMigration.skipped_records || 0}</p>
                <p className="text-xs text-muted-foreground">Omitidos</p>
              </div>
            </div>

            <div className="flex gap-2">
              {activeMigration.status === 'running' && (
                <Button variant="outline" onClick={handlePauseMigration} className="gap-2">
                  <Pause className="h-4 w-4" />
                  Pausar
                </Button>
              )}
              {activeMigration.status === 'paused' && (
                <Button variant="default" onClick={handleResumeMigration} className="gap-2">
                  <Play className="h-4 w-4" />
                  Reanudar
                </Button>
              )}
              {['running', 'paused'].includes(activeMigration.status) && (
                <Button variant="destructive" onClick={handleCancelMigration} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderHistory = () => (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {migrations.map((migration) => (
          <Card key={migration.id} className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{migration.migration_name}</span>
                {getStatusBadge(migration.status)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{migration.source_crm}</span>
                <span>•</span>
                <span>{migration.total_records?.toLocaleString()} registros</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(migration.created_at), { addSuffix: true, locale: es })}</span>
              </div>
              {migration.status === 'completed' && (
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="text-green-500">{migration.migrated_records} OK</span>
                  <span className="text-red-500">{migration.failed_records} errores</span>
                  <span className="text-yellow-500">{migration.skipped_records} omitidos</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {migrations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No hay migraciones anteriores</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Migración CRM + IA</CardTitle>
              <CardDescription>
                Motor inteligente de migración de datos
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              fetchConnectors();
              fetchMigrations();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="mapping" className="gap-2" disabled={!currentAnalysis}>
              <Target className="h-4 w-4" />
              Mapeo
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2" disabled={!activeMigration}>
              <Zap className="h-4 w-4" />
              Progreso
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="flex-1 mt-0 space-y-6">
            <div className="space-y-2">
              <Label>1. Selecciona el CRM de origen (opcional)</Label>
              {renderConnectorSelection()}
            </div>
            
            <div className="space-y-2">
              <Label>2. Sube el archivo de exportación</Label>
              {renderFileUpload()}
            </div>

            {currentAnalysis && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('mapping')} className="gap-2">
                  Continuar al Mapeo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="flex-1 mt-0 space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la migración</Label>
              <Input
                value={migrationName}
                onChange={(e) => setMigrationName(e.target.value)}
                placeholder="Ej: Migración Salesforce Q1 2025"
              />
            </div>

            {renderMappingConfig()}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveTab('import')}>
                Volver
              </Button>
              <Button 
                onClick={handleStartMigration}
                disabled={!migrationName || localMappings.length === 0 || isLoading || isRunning}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar Migración
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="flex-1 mt-0">
            {renderMigrationProgress()}
          </TabsContent>

          <TabsContent value="history" className="flex-1 mt-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Migraciones Anteriores</h3>
              <Badge variant="outline">{migrations.length} total</Badge>
            </div>
            {renderHistory()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CRMMigrationPanel;
