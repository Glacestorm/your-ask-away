import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useRevenueAttribution } from '@/hooks/useRevenueAttribution';
import { Share2, TrendingUp, DollarSign, Clock } from 'lucide-react';

const RevenueAttributionChart: React.FC = () => {
  const { 
    attributions, 
    isLoading, 
    getAttributionByChannel, 
    getAttributionBySource,
    getAttributionByCampaign,
    getTotalAttributedRevenue,
    getAverageConversionTime 
  } = useRevenueAttribution();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const byChannel = getAttributionByChannel();
  const bySource = getAttributionBySource();
  const byCampaign = getAttributionByCampaign();
  const totalRevenue = getTotalAttributedRevenue();
  const avgConversionTime = getAverageConversionTime();

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))'
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse">Cargando attribution...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Revenue Attribution
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Revenue Total Atribuido</p>
                <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Tiempo Promedio Conversión</p>
                <p className="text-xl font-bold">{avgConversionTime.toFixed(0)} días</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byChannel.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="channel" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {byChannel.slice(0, 6).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Por Fuente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySource.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="source"
                  label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                >
                  {bySource.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top Campañas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {byCampaign.slice(0, 5).map((campaign, index) => (
              <div 
                key={campaign.campaign}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <div>
                    <p className="font-medium text-sm truncate max-w-[150px]">{campaign.campaign}</p>
                    <p className="text-xs text-muted-foreground">{campaign.count} conversiones</p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(campaign.revenue)}</p>
              </div>
            ))}
            {byCampaign.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay datos de campañas</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueAttributionChart;
