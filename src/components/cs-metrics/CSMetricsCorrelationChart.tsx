import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Cell 
} from 'recharts';
import { TrendingUp, GitBranch, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrelationData {
  name: string;
  x: number;
  y: number;
  z: number;
  correlation: number;
  insight: string;
}

interface CSMetricsCorrelationChartProps {
  className?: string;
  nps?: number;
  csat?: number;
  churnRate?: number;
  nrr?: number;
  healthScore?: number;
}

const CORRELATION_PAIRS: CorrelationData[] = [
  { name: 'NPS vs NRR', x: 45, y: 115, z: 0.78, correlation: 0.78, insight: 'Promotores expanden más' },
  { name: 'NPS vs Churn', x: 45, y: 5, z: -0.72, correlation: -0.72, insight: 'Alto NPS reduce churn' },
  { name: 'Health vs Churn', x: 75, y: 3, z: -0.85, correlation: -0.85, insight: 'Mejor predictor de churn' },
  { name: 'CSAT vs Retention', x: 82, y: 92, z: 0.68, correlation: 0.68, insight: 'Satisfacción retiene' },
  { name: 'Adoption vs NRR', x: 68, y: 118, z: 0.71, correlation: 0.71, insight: 'Adopción impulsa expansión' },
  { name: 'CES vs Churn', x: 25, y: 12, z: 0.65, correlation: 0.65, insight: 'Alto esfuerzo = más abandono' },
  { name: 'Engagement vs CLV', x: 70, y: 85, z: 0.63, correlation: 0.63, insight: 'Engagement aumenta valor' },
  { name: 'TTV vs Activation', x: 15, y: 78, z: -0.82, correlation: -0.82, insight: 'Menos TTV = más activación' },
];

export function CSMetricsCorrelationChart({ 
  className,
  nps = 42,
  csat = 78,
  churnRate = 4.2,
  nrr = 112,
  healthScore = 73
}: CSMetricsCorrelationChartProps) {
  const chartData = useMemo(() => {
    return CORRELATION_PAIRS.map(pair => ({
      ...pair,
      z: Math.abs(pair.correlation) * 100,
    }));
  }, []);

  const predictions = useMemo(() => {
    const churnRisk = healthScore < 50 ? 'high' : healthScore < 70 ? 'medium' : 'low';
    const expansionPotential = nps > 50 && nrr > 110 ? 'high' : nps > 20 ? 'medium' : 'low';
    const retentionScore = (healthScore * 0.4 + (100 - churnRate * 10) * 0.3 + csat * 0.3);
    
    return {
      churnRisk,
      expansionPotential,
      retentionScore: Math.min(100, Math.max(0, retentionScore)),
      predictedChurn: Math.max(0, 15 - (healthScore * 0.15)),
      predictedNRR: 100 + (nps * 0.3) + (healthScore * 0.1),
    };
  }, [nps, csat, churnRate, nrr, healthScore]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm">{data.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.insight}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant="outline"
              className={cn(
                "text-xs",
                data.correlation > 0 
                  ? "text-green-500 border-green-500/30" 
                  : "text-red-500 border-red-500/30"
              )}
            >
              r = {data.correlation > 0 ? '+' : ''}{data.correlation.toFixed(2)}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {Math.abs(data.correlation) >= 0.7 ? 'Fuerte' : 'Moderada'}
            </Badge>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-2/20">
              <GitBranch className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <CardTitle className="text-base">Correlaciones CS Avanzadas</CardTitle>
              <p className="text-xs text-muted-foreground">
                Visualización de relaciones entre métricas
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {CORRELATION_PAIRS.length} correlaciones
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scatter Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Métrica A" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Métrica B" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <ZAxis type="number" dataKey="z" range={[100, 500]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Scatter name="Correlaciones" data={chartData}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.correlation > 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))'}
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* AI Predictions */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-border/50">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            Análisis Predictivo IA
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Riesgo Churn</p>
              <Badge 
                variant="outline"
                className={cn(
                  "mt-1",
                  predictions.churnRisk === 'low' && "text-green-500 border-green-500/30",
                  predictions.churnRisk === 'medium' && "text-yellow-500 border-yellow-500/30",
                  predictions.churnRisk === 'high' && "text-red-500 border-red-500/30"
                )}
              >
                {predictions.churnRisk === 'low' ? 'Bajo' : predictions.churnRisk === 'medium' ? 'Medio' : 'Alto'}
              </Badge>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Churn Predicho</p>
              <p className="text-lg font-bold text-foreground">{predictions.predictedChurn.toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">NRR Proyectado</p>
              <p className="text-lg font-bold text-green-500">{predictions.predictedNRR.toFixed(0)}%</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Score Retención</p>
              <p className="text-lg font-bold text-chart-1">{predictions.retentionScore.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Top Correlations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Correlaciones más significativas
          </h4>
          <div className="grid gap-2">
            {CORRELATION_PAIRS.filter(c => Math.abs(c.correlation) >= 0.7).map((corr, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      corr.correlation > 0 ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                  <span className="text-sm font-medium">{corr.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{corr.insight}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CSMetricsCorrelationChart;
