import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Target, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MetricAnalysis {
  metric: string;
  personal: number;
  office: number;
  team: number;
  gap_office: number;
  gap_team: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  recommendations: string[];
}

interface PersonalGoalsDetailedAnalysisProps {
  personalAvg: number;
  officeAvg: number;
  teamAvg: number;
  metricComparison: Record<string, {
    personal: number;
    office: number;
    team: number;
  }>;
}

export function PersonalGoalsDetailedAnalysis({
  personalAvg,
  officeAvg,
  teamAvg,
  metricComparison
}: PersonalGoalsDetailedAnalysisProps) {
  const { t } = useLanguage();

  const getMetricLabel = (metricType: string) => {
    return t(`gestor.dashboard.goals.metrics.${metricType}`);
  };

  const getRecommendations = (metric: string, gapOffice: number, gapTeam: number): string[] => {
    const recommendations: string[] = [];
    
    if (gapOffice < -10 || gapTeam < -10) {
      // Significantly below average
      switch (metric) {
        case 'visits':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.visits.increase'));
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.visits.schedule'));
          break;
        case 'successful_visits':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.successfulVisits.preparation'));
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.successfulVisits.followUp'));
          break;
        case 'companies':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.companies.prospecting'));
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.companies.network'));
          break;
        case 'products_offered':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.products.diversify'));
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.products.training'));
          break;
        case 'average_vinculacion':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.vinculacion.deepen'));
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.vinculacion.value'));
          break;
      }
    } else if (gapOffice < 0 || gapTeam < 0) {
      // Slightly below average
      switch (metric) {
        case 'visits':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.visits.consistency'));
          break;
        case 'successful_visits':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.successfulVisits.technique'));
          break;
        case 'companies':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.companies.quality'));
          break;
        case 'products_offered':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.products.crossSell'));
          break;
        case 'average_vinculacion':
          recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.vinculacion.maintain'));
          break;
      }
    } else {
      // Above average
      recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.excellent.maintain'));
      recommendations.push(t('gestor.dashboard.goals.analysis.recommendations.excellent.mentor'));
    }

    return recommendations;
  };

  const getStatus = (gapOffice: number, gapTeam: number): MetricAnalysis['status'] => {
    const avgGap = (gapOffice + gapTeam) / 2;
    if (avgGap >= 10) return 'excellent';
    if (avgGap >= 0) return 'good';
    if (avgGap >= -10) return 'needs_improvement';
    return 'critical';
  };

  const analyses: MetricAnalysis[] = Object.keys(metricComparison).map(metric => {
    const data = metricComparison[metric];
    const gapOffice = data.personal - data.office;
    const gapTeam = data.personal - data.team;
    const status = getStatus(gapOffice, gapTeam);
    const recommendations = getRecommendations(metric, gapOffice, gapTeam);

    return {
      metric,
      personal: data.personal,
      office: data.office,
      team: data.team,
      gap_office: gapOffice,
      gap_team: gapTeam,
      status,
      recommendations
    };
  });

  // Sort by status priority (critical first, excellent last)
  const sortedAnalyses = [...analyses].sort((a, b) => {
    const statusOrder = { critical: 0, needs_improvement: 1, good: 2, excellent: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const getStatusBadge = (status: MetricAnalysis['status']) => {
    switch (status) {
      case 'excellent':
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('gestor.dashboard.goals.analysis.status.excellent')}
          </Badge>
        );
      case 'good':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
            <TrendingUp className="h-3 w-3 mr-1" />
            {t('gestor.dashboard.goals.analysis.status.good')}
          </Badge>
        );
      case 'needs_improvement':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t('gestor.dashboard.goals.analysis.status.needsImprovement')}
          </Badge>
        );
      case 'critical':
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t('gestor.dashboard.goals.analysis.status.critical')}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('gestor.dashboard.goals.analysis.overallTitle')}
          </CardTitle>
          <CardDescription>{t('gestor.dashboard.goals.analysis.overallDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t('gestor.dashboard.goals.analysis.vsOffice')}</span>
                <span className={`font-bold ${personalAvg >= officeAvg ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {personalAvg >= officeAvg ? '+' : ''}{(personalAvg - officeAvg).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, ((personalAvg / officeAvg) * 100)))} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t('gestor.dashboard.goals.analysis.vsTeam')}</span>
                <span className={`font-bold ${personalAvg >= teamAvg ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {personalAvg >= teamAvg ? '+' : ''}{(personalAvg - teamAvg).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, Math.max(0, ((personalAvg / teamAvg) * 100)))} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t('gestor.dashboard.goals.analysis.performance')}</span>
                <span className="font-bold text-primary">{personalAvg.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.min(100, personalAvg)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric-by-Metric Analysis */}
      <div className="space-y-4">
        {sortedAnalyses.map((analysis) => (
          <Card key={analysis.metric} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {getMetricLabel(analysis.metric)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(analysis.status)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{analysis.personal.toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">{t('gestor.dashboard.goals.analysis.yourAverage')}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comparison Bars */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('gestor.dashboard.goals.analysis.personal')}</span>
                    <span className="font-semibold">{analysis.personal.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(100, analysis.personal)} className="h-2 flex-1" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('gestor.dashboard.goals.analysis.office')}</span>
                    <span className="font-semibold flex items-center gap-1">
                      {analysis.office.toFixed(0)}%
                      {analysis.gap_office > 0 ? (
                        <span className="text-green-600 text-[10px]">
                          (+{analysis.gap_office.toFixed(0)})
                        </span>
                      ) : analysis.gap_office < 0 ? (
                        <span className="text-red-600 text-[10px]">
                          ({analysis.gap_office.toFixed(0)})
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(100, analysis.office)} className="h-2 flex-1 opacity-50" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t('gestor.dashboard.goals.analysis.team')}</span>
                    <span className="font-semibold flex items-center gap-1">
                      {analysis.team.toFixed(0)}%
                      {analysis.gap_team > 0 ? (
                        <span className="text-green-600 text-[10px]">
                          (+{analysis.gap_team.toFixed(0)})
                        </span>
                      ) : analysis.gap_team < 0 ? (
                        <span className="text-red-600 text-[10px]">
                          ({analysis.gap_team.toFixed(0)})
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(100, analysis.team)} className="h-2 flex-1 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    {t('gestor.dashboard.goals.analysis.recommendationsTitle')}
                  </div>
                  <ul className="space-y-1 ml-6">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground list-disc">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
