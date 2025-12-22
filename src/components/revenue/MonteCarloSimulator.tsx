import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMonteCarloSimulation } from '@/hooks/useMonteCarloSimulation';
import { Dices, RefreshCw, Target, TrendingUp, AlertTriangle } from 'lucide-react';

const MonteCarloSimulator: React.FC = () => {
  const { simulations, isLoading, runSimulation, isRunning, getLatestSimulation, getPercentileRange } = useMonteCarloSimulation();
  
  const [simulationName, setSimulationName] = useState('Revenue Forecast Q1');
  const [iterations, setIterations] = useState(1000);
  const [baseMRR, setBaseMRR] = useState(100000);
  const [growthMin, setGrowthMin] = useState(2);
  const [growthMax, setGrowthMax] = useState(8);
  const [churnMin, setChurnMin] = useState(1);
  const [churnMax, setChurnMax] = useState(4);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleRunSimulation = async () => {
    await runSimulation({
      simulationName,
      numIterations: iterations,
      baseMetrics: { baseMRR },
      variabilityRanges: {
        growth: { min: growthMin / 100, max: growthMax / 100 },
        churn: { min: churnMin / 100, max: churnMax / 100 }
      }
    });
  };

  const latestSimulation = getLatestSimulation();
  const percentiles = latestSimulation ? getPercentileRange(latestSimulation) : null;

  const distributionData = latestSimulation?.distribution_data as { histogram?: { bucket: string; count: number }[] } | null;
  const histogramData = distributionData?.histogram || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Dices className="h-5 w-5 text-primary" />
            Simulador Monte Carlo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="simName">Nombre de Simulación</Label>
                <Input 
                  id="simName"
                  value={simulationName} 
                  onChange={(e) => setSimulationName(e.target.value)}
                  placeholder="Nombre descriptivo"
                />
              </div>

              <div>
                <Label htmlFor="baseMRR">MRR Base (€)</Label>
                <Input 
                  id="baseMRR"
                  type="number" 
                  value={baseMRR} 
                  onChange={(e) => setBaseMRR(Number(e.target.value))}
                />
              </div>

              <div>
                <Label>Iteraciones: {iterations.toLocaleString()}</Label>
                <Slider 
                  value={[iterations]} 
                  onValueChange={([v]) => setIterations(v)}
                  min={100}
                  max={10000}
                  step={100}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Rango Crecimiento: {growthMin}% - {growthMax}%</Label>
                <div className="flex gap-2 mt-2">
                  <Slider 
                    value={[growthMin]} 
                    onValueChange={([v]) => setGrowthMin(v)}
                    min={0}
                    max={20}
                    step={0.5}
                    className="flex-1"
                  />
                  <Slider 
                    value={[growthMax]} 
                    onValueChange={([v]) => setGrowthMax(v)}
                    min={0}
                    max={20}
                    step={0.5}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Rango Churn: {churnMin}% - {churnMax}%</Label>
                <div className="flex gap-2 mt-2">
                  <Slider 
                    value={[churnMin]} 
                    onValueChange={([v]) => setChurnMin(v)}
                    min={0}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                  <Slider 
                    value={[churnMax]} 
                    onValueChange={([v]) => setChurnMax(v)}
                    min={0}
                    max={10}
                    step={0.5}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button 
                onClick={handleRunSimulation} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Dices className="h-4 w-4 mr-2" />
                )}
                Ejecutar Simulación
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {latestSimulation && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Resultados: {latestSimulation.simulation_name}</CardTitle>
                <Badge variant="outline">
                  {latestSimulation.num_iterations.toLocaleString()} iteraciones
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-destructive/10 text-center">
                  <AlertTriangle className="h-4 w-4 text-destructive mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">P10 (Pesimista)</p>
                  <p className="text-lg font-bold text-destructive">
                    {formatCurrency(latestSimulation.percentile_10 || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-chart-4/10 text-center">
                  <p className="text-xs text-muted-foreground">P25</p>
                  <p className="text-lg font-bold text-chart-4">
                    {formatCurrency(latestSimulation.percentile_25 || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <Target className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">P50 (Mediana)</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(latestSimulation.percentile_50 || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-chart-1/10 text-center">
                  <p className="text-xs text-muted-foreground">P75</p>
                  <p className="text-lg font-bold text-chart-1">
                    {formatCurrency(latestSimulation.percentile_75 || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-chart-2/10 text-center">
                  <TrendingUp className="h-4 w-4 text-chart-2 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">P90 (Optimista)</p>
                  <p className="text-lg font-bold text-chart-2">
                    {formatCurrency(latestSimulation.percentile_90 || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Media</p>
                  <p className="text-xl font-bold">{formatCurrency(latestSimulation.mean_outcome || 0)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Desv. Estándar</p>
                  <p className="text-xl font-bold">{formatCurrency(latestSimulation.std_deviation || 0)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Rango (P10-P90)</p>
                  <p className="text-xl font-bold">{formatCurrency(percentiles?.range || 0)}</p>
                </div>
              </div>

              {latestSimulation.target_value && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Probabilidad de alcanzar objetivo</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {formatCurrency(latestSimulation.target_value)}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {((latestSimulation.probability_of_target || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              {histogramData.length > 0 && (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={histogramData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="bucket" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.3)" 
                      />
                      {latestSimulation.percentile_50 && (
                        <ReferenceLine 
                          x={latestSimulation.percentile_50.toString()} 
                          stroke="hsl(var(--primary))" 
                          strokeDasharray="5 5"
                          label={{ value: 'P50', fill: 'hsl(var(--primary))' }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {simulations && simulations.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Historial de Simulaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {simulations.slice(0, 5).map((sim) => (
                    <div 
                      key={sim.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium text-sm">{sim.simulation_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sim.simulation_date).toLocaleDateString('es-ES')} • {sim.num_iterations.toLocaleString()} iter.
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(sim.percentile_50 || 0)}</p>
                        <p className="text-xs text-muted-foreground">P50</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default MonteCarloSimulator;
