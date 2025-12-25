import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  FileText,
  Upload,
  Search,
  Maximize2,
  Minimize2,
  FileCheck,
  Brain
} from 'lucide-react';
import { useDocumentIntelligence } from '@/hooks/admin/useDocumentIntelligence';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentIntelligencePanelProps {
  context?: {
    entityId: string;
    entityName?: string;
  } | null;
  className?: string;
}

export function DocumentIntelligencePanel({ 
  context, 
  className 
}: DocumentIntelligencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('extract');

  const {
    isLoading,
    extractedData,
    classificationResult,
    summary,
    lastRefresh,
    extractData,
    classifyDocument,
    summarizeDocument
  } = useDocumentIntelligence();

  const handleExtract = useCallback(async () => {
    if (context?.entityId) {
      await extractData(context.entityId, 'general');
    }
  }, [context, extractData]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un documento para analizar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Document Intelligence</CardTitle>
              <p className="text-xs text-muted-foreground">
                {lastRefresh 
                  ? `Procesado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Listo para procesar'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleExtract}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="extract" className="text-xs">Extraer</TabsTrigger>
            <TabsTrigger value="classify" className="text-xs">Clasificar</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs">Resumen</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {extractedData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Datos Extraídos</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(extractedData.confidence * 100)}% confianza
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(extractedData.fields).map(([key, value]) => (
                      <div key={key} className="p-2 rounded border bg-muted/30">
                        <span className="text-xs text-muted-foreground">{key}</span>
                        <p className="text-sm font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Sube un documento para extraer datos automáticamente
                  </p>
                  <Button variant="outline" onClick={handleExtract} disabled={isLoading}>
                    <Search className="h-4 w-4 mr-2" />
                    Extraer Datos
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="classify" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {classificationResult ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="h-5 w-5 text-primary" />
                      <span className="font-medium">Clasificación</span>
                    </div>
                    <Badge className="mb-2">{classificationResult.category}</Badge>
                    <Progress 
                      value={classificationResult.confidence * 100} 
                      className="h-2 mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Confianza: {Math.round(classificationResult.confidence * 100)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    {classificationResult.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="mr-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Clasifica automáticamente documentos por tipo y categoría
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => classifyDocument(context.entityId)}
                    disabled={isLoading}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Clasificar Documento
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="summary" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {summary ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-card">
                    <h4 className="font-medium mb-2">Resumen Ejecutivo</h4>
                    <p className="text-sm text-muted-foreground">{summary.text}</p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Puntos Clave</h5>
                    {summary.keyPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/30">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                          {idx + 1}
                        </div>
                        <span className="text-sm">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Genera resúmenes inteligentes de documentos largos
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => summarizeDocument(context.entityId)}
                    disabled={isLoading}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generar Resumen
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default DocumentIntelligencePanel;
