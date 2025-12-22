import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Save, TrendingUp, TrendingDown, RefreshCw, Play } from 'lucide-react';
import { useRevenueScenarios, ScenarioVariables } from '@/hooks/useRevenueScenarios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const defaultVariables: ScenarioVariables = {
  churnRate: 5,
  expansionRate: 10,
  newBusinessMRR: 5000,
  pricingChange: 0,
};

export const RevenueScenarioPlanner = () => {
  const { scenarios, isLoading, calculateProjection } = useRevenueScenarios();
  const [variables, setVariables] = useState<ScenarioVariables>(defaultVariables);
  const [baseMrr, setBaseMrr] = useState(100000);
  const [timeHorizon, setTimeHorizon] = useState(12);
  const [scenarioName, setScenarioName] = useState('');
  const [projections, setProjections] = useState<Array<{ month: number; mrr: number; optimistic: number; pessimistic: number }>>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const result = await calculateProjection(baseMrr, variables, timeHorizon);
      if (result?.monthly_projections) {
        setProjections(result.monthly_projections.map((p: { month: number; mrr: number }, i: number) => ({
          month: p.month,
          mrr: p.mrr,
          optimistic: p.mrr * 1.1,
          pessimistic: p.mrr * 0.9,
        })));
      }
    } catch {
      toast.error('Error al calcular proyección');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!scenarioName.trim()) {
      toast.error('Ingresa un nombre para el escenario');
      return;
    }
    try {
      await calculateProjection(baseMrr, variables, timeHorizon, scenarioName, true);
      setScenarioName('');
      toast.success('Escenario guardado');
    } catch {
      toast.error('Error al guardar escenario');
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Variables del Escenario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm">MRR Base</Label>
              <Input
                type="number"
                value={baseMrr}
                onChange={(e) => setBaseMrr(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  Churn Rate
                </Label>
                <Badge variant="outline">{variables.churnRate}%</Badge>
              </div>
              <Slider
                value={[variables.churnRate]}
                onValueChange={([v]) => setVariables(prev => ({ ...prev, churnRate: v }))}
                max={20}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  Expansion Rate
                </Label>
                <Badge variant="outline">{variables.expansionRate}%</Badge>
              </div>
              <Slider
                value={[variables.expansionRate]}
                onValueChange={([v]) => setVariables(prev => ({ ...prev, expansionRate: v }))}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Nuevo MRR/Mes</Label>
                <Badge variant="outline">{formatCurrency(variables.newBusinessMRR)}</Badge>
              </div>
              <Slider
                value={[variables.newBusinessMRR / 1000]}
                onValueChange={([v]) => setVariables(prev => ({ ...prev, newBusinessMRR: v * 1000 }))}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Cambio de Precio</Label>
                <Badge variant="outline">{variables.pricingChange > 0 ? '+' : ''}{variables.pricingChange}%</Badge>
              </div>
              <Slider
                value={[variables.pricingChange + 30]}
                onValueChange={([v]) => setVariables(prev => ({ ...prev, pricingChange: v - 30 }))}
                max={80}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Horizonte (meses)</Label>
                <Badge variant="outline">{timeHorizon}</Badge>
              </div>
              <Slider
                value={[timeHorizon]}
                onValueChange={([v]) => setTimeHorizon(v)}
                min={6}
                max={24}
                step={1}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCalculate} disabled={isCalculating} className="flex-1">
                {isCalculating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                Calcular
              </Button>
            </div>

            {projections.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <Input
                  placeholder="Nombre del escenario"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
                <Button onClick={handleSave} variant="outline" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Escenario
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Proyección de MRR</CardTitle>
          </CardHeader>
          <CardContent>
            {projections.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} className="text-xs" />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Mes ${label}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="optimistic" stroke="hsl(var(--chart-2))" strokeDasharray="5 5" name="Optimista" />
                  <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} name="Proyección" />
                  <Line type="monotone" dataKey="pessimistic" stroke="hsl(var(--chart-1))" strokeDasharray="5 5" name="Pesimista" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Configura las variables y presiona "Calcular" para ver la proyección</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {scenarios && scenarios.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Escenarios Guardados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scenarios.slice(0, 6).map((s) => (
                <div key={s.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{s.name}</span>
                    <Badge variant="secondary" className="text-xs">{s.scenario_type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    MRR Base: {formatCurrency(s.base_mrr)} • {s.time_horizon_months}m
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
