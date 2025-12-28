// License Reporting Dashboard - Phase 6
// Enterprise License System 2025

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Shield,
  AlertTriangle,
  Clock,
  Sparkles,
  PieChart,
  Activity
} from 'lucide-react';
import { useLicenseReporting, LicenseReport } from '@/hooks/admin/enterprise/useLicenseReporting';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

export function LicenseReportingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const {
    isLoading,
    metrics,
    usageTrends,
    tierDistribution,
    expirationForecast,
    reports,
    lastRefresh,
    fetchMetrics,
    fetchUsageTrends,
    fetchTierDistribution,
    fetchExpirationForecast,
    generateReport,
    exportReport,
    startAutoRefresh,
    stopAutoRefresh
  } = useLicenseReporting();

  // === LOAD DATA ===
  useEffect(() => {
    startAutoRefresh(300000); // 5 minutes
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  useEffect(() => {
    fetchUsageTrends(parseInt(selectedPeriod));
  }, [selectedPeriod, fetchUsageTrends]);

  // === HANDLERS ===
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchMetrics(),
      fetchUsageTrends(parseInt(selectedPeriod)),
      fetchTierDistribution(),
      fetchExpirationForecast()
    ]);
  }, [fetchMetrics, fetchUsageTrends, fetchTierDistribution, fetchExpirationForecast, selectedPeriod]);

  const handleGenerateReport = useCallback(async (type: LicenseReport['reportType']) => {
    setGeneratingReport(type);
    await generateReport(type, { period: selectedPeriod });
    setGeneratingReport(null);
  }, [generateReport, selectedPeriod]);

  const handleExportReport = useCallback(async (report: LicenseReport) => {
    await exportReport(report, 'csv');
  }, [exportReport]);

  // === METRIC CARDS ===
  const metricCards = [
    {
      title: 'Total Licencias',
      value: metrics?.totalLicenses || 0,
      icon: Shield,
      trend: 'up',
      change: '+12%'
    },
    {
      title: 'Licencias Activas',
      value: metrics?.activeLicenses || 0,
      icon: Users,
      trend: 'up',
      change: '+8%'
    },
    {
      title: 'Ingresos Totales',
      value: `$${(metrics?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      trend: 'up',
      change: '+15%'
    },
    {
      title: 'Tasa de Renovación',
      value: `${(metrics?.renewalRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      trend: metrics?.renewalRate && metrics.renewalRate > 80 ? 'up' : 'down',
      change: metrics?.renewalRate && metrics.renewalRate > 80 ? '+5%' : '-3%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reportes y Analytics
          </h2>
          <p className="text-muted-foreground">
            Métricas avanzadas y generación de reportes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 días</SelectItem>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="60">60 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={cn(
                  "p-2 rounded-lg",
                  card.trend === 'up' ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  <card.icon className={cn(
                    "h-5 w-5",
                    card.trend === 'up' ? "text-green-500" : "text-red-500"
                  )} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {card.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  card.trend === 'up' ? "text-green-500" : "text-red-500"
                )}>
                  {card.change}
                </span>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Distribución
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pronóstico
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        {/* Usage Trends */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Uso</CardTitle>
              <CardDescription>
                Activaciones, validaciones y anomalías en los últimos {selectedPeriod} días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageTrends}>
                    <defs>
                      <linearGradient id="colorActivations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorValidations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy', { locale: es })}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="activations"
                      name="Activaciones"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorActivations)"
                    />
                    <Area
                      type="monotone"
                      dataKey="validations"
                      name="Validaciones"
                      stroke="hsl(var(--accent))"
                      fillOpacity={1}
                      fill="url(#colorValidations)"
                    />
                    <Area
                      type="monotone"
                      dataKey="anomalies"
                      name="Anomalías"
                      stroke="hsl(var(--destructive))"
                      fillOpacity={0.2}
                      fill="hsl(var(--destructive))"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tier Distribution */}
        <TabsContent value="distribution" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tier</CardTitle>
                <CardDescription>
                  Porcentaje de licencias por nivel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={tierDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tier, percentage }) => `${tier}: ${percentage.toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {tierDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Tier</CardTitle>
                <CardDescription>
                  Distribución de ingresos por nivel de licencia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tierDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="tier" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ingresos']}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expiration Forecast */}
        <TabsContent value="forecast" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pronóstico de Vencimientos
              </CardTitle>
              <CardDescription>
                Licencias próximas a expirar y potencial de renovación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expirationForecast.map((forecast, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          index === 0 ? "bg-red-500/10" : 
                          index === 1 ? "bg-yellow-500/10" : "bg-green-500/10"
                        )}>
                          <Calendar className={cn(
                            "h-4 w-4",
                            index === 0 ? "text-red-500" : 
                            index === 1 ? "text-yellow-500" : "text-green-500"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium">Próximos {forecast.period}</p>
                          <p className="text-sm text-muted-foreground">
                            {forecast.count} licencias por vencer
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          ${forecast.potentialRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Potencial de renovación</p>
                      </div>
                    </div>
                    
                    {forecast.licenses.length > 0 && (
                      <ScrollArea className="h-[100px]">
                        <div className="space-y-2">
                          {forecast.licenses.slice(0, 5).map((license) => (
                            <div 
                              key={license.id}
                              className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{license.companyName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {license.tier}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {format(new Date(license.expiresAt), 'dd MMM', { locale: es })}
                                </span>
                                <span className="font-medium">${license.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Report Generator */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generar Reporte
                </CardTitle>
                <CardDescription>
                  Crea reportes personalizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['usage', 'revenue', 'compliance', 'anomaly'] as const).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleGenerateReport(type)}
                    disabled={generatingReport === type}
                  >
                    {generatingReport === type ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Reporte de {type === 'usage' ? 'Uso' : 
                      type === 'revenue' ? 'Ingresos' : 
                      type === 'compliance' ? 'Cumplimiento' : 'Anomalías'}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Generated Reports */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Reportes Generados</CardTitle>
                <CardDescription>
                  Historial de reportes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-3 opacity-50" />
                      <p>No hay reportes generados</p>
                      <p className="text-sm">Genera tu primer reporte</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {reports.map((report) => (
                        <div 
                          key={report.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{report.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(report.generatedAt), { 
                                  addSuffix: true, 
                                  locale: es 
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                              {report.status === 'completed' ? 'Completado' : 
                               report.status === 'generating' ? 'Generando...' : report.status}
                            </Badge>
                            {report.status === 'completed' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleExportReport(report)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Last Refresh */}
      {lastRefresh && (
        <p className="text-xs text-muted-foreground text-center">
          Última actualización: {formatDistanceToNow(lastRefresh, { addSuffix: true, locale: es })}
        </p>
      )}
    </div>
  );
}

export default LicenseReportingDashboard;
