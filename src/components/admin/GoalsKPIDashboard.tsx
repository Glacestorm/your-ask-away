import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Target, Users, TrendingUp, TrendingDown, Building2, 
  Trophy, AlertTriangle, CheckCircle2, Clock, Loader2,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend 
} from 'recharts';

interface KPIStats {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  atRiskGoals: number;
  averageProgress: number;
  totalGestores: number;
}

interface MetricBreakdown {
  metric: string;
  label: string;
  total: number;
  completed: number;
  avgProgress: number;
}

interface OfficeBreakdown {
  office: string;
  totalGoals: number;
  avgProgress: number;
  gestores: number;
}

interface TopPerformer {
  id: string;
  name: string;
  office: string | null;
  avgProgress: number;
  completedGoals: number;
}

const METRIC_LABELS: Record<string, string> = {
  total_visits: 'Visites totals',
  successful_visits: 'Visites reeixides',
  assigned_companies: 'Empreses assignades',
  products_offered: 'Productes oferts',
  average_vinculacion: 'Vinculació mitjana',
  new_clients: 'Nous clients',
  visit_sheets: 'Fitxes de visita',
  tpv_volume: 'Volum TPV',
  conversion_rate: 'Taxa conversió',
  client_facturacion: 'Facturació clients',
  products_per_client: 'Productes/client',
  follow_ups: 'Seguiments'
};

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(217, 91%, 60%)',
  'hsl(48, 96%, 53%)',
  'hsl(280, 87%, 65%)',
  'hsl(346, 87%, 55%)',
];

const PIE_COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(48, 96%, 53%)', 'hsl(346, 87%, 55%)'];

const GoalsKPIDashboard = () => {
  const { user, isOfficeDirector } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [kpiStats, setKpiStats] = useState<KPIStats>({
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    atRiskGoals: 0,
    averageProgress: 0,
    totalGestores: 0
  });
  const [metricBreakdown, setMetricBreakdown] = useState<MetricBreakdown[]>([]);
  const [officeBreakdown, setOfficeBreakdown] = useState<OfficeBreakdown[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [userOficina, setUserOficina] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserOficina();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchKPIData();
      
      const channel = supabase
        .channel('goals-kpi-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
          fetchKPIData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userOficina]);

  const fetchUserOficina = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('oficina')
      .eq('id', user.id)
      .single();
    if (data) {
      setUserOficina(data.oficina);
    }
  };

  const calculateGoalProgress = async (goal: any, gestorId: string): Promise<number> => {
    const { metric_type, target_value, period_start, period_end } = goal;
    let currentValue = 0;

    switch (metric_type) {
      case 'total_visits':
      case 'successful_visits': {
        let query = supabase
          .from('visits')
          .select('id', { count: 'exact' })
          .eq('gestor_id', gestorId)
          .gte('visit_date', period_start)
          .lte('visit_date', period_end);
        
        if (metric_type === 'successful_visits') {
          query = query.eq('result', 'exitosa');
        }
        
        const { count } = await query;
        currentValue = count || 0;
        break;
      }
      case 'assigned_companies': {
        const { count } = await supabase
          .from('companies')
          .select('id', { count: 'exact' })
          .eq('gestor_id', gestorId);
        currentValue = count || 0;
        break;
      }
      case 'new_clients': {
        const { count } = await supabase
          .from('companies')
          .select('id', { count: 'exact' })
          .eq('gestor_id', gestorId)
          .gte('created_at', period_start)
          .lte('created_at', period_end);
        currentValue = count || 0;
        break;
      }
      case 'visit_sheets': {
        const { count } = await supabase
          .from('visit_sheets')
          .select('id', { count: 'exact' })
          .eq('gestor_id', gestorId)
          .gte('fecha', period_start)
          .lte('fecha', period_end);
        currentValue = count || 0;
        break;
      }
      case 'tpv_volume': {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', gestorId);
        
        if (companies && companies.length > 0) {
          const companyIds = companies.map(c => c.id);
          const { data: terminals } = await supabase
            .from('company_tpv_terminals')
            .select('monthly_volume')
            .in('company_id', companyIds)
            .eq('status', 'active');
          
          currentValue = terminals?.reduce((sum, t) => sum + (t.monthly_volume || 0), 0) || 0;
        }
        break;
      }
      default:
        currentValue = 0;
    }

    return target_value > 0 ? Math.min((currentValue / target_value) * 100, 100) : 0;
  };

  const fetchKPIData = async () => {
    setLoading(true);
    try {
      // Fetch gestores
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      if (!userRoles) return;

      const gestorIds = userRoles.map(ur => ur.user_id);

      let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email, oficina')
        .in('id', gestorIds);

      if (isOfficeDirector && userOficina) {
        profilesQuery = profilesQuery.eq('oficina', userOficina);
      }

      const { data: profiles } = await profilesQuery;
      if (!profiles) return;

      const filteredGestorIds = profiles.map(p => p.id);

      // Fetch active goals
      const today = new Date().toISOString().split('T')[0];
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .in('assigned_to', filteredGestorIds)
        .lte('period_start', today)
        .gte('period_end', today);

      if (!goals) return;

      // Calculate progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal) => {
          const progress = await calculateGoalProgress(goal, goal.assigned_to!);
          return { ...goal, progress };
        })
      );

      // Calculate KPI stats
      const totalGoals = goalsWithProgress.length;
      const completedGoals = goalsWithProgress.filter(g => g.progress >= 100).length;
      const inProgressGoals = goalsWithProgress.filter(g => g.progress >= 50 && g.progress < 100).length;
      const atRiskGoals = goalsWithProgress.filter(g => g.progress < 50).length;
      const averageProgress = totalGoals > 0 
        ? goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / totalGoals 
        : 0;

      setKpiStats({
        totalGoals,
        completedGoals,
        inProgressGoals,
        atRiskGoals,
        averageProgress,
        totalGestores: filteredGestorIds.length
      });

      // Calculate metric breakdown
      const metricGroups: Record<string, { total: number; completed: number; totalProgress: number }> = {};
      goalsWithProgress.forEach(goal => {
        if (!metricGroups[goal.metric_type]) {
          metricGroups[goal.metric_type] = { total: 0, completed: 0, totalProgress: 0 };
        }
        metricGroups[goal.metric_type].total++;
        metricGroups[goal.metric_type].totalProgress += goal.progress;
        if (goal.progress >= 100) {
          metricGroups[goal.metric_type].completed++;
        }
      });

      const breakdown: MetricBreakdown[] = Object.entries(metricGroups).map(([metric, data]) => ({
        metric,
        label: METRIC_LABELS[metric] || metric,
        total: data.total,
        completed: data.completed,
        avgProgress: data.total > 0 ? data.totalProgress / data.total : 0
      }));
      setMetricBreakdown(breakdown.sort((a, b) => b.avgProgress - a.avgProgress));

      // Calculate office breakdown
      const officeGroups: Record<string, { goals: number; totalProgress: number; gestors: Set<string> }> = {};
      goalsWithProgress.forEach(goal => {
        const profile = profiles.find(p => p.id === goal.assigned_to);
        const office = profile?.oficina || 'Sense oficina';
        if (!officeGroups[office]) {
          officeGroups[office] = { goals: 0, totalProgress: 0, gestors: new Set() };
        }
        officeGroups[office].goals++;
        officeGroups[office].totalProgress += goal.progress;
        officeGroups[office].gestors.add(goal.assigned_to!);
      });

      const officeData: OfficeBreakdown[] = Object.entries(officeGroups).map(([office, data]) => ({
        office,
        totalGoals: data.goals,
        avgProgress: data.goals > 0 ? data.totalProgress / data.goals : 0,
        gestores: data.gestors.size
      }));
      setOfficeBreakdown(officeData.sort((a, b) => b.avgProgress - a.avgProgress));

      // Calculate top performers
      const gestorProgress: Record<string, { totalProgress: number; goalCount: number; completed: number }> = {};
      goalsWithProgress.forEach(goal => {
        if (!gestorProgress[goal.assigned_to!]) {
          gestorProgress[goal.assigned_to!] = { totalProgress: 0, goalCount: 0, completed: 0 };
        }
        gestorProgress[goal.assigned_to!].totalProgress += goal.progress;
        gestorProgress[goal.assigned_to!].goalCount++;
        if (goal.progress >= 100) {
          gestorProgress[goal.assigned_to!].completed++;
        }
      });

      const performers: TopPerformer[] = Object.entries(gestorProgress).map(([id, data]) => {
        const profile = profiles.find(p => p.id === id);
        return {
          id,
          name: profile?.full_name || profile?.email || 'Desconegut',
          office: profile?.oficina || null,
          avgProgress: data.goalCount > 0 ? data.totalProgress / data.goalCount : 0,
          completedGoals: data.completed
        };
      });
      setTopPerformers(performers.sort((a, b) => b.avgProgress - a.avgProgress).slice(0, 5));

    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Completats', value: kpiStats.completedGoals, color: PIE_COLORS[0] },
    { name: 'En progrés', value: kpiStats.inProgressGoals, color: PIE_COLORS[1] },
    { name: 'En risc', value: kpiStats.atRiskGoals, color: PIE_COLORS[3] }
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiStats.totalGoals}</p>
                <p className="text-xs text-muted-foreground">Objectius actius</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{kpiStats.completedGoals}</p>
                <p className="text-xs text-muted-foreground">Completats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{kpiStats.inProgressGoals}</p>
                <p className="text-xs text-muted-foreground">En progrés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{kpiStats.atRiskGoals}</p>
                <p className="text-xs text-muted-foreground">En risc</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiStats.averageProgress.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Progrés mitjà</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{kpiStats.totalGestores}</p>
                <p className="text-xs text-muted-foreground">Gestors actius</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribució d'objectius
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No hi ha objectius actius
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress by Metric Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progrés per tipus de mètrica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metricBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="label" type="category" width={120} fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Progrés mitjà']}
                  />
                  <Bar dataKey="avgProgress" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No hi ha dades disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress by Office */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Progrés per oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {officeBreakdown.length > 0 ? (
                officeBreakdown.map((office, index) => (
                  <div key={office.office} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{office.office}</span>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span>{office.gestores} gestors</span>
                        <span>{office.totalGoals} obj.</span>
                        <Badge variant={office.avgProgress >= 75 ? "default" : office.avgProgress >= 50 ? "secondary" : "destructive"}>
                          {office.avgProgress.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={office.avgProgress} 
                      className="h-2"
                    />
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hi ha dades per oficina
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top 5 gestors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-yellow-950' :
                      index === 1 ? 'bg-gray-400 text-gray-950' :
                      index === 2 ? 'bg-amber-600 text-amber-950' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{performer.name}</p>
                      <p className="text-xs text-muted-foreground">{performer.office || 'Sense oficina'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{performer.avgProgress.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">{performer.completedGoals} completats</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hi ha gestors amb objectius
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoalsKPIDashboard;
