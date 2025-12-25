import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown,
  Download,
  DollarSign,
  Star,
  Users,
  Eye,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { PartnerApplication, PartnerRevenueTransaction } from '@/types/marketplace';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface PartnerAnalyticsProps {
  apps: PartnerApplication[];
  revenue: (PartnerRevenueTransaction & { application?: { app_name: string } })[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function PartnerAnalytics({ apps, revenue }: PartnerAnalyticsProps) {
  const stats = useMemo(() => {
    const totalInstalls = apps.reduce((acc, app) => acc + (app.install_count || 0), 0);
    const totalRevenue = revenue.reduce((acc, t) => acc + (t.partner_amount || 0), 0);
    const avgRating = apps.reduce((acc, app) => acc + (app.rating_average || 0), 0) / (apps.length || 1);
    const publishedApps = apps.filter(a => a.status === 'published').length;

    return {
      totalInstalls,
      totalRevenue,
      avgRating,
      publishedApps,
      totalApps: apps.length,
    };
  }, [apps, revenue]);

  // Generate revenue trend data (last 30 days)
  const revenueTrendData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayRevenue = revenue
        .filter(t => {
          const tDate = startOfDay(new Date(t.created_at));
          return tDate.getTime() === dayStart.getTime();
        })
        .reduce((acc, t) => acc + (t.partner_amount || 0), 0);

      return {
        date: format(day, 'dd/MM', { locale: es }),
        revenue: dayRevenue,
      };
    });
  }, [revenue]);

  // Apps by category
  const appsByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    apps.forEach(app => {
      const cat = app.category || 'other';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [apps]);

  // Top performing apps
  const topApps = useMemo(() => {
    return [...apps]
      .sort((a, b) => (b.install_count || 0) - (a.install_count || 0))
      .slice(0, 5);
  }, [apps]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return revenue.slice(0, 10);
  }, [revenue]);

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+12% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instalaciones</p>
                <p className="text-2xl font-bold">{stats.totalInstalls.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Download className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span>+8% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating Promedio</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= stats.avgRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Apps Publicadas</p>
                <p className="text-2xl font-bold">{stats.publishedApps}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              de {stats.totalApps} apps totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tendencia de Ingresos</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ingresos']}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Apps by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apps por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {appsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Apps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top Apps por Instalaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topApps.map((app, index) => {
                const maxInstalls = topApps[0]?.install_count || 1;
                const percentage = ((app.install_count || 0) / maxInstalls) * 100;

                return (
                  <div key={app.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                        <span className="font-medium truncate max-w-[200px]">{app.app_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {app.rating_count > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {app.rating_average.toFixed(1)}
                          </div>
                        )}
                        <Badge variant="outline">{app.install_count}</Badge>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}

              {topApps.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No hay apps aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Transacciones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{transaction.application?.app_name || 'App'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+€{transaction.partner_amount.toFixed(2)}</p>
                      <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {recentTransactions.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No hay transacciones aún
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PartnerAnalytics;
