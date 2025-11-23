import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle2, 
  BarChart3,
  Percent,
  Calendar,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KPIMetrics {
  visitsToday: number;
  visitsThisWeek: number;
  visitsThisMonth: number;
  conversionRate: number;
  avgVinculacion: number;
  successfulVisits: number;
  totalVisits: number;
}

interface MonthlyTarget {
  id: string;
  metric_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  description: string;
}

export const PersonalKPIsDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<KPIMetrics>({
    visitsToday: 0,
    visitsThisWeek: 0,
    visitsThisMonth: 0,
    conversionRate: 0,
    avgVinculacion: 0,
    successfulVisits: 0,
    totalVisits: 0,
  });
  const [targets, setTargets] = useState<MonthlyTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const todayStart = format(now, 'yyyy-MM-dd');

      // Fetch all visits for this month
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits' as any)
        .select('visit_date, result, porcentaje_vinculacion')
        .eq('gestor_id', user.id)
        .gte('visit_date', monthStart)
        .lte('visit_date', monthEnd);

      if (visitsError) throw visitsError;

      const visits = (visitsData as any) || [];

      // Calculate metrics
      const visitsThisMonth = visits.length;
      const visitsThisWeek = visits.filter((v: any) => 
        v.visit_date >= weekStart && v.visit_date <= weekEnd
      ).length;
      const visitsToday = visits.filter((v: any) => 
        v.visit_date.startsWith(todayStart)
      ).length;

      // Calculate conversion rate (visits with positive result or >50% vinculación)
      const successfulVisits = visits.filter((v: any) => 
        v.result === 'positivo' || 
        v.result === 'contrato' || 
        (v.porcentaje_vinculacion && v.porcentaje_vinculacion > 50)
      ).length;

      const conversionRate = visitsThisMonth > 0 
        ? (successfulVisits / visitsThisMonth) * 100 
        : 0;

      // Calculate average vinculación
      const visitsWithVinculacion = visits.filter((v: any) => v.porcentaje_vinculacion !== null);
      const avgVinculacion = visitsWithVinculacion.length > 0
        ? visitsWithVinculacion.reduce((sum: number, v: any) => sum + (v.porcentaje_vinculacion || 0), 0) / visitsWithVinculacion.length
        : 0;

      setMetrics({
        visitsToday,
        visitsThisWeek,
        visitsThisMonth,
        conversionRate,
        avgVinculacion,
        successfulVisits,
        totalVisits: visitsThisMonth,
      });

      // Fetch monthly targets
      const { data: targetsData, error: targetsError } = await supabase
        .from('goals' as any)
        .select('*')
        .gte('period_end', now.toISOString())
        .lte('period_start', now.toISOString())
        .eq('period_type', 'monthly');

      if (targetsError) throw targetsError;

      setTargets((targetsData as any) || []);
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      toast.error('Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  const getTargetProgress = (targetType: string): { current: number; target: number; percentage: number } => {
    const target = targets.find(t => t.metric_type === targetType);
    if (!target) return { current: 0, target: 0, percentage: 0 };

    let current = 0;
    switch (targetType) {
      case 'visits':
        current = metrics.visitsThisMonth;
        break;
      case 'conversion_rate':
        current = metrics.conversionRate;
        break;
      case 'vinculacion':
        current = metrics.avgVinculacion;
        break;
      default:
        current = 0;
    }

    const percentage = target.target_value > 0 
      ? (current / target.target_value) * 100 
      : 0;

    return {
      current,
      target: target.target_value,
      percentage: Math.min(percentage, 100),
    };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KPIs Personales</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const visitsTarget = getTargetProgress('visits');
  const conversionTarget = getTargetProgress('conversion_rate');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            KPIs Personales - {format(new Date(), 'MMMM yyyy', { locale: es })}
          </CardTitle>
          <CardDescription>
            Seguimiento de tu rendimiento comercial
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Visits Today */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Visitas Hoy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.visitsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.visitsThisWeek} esta semana
            </p>
          </CardContent>
        </Card>

        {/* Visits This Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Visitas del Mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.visitsThisMonth}</div>
            <div className="flex items-center gap-2 mt-1">
              {visitsTarget.percentage >= 100 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-yellow-500" />
              )}
              <p className="text-xs text-muted-foreground">
                {visitsTarget.target > 0 ? `Meta: ${visitsTarget.target}` : 'Sin meta'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Tasa de Conversión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.successfulVisits} de {metrics.totalVisits} exitosas
            </p>
          </CardContent>
        </Card>

        {/* Average Vinculación */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Vinculación Media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.avgVinculacion.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio del mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Targets Progress */}
      {targets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos del Mes
            </CardTitle>
            <CardDescription>
              Progreso hacia tus metas mensuales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visits Target */}
            {visitsTarget.target > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Visitas Realizadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{visitsTarget.current}</span>
                    <span className="text-muted-foreground">/ {visitsTarget.target}</span>
                    <Badge 
                      variant={visitsTarget.percentage >= 100 ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {visitsTarget.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={visitsTarget.percentage} 
                  className="h-2"
                />
              </div>
            )}

            {/* Conversion Target */}
            {conversionTarget.target > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Tasa de Conversión</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {conversionTarget.current.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">/ {conversionTarget.target}%</span>
                    <Badge 
                      variant={conversionTarget.percentage >= 100 ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {conversionTarget.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={conversionTarget.percentage} 
                  className="h-2"
                />
              </div>
            )}

            {targets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay objetivos configurados para este mes</p>
                <p className="text-sm mt-1">
                  Los administradores pueden configurar objetivos en la pestaña de Objetivos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Rendimiento</CardTitle>
          <CardDescription>Indicadores clave del mes actual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                metrics.conversionRate >= 60 ? 'bg-green-500/20' : 
                metrics.conversionRate >= 40 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              }`}>
                <CheckCircle2 className={`h-6 w-6 ${
                  metrics.conversionRate >= 60 ? 'text-green-500' : 
                  metrics.conversionRate >= 40 ? 'text-yellow-500' : 'text-red-500'
                }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efectividad</p>
                <p className="text-2xl font-bold">
                  {metrics.conversionRate >= 60 ? 'Excelente' : 
                   metrics.conversionRate >= 40 ? 'Buena' : 'Mejorar'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actividad</p>
                <p className="text-2xl font-bold">
                  {metrics.visitsThisMonth >= 20 ? 'Alta' : 
                   metrics.visitsThisMonth >= 10 ? 'Media' : 'Baja'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-accent/50">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                metrics.avgVinculacion >= 60 ? 'bg-green-500/20' : 
                metrics.avgVinculacion >= 40 ? 'bg-yellow-500/20' : 'bg-red-500/20'
              }`}>
                <Target className={`h-6 w-6 ${
                  metrics.avgVinculacion >= 60 ? 'text-green-500' : 
                  metrics.avgVinculacion >= 40 ? 'text-yellow-500' : 'text-red-500'
                }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vinculación</p>
                <p className="text-2xl font-bold">
                  {metrics.avgVinculacion >= 60 ? 'Alta' : 
                   metrics.avgVinculacion >= 40 ? 'Media' : 'Baja'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
