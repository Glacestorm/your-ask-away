import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Clock, Target, Zap, BarChart3, Activity, ArrowRight
} from 'lucide-react';
import { usePipelineSnapshots } from '@/hooks/useSalesPerformance';
import { useOpportunities } from '@/hooks/useOpportunities';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const STAGE_COLORS: Record<string, string> = {
  'discovery': 'bg-blue-500',
  'qualification': 'bg-cyan-500',
  'proposal': 'bg-yellow-500',
  'negotiation': 'bg-orange-500',
  'closed_won': 'bg-green-500',
  'closed_lost': 'bg-red-500',
};

const STAGE_LABELS: Record<string, string> = {
  'discovery': 'Descubrimiento',
  'qualification': 'Cualificación',
  'proposal': 'Propuesta',
  'negotiation': 'Negociación',
  'closed_won': 'Ganado',
  'closed_lost': 'Perdido',
};

export function PipelineIntelligence() {
  const [timeRange, setTimeRange] = useState('30');
  const { data: snapshots, isLoading: snapshotsLoading } = usePipelineSnapshots();
  const { opportunities, isLoading: oppsLoading } = useOpportunities();

  const latestSnapshot = snapshots?.[0];
  
  // Calculate pipeline metrics
  const activeOpportunities = opportunities?.filter((o: any) => !['closed_won', 'closed_lost'].includes(o.stage)) || [];
  const totalPipelineValue = activeOpportunities.reduce((sum: number, o: any) => sum + (o.estimated_value || 0), 0);
  const avgDealValue = activeOpportunities.length > 0 ? totalPipelineValue / activeOpportunities.length : 0;
  
  // Stage distribution
  const stageDistribution = activeOpportunities.reduce((acc: Record<string, number>, o: any) => {
    acc[o.stage] = (acc[o.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate velocity (deals moving per week)
  const velocity = latestSnapshot?.velocity_score || 0;
  const healthScore = latestSnapshot?.health_score || 0;

  // Identify bottlenecks
  const bottlenecks = Object.entries(stageDistribution)
    .filter(([stage, count]) => (count as number) > 5)
    .sort((a, b) => b[1] - a[1]);

  // Trend data for chart
  const trendData = snapshots?.slice(0, 14).reverse().map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    value: s.total_value,
    opportunities: s.total_opportunities,
    health: s.health_score,
  })) || [];

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Buena';
    if (score >= 40) return 'Necesita Atención';
    return 'Crítico';
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total Pipeline</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(totalPipelineValue)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Oportunidades Activas</p>
                <p className="text-2xl font-bold">{activeOpportunities.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Salud del Pipeline</p>
                <p className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
                  {healthScore.toFixed(0)}%
                </p>
              </div>
              <Activity className={`h-8 w-8 ${getHealthColor(healthScore)} opacity-80`} />
            </div>
            <Badge variant="secondary" className="mt-2">
              {getHealthLabel(healthScore)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Velocidad</p>
                <p className="text-2xl font-bold">{velocity.toFixed(1)}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">deals/semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Distribución por Etapa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(STAGE_LABELS).filter(([stage]) => !['closed_won', 'closed_lost'].includes(stage)).map(([stage, label]) => {
                const count = stageDistribution[stage] || 0;
                const percentage = activeOpportunities.length > 0 ? (count / activeOpportunities.length) * 100 : 0;
                const stageValue = activeOpportunities
                  .filter(o => o.stage === stage)
                  .reduce((sum, o) => sum + (o.estimated_value || 0), 0);

                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${STAGE_COLORS[stage]}`} />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{count}</Badge>
                        <span className="text-sm text-muted-foreground w-20 text-right">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(stageValue)}
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bottlenecks & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
              {bottlenecks.length > 0 ? (
                bottlenecks.map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cuello de botella en {STAGE_LABELS[stage]}</p>
                      <p className="text-xs text-muted-foreground">{String(count)} oportunidades acumuladas</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Pipeline saludable</p>
                  <p className="text-xs text-muted-foreground">No hay cuellos de botella detectados</p>
                </div>
              </div>
            )}

            {latestSnapshot && latestSnapshot.avg_deal_age_days > 30 && (
              <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Deals envejecidos</p>
                  <p className="text-xs text-muted-foreground">
                    Edad media: {latestSnapshot.avg_deal_age_days.toFixed(0)} días
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Evolución del Pipeline
            </CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 días</SelectItem>
                <SelectItem value="14">14 días</SelectItem>
                <SelectItem value="30">30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => new Intl.NumberFormat('es-ES', { notation: 'compact' }).format(value)}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}
                  labelClassName="font-medium"
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No hay datos de tendencia disponibles</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
