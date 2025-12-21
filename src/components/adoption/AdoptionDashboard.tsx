import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Target,
  AlertTriangle,
  Zap,
  Clock,
  BarChart3,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAdoptionTracking } from '@/hooks/useAdoptionTracking';
import { cn } from '@/lib/utils';

interface AdoptionDashboardProps {
  companyId: string;
}

const trendIcons = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
};

const riskColors = {
  low: 'text-green-500 bg-green-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  high: 'text-red-500 bg-red-500/10',
};

export function AdoptionDashboard({ companyId }: AdoptionDashboardProps) {
  const {
    featureUsage,
    timeToValueMetrics,
    lowUsageAlerts,
    adoptionScore,
    loadingUsage,
    loadingTTV,
    loadingAlerts,
    loadingScore,
    resolveAlert,
    predictTimeToValue,
    isPredicting,
    getAdoptionSummary,
    getRiskIndicators,
  } = useAdoptionTracking(companyId);

  const summary = getAdoptionSummary();
  const riskIndicators = getRiskIndicators();

  const isLoading = loadingUsage || loadingTTV || loadingAlerts || loadingScore;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const TrendIcon = adoptionScore?.trend ? trendIcons[adoptionScore.trend as keyof typeof trendIcons] : Minus;

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Score de Adopción
              </CardTitle>
              {adoptionScore?.risk_level && (
                <Badge className={cn(riskColors[adoptionScore.risk_level as keyof typeof riskColors])}>
                  Riesgo {adoptionScore.risk_level}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold text-primary">
                {adoptionScore?.overall_score || 0}
              </div>
              <div className="flex items-center gap-1 mb-2">
                {TrendIcon && <TrendIcon className={cn(
                  'h-4 w-4',
                  adoptionScore?.trend === 'improving' && 'text-green-500',
                  adoptionScore?.trend === 'declining' && 'text-red-500',
                  adoptionScore?.trend === 'stable' && 'text-muted-foreground'
                )} />}
                <span className={cn(
                  'text-sm font-medium',
                  adoptionScore?.trend === 'improving' && 'text-green-500',
                  adoptionScore?.trend === 'declining' && 'text-red-500'
                )}>
                  {adoptionScore?.trend_percentage ? `${adoptionScore.trend_percentage > 0 ? '+' : ''}${adoptionScore.trend_percentage}%` : '—'}
                </span>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              {[
                { label: 'Activación', value: adoptionScore?.activation_score, icon: Zap },
                { label: 'Engagement', value: adoptionScore?.engagement_score, icon: Activity },
                { label: 'Profundidad', value: adoptionScore?.depth_score, icon: BarChart3 },
                { label: 'Amplitud', value: adoptionScore?.breadth_score, icon: Target },
                { label: 'Time to Value', value: adoptionScore?.time_to_value_score, icon: Clock },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-xl font-semibold">{metric.value || 0}</div>
                  <div className="text-xs text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Risk Indicators */}
      {riskIndicators.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Indicadores de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskIndicators.map((indicator, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    indicator.severity === 'high' && 'bg-red-500/10',
                    indicator.severity === 'medium' && 'bg-yellow-500/10',
                    indicator.severity === 'low' && 'bg-blue-500/10'
                  )}
                >
                  <AlertTriangle className={cn(
                    'h-4 w-4',
                    indicator.severity === 'high' && 'text-red-500',
                    indicator.severity === 'medium' && 'text-yellow-500',
                    indicator.severity === 'low' && 'text-blue-500'
                  )} />
                  <span className="text-sm">{indicator.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Usage Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalUsage || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.uniqueFeatures || 0} features únicas
            </p>
          </CardContent>
        </Card>

        {/* Stickiness */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stickiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.stickiness?.toFixed(0) || 0}%</div>
            <Progress value={summary?.stickiness || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              DAU/MAU ratio
            </p>
          </CardContent>
        </Card>

        {/* Avg Session */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sesión Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((summary?.avgSessionDuration || 0) / 60)} min
            </div>
            <p className="text-xs text-muted-foreground">
              Tiempo promedio por sesión
            </p>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {lowUsageAlerts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time to Value Metrics */}
      {timeToValueMetrics && timeToValueMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time to Value
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => predictTimeToValue(companyId)}
                disabled={isPredicting}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isPredicting ? 'Prediciendo...' : 'Predecir TTV'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeToValueMetrics.slice(0, 5).map((metric) => (
                <div key={metric.id} className="flex items-center gap-4">
                  <div className={cn(
                    'p-2 rounded-lg',
                    metric.is_achieved ? 'bg-green-500/10' : 'bg-muted'
                  )}>
                    <Target className={cn(
                      'h-4 w-4',
                      metric.is_achieved ? 'text-green-500' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{metric.metric_type}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {metric.is_achieved ? (
                        <span className="text-green-500">
                          Alcanzado en {metric.actual_days} días
                        </span>
                      ) : (
                        <span>
                          Objetivo: {metric.target_days} días
                        </span>
                      )}
                    </div>
                  </div>
                  {metric.prediction_confidence && (
                    <Badge variant="secondary">
                      {Math.round(metric.prediction_confidence * 100)}% confianza
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Usage Alerts */}
      {lowUsageAlerts && lowUsageAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Bajo Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowUsageAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="font-medium">
                        {alert.feature_key || alert.product_key || 'Producto'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alert.days_since_last_use} días sin uso • {alert.alert_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      alert.severity === 'critical' && 'border-red-500 text-red-500',
                      alert.severity === 'warning' && 'border-yellow-500 text-yellow-500'
                    )}>
                      {alert.severity}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resolveAlert({ alertId: alert.id, resolutionAction: 'manual_review' })}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Usage List */}
      {featureUsage && featureUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Uso por Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featureUsage.slice(0, 10).map((usage) => {
                const maxUsage = Math.max(...featureUsage.map(f => f.usage_count || 0));
                const percentage = maxUsage > 0 ? ((usage.usage_count || 0) / maxUsage) * 100 : 0;
                
                return (
                  <div key={usage.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{usage.feature_key}</span>
                      <span className="text-muted-foreground">{usage.usage_count} usos</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
