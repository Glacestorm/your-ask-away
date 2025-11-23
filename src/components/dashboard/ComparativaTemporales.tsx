import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Target, Users, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { subMonths, subYears, format, differenceInDays } from 'date-fns';

interface ComparativaTemporalesProps {
  startDate?: string;
  endDate?: string;
}

export function ComparativaTemporales({ startDate, endDate }: ComparativaTemporalesProps) {
  const [loading, setLoading] = useState(true);
  const [comparativeData, setComparativeData] = useState<any>({
    current: {},
    previous: {},
    yearAgo: {},
    trends: {},
    monthlyComparison: [],
    yearlyComparison: [],
  });

  useEffect(() => {
    fetchComparativeData();
  }, [startDate, endDate]);

  const fetchComparativeData = async () => {
    try {
      setLoading(true);

      // Calcular fechas de los períodos
      const currentStart = startDate ? new Date(startDate) : subMonths(new Date(), 1);
      const currentEnd = endDate ? new Date(endDate) : new Date();
      
      const periodDays = differenceInDays(currentEnd, currentStart);
      const previousStart = new Date(currentStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousEnd = currentStart;
      
      const yearAgoStart = subYears(currentStart, 1);
      const yearAgoEnd = subYears(currentEnd, 1);

      // Datos del período actual
      const currentData = await fetchPeriodData(
        currentStart.toISOString().split('T')[0],
        currentEnd.toISOString().split('T')[0]
      );

      // Datos del período anterior
      const previousData = await fetchPeriodData(
        previousStart.toISOString().split('T')[0],
        previousEnd.toISOString().split('T')[0]
      );

      // Datos del año anterior
      const yearAgoData = await fetchPeriodData(
        yearAgoStart.toISOString().split('T')[0],
        yearAgoEnd.toISOString().split('T')[0]
      );

      // Calcular tendencias
      const trends = {
        visitasMoM: calculateChange(currentData.visitas, previousData.visitas),
        visitasYoY: calculateChange(currentData.visitas, yearAgoData.visitas),
        vinculacionMoM: calculateChange(currentData.vinculacion, previousData.vinculacion),
        vinculacionYoY: calculateChange(currentData.vinculacion, yearAgoData.vinculacion),
        tasaExitoMoM: calculateChange(currentData.tasaExito, previousData.tasaExito),
        tasaExitoYoY: calculateChange(currentData.tasaExito, yearAgoData.tasaExito),
        productosOfrecidosMoM: calculateChange(currentData.productosOfrecidos, previousData.productosOfrecidos),
        productosOfrecidosYoY: calculateChange(currentData.productosOfrecidos, yearAgoData.productosOfrecidos),
      };

      // Comparación mensual de los últimos 12 meses
      const monthlyComparison = await fetchMonthlyComparison();

      // Comparación año a año de los últimos 3 años
      const yearlyComparison = await fetchYearlyComparison();

      setComparativeData({
        current: currentData,
        previous: previousData,
        yearAgo: yearAgoData,
        trends,
        monthlyComparison,
        yearlyComparison,
      });

    } catch (error: any) {
      console.error('Error fetching comparative data:', error);
      toast.error('Error al cargar datos comparativos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodData = async (start: string, end: string) => {
    try {
      // Visitas
      const { data: visits } = await supabase
        .from('visits')
        .select('*, porcentaje_vinculacion, result, productos_ofrecidos')
        .gte('visit_date', start)
        .lte('visit_date', end);

      const numVisitas = visits?.length || 0;
      
      // Vinculación promedio
      const visitasConVinculacion = visits?.filter(v => v.porcentaje_vinculacion != null) || [];
      const vinculacion = visitasConVinculacion.length > 0
        ? visitasConVinculacion.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0) / visitasConVinculacion.length
        : 0;

      // Tasa de éxito
      const visitasExitosas = visits?.filter(v => v.result === 'Exitosa').length || 0;
      const tasaExito = numVisitas > 0 ? (visitasExitosas / numVisitas) * 100 : 0;

      // Productos ofrecidos únicos
      const productosSet = new Set<string>();
      visits?.forEach(v => {
        v.productos_ofrecidos?.forEach((p: string) => productosSet.add(p));
      });

      return {
        visitas: numVisitas,
        vinculacion: Math.round(vinculacion * 10) / 10,
        tasaExito: Math.round(tasaExito * 10) / 10,
        productosOfrecidos: productosSet.size,
        visitasExitosas,
      };
    } catch (error) {
      console.error('Error fetching period data:', error);
      return {
        visitas: 0,
        vinculacion: 0,
        tasaExito: 0,
        productosOfrecidos: 0,
        visitasExitosas: 0,
      };
    }
  };

  const fetchMonthlyComparison = async () => {
    try {
      const now = new Date();
      const twelveMonthsAgo = subMonths(now, 12);

      const { data: visits } = await supabase
        .from('visits')
        .select('visit_date, porcentaje_vinculacion, result')
        .gte('visit_date', twelveMonthsAgo.toISOString().split('T')[0])
        .order('visit_date');

      const monthlyMap: any = {};
      
      visits?.forEach((visit: any) => {
        const date = new Date(visit.visit_date);
        const monthKey = format(date, 'MMM yy');
        const monthNumKey = format(date, 'yyyy-MM');
        
        if (!monthlyMap[monthNumKey]) {
          monthlyMap[monthNumKey] = {
            mes: monthKey,
            sortKey: monthNumKey,
            visitas: 0,
            exitosas: 0,
            vinculacionSum: 0,
            vinculacionCount: 0,
          };
        }
        
        monthlyMap[monthNumKey].visitas++;
        if (visit.result === 'Exitosa') monthlyMap[monthNumKey].exitosas++;
        if (visit.porcentaje_vinculacion != null) {
          monthlyMap[monthNumKey].vinculacionSum += visit.porcentaje_vinculacion;
          monthlyMap[monthNumKey].vinculacionCount++;
        }
      });

      return Object.values(monthlyMap)
        .sort((a: any, b: any) => a.sortKey.localeCompare(b.sortKey))
        .map((m: any) => ({
          mes: m.mes,
          visitas: m.visitas,
          tasaExito: m.visitas > 0 ? Math.round((m.exitosas / m.visitas) * 100) : 0,
          vinculacion: m.vinculacionCount > 0 
            ? Math.round((m.vinculacionSum / m.vinculacionCount) * 10) / 10 
            : 0,
        }));
    } catch (error) {
      console.error('Error fetching monthly comparison:', error);
      return [];
    }
  };

  const fetchYearlyComparison = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 2, currentYear - 1, currentYear];
      
      const yearlyData = await Promise.all(
        years.map(async (year) => {
          const { data: visits } = await supabase
            .from('visits')
            .select('result, porcentaje_vinculacion')
            .gte('visit_date', `${year}-01-01`)
            .lte('visit_date', `${year}-12-31`);

          const numVisitas = visits?.length || 0;
          const exitosas = visits?.filter(v => v.result === 'Exitosa').length || 0;
          const tasaExito = numVisitas > 0 ? Math.round((exitosas / numVisitas) * 100) : 0;
          
          const visitasConVinc = visits?.filter(v => v.porcentaje_vinculacion != null) || [];
          const vinculacion = visitasConVinc.length > 0
            ? Math.round((visitasConVinc.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0) / visitasConVinc.length) * 10) / 10
            : 0;

          return {
            año: year.toString(),
            visitas: numVisitas,
            tasaExito,
            vinculacion,
          };
        })
      );

      return yearlyData;
    } catch (error) {
      console.error('Error fetching yearly comparison:', error);
      return [];
    }
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-500';
    if (value < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { current, previous, yearAgo, trends, monthlyComparison, yearlyComparison } = comparativeData;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Análisis Comparativo</h2>
        <p className="text-muted-foreground">
          Comparación de períodos: mes a mes (MoM) y año a año (YoY)
        </p>
      </div>

      {/* KPIs Comparativos - Mes a Mes */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Comparativa Mes a Mes (MoM)
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Visitas MoM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Visitas Realizadas
                {getTrendIcon(trends.visitasMoM)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.visitas}</span>
                  <span className="text-xs text-muted-foreground">actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.visitasMoM)}`}>
                    {trends.visitasMoM > 0 ? '+' : ''}{trends.visitasMoM}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {previous.visitas} anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vinculación MoM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Vinculación Promedio
                {getTrendIcon(trends.vinculacionMoM)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.vinculacion}%</span>
                  <span className="text-xs text-muted-foreground">actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.vinculacionMoM)}`}>
                    {trends.vinculacionMoM > 0 ? '+' : ''}{trends.vinculacionMoM}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {previous.vinculacion}% anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasa Éxito MoM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Tasa de Éxito
                {getTrendIcon(trends.tasaExitoMoM)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.tasaExito}%</span>
                  <span className="text-xs text-muted-foreground">actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.tasaExitoMoM)}`}>
                    {trends.tasaExitoMoM > 0 ? '+' : ''}{trends.tasaExitoMoM}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {previous.tasaExito}% anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos MoM */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Productos Ofrecidos
                {getTrendIcon(trends.productosOfrecidosMoM)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.productosOfrecidos}</span>
                  <span className="text-xs text-muted-foreground">actual</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.productosOfrecidosMoM)}`}>
                    {trends.productosOfrecidosMoM > 0 ? '+' : ''}{trends.productosOfrecidosMoM}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {previous.productosOfrecidos} anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KPIs Comparativos - Año a Año */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Comparativa Año a Año (YoY)
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Visitas YoY */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Visitas Realizadas
                {getTrendIcon(trends.visitasYoY)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.visitas}</span>
                  <span className="text-xs text-muted-foreground">este año</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.visitasYoY)}`}>
                    {trends.visitasYoY > 0 ? '+' : ''}{trends.visitasYoY}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {yearAgo.visitas} año anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vinculación YoY */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Vinculación Promedio
                {getTrendIcon(trends.vinculacionYoY)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.vinculacion}%</span>
                  <span className="text-xs text-muted-foreground">este año</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.vinculacionYoY)}`}>
                    {trends.vinculacionYoY > 0 ? '+' : ''}{trends.vinculacionYoY}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {yearAgo.vinculacion}% año anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasa Éxito YoY */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Tasa de Éxito
                {getTrendIcon(trends.tasaExitoYoY)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.tasaExito}%</span>
                  <span className="text-xs text-muted-foreground">este año</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.tasaExitoYoY)}`}>
                    {trends.tasaExitoYoY > 0 ? '+' : ''}{trends.tasaExitoYoY}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {yearAgo.tasaExito}% año anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos YoY */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Productos Ofrecidos
                {getTrendIcon(trends.productosOfrecidosYoY)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{current.productosOfrecidos}</span>
                  <span className="text-xs text-muted-foreground">este año</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${getTrendColor(trends.productosOfrecidosYoY)}`}>
                    {trends.productosOfrecidosYoY > 0 ? '+' : ''}{trends.productosOfrecidosYoY}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs {yearAgo.productosOfrecidos} año anterior
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos de Tendencia */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Evolución Mensual */}
        {monthlyComparison.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolución Mensual (Últimos 12 meses)</CardTitle>
              <CardDescription>Tendencia de visitas y tasa de éxito</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="visitas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Visitas"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tasaExito" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="% Éxito"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Comparación Anual */}
        {yearlyComparison.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Comparación Anual</CardTitle>
              <CardDescription>Evolución de métricas por año</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="año" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" name="Visitas" />
                  <Bar dataKey="tasaExito" fill="hsl(var(--chart-2))" name="% Éxito" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
