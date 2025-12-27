/**
 * ModuleImpactAnalysis - Análisis de impacto con IA
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Shield,
  Zap,
  FileWarning,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImpactAnalysisResult {
  riskLevel: 'safe' | 'warning' | 'breaking';
  summary: string;
  affectedModules: Array<{
    module_key: string;
    impact_type: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
  breakingChanges: string[];
  score: number;
}

interface ModuleImpactAnalysisProps {
  moduleKey: string;
  currentState: Record<string, unknown>;
  proposedState: Record<string, unknown>;
  className?: string;
}

export function ModuleImpactAnalysis({ 
  moduleKey, 
  currentState,
  proposedState,
  className 
}: ModuleImpactAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImpactAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'analyze-module-impact',
        {
          body: {
            module_key: moduleKey,
            current_state: currentState,
            proposed_state: proposedState,
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setResult(data.analysis);
        
        // Show toast based on risk level
        if (data.analysis.riskLevel === 'safe') {
          toast.success('Análisis completado: cambios seguros');
        } else if (data.analysis.riskLevel === 'warning') {
          toast.warning('Análisis completado: se detectaron advertencias');
        } else {
          toast.error('Análisis completado: cambios incompatibles detectados');
        }
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Impact analysis error:', err);
      setError(err instanceof Error ? err.message : 'Error al analizar');
      toast.error('Error al ejecutar análisis de impacto');
    } finally {
      setIsAnalyzing(false);
    }
  }, [moduleKey, currentState, proposedState]);

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'safe':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'breaking':
        return <XCircle className="h-6 w-6 text-destructive" />;
      default:
        return <Shield className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'breaking':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Análisis de Impacto con IA
            </CardTitle>
            <CardDescription>
              Detecta automáticamente cambios que podrían romper otros módulos
            </CardDescription>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={isAnalyzing}
            variant={result ? 'outline' : 'default'}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                {result ? 'Re-analizar' : 'Analizar Impacto'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result ? (
          <div className="space-y-6">
            {/* Risk Summary */}
            <div className={cn(
              "p-4 rounded-lg border",
              result.riskLevel === 'safe' && "bg-green-500/5 border-green-500/30",
              result.riskLevel === 'warning' && "bg-amber-500/5 border-amber-500/30",
              result.riskLevel === 'breaking' && "bg-destructive/5 border-destructive/30",
            )}>
              <div className="flex items-start gap-4">
                {getRiskIcon(result.riskLevel)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">
                      {result.riskLevel === 'safe' && 'Cambios Seguros'}
                      {result.riskLevel === 'warning' && 'Advertencias Detectadas'}
                      {result.riskLevel === 'breaking' && 'Cambios Incompatibles'}
                    </h4>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-xs",
                        result.riskLevel === 'safe' && "text-green-500 border-green-500",
                        result.riskLevel === 'warning' && "text-amber-500 border-amber-500",
                        result.riskLevel === 'breaking' && "text-destructive border-destructive",
                      )}
                    >
                      Score: {result.score}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>
              </div>
              <Progress 
                value={result.score} 
                className={cn("mt-4 h-2", getRiskColor(result.riskLevel))}
              />
            </div>

            {/* Breaking Changes */}
            {result.breakingChanges.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2 text-destructive">
                  <FileWarning className="h-4 w-4" />
                  Cambios Incompatibles ({result.breakingChanges.length})
                </h4>
                <div className="space-y-2">
                  {result.breakingChanges.map((change, i) => (
                    <div 
                      key={i}
                      className="p-3 bg-destructive/5 border border-destructive/30 rounded-lg text-sm"
                    >
                      {change}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected Modules */}
            {result.affectedModules.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Módulos Afectados ({result.affectedModules.length})
                </h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {result.affectedModules.map((mod, i) => (
                      <div 
                        key={i}
                        className="p-3 border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono text-sm">{mod.module_key}</span>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                        <Badge 
                          variant={mod.severity === 'high' ? 'destructive' : 'outline'}
                        >
                          {mod.impact_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-500">
                  <Lightbulb className="h-4 w-4" />
                  Recomendaciones
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">Análisis de Impacto</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Ejecuta el análisis con IA para detectar automáticamente si tus cambios 
              afectarán a otros módulos del sistema.
            </p>
            <Button onClick={runAnalysis} disabled={isAnalyzing}>
              <Zap className="h-4 w-4 mr-2" />
              Iniciar Análisis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ModuleImpactAnalysis;
