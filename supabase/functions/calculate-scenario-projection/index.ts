import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScenarioVariables {
  churnRate: number;          // Monthly churn rate (0-100%)
  expansionRate: number;      // Monthly expansion rate (0-100%)
  newBusinessMRR: number;     // New MRR per month
  pricingChange: number;      // Pricing change percentage (-100% to +100%)
  seasonalityFactor?: number; // Seasonal adjustment (0.5 to 1.5)
}

interface ProjectionMonth {
  month: number;
  date: string;
  mrr: number;
  arr: number;
  churnMRR: number;
  expansionMRR: number;
  newMRR: number;
  netNewMRR: number;
  cumulativeGrowth: number;
  nrr: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      baseMRR, 
      variables, 
      timeHorizonMonths = 12,
      scenarioName,
      saveScenario = false
    } = await req.json() as {
      baseMRR: number;
      variables: ScenarioVariables;
      timeHorizonMonths: number;
      scenarioName?: string;
      saveScenario?: boolean;
    };

    if (!baseMRR || baseMRR <= 0) {
      throw new Error('baseMRR must be a positive number');
    }

    // Calculate projections
    const projections = calculateProjections(baseMRR, variables, timeHorizonMonths);
    
    // Calculate confidence intervals
    const confidenceIntervals = calculateConfidenceIntervals(projections, variables);
    
    // Calculate key metrics
    const metrics = calculateMetrics(projections, baseMRR);

    // Identify risks and opportunities
    const analysis = analyzeScenario(projections, variables, metrics);

    const result = {
      projections,
      confidenceIntervals,
      metrics,
      analysis,
      variables,
      baseMRR,
      timeHorizonMonths
    };

    // Save scenario if requested
    if (saveScenario && scenarioName) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('revenue_scenarios')
        .insert({
          name: scenarioName,
          scenario_type: 'what-if',
          base_mrr: baseMRR,
          variables,
          projections: result,
          time_horizon_months: timeHorizonMonths,
          confidence_level: 0.8,
          assumptions: analysis.assumptions,
          risks: analysis.risks
        });

      if (error) {
        console.error('Error saving scenario:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in calculate-scenario-projection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateProjections(
  baseMRR: number, 
  variables: ScenarioVariables, 
  months: number
): ProjectionMonth[] {
  const projections: ProjectionMonth[] = [];
  let currentMRR = baseMRR;
  
  // Apply pricing change to base
  const pricingMultiplier = 1 + (variables.pricingChange / 100);
  currentMRR *= pricingMultiplier;
  
  const today = new Date();
  
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(today);
    monthDate.setMonth(today.getMonth() + i);
    
    // Apply seasonality if provided
    const seasonality = variables.seasonalityFactor || 1;
    const seasonalAdjustment = 1 + (Math.sin((i / 12) * 2 * Math.PI) * (seasonality - 1) * 0.3);
    
    // Calculate monthly changes
    const churnMRR = currentMRR * (variables.churnRate / 100);
    const expansionMRR = currentMRR * (variables.expansionRate / 100) * seasonalAdjustment;
    const newMRR = variables.newBusinessMRR * seasonalAdjustment;
    
    const netNewMRR = newMRR + expansionMRR - churnMRR;
    const previousMRR = currentMRR;
    currentMRR = currentMRR + netNewMRR;
    
    // Ensure MRR doesn't go negative
    currentMRR = Math.max(0, currentMRR);
    
    // Calculate NRR for the month
    const nrr = previousMRR > 0 
      ? ((previousMRR - churnMRR + expansionMRR) / previousMRR) * 100 
      : 100;
    
    projections.push({
      month: i + 1,
      date: monthDate.toISOString().split('T')[0],
      mrr: Math.round(currentMRR),
      arr: Math.round(currentMRR * 12),
      churnMRR: Math.round(churnMRR),
      expansionMRR: Math.round(expansionMRR),
      newMRR: Math.round(newMRR),
      netNewMRR: Math.round(netNewMRR),
      cumulativeGrowth: Math.round(((currentMRR - baseMRR) / baseMRR) * 100 * 10) / 10,
      nrr: Math.round(nrr * 10) / 10
    });
  }
  
  return projections;
}

function calculateConfidenceIntervals(
  projections: ProjectionMonth[], 
  variables: ScenarioVariables
): { optimistic: number[]; pessimistic: number[]; expected: number[] } {
  // Calculate uncertainty based on variable volatility
  const uncertainty = 0.1 + (variables.churnRate / 100) * 0.2;
  
  return {
    expected: projections.map(p => p.mrr),
    optimistic: projections.map((p, i) => Math.round(p.mrr * (1 + uncertainty * Math.sqrt(i + 1) * 0.3))),
    pessimistic: projections.map((p, i) => Math.round(p.mrr * (1 - uncertainty * Math.sqrt(i + 1) * 0.3)))
  };
}

function calculateMetrics(projections: ProjectionMonth[], baseMRR: number) {
  const lastMonth = projections[projections.length - 1];
  const firstMonth = projections[0];
  
  const totalChurn = projections.reduce((sum, p) => sum + p.churnMRR, 0);
  const totalExpansion = projections.reduce((sum, p) => sum + p.expansionMRR, 0);
  const totalNewBusiness = projections.reduce((sum, p) => sum + p.newMRR, 0);
  
  const avgMonthlyGrowth = projections.length > 1
    ? (lastMonth.mrr - firstMonth.mrr) / (projections.length - 1)
    : 0;
  
  const avgNRR = projections.reduce((sum, p) => sum + p.nrr, 0) / projections.length;
  
  // Time to double
  const monthlyGrowthRate = avgMonthlyGrowth / baseMRR;
  const timeToDouble = monthlyGrowthRate > 0 
    ? Math.log(2) / Math.log(1 + monthlyGrowthRate)
    : null;

  return {
    endingMRR: lastMonth.mrr,
    endingARR: lastMonth.arr,
    totalGrowth: lastMonth.cumulativeGrowth,
    totalChurn,
    totalExpansion,
    totalNewBusiness,
    netRevenue: totalNewBusiness + totalExpansion - totalChurn,
    avgMonthlyGrowth: Math.round(avgMonthlyGrowth),
    avgNRR: Math.round(avgNRR * 10) / 10,
    timeToDouble: timeToDouble ? Math.round(timeToDouble * 10) / 10 : null,
    breakEvenMonth: projections.findIndex(p => p.netNewMRR < 0) + 1 || null
  };
}

function analyzeScenario(
  projections: ProjectionMonth[], 
  variables: ScenarioVariables,
  metrics: ReturnType<typeof calculateMetrics>
) {
  const assumptions: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];
  
  // Assumptions
  assumptions.push(`Churn mensual constante del ${variables.churnRate}%`);
  assumptions.push(`Tasa de expansión mensual del ${variables.expansionRate}%`);
  assumptions.push(`Nuevo negocio de €${variables.newBusinessMRR.toLocaleString()}/mes`);
  if (variables.pricingChange !== 0) {
    assumptions.push(`Cambio de pricing del ${variables.pricingChange > 0 ? '+' : ''}${variables.pricingChange}%`);
  }
  
  // Risk analysis
  if (variables.churnRate > 5) {
    risks.push('Churn rate elevado puede comprometer crecimiento sostenible');
  }
  if (metrics.avgNRR < 100) {
    risks.push('NRR bajo 100% indica contracción de base de clientes');
  }
  if (metrics.totalGrowth < 0) {
    risks.push('Proyección muestra decrecimiento de ingresos');
  }
  if (variables.churnRate > variables.expansionRate) {
    risks.push('Churn supera expansión, insostenible a largo plazo');
  }
  
  // Opportunities
  if (variables.expansionRate > 3) {
    opportunities.push('Alta tasa de expansión indica buen product-market fit');
  }
  if (metrics.avgNRR > 110) {
    opportunities.push('NRR excelente, enfocarse en retención');
  }
  if (metrics.timeToDouble && metrics.timeToDouble < 24) {
    opportunities.push(`Potencial de duplicar MRR en ${metrics.timeToDouble} meses`);
  }
  
  return {
    assumptions,
    risks,
    opportunities,
    recommendation: generateRecommendation(variables, metrics, risks, opportunities)
  };
}

function generateRecommendation(
  variables: ScenarioVariables,
  metrics: ReturnType<typeof calculateMetrics>,
  risks: string[],
  opportunities: string[]
): string {
  if (risks.length === 0 && opportunities.length > 0) {
    return 'Escenario optimista. Mantener estrategia actual y explorar oportunidades de aceleración.';
  }
  
  if (risks.length > opportunities.length) {
    if (variables.churnRate > 5) {
      return 'Priorizar iniciativas de retención antes de escalar adquisición.';
    }
    return 'Revisar estrategia de pricing y propuesta de valor para mejorar métricas.';
  }
  
  if (metrics.avgNRR > 100) {
    return 'Enfoque en expansión de cuentas existentes ofrece mejor ROI que nueva adquisición.';
  }
  
  return 'Balancear inversión entre adquisición y retención según capacidad operativa.';
}
