import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  Info,
  AlertOctagon
} from 'lucide-react';
import { useSupportCopilot, ActionAnalysis } from '@/hooks/admin/useSupportCopilot';
import { cn } from '@/lib/utils';

interface ActionPreAnalyzerProps {
  actionType: string;
  description: string;
  onApprove: () => void;
  onReject: () => void;
  onAnalysisComplete?: (analysis: ActionAnalysis) => void;
  className?: string;
}

export function ActionPreAnalyzer({
  actionType,
  description,
  onApprove,
  onReject,
  onAnalysisComplete,
  className
}: ActionPreAnalyzerProps) {
  const [analysis, setAnalysis] = useState<ActionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const { analyzeAction } = useSupportCopilot();

  const handleAnalyze = useCallback(async () => {
    if (!actionType || !description) return;
    
    setIsAnalyzing(true);
    const result = await analyzeAction(actionType, description);
    setIsAnalyzing(false);
    setHasAnalyzed(true);

    if (result) {
      setAnalysis(result);
      onAnalysisComplete?.(result);
    }
  }, [actionType, description, analyzeAction, onAnalysisComplete]);

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-600',
          border: 'border-red-500/30',
          icon: AlertOctagon
        };
      case 'high':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-500',
          border: 'border-orange-500/30',
          icon: AlertTriangle
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-600',
          border: 'border-yellow-500/30',
          icon: Info
        };
      default:
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-600',
          border: 'border-green-500/30',
          icon: CheckCircle
        };
    }
  };

  if (!actionType || !description) {
    return null;
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Pre-análisis de Acción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAnalyzed ? (
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            variant="outline"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analizando con IA...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Analizar antes de registrar
              </>
            )}
          </Button>
        ) : analysis ? (
          <div className="space-y-3">
            {/* Risk Score */}
            <div className={cn(
              "p-3 rounded-lg border",
              getRiskStyles(analysis.riskLevel).bg,
              getRiskStyles(analysis.riskLevel).border
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = getRiskStyles(analysis.riskLevel).icon;
                    return <IconComponent className={cn("h-5 w-5", getRiskStyles(analysis.riskLevel).text)} />;
                  })()}
                  <span className={cn("font-medium", getRiskStyles(analysis.riskLevel).text)}>
                    Riesgo {analysis.riskLevel === 'critical' ? 'Crítico' :
                            analysis.riskLevel === 'high' ? 'Alto' :
                            analysis.riskLevel === 'medium' ? 'Medio' : 'Bajo'}
                  </span>
                </div>
                <Badge variant="outline" className={getRiskStyles(analysis.riskLevel).text}>
                  {analysis.riskScore}/100
                </Badge>
              </div>
              <Progress 
                value={analysis.riskScore} 
                className={cn("h-2", 
                  analysis.riskLevel === 'critical' || analysis.riskLevel === 'high' 
                    ? "[&>div]:bg-red-500" 
                    : analysis.riskLevel === 'medium'
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                )}
              />
            </div>

            {/* Requires Approval Warning */}
            {analysis.requiresApproval && (
              <div className="flex items-center gap-2 p-2 rounded bg-orange-500/10 text-orange-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Esta acción requiere aprobación dual
              </div>
            )}

            {/* Better Description */}
            <div className="p-2 rounded bg-muted text-sm">
              <span className="text-muted-foreground">Descripción mejorada: </span>
              {analysis.betterDescription}
            </div>

            {/* Compliance Flags */}
            {analysis.complianceFlags.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Banderas de cumplimiento:</span>
                <div className="flex flex-wrap gap-1">
                  {analysis.complianceFlags.map((flag, i) => (
                    <Badge key={i} variant="destructive" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Recomendaciones:</span>
                <ul className="text-xs space-y-1">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={onApprove}
                className="flex-1"
                variant={analysis.riskLevel === 'critical' ? 'destructive' : 'default'}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continuar
              </Button>
              <Button 
                onClick={onReject}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-4">
            No se pudo obtener el análisis
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ActionPreAnalyzer;
