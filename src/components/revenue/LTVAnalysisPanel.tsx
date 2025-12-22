import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLTVPrediction } from '@/hooks/useLTVPrediction';
import { TrendingUp, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';

const LTVAnalysisPanel: React.FC = () => {
  const { 
    predictions, 
    isLoading, 
    getAverageLTV, 
    getAverageLTVToCAC, 
    getLTVBySegment,
    getHighValueCustomers,
    getChurnRiskCustomers 
  } = useLTVPrediction();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const avgLTV = getAverageLTV();
  const avgLTVToCAC = getAverageLTVToCAC();
  const segmentData = getLTVBySegment();
  const highValueCustomers = getHighValueCustomers();
  const churnRiskCustomers = getChurnRiskCustomers();

  const segmentChartData = Object.entries(segmentData).map(([segment, data]) => ({
    segment,
    avgLTV: data.avgLTV,
    count: data.count
  }));

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  const ltvCacStatus = avgLTVToCAC >= 3 ? 'excellent' : avgLTVToCAC >= 2 ? 'good' : avgLTVToCAC >= 1 ? 'fair' : 'poor';
  const ltvCacColor = {
    excellent: 'text-chart-2',
    good: 'text-chart-1',
    fair: 'text-chart-4',
    poor: 'text-destructive'
  }[ltvCacStatus];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse">Cargando análisis LTV...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Métricas LTV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">LTV Promedio</p>
              <p className="text-2xl font-bold">{formatCurrency(avgLTV)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">LTV:CAC Ratio</p>
              <p className={`text-2xl font-bold ${ltvCacColor}`}>{avgLTVToCAC.toFixed(1)}x</p>
              <Badge variant={ltvCacStatus === 'excellent' || ltvCacStatus === 'good' ? 'default' : 'secondary'} className="mt-1">
                {ltvCacStatus === 'excellent' ? 'Excelente' : ltvCacStatus === 'good' ? 'Bueno' : ltvCacStatus === 'fair' ? 'Aceptable' : 'Bajo'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Benchmark LTV:CAC</span>
                <span className="text-sm text-muted-foreground">Meta: 3x</span>
              </div>
              <Progress value={Math.min((avgLTVToCAC / 3) * 100, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            LTV por Segmento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="segment" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'LTV Promedio']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="avgLTV" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-chart-2" />
            Clientes Alto Valor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {highValueCustomers.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-chart-2/10 flex items-center justify-center text-chart-2 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{customer.company?.name || 'Cliente'}</p>
                    <p className="text-xs text-muted-foreground">{customer.segment || 'Sin segmento'}</p>
                  </div>
                </div>
                <p className="font-semibold text-chart-2">{formatCurrency(customer.predicted_ltv)}</p>
              </div>
            ))}
            {highValueCustomers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay datos disponibles</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Riesgo de Churn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {churnRiskCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="font-medium text-sm">{customer.company?.name || 'Cliente'}</p>
                  <p className="text-xs text-muted-foreground">LTV: {formatCurrency(customer.predicted_ltv)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-destructive">
                    {((customer.churn_probability || 0) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">riesgo</p>
                </div>
              </div>
            ))}
            {churnRiskCustomers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay clientes en riesgo</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LTVAnalysisPanel;
