import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Users, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MRRWaterfallData {
  startMRR: number;
  newBusiness: number;
  expansion: number;
  contraction: number;
  churn: number;
  endMRR: number;
}

interface MRRWaterfallChartProps {
  data: MRRWaterfallData;
  previousPeriodData?: MRRWaterfallData;
  period?: string;
}

export function MRRWaterfallChart({ 
  data, 
  previousPeriodData,
  period = 'Este Mes' 
}: MRRWaterfallChartProps) {
  const chartData = useMemo(() => {
    let running = data.startMRR;
    
    return [
      { 
        name: 'MRR Inicial', 
        value: data.startMRR, 
        cumulative: data.startMRR,
        type: 'start',
        color: 'hsl(var(--primary))'
      },
      { 
        name: 'Nuevo Negocio', 
        value: data.newBusiness, 
        cumulative: running += data.newBusiness,
        type: 'positive',
        color: 'hsl(142, 76%, 36%)' // green
      },
      { 
        name: 'Expansión', 
        value: data.expansion, 
        cumulative: running += data.expansion,
        type: 'positive',
        color: 'hsl(142, 76%, 46%)' // lighter green
      },
      { 
        name: 'Contracción', 
        value: -data.contraction, 
        cumulative: running -= data.contraction,
        type: 'negative',
        color: 'hsl(38, 92%, 50%)' // orange
      },
      { 
        name: 'Churn', 
        value: -data.churn, 
        cumulative: running -= data.churn,
        type: 'negative',
        color: 'hsl(0, 84%, 60%)' // red
      },
      { 
        name: 'MRR Final', 
        value: data.endMRR, 
        cumulative: data.endMRR,
        type: 'end',
        color: 'hsl(var(--primary))'
      },
    ];
  }, [data]);

  const metrics = useMemo(() => {
    const netNew = data.newBusiness + data.expansion;
    const netLost = data.contraction + data.churn;
    const netChange = netNew - netLost;
    const growthRate = ((data.endMRR - data.startMRR) / data.startMRR) * 100;
    const nrr = ((data.startMRR + data.expansion - data.contraction - data.churn) / data.startMRR) * 100;
    const quickRatio = netLost > 0 ? netNew / netLost : netNew > 0 ? Infinity : 0;

    return { netNew, netLost, netChange, growthRate, nrr, quickRatio };
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof chartData[0] }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{item.name}</p>
          <p className={`text-lg font-bold ${item.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {item.value >= 0 ? '+' : ''}{formatCurrency(item.value)}
          </p>
          <p className="text-sm text-muted-foreground">
            Acumulado: {formatCurrency(item.cumulative)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              MRR Waterfall
            </CardTitle>
            <CardDescription>{period}</CardDescription>
          </div>
          <Badge variant={metrics.netChange >= 0 ? 'default' : 'destructive'} className="text-lg px-3 py-1">
            {metrics.netChange >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
            {formatCurrency(metrics.netChange)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Net New</div>
            <div className="text-xl font-bold text-green-500">
              +{formatCurrency(metrics.netNew)}
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">Net Lost</div>
            <div className="text-xl font-bold text-red-500">
              -{formatCurrency(metrics.netLost)}
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">NRR</div>
            <div className={`text-xl font-bold ${metrics.nrr >= 100 ? 'text-green-500' : 'text-yellow-500'}`}>
              {metrics.nrr.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Quick Ratio
              <span className="text-xs">(≥4 ideal)</span>
            </div>
            <div className={`text-xl font-bold ${
              metrics.quickRatio >= 4 ? 'text-green-500' : 
              metrics.quickRatio >= 2 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {metrics.quickRatio === Infinity ? '∞' : metrics.quickRatio.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Waterfall Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={data.startMRR} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar dataKey="cumulative" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Crecimiento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>Contracción</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Churn</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MRRWaterfallChart;
