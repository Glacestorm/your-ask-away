import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRevenueScoring } from '@/hooks/useRevenueScoring';
import { Target, TrendingUp, TrendingDown, Minus, Shield, Rocket, Heart, Activity } from 'lucide-react';

const RevenueScoreCard: React.FC = () => {
  const { 
    scores, 
    isLoading, 
    getAverageScores, 
    getScoreDistribution,
    getTopPerformers,
    getAtRiskAccounts 
  } = useRevenueScoring();

  const avgScores = getAverageScores();
  const distribution = getScoreDistribution();
  const topPerformers = getTopPerformers(5);
  const atRiskAccounts = getAtRiskAccounts(40);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-chart-2';
    if (score >= 60) return 'text-chart-1';
    if (score >= 40) return 'text-chart-4';
    return 'text-destructive';
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-chart-2" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse">Cargando scores...</div>
        </CardContent>
      </Card>
    );
  }

  const scoreMetrics = [
    { key: 'health', label: 'Salud', icon: Heart, value: avgScores?.health || 0, color: 'chart-1' },
    { key: 'expansion', label: 'Expansión', icon: Rocket, value: avgScores?.expansion || 0, color: 'chart-2' },
    { key: 'retention', label: 'Retención', icon: Shield, value: avgScores?.retention || 0, color: 'chart-3' },
    { key: 'engagement', label: 'Engagement', icon: Activity, value: avgScores?.engagement || 0, color: 'chart-4' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Revenue Score Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getScoreColor(avgScores?.overall || 0)}`}>
                {(avgScores?.overall || 0).toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Score Promedio</p>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {scoreMetrics.map((metric) => (
                <div key={metric.key} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <metric.icon className={`h-4 w-4 text-${metric.color}`} />
                    <span className="text-xs text-muted-foreground">{metric.label}</span>
                  </div>
                  <p className={`text-xl font-bold ${getScoreColor(metric.value)}`}>
                    {metric.value.toFixed(0)}
                  </p>
                  <Progress value={metric.value} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {distribution.map((bucket) => (
              <div key={bucket.range} className="flex-1 text-center">
                <div className="h-16 bg-muted/30 rounded-t-lg relative overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-primary/60 rounded-t"
                    style={{ height: `${Math.min((bucket.count / Math.max(...distribution.map(d => d.count), 1)) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{bucket.range}</p>
                <p className="text-sm font-medium">{bucket.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-chart-2" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((score, index) => (
              <div 
                key={score.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-chart-2/5 border border-chart-2/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-chart-2/20 flex items-center justify-center text-chart-2 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{score.company?.name || 'Empresa'}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {getTrendIcon(score.score_trend)}
                      <span>{score.score_trend || 'stable'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${getScoreColor(score.overall_score)}`}>
                    {score.overall_score.toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
            {topPerformers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay datos</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-destructive" />
            Cuentas en Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {atRiskAccounts.slice(0, 5).map((score) => (
              <div 
                key={score.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{score.company?.name || 'Empresa'}</p>
                    {score.next_best_action && (
                      <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {score.next_best_action}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${getScoreColor(score.overall_score)}`}>
                    {score.overall_score.toFixed(0)}
                  </p>
                  <Badge variant="destructive" className="text-xs">
                    P{score.action_priority || '-'}
                  </Badge>
                </div>
              </div>
            ))}
            {atRiskAccounts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay cuentas en riesgo</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueScoreCard;
