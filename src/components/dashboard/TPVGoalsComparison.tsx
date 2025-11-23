import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface GoalComparison {
  goalId: string;
  metricType: string;
  targetValue: number;
  currentValue: number;
  deviation: number;
  deviationPercentage: number;
  progress: number;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  description: string | null;
  status: 'achieved' | 'on-track' | 'at-risk' | 'critical';
}

export function TPVGoalsComparison() {
  const { user } = useAuth();
  const [comparisons, setComparisons] = useState<GoalComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  const isAdmin = user?.email?.includes('admin');

  useEffect(() => {
    fetchComparisons();
  }, [user, selectedPeriod]);

  const fetchComparisons = async () => {
    try {
      setLoading(true);

      // Fetch active TPV goals
      const currentDate = new Date().toISOString();
      let goalsQuery = supabase
        .from('goals')
        .select('*')
        .in('metric_type', ['tpv_revenue', 'tpv_affiliation', 'tpv_commission']);

      if (selectedPeriod === 'current') {
        goalsQuery = goalsQuery
          .lte('period_start', currentDate)
          .gte('period_end', currentDate);
      }

      const { data: goals, error: goalsError } = await goalsQuery.order('period_start', { ascending: false });

      if (goalsError) throw goalsError;

      if (!goals || goals.length === 0) {
        setComparisons([]);
        setLoading(false);
        return;
      }

      // Fetch TPV terminals data
      let terminalsQuery = supabase
        .from('company_tpv_terminals' as any)
        .select('annual_revenue, affiliation_percentage, active, company_id, id');

      // Filter by gestor if not admin
      if (!isAdmin && user?.id) {
        const { data: gestorCompanies } = await supabase
          .from('companies')
          .select('id')
          .eq('gestor_id', user.id);

        const companyIds = gestorCompanies?.map(c => c.id) || [];
        if (companyIds.length > 0) {
          terminalsQuery = terminalsQuery.in('company_id', companyIds);
        } else {
          setComparisons([]);
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

      // Calculate current metrics
      const activeTerminals = terminals?.filter((t: any) => t.active) || [];
      const totalRevenue = terminals?.reduce((sum: number, t: any) => sum + (t.annual_revenue || 0), 0) || 0;
      const averageAffiliation = activeTerminals.length > 0
        ? activeTerminals.reduce((sum: number, t: any) => sum + (t.affiliation_percentage || 0), 0) / activeTerminals.length
        : 0;

      const nationalCommissions = commissions?.filter((c: any) => c.card_type === 'NACIONAL') || [];
      const averageCommission = nationalCommissions.length > 0
        ? nationalCommissions.reduce((sum: number, c: any) => sum + c.commission_rate, 0) / nationalCommissions.length
        : 0;

      // Create comparisons
      const comparisonsData: GoalComparison[] = goals.map(goal => {
        let currentValue = 0;
        switch (goal.metric_type) {
          case 'tpv_revenue':
            currentValue = totalRevenue;
            break;
          case 'tpv_affiliation':
            currentValue = averageAffiliation;
            break;
          case 'tpv_commission':
            currentValue = averageCommission;
            break;
        }

        const deviation = currentValue - goal.target_value;
        const deviationPercentage = goal.target_value > 0 ? (deviation / goal.target_value) * 100 : 0;
        
        // For commission, lower is better
        let progress = 0;
        if (goal.metric_type === 'tpv_commission') {
          progress = goal.target_value > 0 ? Math.min(100, Math.max(0, ((goal.target_value - currentValue) / goal.target_value) * 100 + 100)) : 0;
        } else {
          progress = goal.target_value > 0 ? Math.min(100, (currentValue / goal.target_value) * 100) : 0;
        }

        let status: 'achieved' | 'on-track' | 'at-risk' | 'critical' = 'critical';
        if (progress >= 100) status = 'achieved';
        else if (progress >= 80) status = 'on-track';
        else if (progress >= 60) status = 'at-risk';

        return {
          goalId: goal.id,
          metricType: goal.metric_type,
          targetValue: goal.target_value,
          currentValue,
          deviation,
          deviationPercentage,
          progress,
          periodStart: goal.period_start,
          periodEnd: goal.period_end,
          periodType: goal.period_type,
          description: goal.description,
          status,
        };
      });

      setComparisons(comparisonsData);
    } catch (error: any) {
      console.error('Error fetching comparisons:', error);
      toast.error('Error al cargar comparaciones');
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'tpv_revenue':
        return 'Facturación TPV';
      case 'tpv_affiliation':
        return 'Vinculación TPV';
      case 'tpv_commission':
        return 'Comisión Tarjetas';
      default:
        return type;
    }
  };

  const formatValue = (type: string, value: number) => {
    switch (type) {
      case 'tpv_revenue':
        return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
      case 'tpv_affiliation':
      case 'tpv_commission':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString('es-ES');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Badge className="bg-green-500">Cumplido</Badge>;
      case 'on-track':
        return <Badge className="bg-blue-500">En camino</Badge>;
      case 'at-risk':
        return <Badge variant="secondary">En riesgo</Badge>;
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeviationIcon = (deviation: number, metricType: string) => {
    // For commission, lower is better (negative deviation is good)
    const isGood = metricType === 'tpv_commission' ? deviation < 0 : deviation > 0;
    
    if (isGood) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const prepareChartData = (comparison: GoalComparison) => {
    return [
      {
        name: 'Objetivo',
        value: comparison.targetValue,
        fill: '#8884d8',
      },
      {
        name: 'Actual',
        value: comparison.currentValue,
        fill: comparison.status === 'achieved' ? '#22c55e' : comparison.status === 'on-track' ? '#3b82f6' : '#ef4444',
      },
    ];
  };

  const prepareDeviationChartData = () => {
    return comparisons.map(comp => ({
      name: getMetricLabel(comp.metricType),
      desviacion: comp.deviationPercentage,
      fill: comp.status === 'achieved' ? '#22c55e' : comp.status === 'on-track' ? '#3b82f6' : '#ef4444',
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>No hay objetivos de TPV activos para comparar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {comparisons.map((comparison) => (
          <Card key={comparison.goalId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs">{getMetricLabel(comparison.metricType)}</CardDescription>
                {getStatusBadge(comparison.status)}
              </div>
              <CardTitle className="text-2xl flex items-center gap-2">
                {formatValue(comparison.metricType, comparison.currentValue)}
                {getDeviationIcon(comparison.deviation, comparison.metricType)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Objetivo: </span>
                <span className="font-semibold">{formatValue(comparison.metricType, comparison.targetValue)}</span>
              </div>
              <Progress value={comparison.progress} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className={comparison.deviation >= 0 && comparison.metricType !== 'tpv_commission' ? 'text-green-600' : 'text-red-600'}>
                  {comparison.deviation >= 0 ? '+' : ''}{formatValue(comparison.metricType, comparison.deviation)}
                </span>
                <span className="text-muted-foreground">{comparison.progress.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis Detallado de Objetivos
          </CardTitle>
          <CardDescription>
            Comparación visual de objetivos vs resultados reales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comparison" className="space-y-4">
            <TabsList>
              <TabsTrigger value="comparison">Comparación</TabsTrigger>
              <TabsTrigger value="deviation">Desviación</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-6">
              {comparisons.map((comparison) => (
                <div key={comparison.goalId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{getMetricLabel(comparison.metricType)}</h3>
                    {getStatusBadge(comparison.status)}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={prepareChartData(comparison)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => formatValue(comparison.metricType, value)}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {prepareChartData(comparison).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="deviation">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareDeviationChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Desviación (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)}%`}
                  />
                  <Bar dataKey="desviacion" radius={[8, 8, 0, 0]}>
                    {prepareDeviationChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {comparisons.map((comparison) => (
                <Card key={comparison.goalId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{getMetricLabel(comparison.metricType)}</CardTitle>
                      {getStatusBadge(comparison.status)}
                    </div>
                    {comparison.description && (
                      <CardDescription>{comparison.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Período</p>
                        <p className="font-semibold capitalize">{comparison.periodType}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(comparison.periodStart).toLocaleDateString('es-ES')} - {new Date(comparison.periodEnd).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progreso</p>
                        <p className="font-semibold">{comparison.progress.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Objetivo</p>
                        <p className="font-semibold">{formatValue(comparison.metricType, comparison.targetValue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Actual</p>
                        <p className="font-semibold">{formatValue(comparison.metricType, comparison.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Desviación</p>
                        <p className={`font-semibold ${comparison.deviation >= 0 && comparison.metricType !== 'tpv_commission' ? 'text-green-600' : 'text-red-600'}`}>
                          {comparison.deviation >= 0 ? '+' : ''}{formatValue(comparison.metricType, comparison.deviation)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Desviación %</p>
                        <p className={`font-semibold ${comparison.deviationPercentage >= 0 && comparison.metricType !== 'tpv_commission' ? 'text-green-600' : 'text-red-600'}`}>
                          {comparison.deviationPercentage >= 0 ? '+' : ''}{comparison.deviationPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
