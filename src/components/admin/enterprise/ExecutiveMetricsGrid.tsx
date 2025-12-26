/**
 * ExecutiveMetricsGrid
 * Grid de métricas ejecutivas con sparklines y tendencias
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  DollarSign,
  Users,
  ShieldCheck,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface ExecutiveMetric {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  target?: number;
  progress?: number;
  unit?: string;
  icon?: 'revenue' | 'users' | 'compliance' | 'activity' | 'target' | 'performance';
  sparklineData?: number[];
  category: 'financial' | 'operational' | 'compliance' | 'growth';
}

interface ExecutiveMetricsGridProps {
  metrics?: ExecutiveMetric[];
  loading?: boolean;
  className?: string;
}

const defaultMetrics: ExecutiveMetric[] = [
  {
    id: '1',
    label: 'Revenue MRR',
    value: '€125.4K',
    change: 12.5,
    changeType: 'positive',
    target: 150000,
    progress: 83,
    icon: 'revenue',
    sparklineData: [80, 85, 90, 88, 95, 100, 105, 110, 115, 120, 125],
    category: 'financial'
  },
  {
    id: '2',
    label: 'Active Users',
    value: '2,847',
    change: 8.2,
    changeType: 'positive',
    target: 3000,
    progress: 95,
    icon: 'users',
    sparklineData: [2100, 2200, 2350, 2400, 2500, 2600, 2700, 2750, 2800, 2847],
    category: 'growth'
  },
  {
    id: '3',
    label: 'Compliance Score',
    value: '92%',
    change: 3,
    changeType: 'positive',
    target: 95,
    progress: 97,
    icon: 'compliance',
    sparklineData: [85, 86, 87, 88, 89, 90, 91, 91, 92, 92],
    category: 'compliance'
  },
  {
    id: '4',
    label: 'System Health',
    value: '99.8%',
    change: 0.1,
    changeType: 'positive',
    icon: 'activity',
    sparklineData: [99.5, 99.6, 99.7, 99.8, 99.7, 99.8, 99.9, 99.8, 99.8, 99.8],
    category: 'operational'
  },
  {
    id: '5',
    label: 'Pipeline Value',
    value: '€450K',
    change: -5.2,
    changeType: 'negative',
    target: 500000,
    progress: 90,
    icon: 'target',
    sparklineData: [480, 470, 465, 460, 455, 450, 448, 445, 450, 450],
    category: 'financial'
  },
  {
    id: '6',
    label: 'AI Actions/Day',
    value: '1,248',
    change: 24.5,
    changeType: 'positive',
    icon: 'performance',
    sparklineData: [800, 850, 900, 950, 1000, 1050, 1100, 1150, 1200, 1248],
    category: 'operational'
  }
];

const iconMap = {
  revenue: DollarSign,
  users: Users,
  compliance: ShieldCheck,
  activity: Activity,
  target: Target,
  performance: Zap
};

const categoryColors = {
  financial: 'from-emerald-500 to-teal-600',
  operational: 'from-blue-500 to-indigo-600',
  compliance: 'from-green-500 to-emerald-600',
  growth: 'from-purple-500 to-pink-600'
};

export function ExecutiveMetricsGrid({ 
  metrics = defaultMetrics,
  loading = false,
  className 
}: ExecutiveMetricsGridProps) {
  const sparklineChartData = useMemo(() => {
    return metrics.map(m => ({
      ...m,
      chartData: m.sparklineData?.map((v, i) => ({ value: v, index: i })) || []
    }));
  }, [metrics]);

  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", className)}>
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-3/4 mb-2" />
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3", className)}>
      {sparklineChartData.map((metric) => {
        const Icon = iconMap[metric.icon || 'activity'];
        const gradientClass = categoryColors[metric.category];
        
        return (
          <Card 
            key={metric.id} 
            className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "p-1.5 rounded-lg bg-gradient-to-br",
                  gradientClass
                )}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                {metric.change !== undefined && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    metric.changeType === 'positive' ? 'text-green-600' :
                    metric.changeType === 'negative' ? 'text-destructive' :
                    'text-muted-foreground'
                  )}>
                    {metric.changeType === 'positive' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : metric.changeType === 'negative' ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <ArrowRight className="h-3 w-3" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                )}
              </div>

              {/* Value */}
              <p className="text-2xl font-bold tracking-tight mb-1">
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {metric.label}
              </p>

              {/* Sparkline */}
              {metric.chartData.length > 0 && (
                <div className="h-10 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metric.chartData}>
                      <defs>
                        <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop 
                            offset="0%" 
                            stopColor={metric.changeType === 'negative' ? '#ef4444' : '#22c55e'} 
                            stopOpacity={0.3}
                          />
                          <stop 
                            offset="100%" 
                            stopColor={metric.changeType === 'negative' ? '#ef4444' : '#22c55e'} 
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={metric.changeType === 'negative' ? '#ef4444' : '#22c55e'}
                        strokeWidth={1.5}
                        fill={`url(#gradient-${metric.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Progress */}
              {metric.progress !== undefined && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Target</span>
                    <span className="font-medium">{metric.progress}%</span>
                  </div>
                  <Progress value={metric.progress} className="h-1" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ExecutiveMetricsGrid;
