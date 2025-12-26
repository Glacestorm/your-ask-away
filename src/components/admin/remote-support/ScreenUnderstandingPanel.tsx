import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Pencil,
  Upload,
  RefreshCw,
  Maximize2,
  Layers,
  Target,
  Zap
} from 'lucide-react';
import { useScreenUnderstanding, ScreenContext } from '@/hooks/admin/support/useScreenUnderstanding';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScreenUnderstandingPanelProps {
  sessionId?: string;
  className?: string;
}

export function ScreenUnderstandingPanel({ sessionId, className }: ScreenUnderstandingPanelProps) {
  const [activeTab, setActiveTab] = useState('capture');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    isAnalyzing,
    currentAnalysis,
    errorPatterns,
    liveAnnotations,
    analyzeScreenshot,
    detectVisualErrors,
    addAnnotation,
    removeAnnotation,
  } = useScreenUnderstanding();

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);

      const context: ScreenContext = {
        sessionId: sessionId || 'demo-session',
        applicationName: window.location.hostname,
        screenType: window.location.pathname,
      };

      await analyzeScreenshot(base64, context);
    };
    reader.readAsDataURL(file);
  }, [analyzeScreenshot, sessionId]);

  const handleCaptureScreen = useCallback(async () => {
    const context: ScreenContext = {
      sessionId: sessionId || 'demo-session',
      applicationName: window.location.hostname,
      screenType: window.location.pathname,
    };

    if (selectedImage) {
      await analyzeScreenshot(selectedImage, context);
    }
  }, [analyzeScreenshot, sessionId, selectedImage]);

  const handleDetectErrors = useCallback(async () => {
    if (selectedImage) {
      await detectVisualErrors(selectedImage);
    }
  }, [detectVisualErrors, selectedImage]);

  const handleAddAnnotation = useCallback(() => {
    const newAnnotation = addAnnotation({
      type: 'highlight',
      position: { x: 100, y: 100 },
      createdBy: 'user',
      color: '#ff0000',
      label: 'Marcado',
    });
    console.log('Annotation added:', newAnnotation);
  }, [addAnnotation]);

  const lastAnalysisTime = currentAnalysis?.timestamp ? new Date(currentAnalysis.timestamp) : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-indigo-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Screen Understanding
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 text-xs">
                  Vision AI
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Análisis visual con IA y anotaciones en tiempo real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastAnalysisTime && (
              <span className="text-xs text-muted-foreground">
                Último: {formatDistanceToNow(lastAnalysisTime, { locale: es, addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="capture" className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Captura
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Errores
            </TabsTrigger>
            <TabsTrigger value="annotations" className="text-xs">
              <Pencil className="h-3 w-3 mr-1" />
              Anotaciones
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Análisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capture" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              {selectedImage ? (
                <div className="relative">
                  <img 
                    src={selectedImage} 
                    alt="Screenshot" 
                    className="max-h-64 mx-auto rounded-lg shadow-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setSelectedImage(null)}>
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {liveAnnotations.map((ann) => (
                    <div
                      key={ann.id}
                      className="absolute border-2 rounded px-2 py-1 text-xs"
                      style={{
                        left: ann.position.x,
                        top: ann.position.y,
                        borderColor: ann.color,
                        backgroundColor: `${ann.color}20`
                      }}
                    >
                      {ann.type}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Monitor className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Captura o sube una imagen para analizar
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button onClick={handleCaptureScreen} disabled={isAnalyzing}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capturar Pantalla
                    </Button>
                    <label>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Subir Imagen
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {selectedImage && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleDetectErrors} 
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4 mr-2" />
                  )}
                  Detectar Errores
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleAddAnnotation}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Añadir Anotación
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="errors" className="space-y-3">
            <ScrollArea className="h-[300px]">
              {errorPatterns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No se han detectado errores</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {errorPatterns.map((pattern) => (
                    <div 
                      key={pattern.id}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="font-medium text-sm">{pattern.patternType}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {pattern.frequency}x
                        </Badge>
                      </div>
                      <p className="text-xs mt-1 text-muted-foreground">{pattern.description}</p>

                      {pattern.resolutionSteps?.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                          <Zap className="h-3 w-3 inline mr-1" />
                          {pattern.resolutionSteps[0]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="annotations" className="space-y-3">
            <ScrollArea className="h-[300px]">
              {liveAnnotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pencil className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay anotaciones</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {liveAnnotations.map((ann) => (
                    <div 
                      key={ann.id}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: ann.color }}
                        />
                        <span className="text-sm">{ann.label ?? ann.type}</span>
                        <Badge variant="outline" className="text-xs">{ann.createdBy}</Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeAnnotation(ann.id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-3">
            {currentAnalysis ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Resultado</span>
                      <span className="text-lg font-bold text-primary">
                        {currentAnalysis.analysis.errorDetected ? 'Error' : 'OK'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {currentAnalysis.analysis.errorType || 'Sin incidencias relevantes detectadas'}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round((currentAnalysis.analysis.confidence || 0) * 100)}%
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Elementos UI</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentAnalysis.analysis.uiElements?.map((el) => (
                        <Badge key={el.id} variant="secondary" className="text-xs">
                          {el.type}: {el.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {currentAnalysis.analysis.suggestions?.length > 0 && (
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium">Sugerencias</span>
                      </div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {currentAnalysis.analysis.suggestions.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Analiza una imagen para ver resultados</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ScreenUnderstandingPanel;
