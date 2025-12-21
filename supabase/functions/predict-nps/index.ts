import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BehavioralSignals {
  recency_score: number;
  response_velocity: number;
  transaction_trend: number;
  sentiment_avg: number;
  engagement_level: number;
  visit_frequency: number;
  issue_count: number;
  product_adoption: number;
}

interface PredictionResult {
  predicted_score: number;
  confidence_level: number;
  behavioral_signals: BehavioralSignals;
  risk_factors: string[];
  opportunities: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { company_id, contact_id, save_prediction = true } = await req.json();

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[predict-nps] Starting prediction for company ${company_id}`);

    // 1. Gather behavioral signals
    const signals = await gatherBehavioralSignals(supabase, company_id, contact_id);
    console.log(`[predict-nps] Behavioral signals:`, signals);

    // 2. Calculate predicted NPS using weighted model
    const prediction = calculatePredictedNPS(signals);
    console.log(`[predict-nps] Prediction result:`, prediction);

    // 3. Save prediction if requested
    if (save_prediction) {
      const { error: insertError } = await supabase
        .from('predicted_nps')
        .insert({
          company_id,
          contact_id,
          predicted_score: prediction.predicted_score,
          confidence_level: prediction.confidence_level,
          behavioral_signals: prediction.behavioral_signals,
          prediction_model: 'behavioral_signals_v1',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (insertError) {
        console.error(`[predict-nps] Error saving prediction:`, insertError);
      }
    }

    // 4. Check if we should create an alert for dropping NPS
    await checkForNPSDropAlert(supabase, company_id, prediction.predicted_score);

    return new Response(
      JSON.stringify({
        success: true,
        prediction,
        company_id,
        contact_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[predict-nps] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherBehavioralSignals(
  supabase: any,
  companyId: string,
  contactId?: string
): Promise<BehavioralSignals> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Recency: Last interaction/visit
  const { data: lastVisit } = await supabase
    .from('visits')
    .select('date, result')
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const daysSinceLastVisit = lastVisit 
    ? Math.floor((Date.now() - new Date(lastVisit.date).getTime()) / (1000 * 60 * 60 * 24))
    : 365;
  
  const recency_score = Math.max(0, Math.min(10, 10 - (daysSinceLastVisit / 30)));

  // Response velocity: How quickly they respond to communications
  const { data: surveyResponses } = await supabase
    .from('survey_responses')
    .select('created_at, responded_at')
    .eq('company_id', companyId)
    .gte('created_at', ninetyDaysAgo);

  let response_velocity = 5; // Default middle score
  if (surveyResponses && surveyResponses.length > 0) {
    const avgResponseTime = surveyResponses.reduce((sum: number, r: any) => {
      if (r.responded_at) {
        return sum + (new Date(r.responded_at).getTime() - new Date(r.created_at).getTime());
      }
      return sum;
    }, 0) / surveyResponses.length;
    
    // Fast response = high score (under 24h = 10, over 7 days = 0)
    const hoursToRespond = avgResponseTime / (1000 * 60 * 60);
    response_velocity = Math.max(0, Math.min(10, 10 - (hoursToRespond / 168) * 10));
  }

  // Transaction trend: Based on visit outcomes
  const { data: recentVisits } = await supabase
    .from('visits')
    .select('result')
    .eq('company_id', companyId)
    .gte('date', ninetyDaysAgo);

  let transaction_trend = 5;
  if (recentVisits && recentVisits.length > 0) {
    const positiveResults = recentVisits.filter((v: any) => 
      ['successful', 'positive', 'sale', 'won'].includes(v.result?.toLowerCase())
    ).length;
    transaction_trend = (positiveResults / recentVisits.length) * 10;
  }

  // Sentiment average from historical analysis
  const { data: sentimentData } = await supabase
    .from('sentiment_analysis')
    .select('sentiment_score')
    .eq('company_id', companyId)
    .gte('created_at', ninetyDaysAgo);

  let sentiment_avg = 5;
  if (sentimentData && sentimentData.length > 0) {
    const avgSentiment = sentimentData.reduce((sum: number, s: any) => sum + (s.sentiment_score || 0), 0) / sentimentData.length;
    sentiment_avg = Math.max(0, Math.min(10, (avgSentiment + 1) * 5)); // Convert -1 to 1 scale to 0-10
  }

  // Engagement level: Visit frequency
  const { count: visitCount } = await supabase
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .gte('date', ninetyDaysAgo);

  const engagement_level = Math.min(10, (visitCount || 0) / 3 * 10); // 3+ visits in 90 days = 10
  const visit_frequency = visitCount || 0;

  // Issue count: Negative feedback or complaints
  const { data: negativeResponses } = await supabase
    .from('survey_responses')
    .select('id')
    .eq('company_id', companyId)
    .lte('nps_score', 6)
    .gte('created_at', ninetyDaysAgo);

  const issue_count = negativeResponses?.length || 0;

  // Product adoption: Based on visit sheets with products
  const { data: visitSheets } = await supabase
    .from('visit_sheets')
    .select('productos_servicios')
    .eq('company_id', companyId)
    .not('productos_servicios', 'is', null);

  const product_adoption = Math.min(10, (visitSheets?.length || 0) * 2);

  return {
    recency_score,
    response_velocity,
    transaction_trend,
    sentiment_avg,
    engagement_level,
    visit_frequency,
    issue_count,
    product_adoption
  };
}

function calculatePredictedNPS(signals: BehavioralSignals): PredictionResult {
  // Weighted model based on signal importance
  const weights = {
    recency_score: 0.20,      // Recent engagement is crucial
    response_velocity: 0.10,   // Quick responses indicate satisfaction
    transaction_trend: 0.25,   // Business success drives satisfaction
    sentiment_avg: 0.20,       // Historical sentiment is a strong predictor
    engagement_level: 0.10,    // Active customers tend to be happier
    product_adoption: 0.15     // Using products indicates value perception
  };

  // Calculate base score (0-10 scale)
  let baseScore = 
    signals.recency_score * weights.recency_score +
    signals.response_velocity * weights.response_velocity +
    signals.transaction_trend * weights.transaction_trend +
    signals.sentiment_avg * weights.sentiment_avg +
    signals.engagement_level * weights.engagement_level +
    signals.product_adoption * weights.product_adoption;

  // Apply issue penalty
  const issuePenalty = Math.min(2, signals.issue_count * 0.5);
  baseScore = Math.max(0, baseScore - issuePenalty);

  // Round to integer NPS score
  const predicted_score = Math.round(baseScore);

  // Calculate confidence based on data availability
  const dataPoints = [
    signals.recency_score > 0 ? 1 : 0,
    signals.response_velocity !== 5 ? 1 : 0,
    signals.transaction_trend !== 5 ? 1 : 0,
    signals.sentiment_avg !== 5 ? 1 : 0,
    signals.engagement_level > 0 ? 1 : 0,
    signals.product_adoption > 0 ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const confidence_level = Math.min(0.95, 0.3 + (dataPoints / 6) * 0.65);

  // Identify risk factors and opportunities
  const risk_factors: string[] = [];
  const opportunities: string[] = [];

  if (signals.recency_score < 3) {
    risk_factors.push('Low recent engagement - no interaction in over 30 days');
  }
  if (signals.sentiment_avg < 4) {
    risk_factors.push('Historical negative sentiment detected');
  }
  if (signals.issue_count > 2) {
    risk_factors.push('Multiple recent complaints or issues');
  }
  if (signals.transaction_trend < 4) {
    risk_factors.push('Declining business outcomes');
  }

  if (signals.product_adoption > 6) {
    opportunities.push('High product adoption - potential for cross-sell');
  }
  if (signals.engagement_level > 7) {
    opportunities.push('Highly engaged customer - referral opportunity');
  }
  if (signals.sentiment_avg > 7) {
    opportunities.push('Positive sentiment - testimonial candidate');
  }

  return {
    predicted_score,
    confidence_level,
    behavioral_signals: signals,
    risk_factors,
    opportunities
  };
}

async function checkForNPSDropAlert(
  supabase: any,
  companyId: string,
  predictedScore: number
): Promise<void> {
  // Get previous prediction
  const { data: prevPrediction } = await supabase
    .from('predicted_nps')
    .select('predicted_score')
    .eq('company_id', companyId)
    .order('prediction_date', { ascending: false })
    .limit(1)
    .single();

  if (prevPrediction && predictedScore < prevPrediction.predicted_score - 2) {
    // Significant drop detected - create AI task
    const { data: company } = await supabase
      .from('companies')
      .select('name, gestor_id')
      .eq('id', companyId)
      .single();

    if (company?.gestor_id) {
      await supabase.from('ai_task_queue').insert({
        task_type: 'predicted_nps_drop',
        task_title: `NPS Predictivo cayendo: ${company.name}`,
        task_description: `El NPS predictivo de ${company.name} ha bajado de ${prevPrediction.predicted_score} a ${predictedScore}. Se recomienda contactar al cliente proactivamente.`,
        target_entity_type: 'company',
        target_entity_id: companyId,
        target_gestor_id: company.gestor_id,
        priority: predictedScore <= 5 ? 9 : 7,
        ai_reasoning: 'Detected significant drop in predicted NPS based on behavioral signals',
        suggested_action: 'Schedule a call to understand any issues before customer becomes detractor'
      });

      console.log(`[predict-nps] Created alert for NPS drop on company ${companyId}`);
    }
  }
}