import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  AlertCircle
} from 'lucide-react';
import { useRevenueRiskAlerts } from '@/hooks/useRevenueRiskAlerts';
import { cn } from '@/lib/utils';

const BenchmarkingDashboard = () => {
  const { benchmarks, isLoading } = useRevenueRiskAlerts();
  const [selectedIndustry, setSelectedIndustry] = useState('saas');

  // Mock benchmark data
  const mockBenchmarks = [
    {
      metric: 'Net Revenue Retention',
      yourValue: 112,
      industryAvg: 105,
      topQuartile: 125,
      bottomQuartile: 95,
      unit: '%',
      isHigherBetter: true
    },
    {
      metric: 'Gross Revenue Retention',
      yourValue: 92,
      industryAvg: 88,
      topQuartile: 95,
      bottomQuartile: 80,
      unit: '%',
      isHigherBetter: true
    },
    {
      metric: 'Logo Churn Rate',
      yourValue: 3.5,
      industryAvg: 5.2,
      topQuartile: 2.5,
      bottomQuartile: 8,
      unit: '%',
      isHigherBetter: false
    },
    {
      metric: 'Expansion Rate',
      yourValue: 18,
      industryAvg: 12,
      topQuartile: 22,
      bottomQuartile: 6,
      unit: '%',
      isHigherBetter: true
    },
    {
      metric: 'Time to Value (días)',
      yourValue: 14,
      industryAvg: 21,
      topQuartile: 10,
      bottomQuartile: 35,
      unit: 'días',
      isHigherBetter: false
    },
    {
      metric: 'NPS Score',
      yourValue: 42,
      industryAvg: 35,
      topQuartile: 55,
      bottomQuartile: 20,
      unit: '',
      isHigherBetter: true
    },
    {
      metric: 'Feature Adoption Rate',
      yourValue: 68,
      industryAvg: 55,
      topQuartile: 75,
      bottomQuartile: 40,
      unit: '%',
      isHigherBetter: true
    },
    {
      metric: 'ARPU',
      yourValue: 850,
      industryAvg: 720,
      topQuartile: 1200,
      bottomQuartile: 450,
      unit: '€',
      isHigherBetter: true
    }
  ];

  const mockInsights = [
    {
      type: 'positive',
      title: 'Expansion Rate excepcional',
      description: 'Tu tasa de expansión del 18% está 50% por encima del promedio de la industria. Esto indica una excelente capacidad de upsell.',
      recommendation: 'Documenta las estrategias de expansión exitosas y replica en otros segmentos.'
    },
    {
      type: 'positive',
      title: 'Time to Value competitivo',
      description: 'Con 14 días vs 21 del promedio, tus clientes obtienen valor más rápido.',
      recommendation: 'Considera destacar esto en tu marketing como diferenciador.'
    },
    {
      type: 'improvement',
      title: 'Potencial en Feature Adoption',
      description: 'Aunque estás por encima del promedio, hay margen de mejora hacia el top quartile.',
      recommendation: 'Implementa tours guiados y notificaciones de features no utilizadas.'
    },
    {
      type: 'warning',
      title: 'ARPU por debajo del top quartile',
      description: 'Tu ARPU de €850 podría acercarse más a los €1,200 del top quartile.',
      recommendation: 'Revisa tu estrategia de pricing y considera bundling de features premium.'
    }
  ];

  const getPerformanceStatus = (metric: typeof mockBenchmarks[0]) => {
    const { yourValue, industryAvg, topQuartile, bottomQuartile, isHigherBetter } = metric;
    
    if (isHigherBetter) {
      if (yourValue >= topQuartile) return { status: 'excellent', label: 'Top Quartile', color: 'text-green-500' };
      if (yourValue >= industryAvg) return { status: 'good', label: 'Sobre promedio', color: 'text-blue-500' };
      if (yourValue >= bottomQuartile) return { status: 'average', label: 'Promedio', color: 'text-amber-500' };
      return { status: 'poor', label: 'Bajo promedio', color: 'text-red-500' };
    } else {
      if (yourValue <= topQuartile) return { status: 'excellent', label: 'Top Quartile', color: 'text-green-500' };
      if (yourValue <= industryAvg) return { status: 'good', label: 'Sobre promedio', color: 'text-blue-500' };
      if (yourValue <= bottomQuartile) return { status: 'average', label: 'Promedio', color: 'text-amber-500' };
      return { status: 'poor', label: 'Bajo promedio', color: 'text-red-500' };
    }
  };

  const getComparisonIcon = (metric: typeof mockBenchmarks[0]) => {
    const diff = metric.isHigherBetter 
      ? metric.yourValue - metric.industryAvg
      : metric.industryAvg - metric.yourValue;
    
    if (Math.abs(diff) < 1) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (diff > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <Award className="h-5 w-5 text-green-500" />;
      case 'improvement':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-primary" />;
    }
  };

  // Calculate summary stats
  const excellentCount = mockBenchmarks.filter(m => getPerformanceStatus(m).status === 'excellent').length;
  const goodCount = mockBenchmarks.filter(m => getPerformanceStatus(m).status === 'good').length;
  const averageCount = mockBenchmarks.filter(m => getPerformanceStatus(m).status === 'average').length;
  const poorCount = mockBenchmarks.filter(m => getPerformanceStatus(m).status === 'poor').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Benchmarking Automático</h2>
          <p className="text-muted-foreground">Compara tus métricas con la industria</p>
        </div>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleccionar industria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="saas">SaaS B2B</SelectItem>
            <SelectItem value="fintech">Fintech</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Quartile</p>
                <p className="text-3xl font-bold text-green-500">{excellentCount}</p>
                <p className="text-xs text-muted-foreground">métricas</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sobre Promedio</p>
                <p className="text-3xl font-bold text-blue-500">{goodCount}</p>
                <p className="text-xs text-muted-foreground">métricas</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Promedio</p>
                <p className="text-3xl font-bold text-amber-500">{averageCount}</p>
                <p className="text-xs text-muted-foreground">métricas</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bajo Promedio</p>
                <p className="text-3xl font-bold text-red-500">{poorCount}</p>
                <p className="text-xs text-muted-foreground">métricas</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparativa de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockBenchmarks.map((metric, idx) => {
              const performance = getPerformanceStatus(metric);
              const range = metric.isHigherBetter 
                ? metric.topQuartile - metric.bottomQuartile
                : metric.bottomQuartile - metric.topQuartile;
              const position = metric.isHigherBetter
                ? ((metric.yourValue - metric.bottomQuartile) / range) * 100
                : ((metric.bottomQuartile - metric.yourValue) / range) * 100;
              
              return (
                <div key={idx} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{metric.metric}</span>
                      <Badge className={cn(
                        performance.status === 'excellent' && 'bg-green-500/10 text-green-500 border-green-500/20',
                        performance.status === 'good' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                        performance.status === 'average' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                        performance.status === 'poor' && 'bg-red-500/10 text-red-500 border-red-500/20'
                      )}>
                        {performance.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <span className="text-muted-foreground">Tu valor: </span>
                        <span className={cn("font-bold", performance.color)}>
                          {metric.yourValue}{metric.unit}
                        </span>
                      </div>
                      {getComparisonIcon(metric)}
                      <div className="text-right">
                        <span className="text-muted-foreground">Industria: </span>
                        <span className="font-medium">
                          {metric.industryAvg}{metric.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Visual comparison bar */}
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    {/* Bottom quartile zone */}
                    <div className="absolute left-0 h-full w-1/4 bg-red-500/20" />
                    {/* Average zone */}
                    <div className="absolute left-1/4 h-full w-1/4 bg-amber-500/20" />
                    {/* Good zone */}
                    <div className="absolute left-1/2 h-full w-1/4 bg-blue-500/20" />
                    {/* Top quartile zone */}
                    <div className="absolute left-3/4 h-full w-1/4 bg-green-500/20" />
                    
                    {/* Your position marker */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-primary rounded-sm shadow-lg border-2 border-background"
                      style={{ left: `calc(${Math.min(Math.max(position, 5), 95)}% - 6px)` }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Bottom: {metric.bottomQuartile}{metric.unit}</span>
                    <span>Promedio: {metric.industryAvg}{metric.unit}</span>
                    <span>Top: {metric.topQuartile}{metric.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Insights Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockInsights.map((insight, idx) => (
              <div 
                key={idx}
                className={cn(
                  "p-4 rounded-lg border",
                  insight.type === 'positive' && "border-green-500/30 bg-green-500/5",
                  insight.type === 'improvement' && "border-blue-500/30 bg-blue-500/5",
                  insight.type === 'warning' && "border-amber-500/30 bg-amber-500/5"
                )}
              >
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="p-2 bg-background/50 rounded text-sm">
                      <span className="font-medium">Recomendación: </span>
                      {insight.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BenchmarkingDashboard;
