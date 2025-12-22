import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      simulationName = 'Revenue Forecast Simulation',
      simulationType = 'revenue_forecast',
      numIterations = 10000,
      timeHorizonMonths = 12,
      baseMRR,
      baseARR,
      targetValue,
      parameters = {}
    } = await req.json();

    // Get current MRR if not provided
    let currentMRR = baseMRR;
    let currentARR = baseARR;
    
    if (!currentMRR) {
      const { data: snapshot } = await supabase
        .from('mrr_snapshots')
        .select('total_mrr, total_arr')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();
      
      currentMRR = snapshot?.total_mrr || 100000;
      currentARR = snapshot?.total_arr || currentMRR * 12;
    }

    // Default parameters for simulation
    const simParams = {
      avgGrowthRate: parameters.avgGrowthRate ?? 0.05,
      growthVolatility: parameters.growthVolatility ?? 0.03,
      avgChurnRate: parameters.avgChurnRate ?? 0.03,
      churnVolatility: parameters.churnVolatility ?? 0.015,
      avgExpansionRate: parameters.avgExpansionRate ?? 0.08,
      expansionVolatility: parameters.expansionVolatility ?? 0.04,
      seasonalityFactor: parameters.seasonalityFactor ?? 0.1,
      ...parameters
    };

    // Run Monte Carlo simulation
    const results: number[] = [];
    
    for (let i = 0; i < numIterations; i++) {
      let mrr = currentMRR;
      
      for (let month = 0; month < timeHorizonMonths; month++) {
        // Generate random factors with normal distribution approximation
        const growthRandom = gaussianRandom() * simParams.growthVolatility + simParams.avgGrowthRate;
        const churnRandom = Math.max(0, gaussianRandom() * simParams.churnVolatility + simParams.avgChurnRate);
        const expansionRandom = Math.max(0, gaussianRandom() * simParams.expansionVolatility + simParams.avgExpansionRate);
        
        // Apply seasonality
        const seasonality = 1 + simParams.seasonalityFactor * Math.sin((month / 12) * 2 * Math.PI);
        
        // Calculate monthly change
        const newBusiness = mrr * growthRandom * seasonality;
        const expansion = mrr * expansionRandom;
        const churn = mrr * churnRandom;
        
        mrr = mrr + newBusiness + expansion - churn;
        mrr = Math.max(0, mrr); // Ensure non-negative
      }
      
      results.push(mrr);
    }

    // Sort results for percentile calculation
    results.sort((a, b) => a - b);

    // Calculate statistics
    const mean = results.reduce((a, b) => a + b, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDeviation = Math.sqrt(variance);

    const percentile10 = results[Math.floor(results.length * 0.10)];
    const percentile25 = results[Math.floor(results.length * 0.25)];
    const percentile50 = results[Math.floor(results.length * 0.50)];
    const percentile75 = results[Math.floor(results.length * 0.75)];
    const percentile90 = results[Math.floor(results.length * 0.90)];

    const worstCase = results[0];
    const bestCase = results[results.length - 1];
    const ci95Low = results[Math.floor(results.length * 0.025)];
    const ci95High = results[Math.floor(results.length * 0.975)];

    // Probability of hitting target
    let probabilityOfTarget = 0;
    if (targetValue) {
      const aboveTarget = results.filter(r => r >= targetValue).length;
      probabilityOfTarget = (aboveTarget / results.length) * 100;
    }

    // Create distribution buckets for visualization
    const numBuckets = 50;
    const minResult = worstCase;
    const maxResult = bestCase;
    const bucketSize = (maxResult - minResult) / numBuckets;
    
    const distributionData = Array(numBuckets).fill(0).map((_, i) => {
      const bucketMin = minResult + i * bucketSize;
      const bucketMax = bucketMin + bucketSize;
      const count = results.filter(r => r >= bucketMin && r < bucketMax).length;
      return {
        range: `${Math.round(bucketMin / 1000)}K - ${Math.round(bucketMax / 1000)}K`,
        min: Math.round(bucketMin),
        max: Math.round(bucketMax),
        count,
        probability: (count / results.length) * 100
      };
    });

    // Key risk factors
    const keyRiskFactors = [
      { factor: 'Churn Rate Increase', impact: simParams.churnVolatility * currentMRR * 12, probability: 30 },
      { factor: 'Growth Slowdown', impact: simParams.growthVolatility * currentMRR * 6, probability: 25 },
      { factor: 'Market Downturn', impact: currentMRR * 0.15, probability: 20 },
      { factor: 'Competitive Pressure', impact: currentMRR * 0.10, probability: 35 }
    ];

    // Sensitivity analysis
    const sensitivityAnalysis = {
      growth_rate: {
        low: percentile10 - mean,
        high: percentile90 - mean,
        sensitivity: ((percentile90 - percentile10) / mean) * 100
      },
      churn_rate: {
        impact_per_1pct: currentMRR * 12 * 0.01,
        critical_threshold: simParams.avgChurnRate + simParams.churnVolatility * 2
      },
      expansion_rate: {
        impact_per_1pct: currentMRR * 12 * 0.01,
        optimal_scenario: simParams.avgExpansionRate + simParams.expansionVolatility
      }
    };

    const simulation = {
      simulation_name: simulationName,
      simulation_type: simulationType,
      num_iterations: numIterations,
      time_horizon_months: timeHorizonMonths,
      input_parameters: simParams,
      base_mrr: currentMRR,
      base_arr: currentARR,
      results_summary: {
        iterations: numIterations,
        horizon_months: timeHorizonMonths,
        start_mrr: currentMRR,
        projected_arr_range: {
          low: percentile10 * 12,
          expected: percentile50 * 12,
          high: percentile90 * 12
        }
      },
      percentile_10: Math.round(percentile10),
      percentile_25: Math.round(percentile25),
      percentile_50: Math.round(percentile50),
      percentile_75: Math.round(percentile75),
      percentile_90: Math.round(percentile90),
      mean_outcome: Math.round(mean),
      std_deviation: Math.round(stdDeviation),
      probability_of_target: Math.round(probabilityOfTarget * 10) / 10,
      target_value: targetValue,
      worst_case: Math.round(worstCase),
      best_case: Math.round(bestCase),
      confidence_interval_95_low: Math.round(ci95Low),
      confidence_interval_95_high: Math.round(ci95High),
      key_risk_factors: keyRiskFactors,
      sensitivity_analysis: sensitivityAnalysis,
      distribution_data: distributionData
    };

    // Save simulation
    const { data: savedSimulation, error } = await supabase
      .from('monte_carlo_simulations')
      .insert([simulation])
      .select()
      .single();

    if (error) {
      console.error('Error saving simulation:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      simulation: savedSimulation || simulation,
      insights: {
        expectedOutcome: `Expected MRR in ${timeHorizonMonths} months: $${Math.round(percentile50 / 1000)}K`,
        confidenceRange: `95% confidence: $${Math.round(ci95Low / 1000)}K - $${Math.round(ci95High / 1000)}K`,
        riskLevel: stdDeviation / mean > 0.3 ? 'high' : stdDeviation / mean > 0.15 ? 'medium' : 'low',
        growthProbability: ((results.filter(r => r > currentMRR).length / results.length) * 100).toFixed(1) + '%'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in run-monte-carlo:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Box-Muller transform for Gaussian random numbers
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
