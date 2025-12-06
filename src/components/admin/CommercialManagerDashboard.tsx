import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Target, Building2, Users, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown, LayoutDashboard, LineChart, Compass, Award, ArrowUpRight, ArrowDownRight, ClipboardCheck, Timer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format } from 'date-fns';
import { MetricsExplorer } from '@/components/admin/MetricsExplorer';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuickVisitManager } from '@/components/dashboard/QuickVisitManager';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

interface BasicStats {
  totalVisits: number;
  avgSuccessRate: number;
  totalCompanies: number;
  activeGestores: number;
}

interface ValidationMetrics {
  avgValidationTimeHours: number;
  approvalRate: number;
  totalValidated: number;
  approved: number;
  rejected: number;
}

interface GestorRanking {
  name: string;
  visits: number;
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

interface ResultDistribution {
  name: string;
  value: number;
  color: string;
}

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function CommercialManagerDashboard() {
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
    activeGestores: 0
  });
  const [gestorRanking, setGestorRanking] = useState<GestorRanking[]>([]);
  const [gestorDetails, setGestorDetails] = useState<GestorDetail[]>([]);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics>({
    avgValidationTimeHours: 0,
    approvalRate: 0,
    totalValidated: 0,
    approved: 0,
    rejected: 0
  });
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [resultDistribution, setResultDistribution] = useState<ResultDistribution[]>([]);
  const [previousStats, setPreviousStats] = useState<BasicStats | null>(null);

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

      // Fetch all visits
      const { data: visits } = await supabase
        .from('visits')
        .select('*')
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);

      const totalVisits = visits?.length || 0;
      const successfulVisits = visits?.filter(v => v.result === 'Exitosa').length || 0;
      const avgSuccessRate = totalVisits > 0 
        ? Math.round((successfulVisits / totalVisits) * 100) 
        : 0;

      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      const { count: gestoresCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalVisits,
        avgSuccessRate,
        totalCompanies: companiesCount || 0,
        activeGestores: gestoresCount || 0
      });

      // Monthly trends
      const monthlyMap = new Map<string, { visits: number; successful: number }>();
      visits?.forEach(visit => {
        const monthKey = format(new Date(visit.visit_date), 'MMM');
        const data = monthlyMap.get(monthKey) || { visits: 0, successful: 0 };
        data.visits++;
        if (visit.result === 'Exitosa') data.successful++;
        monthlyMap.set(monthKey, data);
      });
      setMonthlyTrends(Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        visits: data.visits,
        successful: data.successful
      })));

      // Result distribution
      const resultsMap = new Map<string, number>();
      visits?.forEach(visit => {
        const result = visit.result || 'Sin resultado';
        resultsMap.set(result, (resultsMap.get(result) || 0) + 1);
      });
      setResultDistribution(Array.from(resultsMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      })));

      // Fetch validation metrics
      const { data: validatedSheets } = await supabase
        .from('visit_sheets')
        .select('created_at, validated_at, validation_status')
        .not('validation_status', 'is', null)
        .gte('validated_at', dateRange.from.toISOString())
        .lte('validated_at', dateRange.to.toISOString());

      if (validatedSheets && validatedSheets.length > 0) {
        const approved = validatedSheets.filter(s => s.validation_status === 'approved').length;
        const rejected = validatedSheets.filter(s => s.validation_status === 'rejected').length;
        const totalValidated = approved + rejected;
        
        let totalHours = 0;
        let validCount = 0;
        validatedSheets.forEach(s => {
          if (s.created_at && s.validated_at) {
            const created = new Date(s.created_at).getTime();
            const validated = new Date(s.validated_at).getTime();
            const hours = (validated - created) / (1000 * 60 * 60);
            if (hours >= 0 && hours < 720) {
              totalHours += hours;
              validCount++;
            }
          }
        });
        
        setValidationMetrics({
          avgValidationTimeHours: validCount > 0 ? Math.round(totalHours / validCount * 10) / 10 : 0,
          approvalRate: totalValidated > 0 ? Math.round((approved / totalValidated) * 100) : 0,
          totalValidated,
          approved,
          rejected
        });
      }

      // Fetch gestor data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, oficina');

      if (profiles) {
        const detailsPromises = profiles.map(async (profile) => {
          const gestorVisits = visits?.filter(v => v.gestor_id === profile.id) || [];
          const gestorSuccess = gestorVisits.filter(v => v.result === 'Exitosa').length;

          const { count: companyCount } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('gestor_id', profile.id);

          return {
            name: profile.full_name || profile.email.split('@')[0],
            oficina: profile.oficina || 'Sin asignar',
            totalVisits: gestorVisits.length,
            successRate: gestorVisits.length > 0 ? Math.round((gestorSuccess / gestorVisits.length) * 100) : 0,
            companies: companyCount || 0
          };
        });

        const details = await Promise.all(detailsPromises);
        
        setGestorRanking(details
          .sort((a, b) => b.totalVisits - a.totalVisits)
          .slice(0, 10)
          .map(d => ({ name: d.name, visits: d.totalVisits })));

        setGestorDetails(details.sort((a, b) => b.totalVisits - a.totalVisits));
      }

      // Previous period
      const prevFromDate = format(subMonths(dateRange.from, 1), 'yyyy-MM-dd');
      const prevToDate = format(subMonths(dateRange.to, 1), 'yyyy-MM-dd');
      
      const { data: prevVisits } = await supabase
        .from('visits')
        .select('*')
        .gte('visit_date', prevFromDate)
        .lte('visit_date', prevToDate);

      const prevTotal = prevVisits?.length || 0;
      const prevSuccess = prevVisits?.filter(v => v.result === 'Exitosa').length || 0;
      setPreviousStats({
        totalVisits: prevTotal,
        avgSuccessRate: prevTotal > 0 ? Math.round((prevSuccess / prevTotal) * 100) : 0,
        totalCompanies: companiesCount || 0,
        activeGestores: gestoresCount || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
      setLoading(false);
    }
  };

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const visitsTrend = previousStats ? getTrend(stats.totalVisits, previousStats.totalVisits) : null;
  const successTrend = previousStats ? getTrend(stats.avgSuccessRate, previousStats.avgSuccessRate) : null;

  return (
    <div className="space-y-6">
      {/* Hero KPIs Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('director.totalVisits')}</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalVisits}</div>
            {visitsTrend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${visitsTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {visitsTrend.isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{visitsTrend.value}% vs període anterior</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('director.successRate')}</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgSuccessRate}%</div>
            {successTrend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${successTrend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {successTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{successTrend.value}% vs període anterior</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('director.companies')}</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCompanies}</div>
            <p className="text-sm text-muted-foreground mt-2">Cartera total</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('director.managers')}</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeGestores}</div>
            <p className="text-sm text-muted-foreground mt-2">Gestors actius</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Metrics Panel */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-muted/50 to-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Mètriques de Validació
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <Timer className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <div className="text-2xl font-bold">{validationMetrics.avgValidationTimeHours}h</div>
              <p className="text-xs text-muted-foreground">Temps mig validació</p>
            </div>
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{validationMetrics.approvalRate}%</div>
              <p className="text-xs text-muted-foreground">Ràtio aprovació</p>
            </div>
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-green-600">{validationMetrics.approved}</div>
              <p className="text-xs text-muted-foreground">Aprovades</p>
            </div>
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold text-red-600">{validationMetrics.rejected}</div>
              <p className="text-xs text-muted-foreground">Rebutjades</p>
            </div>
            <div className="text-center p-4 bg-background rounded-xl shadow-sm">
              <Activity className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{validationMetrics.totalValidated}</div>
              <p className="text-xs text-muted-foreground">Total validades</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="overview" className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
            Visió General
          </TabsTrigger>
          <TabsTrigger value="analytics" className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <LineChart className="h-4 w-4" />
            Analítiques
          </TabsTrigger>
          <TabsTrigger value="explorer" className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Compass className="h-4 w-4" />
            Explorador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-300">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          <MetricsCardsSection />

          <div className="grid gap-6 md:grid-cols-4">
            <QuickVisitSheetCard />
            <MapDashboardCard />
            <AccountingDashboardCard />
            <CompaniesDashboardCard />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <ContractedProductsDashboardCard />
            <GoalsAlertsDashboardCard />
            <KPIDashboardCard />
          </div>

          <AlertHistoryDashboardCard />
          <AdvancedAnalyticsDashboardCard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 animate-in fade-in-50 duration-300">
          <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolució Mensual
                </CardTitle>
                <CardDescription>Tendència de visites i èxits</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyTrends}>
                      <defs>
                        <linearGradient id="colorVisitsCM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSuccessCM" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="visits" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorVisitsCM)" name="Visites" />
                      <Area type="monotone" dataKey="successful" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorSuccessCM)" name="Exitoses" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">{t('director.noData')}</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Distribució de Resultats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resultDistribution.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="50%" height={250}>
                      <PieChart>
                        <Pie data={resultDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {resultDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {resultDistribution.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <Badge variant="secondary">{item.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">{t('director.noData')}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Rànking de Gestors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gestorRanking.slice(0, 5).map((gestor, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                      index === 1 ? 'bg-gray-400/20 text-gray-600' :
                      index === 2 ? 'bg-orange-500/20 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{gestor.name}</span>
                        <span className="text-sm text-muted-foreground">{gestor.visits} visites</span>
                      </div>
                      <Progress value={gestorRanking[0]?.visits > 0 ? (gestor.visits / gestorRanking[0].visits) * 100 : 0} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>{t('director.detailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-muted">
                    <TableHead>{t('director.managerCol')}</TableHead>
                    <TableHead>{t('director.officeCol')}</TableHead>
                    <TableHead className="text-right">{t('director.visitsCol')}</TableHead>
                    <TableHead className="text-right">{t('director.successCol')}</TableHead>
                    <TableHead className="text-right">{t('director.companiesCol')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gestorDetails.map((gestor, index) => (
                    <TableRow key={index} className="border-muted">
                      <TableCell className="font-medium">{gestor.name}</TableCell>
                      <TableCell><Badge variant="outline">{gestor.oficina}</Badge></TableCell>
                      <TableCell className="text-right">{gestor.totalVisits}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={gestor.successRate >= 70 ? 'default' : gestor.successRate >= 50 ? 'secondary' : 'destructive'}>
                          {gestor.successRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{gestor.companies}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explorer" className="space-y-6 animate-in fade-in-50 duration-300">
          <MetricsExplorer />
        </TabsContent>
      </Tabs>

      <QuickVisitManager />
    </div>
  );
}
