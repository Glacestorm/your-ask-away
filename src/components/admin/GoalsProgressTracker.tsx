import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Users, TrendingUp, TrendingDown, Search, Building2, Calendar, Trophy, AlertTriangle, CheckCircle2, Clock, Loader2, LineChart } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, isWithinInterval, parseISO, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ca } from 'date-fns/locale';

interface GestorGoalProgress {
  gestor_id: string;
  gestor_name: string;
  gestor_email: string;
  gestor_oficina: string | null;
  avatar_url: string | null;
  goal_id: string;
  metric_type: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  period_start: string;
  period_end: string;
  period_type: string;
  description: string | null;
}

interface GestorSummary {
  gestor_id: string;
  gestor_name: string;
  gestor_email: string;
  gestor_oficina: string | null;
  avatar_url: string | null;
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  at_risk_goals: number;
  average_progress: number;
}

interface EvolutionDataPoint {
  month: string;
  monthLabel: string;
  [key: string]: number | string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(217, 91%, 60%)',
  'hsl(48, 96%, 53%)',
  'hsl(280, 87%, 65%)',
  'hsl(346, 87%, 55%)',
  'hsl(173, 80%, 40%)',
  'hsl(24, 95%, 53%)',
];

const GoalsProgressTracker = () => {
  const { user, isOfficeDirector } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [goalsProgress, setGoalsProgress] = useState<GestorGoalProgress[]>([]);
  const [gestorSummaries, setGestorSummaries] = useState<GestorSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOficina, setSelectedOficina] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [oficinas, setOficinas] = useState<string[]>([]);
  const [userOficina, setUserOficina] = useState<string | null>(null);
  const [evolutionData, setEvolutionData] = useState<EvolutionDataPoint[]>([]);
  const [selectedGestorForEvolution, setSelectedGestorForEvolution] = useState<string>('all');
  const [loadingEvolution, setLoadingEvolution] = useState(false);

  const metricTypes = [
    'total_visits', 'successful_visits', 'assigned_companies', 'products_offered',
    'average_vinculacion', 'new_clients', 'visit_sheets', 'tpv_volume',
    'conversion_rate', 'client_facturacion', 'products_per_client', 'follow_ups'
  ];

  useEffect(() => {
    if (user) {
      fetchUserOficina();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGoalsProgress();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('goals-progress-tracker')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
          fetchGoalsProgress();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
          fetchGoalsProgress();
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

  const fetchGoalsProgress = async () => {
    setLoading(true);
    try {
      // Fetch all gestores (users with 'user' role)
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');

      if (!userRoles) return;

      const gestorIds = userRoles.map(ur => ur.user_id);

      // Fetch profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email, oficina, avatar_url')
        .in('id', gestorIds);

      // Filter by office for office directors
      if (isOfficeDirector && userOficina) {
        profilesQuery = profilesQuery.eq('oficina', userOficina);
      }

      const { data: profiles } = await profilesQuery;
      if (!profiles) return;

      // Get unique oficinas
      const uniqueOficinas = [...new Set(profiles.map(p => p.oficina).filter(Boolean))] as string[];
      setOficinas(uniqueOficinas);

      // Fetch all goals assigned to these gestores
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .in('assigned_to', profiles.map(p => p.id));

      if (!goals) return;

      // Calculate progress for each goal
      const progressData: GestorGoalProgress[] = [];

      for (const goal of goals) {
        const profile = profiles.find(p => p.id === goal.assigned_to);
        if (!profile) continue;

        const currentValue = await calculateMetricValue(
          goal.assigned_to,
          goal.metric_type,
          goal.period_start,
          goal.period_end
        );

        const progressPercentage = goal.target_value > 0 
          ? Math.min(100, (currentValue / goal.target_value) * 100)
          : 0;

        progressData.push({
          gestor_id: goal.assigned_to,
          gestor_name: profile.full_name || profile.email,
          gestor_email: profile.email,
          gestor_oficina: profile.oficina,
          avatar_url: profile.avatar_url,
          goal_id: goal.id,
          metric_type: goal.metric_type,
          target_value: goal.target_value,
          current_value: currentValue,
          progress_percentage: progressPercentage,
          period_start: goal.period_start,
          period_end: goal.period_end,
          period_type: goal.period_type,
          description: goal.description
        });
      }

      setGoalsProgress(progressData);

      // Calculate summaries per gestor
      const summaries: GestorSummary[] = profiles.map(profile => {
        const gestorGoals = progressData.filter(g => g.gestor_id === profile.id);
        const completedGoals = gestorGoals.filter(g => g.progress_percentage >= 100).length;
        const atRiskGoals = gestorGoals.filter(g => g.progress_percentage < 50).length;
        const avgProgress = gestorGoals.length > 0
          ? gestorGoals.reduce((acc, g) => acc + g.progress_percentage, 0) / gestorGoals.length
          : 0;

        return {
          gestor_id: profile.id,
          gestor_name: profile.full_name || profile.email,
          gestor_email: profile.email,
          gestor_oficina: profile.oficina,
          avatar_url: profile.avatar_url,
          total_goals: gestorGoals.length,
          completed_goals: completedGoals,
          in_progress_goals: gestorGoals.length - completedGoals - atRiskGoals,
          at_risk_goals: atRiskGoals,
          average_progress: avgProgress
        };
      });

      setGestorSummaries(summaries);
    } catch (error) {
      console.error('Error fetching goals progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetricValue = async (
    gestorId: string,
    metricType: string,
    periodStart: string,
    periodEnd: string
  ): Promise<number> => {
    const startDate = periodStart;
    const endDate = periodEnd;

    switch (metricType) {
      case 'total_visits': {
        const { count } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId)
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);
        return count || 0;
      }
      case 'successful_visits': {
        const { count } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId)
          .eq('result', 'exitosa')
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);
        return count || 0;
      }
      case 'assigned_companies': {
        const { count } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId);
        return count || 0;
      }
      case 'products_offered': {
        const { data: visits } = await supabase
          .from('visits')
          .select('productos_ofrecidos')
          .eq('gestor_id', gestorId)
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);
        return visits?.reduce((acc, v) => acc + (v.productos_ofrecidos?.length || 0), 0) || 0;
      }
      case 'average_vinculacion': {
        const { data: companies } = await supabase
          .from('companies')
          .select('vinculacion_entidad_1')
          .eq('gestor_id', gestorId)
          .not('vinculacion_entidad_1', 'is', null);
        if (!companies?.length) return 0;
        return companies.reduce((acc, c) => acc + (c.vinculacion_entidad_1 || 0), 0) / companies.length;
      }
      case 'new_clients': {
        const { count } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId)
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        return count || 0;
      }
      case 'visit_sheets': {
        const { count } = await supabase
          .from('visit_sheets')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId)
          .gte('fecha', startDate)
          .lte('fecha', endDate);
        return count || 0;
      }
      case 'tpv_volume': {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', gestorId);
        if (!companies?.length) return 0;
        const { data: terminals } = await supabase
          .from('company_tpv_terminals')
          .select('monthly_volume')
          .in('company_id', companies.map(c => c.id))
          .eq('status', 'active');
        return terminals?.reduce((acc, t) => acc + (Number(t.monthly_volume) || 0), 0) || 0;
      }
      case 'conversion_rate': {
        const { count: total } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId)
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);
        const { count: successful } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId)
          .eq('result', 'exitosa')
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);
        return total && total > 0 ? ((successful || 0) / total) * 100 : 0;
      }
      case 'client_facturacion': {
        const { data: companies } = await supabase
          .from('companies')
          .select('facturacion_anual')
          .eq('gestor_id', gestorId);
        return companies?.reduce((acc, c) => acc + (Number(c.facturacion_anual) || 0), 0) || 0;
      }
      case 'products_per_client': {
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', gestorId);
        if (!companies?.length) return 0;
        const { count: productsCount } = await supabase
          .from('company_products')
          .select('*', { count: 'exact', head: true })
          .in('company_id', companies.map(c => c.id))
          .eq('active', true);
        return (productsCount || 0) / companies.length;
      }
      case 'follow_ups': {
        const { count } = await supabase
          .from('visit_sheets')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', gestorId)
          .gte('fecha', startDate)
          .lte('fecha', endDate)
          .or('proxima_llamada.not.is.null,proxima_cita.not.is.null');
        return count || 0;
      }
      default:
        return 0;
    }
  };

  const getMetricLabel = (metric: string): string => {
    const labels: Record<string, string> = {
      total_visits: t('goals.totalVisits'),
      successful_visits: t('goals.successfulVisits'),
      assigned_companies: t('goals.assignedCompanies'),
      products_offered: t('goals.productsOffered'),
      average_vinculacion: t('goals.averageVinculacion'),
      new_clients: t('goals.newClients'),
      visit_sheets: t('goals.visitSheets'),
      tpv_volume: t('goals.tpvVolume'),
      conversion_rate: t('goals.conversionRate'),
      client_facturacion: t('goals.clientFacturacion'),
      products_per_client: t('goals.productsPerClient'),
      follow_ups: t('goals.followUps')
    };
    return labels[metric] || metric;
  };

  const formatValue = (value: number, metricType: string): string => {
    if (['average_vinculacion', 'conversion_rate'].includes(metricType)) {
      return `${value.toFixed(1)}%`;
    }
    if (['tpv_volume', 'client_facturacion'].includes(metricType)) {
      return `${value.toLocaleString()}€`;
    }
    if (metricType === 'products_per_client') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />Completat</Badge>;
    }
    if (percentage >= 75) {
      return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400"><TrendingUp className="w-3 h-3 mr-1" />En curs</Badge>;
    }
    if (percentage >= 50) {
      return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" />Moderat</Badge>;
    }
    return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400"><AlertTriangle className="w-3 h-3 mr-1" />En risc</Badge>;
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Generate evolution data for last 6 months
  const generateEvolutionData = async () => {
    setLoadingEvolution(true);
    try {
      const now = new Date();
      const months = eachMonthOfInterval({
        start: subMonths(startOfMonth(now), 5),
        end: startOfMonth(now)
      });

      const gestorsToAnalyze = selectedGestorForEvolution === 'all' 
        ? filteredSummaries.slice(0, 8) // Limit to 8 gestors for readability
        : filteredSummaries.filter(g => g.gestor_id === selectedGestorForEvolution);

      const evolutionPoints: EvolutionDataPoint[] = [];

      for (const month of months) {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthLabel = format(month, 'MMM yyyy', { locale: ca });
        const monthKey = format(month, 'yyyy-MM');

        const dataPoint: EvolutionDataPoint = {
          month: monthKey,
          monthLabel
        };

        for (const gestor of gestorsToAnalyze) {
          // Calculate average progress for this gestor in this month
          const gestorGoals = goalsProgress.filter(g => 
            g.gestor_id === gestor.gestor_id &&
            parseISO(g.period_start) <= monthEnd &&
            parseISO(g.period_end) >= monthStart
          );

          if (gestorGoals.length > 0) {
            const avgProgress = gestorGoals.reduce((acc, g) => acc + g.progress_percentage, 0) / gestorGoals.length;
            dataPoint[gestor.gestor_name] = Math.round(avgProgress * 10) / 10;
          } else {
            dataPoint[gestor.gestor_name] = 0;
          }
        }

        evolutionPoints.push(dataPoint);
      }

      setEvolutionData(evolutionPoints);
    } catch (error) {
      console.error('Error generating evolution data:', error);
    } finally {
      setLoadingEvolution(false);
    }
  };

  useEffect(() => {
    if (gestorSummaries.length > 0 && goalsProgress.length > 0) {
      generateEvolutionData();
    }
  }, [gestorSummaries, goalsProgress, selectedGestorForEvolution, selectedOficina]);

  // Filter data
  const filteredGoals = goalsProgress.filter(goal => {
    const matchesSearch = goal.gestor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          goal.gestor_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOficina = selectedOficina === 'all' || goal.gestor_oficina === selectedOficina;
    const matchesMetric = selectedMetric === 'all' || goal.metric_type === selectedMetric;
    return matchesSearch && matchesOficina && matchesMetric;
  });

  const filteredSummaries = gestorSummaries.filter(summary => {
    const matchesSearch = summary.gestor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          summary.gestor_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOficina = selectedOficina === 'all' || summary.gestor_oficina === selectedOficina;
    return matchesSearch && matchesOficina;
  });

  // Stats
  const totalGoals = goalsProgress.length;
  const completedGoals = goalsProgress.filter(g => g.progress_percentage >= 100).length;
  const atRiskGoals = goalsProgress.filter(g => g.progress_percentage < 50).length;
  const avgProgress = totalGoals > 0 
    ? goalsProgress.reduce((acc, g) => acc + g.progress_percentage, 0) / totalGoals 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Objectius</p>
                <p className="text-2xl font-bold">{totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completats</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Risc</p>
                <p className="text-2xl font-bold text-red-600">{atRiskGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progrés Mitjà</p>
                <p className="text-2xl font-bold text-blue-600">{avgProgress.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cercar gestor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {!isOfficeDirector && (
              <Select value={selectedOficina} onValueChange={setSelectedOficina}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Oficina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Totes les oficines</SelectItem>
                  {oficinas.map(oficina => (
                    <SelectItem key={oficina} value={oficina}>{oficina}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[200px]">
                <Target className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Mètrica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Totes les mètriques</SelectItem>
                {metricTypes.map(metric => (
                  <SelectItem key={metric} value={metric}>{getMetricLabel(metric)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary" className="gap-2">
            <Users className="w-4 h-4" />
            Resum per Gestor
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <Target className="w-4 h-4" />
            Detall d'Objectius
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-2">
            <Trophy className="w-4 h-4" />
            Rànking
          </TabsTrigger>
          <TabsTrigger value="evolution" className="gap-2">
            <LineChart className="w-4 h-4" />
            Evolució
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Resum per Gestor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Oficina</TableHead>
                    <TableHead className="text-center">Objectius</TableHead>
                    <TableHead className="text-center">Completats</TableHead>
                    <TableHead className="text-center">En Risc</TableHead>
                    <TableHead>Progrés Mitjà</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSummaries.map(summary => (
                    <TableRow key={summary.gestor_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={summary.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(summary.gestor_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{summary.gestor_name}</p>
                            <p className="text-xs text-muted-foreground">{summary.gestor_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{summary.gestor_oficina || '-'}</TableCell>
                      <TableCell className="text-center">{summary.total_goals}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-500/10 text-green-700">
                          {summary.completed_goals}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-500/10 text-red-700">
                          {summary.at_risk_goals}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={summary.average_progress} className="h-2 flex-1" />
                          <span className="text-sm font-medium w-12">{summary.average_progress.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Detall d'Objectius
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Mètrica</TableHead>
                    <TableHead>Període</TableHead>
                    <TableHead className="text-right">Objectiu</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead>Progrés</TableHead>
                    <TableHead>Estat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoals.map(goal => (
                    <TableRow key={goal.goal_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={goal.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(goal.gestor_name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{goal.gestor_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getMetricLabel(goal.metric_type)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(parseISO(goal.period_start), 'dd/MM/yy')} - {format(parseISO(goal.period_end), 'dd/MM/yy')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatValue(goal.target_value, goal.metric_type)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatValue(goal.current_value, goal.metric_type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={goal.progress_percentage} className="h-2 flex-1" />
                          <span className="text-xs w-10">{goal.progress_percentage.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(goal.progress_percentage)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Rànking de Gestors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredSummaries
                  .sort((a, b) => b.average_progress - a.average_progress)
                  .map((summary, index) => (
                    <div 
                      key={summary.gestor_id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                        index === 1 ? 'bg-slate-300/20 border border-slate-400/30' :
                        index === 2 ? 'bg-orange-500/10 border border-orange-500/30' :
                        'bg-muted/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-orange-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={summary.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(summary.gestor_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{summary.gestor_name}</p>
                        <p className="text-xs text-muted-foreground">{summary.gestor_oficina || 'Sense oficina'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{summary.average_progress.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">
                          {summary.completed_goals}/{summary.total_goals} completats
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evolution Tab */}
        <TabsContent value="evolution">
          <div className="space-y-4">
            {/* Gestor selector for evolution */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Select value={selectedGestorForEvolution} onValueChange={setSelectedGestorForEvolution}>
                    <SelectTrigger className="w-[280px]">
                      <Users className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Selecciona gestor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tots els gestors (màx. 8)</SelectItem>
                      {filteredSummaries.map(summary => (
                        <SelectItem key={summary.gestor_id} value={summary.gestor_id}>
                          {summary.gestor_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    Evolució dels últims 6 mesos
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Evolució del Progrés d'Objectius
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEvolution ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : evolutionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={evolutionData}>
                      <defs>
                        {filteredSummaries.slice(0, 8).map((summary, index) => (
                          <linearGradient key={summary.gestor_id} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="monthLabel" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      />
                      <Legend />
                      {(selectedGestorForEvolution === 'all' 
                        ? filteredSummaries.slice(0, 8) 
                        : filteredSummaries.filter(g => g.gestor_id === selectedGestorForEvolution)
                      ).map((summary, index) => (
                        <Area
                          key={summary.gestor_id}
                          type="monotone"
                          dataKey={summary.gestor_name}
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          fill={`url(#gradient-${index})`}
                          strokeWidth={2}
                          dot={{ r: 4, fill: CHART_COLORS[index % CHART_COLORS.length] }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    No hi ha dades d'evolució disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Individual Gestor Cards with mini charts */}
            {selectedGestorForEvolution === 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredSummaries.slice(0, 8).map((summary, index) => {
                  const gestorData = evolutionData.map(d => ({
                    month: d.monthLabel,
                    value: d[summary.gestor_name] as number || 0
                  }));
                  const latestValue = gestorData[gestorData.length - 1]?.value || 0;
                  const previousValue = gestorData[gestorData.length - 2]?.value || 0;
                  const trend = latestValue - previousValue;

                  return (
                    <Card key={summary.gestor_id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={summary.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(summary.gestor_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{summary.gestor_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{summary.gestor_oficina || '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold">{latestValue.toFixed(0)}%</span>
                          <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {Math.abs(trend).toFixed(1)}%
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={60}>
                          <RechartsLineChart data={gestorData}>
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke={CHART_COLORS[index % CHART_COLORS.length]}
                              strokeWidth={2}
                              dot={false}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GoalsProgressTracker;
