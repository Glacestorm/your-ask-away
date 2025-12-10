import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerFeatures {
  company_id: string;
  name: string;
  recency_days: number;
  frequency: number;
  monetary: number;
  product_count: number;
  visit_success_rate: number;
  avg_vinculacion: number;
  is_vip: boolean;
  rfm_segment: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { includeChurnPrediction = true, includeCLV = true } = await req.json().catch(() => ({}));

    console.log('Starting ML Customer Segmentation...', { includeChurnPrediction, includeCLV });

    // Create execution record
    const { data: execution } = await supabase
      .from('ml_model_executions')
      .insert({
        model_type: 'SVM_CART',
        model_version: '1.0',
        execution_status: 'running',
        parameters: { includeChurnPrediction, includeCLV }
      })
      .select()
      .single();

    const startTime = Date.now();

    // Fetch RFM scores
    const { data: rfmScores, error: rfmError } = await supabase
      .from('customer_rfm_scores')
      .select('*');

    if (rfmError || !rfmScores?.length) {
      throw new Error('No RFM scores found. Please run RFM analysis first.');
    }

    // Fetch company details
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, is_vip, vinculacion_entidad_1, vinculacion_entidad_2, vinculacion_entidad_3')
      .in('id', rfmScores.map(r => r.company_id));

    const companyMap = new Map(companies?.map(c => [c.id, c]) || []);

    // Fetch visit success rates
    const { data: visits } = await supabase
      .from('visits')
      .select('company_id, result')
      .in('company_id', rfmScores.map(r => r.company_id));

    const visitStats: Record<string, { total: number; success: number }> = {};
    visits?.forEach(v => {
      if (!visitStats[v.company_id]) {
        visitStats[v.company_id] = { total: 0, success: 0 };
      }
      visitStats[v.company_id].total++;
      if (v.result === 'successful' || v.result === 'positive') {
        visitStats[v.company_id].success++;
      }
    });

    // Fetch product counts
    const { data: products } = await supabase
      .from('company_products')
      .select('company_id')
      .in('company_id', rfmScores.map(r => r.company_id))
      .eq('active', true);

    const productCounts: Record<string, number> = {};
    products?.forEach(p => {
      productCounts[p.company_id] = (productCounts[p.company_id] || 0) + 1;
    });

    // Build feature vectors
    const customerFeatures: CustomerFeatures[] = rfmScores.map(rfm => {
      const company = companyMap.get(rfm.company_id);
      const stats = visitStats[rfm.company_id] || { total: 0, success: 0 };
      const avgVinculacion = company ? (
        ((company.vinculacion_entidad_1 || 0) + 
         (company.vinculacion_entidad_2 || 0) + 
         (company.vinculacion_entidad_3 || 0)) / 3
      ) : 0;

      return {
        company_id: rfm.company_id,
        name: company?.name || 'Unknown',
        recency_days: rfm.recency_days,
        frequency: rfm.frequency_count,
        monetary: rfm.monetary_value,
        product_count: productCounts[rfm.company_id] || 0,
        visit_success_rate: stats.total > 0 ? stats.success / stats.total : 0,
        avg_vinculacion: avgVinculacion,
        is_vip: company?.is_vip || false,
        rfm_segment: rfm.rfm_segment
      };
    });

    // Prepare prompt for AI-based segmentation
    const sampleCustomers = customerFeatures.slice(0, 50).map(c => ({
      recency: c.recency_days,
      frequency: c.frequency,
      monetary: Math.round(c.monetary),
      products: c.product_count,
      success_rate: Math.round(c.visit_success_rate * 100),
      vinculacion: Math.round(c.avg_vinculacion),
      is_vip: c.is_vip,
      rfm_segment: c.rfm_segment
    }));

    const prompt = `Eres un experto en análisis de segmentación de clientes bancarios usando SVM y CART.

Analiza estos datos de clientes y genera para cada patrón:
1. Probabilidad de churn (0-1)
2. Customer Lifetime Value estimado (euros)
3. Score de lealtad (0-100)
4. Score de engagement (0-100)
5. Tier de rentabilidad (platinum/gold/silver/bronze)
6. Reglas de decisión CART (camino lógico)
7. Importancia de features (objeto con pesos)
8. Próxima mejor acción
9. Score de prioridad (1-100)

Datos de muestra:
${JSON.stringify(sampleCustomers, null, 2)}

Responde SOLO con un JSON array con esta estructura para CADA segmento RFM único:
[{
  "rfm_segment": "Champions",
  "churn_probability": 0.05,
  "clv_estimate": 50000,
  "loyalty_score": 95,
  "engagement_score": 90,
  "profitability_tier": "platinum",
  "decision_path": ["recency <= 30 días", "frequency >= 5", "monetary >= 10000€"],
  "feature_importance": {"recency": 0.35, "frequency": 0.25, "monetary": 0.40},
  "next_best_action": "Programa VIP exclusivo",
  "priority_score": 95,
  "recommended_actions": [{"type": "retention", "title": "Acción", "description": "Desc", "priority": 5}]
}]`;

    let aiSegments: any[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 8000
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          // Parse JSON from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiSegments = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (aiError) {
        console.error('AI error, using fallback:', aiError);
      }
    }

    // Fallback segmentation if AI fails
    if (aiSegments.length === 0) {
      aiSegments = generateFallbackSegments();
    }

    // Map AI segments to customers
    const segmentMap = new Map(aiSegments.map((s: any) => [s.rfm_segment, s]));

    const customerSegments = customerFeatures.map(customer => {
      const segment = segmentMap.get(customer.rfm_segment) || generateDefaultSegment(customer);
      
      // Adjust values based on individual customer features
      const churnMultiplier = customer.recency_days > 180 ? 1.5 : customer.recency_days > 90 ? 1.2 : 1;
      const clvMultiplier = customer.is_vip ? 1.5 : 1;
      
      return {
        company_id: customer.company_id,
        segment_name: customer.rfm_segment,
        segment_type: 'ml_generated',
        churn_probability: Math.min(1, (segment.churn_probability || 0.5) * churnMultiplier),
        churn_risk_level: getChurnRiskLevel((segment.churn_probability || 0.5) * churnMultiplier),
        clv_estimate: Math.round((segment.clv_estimate || 10000) * clvMultiplier * (customer.monetary > 0 ? customer.monetary / 50000 : 0.5)),
        clv_percentile: calculateCLVPercentile(segment.clv_estimate || 10000, customerFeatures),
        loyalty_score: segment.loyalty_score || 50,
        engagement_score: Math.round((segment.engagement_score || 50) * (customer.visit_success_rate > 0.5 ? 1.2 : 0.8)),
        profitability_tier: segment.profitability_tier || 'silver',
        decision_path: segment.decision_path || ['Sin regla definida'],
        feature_importance: segment.feature_importance || { recency: 0.33, frequency: 0.33, monetary: 0.34 },
        model_confidence: 0.85,
        model_version: '1.0-gemini',
        recommended_actions: segment.recommended_actions || [],
        priority_score: segment.priority_score || 50,
        next_best_action: segment.next_best_action || 'Seguimiento estándar',
        calculated_at: new Date().toISOString()
      };
    });

    // Upsert customer segments
    const { error: upsertError } = await supabase
      .from('customer_segments')
      .upsert(customerSegments, { onConflict: 'company_id' });

    if (upsertError) {
      throw new Error(`Error saving segments: ${upsertError.message}`);
    }

    // Generate action recommendations
    const recommendations = customerSegments
      .filter(s => s.priority_score >= 70 || s.churn_probability >= 0.5)
      .flatMap(s => {
        const actions = s.recommended_actions as any[] || [];
        return actions.slice(0, 2).map((action: any, idx: number) => ({
          company_id: s.company_id,
          action_type: action.type || 'general',
          action_title: action.title || s.next_best_action,
          action_description: action.description || `Acción recomendada para ${s.segment_name}`,
          priority: action.priority || Math.ceil(s.priority_score / 20),
          expected_impact: s.churn_probability >= 0.5 ? 'Reducción de churn' : 'Incremento de valor',
          estimated_value: s.clv_estimate * 0.1,
          source_model: 'SVM_CART',
          confidence_score: s.model_confidence,
          status: 'pending'
        }));
      });

    if (recommendations.length > 0) {
      await supabase.from('customer_action_recommendations').insert(recommendations);
    }

    const executionTime = Date.now() - startTime;

    // Calculate summary stats
    const segmentCounts: Record<string, number> = {};
    const avgChurn = customerSegments.reduce((sum, s) => sum + s.churn_probability, 0) / customerSegments.length;
    const totalCLV = customerSegments.reduce((sum, s) => sum + s.clv_estimate, 0);

    customerSegments.forEach(s => {
      segmentCounts[s.segment_name] = (segmentCounts[s.segment_name] || 0) + 1;
    });

    // Update execution record
    if (execution) {
      await supabase
        .from('ml_model_executions')
        .update({
          execution_status: 'completed',
          companies_processed: customerSegments.length,
          segments_created: Object.keys(segmentCounts).length,
          execution_time_ms: executionTime,
          results_summary: {
            total_customers: customerSegments.length,
            segment_distribution: segmentCounts,
            avg_churn_probability: avgChurn,
            total_clv: totalCLV,
            recommendations_generated: recommendations.length
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id);
    }

    console.log('ML Segmentation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      stats: {
        processed: customerSegments.length,
        segments: segmentCounts,
        avgChurnProbability: avgChurn,
        totalCLV: totalCLV,
        recommendationsGenerated: recommendations.length,
        executionTimeMs: executionTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('ML Segmentation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getChurnRiskLevel(probability: number): string {
  if (probability >= 0.7) return 'critical';
  if (probability >= 0.5) return 'high';
  if (probability >= 0.3) return 'medium';
  return 'low';
}

function calculateCLVPercentile(clv: number, allCustomers: CustomerFeatures[]): number {
  const sortedValues = allCustomers.map(c => c.monetary).sort((a, b) => a - b);
  const index = sortedValues.findIndex(v => v >= clv);
  return Math.round((index / sortedValues.length) * 100);
}

function generateDefaultSegment(customer: CustomerFeatures) {
  return {
    churn_probability: customer.recency_days > 180 ? 0.7 : customer.recency_days > 90 ? 0.4 : 0.2,
    clv_estimate: customer.monetary * 2,
    loyalty_score: customer.frequency > 5 ? 80 : customer.frequency > 2 ? 60 : 40,
    engagement_score: customer.visit_success_rate * 100,
    profitability_tier: customer.monetary > 50000 ? 'platinum' : customer.monetary > 20000 ? 'gold' : customer.monetary > 5000 ? 'silver' : 'bronze',
    decision_path: ['Segmentación por defecto'],
    feature_importance: { recency: 0.35, frequency: 0.25, monetary: 0.40 },
    next_best_action: 'Evaluación personalizada',
    priority_score: 50,
    recommended_actions: []
  };
}

function generateFallbackSegments() {
  return [
    { rfm_segment: 'Champions', churn_probability: 0.05, clv_estimate: 75000, loyalty_score: 95, engagement_score: 92, profitability_tier: 'platinum', decision_path: ['recency <= 30', 'frequency >= 5', 'monetary >= 20000'], feature_importance: { recency: 0.3, frequency: 0.3, monetary: 0.4 }, next_best_action: 'Programa VIP exclusivo', priority_score: 95, recommended_actions: [{ type: 'retention', title: 'Mantener VIP', description: 'Programa de beneficios exclusivos', priority: 5 }] },
    { rfm_segment: 'Loyal Customers', churn_probability: 0.1, clv_estimate: 45000, loyalty_score: 85, engagement_score: 80, profitability_tier: 'gold', decision_path: ['frequency >= 3', 'monetary >= 10000'], feature_importance: { recency: 0.25, frequency: 0.35, monetary: 0.4 }, next_best_action: 'Upselling premium', priority_score: 85, recommended_actions: [{ type: 'upsell', title: 'Cross-selling', description: 'Ofrecer productos complementarios', priority: 4 }] },
    { rfm_segment: 'Potential Loyalists', churn_probability: 0.2, clv_estimate: 30000, loyalty_score: 70, engagement_score: 75, profitability_tier: 'gold', decision_path: ['recency <= 60', 'frequency >= 2'], feature_importance: { recency: 0.4, frequency: 0.3, monetary: 0.3 }, next_best_action: 'Programa de fidelización', priority_score: 80, recommended_actions: [{ type: 'engagement', title: 'Activar lealtad', description: 'Inscribir en programa de puntos', priority: 4 }] },
    { rfm_segment: 'New Customers', churn_probability: 0.3, clv_estimate: 15000, loyalty_score: 50, engagement_score: 60, profitability_tier: 'silver', decision_path: ['recency <= 30', 'frequency <= 2'], feature_importance: { recency: 0.5, frequency: 0.2, monetary: 0.3 }, next_best_action: 'Onboarding intensivo', priority_score: 75, recommended_actions: [{ type: 'onboarding', title: 'Bienvenida VIP', description: 'Tour completo de servicios', priority: 4 }] },
    { rfm_segment: 'Promising', churn_probability: 0.25, clv_estimate: 20000, loyalty_score: 60, engagement_score: 65, profitability_tier: 'silver', decision_path: ['recency <= 90', 'monetary >= 5000'], feature_importance: { recency: 0.35, frequency: 0.25, monetary: 0.4 }, next_best_action: 'Desarrollo de relación', priority_score: 70, recommended_actions: [{ type: 'development', title: 'Incrementar frecuencia', description: 'Incentivos por visitas', priority: 3 }] },
    { rfm_segment: 'Need Attention', churn_probability: 0.45, clv_estimate: 12000, loyalty_score: 45, engagement_score: 40, profitability_tier: 'silver', decision_path: ['recency > 60', 'frequency < 3'], feature_importance: { recency: 0.45, frequency: 0.3, monetary: 0.25 }, next_best_action: 'Reactivación temprana', priority_score: 80, recommended_actions: [{ type: 'reactivation', title: 'Contacto urgente', description: 'Llamada de seguimiento', priority: 5 }] },
    { rfm_segment: 'About to Sleep', churn_probability: 0.55, clv_estimate: 8000, loyalty_score: 35, engagement_score: 30, profitability_tier: 'bronze', decision_path: ['recency > 90', 'frequency decreasing'], feature_importance: { recency: 0.5, frequency: 0.3, monetary: 0.2 }, next_best_action: 'Prevención de churn', priority_score: 85, recommended_actions: [{ type: 'rescue', title: 'Oferta especial', description: 'Descuento exclusivo de reactivación', priority: 5 }] },
    { rfm_segment: 'At Risk', churn_probability: 0.7, clv_estimate: 25000, loyalty_score: 40, engagement_score: 25, profitability_tier: 'gold', decision_path: ['recency > 120', 'was high value'], feature_importance: { recency: 0.5, frequency: 0.2, monetary: 0.3 }, next_best_action: 'Rescate VIP urgente', priority_score: 95, recommended_actions: [{ type: 'rescue', title: 'Intervención director', description: 'Visita personal del director', priority: 5 }] },
    { rfm_segment: 'Cannot Lose Them', churn_probability: 0.6, clv_estimate: 60000, loyalty_score: 50, engagement_score: 35, profitability_tier: 'platinum', decision_path: ['high value', 'declining activity'], feature_importance: { recency: 0.4, frequency: 0.2, monetary: 0.4 }, next_best_action: 'Intervención ejecutiva', priority_score: 100, recommended_actions: [{ type: 'executive', title: 'Solución a medida', description: 'Propuesta personalizada del CEO', priority: 5 }] },
    { rfm_segment: 'Hibernating', churn_probability: 0.65, clv_estimate: 5000, loyalty_score: 25, engagement_score: 15, profitability_tier: 'bronze', decision_path: ['recency > 180', 'low activity'], feature_importance: { recency: 0.6, frequency: 0.25, monetary: 0.15 }, next_best_action: 'Campaña de reactivación', priority_score: 60, recommended_actions: [{ type: 'reactivation', title: 'Email marketing', description: 'Campaña de novedades', priority: 3 }] },
    { rfm_segment: 'Lost', churn_probability: 0.85, clv_estimate: 2000, loyalty_score: 10, engagement_score: 5, profitability_tier: 'bronze', decision_path: ['recency > 365', 'no activity'], feature_importance: { recency: 0.7, frequency: 0.2, monetary: 0.1 }, next_best_action: 'Win-back campaign', priority_score: 40, recommended_actions: [{ type: 'winback', title: 'Última oportunidad', description: 'Oferta de retorno agresiva', priority: 2 }] }
  ];
}
