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

    const { companyId } = await req.json();

    // Get company with all related data
    const { data: company } = await supabase
      .from('companies')
      .select(`
        *,
        adoption_scores(*),
        health_scores(*),
        customer_roi_tracking(*),
        expansion_opportunities(*)
      `)
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    const adoption = company.adoption_scores;
    const health = company.health_scores?.[0];
    const roi = company.customer_roi_tracking?.[0];
    const opportunities = company.expansion_opportunities || [];

    // Calculate individual scores
    const healthScore = health?.overall_score || 70;
    const engagementScore = adoption?.engagement_score || 65;
    const satisfactionScore = health?.support_score || 75;
    
    // Expansion score based on opportunities and adoption
    const activeOpportunities = opportunities.filter((o: any) => o.status === 'qualified' || o.status === 'identified');
    const expansionScore = Math.min(100, 50 + activeOpportunities.length * 10 + (adoption?.depth_score || 0) * 0.3);
    
    // Retention score (inverse of churn risk)
    const retentionScore = Math.max(0, 100 - (health?.churn_risk_score || 30));
    
    // Growth potential
    const growthPotentialScore = Math.min(100, 
      (adoption?.breadth_score || 50) * 0.3 +
      (adoption?.stickiness_score || 50) * 0.3 +
      (company.facturacion_anual > 1000000 ? 40 : company.facturacion_anual > 100000 ? 30 : 20)
    );
    
    // Risk score (higher = more risky)
    const riskScore = Math.max(0, 100 - retentionScore);
    
    // Overall score (weighted average)
    const overallScore = 
      healthScore * 0.25 +
      expansionScore * 0.20 +
      retentionScore * 0.20 +
      engagementScore * 0.15 +
      satisfactionScore * 0.10 +
      growthPotentialScore * 0.10;

    // Determine prioritization quadrant
    let prioritizationQuadrant: string;
    let recommendedAction: string;
    let actionPriority: number;

    if (retentionScore < 50 && healthScore < 60) {
      prioritizationQuadrant = 'retain_urgent';
      recommendedAction = 'Immediate retention intervention required - schedule executive call';
      actionPriority = 1;
    } else if (expansionScore > 70 && healthScore > 70) {
      prioritizationQuadrant = 'expand_now';
      recommendedAction = 'Prime expansion candidate - initiate upsell conversation';
      actionPriority = 2;
    } else if (healthScore >= 60 && expansionScore < 60) {
      prioritizationQuadrant = 'nurture';
      recommendedAction = 'Healthy account with growth potential - increase engagement';
      actionPriority = 3;
    } else {
      prioritizationQuadrant = 'monitor';
      recommendedAction = 'Monitor key metrics and maintain regular touchpoints';
      actionPriority = 4;
    }

    // Determine trend
    let scoreTrend = 'stable';
    let trendVelocity = 0;
    if (adoption?.trend === 'improving') {
      scoreTrend = 'improving';
      trendVelocity = adoption.trend_percentage || 5;
    } else if (adoption?.trend === 'declining') {
      scoreTrend = 'declining';
      trendVelocity = -(adoption.trend_percentage || 5);
    }

    const scoreFactors = {
      health: { value: healthScore, weight: 0.25, contribution: healthScore * 0.25 },
      expansion: { value: expansionScore, weight: 0.20, contribution: expansionScore * 0.20 },
      retention: { value: retentionScore, weight: 0.20, contribution: retentionScore * 0.20 },
      engagement: { value: engagementScore, weight: 0.15, contribution: engagementScore * 0.15 },
      satisfaction: { value: satisfactionScore, weight: 0.10, contribution: satisfactionScore * 0.10 },
      growth_potential: { value: growthPotentialScore, weight: 0.10, contribution: growthPotentialScore * 0.10 }
    };

    // Generate AI recommendation
    const aiRecommendation = generateAIRecommendation(
      prioritizationQuadrant,
      healthScore,
      expansionScore,
      retentionScore,
      company.name
    );

    const nextBestAction = determineNextBestAction(prioritizationQuadrant, scoreFactors);

    const revenueScore = {
      company_id: companyId,
      score_date: new Date().toISOString().split('T')[0],
      overall_score: Math.round(overallScore),
      health_score: Math.round(healthScore),
      expansion_score: Math.round(expansionScore),
      retention_score: Math.round(retentionScore),
      engagement_score: Math.round(engagementScore),
      satisfaction_score: Math.round(satisfactionScore),
      growth_potential_score: Math.round(growthPotentialScore),
      risk_score: Math.round(riskScore),
      prioritization_quadrant: prioritizationQuadrant,
      recommended_action: recommendedAction,
      action_priority: actionPriority,
      score_factors: scoreFactors,
      score_trend: scoreTrend,
      trend_velocity: trendVelocity,
      ai_recommendation: aiRecommendation,
      next_best_action: nextBestAction
    };

    // Save score
    const { data: savedScore, error } = await supabase
      .from('revenue_scores')
      .insert([revenueScore])
      .select()
      .single();

    if (error) {
      console.error('Error saving revenue score:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      score: savedScore || revenueScore,
      breakdown: scoreFactors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in calculate-revenue-score:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateAIRecommendation(quadrant: string, health: number, expansion: number, retention: number, companyName: string): string {
  switch (quadrant) {
    case 'retain_urgent':
      return `${companyName} requires immediate attention. With health at ${health}% and retention risk at ${100 - retention}%, recommend executive sponsor call within 48 hours. Focus on understanding pain points and creating recovery plan.`;
    case 'expand_now':
      return `${companyName} is primed for expansion with ${expansion}% expansion score and ${health}% health. Schedule strategic review to discuss additional products/services. High probability of 20-30% revenue increase.`;
    case 'nurture':
      return `${companyName} is stable but has untapped potential. Increase feature adoption through targeted training. Monitor for expansion signals over next 60 days.`;
    default:
      return `${companyName} is performing within expected parameters. Maintain regular quarterly business reviews and monitor for any score changes.`;
  }
}

function determineNextBestAction(quadrant: string, factors: any): string {
  const lowestFactor = Object.entries(factors)
    .sort((a: any, b: any) => a[1].value - b[1].value)[0];

  switch (lowestFactor[0]) {
    case 'engagement':
      return 'Schedule product training session to boost engagement';
    case 'satisfaction':
      return 'Conduct satisfaction survey and address feedback';
    case 'retention':
      return 'Create retention plan with executive sponsorship';
    case 'expansion':
      return 'Identify cross-sell opportunities based on usage patterns';
    case 'health':
      return 'Perform health check and address critical issues';
    default:
      return 'Continue regular account management activities';
  }
}
