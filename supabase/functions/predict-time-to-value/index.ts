import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { companyId, metricType = 'first_value' } = await req.json();

    if (!companyId) {
      throw new Error('companyId is required');
    }

    console.log(`Predicting time-to-value for company: ${companyId}, metric: ${metricType}`);

    // Get company data
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    // Get onboarding progress
    const { data: onboarding } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get feature usage patterns
    const { data: featureUsage } = await supabase
      .from('feature_usage_tracking')
      .select('*')
      .eq('company_id', companyId)
      .order('last_used_at', { ascending: false });

    // Get milestones achieved
    const { data: milestones } = await supabase
      .from('company_milestones')
      .select('*, adoption_milestones(*)')
      .eq('company_id', companyId);

    // Calculate behavioral signals
    const signals = calculateBehavioralSignals({
      company,
      onboarding,
      featureUsage: featureUsage || [],
      milestones: milestones || [],
    });

    // Predict time-to-value based on signals
    const prediction = predictTimeToValue(signals, metricType);

    // Get target days based on segment
    const targetDays = getTargetDays(company?.segment, metricType);

    // Save or update prediction
    const { data: existingMetric } = await supabase
      .from('time_to_value_metrics')
      .select('id')
      .eq('company_id', companyId)
      .eq('metric_type', metricType)
      .single();

    const metricData = {
      company_id: companyId,
      metric_type: metricType,
      target_days: targetDays,
      predicted_days: prediction.predictedDays,
      prediction_confidence: prediction.confidence,
      value_indicator: prediction.indicator,
      is_achieved: prediction.isAchieved,
      achieved_at: prediction.isAchieved ? new Date().toISOString() : null,
      actual_days: prediction.isAchieved ? prediction.actualDays : null,
    };

    if (existingMetric) {
      await supabase
        .from('time_to_value_metrics')
        .update(metricData)
        .eq('id', existingMetric.id);
    } else {
      await supabase
        .from('time_to_value_metrics')
        .insert(metricData);
    }

    console.log(`TTV prediction saved: ${prediction.predictedDays} days`);

    return new Response(
      JSON.stringify({
        success: true,
        prediction: {
          metricType,
          predictedDays: prediction.predictedDays,
          targetDays,
          confidence: prediction.confidence,
          indicator: prediction.indicator,
          isAchieved: prediction.isAchieved,
          actualDays: prediction.actualDays,
          signals: prediction.signalsSummary,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error predicting TTV:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface BehavioralSignals {
  onboardingProgress: number;
  daysActive: number;
  featuresUsed: number;
  milestonesAchieved: number;
  requiredMilestonesAchieved: number;
  totalRequiredMilestones: number;
  averageSessionDuration: number;
  daysSinceFirstActivity: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

function calculateBehavioralSignals(data: {
  company: { created_at?: string } | null;
  onboarding: { progress_percentage?: number; started_at?: string } | null;
  featureUsage: { feature_key: string; session_duration_seconds?: number; last_used_at?: string }[];
  milestones: { adoption_milestones?: { required_for_activation?: boolean } }[];
}): BehavioralSignals {
  const now = new Date();
  
  // Calculate days since first activity
  const firstActivityDate = data.onboarding?.started_at 
    ? new Date(data.onboarding.started_at)
    : data.company?.created_at 
      ? new Date(data.company.created_at)
      : now;
  const daysSinceFirstActivity = Math.floor((now.getTime() - firstActivityDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate active days (unique days with feature usage)
  const activeDays = new Set(
    data.featureUsage.map(f => f.last_used_at?.split('T')[0]).filter(Boolean)
  ).size;

  // Calculate features used
  const featuresUsed = new Set(data.featureUsage.map(f => f.feature_key)).size;

  // Calculate average session duration
  const totalDuration = data.featureUsage.reduce((acc, f) => acc + (f.session_duration_seconds || 0), 0);
  const averageSessionDuration = data.featureUsage.length > 0 ? totalDuration / data.featureUsage.length : 0;

  // Calculate milestones
  const requiredMilestones = data.milestones.filter(m => m.adoption_milestones?.required_for_activation);
  
  // Calculate engagement trend
  const recentUsage = data.featureUsage.filter(f => {
    const usedAt = f.last_used_at ? new Date(f.last_used_at) : null;
    return usedAt && (now.getTime() - usedAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;
  
  const olderUsage = data.featureUsage.filter(f => {
    const usedAt = f.last_used_at ? new Date(f.last_used_at) : null;
    if (!usedAt) return false;
    const daysDiff = (now.getTime() - usedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff >= 7 && daysDiff < 14;
  }).length;

  let engagementTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (recentUsage > olderUsage * 1.2) engagementTrend = 'increasing';
  else if (recentUsage < olderUsage * 0.8) engagementTrend = 'decreasing';

  return {
    onboardingProgress: data.onboarding?.progress_percentage || 0,
    daysActive: activeDays,
    featuresUsed,
    milestonesAchieved: data.milestones.length,
    requiredMilestonesAchieved: requiredMilestones.length,
    totalRequiredMilestones: 3, // Assuming 3 required milestones
    averageSessionDuration,
    daysSinceFirstActivity,
    engagementTrend,
  };
}

function predictTimeToValue(signals: BehavioralSignals, metricType: string): {
  predictedDays: number;
  confidence: number;
  indicator: string;
  isAchieved: boolean;
  actualDays: number | null;
  signalsSummary: Record<string, number | string>;
} {
  let basePrediction = 14; // Default baseline
  let confidence = 0.6;
  let indicator = 'onboarding_complete';
  let isAchieved = false;
  let actualDays: number | null = null;

  switch (metricType) {
    case 'first_value':
      indicator = 'first_report_or_automation';
      // High onboarding progress = faster TTV
      if (signals.onboardingProgress >= 100) {
        basePrediction = 7;
        confidence = 0.85;
      } else if (signals.onboardingProgress >= 75) {
        basePrediction = 10;
        confidence = 0.75;
      } else if (signals.onboardingProgress >= 50) {
        basePrediction = 14;
        confidence = 0.65;
      } else {
        basePrediction = 21;
        confidence = 0.5;
      }
      
      // Adjust based on feature usage
      if (signals.featuresUsed >= 3) {
        basePrediction = Math.max(basePrediction - 3, 3);
        confidence += 0.1;
      }
      
      // Check if already achieved
      if (signals.milestonesAchieved >= 5 || (signals.featuresUsed >= 3 && signals.onboardingProgress >= 100)) {
        isAchieved = true;
        actualDays = signals.daysSinceFirstActivity;
      }
      break;

    case 'activation':
      indicator = 'onboarding_100_and_team_invited';
      if (signals.requiredMilestonesAchieved >= signals.totalRequiredMilestones) {
        isAchieved = true;
        actualDays = signals.daysSinceFirstActivity;
        basePrediction = actualDays;
        confidence = 1.0;
      } else {
        const remainingMilestones = signals.totalRequiredMilestones - signals.requiredMilestonesAchieved;
        basePrediction = signals.daysSinceFirstActivity + (remainingMilestones * 5);
        confidence = 0.7 - (remainingMilestones * 0.1);
      }
      break;

    case 'habit_formed':
      indicator = 'weekly_active_4_consecutive_weeks';
      if (signals.daysActive >= 16) {
        isAchieved = true;
        actualDays = signals.daysSinceFirstActivity;
        basePrediction = actualDays;
        confidence = 1.0;
      } else {
        const weeklyRate = signals.daysActive / Math.max(signals.daysSinceFirstActivity / 7, 1);
        if (weeklyRate >= 4) {
          basePrediction = 28; // Already on track
          confidence = 0.8;
        } else if (weeklyRate >= 2) {
          basePrediction = 42;
          confidence = 0.6;
        } else {
          basePrediction = 60;
          confidence = 0.4;
        }
      }
      break;

    case 'expansion_ready':
      indicator = 'health_score_80_and_power_user';
      basePrediction = 90;
      if (signals.featuresUsed >= 5 && signals.engagementTrend === 'increasing') {
        basePrediction = 60;
        confidence = 0.7;
      } else if (signals.featuresUsed >= 3) {
        basePrediction = 75;
        confidence = 0.55;
      }
      break;
  }

  // Adjust based on engagement trend
  if (signals.engagementTrend === 'increasing' && !isAchieved) {
    basePrediction = Math.max(basePrediction - 5, 3);
    confidence += 0.05;
  } else if (signals.engagementTrend === 'decreasing' && !isAchieved) {
    basePrediction += 7;
    confidence -= 0.1;
  }

  return {
    predictedDays: Math.round(basePrediction),
    confidence: Math.min(Math.max(confidence, 0.3), 1.0),
    indicator,
    isAchieved,
    actualDays,
    signalsSummary: {
      onboardingProgress: signals.onboardingProgress,
      daysActive: signals.daysActive,
      featuresUsed: signals.featuresUsed,
      milestonesAchieved: signals.milestonesAchieved,
      engagementTrend: signals.engagementTrend,
    },
  };
}

function getTargetDays(segment: string | undefined, metricType: string): number {
  const targets: Record<string, Record<string, number>> = {
    enterprise: {
      first_value: 14,
      activation: 30,
      habit_formed: 60,
      expansion_ready: 120,
    },
    pyme: {
      first_value: 7,
      activation: 21,
      habit_formed: 45,
      expansion_ready: 90,
    },
    startup: {
      first_value: 5,
      activation: 14,
      habit_formed: 30,
      expansion_ready: 60,
    },
    individual: {
      first_value: 3,
      activation: 7,
      habit_formed: 21,
      expansion_ready: 45,
    },
  };

  const segmentTargets = targets[segment || 'pyme'] || targets.pyme;
  return segmentTargets[metricType] || 14;
}
