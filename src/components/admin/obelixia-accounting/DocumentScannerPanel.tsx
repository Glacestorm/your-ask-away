/**
 * Document Scanner Panel
 * Fase 2: Multimodal AI - Vision
 * Upload + preview + extraction de facturas/recibos
 */

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileImage, 
  FileText, 
  Scan, 
  Check, 
  Sparkles,
  Receipt,
  Building2,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye
} from 'lucide-react';
import { useObelixiaDocumentVision, DocumentUpload } from '@/hooks/admin/obelixia-accounting/useObelixiaDocumentVision';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentScannerPanelProps {
  onEntryCreated?: (success: boolean) => void;
  className?: string;
}

export function DocumentScannerPanel({ 
  onEntryCreated,
  className 
}: DocumentScannerPanelProps) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentUpload | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploads,
    isProcessing,
    uploadDocument,
    analyzeDocument,
    validateExtractedData,
    createEntryFromDocument,
    removeUpload,
    clearAll
  } = useObelixiaDocumentVision();

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      await uploadDocument(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadDocument]);

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      await uploadDocument(file);
    }
  }, [uploadDocument]);

  // Handle analyze
  const handleAnalyze = useCallback(async (upload: DocumentUpload) => {
    await analyzeDocument(upload.id);
  }, [analyzeDocument]);

  // Handle create entry
  const handleCreateEntry = useCallback(async (upload: DocumentUpload) => {
    const success = await createEntryFromDocument(upload.id);
    onEntryCreated?.(success);
  }, [createEntryFromDocument, onEntryCreated]);

  // Get status badge
  const getStatusBadge = (upload: DocumentUpload) => {
    switch (upload.status) {
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Analizando...</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-400">Completado</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  // Get document type icon
  const getDocTypeIcon = (type?: string) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4 text-blue-400" />;
      case 'receipt':
        return <Receipt className="h-4 w-4 text-green-400" />;
      case 'bank_statement':
        return <Building2 className="h-4 w-4 text-purple-400" />;
      default:
        return <FileImage className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get extracted info from result
  const getExtractedInfo = (upload: DocumentUpload) => {
    if (!upload.result) return null;
    
    const result = upload.result;
    if ('total' in result) {
      return { total: result.total };
    }
    if ('closing_balance' in result) {
      return { total: result.closing_balance };
    }
    return null;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
              <Scan className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Scanner de Documentos</CardTitle>
              <p className="text-xs text-muted-foreground">
                OCR + IA para facturas y recibos
              </p>
            </div>
          </div>
          {uploads.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="h-3 w-3 mr-1" />
              Subir
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs">
              <FileImage className="h-3 w-3 mr-1" />
              Documentos ({uploads.length})
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs" disabled={!selectedDocument}>
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-0">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-all",
                "hover:border-primary/50 hover:bg-muted/30",
                isProcessing && "opacity-50 pointer-events-none"
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-violet-400" />
                </div>

                <div>
                  <p className="font-medium">Arrastra documentos aquí</p>
                  <p className="text-sm text-muted-foreground">
                    o haz click para seleccionar
                  </p>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-violet-500 to-blue-600 hover:from-violet-600 hover:to-blue-700"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Seleccionar Archivos
                </Button>

                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Facturas</Badge>
                  <Badge variant="outline">Recibos</Badge>
                  <Badge variant="outline">Extractos bancarios</Badge>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0">
            <ScrollArea className="h-[300px]">
              <AnimatePresence mode="popLayout">
                {uploads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay documentos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploads.map((upload) => {
                      const extractedInfo = getExtractedInfo(upload);
                      return (
                        <motion.div
                          key={upload.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={cn(
                            "p-3 rounded-lg border bg-card transition-colors cursor-pointer",
                            selectedDocument?.id === upload.id && "border-primary bg-primary/5"
                          )}
                          onClick={() => setSelectedDocument(upload)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {getDocTypeIcon(upload.result?.type)}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {upload.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(upload.file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(upload)}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeUpload(upload.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress bar for processing */}
                          {upload.status === 'processing' && (
                            <Progress className="h-1 mt-2" />
                          )}

                          {/* Extracted data preview */}
                          {upload.result && (
                            <div className="mt-2 pt-2 border-t space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Confianza:</span>
                                <span className={cn(
                                  "font-medium",
                                  (upload.confidence || 0) >= 0.9 ? "text-green-400" :
                                  (upload.confidence || 0) >= 0.7 ? "text-yellow-400" : "text-red-400"
                                )}>
                                  {((upload.confidence || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              {extractedInfo?.total && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Total:</span>
                                  <span className="font-medium">
                                    {extractedInfo.total.toFixed(2)} €
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2 mt-2">
                            {upload.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyze(upload);
                                }}
                                disabled={isProcessing}
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Analizar
                              </Button>
                            )}
                            {upload.status === 'completed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    validateExtractedData(upload.id);
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Validar
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateEntry(upload);
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Crear Asiento
                                </Button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-0">
            {selectedDocument ? (
              <div className="space-y-3">
                {/* Preview controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewZoom(Math.max(50, previewZoom - 25))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground w-12 text-center">
                      {previewZoom}%
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewZoom(Math.min(200, previewZoom + 25))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  {getStatusBadge(selectedDocument)}
                </div>

                {/* Image preview */}
                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <ScrollArea className="h-[250px]">
                    {selectedDocument.preview_url && (
                      <img
                        src={selectedDocument.preview_url}
                        alt="Document preview"
                        style={{ width: `${previewZoom}%` }}
                        className="mx-auto"
                      />
                    )}
                  </ScrollArea>
                </div>

                {/* Extracted data details */}
                {selectedDocument.result && (
                  <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Datos Extraídos
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(selectedDocument.result).map(([key, value]) => {
                        if (typeof value === 'object') return null;
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium truncate ml-2">
                              {typeof value === 'number' 
                                ? value.toFixed(2) 
                                : String(value).substring(0, 20)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Selecciona un documento para previsualizar</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default DocumentScannerPanel;
