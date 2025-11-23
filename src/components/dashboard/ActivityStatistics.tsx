import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Activity, BarChart3, Clock, Table, TrendingUp, Loader2 } from 'lucide-react';
import { format, parseISO, startOfDay, startOfHour } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = {
  INSERT: 'hsl(var(--chart-1))',
  UPDATE: 'hsl(var(--chart-2))',
  DELETE: 'hsl(var(--chart-3))',
  SELECT: 'hsl(var(--chart-4))',
};

export function ActivityStatistics() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const tableNames: Record<string, string> = {
      companies: 'Empresas',
      visits: 'Visitas',
      company_contacts: 'Contactos',
      company_documents: 'Documentos',
      company_photos: 'Fotos',
      profiles: 'Perfil',
      company_products: 'Productos de Empresa',
      notification_preferences: 'Preferencias de Notificación',
      visit_reminder_preferences: 'Preferencias de Recordatorios',
    };
    return tableNames[tableName] || tableName;
  };

  // Statistics by action type
  const actionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    activities.forEach((activity) => {
      stats[activity.action] = (stats[activity.action] || 0) + 1;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [activities]);

  // Statistics by table
  const tableStats = useMemo(() => {
    const stats: Record<string, number> = {};
    activities.forEach((activity) => {
      stats[activity.table_name] = (stats[activity.table_name] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name: getTableDisplayName(name), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [activities]);

  // Activity by hour of day
  const hourlyStats = useMemo(() => {
    const stats: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      stats[i] = 0;
    }
    activities.forEach((activity) => {
      const hour = new Date(activity.created_at!).getHours();
      stats[hour] = (stats[hour] || 0) + 1;
    });
    return Object.entries(stats).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      count,
    }));
  }, [activities]);

  // Temporal trends (last 30 days)
  const temporalTrends = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    activities.forEach((activity) => {
      const activityDate = new Date(activity.created_at!);
      if (activityDate >= thirtyDaysAgo) {
        const dateKey = format(startOfDay(activityDate), 'yyyy-MM-dd');
        if (!stats[dateKey]) {
          stats[dateKey] = { INSERT: 0, UPDATE: 0, DELETE: 0, SELECT: 0 };
        }
        stats[dateKey][activity.action] = (stats[dateKey][activity.action] || 0) + 1;
      }
    });

    return Object.entries(stats)
      .map(([date, actions]) => ({
        date: format(parseISO(date), 'dd/MM', { locale: es }),
        ...actions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activities]);

  // Action distribution by table
  const tableActionDistribution = useMemo(() => {
    const stats: Record<string, Record<string, number>> = {};
    activities.forEach((activity) => {
      const tableName = getTableDisplayName(activity.table_name);
      if (!stats[tableName]) {
        stats[tableName] = { INSERT: 0, UPDATE: 0, DELETE: 0, SELECT: 0 };
      }
      stats[tableName][activity.action] = (stats[tableName][activity.action] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([table, actions]) => ({
        table,
        ...actions,
        total: Object.values(actions).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [activities]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estadísticas de Actividad
          </CardTitle>
          <CardDescription>No hay datos suficientes para mostrar estadísticas</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Actividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tablas Modificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(activities.map(a => a.table_name)).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acción Más Común</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {actionStats.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tabla Más Activa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {tableStats[0]?.name || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="tables">Por Tabla</TabsTrigger>
          <TabsTrigger value="time">Por Hora</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Distribución por Tipo de Acción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={actionStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {actionStats.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS] || 'hsl(var(--muted))'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Tables Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Table className="h-4 w-4" />
                  Tablas Más Modificadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tableStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Distribución de Acciones por Tabla
              </CardTitle>
              <CardDescription>
                Tipos de acciones realizadas en cada tabla
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={tableActionDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="table" angle={-45} textAnchor="end" height={100} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="INSERT" stackId="a" fill={COLORS.INSERT} name="Crear" />
                  <Bar dataKey="UPDATE" stackId="a" fill={COLORS.UPDATE} name="Actualizar" />
                  <Bar dataKey="DELETE" stackId="a" fill={COLORS.DELETE} name="Eliminar" />
                  <Bar dataKey="SELECT" stackId="a" fill={COLORS.SELECT} name="Ver" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actividad por Hora del Día
              </CardTitle>
              <CardDescription>
                Patrones de actividad a lo largo de las 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={hourlyStats}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    name="Actividades"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendencias Temporales (Últimos 30 días)
              </CardTitle>
              <CardDescription>
                Evolución de la actividad por tipo de acción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={temporalTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="INSERT" stroke={COLORS.INSERT} name="Crear" strokeWidth={2} />
                  <Line type="monotone" dataKey="UPDATE" stroke={COLORS.UPDATE} name="Actualizar" strokeWidth={2} />
                  <Line type="monotone" dataKey="DELETE" stroke={COLORS.DELETE} name="Eliminar" strokeWidth={2} />
                  <Line type="monotone" dataKey="SELECT" stroke={COLORS.SELECT} name="Ver" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
