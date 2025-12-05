import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, subDays, startOfMonth, endOfMonth, subMonths, formatDistanceToNow } from 'date-fns';
import { es, ca, enUS, fr } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  History, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock,
  Download, Filter, RefreshCw, Calendar, ArrowUpCircle, Check
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AlertHistoryRecord {
  id: string;
  alert_id: string;
  alert_name: string;
  metric_type: string;
  metric_value: number;
  threshold_value: number;
  condition_type: string;
  target_type: string;
  target_office: string | null;
  target_gestor_id: string | null;
  triggered_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string | null;
  escalation_level: number | null;
  escalated_at: string | null;
}

const metricLabels: Record<string, string> = {
  visits: 'Visitas Totales',
  success_rate: 'Tasa de Éxito',
  vinculacion: 'Vinculación Promedio',
  engagement: 'Engagement',
  products: 'Productos Ofrecidos',
  tpv_volume: 'Volumen TPV',
  facturacion: 'Facturación Total',
  visit_sheets: 'Fichas de Visita',
  new_clients: 'Nuevos Clientes',
  avg_visits_per_gestor: 'Visitas por Gestor',
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

export const AlertHistoryViewer = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [metricFilter, setMetricFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');

  const getDateLocale = () => {
    const lang = localStorage.getItem('language') || 'ca';
    switch (lang) {
      case 'es': return es;
      case 'ca': return ca;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      case 'custom':
        return { start: new Date(startDate), end: new Date(endDate) };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const { data: alertHistory, isLoading, refetch } = useQuery({
    queryKey: ['alert-history', dateRange, startDate, endDate, metricFilter, targetTypeFilter],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('alert_history')
        .select('*')
        .gte('triggered_at', start.toISOString())
        .lte('triggered_at', end.toISOString())
        .order('triggered_at', { ascending: false });

      if (metricFilter !== 'all') {
        query = query.eq('metric_type', metricFilter);
      }

      if (targetTypeFilter !== 'all') {
        query = query.eq('target_type', targetTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AlertHistoryRecord[];
    },
  });

  // Calculate statistics
  const stats = {
    totalAlerts: alertHistory?.length || 0,
    resolvedAlerts: alertHistory?.filter(a => a.resolved_at).length || 0,
    autoResolvedAlerts: alertHistory?.filter(a => a.notes?.includes('Auto-resuelto')).length || 0,
    pendingAlerts: alertHistory?.filter(a => !a.resolved_at).length || 0,
    escalatedAlerts: alertHistory?.filter(a => (a.escalation_level || 0) > 0).length || 0,
    criticalAlerts: alertHistory?.filter(a => {
      const diff = Math.abs(a.metric_value - a.threshold_value);
      const pct = a.threshold_value > 0 ? (diff / a.threshold_value) * 100 : 100;
      return pct > 30;
    }).length || 0,
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alert_history')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alerta marcada como resuelta');
      refetch();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Error al resolver la alerta');
    }
  };

  const handleEscalateNow = async () => {
    try {
      toast.info('Ejecutando escalado de alertas...');
      const { error } = await supabase.functions.invoke('escalate-alerts');
      if (error) throw error;
      toast.success('Escalado ejecutado correctamente');
      refetch();
    } catch (error) {
      console.error('Error escalating alerts:', error);
      toast.error('Error al ejecutar el escalado');
    }
  };

  const getEscalationBadge = (level: number | null) => {
    if (!level || level === 0) return null;
    const colors = ['bg-amber-500', 'bg-orange-500', 'bg-red-500'];
    const labels = ['Nivel 1', 'Nivel 2', 'Nivel 3'];
    return (
      <Badge className={`${colors[Math.min(level - 1, 2)]} text-white flex items-center gap-1`}>
        <ArrowUpCircle className="h-3 w-3" />
        {labels[Math.min(level - 1, 2)]}
      </Badge>
    );
  };

  // Prepare data for trend chart (alerts per day)
  const trendData = (() => {
    if (!alertHistory) return [];
    
    const grouped = alertHistory.reduce((acc, alert) => {
      const date = format(new Date(alert.triggered_at), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, alertas: count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  // Prepare data for metric distribution
  const metricDistribution = (() => {
    if (!alertHistory) return [];
    
    const grouped = alertHistory.reduce((acc, alert) => {
      const metric = metricLabels[alert.metric_type] || alert.metric_type;
      acc[metric] = (acc[metric] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Prepare data for target type distribution
  const targetDistribution = (() => {
    if (!alertHistory) return [];
    
    const labels: Record<string, string> = {
      global: 'Global',
      office: 'Por Oficina',
      gestor: 'Por Gestor',
    };
    
    const grouped = alertHistory.reduce((acc, alert) => {
      const target = labels[alert.target_type || 'global'] || 'Global';
      acc[target] = (acc[target] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }));
  })();

  // Monthly comparison data
  const monthlyComparison = (() => {
    if (!alertHistory) return [];
    
    const months: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      const monthKey = format(monthStart, 'MMM yyyy', { locale: getDateLocale() });
      
      months[monthKey] = alertHistory.filter(a => {
        const date = new Date(a.triggered_at);
        return date >= monthStart && date <= monthEnd;
      }).length;
    }
    
    return Object.entries(months).map(([month, count]) => ({ month, alertas: count }));
  })();

  const handleExport = () => {
    if (!alertHistory) return;
    
    const csvContent = [
      ['Fecha', 'Alerta', 'Métrica', 'Valor', 'Umbral', 'Condición', 'Objetivo', 'Resuelto'].join(','),
      ...alertHistory.map(a => [
        format(new Date(a.triggered_at), 'dd/MM/yyyy HH:mm'),
        `"${a.alert_name}"`,
        metricLabels[a.metric_type] || a.metric_type,
        a.metric_value.toFixed(2),
        a.threshold_value,
        a.condition_type,
        a.target_type,
        a.resolved_at ? 'Sí' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_alertas_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const getSeverityBadge = (alert: AlertHistoryRecord) => {
    const diff = Math.abs(alert.metric_value - alert.threshold_value);
    const pct = alert.threshold_value > 0 ? (diff / alert.threshold_value) * 100 : 100;
    
    if (pct > 30) {
      return <Badge variant="destructive">Crítico</Badge>;
    } else if (pct > 15) {
      return <Badge className="bg-amber-500 text-white">Advertencia</Badge>;
    }
    return <Badge variant="secondary">Info</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Historial de Alertas</h2>
            <p className="text-muted-foreground text-sm">Registro histórico y tendencias de alertas KPI</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={handleEscalateNow}>
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Ejecutar Escalado
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Métrica</Label>
              <Select value={metricFilter} onValueChange={setMetricFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(metricLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="office">Por Oficina</SelectItem>
                  <SelectItem value="gestor">Por Gestor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alertas</p>
                <p className="text-3xl font-bold">{stats.totalAlerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticas</p>
                <p className="text-3xl font-bold text-destructive">{stats.criticalAlerts}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escaladas</p>
                <p className="text-3xl font-bold text-orange-500">{stats.escalatedAlerts}</p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-3xl font-bold text-amber-500">{stats.pendingAlerts}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resueltas</p>
                <p className="text-3xl font-bold text-green-500">{stats.resolvedAlerts}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-resueltas</p>
                <p className="text-3xl font-bold text-emerald-500">{stats.autoResolvedAlerts}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">Tendencia</TabsTrigger>
          <TabsTrigger value="distribution">Distribución</TabsTrigger>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="table">Detalle</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Alertas por Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAlertas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: getDateLocale() })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy', { locale: getDateLocale() })}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="alertas" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#colorAlertas)"
                      strokeWidth={2}
                      name="Alertas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Por Tipo de Métrica</CardTitle>
              </CardHeader>
              <CardContent>
                {metricDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metricDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120}
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" name="Alertas" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Tipo de Objetivo</CardTitle>
              </CardHeader>
              <CardContent>
                {targetDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={targetDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {targetDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Comparativa Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="alertas" fill="hsl(var(--primary))" name="Alertas" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No hay datos para mostrar
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : alertHistory && alertHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Alerta</TableHead>
                        <TableHead>Métrica</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Umbral</TableHead>
                        <TableHead>Severidad</TableHead>
                        <TableHead>Escalado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertHistory.slice(0, 50).map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(alert.triggered_at), 'dd/MM/yyyy HH:mm', { locale: getDateLocale() })}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {alert.alert_name}
                          </TableCell>
                          <TableCell>
                            {metricLabels[alert.metric_type] || alert.metric_type}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {alert.metric_value.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {alert.threshold_value}
                          </TableCell>
                          <TableCell>{getSeverityBadge(alert)}</TableCell>
                          <TableCell>
                            {getEscalationBadge(alert.escalation_level)}
                            {alert.escalated_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(alert.escalated_at), { addSuffix: true, locale: getDateLocale() })}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {alert.resolved_at ? (
                              <div className="flex flex-col gap-1">
                                {alert.notes?.includes('Auto-resuelto') ? (
                                  <Badge className="bg-emerald-500 text-white">Auto-resuelto</Badge>
                                ) : (
                                  <Badge className="bg-green-500 text-white">Resuelto</Badge>
                                )}
                                {alert.notes && (
                                  <p className="text-xs text-muted-foreground max-w-[150px] truncate" title={alert.notes}>
                                    {alert.notes}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary">Pendiente</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!alert.resolved_at && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleResolveAlert(alert.id)}
                                    >
                                      <Check className="h-4 w-4 text-green-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Marcar como resuelta</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay alertas registradas en este período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
