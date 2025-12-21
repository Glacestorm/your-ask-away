import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePredictedNPS } from '@/hooks/usePredictedNPS';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface NPSPredictionCardProps {
  companyId?: string;
  showActions?: boolean;
}

export function NPSPredictionCard({ companyId, showActions = true }: NPSPredictionCardProps) {
  const { 
    predictions, 
    isLoading, 
    predictNPS, 
    isPredicting,
    getRiskColor,
    getRiskLabel,
    getRiskLevel 
  } = usePredictedNPS(companyId);

  const latestPrediction = predictions?.[0];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestPrediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predicción NPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              No hay predicciones disponibles
            </p>
            {showActions && companyId && (
              <Button 
                onClick={() => predictNPS(companyId)}
                disabled={isPredicting}
              >
                {isPredicting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generar Predicción
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskLevel = getRiskLevel(latestPrediction.risk_factors);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predicción NPS
          </CardTitle>
          <Badge 
            variant="outline" 
            className={getRiskColor(latestPrediction.risk_factors)}
          >
            {getRiskLabel(latestPrediction.risk_factors)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Prediction */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Score Predicho</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {latestPrediction.predicted_score}
              </span>
              {latestPrediction.predicted_score >= 9 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : latestPrediction.predicted_score <= 6 ? (
                <TrendingDown className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Confianza</p>
            <p className="text-lg font-semibold">
              {Math.round(latestPrediction.confidence_level * 100)}%
            </p>
          </div>
        </div>

        {/* Confidence Progress */}
        <div>
          <Progress 
            value={latestPrediction.confidence_level * 100} 
            className="h-2"
          />
        </div>

        {/* Risk Factors */}
        {latestPrediction.risk_factors && latestPrediction.risk_factors.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Factores de Riesgo
            </p>
            <div className="flex flex-wrap gap-2">
              {latestPrediction.risk_factors.map((factor, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Validity Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Predicción: {format(new Date(latestPrediction.prediction_date), 'dd MMM yyyy', { locale: es })}
          </span>
          <span>
            Válida hasta: {format(new Date(latestPrediction.valid_until), 'dd MMM yyyy', { locale: es })}
          </span>
        </div>

        {/* Actions */}
        {showActions && companyId && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => predictNPS(companyId)}
            disabled={isPredicting}
          >
            {isPredicting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Predicción
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
