import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Loader2
} from 'lucide-react';
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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchTableActivity(),
        fetchUserActivity(),
        fetchTimelineActivity(),
        fetchRecentLogs()
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Dashboard d'Auditor</h2>
          <p className="text-sm text-muted-foreground">
            Mètriques d'auditoría i traçabilitat del sistema
          </p>
        </div>
      </div>

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
        <TabsList className="grid w-full grid-cols-5">
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
      </Tabs>
    </div>
  );
}