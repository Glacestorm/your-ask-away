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

    const { limit = 50 } = await req.json();

    // Get companies with scores and related data
    const { data: companies } = await supabase
      .from('companies')
      .select(`
        id, name, facturacion_anual, sector,
        revenue_scores(
          overall_score, health_score, expansion_score, 
          retention_score, prioritization_quadrant,
          score_trend, ai_recommendation
        ),
        ltv_predictions(predicted_ltv, ltv_cac_ratio, churn_probability),
        plg_signals(signal_type, signal_strength, expansion_opportunity_value)
      `)
      .limit(limit);

    if (!companies) {
      throw new Error('No companies found');
    }

    // Calculate prioritization matrix
    const prioritizedAccounts = companies.map((company: any) => {
      const score = company.revenue_scores?.[0];
      const ltv = company.ltv_predictions?.[0];
      const signals = company.plg_signals || [];

      // Calculate composite priority score
      const healthWeight = score?.health_score || 50;
      const expansionWeight = score?.expansion_score || 50;
      const retentionWeight = score?.retention_score || 50;
      const ltvWeight = ltv?.predicted_ltv ? Math.min(100, ltv.predicted_ltv / 10000) : 50;
      const signalWeight = signals.length > 0 ? Math.min(100, signals.length * 20) : 0;

      // Determine action type: Retain or Expand
      const churnRisk = ltv?.churn_probability || (100 - retentionWeight);
      const expansionPotential = expansionWeight + signalWeight / 2;

      let actionType: 'retain' | 'expand' | 'nurture' | 'monitor';
      let urgency: 'critical' | 'high' | 'medium' | 'low';
      let priorityScore: number;

      if (churnRisk > 60) {
        actionType = 'retain';
        urgency = churnRisk > 80 ? 'critical' : 'high';
        priorityScore = 100 - retentionWeight + (company.facturacion_anual || 0) / 100000;
      } else if (expansionPotential > 70) {
        actionType = 'expand';
        urgency = expansionPotential > 85 ? 'high' : 'medium';
        priorityScore = expansionPotential + (ltv?.predicted_ltv || 0) / 50000;
      } else if (healthWeight > 70) {
        actionType = 'nurture';
        urgency = 'medium';
        priorityScore = healthWeight;
      } else {
        actionType = 'monitor';
        urgency = 'low';
        priorityScore = score?.overall_score || 50;
      }

      // Calculate effort vs impact
      const impact = (company.facturacion_anual || 50000) / 10000 + (ltv?.predicted_ltv || 50000) / 50000;
      const effort = actionType === 'retain' ? 8 : actionType === 'expand' ? 5 : 3;
      const roi = impact / effort;

      // Sum potential value from signals
      const signalValue = signals.reduce((sum: number, s: any) => sum + (s.expansion_opportunity_value || 0), 0);

      return {
        company_id: company.id,
        company_name: company.name,
        sector: company.sector,
        annual_revenue: company.facturacion_anual,
        action_type: actionType,
        urgency,
        priority_score: Math.round(priorityScore),
        quadrant: score?.prioritization_quadrant || 'monitor',
        health_score: score?.health_score || 0,
        expansion_score: score?.expansion_score || 0,
        retention_score: score?.retention_score || 0,
        churn_risk: Math.round(churnRisk),
        expansion_potential: Math.round(expansionPotential),
        predicted_ltv: ltv?.predicted_ltv || 0,
        ltv_cac_ratio: ltv?.ltv_cac_ratio || 0,
        active_signals: signals.length,
        signal_value: signalValue,
        effort_score: effort,
        impact_score: Math.round(impact * 10) / 10,
        roi_score: Math.round(roi * 100) / 100,
        score_trend: score?.score_trend || 'stable',
        ai_recommendation: score?.ai_recommendation || '',
        recommended_actions: getRecommendedActions(actionType, signals)
      };
    });

    // Sort by priority
    prioritizedAccounts.sort((a, b) => {
      // First by urgency
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      // Then by priority score
      return b.priority_score - a.priority_score;
    });

    // Group by quadrant
    const byQuadrant = {
      retain_urgent: prioritizedAccounts.filter(a => a.quadrant === 'retain_urgent'),
      expand_now: prioritizedAccounts.filter(a => a.quadrant === 'expand_now'),
      nurture: prioritizedAccounts.filter(a => a.quadrant === 'nurture'),
      monitor: prioritizedAccounts.filter(a => a.quadrant === 'monitor')
    };

    // Calculate summary metrics
    const summary = {
      totalAccounts: prioritizedAccounts.length,
      criticalRetention: prioritizedAccounts.filter(a => a.action_type === 'retain' && a.urgency === 'critical').length,
      highExpansion: prioritizedAccounts.filter(a => a.action_type === 'expand' && a.urgency === 'high').length,
      totalAtRiskRevenue: prioritizedAccounts
        .filter(a => a.action_type === 'retain')
        .reduce((sum, a) => sum + (a.annual_revenue || 0), 0),
      totalExpansionPotential: prioritizedAccounts.reduce((sum, a) => sum + (a.signal_value || 0), 0),
      avgHealthScore: Math.round(prioritizedAccounts.reduce((sum, a) => sum + a.health_score, 0) / prioritizedAccounts.length),
      avgExpansionScore: Math.round(prioritizedAccounts.reduce((sum, a) => sum + a.expansion_score, 0) / prioritizedAccounts.length)
    };

    return new Response(JSON.stringify({
      success: true,
      accounts: prioritizedAccounts,
      byQuadrant,
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in prioritize-accounts:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getRecommendedActions(actionType: string, signals: any[]): string[] {
  const actions: string[] = [];

  switch (actionType) {
    case 'retain':
      actions.push('Schedule executive check-in call');
      actions.push('Create custom retention offer');
      actions.push('Assign dedicated success manager');
      break;
    case 'expand':
      actions.push('Prepare expansion proposal');
      actions.push('Schedule strategic business review');
      if (signals.some(s => s.signal_type === 'seat_utilization')) {
        actions.push('Offer additional license package');
      }
      if (signals.some(s => s.signal_type === 'feature_adoption')) {
        actions.push('Present premium tier benefits');
      }
      break;
    case 'nurture':
      actions.push('Increase product training touchpoints');
      actions.push('Share relevant case studies');
      actions.push('Monitor for expansion signals');
      break;
    default:
      actions.push('Maintain quarterly business reviews');
      actions.push('Monitor key health metrics');
  }

  return actions;
}
