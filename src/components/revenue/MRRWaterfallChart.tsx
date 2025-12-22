import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useRevenueIntelligence } from '@/hooks/useRevenueIntelligence';
import { TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';

const MRRWaterfallChart: React.FC = () => {
  const { mrrSnapshots, currentMetrics } = useRevenueIntelligence();

  const latestSnapshot = mrrSnapshots?.[0];
  const previousSnapshot = mrrSnapshots?.[1];

  const waterfallData = [
    {
      name: 'MRR Inicial',
      value: previousSnapshot?.total_mrr || 0,
      fill: 'hsl(var(--muted-foreground))',
      isTotal: true
    },
    {
      name: 'Nuevo',
      value: latestSnapshot?.new_mrr || 0,
      fill: 'hsl(var(--chart-2))',
      icon: Plus
    },
    {
      name: 'Expansión',
      value: latestSnapshot?.expansion_mrr || 0,
      fill: 'hsl(var(--chart-1))',
      icon: TrendingUp
    },
    {
      name: 'Contracción',
      value: -(latestSnapshot?.contraction_mrr || 0),
      fill: 'hsl(var(--chart-4))',
      icon: TrendingDown
    },
    {
      name: 'Churn',
      value: -(latestSnapshot?.churned_mrr || 0),
      fill: 'hsl(var(--destructive))',
      icon: Minus
    },
    {
      name: 'MRR Final',
      value: latestSnapshot?.total_mrr || 0,
      fill: 'hsl(var(--primary))',
      isTotal: true
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
  };

  const netChange = currentMetrics.netMRRChange;
  const isPositive = netChange >= 0;

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">MRR Waterfall</CardTitle>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isPositive 
              ? 'bg-chart-2/10 text-chart-2' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {formatCurrency(netChange)} neto
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Nuevo MRR</p>
            <p className="text-lg font-semibold text-chart-2">+{formatCurrency(latestSnapshot?.new_mrr || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Expansión</p>
            <p className="text-lg font-semibold text-chart-1">+{formatCurrency(latestSnapshot?.expansion_mrr || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Contracción</p>
            <p className="text-lg font-semibold text-chart-4">-{formatCurrency(latestSnapshot?.contraction_mrr || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Churn</p>
            <p className="text-lg font-semibold text-destructive">-{formatCurrency(latestSnapshot?.churned_mrr || 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MRRWaterfallChart;
