import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, Minus, Sparkles, FileDown, FileSpreadsheet, Brain, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useFinancialPlan } from '@/hooks/useStrategicPlanning';
import { useStrategicAI } from '@/hooks/useStrategicAI';
import { ScenarioCharts } from './ScenarioCharts';
import { generateViabilityPDF, downloadPDF, printPDF } from './PDFGenerator';
import { exportScenariosToExcel } from '@/lib/excelExport';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const SCENARIO_TYPES = {
  optimistic: { label: 'Optimista', icon: TrendingUp, color: 'text-green-500', multiplier: 1.2 },
  realistic: { label: 'Realista', icon: Minus, color: 'text-blue-500', multiplier: 1.0 },
  pessimistic: { label: 'Pesimista', icon: TrendingDown, color: 'text-red-500', multiplier: 0.8 }
};

export function ScenarioSimulator() {
  const { plans, currentPlan, setCurrentPlan, scenarios, createScenario, fetchPlanDetails } = useFinancialPlan();
  const { predictScenarios, isLoading: isAIPredicting } = useStrategicAI();
  const [variables, setVariables] = useState({
    revenueGrowth: 10,
    costReduction: 5,
    investmentLevel: 50,
    marketExpansion: 20
  });
  const [aiPredictions, setAIPredictions] = useState<any[]>([]);

  const handleCreateScenarios = async () => {
    if (!currentPlan) return;
    
    for (const [type, config] of Object.entries(SCENARIO_TYPES)) {
      await createScenario(currentPlan.id, {
        scenario_name: `Escenario ${config.label}`,
        scenario_type: type,
        variables: {
          revenue_growth: variables.revenueGrowth * config.multiplier,
          cost_reduction: variables.costReduction * config.multiplier,
          investment_level: variables.investmentLevel,
          market_expansion: variables.marketExpansion * config.multiplier
        }
      });
    }
  };

  const handleAIPrediction = async () => {
    if (!currentPlan) return;
    
    // Build baseline data from variables
    const years = currentPlan.projection_years;
    const baseRevenue = 100000; // Base revenue for projection
    const revenues = Array.from({ length: years }, (_, i) => 
      baseRevenue * Math.pow(1 + variables.revenueGrowth / 100, i + 1)
    );
    const costs = revenues.map(r => r * (1 - variables.costReduction / 100) * 0.7);
    const investments = Array.from({ length: years }, () => 
      baseRevenue * (variables.investmentLevel / 100)
    );
    
    const predictions = await predictScenarios(currentPlan.id, {
      revenues,
      costs,
      investments,
      sector_key: (currentPlan as any).sector_key || 'general'
    });
    
    if (predictions.length > 0) {
      setAIPredictions(predictions);
      
      // Create scenarios from AI predictions
      for (const pred of predictions) {
        await createScenario(currentPlan.id, {
          scenario_name: `IA: ${SCENARIO_TYPES[pred.scenario_type]?.label || pred.scenario_type}`,
          scenario_type: pred.scenario_type,
          variables: { 
            ai_generated: true,
            probability: pred.probability,
            key_assumptions: pred.key_assumptions 
          },
          npv: pred.projected_metrics.npv,
          irr: pred.projected_metrics.irr / 100,
          breakeven_year: pred.projected_metrics.breakeven_year
        });
      }
    }
  };

  if (!currentPlan) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Simulador de Escenarios</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Simula escenarios optimista, realista y pesimista para tu plan financiero.</p>
          <p className="text-sm">Primero selecciona un plan financiero en la pestaña "Modelo Financiero".</p>
          
          <div className="grid gap-4 md:grid-cols-3">
            {plans.slice(0, 3).map(plan => (
              <Card key={plan.id} className="cursor-pointer hover:border-primary" onClick={() => { setCurrentPlan(plan); fetchPlanDetails(plan.id); }}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{plan.plan_name}</h3>
                  <Badge variant="outline" className="mt-2">{plan.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const years = Array.from({ length: currentPlan.projection_years }, (_, i) => currentPlan.start_year + i);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Simulador de Escenarios</h2>
          <p className="text-sm text-muted-foreground">Plan: {currentPlan.plan_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentPlan(null)}>Cambiar Plan</Button>
          <Button onClick={handleCreateScenarios} className="gap-2"><Sparkles className="h-4 w-4" /> Generar Escenarios</Button>
          <Button onClick={handleAIPrediction} disabled={isAIPredicting} variant="secondary" className="gap-2">
            {isAIPredicting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Predicción IA
          </Button>
          
          {/* Export Dropdown */}
          {scenarios.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  const doc = generateViabilityPDF(currentPlan.plan_name, scenarios);
                  downloadPDF(doc, `${currentPlan.plan_name}_Viabilidad.pdf`);
                  toast.success('PDF descargado');
                }}>
                  <FileDown className="h-4 w-4 mr-2" /> Descargar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const doc = generateViabilityPDF(currentPlan.plan_name, scenarios);
                  printPDF(doc);
                }}>
                  <FileDown className="h-4 w-4 mr-2" /> Imprimir PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  exportScenariosToExcel(currentPlan.plan_name, scenarios, years);
                  toast.success('Excel descargado');
                }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Variables de Simulación</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Crecimiento de Ingresos</span><span className="font-medium">{variables.revenueGrowth}%</span></div>
              <Slider value={[variables.revenueGrowth]} onValueChange={([v]) => setVariables(p => ({ ...p, revenueGrowth: v }))} min={-20} max={50} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Reducción de Costes</span><span className="font-medium">{variables.costReduction}%</span></div>
              <Slider value={[variables.costReduction]} onValueChange={([v]) => setVariables(p => ({ ...p, costReduction: v }))} min={0} max={30} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Nivel de Inversión</span><span className="font-medium">{variables.investmentLevel}%</span></div>
              <Slider value={[variables.investmentLevel]} onValueChange={([v]) => setVariables(p => ({ ...p, investmentLevel: v }))} min={0} max={100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Expansión de Mercado</span><span className="font-medium">{variables.marketExpansion}%</span></div>
              <Slider value={[variables.marketExpansion]} onValueChange={([v]) => setVariables(p => ({ ...p, marketExpansion: v }))} min={0} max={100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Escenarios Generados</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {scenarios.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay escenarios generados. Usa el botón "Generar Escenarios".</p>
            ) : (
              scenarios.map(scenario => {
                const config = SCENARIO_TYPES[scenario.scenario_type as keyof typeof SCENARIO_TYPES] || SCENARIO_TYPES.realistic;
                const Icon = config.icon;
                return (
                  <div key={scenario.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <span className="font-medium">{scenario.scenario_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>VAN: <span className="font-medium">{scenario.npv?.toLocaleString() || 'N/A'} €</span></div>
                      <div>TIR: <span className="font-medium">{scenario.irr ? `${(scenario.irr * 100).toFixed(1)}%` : 'N/A'}</span></div>
                      <div>Breakeven: <span className="font-medium">{scenario.breakeven_year || 'N/A'}</span></div>
                      <div>Payback: <span className="font-medium">{scenario.payback_period?.toFixed(1) || 'N/A'} años</span></div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <ScenarioCharts scenarios={scenarios} years={years} />
    </div>
  );
}
