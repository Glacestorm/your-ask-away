import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Download,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  FileText
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function MarketplaceRevenuePanel() {
  // Fetch revenue data
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['marketplace-revenue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_revenue_transactions')
        .select(`
          *,
          application:partner_applications(app_name, category),
          partner:partner_companies(company_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!transactions) return {
      totalRevenue: 0,
      platformRevenue: 0,
      partnerPayouts: 0,
      transactionCount: 0,
      avgTransaction: 0,
      monthlyGrowth: 0,
    };

    const totalRevenue = transactions.reduce((acc, t) => acc + (t.gross_amount || 0), 0);
    const platformRevenue = transactions.reduce((acc, t) => acc + (t.platform_fee || 0), 0);
    const partnerPayouts = transactions.reduce((acc, t) => acc + (t.partner_amount || 0), 0);

    return {
      totalRevenue,
      platformRevenue,
      partnerPayouts,
      transactionCount: transactions.length,
      avgTransaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
      monthlyGrowth: 15.4, // Demo data
    };
  }, [transactions]);

  // Generate trend data (last 30 days)
  const revenueTrendData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayTransactions = (transactions || []).filter(t => {
        const tDate = startOfDay(new Date(t.created_at));
        return tDate.getTime() === dayStart.getTime();
      });

      return {
        date: format(day, 'dd/MM', { locale: es }),
        revenue: dayTransactions.reduce((acc, t) => acc + (t.gross_amount || 0), 0),
        platform: dayTransactions.reduce((acc, t) => acc + (t.platform_fee || 0), 0),
      };
    });
  }, [transactions]);

  // Revenue by category
  const revenueByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    (transactions || []).forEach(t => {
      const cat = t.application?.category || 'other';
      categories[cat] = (categories[cat] || 0) + (t.gross_amount || 0);
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  // Top apps by revenue
  const topApps = useMemo(() => {
    const apps: Record<string, { name: string; revenue: number; transactions: number }> = {};
    (transactions || []).forEach(t => {
      const appId = t.application_id;
      const appName = t.application?.app_name || 'App desconocida';
      if (!apps[appId]) {
        apps[appId] = { name: appName, revenue: 0, transactions: 0 };
      }
      apps[appId].revenue += t.gross_amount || 0;
      apps[appId].transactions += 1;
    });

    return Object.entries(apps)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [transactions]);

  const recentTransactions = (transactions || []).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats */}
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
              <span>+{stats.monthlyGrowth}% vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Plataforma</p>
                <p className="text-2xl font-bold">€{stats.platformRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Comisión del marketplace
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos a Partners</p>
                <p className="text-2xl font-bold">€{stats.partnerPayouts.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Revenue share partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transacciones</p>
                <p className="text-2xl font-bold">{stats.transactionCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg: €{stats.avgTransaction.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Tendencia de Ingresos</CardTitle>
                <CardDescription>Últimos 30 días</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `€${value.toFixed(2)}`,
                      name === 'revenue' ? 'Total' : 'Plataforma'
                    ]}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    name="revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="platform"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.2}
                    name="platform"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByCategory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `€${value.toFixed(0)}`}
                    >
                      {revenueByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sin datos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Apps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Apps por Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {topApps.length > 0 ? (
              <div className="space-y-4">
                {topApps.map((app, index) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.transactions} transacciones
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">€{app.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Sin datos de revenue
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transacciones Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{transaction.application?.app_name || 'App'}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.partner?.company_name || 'Partner'} • 
                          {format(new Date(transaction.created_at), ' dd MMM HH:mm', { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{(transaction.gross_amount || 0).toFixed(2)}</p>
                        <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Sin transacciones recientes
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MarketplaceRevenuePanel;