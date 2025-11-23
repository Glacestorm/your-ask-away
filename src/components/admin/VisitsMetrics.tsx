import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function VisitsMetrics() {
  const [loading, setLoading] = useState(true);
  const [monthlyVisits, setMonthlyVisits] = useState<any[]>([]);
  const [visitTrend, setVisitTrend] = useState<any[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [avgVisitsPerMonth, setAvgVisitsPerMonth] = useState(0);

  useEffect(() => {
    fetchVisitsData();
  }, []);

  const fetchVisitsData = async () => {
    try {
      setLoading(true);

      // Visitas de los últimos 12 meses
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const { data: visitsData, error } = await supabase
        .from('visits')
        .select('visit_date')
        .gte('visit_date', twelveMonthsAgo.toISOString().split('T')[0])
        .order('visit_date');

      if (error) throw error;

      // Agrupar por mes
      const monthlyMap: any = {};
      visitsData?.forEach((visit: any) => {
        const date = new Date(visit.visit_date);
        const monthKey = `${date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}`;
        const monthNumKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[monthNumKey]) {
          monthlyMap[monthNumKey] = { 
            mes: monthKey, 
            visitas: 0,
            sortKey: monthNumKey 
          };
        }
        monthlyMap[monthNumKey].visitas++;
      });

      const sortedMonthly: any[] = Object.values(monthlyMap)
        .filter((m: any) => !isNaN(m.visitas) && isFinite(m.visitas))
        .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));

      setMonthlyVisits(sortedMonthly);
      setVisitTrend(sortedMonthly);
      setTotalVisits(visitsData?.length || 0);
      
      const totalVisitsCount: number = sortedMonthly.reduce((sum, m) => sum + (m.visitas || 0), 0);
      const avg = sortedMonthly.length > 0 ? totalVisitsCount / sortedMonthly.length : 0;
      setAvgVisitsPerMonth(Math.round(avg * 10) / 10);

    } catch (error: any) {
      console.error('Error fetching visits data:', error);
      toast.error('Error al cargar datos de visitas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs de Visitas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitas (12 meses)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits}</div>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Mensual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgVisitsPerMonth}</div>
            <p className="text-xs text-muted-foreground">Visitas por mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyVisits.length > 0 ? monthlyVisits[monthlyVisits.length - 1].visitas : 0}
            </div>
            <p className="text-xs text-muted-foreground">Visitas realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Visitas por Mes - Barras */}
        <Card>
          <CardHeader>
            <CardTitle>Visitas por Mes</CardTitle>
            <CardDescription>Distribución de visitas en los últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={monthlyVisits.filter(m => 
                  !isNaN(m.visitas) && isFinite(m.visitas)
                )}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="visitas" fill="hsl(var(--primary))" name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendencia de Visitas - Línea */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Visitas</CardTitle>
            <CardDescription>Evolución temporal de las visitas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart 
                data={visitTrend.filter(t => 
                  !isNaN(t.visitas) && isFinite(t.visitas)
                )}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visitas" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Visitas"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
