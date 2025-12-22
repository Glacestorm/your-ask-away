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

    const { companyId, companyData } = await req.json();

    // Get company data if not provided
    let company = companyData;
    if (!company && companyId) {
      const { data } = await supabase
        .from('companies')
        .select('*, health_scores(*), adoption_scores(*)')
        .eq('id', companyId)
        .single();
      company = data;
    }

    if (!company) {
      throw new Error('Company data required');
    }

    // Get revenue events for this company
    const { data: revenueEvents } = await supabase
      .from('revenue_events')
      .select('*')
      .eq('company_id', companyId)
      .order('event_date', { ascending: true });

    // Calculate metrics
    const currentMRR = revenueEvents?.reduce((sum, e) => sum + (e.mrr_after || 0), 0) || company.facturacion_anual / 12 || 5000;
    const monthsAsCustomer = revenueEvents?.length || 12;
    
    // Health and engagement scores
    const healthScore = company.health_scores?.[0]?.overall_score || 70;
    const engagementScore = company.adoption_scores?.engagement_score || 65;
    const featureUsageScore = company.adoption_scores?.depth_score || 60;
    
    // Churn probability based on health
    const churnProbability = Math.max(5, 100 - healthScore);
    
    // Expected lifetime in months (based on churn probability)
    const monthlyChurnRate = churnProbability / 100 / 12;
    const expectedLifetimeMonths = monthlyChurnRate > 0 ? 1 / monthlyChurnRate : 60;
    
    // LTV Calculation: MRR * Expected Lifetime * (1 + Expansion Rate)
    const expansionMultiplier = engagementScore > 70 ? 1.3 : engagementScore > 50 ? 1.15 : 1.0;
    const predictedLTV = currentMRR * expectedLifetimeMonths * expansionMultiplier;
    
    // Confidence interval
    const volatility = 0.25;
    const ltvConfidenceLow = predictedLTV * (1 - volatility);
    const ltvConfidenceHigh = predictedLTV * (1 + volatility);
    
    // CAC estimation (typically 1/3 of first year revenue)
    const estimatedCAC = currentMRR * 4;
    const ltvCacRatio = estimatedCAC > 0 ? predictedLTV / estimatedCAC : 3;
    
    // Payback period
    const paybackMonths = estimatedCAC / currentMRR;
    
    // Expansion probability
    const expansionProbability = Math.min(95, healthScore * 0.6 + engagementScore * 0.4);

    // Segment based on LTV
    let segment = 'standard';
    if (predictedLTV > 500000) segment = 'enterprise';
    else if (predictedLTV > 100000) segment = 'mid_market';
    else if (predictedLTV > 25000) segment = 'smb';
    else segment = 'startup';

    const prediction = {
      company_id: companyId,
      prediction_date: new Date().toISOString().split('T')[0],
      predicted_ltv: Math.round(predictedLTV),
      ltv_confidence_low: Math.round(ltvConfidenceLow),
      ltv_confidence_high: Math.round(ltvConfidenceHigh),
      confidence_score: 75,
      cac: Math.round(estimatedCAC),
      ltv_cac_ratio: Math.round(ltvCacRatio * 10) / 10,
      payback_months: Math.round(paybackMonths * 10) / 10,
      expected_lifetime_months: Math.round(expectedLifetimeMonths),
      churn_probability: Math.round(churnProbability),
      expansion_probability: Math.round(expansionProbability),
      health_score: healthScore,
      engagement_score: engagementScore,
      feature_usage_score: featureUsageScore,
      input_features: {
        currentMRR,
        monthsAsCustomer,
        healthScore,
        engagementScore,
        revenueEventsCount: revenueEvents?.length || 0
      },
      model_version: 'v1.0-ml',
      segment
    };

    // Save prediction
    const { data: savedPrediction, error } = await supabase
      .from('ltv_predictions')
      .insert([prediction])
      .select()
      .single();

    if (error) {
      console.error('Error saving LTV prediction:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      prediction: savedPrediction || prediction,
      insights: {
        ltvTier: segment,
        healthStatus: healthScore >= 70 ? 'healthy' : healthScore >= 50 ? 'at_risk' : 'critical',
        recommendation: ltvCacRatio >= 3 ? 'expand' : ltvCacRatio >= 1 ? 'retain' : 'evaluate'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in predict-ltv:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
