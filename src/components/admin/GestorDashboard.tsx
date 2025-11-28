import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Activity, Target, Building2, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { DateRange } from 'react-day-picker';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface GestorStats {
  totalVisits: number;
  successRate: number;
  totalCompanies: number;
  totalProducts: number;
}

interface MonthlyData {
  month: string;
  visits: number;
  successful: number;
}

interface RecentVisit {
  id: string;
  visit_date: string;
  company_name: string;
  result: string;
  notes: string;
}

export function GestorDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: subMonths(today, 6), to: today };
  });
  const [stats, setStats] = useState<GestorStats>({
    totalVisits: 0,
    successRate: 0,
    totalCompanies: 0,
    totalProducts: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);

  useEffect(() => {
    if (user && dateRange?.from && dateRange?.to) {
      fetchData();
    }
  }, [user, dateRange]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const fromDate = format(dateRange!.from!, 'yyyy-MM-dd');
      const toDate = format(dateRange!.to!, 'yyyy-MM-dd');

      // Obtener visitas del gestor en el período
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('*, companies(name)')
        .eq('gestor_id', user.id)
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      const totalVisits = visits?.length || 0;
      const successfulVisits = visits?.filter(v => v.result === 'Exitosa').length || 0;
      const successRate = totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 100) : 0;

      // Obtener empresas asignadas
      const { count: companiesCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', user.id);

      // Obtener productos únicos ofrecidos
      const uniqueProducts = new Set<string>();
      visits?.forEach(visit => {
        if (visit.productos_ofrecidos && Array.isArray(visit.productos_ofrecidos)) {
          visit.productos_ofrecidos.forEach(p => uniqueProducts.add(p));
        }
      });

      setStats({
        totalVisits,
        successRate,
        totalCompanies: companiesCount || 0,
        totalProducts: uniqueProducts.size
      });

      // Agrupar visitas por mes
      const monthlyMap = new Map<string, { visits: number; successful: number }>();
      
      let current = new Date(dateRange!.from!);
      const end = new Date(dateRange!.to!);
      
      while (current <= end) {
        const monthKey = format(current, 'yyyy-MM');
        monthlyMap.set(monthKey, { visits: 0, successful: 0 });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }

      visits?.forEach(visit => {
        const monthKey = format(new Date(visit.visit_date), 'yyyy-MM');
        if (monthlyMap.has(monthKey)) {
          const data = monthlyMap.get(monthKey)!;
          data.visits++;
          if (visit.result === 'Exitosa') {
            data.successful++;
          }
          monthlyMap.set(monthKey, data);
        }
      });

      const monthlyDataArray: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        visits: data.visits,
        successful: data.successful
      }));

      setMonthlyData(monthlyDataArray);

      // Últimas 10 visitas
      const recentVisitsData: RecentVisit[] = (visits?.slice(0, 10) || []).map(v => ({
        id: v.id,
        visit_date: v.visit_date,
        company_name: v.companies?.name || 'Desconocida',
        result: v.result || 'Sin resultado',
        notes: v.notes || ''
      }));

      setRecentVisits(recentVisitsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.title')}</CardTitle>
          <CardDescription>
            {t('gestor.dashboard.subtitle')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filtro de período */}
      <DateRangeFilter 
        dateRange={dateRange} 
        onDateRangeChange={setDateRange}
      />

      {/* KPIs Personales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.totalVisits')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">
              {t('gestor.dashboard.visitsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.successRate')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">{t('gestor.dashboard.successDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.companies')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">{t('gestor.dashboard.companiesDesc')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gestor.dashboard.products')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{t('gestor.dashboard.productsDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de evolución mensual */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.monthlyEvolution')}</CardTitle>
          <CardDescription>{t('gestor.dashboard.monthlyEvolutionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name={t('gestor.dashboard.totalVisits')}
                />
                <Line 
                  type="monotone" 
                  dataKey="successful" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name={t('gestor.dashboard.successfulVisits')}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              {t('director.noData')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de visitas recientes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('gestor.dashboard.recentVisits')}</CardTitle>
          <CardDescription>{t('gestor.dashboard.recentVisitsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('gestor.dashboard.date')}</TableHead>
                <TableHead>{t('gestor.dashboard.company')}</TableHead>
                <TableHead>{t('gestor.dashboard.result')}</TableHead>
                <TableHead>{t('gestor.dashboard.notes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentVisits.length > 0 ? (
                recentVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{format(new Date(visit.visit_date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{visit.company_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        visit.result === 'Exitosa' 
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {visit.result}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{visit.notes}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t('director.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}