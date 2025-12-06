import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { es, ca, enUS, fr } from 'date-fns/locale';
import { 
  Bell, TrendingDown, Clock, CheckCircle2, AlertTriangle, 
  RefreshCw, Download, Filter, Building2, User, ArrowUpCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface GestorOption {
  id: string;
  name: string;
  oficina: string;
}

const metricLabels: Record<string, string> = {
  visits: 'Visites Totals',
  success_rate: 'Taxa d\'Èxit',
  vinculacion: 'Vinculació Mitjana',
  engagement: 'Engagement',
  products: 'Productes Oferts',
  tpv_volume: 'Volum TPV',
  facturacion: 'Facturació Total',
  visit_sheets: 'Fitxes de Visita',
  new_clients: 'Nous Clients',
  avg_visits_per_gestor: 'Visites per Gestor',
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

export function AlertHistoryDashboardCard() {
  const { user, isCommercialDirector, isOfficeDirector, isCommercialManager, isSuperAdmin } = useAuth();
  const isDirectorOrHigher = isCommercialDirector || isCommercialManager || isSuperAdmin;
  const canFilterByOffice = isDirectorOrHigher;
  const canFilterByGestor = isDirectorOrHigher || isOfficeDirector;

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [selectedGestorId, setSelectedGestorId] = useState<string>('all');
  const [userOficina, setUserOficina] = useState<string | null>(null);

  // Fetch user's office for OfficeDirector
  useEffect(() => {
    const fetchUserOffice = async () => {
      if (!user || !isOfficeDirector) return;
      const { data } = await supabase
        .from('profiles')
        .select('oficina')
        .eq('id', user.id)
        .single();
      if (data?.oficina) {
        setUserOficina(data.oficina);
        setSelectedOffice(data.oficina);
      }
    };
    fetchUserOffice();
  }, [user, isOfficeDirector]);

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
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      case '90d': return { start: subDays(now, 90), end: now };
      default: return { start: subDays(now, 30), end: now };
    }
  };

  // Fetch offices
  const { data: offices = [] } = useQuery({
    queryKey: ['offices-for-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('oficina')
        .not('oficina', 'is', null);
      const uniqueOffices = [...new Set(data?.map(p => p.oficina).filter(Boolean))] as string[];
      return uniqueOffices.sort();
    },
    enabled: canFilterByOffice,
  });

  // Fetch gestores based on selected office
  const { data: gestores = [] } = useQuery({
    queryKey: ['gestores-for-alerts', selectedOffice, userOficina],
    queryFn: async () => {
      let query = supabase.from('profiles').select('id, full_name, email, oficina');
      
      if (isOfficeDirector && userOficina) {
        query = query.eq('oficina', userOficina);
      } else if (selectedOffice !== 'all') {
        query = query.eq('oficina', selectedOffice);
      }
      
      const { data } = await query;
      return (data || []).map(p => ({
        id: p.id,
        name: p.full_name || p.email?.split('@')[0] || 'Desconegut',
        oficina: p.oficina || 'Sense assignar',
      })) as GestorOption[];
    },
    enabled: canFilterByGestor,
  });

  // Fetch user's companies for gestores
  const { data: userCompanies = [] } = useQuery({
    queryKey: ['user-companies-for-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('companies')
        .select('id')
        .eq('gestor_id', user.id);
      return data?.map(c => c.id) || [];
    },
    enabled: !canFilterByGestor && !isOfficeDirector && !!user,
  });

  // Fetch alert history
  const { data: alertHistory, isLoading, refetch } = useQuery({
    queryKey: ['alert-history-dashboard', dateRange, selectedOffice, selectedGestorId, user?.id, userCompanies],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('alert_history')
        .select('*')
        .gte('triggered_at', start.toISOString())
        .lte('triggered_at', end.toISOString())
        .order('triggered_at', { ascending: false });

      // Role-based filtering
      if (!canFilterByGestor && !isOfficeDirector) {
        // Regular gestor: only see alerts related to their companies or themselves
        if (user) {
          query = query.or(`target_gestor_id.eq.${user.id},target_gestor_id.is.null`);
        }
      } else if (isOfficeDirector && !isDirectorOrHigher) {
        // Office director: filter by their office or selected gestor
        if (selectedGestorId !== 'all') {
          query = query.eq('target_gestor_id', selectedGestorId);
        } else if (userOficina) {
          query = query.eq('target_office', userOficina);
        }
      } else {
        // Directors/Responsable Comercial: can filter by office and gestor
        if (selectedGestorId !== 'all') {
          query = query.eq('target_gestor_id', selectedGestorId);
        } else if (selectedOffice !== 'all') {
          query = query.eq('target_office', selectedOffice);
        }
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as AlertHistoryRecord[];
    },
  });

  // Calculate statistics
  const stats = {
    totalAlerts: alertHistory?.length || 0,
    resolvedAlerts: alertHistory?.filter(a => a.resolved_at).length || 0,
    pendingAlerts: alertHistory?.filter(a => !a.resolved_at).length || 0,
    escalatedAlerts: alertHistory?.filter(a => (a.escalation_level || 0) > 0).length || 0,
    criticalAlerts: alertHistory?.filter(a => {
      const diff = Math.abs(a.metric_value - a.threshold_value);
      const pct = a.threshold_value > 0 ? (diff / a.threshold_value) * 100 : 100;
      return pct > 30;
    }).length || 0,
  };

  // Trend data
  const trendData = (() => {
    if (!alertHistory) return [];
    const grouped = alertHistory.reduce((acc, alert) => {
      const date = format(new Date(alert.triggered_at), 'dd/MM');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, alertes: count }))
      .slice(-14);
  })();

  // Metric distribution
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
      toast.success('Alerta marcada com a resolta');
      refetch();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Error al resoldre l\'alerta');
    }
  };

  const handleExport = () => {
    if (!alertHistory) return;
    
    const csvContent = [
      ['Data', 'Alerta', 'Mètrica', 'Valor', 'Llindar', 'Condició', 'Resolt'].join(','),
      ...alertHistory.map(a => [
        format(new Date(a.triggered_at), 'dd/MM/yyyy HH:mm'),
        `"${a.alert_name}"`,
        metricLabels[a.metric_type] || a.metric_type,
        a.metric_value.toFixed(2),
        a.threshold_value,
        a.condition_type,
        a.resolved_at ? 'Sí' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_alertes_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const getSeverityBadge = (alert: AlertHistoryRecord) => {
    const diff = Math.abs(alert.metric_value - alert.threshold_value);
    const pct = alert.threshold_value > 0 ? (diff / alert.threshold_value) * 100 : 100;
    
    if (pct > 30) {
      return <Badge variant="destructive">Crític</Badge>;
    } else if (pct > 15) {
      return <Badge className="bg-amber-500 text-white">Advertència</Badge>;
    }
    return <Badge variant="secondary">Info</Badge>;
  };

  const getEscalationBadge = (level: number | null) => {
    if (!level || level === 0) return null;
    const colors = ['bg-amber-500', 'bg-orange-500', 'bg-red-500'];
    const labels = ['Nivell 1', 'Nivell 2', 'Nivell 3'];
    return (
      <Badge className={`${colors[Math.min(level - 1, 2)]} text-white flex items-center gap-1`}>
        <ArrowUpCircle className="h-3 w-3" />
        {labels[Math.min(level - 1, 2)]}
      </Badge>
    );
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <Bell className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Historial d'Alertes</CardTitle>
              <CardDescription>Seguiment d'alertes KPI</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últims 7 dies</SelectItem>
                <SelectItem value="30d">Últims 30 dies</SelectItem>
                <SelectItem value="90d">Últims 90 dies</SelectItem>
              </SelectContent>
            </Select>

            {canFilterByOffice && (
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger className="w-[160px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Oficina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Totes les oficines</SelectItem>
                  {offices.map(office => (
                    <SelectItem key={office} value={office}>{office}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {canFilterByGestor && (
              <Select value={selectedGestorId} onValueChange={setSelectedGestorId}>
                <SelectTrigger className="w-[180px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tots els gestors</SelectItem>
                  {gestores.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <TrendingDown className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <div className="text-2xl font-bold text-destructive">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">Crítiques</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <ArrowUpCircle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold text-orange-500">{stats.escalatedAlerts}</div>
            <p className="text-xs text-muted-foreground">Escalades</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold text-amber-500">{stats.pendingAlerts}</div>
            <p className="text-xs text-muted-foreground">Pendents</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold text-green-500">{stats.resolvedAlerts}</div>
            <p className="text-xs text-muted-foreground">Resoltes</p>
          </div>
        </div>

        <Tabs defaultValue="trend" className="space-y-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trend">Tendència</TabsTrigger>
            <TabsTrigger value="distribution">Distribució</TabsTrigger>
            <TabsTrigger value="list">Llista</TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <div className="h-[200px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <RechartsTooltip />
                    <Area 
                      type="monotone" 
                      dataKey="alertes" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hi ha dades per mostrar
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="distribution">
            <div className="h-[200px]">
              {metricDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {metricDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hi ha dades per mostrar
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <ScrollArea className="h-[200px]">
              {alertHistory && alertHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Alerta</TableHead>
                      <TableHead>Mètrica</TableHead>
                      <TableHead>Severitat</TableHead>
                      <TableHead>Estat</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertHistory.slice(0, 10).map(alert => (
                      <TableRow key={alert.id}>
                        <TableCell className="text-xs">
                          {formatDistanceToNow(new Date(alert.triggered_at), { 
                            addSuffix: true, 
                            locale: getDateLocale() 
                          })}
                        </TableCell>
                        <TableCell className="font-medium text-sm">{alert.alert_name}</TableCell>
                        <TableCell className="text-xs">
                          {metricLabels[alert.metric_type] || alert.metric_type}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {getSeverityBadge(alert)}
                            {getEscalationBadge(alert.escalation_level)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.resolved_at ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolt
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendent
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!alert.resolved_at && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hi ha alertes en aquest període
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
