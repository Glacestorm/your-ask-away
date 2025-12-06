import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  ClipboardList
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
  Legend
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

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

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

    const todayLogs = logs?.filter(log => 
      parseISO(log.created_at) >= today
    ) || [];

    const weekLogs = logs?.filter(log => 
      parseISO(log.created_at) >= weekAgo
    ) || [];

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
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('table_name, action');

    if (error) throw error;

    const tableMap = new Map<string, TableActivity>();
    
    logs?.forEach(log => {
      const existing = tableMap.get(log.table_name) || {
        table_name: log.table_name,
        count: 0,
        inserts: 0,
        updates: 0,
        deletes: 0
      };

      existing.count++;
      if (log.action === 'INSERT') existing.inserts++;
      if (log.action === 'UPDATE') existing.updates++;
      if (log.action === 'DELETE') existing.deletes++;

      tableMap.set(log.table_name, existing);
    });

    const sortedTables = Array.from(tableMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setTableActivity(sortedTables);
  };

  const fetchUserActivity = async () => {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('user_id, created_at');

    if (error) throw error;

    const userMap = new Map<string, { count: number; last: string }>();
    
    logs?.forEach(log => {
      if (!log.user_id) return;
      
      const existing = userMap.get(log.user_id) || { count: 0, last: log.created_at };
      existing.count++;
      if (parseISO(log.created_at) > parseISO(existing.last)) {
        existing.last = log.created_at;
      }
      userMap.set(log.user_id, existing);
    });

    // Fetch user emails
    const userIds = Array.from(userMap.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const userActivityList: UserActivity[] = userIds.map(userId => {
      const activity = userMap.get(userId)!;
      const profile = profiles?.find(p => p.id === userId);
      
      return {
        user_id: userId,
        user_email: profile?.email || 'Usuario desconocido',
        action_count: activity.count,
        last_action: activity.last
      };
    }).sort((a, b) => b.action_count - a.action_count).slice(0, 10);

    setUserActivity(userActivityList);
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
        inserts: 0,
        updates: 0,
        deletes: 0,
        total: 0
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
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, table_name, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    setRecentLogs(data || []);
  };

  const fetchFullLogs = async () => {
    // Get total count first
    const { count, error: countError } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    setTotalLogs(count || 0);

    // Fetch paginated data
    const offset = (currentPage - 1) * itemsPerPage;
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (error) throw error;
    setFullLogs(data || []);
  };

  const filteredFullLogs = fullLogs.filter((log) => {
    const matchesSearch = searchTerm === '' || 
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesTable = filterTable === 'all' || log.table_name === filterTable;

    return matchesSearch && matchesAction && matchesTable;
  });

  const uniqueActions = [...new Set(fullLogs.map(log => log.action))];
  const uniqueTables = [...new Set(fullLogs.map(log => log.table_name))];

  const totalPages = Math.ceil(totalLogs / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalLogs);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      INSERT: 'bg-green-500/10 text-green-500 border-green-500/20',
      UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      DELETE: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    
    return (
      <Badge variant="outline" className={colors[action as keyof typeof colors]}>
        {action}
      </Badge>
    );
  };

  const actionDistribution = [
    { name: 'Inserciones', value: stats.inserts, color: 'hsl(var(--chart-1))' },
    { name: 'Actualizaciones', value: stats.updates, color: 'hsl(var(--chart-2))' },
    { name: 'Eliminaciones', value: stats.deletes, color: 'hsl(var(--chart-3))' }
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avui: {stats.todayActions} | Setmana: {stats.weekActions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insercions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.inserts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.inserts / stats.totalActions) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actualitzacions</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.updates.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.updates / stats.totalActions) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eliminacions</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.deletes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.deletes / stats.totalActions) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuaris Actius</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Usuaris amb activitat registrada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taules Auditades</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueTables}</div>
            <p className="text-xs text-muted-foreground">Taules amb canvis registrats</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Info */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="timeline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Evolució
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="h-4 w-4 mr-2" />
            Distribució
          </TabsTrigger>
          <TabsTrigger value="tables">
            <Database className="h-4 w-4 mr-2" />
            Taules
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuaris
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Recents
          </TabsTrigger>
          <TabsTrigger value="full-logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs Complets
          </TabsTrigger>
          <TabsTrigger value="visit-sheets">
            <ClipboardList className="h-4 w-4 mr-2" />
            Fitxes Visita
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activitat dels Últims 7 Dies</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="inserts" 
                    stroke="hsl(var(--chart-1))" 
                    name="Insercions"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="updates" 
                    stroke="hsl(var(--chart-2))" 
                    name="Actualitzacions"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="deletes" 
                    stroke="hsl(var(--chart-3))" 
                    name="Eliminacions"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribució d'Accions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={actionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {actionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resum Estadístic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Insercions</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full bg-chart-1"
                          style={{ width: `${(stats.inserts / stats.totalActions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.inserts}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Actualitzacions</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full bg-chart-2"
                          style={{ width: `${(stats.updates / stats.totalActions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.updates}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Eliminacions</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                        <div 
                          className="h-full bg-chart-3"
                          style={{ width: `${(stats.deletes / stats.totalActions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.deletes}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activitat per Taula (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tableActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="table_name" angle={-45} textAnchor="end" height={100} className="text-xs" />
                  <YAxis className="text-sm" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="inserts" fill="hsl(var(--chart-1))" name="Insercions" />
                  <Bar dataKey="updates" fill="hsl(var(--chart-2))" name="Actualitzacions" />
                  <Bar dataKey="deletes" fill="hsl(var(--chart-3))" name="Eliminacions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detall per Taula</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {tableActivity.map((table) => (
                    <div 
                      key={table.table_name}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{table.table_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {table.count} accions totals
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          +{table.inserts}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          ~{table.updates}
                        </Badge>
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                          -{table.deletes}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuaris Més Actius (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {userActivity.map((user, index) => (
                    <div 
                      key={user.user_id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.user_email}</p>
                          <p className="text-xs text-muted-foreground">
                            Última acció: {format(parseISO(user.last_action), "dd MMM yyyy 'a les' HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        {user.action_count} accions
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activitat Recent (Últimes 20 accions)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {recentLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {getActionIcon(log.action)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getActionBadge(log.action)}
                          <span className="text-sm font-medium truncate">{log.table_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(log.created_at), "dd MMM yyyy 'a les' HH:mm:ss", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Logs d'Auditoría Complets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar per taula o acció..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar per acció" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Totes les accions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar per taula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Totes les taules</SelectItem>
                    {uniqueTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrant {startItem} - {endItem} de {totalLogs} registres totals
                  {filteredFullLogs.length !== fullLogs.length && (
                    <span className="ml-2 text-primary">
                      ({filteredFullLogs.length} filtrats)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Registres per pàgina:</span>
                  <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-[600px] rounded-md border">
                <div className="space-y-2 p-4">
                  {filteredFullLogs.map((log) => (
                    <Card key={log.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {getActionIcon(log.action)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getActionBadge(log.action)}
                                <Badge variant="outline">{log.table_name}</Badge>
                                {log.record_id && (
                                  <Badge variant="secondary" className="text-xs">
                                    ID: {log.record_id.substring(0, 8)}...
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {format(parseISO(log.created_at), "dd MMM yyyy 'a les' HH:mm:ss", { locale: es })}
                              </p>
                              
                              {(log.old_data || log.new_data) && (
                                <div className="grid gap-2 mt-3">
                                  {log.old_data && log.action === 'UPDATE' && (
                                    <div className="rounded-md bg-red-500/5 border border-red-500/10 p-3">
                                      <p className="text-xs font-medium text-red-600 mb-1">Dades anteriors:</p>
                                      <pre className="text-xs overflow-x-auto text-muted-foreground">
                                        {JSON.stringify(log.old_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.new_data && (
                                    <div className="rounded-md bg-green-500/5 border border-green-500/10 p-3">
                                      <p className="text-xs font-medium text-green-600 mb-1">
                                        {log.action === 'UPDATE' ? 'Dades noves:' : 'Dades:'}
                                      </p>
                                      <pre className="text-xs overflow-x-auto text-muted-foreground">
                                        {JSON.stringify(log.new_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.old_data && log.action === 'DELETE' && (
                                    <div className="rounded-md bg-red-500/5 border border-red-500/10 p-3">
                                      <p className="text-xs font-medium text-red-600 mb-1">Dades eliminades:</p>
                                      <pre className="text-xs overflow-x-auto text-muted-foreground">
                                        {JSON.stringify(log.old_data, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredFullLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm font-medium">No s'han trobat registres</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Prova d'ajustar els filtres de cerca
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Pàgina {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Següent
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visit-sheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Auditoría de Fichas de Visita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VisitSheetAuditViewer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}