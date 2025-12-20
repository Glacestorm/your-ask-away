import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Euro,
  Target,
  BarChart3
} from 'lucide-react';
import { NBAStats } from '@/hooks/useNextBestAction';

interface NBAImpactTrackerProps {
  stats: NBAStats | null | undefined;
}

export function NBAImpactTracker({ stats }: NBAImpactTrackerProps) {
  if (!stats) return null;

  const totalActions = stats.completed + stats.dismissed + stats.pending;
  const completionRate = totalActions > 0 
    ? Math.round((stats.completed / totalActions) * 100) 
    : 0;

  const valueRealizationRate = stats.totalEstimatedValue > 0
    ? Math.round((stats.totalActualValue / stats.totalEstimatedValue) * 100)
    : 0;

  return (
    <Card className="bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Impacte NBA en MRR
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Completion Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Target className="h-4 w-4" />
                Taxa de Completació
              </span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {stats.completed} de {totalActions} accions completades
            </p>
          </div>

          {/* Value Realization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Euro className="h-4 w-4" />
                Realització de Valor
              </span>
              <span className="font-semibold text-green-600">{valueRealizationRate}%</span>
            </div>
            <Progress 
              value={valueRealizationRate} 
              className="h-2 [&>div]:bg-green-500" 
            />
            <p className="text-xs text-muted-foreground">
              {(stats.totalActualValue / 1000).toFixed(1)}k€ de {(stats.totalEstimatedValue / 1000).toFixed(1)}k€ estimat
            </p>
          </div>

          {/* ROI Trend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                ROI per Acció
              </span>
              <span className="font-semibold text-emerald-600">
                {stats.completed > 0 
                  ? `${(stats.totalActualValue / stats.completed).toFixed(0)}€`
                  : '0€'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                  style={{ width: `${Math.min(100, valueRealizationRate)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Valor mig per acció completada
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Per Categoria
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div 
                  key={category}
                  className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1"
                >
                  <span className="text-xs capitalize">{category}</span>
                  <span className="text-xs font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
