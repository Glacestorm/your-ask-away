import { useState, useCallback, useRef } from 'react';
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
  Maximize2,
  Minimize2,
  FileCheck,
  Brain
} from 'lucide-react';
import { useDocumentIntelligence } from '@/hooks/admin/useDocumentIntelligence';
import { cn } from '@/lib/utils';

interface DocumentIntelligencePanelProps {
  context?: { entityId: string; entityName?: string } | null;
  className?: string;
}

export function DocumentIntelligencePanel({ context, className }: DocumentIntelligencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('extract');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isLoading,
    analysis,
    progress,
    analyzeDocument,
    classifyDocument,
    clearAnalysis
  } = useDocumentIntelligence();

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await analyzeDocument(file);
    }
  }, [analyzeDocument]);

  const handleClassify = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await classifyDocument(file);
    }
  }, [classifyDocument]);

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un documento para analizar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-base">Document Intelligence</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={clearAnalysis} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8">
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="extract" className="text-xs">Extraer</TabsTrigger>
            <TabsTrigger value="classify" className="text-xs">Clasificar</TabsTrigger>
          </TabsList>

          <TabsContent value="extract" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {isLoading && (
                <div className="p-4">
                  <Progress value={progress} className="h-2 mb-2" />
                  <p className="text-xs text-center text-muted-foreground">Procesando documento...</p>
                </div>
              )}
              {analysis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Datos Extraídos</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(analysis.confidence_score * 100)}% confianza
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Tipo de documento</p>
                    <Badge>{analysis.document_type}</Badge>
                  </div>
                  {analysis.summary && (
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Resumen</p>
                      <p className="text-sm">{analysis.summary}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {analysis.extracted_fields?.map((field, idx) => (
                      <div key={idx} className="p-2 rounded border bg-muted/30">
                        <span className="text-xs text-muted-foreground">{field.name}</span>
                        <p className="text-sm font-medium">{field.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">Sube un documento para extraer datos</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <Upload className="h-4 w-4 mr-2" />Subir Documento
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="classify" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-280px)]" : "h-[250px]"}>
              {analysis ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <FileCheck className="h-5 w-5 text-primary" />
                      <span className="font-medium">Clasificación</span>
                    </div>
                    <Badge className="mb-2">{analysis.document_type}</Badge>
                    <Progress value={analysis.confidence_score * 100} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Confianza: {Math.round(analysis.confidence_score * 100)}%
                    </p>
                  </div>
                  {analysis.entities?.map((entity, idx) => (
                    <Badge key={idx} variant="secondary" className="mr-1">{entity.type}: {entity.value}</Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">Clasifica documentos automáticamente</p>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    <FileCheck className="h-4 w-4 mr-2" />Clasificar Documento
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
