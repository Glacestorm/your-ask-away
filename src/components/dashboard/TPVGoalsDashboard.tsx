import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Target, TrendingUp, CreditCard, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { TPVGoalsComparison } from './TPVGoalsComparison';
import { TPVGoalsHistory } from './TPVGoalsHistory';

interface TPVGoal {
  id: string;
  metric_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  description: string | null;
}

interface TPVMetrics {
  totalRevenue: number;
  averageAffiliation: number;
  averageCommission: number;
  activeTerminals: number;
}

export function TPVGoalsDashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<TPVGoal[]>([]);
  const [metrics, setMetrics] = useState<TPVMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.email?.includes('admin');

  useEffect(() => {
    fetchGoalsAndMetrics();
  }, [user]);

  const fetchGoalsAndMetrics = async () => {
    try {
      setLoading(true);

      // Fetch TPV goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .in('metric_type', ['tpv_revenue', 'tpv_affiliation', 'tpv_commission'])
        .gte('period_end', new Date().toISOString())
        .order('period_start', { ascending: false });

      if (goalsError) throw goalsError;

      // Fetch current TPV metrics
      let terminalsQuery = supabase
        .from('company_tpv_terminals' as any)
        .select('annual_revenue, affiliation_percentage, active, company_id, id');

      // If not admin, filter by gestor's companies
      if (!isAdmin && user?.id) {
        const { data: gestorCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', user.id);

        const companyIds = gestorCompanies?.map(c => c.id) || [];
        if (companyIds.length > 0) {
          terminalsQuery = terminalsQuery.in('company_id', companyIds);
        } else {
          // No companies for this gestor
          setMetrics({
            totalRevenue: 0,
            averageAffiliation: 0,
            averageCommission: 0,
            activeTerminals: 0,
          });
          setGoals(goalsData || []);
          setLoading(false);
          return;
        }
      }

      const { data: terminals, error: terminalsError } = await terminalsQuery;

      if (terminalsError) throw terminalsError;

      // Fetch commission rates
      const terminalIds = terminals?.map((t: any) => t.id) || [];
      const { data: commissions, error: commissionsError } = await supabase
        .from('tpv_commission_rates' as any)
        .select('*')
        .in('terminal_id', terminalIds);

      if (commissionsError) throw commissionsError;

      // Calculate metrics
      const activeTerminals = terminals?.filter((t: any) => t.active) || [];
      const totalRevenue = terminals?.reduce((sum: number, t: any) => sum + (t.annual_revenue || 0), 0) || 0;
      const averageAffiliation = activeTerminals.length > 0
        ? activeTerminals.reduce((sum: number, t: any) => sum + (t.affiliation_percentage || 0), 0) / activeTerminals.length
        : 0;

      // Calculate average commission (nacional)
      const nationalCommissions = commissions?.filter((c: any) => c.card_type === 'NACIONAL') || [];
      const averageCommission = nationalCommissions.length > 0
        ? nationalCommissions.reduce((sum: number, c: any) => sum + c.commission_rate, 0) / nationalCommissions.length
        : 0;

      setMetrics({
        totalRevenue,
        averageAffiliation,
        averageCommission,
        activeTerminals: activeTerminals.length,
      });

      setGoals(goalsData || []);
    } catch (error: any) {
      console.error('Error fetching TPV goals:', error);
      toast.error('Error al cargar objetivos de TPV');
    } finally {
      setLoading(false);
    }
  };

  const getGoalProgress = (metricType: string, currentValue: number, targetValue: number) => {
    if (metricType === 'tpv_commission') {
      // For commission, lower is better, so invert the calculation
      const progress = Math.max(0, Math.min(100, ((targetValue - currentValue) / targetValue) * 100 + 100));
      return progress;
    }
    return Math.min(100, (currentValue / targetValue) * 100);
  };

  const getGoalStatus = (progress: number) => {
    if (progress >= 100) return { variant: 'default' as const, label: 'Completado' };
    if (progress >= 75) return { variant: 'default' as const, label: 'En progreso' };
    if (progress >= 50) return { variant: 'secondary' as const, label: 'En seguimiento' };
    return { variant: 'secondary' as const, label: 'Requiere atención' };
  };

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'tpv_revenue':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case 'tpv_affiliation':
        return <Percent className="h-5 w-5 text-primary" />;
      case 'tpv_commission':
        return <CreditCard className="h-5 w-5 text-primary" />;
      default:
        return <Target className="h-5 w-5 text-primary" />;
    }
  };

  const getMetricLabel = (metricType: string) => {
    switch (metricType) {
      case 'tpv_revenue':
        return 'Facturación TPV';
      case 'tpv_affiliation':
        return 'Vinculación TPV';
      case 'tpv_commission':
        return 'Comisión Tarjetas';
      default:
        return metricType;
    }
  };

  const getCurrentValue = (metricType: string) => {
    if (!metrics) return 0;
    switch (metricType) {
      case 'tpv_revenue':
        return metrics.totalRevenue;
      case 'tpv_affiliation':
        return metrics.averageAffiliation;
      case 'tpv_commission':
        return metrics.averageCommission;
      default:
        return 0;
    }
  };

  const formatValue = (metricType: string, value: number) => {
    switch (metricType) {
      case 'tpv_revenue':
        return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
      case 'tpv_affiliation':
      case 'tpv_commission':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString('es-ES');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="goals" className="space-y-6">
      <TabsList>
        <TabsTrigger value="goals">Mis Objetivos</TabsTrigger>
        <TabsTrigger value="comparison">Comparación</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="goals" className="space-y-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Facturación Total TPV</CardDescription>
            <CardTitle className="text-2xl">
              {formatValue('tpv_revenue', metrics?.totalRevenue || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vinculación Media</CardDescription>
            <CardTitle className="text-2xl">
              {formatValue('tpv_affiliation', metrics?.averageAffiliation || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Comisión Media</CardDescription>
            <CardTitle className="text-2xl">
              {formatValue('tpv_commission', metrics?.averageCommission || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Terminales Activos</CardDescription>
            <CardTitle className="text-3xl">{metrics?.activeTerminals || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivos de TPV
          </CardTitle>
          <CardDescription>
            Seguimiento de metas de facturación, vinculación y comisiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay objetivos de TPV configurados para el período actual
            </div>
          ) : (
            <div className="space-y-6">
              {goals.map((goal) => {
                const currentValue = getCurrentValue(goal.metric_type);
                const progress = getGoalProgress(goal.metric_type, currentValue, goal.target_value);
                const status = getGoalStatus(progress);

                return (
                  <div key={goal.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getMetricIcon(goal.metric_type)}
                        <div>
                          <div className="font-semibold">{getMetricLabel(goal.metric_type)}</div>
                          <div className="text-sm text-muted-foreground">
                            {goal.description || `Objetivo: ${formatValue(goal.metric_type, goal.target_value)}`}
                          </div>
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-mono font-semibold">
                          {formatValue(goal.metric_type, currentValue)} / {formatValue(goal.metric_type, goal.target_value)}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(goal.period_start).toLocaleDateString('es-ES')} - {new Date(goal.period_end).toLocaleDateString('es-ES')}
                        </span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="comparison">
        <TPVGoalsComparison />
      </TabsContent>

      <TabsContent value="history">
        <TPVGoalsHistory />
      </TabsContent>
    </Tabs>
  );
}
