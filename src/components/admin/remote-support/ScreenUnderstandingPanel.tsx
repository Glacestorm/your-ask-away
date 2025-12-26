import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
import { useScreenUnderstanding } from '@/hooks/admin/support/useScreenUnderstanding';
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
    analysisResults,
    detectedErrors,
    annotations,
    captureScreen,
    analyzeScreenshot,
    detectErrors,
    addAnnotation,
    removeAnnotation,
    lastAnalysis
  } = useScreenUnderstanding();

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      await analyzeScreenshot(base64, sessionId || 'demo-session');
    };
    reader.readAsDataURL(file);
  }, [analyzeScreenshot, sessionId]);

  const handleCaptureScreen = useCallback(async () => {
    const screenshot = await captureScreen(sessionId || 'demo-session');
    if (screenshot) {
      setSelectedImage(screenshot);
    }
  }, [captureScreen, sessionId]);

  const handleDetectErrors = useCallback(async () => {
    if (selectedImage) {
      await detectErrors(selectedImage, sessionId || 'demo-session');
    }
  }, [detectErrors, selectedImage, sessionId]);

  const handleAddAnnotation = useCallback(async () => {
    if (selectedImage) {
      await addAnnotation(sessionId || 'demo-session', {
        type: 'highlight',
        position: { x: 100, y: 100 },
        content: 'Nueva anotación',
        color: '#ff0000'
      });
    }
  }, [addAnnotation, sessionId, selectedImage]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

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
            {lastAnalysis && (
              <span className="text-xs text-muted-foreground">
                Último: {formatDistanceToNow(lastAnalysis, { locale: es, addSuffix: true })}
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
            {/* Upload/Capture Area */}
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
                  {/* Render annotations overlay */}
                  {annotations.map((ann) => (
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
                      {ann.content}
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

            {/* Quick Actions */}
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
              {detectedErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No se han detectado errores</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {detectedErrors.map((error, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border",
                        getSeverityColor(error.severity)
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium text-sm">{error.type}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {error.severity}
                        </Badge>
                      </div>
                      <p className="text-xs mt-1 opacity-80">{error.description}</p>
                      {error.suggestion && (
                        <div className="mt-2 p-2 rounded bg-background/50 text-xs">
                          <Zap className="h-3 w-3 inline mr-1" />
                          {error.suggestion}
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
              {annotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pencil className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay anotaciones</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {annotations.map((ann) => (
                    <div 
                      key={ann.id}
                      className="p-3 rounded-lg border bg-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: ann.color }}
                        />
                        <span className="text-sm">{ann.content}</span>
                        <Badge variant="outline" className="text-xs">{ann.type}</Badge>
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
            {analysisResults ? (
              <div className="space-y-4">
                {/* Confidence Score */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confianza del Análisis</span>
                    <span className="text-lg font-bold text-primary">
                      {Math.round(analysisResults.confidence * 100)}%
                    </span>
                  </div>
                  <Progress value={analysisResults.confidence * 100} className="h-2" />
                </div>

                {/* Elements Detected */}
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Elementos Detectados</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.elements?.map((el: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {el.type}: {el.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                {analysisResults.suggestions && (
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-sm font-medium">Sugerencias</span>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {analysisResults.suggestions.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-400">•</span>
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
