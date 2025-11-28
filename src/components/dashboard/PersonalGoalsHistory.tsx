import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, TrendingUp, Target, Calendar, Award, Users, Building2, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface CompletedGoal {
  id: string;
  metric_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  period_type: string;
  description: string | null;
  created_at: string;
  final_value: number;
  achievement_percentage: number;
}

interface GoalStats {
  total_goals: number;
  completed_goals: number;
  average_achievement: number;
  best_metric: string;
  total_by_metric: Record<string, number>;
}

interface BenchmarkStats {
  office_avg_achievement: number;
  team_avg_achievement: number;
  office_total_goals: number;
  team_total_goals: number;
  metric_comparison: Record<string, {
    personal: number;
    office: number;
    team: number;
  }>;
}

interface TrendData {
  month: string;
  achievement: number;
  goals: number;
}

export function PersonalGoalsHistory() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [goals, setGoals] = useState<CompletedGoal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [benchmark, setBenchmark] = useState<BenchmarkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchCompletedGoals();
    }
  }, [user?.id]);

  const fetchCompletedGoals = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .eq('created_by', user?.id)
        .lt('period_end', today)
        .order('period_end', { ascending: false });

      if (error) throw error;

      // Calculate final values and achievement percentages
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          const finalValue = await calculateFinalValue(goal);
          const achievementPercentage = goal.target_value > 0 
            ? Math.round((finalValue / goal.target_value) * 100)
            : 0;

          return {
            ...goal,
            final_value: finalValue,
            achievement_percentage: achievementPercentage
          };
        })
      );

      setGoals(goalsWithProgress);
      calculateStats(goalsWithProgress);
      calculateTrends(goalsWithProgress);
      await fetchBenchmarkData(goalsWithProgress);
    } catch (error: any) {
      console.error('Error fetching completed goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBenchmarkData = async (personalGoals: CompletedGoal[]) => {
    try {
      // Get current user's office
      const { data: profile } = await supabase
        .from('profiles')
        .select('oficina')
        .eq('id', user?.id)
        .single();

      if (!profile?.oficina) return;

      // Fetch office goals (same office, excluding current user)
      const { data: officeUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('oficina', profile.oficina)
        .neq('id', user?.id);

      const officeUserIds = officeUsers?.map(u => u.id) || [];

      // Fetch team goals (all gestores excluding current user)
      const { data: teamUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user')
        .neq('user_id', user?.id);

      const teamUserIds = teamUsers?.map(u => u.user_id) || [];

      const today = new Date().toISOString().split('T')[0];

      // Fetch office goals
      let officeGoals: CompletedGoal[] = [];
      if (officeUserIds.length > 0) {
        const { data: officeGoalsData } = await supabase
          .from('goals')
          .select('*')
          .in('created_by', officeUserIds)
          .lt('period_end', today);

        officeGoals = await Promise.all(
          (officeGoalsData || []).map(async (goal) => {
            const finalValue = await calculateFinalValue(goal);
            return {
              ...goal,
              final_value: finalValue,
              achievement_percentage: goal.target_value > 0 
                ? Math.round((finalValue / goal.target_value) * 100)
                : 0
            };
          })
        );
      }

      // Fetch team goals
      let teamGoals: CompletedGoal[] = [];
      if (teamUserIds.length > 0) {
        const { data: teamGoalsData } = await supabase
          .from('goals')
          .select('*')
          .in('created_by', teamUserIds)
          .lt('period_end', today);

        teamGoals = await Promise.all(
          (teamGoalsData || []).map(async (goal) => {
            const finalValue = await calculateFinalValue(goal);
            return {
              ...goal,
              final_value: finalValue,
              achievement_percentage: goal.target_value > 0 
                ? Math.round((finalValue / goal.target_value) * 100)
                : 0
            };
          })
        );
      }

      // Calculate averages
      const officeAvg = officeGoals.length > 0
        ? officeGoals.reduce((sum, g) => sum + g.achievement_percentage, 0) / officeGoals.length
        : 0;

      const teamAvg = teamGoals.length > 0
        ? teamGoals.reduce((sum, g) => sum + g.achievement_percentage, 0) / teamGoals.length
        : 0;

      // Calculate metric-specific comparisons
      const metricComparison: Record<string, { personal: number; office: number; team: number }> = {};
      
      const allMetrics = new Set([
        ...personalGoals.map(g => g.metric_type),
        ...officeGoals.map(g => g.metric_type),
        ...teamGoals.map(g => g.metric_type)
      ]);

      allMetrics.forEach(metric => {
        const personalMetricGoals = personalGoals.filter(g => g.metric_type === metric);
        const officeMetricGoals = officeGoals.filter(g => g.metric_type === metric);
        const teamMetricGoals = teamGoals.filter(g => g.metric_type === metric);

        metricComparison[metric] = {
          personal: personalMetricGoals.length > 0
            ? personalMetricGoals.reduce((sum, g) => sum + g.achievement_percentage, 0) / personalMetricGoals.length
            : 0,
          office: officeMetricGoals.length > 0
            ? officeMetricGoals.reduce((sum, g) => sum + g.achievement_percentage, 0) / officeMetricGoals.length
            : 0,
          team: teamMetricGoals.length > 0
            ? teamMetricGoals.reduce((sum, g) => sum + g.achievement_percentage, 0) / teamMetricGoals.length
            : 0
        };
      });

      setBenchmark({
        office_avg_achievement: officeAvg,
        team_avg_achievement: teamAvg,
        office_total_goals: officeGoals.length,
        team_total_goals: teamGoals.length,
        metric_comparison: metricComparison
      });
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
    }
  };

  const calculateFinalValue = async (goal: any): Promise<number> => {
    let value = 0;

    switch (goal.metric_type) {
      case 'visits':
        const { count: visitsCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', user?.id)
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end);
        value = visitsCount || 0;
        break;

      case 'successful_visits':
        const { count: successCount } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', user?.id)
          .eq('result', 'Exitosa')
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end);
        value = successCount || 0;
        break;

      case 'companies':
        const { count: companiesCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', user?.id);
        value = companiesCount || 0;
        break;

      case 'products_offered':
        const { data: visitsData } = await supabase
          .from('visits')
          .select('productos_ofrecidos')
          .eq('gestor_id', user?.id)
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end)
          .not('productos_ofrecidos', 'is', null);
        
        value = visitsData?.reduce((sum, visit) => {
          return sum + (visit.productos_ofrecidos?.length || 0);
        }, 0) || 0;
        break;

      case 'average_vinculacion':
        const { data: companiesData } = await supabase
          .from('companies')
          .select('vinculacion_entidad_1')
          .eq('gestor_id', user?.id)
          .not('vinculacion_entidad_1', 'is', null);
        
        value = companiesData && companiesData.length > 0
          ? companiesData.reduce((sum, c) => sum + (c.vinculacion_entidad_1 || 0), 0) / companiesData.length
          : 0;
        break;
    }

    return value;
  };

  const calculateStats = (goalsData: CompletedGoal[]) => {
    if (goalsData.length === 0) {
      setStats(null);
      return;
    }

    const totalGoals = goalsData.length;
    const completedGoals = goalsData.filter(g => g.achievement_percentage >= 100).length;
    const avgAchievement = goalsData.reduce((sum, g) => sum + g.achievement_percentage, 0) / totalGoals;

    const metricCounts: Record<string, number> = {};
    const metricAchievements: Record<string, number[]> = {};

    goalsData.forEach(goal => {
      metricCounts[goal.metric_type] = (metricCounts[goal.metric_type] || 0) + 1;
      if (!metricAchievements[goal.metric_type]) {
        metricAchievements[goal.metric_type] = [];
      }
      metricAchievements[goal.metric_type].push(goal.achievement_percentage);
    });

    // Find best performing metric
    let bestMetric = '';
    let bestAvg = 0;
    Object.keys(metricAchievements).forEach(metric => {
      const avg = metricAchievements[metric].reduce((a, b) => a + b, 0) / metricAchievements[metric].length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestMetric = metric;
      }
    });

    setStats({
      total_goals: totalGoals,
      completed_goals: completedGoals,
      average_achievement: avgAchievement,
      best_metric: bestMetric,
      total_by_metric: metricCounts
    });
  };

  const calculateTrends = (goalsData: CompletedGoal[]) => {
    const monthlyData: Record<string, { total: number; sum: number; count: number }> = {};

    goalsData.forEach(goal => {
      const monthKey = format(new Date(goal.period_end), 'MMM yyyy');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, sum: 0, count: 0 };
      }
      monthlyData[monthKey].sum += goal.achievement_percentage;
      monthlyData[monthKey].count += 1;
      monthlyData[monthKey].total += 1;
    });

    const trendsArray = Object.keys(monthlyData)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-12)
      .map(month => ({
        month,
        achievement: Math.round(monthlyData[month].sum / monthlyData[month].count),
        goals: monthlyData[month].total
      }));

    setTrends(trendsArray);
  };

  const getMetricLabel = (metricType: string) => {
    return t(`gestor.dashboard.goals.metrics.${metricType}`);
  };

  const getStatusColor = (percentage: number): "default" | "secondary" | "destructive" => {
    if (percentage >= 100) return 'default';
    if (percentage >= 75) return 'default';
    if (percentage >= 50) return 'secondary';
    return 'destructive';
  };

  const formatValue = (metricType: string, value: number) => {
    if (metricType === 'average_vinculacion') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || goals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('gestor.dashboard.goals.history.noHistory')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('gestor.dashboard.goals.history.totalGoals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_goals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {t('gestor.dashboard.goals.history.completedGoals')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_goals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.completed_goals / stats.total_goals) * 100).toFixed(0)}% {t('gestor.dashboard.goals.history.completionRate')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('gestor.dashboard.goals.history.averageAchievement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.average_achievement.toFixed(0)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              {t('gestor.dashboard.goals.history.bestMetric')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{getMetricLabel(stats.best_metric)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      {benchmark && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('gestor.dashboard.goals.history.benchmarkTitle')}
            </CardTitle>
            <CardDescription>{t('gestor.dashboard.goals.history.benchmarkDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {t('gestor.dashboard.goals.history.personalAverage')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.average_achievement.toFixed(0)}%</div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('gestor.dashboard.goals.history.officeAverage')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{benchmark.office_avg_achievement.toFixed(0)}%</div>
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {stats.average_achievement > benchmark.office_avg_achievement ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">
                          +{(stats.average_achievement - benchmark.office_avg_achievement).toFixed(0)}% vs oficina
                        </span>
                      </>
                    ) : stats.average_achievement < benchmark.office_avg_achievement ? (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">
                          {(stats.average_achievement - benchmark.office_avg_achievement).toFixed(0)}% vs oficina
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{t('gestor.dashboard.goals.history.equalPerformance')}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {benchmark.office_total_goals} {t('gestor.dashboard.goals.history.officeGoals')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('gestor.dashboard.goals.history.teamAverage')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{benchmark.team_avg_achievement.toFixed(0)}%</div>
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {stats.average_achievement > benchmark.team_avg_achievement ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500">
                          +{(stats.average_achievement - benchmark.team_avg_achievement).toFixed(0)}% vs equipo
                        </span>
                      </>
                    ) : stats.average_achievement < benchmark.team_avg_achievement ? (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">
                          {(stats.average_achievement - benchmark.team_avg_achievement).toFixed(0)}% vs equipo
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{t('gestor.dashboard.goals.history.equalPerformance')}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {benchmark.team_total_goals} {t('gestor.dashboard.goals.history.teamGoals')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.keys(benchmark.metric_comparison).map(metric => ({
                metric: getMetricLabel(metric),
                personal: benchmark.metric_comparison[metric].personal,
                office: benchmark.metric_comparison[metric].office,
                team: benchmark.metric_comparison[metric].team
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="personal" fill="hsl(var(--primary))" name={t('gestor.dashboard.goals.history.personal')} />
                <Bar dataKey="office" fill="hsl(var(--secondary))" name={t('gestor.dashboard.goals.history.office')} />
                <Bar dataKey="team" fill="hsl(var(--accent))" name={t('gestor.dashboard.goals.history.team')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Trends Chart */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('gestor.dashboard.goals.history.trendsTitle')}
            </CardTitle>
            <CardDescription>{t('gestor.dashboard.goals.history.trendsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="achievement"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name={t('gestor.dashboard.goals.history.achievementPercentage')}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="goals"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  name={t('gestor.dashboard.goals.history.goalsCount')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Goals by Metric Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('gestor.dashboard.goals.history.goalsByMetric')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.keys(stats.total_by_metric).map(metric => ({
              metric: getMetricLabel(metric),
              count: stats.total_by_metric[metric]
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {t('gestor.dashboard.goals.history.completedGoalsList')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{getMetricLabel(goal.metric_type)}</div>
                    <div className="text-sm text-muted-foreground">
                      {goal.description || t('gestor.dashboard.goals.defaultDescription')}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(goal.achievement_percentage)}>
                    {goal.achievement_percentage}%
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('gestor.dashboard.goals.targetValue')}: </span>
                    <span className="font-mono font-semibold">
                      {formatValue(goal.metric_type, goal.target_value)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('gestor.dashboard.goals.history.finalValue')}: </span>
                    <span className="font-mono font-semibold">
                      {formatValue(goal.metric_type, goal.final_value)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(goal.period_start), 'dd/MM/yyyy')} - {format(new Date(goal.period_end), 'dd/MM/yyyy')}
                  </span>
                  <span className="font-semibold capitalize">{goal.period_type}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
