import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip, FINANCIAL_TOOLTIPS } from '@/components/ui/info-tooltip';
import { FinancialScenario } from '@/hooks/useStrategicPlanning';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Target, DollarSign, Clock, Percent } from 'lucide-react';

interface ScenarioChartsProps {
  scenarios: FinancialScenario[];
  years: number[];
}

const SCENARIO_COLORS = {
  optimistic: '#22c55e',
  realistic: '#3b82f6',
  pessimistic: '#ef4444',
  custom: '#8b5cf6'
};

export function ScenarioCharts({ scenarios, years }: ScenarioChartsProps) {
  if (scenarios.length === 0) {
    return (
      <Card className="lg:col-span-2">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Genera escenarios para visualizar comparativas y proyecciones.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare comparison data
  const comparisonData = scenarios.map(s => ({
    name: s.scenario_name,
    type: s.scenario_type,
    VAN: s.npv || 0,
    TIR: (s.irr || 0) * 100,
    Payback: s.payback_period || 0,
    Breakeven: s.breakeven_year || 0
  }));

  // Prepare radar data for variables
  const radarData = [
    { variable: 'Crecimiento', optimistic: 30, realistic: 15, pessimistic: 5 },
    { variable: 'Reducción Costes', optimistic: 15, realistic: 8, pessimistic: 2 },
    { variable: 'Inversión', optimistic: 70, realistic: 50, pessimistic: 30 },
    { variable: 'Expansión', optimistic: 40, realistic: 20, pessimistic: 10 },
    { variable: 'Eficiencia', optimistic: 25, realistic: 15, pessimistic: 5 }
  ];

  // Prepare projected revenue data
  const projectionData = years.map((year, idx) => {
    const data: any = { year };
    scenarios.forEach(s => {
      const variables = s.variables as Record<string, number>;
      const baseRevenue = 100000;
      const growth = (variables?.revenue_growth || 10) / 100;
      data[s.scenario_name] = Math.round(baseRevenue * Math.pow(1 + growth, idx));
    });
    return data;
  });

  // Get best and worst scenarios
  const sortedByNPV = [...scenarios].sort((a, b) => (b.npv || 0) - (a.npv || 0));
  const best = sortedByNPV[0];
  const worst = sortedByNPV[sortedByNPV.length - 1];

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <DollarSign className="h-4 w-4" />
                VAN Medio
              </div>
              <InfoTooltip {...FINANCIAL_TOOLTIPS.npv} />
            </div>
            <p className="text-2xl font-bold mt-2">
              {(scenarios.reduce((sum, s) => sum + (s.npv || 0), 0) / scenarios.length).toLocaleString()} €
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                <Percent className="h-4 w-4" />
                TIR Media
              </div>
              <InfoTooltip {...FINANCIAL_TOOLTIPS.irr} />
            </div>
            <p className="text-2xl font-bold mt-2">
              {((scenarios.reduce((sum, s) => sum + (s.irr || 0), 0) / scenarios.length) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                <Clock className="h-4 w-4" />
                Payback Medio
              </div>
              <InfoTooltip {...FINANCIAL_TOOLTIPS.payback} />
            </div>
            <p className="text-2xl font-bold mt-2">
              {(scenarios.reduce((sum, s) => sum + (s.payback_period || 0), 0) / scenarios.length).toFixed(1)} años
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                <Target className="h-4 w-4" />
                Breakeven Medio
              </div>
              <InfoTooltip {...FINANCIAL_TOOLTIPS.breakeven} />
            </div>
            <p className="text-2xl font-bold mt-2">
              Año {Math.round(scenarios.reduce((sum, s) => sum + (s.breakeven_year || 0), 0) / scenarios.length)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* VAN & TIR Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comparativa VAN por Escenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString()} €`}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="VAN" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* TIR Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comparativa TIR por Escenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="TIR" 
                    fill="hsl(142, 76%, 36%)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Projected Revenue Evolution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Proyección de Ingresos por Escenario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} €`} />
                  <Legend />
                  {scenarios.map((s, idx) => (
                    <Area
                      key={s.id}
                      type="monotone"
                      dataKey={s.scenario_name}
                      stroke={SCENARIO_COLORS[s.scenario_type as keyof typeof SCENARIO_COLORS] || SCENARIO_COLORS.custom}
                      fill={SCENARIO_COLORS[s.scenario_type as keyof typeof SCENARIO_COLORS] || SCENARIO_COLORS.custom}
                      fillOpacity={0.1 + (idx * 0.05)}
                      strokeWidth={2}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Scenario Variables Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Variables de Escenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="variable" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  <Radar name="Optimista" dataKey="optimistic" stroke={SCENARIO_COLORS.optimistic} fill={SCENARIO_COLORS.optimistic} fillOpacity={0.3} />
                  <Radar name="Realista" dataKey="realistic" stroke={SCENARIO_COLORS.realistic} fill={SCENARIO_COLORS.realistic} fillOpacity={0.3} />
                  <Radar name="Pesimista" dataKey="pessimistic" stroke={SCENARIO_COLORS.pessimistic} fill={SCENARIO_COLORS.pessimistic} fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Best vs Worst Scenario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mejor vs Peor Escenario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {best && (
              <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">Mejor: {best.scenario_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">VAN:</span>
                    <span className="ml-2 font-medium">{best.npv?.toLocaleString()} €</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TIR:</span>
                    <span className="ml-2 font-medium">{((best.irr || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payback:</span>
                    <span className="ml-2 font-medium">{best.payback_period?.toFixed(1)} años</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Breakeven:</span>
                    <span className="ml-2 font-medium">Año {best.breakeven_year}</span>
                  </div>
                </div>
              </div>
            )}

            {worst && worst.id !== best?.id && (
              <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-600">Peor: {worst.scenario_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">VAN:</span>
                    <span className="ml-2 font-medium">{worst.npv?.toLocaleString()} €</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TIR:</span>
                    <span className="ml-2 font-medium">{((worst.irr || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payback:</span>
                    <span className="ml-2 font-medium">{worst.payback_period?.toFixed(1)} años</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Breakeven:</span>
                    <span className="ml-2 font-medium">Año {worst.breakeven_year}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Difference */}
            {best && worst && best.id !== worst.id && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1">Diferencia entre escenarios:</p>
                <p className="text-muted-foreground">
                  VAN: <span className="text-foreground">{((best.npv || 0) - (worst.npv || 0)).toLocaleString()} €</span>
                  {' | '}
                  TIR: <span className="text-foreground">{(((best.irr || 0) - (worst.irr || 0)) * 100).toFixed(1)} pp</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
