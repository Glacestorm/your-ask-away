import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Building2, Package, Target, Calendar, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ResumenEjecutivoProps {
  startDate?: string;
  endDate?: string;
}

export function ResumenEjecutivo({ startDate, endDate }: ResumenEjecutivoProps) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalCompanies: 0,
    visitasActuales: 0,
    visitasPrevias: 0,
    visitasTrend: 0,
    vinculacionPromedio: 0,
    vinculacionTrend: 0,
    productosOfrecidos: 0,
    tasaExito: 0,
    exitoTrend: 0,
    gestoresActivos: 0,
    empresasConVisitas: 0,
    promedioVisitasPorEmpresa: 0,
  });

  useEffect(() => {
    fetchKPIs();
  }, [startDate, endDate]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);

      // Total empresas
      const { count: totalCompanies } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true });

      // Visitas en periodo actual
      let visitasQuery = supabase
        .from('visits')
        .select('*, productos_ofrecidos, porcentaje_vinculacion, result');
      
      if (startDate) visitasQuery = visitasQuery.gte('visit_date', startDate);
      if (endDate) visitasQuery = visitasQuery.lte('visit_date', endDate);

      const { data: visitasActuales, error: visitasError } = await visitasQuery;
      if (visitasError) throw visitasError;

      // Calcular periodo previo para comparación
      const periodoDias = startDate && endDate 
        ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      const fechaInicioPrevio = startDate 
        ? new Date(new Date(startDate).getTime() - periodoDias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;
      const fechaFinPrevio = startDate || null;

      let visitasPrevQuery = supabase
        .from('visits')
        .select('result');
      
      if (fechaInicioPrevio) visitasPrevQuery = visitasPrevQuery.gte('visit_date', fechaInicioPrevio);
      if (fechaFinPrevio) visitasPrevQuery = visitasPrevQuery.lt('visit_date', fechaFinPrevio);

      const { data: visitasPrevias } = await visitasPrevQuery;

      // Cálculos de métricas
      const numVisitasActuales = visitasActuales?.length || 0;
      const numVisitasPrevias = visitasPrevias?.length || 0;
      const visitasTrend = numVisitasPrevias > 0 
        ? ((numVisitasActuales - numVisitasPrevias) / numVisitasPrevias) * 100 
        : 0;

      // Vinculación promedio
      const visitasConVinculacion = visitasActuales?.filter(v => v.porcentaje_vinculacion != null) || [];
      const vinculacionPromedio = visitasConVinculacion.length > 0
        ? visitasConVinculacion.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0) / visitasConVinculacion.length
        : 0;

      // Productos ofrecidos únicos
      const productosOfrecidosSet = new Set<string>();
      visitasActuales?.forEach(v => {
        v.productos_ofrecidos?.forEach((p: string) => productosOfrecidosSet.add(p));
      });

      // Tasa de éxito
      const visitasExitosas = visitasActuales?.filter(v => v.result === 'Exitosa').length || 0;
      const tasaExito = numVisitasActuales > 0 ? (visitasExitosas / numVisitasActuales) * 100 : 0;

      const visitasExitosasPrevias = visitasPrevias?.filter(v => v.result === 'Exitosa').length || 0;
      const tasaExitoPrevio = numVisitasPrevias > 0 ? (visitasExitosasPrevias / numVisitasPrevias) * 100 : 0;
      const exitoTrend = tasaExitoPrevio > 0 ? ((tasaExito - tasaExitoPrevio) / tasaExitoPrevio) * 100 : 0;

      // Gestores activos
      const gestoresActivos = new Set(visitasActuales?.map(v => v.gestor_id)).size;

      // Empresas con visitas
      const empresasConVisitas = new Set(visitasActuales?.map(v => v.company_id)).size;
      const promedioVisitasPorEmpresa = empresasConVisitas > 0 ? numVisitasActuales / empresasConVisitas : 0;

      setKpis({
        totalCompanies: totalCompanies || 0,
        visitasActuales: numVisitasActuales,
        visitasPrevias: numVisitasPrevias,
        visitasTrend: Math.round(visitasTrend * 10) / 10,
        vinculacionPromedio: Math.round(vinculacionPromedio * 10) / 10,
        vinculacionTrend: 0, // Requeriría cálculo del periodo previo
        productosOfrecidos: productosOfrecidosSet.size,
        tasaExito: Math.round(tasaExito * 10) / 10,
        exitoTrend: Math.round(exitoTrend * 10) / 10,
        gestoresActivos,
        empresasConVisitas,
        promedioVisitasPorEmpresa: Math.round(promedioVisitasPorEmpresa * 10) / 10,
      });

    } catch (error: any) {
      console.error('Error fetching KPIs:', error);
      toast.error('Error al cargar KPIs del resumen ejecutivo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-500';
    if (trend < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Resumen Ejecutivo</h2>
        <p className="text-muted-foreground">Vista general de indicadores clave de rendimiento</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Empresas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">En cartera</p>
          </CardContent>
        </Card>

        {/* Visitas Realizadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas Realizadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.visitasActuales}</div>
            <div className="flex items-center gap-1">
              {getTrendIcon(kpis.visitasTrend)}
              <p className={`text-xs ${getTrendColor(kpis.visitasTrend)}`}>
                {kpis.visitasTrend > 0 ? '+' : ''}{kpis.visitasTrend}% vs periodo anterior
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tasa de Éxito */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tasaExito}%</div>
            <div className="flex items-center gap-1">
              {getTrendIcon(kpis.exitoTrend)}
              <p className={`text-xs ${getTrendColor(kpis.exitoTrend)}`}>
                {kpis.exitoTrend > 0 ? '+' : ''}{kpis.exitoTrend}% vs periodo anterior
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Vinculación Promedio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vinculación Promedio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.vinculacionPromedio}%</div>
            <p className="text-xs text-muted-foreground">Media de vinculación</p>
          </CardContent>
        </Card>

        {/* Gestores Activos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.gestoresActivos}</div>
            <p className="text-xs text-muted-foreground">Con visitas en periodo</p>
          </CardContent>
        </Card>

        {/* Empresas Visitadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Visitadas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.empresasConVisitas}</div>
            <p className="text-xs text-muted-foreground">
              {((kpis.empresasConVisitas / (kpis.totalCompanies || 1)) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        {/* Productos Ofrecidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Ofrecidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.productosOfrecidos}</div>
            <p className="text-xs text-muted-foreground">Productos únicos</p>
          </CardContent>
        </Card>

        {/* Promedio Visitas por Empresa */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas / Empresa</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.promedioVisitasPorEmpresa}</div>
            <p className="text-xs text-muted-foreground">Promedio en periodo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
