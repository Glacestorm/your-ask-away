import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const signalTypes = [
  'usage_spike',
  'feature_adoption',
  'seat_utilization',
  'api_growth',
  'integration_added',
  'power_user_emergence',
  'viral_coefficient',
  'upgrade_intent',
  'limit_approaching',
  'engagement_increase'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { companyId } = await req.json();

    // Get company with related data
    const { data: company } = await supabase
      .from('companies')
      .select('*, adoption_scores(*), health_scores(*)')
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    const adoptionScore = company.adoption_scores;
    const healthScore = company.health_scores?.[0];
    
    const detectedSignals = [];

    // 1. Usage Spike Detection
    if (adoptionScore?.engagement_score > 80) {
      detectedSignals.push({
        company_id: companyId,
        signal_type: 'usage_spike',
        signal_strength: adoptionScore.engagement_score,
        metric_name: 'engagement_score',
        metric_value: adoptionScore.engagement_score,
        metric_previous_value: 60,
        metric_change_percentage: ((adoptionScore.engagement_score - 60) / 60) * 100,
        recommended_action: 'Schedule expansion conversation - high engagement detected',
        expansion_opportunity_value: company.facturacion_anual * 0.2 || 10000
      });
    }

    // 2. Feature Adoption
    if (adoptionScore?.depth_score > 70) {
      detectedSignals.push({
        company_id: companyId,
        signal_type: 'feature_adoption',
        signal_strength: adoptionScore.depth_score,
        metric_name: 'feature_depth_score',
        metric_value: adoptionScore.depth_score,
        threshold_exceeded: 70,
        recommended_action: 'Customer using advanced features - ready for premium tier',
        expansion_opportunity_value: company.facturacion_anual * 0.15 || 7500
      });
    }

    // 3. Seat Utilization
    if (adoptionScore?.breadth_score > 75) {
      detectedSignals.push({
        company_id: companyId,
        signal_type: 'seat_utilization',
        signal_strength: adoptionScore.breadth_score,
        metric_name: 'user_breadth_score',
        metric_value: adoptionScore.breadth_score,
        threshold_exceeded: 75,
        recommended_action: 'High seat utilization - offer additional licenses',
        expansion_opportunity_value: company.facturacion_anual * 0.25 || 12500
      });
    }

    // 4. Power User Emergence
    if (adoptionScore?.stickiness_score > 80) {
      detectedSignals.push({
        company_id: companyId,
        signal_type: 'power_user_emergence',
        signal_strength: adoptionScore.stickiness_score,
        metric_name: 'stickiness_score',
        metric_value: adoptionScore.stickiness_score,
        recommended_action: 'Power users identified - engage for case study and expansion',
        expansion_opportunity_value: company.facturacion_anual * 0.1 || 5000
      });
    }

    // 5. Engagement Increase
    if (adoptionScore?.trend === 'improving' && adoptionScore?.trend_percentage > 10) {
      detectedSignals.push({
        company_id: companyId,
        signal_type: 'engagement_increase',
        signal_strength: Math.min(100, 60 + adoptionScore.trend_percentage),
        metric_name: 'engagement_trend',
        metric_value: adoptionScore.trend_percentage,
        metric_change_percentage: adoptionScore.trend_percentage,
        recommended_action: 'Growing engagement - optimal time for upsell conversation',
        expansion_opportunity_value: company.facturacion_anual * 0.18 || 9000
      });
    }

    // 6. Health Score Based Upgrade Intent
    if (healthScore?.overall_score > 85) {
      detectedSignals.push({
        company_id: companyId,
        signal_type: 'upgrade_intent',
        signal_strength: healthScore.overall_score,
        metric_name: 'health_score',
        metric_value: healthScore.overall_score,
        threshold_exceeded: 85,
        recommended_action: 'Excellent health score - ideal expansion candidate',
        expansion_opportunity_value: company.facturacion_anual * 0.3 || 15000
      });
    }

    // Add context to all signals
    const signalsWithContext = detectedSignals.map(signal => ({
      ...signal,
      signal_date: new Date().toISOString(),
      detected_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      is_active: true,
      context: {
        company_name: company.name,
        company_sector: company.sector,
        annual_revenue: company.facturacion_anual,
        overall_health: healthScore?.overall_score,
        adoption_score: adoptionScore?.overall_score
      }
    }));

    // Save signals
    if (signalsWithContext.length > 0) {
      const { error } = await supabase
        .from('plg_signals')
        .insert(signalsWithContext);

      if (error) {
        console.error('Error saving PLG signals:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      signals: signalsWithContext,
      summary: {
        totalSignals: signalsWithContext.length,
        totalOpportunityValue: signalsWithContext.reduce((sum, s) => sum + (s.expansion_opportunity_value || 0), 0),
        strongestSignal: signalsWithContext.sort((a, b) => b.signal_strength - a.signal_strength)[0]?.signal_type,
        signalTypes: signalsWithContext.map(s => s.signal_type)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in detect-plg-signals:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
