import { useState, Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { Activity, Target, Building2, Users, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Eye, Clock, Zap, Award, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';
import { MetricsExplorer } from '@/components/admin/MetricsExplorer';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuickVisitManager } from '@/components/dashboard/QuickVisitManager';
import { cn } from '@/lib/utils';
import { useDashboardDataOptimized } from '@/hooks/useDashboardDataOptimized';
import { ProgressiveDashboardSkeleton, ChartSkeleton } from '@/components/dashboard/ProgressiveDashboardSkeleton';

import { MapDashboardCard } from '@/components/dashboard/MapDashboardCard';
import { QuickVisitSheetCard } from '@/components/dashboard/QuickVisitSheetCard';
import { AccountingDashboardCard } from '@/components/dashboard/AccountingDashboardCard';
import { MetricsCardsSection } from '@/components/dashboard/MetricsCardsSection';
import { CompaniesDashboardCard } from '@/components/dashboard/CompaniesDashboardCard';
import { AlertHistoryDashboardCard } from '@/components/dashboard/AlertHistoryDashboardCard';
import { ContractedProductsDashboardCard } from '@/components/dashboard/ContractedProductsDashboardCard';
import { GoalsAlertsDashboardCard } from '@/components/dashboard/GoalsAlertsDashboardCard';
import { KPIDashboardCard } from '@/components/dashboard/KPIDashboardCard';
import { SPMDashboardCard } from '@/components/dashboard/SPMDashboardCard';
import { AdvancedAnalyticsDashboardCard } from '@/components/dashboard/AdvancedAnalyticsDashboardCard';
import { DashboardExportButton } from '@/components/dashboard/DashboardExportButton';
import { RealtimeNotificationsBadge } from '@/components/dashboard/RealtimeNotificationsBadge';
import { UpcomingVisitsWidget } from '@/components/dashboard/UpcomingVisitsWidget';

import { useWidgetLayout } from '@/hooks/useWidgetLayout';
import { DraggableWidget } from '@/components/dashboard/DraggableWidget';
import { SortableWidgetContainer } from '@/components/dashboard/SortableWidgetContainer';
import { WidgetLayoutControls } from '@/components/dashboard/WidgetLayoutControls';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function CommercialDirectorDashboard() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 1), to: today };
  });

  // Use optimized hook - fetches ALL data in parallel with caching
  const { data, loading, isLoadingTrends } = useDashboardDataOptimized(dateRange);

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

  // Extract data from hook or use defaults
  const stats = data?.stats || {
    totalVisits: 0,
    avgSuccessRate: 0,
    totalCompanies: 0,
    activeGestores: 0,
    visitsTrend: 0,
    successTrend: 0
  };
  const gestorRanking = data?.gestorRanking || [];
  const gestorDetails = data?.gestorDetails || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const resultDistribution = data?.resultDistribution || [];


  if (loading) {
    return <ProgressiveDashboardSkeleton />;
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
            {t('director.analysisTab')}
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
                    <div className="grid gap-6 md:grid-cols-4">
                      <ContractedProductsDashboardCard />
                      <GoalsAlertsDashboardCard />
                      <KPIDashboardCard />
                      <SPMDashboardCard />
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
                    <CardTitle className="text-lg">{t('director.monthlyEvolution')}</CardTitle>
                    <CardDescription>{t('director.monthlyDesc')}</CardDescription>
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
                      <Area type="monotone" dataKey="visits" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} name={t('director.total')} />
                      <Area type="monotone" dataKey="successful" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorSuccess)" strokeWidth={2} name={t('director.successful')} />
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
                    <CardTitle className="text-lg">{t('director.resultsDistribution')}</CardTitle>
                    <CardDescription>{t('director.resultsDesc')}</CardDescription>
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
                          <span>{gestor.visits} {t('director.visits')}</span>
                          <span>•</span>
                          <span className={gestor.successRate >= 70 ? "text-green-600" : gestor.successRate >= 40 ? "text-amber-600" : "text-red-600"}>
                            {gestor.successRate}% {t('director.success')}
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
