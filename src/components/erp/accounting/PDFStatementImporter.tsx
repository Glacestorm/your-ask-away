/**
 * PDFStatementImporter - Componente para importar estados financieros PDF con OCR multi-país
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronRight,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Upload,
  X,
  Sparkles,
  FileUp,
  Eye,
  Download,
  History,
  AlertTriangle
} from 'lucide-react';
import { useERPStatementImport, AccountingPlan } from '@/hooks/erp/useERPStatementImport';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PDFStatementImporterProps {
  className?: string;
  onImportComplete?: (data: unknown) => void;
}

const STATEMENT_TYPES = [
  { value: 'balance_sheet', label: 'Balance de Situación', icon: '📊' },
  { value: 'income_statement', label: 'Cuenta de Pérdidas y Ganancias', icon: '📈' },
  { value: 'cash_flow', label: 'Estado de Flujos de Efectivo', icon: '💰' },
  { value: 'trial_balance', label: 'Balance de Sumas y Saldos', icon: '⚖️' },
];

const COUNTRY_FLAGS: Record<string, string> = {
  'ES': '🇪🇸',
  'FR': '🇫🇷',
  'DE': '🇩🇪',
  'IT': '🇮🇹',
  'PT': '🇵🇹',
  'GB': '🇬🇧',
  'XX': '🌍',
};

export function PDFStatementImporter({ className, onImportComplete }: PDFStatementImporterProps) {
  const { currentCompany } = useERPContext();
  const {
    isLoading,
    plans,
    imports,
    detectionResult,
    extractionResult,
    progress,
    error,
    fetchAccountingPlans,
    fetchImports,
    processFullImport,
    reset,
  } = useERPStatementImport();

  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStatementType, setSelectedStatementType] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [step, setStep] = useState<'select' | 'processing' | 'review' | 'complete'>('select');
  const [dragActive, setDragActive] = useState(false);

  // Cargar planes al montar
  useEffect(() => {
    fetchAccountingPlans();
    fetchImports();
  }, [fetchAccountingPlans, fetchImports]);

  // Filtrar planes por país seleccionado
  const filteredPlans = plans.filter(p => !selectedCountry || p.country_code === selectedCountry);

  // Manejar drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  // Procesar el archivo
  const handleProcess = useCallback(async () => {
    if (!selectedFile) return;

    setStep('processing');

    const result = await processFullImport(selectedFile, {
      statementType: selectedStatementType || undefined,
      countryCode: selectedCountry || undefined,
      planCode: selectedPlan || undefined,
      autoImport: false,
    });

    if (result) {
      setStep('review');
      
      // Auto-detectar y actualizar selecciones
      if (result.detection) {
        if (!selectedCountry) setSelectedCountry(result.detection.detected_country);
        if (!selectedPlan) setSelectedPlan(result.detection.detected_plan);
        if (!selectedStatementType) setSelectedStatementType(result.detection.statement_type);
      }
    } else {
      setStep('select');
    }
  }, [selectedFile, selectedStatementType, selectedCountry, selectedPlan, processFullImport]);

  // Confirmar importación
  const handleConfirmImport = useCallback(async () => {
    if (!extractionResult) return;

    setStep('complete');
    onImportComplete?.(extractionResult);
  }, [extractionResult, onImportComplete]);

  // Reset completo
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setSelectedStatementType('');
    setSelectedCountry('');
    setSelectedPlan('');
    setStep('select');
    reset();
  }, [reset]);

  if (!currentCompany) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">Seleccione una empresa para importar estados financieros</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <FileUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Importar Estados Financieros</CardTitle>
              <CardDescription>
                OCR inteligente con planes contables oficiales multi-país
              </CardDescription>
            </div>
          </div>
          {step !== 'select' && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Nueva importación
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historial ({imports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 mt-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6">
              {['Seleccionar', 'Procesar', 'Revisar', 'Completar'].map((label, idx) => {
                const stepKey = ['select', 'processing', 'review', 'complete'][idx];
                const isActive = step === stepKey;
                const isComplete = ['select', 'processing', 'review', 'complete'].indexOf(step) > idx;
                
                return (
                  <React.Fragment key={label}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                        isComplete ? "bg-green-500 text-white" : 
                        isActive ? "bg-primary text-primary-foreground" : 
                        "bg-muted text-muted-foreground"
                      )}>
                        {isComplete ? <Check className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span className={cn(
                        "text-sm hidden sm:inline",
                        isActive ? "font-medium" : "text-muted-foreground"
                      )}>
                        {label}
                      </span>
                    </div>
                    {idx < 3 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step: Select File */}
            {step === 'select' && (
              <div className="space-y-6">
                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                    selectedFile && "border-green-500 bg-green-50 dark:bg-green-950/20"
                  )}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div className="text-left">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium mb-1">
                        Arrastra tu PDF aquí
                      </p>
                      <p className="text-sm text-muted-foreground">
                        o haz clic para seleccionar un archivo
                      </p>
                    </>
                  )}
                </div>

                {/* Opciones de configuración */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Estado (opcional)</Label>
                    <Select value={selectedStatementType} onValueChange={setSelectedStatementType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Auto-detectar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Auto-detectar</SelectItem>
                        {STATEMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>País (opcional)</Label>
                    <Select value={selectedCountry} onValueChange={(v) => {
                      setSelectedCountry(v);
                      setSelectedPlan(''); // Reset plan when country changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Auto-detectar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Auto-detectar</SelectItem>
                        {[...new Set(plans.map(p => p.country_code))].map(code => {
                          const plan = plans.find(p => p.country_code === code);
                          return (
                            <SelectItem key={code} value={code}>
                              {COUNTRY_FLAGS[code] || '🌍'} {plan?.country_name || code}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Plan Contable (opcional)</Label>
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Auto-detectar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Auto-detectar</SelectItem>
                        {filteredPlans.map(plan => (
                          <SelectItem key={plan.plan_code} value={plan.plan_code}>
                            {plan.plan_name} {plan.is_default && '★'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Planes contables disponibles */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Planes Contables Soportados
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {plans.map(plan => (
                      <Badge
                        key={plan.id}
                        variant={plan.is_default ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {COUNTRY_FLAGS[plan.country_code] || '🌍'} {plan.plan_name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Botón de procesar */}
                <Button
                  size="lg"
                  className="w-full gap-2"
                  disabled={!selectedFile || isLoading}
                  onClick={handleProcess}
                >
                  <Sparkles className="h-5 w-5" />
                  Procesar con OCR Inteligente
                </Button>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="py-12 text-center space-y-6">
                <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
                <div>
                  <p className="text-lg font-medium mb-2">Procesando documento...</p>
                  <p className="text-sm text-muted-foreground">
                    Detectando plan contable y extrayendo datos
                  </p>
                </div>
                <Progress value={progress} className="max-w-md mx-auto" />
                <p className="text-xs text-muted-foreground">
                  {progress < 30 ? 'Detectando país y plan contable...' :
                   progress < 60 ? 'Extrayendo datos del documento...' :
                   progress < 90 ? 'Mapeando cuentas contables...' :
                   'Finalizando...'}
                </p>
              </div>
            )}

            {/* Step: Review */}
            {step === 'review' && detectionResult && (
              <div className="space-y-6">
                {/* Detection Result */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <h4 className="font-medium">Documento Analizado</h4>
                    <Badge variant="secondary">
                      {detectionResult.confidence}% confianza
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">País</p>
                      <p className="font-medium">
                        {COUNTRY_FLAGS[detectionResult.detected_country]} {detectionResult.detected_country}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Plan Contable</p>
                      <p className="font-medium">{detectionResult.detected_plan}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">
                        {STATEMENT_TYPES.find(t => t.value === detectionResult.statement_type)?.label || detectionResult.statement_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Moneda</p>
                      <p className="font-medium">{detectionResult.currency}</p>
                    </div>
                  </div>
                </div>

                {/* Extracted Data Preview */}
                {extractionResult && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <h4 className="font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Datos Extraídos
                      </h4>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-4">
                        <pre className="text-xs overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(extractionResult, null, 2)}
                        </pre>
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Validation Status */}
                {extractionResult?.validation && (
                  <div className={cn(
                    "rounded-lg p-4 border",
                    extractionResult.validation.balance_check
                      ? "bg-green-50 dark:bg-green-950/30 border-green-200"
                      : "bg-amber-50 dark:bg-amber-950/30 border-amber-200"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {extractionResult.validation.balance_check ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )}
                      <h4 className="font-medium">
                        {extractionResult.validation.balance_check
                          ? 'Validación correcta'
                          : 'Revisar datos'}
                      </h4>
                    </div>
                    {extractionResult.validation.errors?.length > 0 && (
                      <ul className="text-sm space-y-1 ml-7">
                        {extractionResult.validation.errors.map((err: string, idx: number) => (
                          <li key={idx} className="text-amber-700 dark:text-amber-400">{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={handleReset}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmImport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Importar a Contabilidad
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Complete */}
            {step === 'complete' && (
              <div className="py-12 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-medium mb-2">¡Importación Completada!</p>
                  <p className="text-muted-foreground">
                    Los datos han sido importados correctamente a la contabilidad
                  </p>
                </div>
                <Button onClick={handleReset} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Importar otro documento
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Error en el proceso</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[500px]">
              {imports.length === 0 ? (
                <div className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No hay importaciones recientes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>País/Plan</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((imp) => (
                      <TableRow key={imp.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {imp.file_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {STATEMENT_TYPES.find(t => t.value === imp.statement_type)?.label || imp.statement_type}
                        </TableCell>
                        <TableCell>
                          {COUNTRY_FLAGS[imp.detected_country] || '🌍'} {imp.detected_plan}
                          {imp.detection_confidence && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({imp.detection_confidence}%)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              imp.status === 'imported' ? 'default' :
                              imp.status === 'failed' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {imp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(imp.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PDFStatementImporter;
