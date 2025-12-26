/**
 * What-If Simulator
 * Simulador de escenarios para métricas CS
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Target,
  RefreshCw,
  Download,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

interface SimulationParams {
  currentMRR: number;
  currentChurn: number;
  currentExpansion: number;
  currentNPS: number;
  simulatedChurn: number;
  simulatedExpansion: number;
  simulatedNPS: number;
  months: number;
}

const defaultParams: SimulationParams = {
  currentMRR: 500000,
  currentChurn: 5,
  currentExpansion: 15,
  currentNPS: 45,
  simulatedChurn: 5,
  simulatedExpansion: 15,
  simulatedNPS: 45,
  months: 12,
};

export function WhatIfSimulator() {
  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [activeScenario, setActiveScenario] = useState<'custom' | 'optimistic' | 'conservative'>('custom');

  const updateParam = useCallback((key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setActiveScenario('custom');
  }, []);

  const applyScenario = useCallback((scenario: 'optimistic' | 'conservative') => {
    if (scenario === 'optimistic') {
      setParams(prev => ({
        ...prev,
        simulatedChurn: Math.max(prev.currentChurn - 2, 1),
        simulatedExpansion: prev.currentExpansion + 10,
        simulatedNPS: Math.min(prev.currentNPS + 20, 100),
      }));
    } else {
      setParams(prev => ({
        ...prev,
        simulatedChurn: prev.currentChurn + 2,
        simulatedExpansion: Math.max(prev.currentExpansion - 5, 0),
        simulatedNPS: Math.max(prev.currentNPS - 15, -100),
      }));
    }
    setActiveScenario(scenario);
  }, []);

  const resetParams = useCallback(() => {
    setParams(prev => ({
      ...prev,
      simulatedChurn: prev.currentChurn,
      simulatedExpansion: prev.currentExpansion,
      simulatedNPS: prev.currentNPS,
    }));
    setActiveScenario('custom');
  }, []);

  // Calculate projections
  const projections = useMemo(() => {
    const baseGrowthRate = (params.currentExpansion - params.currentChurn) / 100;
    const simulatedGrowthRate = (params.simulatedExpansion - params.simulatedChurn) / 100;
    
    const data = [];
    let baseMRR = params.currentMRR;
    let simulatedMRR = params.currentMRR;
    
    for (let i = 0; i <= params.months; i++) {
      data.push({
        month: i === 0 ? 'Actual' : `M${i}`,
        baseline: Math.round(baseMRR),
        simulated: Math.round(simulatedMRR),
        difference: Math.round(simulatedMRR - baseMRR),
      });
      
      baseMRR *= (1 + baseGrowthRate / 12);
      simulatedMRR *= (1 + simulatedGrowthRate / 12);
    }
    
    return data;
  }, [params]);

  const impact = useMemo(() => {
    const final = projections[projections.length - 1];
    const mrrDiff = final.simulated - final.baseline;
    const arrDiff = mrrDiff * 12;
    const percentDiff = ((final.simulated / final.baseline) - 1) * 100;
    
    const nrrBaseline = 100 + params.currentExpansion - params.currentChurn;
    const nrrSimulated = 100 + params.simulatedExpansion - params.simulatedChurn;
    
    return {
      mrrDiff,
      arrDiff,
      percentDiff,
      nrrBaseline,
      nrrSimulated,
      nrrDiff: nrrSimulated - nrrBaseline,
    };
  }, [projections, params]);

  const comparisonData = useMemo(() => [
    { name: 'Churn %', baseline: params.currentChurn, simulated: params.simulatedChurn, better: params.simulatedChurn < params.currentChurn },
    { name: 'Expansion %', baseline: params.currentExpansion, simulated: params.simulatedExpansion, better: params.simulatedExpansion > params.currentExpansion },
    { name: 'NPS', baseline: params.currentNPS, simulated: params.simulatedNPS, better: params.simulatedNPS > params.currentNPS },
    { name: 'NRR %', baseline: impact.nrrBaseline, simulated: impact.nrrSimulated, better: impact.nrrSimulated > impact.nrrBaseline },
  ], [params, impact]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">What-If Simulator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Simula escenarios y visualiza el impacto en tu revenue
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={activeScenario === 'optimistic' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => applyScenario('optimistic')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Optimista
            </Button>
            <Button 
              variant={activeScenario === 'conservative' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => applyScenario('conservative')}
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              Conservador
            </Button>
            <Button variant="ghost" size="sm" onClick={resetParams}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Parámetros de Simulación
              </h4>
              
              <div className="space-y-6">
                {/* Churn Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Churn Rate</span>
                    <span className="font-medium">
                      {params.currentChurn}% → <span className={cn(
                        params.simulatedChurn < params.currentChurn ? "text-emerald-500" : 
                        params.simulatedChurn > params.currentChurn ? "text-red-500" : ""
                      )}>{params.simulatedChurn}%</span>
                    </span>
                  </div>
                  <Slider
                    value={[params.simulatedChurn]}
                    onValueChange={([v]) => updateParam('simulatedChurn', v)}
                    max={15}
                    min={0.5}
                    step={0.5}
                    className="py-2"
                  />
                </div>

                {/* Expansion Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expansion Rate</span>
                    <span className="font-medium">
                      {params.currentExpansion}% → <span className={cn(
                        params.simulatedExpansion > params.currentExpansion ? "text-emerald-500" : 
                        params.simulatedExpansion < params.currentExpansion ? "text-red-500" : ""
                      )}>{params.simulatedExpansion}%</span>
                    </span>
                  </div>
                  <Slider
                    value={[params.simulatedExpansion]}
                    onValueChange={([v]) => updateParam('simulatedExpansion', v)}
                    max={50}
                    min={0}
                    step={1}
                    className="py-2"
                  />
                </div>

                {/* NPS Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">NPS Score</span>
                    <span className="font-medium">
                      {params.currentNPS} → <span className={cn(
                        params.simulatedNPS > params.currentNPS ? "text-emerald-500" : 
                        params.simulatedNPS < params.currentNPS ? "text-red-500" : ""
                      )}>{params.simulatedNPS}</span>
                    </span>
                  </div>
                  <Slider
                    value={[params.simulatedNPS]}
                    onValueChange={([v]) => updateParam('simulatedNPS', v)}
                    max={100}
                    min={-100}
                    step={5}
                    className="py-2"
                  />
                </div>

                {/* Months Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Proyección (meses)</span>
                    <span className="font-medium">{params.months}</span>
                  </div>
                  <Slider
                    value={[params.months]}
                    onValueChange={([v]) => updateParam('months', v)}
                    max={36}
                    min={6}
                    step={6}
                    className="py-2"
                  />
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="baseline" name="Actual" fill="hsl(var(--muted-foreground))" opacity={0.5} />
                  <Bar dataKey="simulated" name="Simulado">
                    {comparisonData.map((entry, index) => (
                      <Cell key={index} fill={entry.better ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Impact Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={cn(
                "p-4 rounded-xl border",
                impact.mrrDiff >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"
              )}>
                <p className="text-xs text-muted-foreground mb-1">Impacto MRR</p>
                <p className={cn(
                  "text-xl font-bold",
                  impact.mrrDiff >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {impact.mrrDiff >= 0 ? '+' : ''}{(impact.mrrDiff / 1000).toFixed(0)}K€
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-xl border",
                impact.arrDiff >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"
              )}>
                <p className="text-xs text-muted-foreground mb-1">Impacto ARR</p>
                <p className={cn(
                  "text-xl font-bold",
                  impact.arrDiff >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {impact.arrDiff >= 0 ? '+' : ''}{(impact.arrDiff / 1000).toFixed(0)}K€
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-xl border",
                impact.nrrDiff >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"
              )}>
                <p className="text-xs text-muted-foreground mb-1">NRR Simulado</p>
                <p className={cn(
                  "text-xl font-bold",
                  impact.nrrSimulated >= 100 ? "text-emerald-600" : "text-red-600"
                )}>
                  {impact.nrrSimulated}%
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-xl border",
                impact.percentDiff >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"
              )}>
                <p className="text-xs text-muted-foreground mb-1">Crecimiento</p>
                <p className={cn(
                  "text-xl font-bold",
                  impact.percentDiff >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {impact.percentDiff >= 0 ? '+' : ''}{impact.percentDiff.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Projection Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projections}>
                  <defs>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSimulated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toLocaleString()}`, '']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="baseline" 
                    name="Escenario Base"
                    stroke="hsl(var(--muted-foreground))" 
                    fillOpacity={1}
                    fill="url(#colorBaseline)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="simulated" 
                    name="Escenario Simulado"
                    stroke="hsl(262 83% 58%)" 
                    fillOpacity={1}
                    fill="url(#colorSimulated)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* AI Insights */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/20">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Insights del Simulador
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-2">Para lograr el escenario simulado:</p>
                  <ul className="space-y-1">
                    {params.simulatedChurn < params.currentChurn && (
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-emerald-500" />
                        Reducir churn en {(params.currentChurn - params.simulatedChurn).toFixed(1)} puntos
                      </li>
                    )}
                    {params.simulatedExpansion > params.currentExpansion && (
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-emerald-500" />
                        Aumentar expansion en {params.simulatedExpansion - params.currentExpansion} puntos
                      </li>
                    )}
                    {params.simulatedNPS > params.currentNPS && (
                      <li className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-emerald-500" />
                        Mejorar NPS en {params.simulatedNPS - params.currentNPS} puntos
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Acciones recomendadas:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-primary" />
                      Implementar programa proactivo de retención
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-primary" />
                      Automatizar identificación de oportunidades de upsell
                    </li>
                    <li className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3 text-primary" />
                      Crear playbooks de expansion por segmento
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WhatIfSimulator;
