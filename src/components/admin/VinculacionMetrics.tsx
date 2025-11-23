import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Target, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function VinculacionMetrics() {
  const [loading, setLoading] = useState(true);
  const [avgVinculacion, setAvgVinculacion] = useState(0);
  const [vinculacionTrend, setVinculacionTrend] = useState<any[]>([]);
  const [topGestoresVinculacion, setTopGestoresVinculacion] = useState<any[]>([]);
  const [vinculacionDistribution, setVinculacionDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchVinculacionData();
  }, []);

  const fetchVinculacionData = async () => {
    try {
      setLoading(true);

      // Visitas con porcentaje de vinculación
      const { data: visits } = await supabase
        .from('visits')
        .select('visit_date, porcentaje_vinculacion, gestor_id, profiles(full_name, email)')
        .not('porcentaje_vinculacion', 'is', null)
        .order('visit_date');

      if (!visits || visits.length === 0) {
        setLoading(false);
        return;
      }

      // Promedio global de vinculación
      const totalVinculacion: number = visits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0);
      const avg = visits.length > 0 ? totalVinculacion / visits.length : 0;
      setAvgVinculacion(Math.round(avg * 10) / 10);

      // Evolución de vinculación por mes
      const monthlyMap: any = {};
      visits.forEach((visit: any) => {
        const date = new Date(visit.visit_date);
        const monthKey = `${date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}`;
        const monthNumKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyMap[monthNumKey]) {
          monthlyMap[monthNumKey] = { 
            mes: monthKey,
            sortKey: monthNumKey,
            suma: 0,
            count: 0,
            promedio: 0
          };
        }
        monthlyMap[monthNumKey].suma += visit.porcentaje_vinculacion || 0;
        monthlyMap[monthNumKey].count++;
      });

      // Calcular promedios mensuales
      Object.values(monthlyMap).forEach((m: any) => {
        m.promedio = m.count > 0 ? Math.round((m.suma / m.count) * 10) / 10 : 0;
      });

      const sortedTrend = Object.values(monthlyMap)
        .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey));
      setVinculacionTrend(sortedTrend);

      // Promedio de vinculación por gestor (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentVisits = visits.filter((v: any) => 
        new Date(v.visit_date) >= sixMonthsAgo
      );

      const gestorMap: any = {};
      recentVisits.forEach((visit: any) => {
        const gestorName = visit.profiles?.full_name || visit.profiles?.email || 'Sin asignar';
        if (!gestorMap[gestorName]) {
          gestorMap[gestorName] = {
            gestor: gestorName,
            suma: 0,
            count: 0,
            promedio: 0
          };
        }
        gestorMap[gestorName].suma += visit.porcentaje_vinculacion || 0;
        gestorMap[gestorName].count++;
      });

      Object.values(gestorMap).forEach((g: any) => {
        g.promedio = g.count > 0 ? Math.round((g.suma / g.count) * 10) / 10 : 0;
      });

      const sortedGestores = Object.values(gestorMap)
        .filter((g: any) => g.count >= 3) // Mínimo 3 visitas con vinculación
        .sort((a: any, b: any) => b.promedio - a.promedio)
        .slice(0, 10);
      setTopGestoresVinculacion(sortedGestores);

      // Distribución de rangos de vinculación
      const ranges = [
        { rango: '0-20%', min: 0, max: 20, count: 0 },
        { rango: '21-40%', min: 21, max: 40, count: 0 },
        { rango: '41-60%', min: 41, max: 60, count: 0 },
        { rango: '61-80%', min: 61, max: 80, count: 0 },
        { rango: '81-100%', min: 81, max: 100, count: 0 },
      ];

      visits.forEach((visit: any) => {
        const vinc = visit.porcentaje_vinculacion || 0;
        ranges.forEach((range) => {
          if (vinc >= range.min && vinc <= range.max) {
            range.count++;
          }
        });
      });

      setVinculacionDistribution(ranges);

    } catch (error: any) {
      console.error('Error fetching vinculacion data:', error);
      toast.error('Error al cargar datos de vinculación');
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
      </div>
    );
  }

  if (vinculacionTrend.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Vinculación</CardTitle>
          <CardDescription>No hay datos de vinculación disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Registra visitas con porcentajes de vinculación para ver las estadísticas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vinculación Promedio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgVinculacion}%</div>
            <p className="text-xs text-muted-foreground">Media global</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendencia Actual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vinculacionTrend.length > 0 
                ? `${vinculacionTrend[vinculacionTrend.length - 1].promedio}%` 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Último mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mejor Gestor</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {topGestoresVinculacion.length > 0 
                ? topGestoresVinculacion[0].gestor 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topGestoresVinculacion.length > 0 
                ? `${topGestoresVinculacion[0].promedio}% promedio` 
                : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Evolución Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Vinculación</CardTitle>
            <CardDescription>Promedio mensual de vinculación conseguida</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={vinculacionTrend}>
                <defs>
                  <linearGradient id="colorVinculacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="promedio"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorVinculacion)"
                  name="% Vinculación"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Rangos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Rangos</CardTitle>
            <CardDescription>Número de visitas por rango de vinculación</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vinculacionDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rango" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Gestores por Vinculación */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Promedio de Vinculación por Gestor</CardTitle>
            <CardDescription>Gestores con mayor porcentaje promedio (últimos 6 meses, mín. 3 visitas)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topGestoresVinculacion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="gestor" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'promedio') return [`${value}%`, '% Vinculación'];
                    return [value, name];
                  }} 
                />
                <Legend />
                <Bar dataKey="promedio" fill="hsl(var(--chart-2))" name="% Vinculación" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
