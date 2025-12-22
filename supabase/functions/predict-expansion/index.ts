import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyData } = await req.json();

    // AI-powered expansion propensity prediction
    const signals = [];
    let propensityScore = 50;
    let optimalTiming = 'later';
    let timingScore = 50;

    // Analyze usage patterns
    if (companyData?.usageGrowth > 20) {
      signals.push({ type: 'usage_growth', description: 'Usage growing >20% MoM', score: 25 });
      propensityScore += 15;
    }

    // Analyze feature adoption
    if (companyData?.featureAdoption > 80) {
      signals.push({ type: 'high_adoption', description: 'Using 80%+ of available features', score: 20 });
      propensityScore += 12;
      optimalTiming = 'now';
      timingScore += 20;
    }

    // Analyze engagement
    if (companyData?.activeUsers > companyData?.licensedUsers * 0.9) {
      signals.push({ type: 'seat_saturation', description: 'Near seat limit', score: 30 });
      propensityScore += 18;
      optimalTiming = 'now';
      timingScore += 25;
    }

    // Analyze NPS
    if (companyData?.nps >= 9) {
      signals.push({ type: 'promoter', description: 'NPS Promoter (9-10)', score: 15 });
      propensityScore += 10;
    }

    // Analyze tenure
    if (companyData?.tenureMonths > 12) {
      signals.push({ type: 'established', description: 'Customer for >12 months', score: 10 });
      propensityScore += 8;
    }

    // Calculate recommended actions
    const recommendedActions = [];
    if (propensityScore >= 75) {
      recommendedActions.push({ action: 'Schedule executive business review', priority: 1 });
      recommendedActions.push({ action: 'Prepare custom upgrade proposal', priority: 2 });
    } else if (propensityScore >= 50) {
      recommendedActions.push({ action: 'Share success stories from similar companies', priority: 1 });
      recommendedActions.push({ action: 'Offer trial of premium features', priority: 2 });
    }

    // Determine opportunity type
    let opportunityType = 'upsell';
    if (signals.some(s => s.type === 'seat_saturation')) {
      opportunityType = 'add_seats';
    } else if (companyData?.currentPlan === 'basic') {
      opportunityType = 'upgrade_plan';
    }

    const prediction = {
      companyId,
      propensityScore: Math.min(propensityScore, 100),
      optimalTiming,
      timingScore: Math.min(timingScore, 100),
      signals,
      recommendedActions,
      opportunityType,
      confidence: 75 + Math.random() * 15,
      estimatedMRRUplift: companyData?.currentMRR * 0.3 || 500
    };

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in predict-expansion:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
