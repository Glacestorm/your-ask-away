/**
 * LicenseUsageAnalytics - Analytics de uso de licencias
 * Fase 3 del Sistema de Licencias Enterprise
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Laptop,
  Calendar,
  Activity
} from 'lucide-react';
import { type License } from '@/hooks/admin/enterprise/useLicenseManager';

interface LicenseUsageAnalyticsProps {
  licenses: License[];
}

const COLORS = ['#22c55e', '#f59e0b', '#6b7280', '#ef4444', '#3b82f6'];

export function LicenseUsageAnalytics({ licenses }: LicenseUsageAnalyticsProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const total = licenses.length;
    const active = licenses.filter(l => l.status === 'active').length;
    const expired = licenses.filter(l => l.status === 'expired').length;
    const suspended = licenses.filter(l => l.status === 'suspended').length;
    const revoked = licenses.filter(l => l.status === 'revoked').length;

    // License types distribution
    const typeDistribution = licenses.reduce((acc, l) => {
      const type = l.license_type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Users utilization
    const totalMaxUsers = licenses.reduce((sum, l) => sum + (l.max_users || 0), 0);
    const totalCurrentUsers = licenses.reduce((sum, l) => sum + ((l as any).current_users || 0), 0);
    const userUtilization = totalMaxUsers > 0 ? (totalCurrentUsers / totalMaxUsers) * 100 : 0;

    // Devices utilization
    const totalMaxDevices = licenses.reduce((sum, l) => sum + (l.max_devices || 0), 0);
    const totalCurrentDevices = licenses.reduce((sum, l) => sum + ((l as any).current_devices || 0), 0);
    const deviceUtilization = totalMaxDevices > 0 ? (totalCurrentDevices / totalMaxDevices) * 100 : 0;

    // Expiring soon (next 30 days)
    const expiringSoon = licenses.filter(l => {
      if (!l.expires_at || l.status !== 'active') return false;
      const daysUntil = (new Date(l.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil <= 30;
    }).length;

    return {
      total,
      active,
      expired,
      suspended,
      revoked,
      typeDistribution,
      userUtilization,
      deviceUtilization,
      totalMaxUsers,
      totalCurrentUsers,
      totalMaxDevices,
      totalCurrentDevices,
      expiringSoon
    };
  }, [licenses]);

  // Prepare chart data
  const statusData = [
    { name: 'Activas', value: stats.active, color: '#22c55e' },
    { name: 'Expiradas', value: stats.expired, color: '#6b7280' },
    { name: 'Suspendidas', value: stats.suspended, color: '#f59e0b' },
    { name: 'Revocadas', value: stats.revoked, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const typeData = Object.entries(stats.typeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Monthly trend (mock data - in production would come from DB)
  const monthlyTrend = [
    { month: 'Jul', licenses: 12, validations: 450 },
    { month: 'Ago', licenses: 15, validations: 520 },
    { month: 'Sep', licenses: 18, validations: 610 },
    { month: 'Oct', licenses: 22, validations: 750 },
    { month: 'Nov', licenses: 28, validations: 890 },
    { month: 'Dic', licenses: stats.active, validations: 1050 },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilización Usuarios</p>
                <p className="text-2xl font-bold">{stats.userUtilization.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalCurrentUsers} de {stats.totalMaxUsers}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
            <Progress value={stats.userUtilization} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilización Dispositivos</p>
                <p className="text-2xl font-bold">{stats.deviceUtilization.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalCurrentDevices} de {stats.totalMaxDevices}
                </p>
              </div>
              <Laptop className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
            <Progress value={stats.deviceUtilization} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiran Pronto</p>
                <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Próximos 30 días
                </p>
              </div>
              <Calendar className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Activación</p>
                <p className="text-2xl font-bold">
                  {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.active} de {stats.total} licencias
                </p>
              </div>
              <Activity className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribución por Estado
            </CardTitle>
            <CardDescription>
              Estado actual de todas las licencias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Distribución por Tipo
            </CardTitle>
            <CardDescription>
              Tipos de licencias emitidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendencia Mensual
          </CardTitle>
          <CardDescription>
            Evolución de licencias y validaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="licenses" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Licencias Activas"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="validations" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Validaciones"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LicenseUsageAnalytics;
