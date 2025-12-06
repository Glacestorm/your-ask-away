import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  FileText,
  BarChart3,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { VisitSheetAuditViewer } from './VisitSheetAuditViewer';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format, startOfDay, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AuditStats {
  totalActions: number;
  inserts: number;
  updates: number;
  deletes: number;
  uniqueUsers: number;
  uniqueTables: number;
  todayActions: number;
  weekActions: number;
}

interface TableActivity {
  table_name: string;
  count: number;
  inserts: number;
  updates: number;
  deletes: number;
}

interface UserActivity {
  user_id: string;
  user_email: string;
  action_count: number;
  last_action: string;
}

interface TimelineActivity {
  date: string;
  inserts: number;
  updates: number;
  deletes: number;
  total: number;
}

interface RecentLog {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
  user_id: string | null;
}

interface FullLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
}

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AuditorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AuditStats>({
    totalActions: 0,
    inserts: 0,
    updates: 0,
    deletes: 0,
    uniqueUsers: 0,
    uniqueTables: 0,
    todayActions: 0,
    weekActions: 0
  });
  const [tableActivity, setTableActivity] = useState<TableActivity[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineActivity[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [fullLogs, setFullLogs] = useState<FullLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterTable, setFilterTable] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchFullLogs();
  }, [currentPage, itemsPerPage]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchTableActivity(),
        fetchUserActivity(),
        fetchTimelineActivity(),
        fetchRecentLogs(),
        fetchFullLogs()
      ]);
    } catch (error: any) {
      console.error('Error fetching audit data:', error);
      toast.error('Error al cargar datos de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);

    const todayLogs = logs?.filter(log => parseISO(log.created_at) >= today) || [];
    const weekLogs = logs?.filter(log => parseISO(log.created_at) >= weekAgo) || [];

    const uniqueUsers = new Set(logs?.map(log => log.user_id).filter(Boolean)).size;
    const uniqueTables = new Set(logs?.map(log => log.table_name)).size;

    setStats({
      totalActions: logs?.length || 0,
      inserts: logs?.filter(l => l.action === 'INSERT').length || 0,
      updates: logs?.filter(l => l.action === 'UPDATE').length || 0,
      deletes: logs?.filter(l => l.action === 'DELETE').length || 0,
      uniqueUsers,
      uniqueTables,
      todayActions: todayLogs.length,
      weekActions: weekLogs.length
    });
  };

  const fetchTableActivity = async () => {
    const { data: logs, error } = await supabase.from('audit_logs').select('table_name, action');
    if (error) throw error;

    const tableMap = new Map<string, TableActivity>();
    logs?.forEach(log => {
      const existing = tableMap.get(log.table_name) || { table_name: log.table_name, count: 0, inserts: 0, updates: 0, deletes: 0 };
      existing.count++;
      if (log.action === 'INSERT') existing.inserts++;
      if (log.action === 'UPDATE') existing.updates++;
      if (log.action === 'DELETE') existing.deletes++;
      tableMap.set(log.table_name, existing);
    });

    setTableActivity(Array.from(tableMap.values()).sort((a, b) => b.count - a.count).slice(0, 10));
  };

  const fetchUserActivity = async () => {
    const { data: logs, error } = await supabase.from('audit_logs').select('user_id, created_at');
    if (error) throw error;

    const userMap = new Map<string, { count: number; last: string }>();
    logs?.forEach(log => {
      if (!log.user_id) return;
      const existing = userMap.get(log.user_id) || { count: 0, last: log.created_at };
      existing.count++;
      if (parseISO(log.created_at) > parseISO(existing.last)) existing.last = log.created_at;
      userMap.set(log.user_id, existing);
    });

    const userIds = Array.from(userMap.keys());
    const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);

    setUserActivity(userIds.map(userId => {
      const activity = userMap.get(userId)!;
      const profile = profiles?.find(p => p.id === userId);
      return {
        user_id: userId,
        user_email: profile?.email || 'Usuario desconocido',
        action_count: activity.count,
        last_action: activity.last
      };
    }).sort((a, b) => b.action_count - a.action_count).slice(0, 10));
  };

  const fetchTimelineActivity = async () => {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('action, created_at')
      .gte('created_at', subDays(new Date(), 7).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    const dateMap = new Map<string, TimelineActivity>();
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dateMap.set(date, {
        date: format(subDays(new Date(), i), 'dd MMM', { locale: es }),
        inserts: 0, updates: 0, deletes: 0, total: 0
      });
    }

    logs?.forEach(log => {
      const date = format(parseISO(log.created_at), 'yyyy-MM-dd');
      const activity = dateMap.get(date);
      if (activity) {
        activity.total++;
        if (log.action === 'INSERT') activity.inserts++;
        if (log.action === 'UPDATE') activity.updates++;
        if (log.action === 'DELETE') activity.deletes++;
      }
    });

    setTimelineData(Array.from(dateMap.values()));
  };

  const fetchRecentLogs = async () => {
    const { data, error } = await supabase.from('audit_logs').select('id, action, table_name, created_at, user_id').order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    setRecentLogs(data || []);
  };

  const fetchFullLogs = async () => {
    const { count, error: countError } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true });
    if (countError) throw countError;
    setTotalLogs(count || 0);

    const offset = (currentPage - 1) * itemsPerPage;
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).range(offset, offset + itemsPerPage - 1);
    if (error) throw error;
    setFullLogs(data || []);
  };

  const filteredFullLogs = fullLogs.filter((log) => {
    const matchesSearch = searchTerm === '' || log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) || log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesTable = filterTable === 'all' || log.table_name === filterTable;
    return matchesSearch && matchesAction && matchesTable;
  });

  const uniqueActions = [...new Set(fullLogs.map(log => log.action))];
  const uniqueTables = [...new Set(fullLogs.map(log => log.table_name))];
  const totalPages = Math.ceil(totalLogs / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalLogs);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      INSERT: 'bg-green-500/10 text-green-500 border-green-500/20',
      UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      DELETE: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return <Badge variant="outline" className={colors[action as keyof typeof colors]}>{action}</Badge>;
  };

  const actionDistribution = [
    { name: 'Insercions', value: stats.inserts, color: 'hsl(var(--chart-1))' },
    { name: 'Actualitzacions', value: stats.updates, color: 'hsl(var(--chart-2))' },
    { name: 'Eliminacions', value: stats.deletes, color: 'hsl(var(--chart-3))' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Accions</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalActions.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Avui: {stats.todayActions}</Badge>
              <Badge variant="outline">Setmana: {stats.weekActions}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Insercions</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.inserts.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {((stats.inserts / stats.totalActions) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actualitzacions</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.updates.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {((stats.updates / stats.totalActions) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-background shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full -translate-y-16 translate-x-16" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eliminacions</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.deletes.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {((stats.deletes / stats.totalActions) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-muted/50 to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuaris Actius</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-sm text-muted-foreground mt-1">Usuaris amb activitat registrada</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-r from-muted/50 to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taules Auditades</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueTables}</div>
            <p className="text-sm text-muted-foreground mt-1">Taules amb canvis registrats</p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Tabs */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground flex-wrap gap-1">
          <TabsTrigger value="timeline" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" />
            Evolució
          </TabsTrigger>
          <TabsTrigger value="distribution" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <PieChartIcon className="h-4 w-4" />
            Distribució
          </TabsTrigger>
          <TabsTrigger value="tables" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Database className="h-4 w-4" />
            Taules
          </TabsTrigger>
          <TabsTrigger value="users" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <Users className="h-4 w-4" />
            Usuaris
          </TabsTrigger>
          <TabsTrigger value="full-logs" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="visit-sheets" className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ClipboardList className="h-4 w-4" />
            Fitxes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Activitat dels Últims 7 Dies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorInserts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDeletes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Area type="monotone" dataKey="inserts" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorInserts)" name="Insercions" />
                  <Area type="monotone" dataKey="updates" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorUpdates)" name="Actualitzacions" />
                  <Area type="monotone" dataKey="deletes" stroke="hsl(var(--chart-3))" fillOpacity={1} fill="url(#colorDeletes)" name="Eliminacions" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Distribució d'Accions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={250}>
                    <PieChart>
                      <Pie data={actionDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {actionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-4">
                    {actionDistribution.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <Badge variant="secondary">{item.value}</Badge>
                        </div>
                        <Progress value={(item.value / stats.totalActions) * 100} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Resum Estadístic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actionDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                      {index === 0 ? <CheckCircle className="h-6 w-6" style={{ color: item.color }} /> :
                       index === 1 ? <AlertCircle className="h-6 w-6" style={{ color: item.color }} /> :
                       <XCircle className="h-6 w-6" style={{ color: item.color }} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{((item.value / stats.totalActions) * 100).toFixed(1)}% del total</p>
                    </div>
                    <p className="text-2xl font-bold">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Activitat per Taula (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tableActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="table_name" angle={-45} textAnchor="end" height={100} className="text-xs" />
                  <YAxis className="text-sm" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="inserts" fill="hsl(var(--chart-1))" name="Insercions" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="updates" fill="hsl(var(--chart-2))" name="Actualitzacions" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deletes" fill="hsl(var(--chart-3))" name="Eliminacions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Detall per Taula</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {tableActivity.map((table, index) => (
                    <div key={table.table_name} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{table.table_name}</p>
                        <p className="text-xs text-muted-foreground">{table.count} accions totals</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">+{table.inserts}</Badge>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">~{table.updates}</Badge>
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">-{table.deletes}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>Usuaris Més Actius (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.map((user, index) => (
                  <div key={user.user_id} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                      index === 1 ? 'bg-gray-400/20 text-gray-600' :
                      index === 2 ? 'bg-orange-500/20 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">{user.user_email}</span>
                        <Badge variant="secondary">{user.action_count} accions</Badge>
                      </div>
                      <Progress value={userActivity[0]?.action_count > 0 ? (user.action_count / userActivity[0].action_count) * 100 : 0} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Última: {format(parseISO(user.last_action), "dd MMM yyyy HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full-logs" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Logs d'Auditoría Complets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar per taula o acció..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger><SelectValue placeholder="Filtrar per acció" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Totes les accions</SelectItem>
                    {uniqueActions.map((action) => (<SelectItem key={action} value={action}>{action}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger><SelectValue placeholder="Filtrar per taula" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Totes les taules</SelectItem>
                    {uniqueTables.map((table) => (<SelectItem key={table} value={table}>{table}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrant {startItem} - {endItem} de {totalLogs} registres
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredFullLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-start gap-3">
                        {getActionIcon(log.action)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {getActionBadge(log.action)}
                            <Badge variant="outline">{log.table_name}</Badge>
                            {log.record_id && <Badge variant="secondary" className="text-xs">ID: {log.record_id.substring(0, 8)}...</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(log.created_at), "dd MMM yyyy 'a les' HH:mm:ss", { locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visit-sheets" className="space-y-6 animate-in fade-in-50 duration-300">
          <VisitSheetAuditViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
