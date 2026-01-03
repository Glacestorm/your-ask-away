/**
 * Panel de Importación Inteligente con IA para Maestros ERP
 * Soporta cualquier formato y muestra resultados detallados
 */

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Sparkles,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  Play,
  X,
  Users,
  Truck,
  Package,
  Receipt,
  Wallet,
  Warehouse,
  CreditCard,
  Hash,
  ArrowRight,
  Table,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMaestrosAIImport, MaestrosEntityType, ImportRecord } from '@/hooks/erp/useMaestrosAIImport';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { motion, AnimatePresence } from 'framer-motion';

interface MaestrosAIImportPanelProps {
  defaultEntityType?: MaestrosEntityType;
  onImportComplete?: (result: unknown) => void;
  className?: string;
}

const ENTITY_CONFIG: Record<MaestrosEntityType, { label: string; icon: React.ReactNode; color: string }> = {
  customers: { label: 'Clientes', icon: <Users className="h-4 w-4" />, color: 'text-blue-600' },
  suppliers: { label: 'Proveedores', icon: <Truck className="h-4 w-4" />, color: 'text-green-600' },
  items: { label: 'Artículos', icon: <Package className="h-4 w-4" />, color: 'text-purple-600' },
  taxes: { label: 'Impuestos', icon: <Receipt className="h-4 w-4" />, color: 'text-orange-600' },
  payment_terms: { label: 'Cond. Pago', icon: <Wallet className="h-4 w-4" />, color: 'text-cyan-600' },
  warehouses: { label: 'Almacenes', icon: <Warehouse className="h-4 w-4" />, color: 'text-amber-600' },
  bank_accounts: { label: 'Cuentas Bancarias', icon: <CreditCard className="h-4 w-4" />, color: 'text-indigo-600' },
  series: { label: 'Series', icon: <Hash className="h-4 w-4" />, color: 'text-pink-600' }
};

const SUPPORTED_FORMATS = [
  { ext: 'CSV', mime: 'text/csv', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { ext: 'Excel', mime: 'application/vnd.openxmlformats', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { ext: 'JSON', mime: 'application/json', icon: <FileCode className="h-4 w-4" /> },
  { ext: 'XML', mime: 'application/xml', icon: <FileCode className="h-4 w-4" /> },
  { ext: 'TXT', mime: 'text/plain', icon: <FileText className="h-4 w-4" /> },
  { ext: 'PDF', mime: 'application/pdf', icon: <FileText className="h-4 w-4" /> },
  { ext: 'Imagen', mime: 'image/*', icon: <FileImage className="h-4 w-4" /> }
];

export function MaestrosAIImportPanel({
  defaultEntityType = 'customers',
  onImportComplete,
  className
}: MaestrosAIImportPanelProps) {
  const { currentCompany } = useERPContext();
  const [entityType, setEntityType] = useState<MaestrosEntityType>(defaultEntityType);
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'analysis' | 'records'>('upload');
  const [options, setOptions] = useState({
    autoCreate: true,
    updateExisting: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isProcessing,
    progress,
    currentStep,
    result,
    error,
    analyzeFile,
    executeImport,
    reset
  } = useMaestrosAIImport();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      reset();
    }
  }, [reset]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      reset();
    }
  }, [reset]);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    const analysisResult = await analyzeFile(file, entityType, currentCompany?.id);
    if (analysisResult?.success) {
      setActiveTab('analysis');
    }
  }, [file, entityType, currentCompany?.id, analyzeFile]);

  const handleImport = useCallback(async () => {
    if (!file) return;
    const importResult = await executeImport(file, entityType, currentCompany?.id, options);
    if (importResult?.success) {
      onImportComplete?.(importResult);
    }
  }, [file, entityType, currentCompany?.id, options, executeImport, onImportComplete]);

  const handleReset = useCallback(() => {
    setFile(null);
    reset();
    setActiveTab('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [reset]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv':
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
      case 'json':
      case 'xml':
        return <FileCode className="h-8 w-8 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileImage className="h-8 w-8 text-purple-600" />;
      default:
        return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Importación Inteligente con IA
            </CardTitle>
            <CardDescription>
              Importa datos desde cualquier formato - la IA detecta y mapea automáticamente
            </CardDescription>
          </div>
          {result && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Nueva importación
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entity Type Selector */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium min-w-[100px]">Tipo de datos:</Label>
          <Select value={entityType} onValueChange={(v) => setEntityType(v as MaestrosEntityType)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ENTITY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span className={config.color}>{config.icon}</span>
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="h-3 w-3 mr-1" /> Subir archivo
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs" disabled={!result}>
              <Zap className="h-3 w-3 mr-1" /> Análisis IA
            </TabsTrigger>
            <TabsTrigger value="records" className="text-xs" disabled={!result?.records?.length}>
              <Table className="h-3 w-3 mr-1" /> Registros
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
                "hover:border-primary/50 hover:bg-primary/5",
                file && "border-primary bg-primary/5",
                isProcessing && "pointer-events-none opacity-50"
              )}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,.xml,.txt,.pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file-preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-3"
                  >
                    {getFileIcon(file.name)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cambiar archivo
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Arrastra un archivo o haz clic para seleccionar</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        La IA detectará automáticamente el formato y los campos
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 mt-3">
                      {SUPPORTED_FORMATS.map((format) => (
                        <Badge key={format.ext} variant="secondary" className="text-xs gap-1">
                          {format.icon}
                          {format.ext}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Options */}
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Crear registros automáticamente</Label>
                  <Switch
                    checked={options.autoCreate}
                    onCheckedChange={(v) => setOptions(prev => ({ ...prev, autoCreate: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Actualizar registros existentes</Label>
                  <Switch
                    checked={options.updateExisting}
                    onCheckedChange={(v) => setOptions(prev => ({ ...prev, updateExisting: v }))}
                  />
                </div>
              </motion.div>
            )}

            {/* Progress */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{currentStep}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Action Buttons */}
            {file && !isProcessing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Analizar primero
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleImport}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Importar directamente
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Summary */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{result.summary?.total || 0}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{result.summary?.valid || 0}</div>
                    <div className="text-xs text-muted-foreground">Válidos</div>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{result.summary?.warnings || 0}</div>
                    <div className="text-xs text-muted-foreground">Advertencias</div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{result.summary?.errors || 0}</div>
                    <div className="text-xs text-muted-foreground">Errores</div>
                  </div>
                </div>

                {/* Analysis Details */}
                {result.analysis && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Análisis del archivo</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Formato detectado:</span>
                        <Badge variant="outline">{result.analysis.format_detected}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Columnas encontradas:</span>
                        <span>{result.analysis.columns_detected?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confianza del mapeo:</span>
                        <Badge variant={result.analysis.confidence > 0.8 ? 'default' : 'secondary'}>
                          {Math.round((result.analysis.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Field Mapping */}
                {result.analysis?.field_mapping && Object.keys(result.analysis.field_mapping).length > 0 && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Mapeo de campos</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-1">
                        {Object.entries(result.analysis.field_mapping).map(([source, target]) => (
                          <div key={source} className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="font-mono text-xs">{source}</Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge className="font-mono text-xs">{target}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div className="space-y-1">
                    {result.suggestions.map((sug, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        {sug}
                      </div>
                    ))}
                  </div>
                )}

                {/* Import Button */}
                {result.ready_to_import && (
                  <Button className="w-full" onClick={handleImport} disabled={isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Importar {result.summary?.valid || 0} registros válidos
                  </Button>
                )}
              </motion.div>
            )}
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-4">
            {result?.records && result.records.length > 0 && (
              <ScrollArea className="h-[400px] rounded-lg border">
                <div className="p-4 space-y-2">
                  {result.records.map((record: ImportRecord, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(
                        "p-3 rounded-lg border",
                        record.status === 'valid' && "bg-green-50/50 dark:bg-green-900/10 border-green-200",
                        record.status === 'warning' && "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200",
                        record.status === 'error' && "bg-red-50/50 dark:bg-red-900/10 border-red-200"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className="font-medium text-sm">Fila {record.row_number}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {record.status}
                        </Badge>
                      </div>
                      
                      {/* Transformed Data Preview */}
                      <div className="mt-2 text-xs space-y-1">
                        {Object.entries(record.transformed_data || {}).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium truncate">{String(value)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Validation Messages */}
                      {record.validation_messages && record.validation_messages.length > 0 && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          {record.validation_messages.map((msg, msgIdx) => (
                            <p key={msgIdx} className="text-xs text-muted-foreground">
                              {msg}
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default MaestrosAIImportPanel;
