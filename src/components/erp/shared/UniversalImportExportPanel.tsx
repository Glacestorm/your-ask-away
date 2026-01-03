import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileCode,
  Scan,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  Table,
  FileImage,
  Building2,
  Calendar,
  DollarSign,
  User,
  X,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useERPImportExport, ERPModule, ExportFormat, OCRResult, ImportResult } from '@/hooks/erp/useERPImportExport';

interface UniversalImportExportPanelProps {
  module: ERPModule;
  title?: string;
  description?: string;
  onImportComplete?: (data: ImportResult) => void;
  onExportComplete?: (data: unknown) => void;
  exportData?: Record<string, unknown>;
  className?: string;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: React.ReactNode; extensions: string }[] = [
  { value: 'json', label: 'JSON', icon: <FileJson className="h-4 w-4" />, extensions: '.json' },
  { value: 'csv', label: 'CSV', icon: <FileSpreadsheet className="h-4 w-4" />, extensions: '.csv' },
  { value: 'xlsx', label: 'Excel', icon: <FileSpreadsheet className="h-4 w-4" />, extensions: '.xlsx,.xls' },
  { value: 'xml', label: 'XML', icon: <FileCode className="h-4 w-4" />, extensions: '.xml' },
  { value: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4" />, extensions: '.pdf' },
  { value: 'ofx', label: 'OFX (Bancario)', icon: <Building2 className="h-4 w-4" />, extensions: '.ofx' },
  { value: 'qif', label: 'QIF (Quicken)', icon: <Building2 className="h-4 w-4" />, extensions: '.qif' },
  { value: 'mt940', label: 'MT940 (SWIFT)', icon: <Building2 className="h-4 w-4" />, extensions: '.mt940,.sta' },
  { value: 'camt053', label: 'CAMT.053 (ISO)', icon: <Building2 className="h-4 w-4" />, extensions: '.xml' },
  { value: 'sepa', label: 'SEPA', icon: <Building2 className="h-4 w-4" />, extensions: '.xml' },
];

const MODULE_LABELS: Record<ERPModule, string> = {
  accounting: 'Contabilidad',
  treasury: 'Tesorería',
  inventory: 'Inventario',
  sales: 'Ventas',
  purchases: 'Compras',
  trade: 'Comercio Exterior',
  all: 'Todos los módulos'
};

export function UniversalImportExportPanel({
  module,
  title,
  description,
  onImportComplete,
  onExportComplete,
  exportData,
  className
}: UniversalImportExportPanelProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'ocr'>('import');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [files, setFiles] = useState<File[]>([]);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [options, setOptions] = useState({
    includeRelations: true,
    ocrEnabled: true,
    language: 'es'
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    isProcessing,
    progress,
    error,
    performOCR,
    importData,
    exportData: doExport,
    downloadFile,
    reset
  } = useERPImportExport();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleOCR = useCallback(async () => {
    if (files.length === 0) return;
    
    const result = await performOCR(files[0], module, options);
    if (result) {
      setOcrResult(result);
    }
  }, [files, module, options, performOCR]);

  const handleImport = useCallback(async () => {
    if (files.length === 0) return;
    
    const result = await importData(files[0], module, selectedFormat, options);
    if (result) {
      setImportResult(result);
      onImportComplete?.(result);
    }
  }, [files, module, selectedFormat, options, importData, onImportComplete]);

  const handleExport = useCallback(async () => {
    if (!exportData) return;
    
    const result = await doExport(exportData, module, selectedFormat, options);
    if (result) {
      onExportComplete?.(result);
      
      // Trigger download
      if (result.file_content) {
        downloadFile(result.file_content, result.file_name || `export.${selectedFormat}`, result.mime_type);
      }
    }
  }, [exportData, module, selectedFormat, options, doExport, onExportComplete, downloadFile]);

  const getAcceptedFormats = useCallback(() => {
    return FORMAT_OPTIONS.map(f => f.extensions).join(',');
  }, []);

  const renderOCRResult = () => {
    if (!ocrResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={ocrResult.confidence > 0.8 ? 'default' : 'secondary'}>
              {Math.round(ocrResult.confidence * 100)}% confianza
            </Badge>
            <Badge variant="outline">{ocrResult.document_type}</Badge>
            <Badge variant="outline">{ocrResult.module_target}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOcrResult(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Document Info */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Documento</CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-1 text-sm">
              <p><strong>Tipo:</strong> {ocrResult.extracted_data.document.type}</p>
              <p><strong>Número:</strong> {ocrResult.extracted_data.document.number}</p>
              <p><strong>Serie:</strong> {ocrResult.extracted_data.document.series || '-'}</p>
            </CardContent>
          </Card>

          {/* Amounts */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Importes
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-1 text-sm">
              <p><strong>Base:</strong> {ocrResult.extracted_data.amounts.subtotal?.toLocaleString('es-ES', { style: 'currency', currency: ocrResult.extracted_data.amounts.currency || 'EUR' })}</p>
              <p><strong>IVA ({ocrResult.extracted_data.amounts.tax_rate}%):</strong> {ocrResult.extracted_data.amounts.tax_amount?.toLocaleString('es-ES', { style: 'currency', currency: ocrResult.extracted_data.amounts.currency || 'EUR' })}</p>
              <p><strong>Total:</strong> {ocrResult.extracted_data.amounts.total?.toLocaleString('es-ES', { style: 'currency', currency: ocrResult.extracted_data.amounts.currency || 'EUR' })}</p>
            </CardContent>
          </Card>

          {/* Company */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-1 text-sm">
              <p><strong>Nombre:</strong> {ocrResult.extracted_data.company.name}</p>
              <p><strong>NIF:</strong> {ocrResult.extracted_data.company.tax_id}</p>
            </CardContent>
          </Card>

          {/* Counterparty */}
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <User className="h-3 w-3" /> Contraparte
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-1 text-sm">
              <p><strong>Nombre:</strong> {ocrResult.extracted_data.counterparty.name}</p>
              <p><strong>NIF:</strong> {ocrResult.extracted_data.counterparty.tax_id}</p>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        {ocrResult.extracted_data.items && ocrResult.extracted_data.items.length > 0 && (
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm flex items-center gap-1">
                <Table className="h-3 w-3" /> Líneas ({ocrResult.extracted_data.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <ScrollArea className="h-32">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">Descripción</th>
                      <th className="text-right p-1">Cant.</th>
                      <th className="text-right p-1">Precio</th>
                      <th className="text-right p-1">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocrResult.extracted_data.items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-1">{item.description}</td>
                        <td className="text-right p-1">{item.quantity}</td>
                        <td className="text-right p-1">{item.unit_price?.toFixed(2)}</td>
                        <td className="text-right p-1">{item.total?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Validation */}
        {ocrResult.validation && (
          <div className="space-y-2">
            {ocrResult.validation.errors?.map((err, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {err}
              </div>
            ))}
            {ocrResult.validation.warnings?.map((warn, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                {warn}
              </div>
            ))}
            {ocrResult.validation.suggestions?.map((sug, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {sug}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleImport} className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Importar datos extraídos
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver JSON
          </Button>
        </div>
      </div>
    );
  };

  const renderImportResult = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {importResult.import_status === 'success' && (
            <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Éxito</Badge>
          )}
          {importResult.import_status === 'partial' && (
            <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Parcial</Badge>
          )}
          {importResult.import_status === 'failed' && (
            <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Error</Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {importResult.processed_records}/{importResult.total_records} registros
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600">{importResult.summary.by_status.valid}</div>
            <div className="text-xs text-muted-foreground">Válidos</div>
          </div>
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{importResult.summary.by_status.warning}</div>
            <div className="text-xs text-muted-foreground">Advertencias</div>
          </div>
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-lg font-bold text-red-600">{importResult.summary.by_status.error}</div>
            <div className="text-xs text-muted-foreground">Errores</div>
          </div>
        </div>

        {importResult.suggestions && importResult.suggestions.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Sugerencias:</Label>
            {importResult.suggestions.map((sug, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                {sug}
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" onClick={() => { setImportResult(null); setFiles([]); reset(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Nueva importación
        </Button>
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {title || 'Importar / Exportar'}
            </CardTitle>
            <CardDescription>
              {description || `${MODULE_LABELS[module]} - OCR inteligente multi-formato`}
            </CardDescription>
          </div>
          <Badge variant="outline">{MODULE_LABELS[module]}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import" className="text-xs">
              <Upload className="h-3 w-3 mr-1" /> Importar
            </TabsTrigger>
            <TabsTrigger value="ocr" className="text-xs">
              <Scan className="h-3 w-3 mr-1" /> OCR
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs">
              <Download className="h-3 w-3 mr-1" /> Exportar
            </TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            {!importResult ? (
              <>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5",
                    files.length > 0 && "border-primary bg-primary/5"
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptedFormats()}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-sm">Arrastra archivos o haz clic para seleccionar</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON, CSV, Excel, XML, PDF, OFX, QIF, MT940, CAMT.053, SEPA
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Formato</Label>
                    <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ExportFormat)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              {opt.icon}
                              {opt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Idioma</Label>
                    <Select value={options.language} onValueChange={(v) => setOptions(o => ({ ...o, language: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ca">Català</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeRelations"
                    checked={options.includeRelations}
                    onCheckedChange={(c) => setOptions(o => ({ ...o, includeRelations: !!c }))}
                  />
                  <label htmlFor="includeRelations" className="text-sm">
                    Incluir relaciones (clientes, productos, cuentas)
                  </label>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-xs text-center text-muted-foreground">
                      Procesando... {progress}%
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleImport} 
                  disabled={files.length === 0 || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Importar datos
                </Button>
              </>
            ) : (
              renderImportResult()
            )}
          </TabsContent>

          {/* OCR Tab */}
          <TabsContent value="ocr" className="space-y-4">
            {!ocrResult ? (
              <>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5",
                    files.length > 0 && "border-primary bg-primary/5"
                  )}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.tiff,.gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Scan className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-sm">Sube documentos para OCR inteligente</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG - Facturas, extractos, contratos
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{files[0].name}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFiles([])}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      Analizando con IA... {progress}%
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleOCR} 
                  disabled={files.length === 0 || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4 mr-2" />
                  )}
                  Extraer datos con OCR
                </Button>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Detección automática de tipo de documento
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Extracción de tablas y entidades
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Mapeo automático al ERP
                  </div>
                </div>
              </>
            ) : (
              renderOCRResult()
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Formato de exportación</Label>
                <div className="grid grid-cols-5 gap-2">
                  {FORMAT_OPTIONS.slice(0, 5).map(opt => (
                    <Button
                      key={opt.value}
                      variant={selectedFormat === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFormat(opt.value)}
                      className="flex flex-col h-auto py-2"
                    >
                      {opt.icon}
                      <span className="text-xs mt-1">{opt.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="exportRelations"
                  checked={options.includeRelations}
                  onCheckedChange={(c) => setOptions(o => ({ ...o, includeRelations: !!c }))}
                />
                <label htmlFor="exportRelations" className="text-sm">
                  Incluir datos relacionados
                </label>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-xs text-center text-muted-foreground">
                    Generando exportación... {progress}%
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleExport} 
                disabled={!exportData || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar a {FORMAT_OPTIONS.find(f => f.value === selectedFormat)?.label}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Vista previa de datos</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(ocrResult, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default UniversalImportExportPanel;
