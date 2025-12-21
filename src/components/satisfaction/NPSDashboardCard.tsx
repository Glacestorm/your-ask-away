import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Users, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { useNPSMetrics } from '@/hooks/useSatisfactionSurveys';
import { getNPSScoreColor } from '@/types/satisfaction';

interface NPSDashboardCardProps {
  companyId?: string;
  gestorId?: string;
  segment?: string;
  compact?: boolean;
}

export function NPSDashboardCard({ companyId, gestorId, segment, compact = false }: NPSDashboardCardProps) {
  const { aggregateStats, isLoading } = useNPSMetrics({ 
    companyId, 
    gestorId, 
    segment,
    periodType: 'monthly' 
  });

  if (isLoading) {
    return (
      <Card className={compact ? 'h-32' : ''}>
        <CardContent className="flex items-center justify-center h-full py-8">
          <div className="animate-pulse text-muted-foreground">Cargando NPS...</div>
        </CardContent>
      </Card>
    );
  }

  if (!aggregateStats || aggregateStats.totalResponses === 0) {
    return (
      <Card className={compact ? 'h-32' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">NPS Score</CardTitle>
          <CardDescription>Net Promoter Score</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sin datos de encuestas</p>
        </CardContent>
      </Card>
    );
  }

  const { totalResponses, avgNPS, totalPromoters, totalPassives, totalDetractors, trend } = aggregateStats;
  const total = totalPromoters + totalPassives + totalDetractors;
  const promoterPercent = total > 0 ? (totalPromoters / total) * 100 : 0;
  const passivePercent = total > 0 ? (totalPassives / total) * 100 : 0;
  const detractorPercent = total > 0 ? (totalDetractors / total) * 100 : 0;

  const TrendIcon = trend === null ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend === null ? 'text-muted-foreground' : trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground';

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">NPS Score</p>
              <p className={`text-3xl font-bold ${getNPSScoreColor(avgNPS || 0)}`}>
                {avgNPS ?? '-'}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={trendColor}>
                <TrendIcon className="h-3 w-3 mr-1" />
                {trend !== null ? `${trend > 0 ? '+' : ''}${trend}` : '-'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{totalResponses} respuestas</p>
            </div>
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
            <CardTitle className="text-lg">NPS Score</CardTitle>
            <CardDescription>Net Promoter Score</CardDescription>
          </div>
          <Badge variant="outline" className={trendColor}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trend !== null ? `${trend > 0 ? '+' : ''}${trend} vs anterior` : 'Sin tendencia'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score principal */}
        <div className="text-center py-4">
          <span className={`text-5xl font-bold ${getNPSScoreColor(avgNPS || 0)}`}>
            {avgNPS ?? '-'}
          </span>
          <p className="text-sm text-muted-foreground mt-1">
            Basado en {totalResponses} respuestas
          </p>
        </div>

        {/* Distribución */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            <span className="text-sm w-24">Promotores</span>
            <Progress value={promoterPercent} className="flex-1 h-2" />
            <span className="text-sm w-16 text-right">{totalPromoters} ({Math.round(promoterPercent)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <Meh className="h-4 w-4 text-yellow-600" />
            <span className="text-sm w-24">Pasivos</span>
            <Progress value={passivePercent} className="flex-1 h-2" />
            <span className="text-sm w-16 text-right">{totalPassives} ({Math.round(passivePercent)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            <span className="text-sm w-24">Detractores</span>
            <Progress value={detractorPercent} className="flex-1 h-2" />
            <span className="text-sm w-16 text-right">{totalDetractors} ({Math.round(detractorPercent)}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NPSDashboardCard;
