/**
 * Screen Understanding Panel
 * 
 * Panel de análisis visual con IA para soporte:
 * - Análisis de capturas de pantalla
 * - Detección de errores UI
 * - Anotaciones en tiempo real
 * - Comparación de pantallas
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Eye,
  Camera,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Image,
  FileWarning,
  Layers,
} from 'lucide-react';
import { useScreenUnderstanding } from '@/hooks/admin/support/useScreenUnderstanding';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScreenUnderstandingPanelProps {
  context: {
    entityId: string;
    sessionId?: string;
    currentScreen?: string;
  } | null;
  className?: string;
}

export function ScreenUnderstandingPanel({ context, className }: ScreenUnderstandingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    analyses,
    currentAnalysis,
    isAnalyzing,
    errorPatterns,
    liveAnnotations,
    error,
    analyzeScreenshot,
    fetchErrorPatterns,
    clearAnalysis,
  } = useScreenUnderstanding();

  const handleAnalyze = useCallback(async () => {
    if (!context?.sessionId) return;
    // Simulate screenshot capture - in real implementation would capture actual screen
    await analyzeScreenshot('mock-screenshot-data', {
      sessionId: context.sessionId,
      screenType: context.currentScreen,
    });
  }, [context, analyzeScreenshot]);

  const handleFetchPatterns = useCallback(async () => {
    await fetchErrorPatterns();
  }, [fetchErrorPatterns]);

  // Inactive state
  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Eye className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Screen Understanding inactivo
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
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Screen Understanding
                <Badge variant="secondary" className="text-xs">Fase 3</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Análisis visual con IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="h-8 w-8"
            >
              <Camera className={cn("h-4 w-4", isAnalyzing && "animate-pulse")} />
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
        <ScrollArea className={isExpanded ? "h-[calc(100vh-200px)]" : "h-[280px]"}>
          <div className="space-y-4">
            {/* Current Analysis */}
            {currentAnalysis ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Último análisis</span>
                  <Badge variant={currentAnalysis.analysis.errorDetected ? "destructive" : "outline"}>
                    {currentAnalysis.analysis.errorDetected ? (
                      <><AlertTriangle className="h-3 w-3 mr-1" /> Error detectado</>
                    ) : (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Sin errores</>
                    )}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span>{currentAnalysis.analysis.uiElements.length} elementos UI detectados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span>Confianza: {Math.round(currentAnalysis.analysis.confidence * 100)}%</span>
                  </div>
                </div>

                {currentAnalysis.analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">Sugerencias IA</span>
                    {currentAnalysis.analysis.suggestions.map((suggestion, i) => (
                      <div key={i} className="p-2 rounded-lg bg-accent/10 text-xs">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Image className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mb-3">
                  No hay análisis reciente
                </p>
                <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar y Analizar
                </Button>
              </div>
            )}

            {/* Error Patterns */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-muted-foreground" />
                  Patrones de Error
                </span>
                <Button variant="ghost" size="sm" onClick={handleFetchPatterns}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>

              {errorPatterns.length > 0 ? (
                <div className="space-y-2">
                  {errorPatterns.slice(0, 3).map((pattern) => (
                    <div key={pattern.id} className="p-2 rounded-lg border text-xs space-y-1">
                      <div className="font-medium">{pattern.patternType}</div>
                      <div className="text-muted-foreground">{pattern.description}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {pattern.frequency}x visto
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Sin patrones registrados
                </p>
              )}
            </div>

            {/* Live Annotations */}
            {liveAnnotations.length > 0 && (
              <div className="pt-4 border-t">
                <span className="text-sm font-medium mb-2 block">Anotaciones Activas</span>
                <div className="flex flex-wrap gap-1">
                  {liveAnnotations.map((ann) => (
                    <Badge
                      key={ann.id}
                      variant={ann.createdBy === 'ai' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ann.type} - {ann.createdBy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-destructive/10 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {error}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ScreenUnderstandingPanel;
