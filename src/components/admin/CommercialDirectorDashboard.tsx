import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { Activity, Target, Building2, Users, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Eye, Clock, Zap, Award, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { MetricsExplorer } from '@/components/admin/MetricsExplorer';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuickVisitManager } from '@/components/dashboard/QuickVisitManager';
import { cn } from '@/lib/utils';

import { MapDashboardCard } from '@/components/dashboard/MapDashboardCard';
import { QuickVisitSheetCard } from '@/components/dashboard/QuickVisitSheetCard';
import { AccountingDashboardCard } from '@/components/dashboard/AccountingDashboardCard';
import { MetricsCardsSection } from '@/components/dashboard/MetricsCardsSection';
import { CompaniesDashboardCard } from '@/components/dashboard/CompaniesDashboardCard';
import { AlertHistoryDashboardCard } from '@/components/dashboard/AlertHistoryDashboardCard';
import { ContractedProductsDashboardCard } from '@/components/dashboard/ContractedProductsDashboardCard';
import { GoalsAlertsDashboardCard } from '@/components/dashboard/GoalsAlertsDashboardCard';
import { KPIDashboardCard } from '@/components/dashboard/KPIDashboardCard';
import { AdvancedAnalyticsDashboardCard } from '@/components/dashboard/AdvancedAnalyticsDashboardCard';
import { DashboardExportButton } from '@/components/dashboard/DashboardExportButton';
import { RealtimeNotificationsBadge } from '@/components/dashboard/RealtimeNotificationsBadge';
import { UpcomingVisitsWidget } from '@/components/dashboard/UpcomingVisitsWidget';

import { useWidgetLayout } from '@/hooks/useWidgetLayout';
import { DraggableWidget } from '@/components/dashboard/DraggableWidget';
import { SortableWidgetContainer } from '@/components/dashboard/SortableWidgetContainer';
import { WidgetLayoutControls } from '@/components/dashboard/WidgetLayoutControls';

interface BasicStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
  visitsTrend: number;
  successTrend: number;
}

interface GestorRanking {
  name: string;
  visits: number;
  successRate: number;
}

interface GestorDetail {
  name: string;
  oficina: string;
  totalVisits: number;
  successRate: number;
  companies: number;
}

interface MonthlyTrend {
  month: string;
  visits: number;
  successful: number;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function CommercialDirectorDashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 1), to: today };
  });
  const [stats, setStats] = useState<BasicStats>({
    totalVisits: 0,
    avgSuccessRate: 0,
    totalCompanies: 0,
    activeGestores: 0,
    visitsTrend: 0,
    successTrend: 0
  });
  const [gestorRanking, setGestorRanking] = useState<GestorRanking[]>([]);
  const [gestorDetails, setGestorDetails] = useState<GestorDetail[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [resultDistribution, setResultDistribution] = useState<{name: string; value: number}[]>([]);

  // Widget layout system
  const {
    widgets,
    isEditMode,
    setIsEditMode,
    reorderWidgets,
    toggleWidgetVisibility,
    resetLayout,
    isWidgetVisible,
  } = useWidgetLayout('commercial-director');

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      fetchData();
    }
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (!dateRange?.from || !dateRange?.to) return;

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      
      // Previous period for comparison
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const prevFromDate = format(subDays(dateRange.from, daysDiff), 'yyyy-MM-dd');
      const prevToDate = format(subDays(dateRange.from, 1), 'yyyy-MM-dd');

      // Current period visits
      const { count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      // Previous period visits for trend
      const { count: prevVisitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('visit_date', prevFromDate)
        .lte('visit_date', prevToDate);

      // Success counts
      const { count: successCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'Exitosa')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      const { count: prevSuccessCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('result', 'Exitosa')
        .gte('visit_date', prevFromDate)
        .lte('visit_date', prevToDate);

      // Result distribution
      const { data: visitsData } = await supabase
        .from('visits')
        .select('result')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      if (visitsData) {
        const distribution: Record<string, number> = {};
        visitsData.forEach(v => {
          const result = v.result || 'Sin resultado';
          distribution[result] = (distribution[result] || 0) + 1;
        });
        setResultDistribution(Object.entries(distribution).map(([name, value]) => ({ name, value })));
      }

      // Companies and gestores
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      const { count: gestoresCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const totalVisits = visitsCount || 0;
      const successfulVisits = successCount || 0;
      const avgSuccessRate = totalVisits > 0 
        ? Math.round((successfulVisits / totalVisits) * 100) 
        : 0;

      const prevTotal = prevVisitsCount || 0;
      const prevSuccess = prevSuccessCount || 0;
      const prevSuccessRate = prevTotal > 0 ? Math.round((prevSuccess / prevTotal) * 100) : 0;

      const visitsTrend = prevTotal > 0 ? Math.round(((totalVisits - prevTotal) / prevTotal) * 100) : 0;
      const successTrend = prevSuccessRate > 0 ? avgSuccessRate - prevSuccessRate : 0;

      setStats({
        totalVisits,
        avgSuccessRate,
        totalCompanies: companiesCount || 0,
        activeGestores: gestoresCount || 0,
        visitsTrend,
        successTrend
      });

      // Gestor details
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, oficina');

      if (profiles) {
        const detailsPromises = profiles.map(async (profile) => {
          const { count: visitCount } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id)
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          const { count: successVisitCount } = await supabase
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id)
            .eq('result', 'Exitosa')
            .gte('visit_date', fromDate)
            .lte('visit_date', toDate);

          const { count: companyCount } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id);

          const visits = visitCount || 0;
          const successVisits = successVisitCount || 0;
          const successRate = visits > 0 ? Math.round((successVisits / visits) * 100) : 0;

          return {
            name: profile.full_name || profile.email.split('@')[0],
            oficina: profile.oficina || 'Sin asignar',
            totalVisits: visits,
            successRate,
            companies: companyCount || 0
          };
        });

        const details = await Promise.all(detailsPromises);
        
        const ranking = details
          .filter(d => d.totalVisits > 0)
          .sort((a, b) => b.totalVisits - a.totalVisits)
          .slice(0, 5)
          .map(d => ({ name: d.name, visits: d.totalVisits, successRate: d.successRate }));
        
        setGestorRanking(ranking);
        const sortedDetails = details.sort((a, b) => b.totalVisits - a.totalVisits);
        setGestorDetails(sortedDetails);
      }

      // Monthly trend (last 6 months)
      const monthlyData: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const { count: monthVisits } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visit_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('visit_date', format(monthEnd, 'yyyy-MM-dd'));

        const { count: monthSuccess } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('result', 'Exitosa')
          .gte('visit_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('visit_date', format(monthEnd, 'yyyy-MM-dd'));

        monthlyData.push({
          month: format(monthStart, 'MMM'),
          visits: monthVisits || 0,
          successful: monthSuccess || 0
        });
      }
      setMonthlyTrend(monthlyData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/50 p-1.5 text-muted-foreground backdrop-blur-sm">
          <TabsTrigger value="overview" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Eye className="mr-2 h-4 w-4" />
            {t('director.overviewTab')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Anàlisi
          </TabsTrigger>
          <TabsTrigger value="explorer" className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Zap className="mr-2 h-4 w-4" />
            {t('director.explorerTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-500">
          {/* Date Filter and Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DateRangeFilter 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange}
            />
            <div className="flex items-center gap-2">
              <WidgetLayoutControls
                isEditMode={isEditMode}
                onToggleEditMode={() => setIsEditMode(!isEditMode)}
                onReset={resetLayout}
              />
              <RealtimeNotificationsBadge />
              <DashboardExportButton 
                data={{
                  title: 'Dashboard Director Comercial',
                  stats: {
                    'Total Visites': stats.totalVisits,
                    'Taxa Èxit': `${stats.avgSuccessRate}%`,
                    'Total Empreses': stats.totalCompanies,
                    'Gestors Actius': stats.activeGestores,
                  },
                  tableData: gestorDetails,
                  tableHeaders: ['name', 'oficina', 'totalVisits', 'successRate', 'companies']
                }}
                fileName="director-comercial-dashboard"
              />
            </div>
          </div>

          <SortableWidgetContainer
            items={widgets.map(w => w.id)}
            onReorder={reorderWidgets}
            isEditMode={isEditMode}
          >
            {widgets.map((widget) => {
              const isVisible = isWidgetVisible(widget.id);
              
              if (widget.id === 'kpi-cards') {
                return (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    isVisible={isVisible}
                    onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                  >
                    {/* Hero KPIs */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent shadow-lg">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10 blur-2xl" />
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                              <Activity className="h-6 w-6 text-blue-500" />
                            </div>
                            {stats.visitsTrend !== 0 && (
                              <Badge variant={stats.visitsTrend > 0 ? "default" : "destructive"} className={cn(
                                "gap-1",
                                stats.visitsTrend > 0 ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                              )}>
                                {stats.visitsTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {Math.abs(stats.visitsTrend)}%
                              </Badge>
                            )}
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground">{t('director.totalVisits')}</p>
                            <p className="text-3xl font-bold tracking-tight">{stats.totalVisits.toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/10 blur-2xl" />
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                              <Target className="h-6 w-6 text-emerald-500" />
                            </div>
                            {stats.successTrend !== 0 && (
                              <Badge variant={stats.successTrend > 0 ? "default" : "destructive"} className={cn(
                                "gap-1",
                                stats.successTrend > 0 ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                              )}>
                                {stats.successTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {Math.abs(stats.successTrend)}pp
                              </Badge>
                            )}
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground">{t('director.successRate')}</p>
                            <p className="text-3xl font-bold tracking-tight">{stats.avgSuccessRate}%</p>
                          </div>
                          <Progress value={stats.avgSuccessRate} className="mt-3 h-1.5" />
                        </CardContent>
                      </Card>

                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent shadow-lg">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-violet-500/10 blur-2xl" />
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                              <Building2 className="h-6 w-6 text-violet-500" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground">{t('director.companies')}</p>
                            <p className="text-3xl font-bold tracking-tight">{stats.totalCompanies.toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent shadow-lg">
                        <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-amber-500/10 blur-2xl" />
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                              <Users className="h-6 w-6 text-amber-500" />
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm font-medium text-muted-foreground">{t('director.managers')}</p>
                            <p className="text-3xl font-bold tracking-tight">{stats.activeGestores}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </DraggableWidget>
                );
              }

              if (widget.id === 'metrics-cards') {
                return (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    isVisible={isVisible}
                    onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                  >
                    <MetricsCardsSection />
                  </DraggableWidget>
                );
              }

              if (widget.id === 'quick-cards') {
                return (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    isVisible={isVisible}
                    onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                  >
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <QuickVisitSheetCard />
                      <MapDashboardCard />
                      <AccountingDashboardCard />
                      <CompaniesDashboardCard />
                    </div>
                  </DraggableWidget>
                );
              }

              if (widget.id === 'analytics') {
                return (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    isVisible={isVisible}
                    onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                  >
                    <div className="grid gap-6 md:grid-cols-3">
                      <ContractedProductsDashboardCard />
                      <GoalsAlertsDashboardCard />
                      <KPIDashboardCard />
                    </div>
                  </DraggableWidget>
                );
              }

              if (widget.id === 'offices-ranking') {
                return (
                  <DraggableWidget
                    key={widget.id}
                    id={widget.id}
                    isEditMode={isEditMode}
                    isVisible={isVisible}
                    onToggleVisibility={() => toggleWidgetVisibility(widget.id)}
                  >
                    <div className="space-y-6">
                      <AlertHistoryDashboardCard />
                      <AdvancedAnalyticsDashboardCard />
                    </div>
                  </DraggableWidget>
                );
              }

              return null;
            })}
          </SortableWidgetContainer>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8 animate-in fade-in-50 duration-500">
          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-4">
            <DateRangeFilter 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Evolució Mensual</CardTitle>
                    <CardDescription>Visites totals i exitoses</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={monthlyTrend}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area type="monotone" dataKey="visits" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} name="Total" />
                      <Area type="monotone" dataKey="successful" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={2} name="Exitoses" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                    {t('director.noData')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Result Distribution */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <CheckCircle2 className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Distribució de Resultats</CardTitle>
                    <CardDescription>Resultats de les visites</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resultDistribution.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={240}>
                      <PieChart>
                        <Pie
                          data={resultDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {resultDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {resultDistribution.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-muted-foreground">
                    {t('director.noData')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('director.rankingTitle')}</CardTitle>
                  <CardDescription>{t('director.rankingDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {gestorRanking.length > 0 ? (
                <div className="space-y-4">
                  {gestorRanking.map((gestor, index) => (
                    <div key={gestor.name} className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        index === 0 ? "bg-amber-500 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-amber-700 text-white" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{gestor.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{gestor.visits} visites</span>
                          <span>•</span>
                          <span className={gestor.successRate >= 70 ? "text-green-600" : gestor.successRate >= 40 ? "text-amber-600" : "text-red-600"}>
                            {gestor.successRate}% èxit
                          </span>
                        </div>
                      </div>
                      <div className="w-32">
                        <Progress value={gestor.successRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                  {t('director.noData')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestors Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('director.detailsTitle')}</CardTitle>
                  <CardDescription>{t('director.detailsDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">{t('director.managerCol')}</TableHead>
                      <TableHead className="font-semibold">{t('director.officeCol')}</TableHead>
                      <TableHead className="text-right font-semibold">{t('director.visitsCol')}</TableHead>
                      <TableHead className="text-right font-semibold">{t('director.successCol')}</TableHead>
                      <TableHead className="text-right font-semibold">{t('director.companiesCol')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gestorDetails.length > 0 ? (
                      gestorDetails.slice(0, 10).map((gestor, index) => (
                        <TableRow key={index} className="group">
                          <TableCell className="font-medium">{gestor.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {gestor.oficina}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{gestor.totalVisits}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-medium",
                              gestor.successRate >= 70 ? "text-green-600" :
                              gestor.successRate >= 40 ? "text-amber-600" :
                              "text-red-600"
                            )}>
                              {gestor.successRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{gestor.companies}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {t('director.noData')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explorer" className="animate-in fade-in-50 duration-500">
          <MetricsExplorer />
        </TabsContent>
      </Tabs>

      <QuickVisitManager />
    </div>
  );
}
