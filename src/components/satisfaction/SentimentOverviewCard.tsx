import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSentimentAnalysis } from '@/hooks/useSentimentAnalysis';
import { getSentimentColor, getSentimentIcon } from '@/types/satisfaction';
import { AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface SentimentOverviewCardProps {
  companyId: string;
  compact?: boolean;
}

export function SentimentOverviewCard({ companyId, compact = false }: SentimentOverviewCardProps) {
  const { averageSentiment, sentimentTrend, loadingHistory } = useSentimentAnalysis(companyId);

  if (loadingHistory) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Cargando sentimiento...</div>
        </CardContent>
      </Card>
    );
  }

  if (!averageSentiment) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Análisis de Sentimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sin análisis disponible</p>
        </CardContent>
      </Card>
    );
  }

  const overallSentiment = averageSentiment.score > 0.3 ? 'positive' 
    : averageSentiment.score < -0.3 ? 'negative' 
    : 'neutral';

  const TrendIcon = sentimentTrend?.improving ? TrendingUp : TrendingDown;

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getSentimentIcon(overallSentiment)}</span>
              <div>
                <p className="text-sm text-muted-foreground">Sentimiento</p>
                <p className={`font-semibold ${getSentimentColor(overallSentiment)}`}>
                  {averageSentiment.score.toFixed(2)}
                </p>
              </div>
            </div>
            {averageSentiment.actionRequiredCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {averageSentiment.actionRequiredCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Análisis de Sentimiento
            </CardTitle>
            <CardDescription>Basado en interacciones recientes</CardDescription>
          </div>
          {sentimentTrend && (
            <Badge variant="outline" className={sentimentTrend.improving ? 'text-green-600' : 'text-red-600'}>
              <TrendIcon className="h-3 w-3 mr-1" />
              {sentimentTrend.improving ? 'Mejorando' : 'Declinando'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4 py-4">
          <span className="text-5xl">{getSentimentIcon(overallSentiment)}</span>
          <div className="text-center">
            <p className={`text-3xl font-bold ${getSentimentColor(overallSentiment)}`}>
              {averageSentiment.score.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Score promedio</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div className="p-2 rounded bg-green-50 dark:bg-green-950">
            <p className="font-semibold text-green-600">{averageSentiment.positiveCount}</p>
            <p className="text-xs text-muted-foreground">Positivo</p>
          </div>
          <div className="p-2 rounded bg-gray-50 dark:bg-gray-900">
            <p className="font-semibold text-gray-600">{averageSentiment.neutralCount}</p>
            <p className="text-xs text-muted-foreground">Neutral</p>
          </div>
          <div className="p-2 rounded bg-red-50 dark:bg-red-950">
            <p className="font-semibold text-red-600">{averageSentiment.negativeCount}</p>
            <p className="text-xs text-muted-foreground">Negativo</p>
          </div>
          <div className="p-2 rounded bg-orange-50 dark:bg-orange-950">
            <p className="font-semibold text-orange-600">{averageSentiment.mixedCount}</p>
            <p className="text-xs text-muted-foreground">Mixto</p>
          </div>
        </div>

        {averageSentiment.actionRequiredCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {averageSentiment.actionRequiredCount} interacciones requieren atención
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SentimentOverviewCard;
