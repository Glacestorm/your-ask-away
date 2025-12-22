import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyConfig {
  sensitivity: 'low' | 'medium' | 'high';
  lookbackDays: number;
  minConfidence: number;
  checkTypes: string[];
}

interface DetectedAnomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  title: string;
  description: string;
  indicators: Record<string, unknown>;
  affectedEntities: { companies?: string[]; events?: string[] };
  recommendedActions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config } = await req.json() as { config?: Partial<AnomalyConfig> };
    
    const effectiveConfig: AnomalyConfig = {
      sensitivity: config?.sensitivity || 'medium',
      lookbackDays: config?.lookbackDays || 30,
      minConfidence: config?.minConfidence || 0.7,
      checkTypes: config?.checkTypes || ['velocity', 'amount', 'pattern', 'churn_spike']
    };

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent revenue data
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - effectiveConfig.lookbackDays);

    const { data: recentEvents } = await supabase
      .from('revenue_events')
      .select('*')
      .gte('event_date', lookbackDate.toISOString())
      .order('event_date', { ascending: false });

    const { data: mrrSnapshots } = await supabase
      .from('mrr_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(12);

    const { data: revenueScores } = await supabase
      .from('revenue_scores')
      .select('*')
      .order('score_date', { ascending: false })
      .limit(100);

    // Detect anomalies
    const anomalies: DetectedAnomaly[] = [];

    // 1. Check for velocity anomalies (sudden spikes or drops)
    if (effectiveConfig.checkTypes.includes('velocity')) {
      const velocityAnomalies = detectVelocityAnomalies(recentEvents || [], effectiveConfig);
      anomalies.push(...velocityAnomalies);
    }

    // 2. Check for unusual amounts
    if (effectiveConfig.checkTypes.includes('amount')) {
      const amountAnomalies = detectAmountAnomalies(recentEvents || [], effectiveConfig);
      anomalies.push(...amountAnomalies);
    }

    // 3. Check for churn spikes
    if (effectiveConfig.checkTypes.includes('churn_spike')) {
      const churnAnomalies = detectChurnSpike(mrrSnapshots || [], effectiveConfig);
      anomalies.push(...churnAnomalies);
    }

    // 4. Check for score pattern anomalies
    if (effectiveConfig.checkTypes.includes('pattern')) {
      const patternAnomalies = detectScorePatternAnomalies(revenueScores || [], effectiveConfig);
      anomalies.push(...patternAnomalies);
    }

    // Filter by confidence threshold
    const filteredAnomalies = anomalies.filter(a => a.confidence >= effectiveConfig.minConfidence);

    // Save detected anomalies to database
    for (const anomaly of filteredAnomalies) {
      await supabase
        .from('revenue_anomaly_alerts')
        .insert({
          anomaly_type: anomaly.type,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          title: anomaly.title,
          description: anomaly.description,
          indicators: anomaly.indicators,
          affected_entities: anomaly.affectedEntities,
          recommended_actions: anomaly.recommendedActions,
          status: 'open'
        });
    }

    return new Response(JSON.stringify({
      success: true,
      anomaliesDetected: filteredAnomalies.length,
      anomalies: filteredAnomalies,
      config: effectiveConfig
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in revenue-anomaly-monitor:', error);
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

function detectVelocityAnomalies(events: unknown[], config: AnomalyConfig): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  
  // Group events by day
  const eventsByDay = new Map<string, number>();
  for (const event of events as { event_date: string; mrr_change: number }[]) {
    const day = event.event_date?.split('T')[0];
    if (day) {
      eventsByDay.set(day, (eventsByDay.get(day) || 0) + 1);
    }
  }

  // Calculate mean and std dev
  const counts = Array.from(eventsByDay.values());
  if (counts.length < 5) return anomalies;

  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);

  // Sensitivity thresholds
  const thresholds = { low: 3, medium: 2, high: 1.5 };
  const threshold = thresholds[config.sensitivity];

  // Check for anomalous days
  for (const [day, count] of eventsByDay) {
    const zScore = stdDev > 0 ? (count - mean) / stdDev : 0;
    
    if (Math.abs(zScore) > threshold) {
      const isSpike = zScore > 0;
      const severity = Math.abs(zScore) > 4 ? 'critical' : 
                       Math.abs(zScore) > 3 ? 'high' : 
                       Math.abs(zScore) > 2 ? 'medium' : 'low';

      anomalies.push({
        type: 'velocity',
        severity,
        confidence: Math.min(0.99, 0.5 + Math.abs(zScore) * 0.1),
        title: isSpike ? `Pico inusual de eventos (${day})` : `Caída inusual de eventos (${day})`,
        description: `Se detectaron ${count} eventos el ${day}, ${isSpike ? 'muy por encima' : 'muy por debajo'} del promedio de ${Math.round(mean)}.`,
        indicators: { day, count, mean: Math.round(mean), zScore: Math.round(zScore * 100) / 100 },
        affectedEntities: { events: [] },
        recommendedActions: isSpike 
          ? ['Revisar origen del pico', 'Verificar si es promoción o error']
          : ['Investigar posible problema operativo', 'Verificar sistema de tracking']
      });
    }
  }

  return anomalies;
}

function detectAmountAnomalies(events: unknown[], config: AnomalyConfig): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  
  const amounts = (events as { mrr_change: number; company_id?: string }[])
    .filter(e => e.mrr_change != null && e.mrr_change !== 0)
    .map(e => ({ amount: Math.abs(e.mrr_change), company_id: e.company_id }));

  if (amounts.length < 10) return anomalies;

  const values = amounts.map(a => a.amount);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const thresholds = { low: 3.5, medium: 2.5, high: 2 };
  const threshold = thresholds[config.sensitivity];

  for (const { amount, company_id } of amounts) {
    const zScore = stdDev > 0 ? (amount - mean) / stdDev : 0;
    
    if (zScore > threshold) {
      const severity = zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium';

      anomalies.push({
        type: 'amount',
        severity,
        confidence: Math.min(0.99, 0.6 + zScore * 0.08),
        title: `Transacción de monto inusual: €${amount.toLocaleString()}`,
        description: `El monto es ${Math.round(zScore * 10) / 10}x desviaciones sobre el promedio de €${Math.round(mean).toLocaleString()}.`,
        indicators: { amount, mean: Math.round(mean), zScore: Math.round(zScore * 100) / 100 },
        affectedEntities: { companies: company_id ? [company_id] : [] },
        recommendedActions: ['Verificar legitimidad de la transacción', 'Confirmar con el cliente si es necesario']
      });
    }
  }

  return anomalies.slice(0, 5); // Limit to top 5
}

function detectChurnSpike(snapshots: unknown[], config: AnomalyConfig): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  
  const data = (snapshots as { churn_mrr?: number; snapshot_date: string }[])
    .filter(s => s.churn_mrr != null);

  if (data.length < 3) return anomalies;

  const churnRates = data.map(s => s.churn_mrr || 0);
  const mean = churnRates.reduce((a, b) => a + b, 0) / churnRates.length;
  
  const latest = data[0];
  const latestChurn = latest?.churn_mrr || 0;

  if (mean > 0 && latestChurn > mean * 1.5) {
    const severity = latestChurn > mean * 2.5 ? 'critical' : 
                     latestChurn > mean * 2 ? 'high' : 'medium';

    anomalies.push({
      type: 'churn_spike',
      severity,
      confidence: 0.85,
      title: `Pico de churn detectado: €${latestChurn.toLocaleString()}`,
      description: `El churn actual es ${Math.round((latestChurn / mean) * 100) / 100}x el promedio histórico de €${Math.round(mean).toLocaleString()}.`,
      indicators: { currentChurn: latestChurn, averageChurn: Math.round(mean), ratio: Math.round((latestChurn / mean) * 100) / 100 },
      affectedEntities: {},
      recommendedActions: [
        'Identificar cuentas churned recientemente',
        'Analizar razones de cancelación',
        'Activar protocolo de retención de emergencia'
      ]
    });
  }

  return anomalies;
}

function detectScorePatternAnomalies(scores: unknown[], config: AnomalyConfig): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];
  
  const data = scores as { overall_score: number; company_id: string; score_trend?: string }[];
  
  // Find companies with sudden score drops
  const companyScores = new Map<string, number[]>();
  for (const score of data) {
    if (!companyScores.has(score.company_id)) {
      companyScores.set(score.company_id, []);
    }
    companyScores.get(score.company_id)!.push(score.overall_score);
  }

  const companiesWithDrops: string[] = [];
  for (const [companyId, scoreList] of companyScores) {
    if (scoreList.length >= 2) {
      const latest = scoreList[0];
      const previous = scoreList[1];
      const drop = previous - latest;
      
      if (drop > 20) { // 20+ point drop
        companiesWithDrops.push(companyId);
      }
    }
  }

  if (companiesWithDrops.length > 3) {
    anomalies.push({
      type: 'pattern',
      severity: companiesWithDrops.length > 10 ? 'critical' : 'high',
      confidence: 0.8,
      title: `Caída masiva de scores: ${companiesWithDrops.length} empresas`,
      description: `${companiesWithDrops.length} empresas han experimentado caídas significativas en sus scores de revenue.`,
      indicators: { affectedCount: companiesWithDrops.length },
      affectedEntities: { companies: companiesWithDrops.slice(0, 10) },
      recommendedActions: [
        'Revisar cambios recientes en producto o servicio',
        'Verificar problemas de soporte pendientes',
        'Priorizar outreach a cuentas afectadas'
      ]
    });
  }

  return anomalies;
}
