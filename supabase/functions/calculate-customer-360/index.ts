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
    const { companyId, calculateAll } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKey = Deno.env.get('LOVABLE_API_KEY');

    let companiesToProcess: string[] = [];

    if (calculateAll) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(500);
      companiesToProcess = companies?.map(c => c.id) || [];
    } else if (companyId) {
      companiesToProcess = [companyId];
    } else {
      throw new Error('Se requiere companyId o calculateAll=true');
    }

    const results = [];

    for (const cId of companiesToProcess) {
      try {
        const profile = await calculateProfile(supabase, cId, apiKey);
        results.push({ companyId: cId, success: true, profile });
      } catch (e: any) {
        console.error(`Error calculating profile for ${cId}:`, e);
        results.push({ companyId: cId, success: false, error: e?.message || 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in calculate-customer-360:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateProfile(supabase: any, companyId: string, apiKey: string | undefined) {
  // Fetch company data
  const { data: company } = await supabase
    .from('companies')
    .select(`
      *,
      status:status_colors(status_name, color_hex),
      gestor:profiles!companies_gestor_id_fkey(full_name, email)
    `)
    .eq('id', companyId)
    .single();

  if (!company) throw new Error('Empresa no encontrada');

  // Fetch visits
  const { data: visits } = await supabase
    .from('visits')
    .select('*')
    .eq('company_id', companyId)
    .order('visit_date', { ascending: false });

  // Fetch products
  const { data: products } = await supabase
    .from('company_products')
    .select(`
      *,
      product:products(name, category)
    `)
    .eq('company_id', companyId);

  // Fetch bank affiliations
  const { data: bankAffiliations } = await supabase
    .from('company_bank_affiliations')
    .select('*')
    .eq('company_id', companyId);

  // Fetch enriched transactions
  const { data: transactions } = await supabase
    .from('enriched_transactions')
    .select('*')
    .eq('company_id', companyId)
    .order('transaction_date', { ascending: false })
    .limit(100);

  // Calculate metrics
  const totalVisits = visits?.length || 0;
  const successfulVisits = visits?.filter((v: any) => v.result === 'positive').length || 0;
  const lastVisitDate = visits?.[0]?.visit_date || null;
  
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p: any) => p.active).length || 0;

  // Calculate visit frequency
  let avgVisitFrequency = null;
  if (visits && visits.length > 1) {
    const visitDates = visits.map((v: any) => new Date(v.visit_date).getTime());
    const gaps = [];
    for (let i = 1; i < visitDates.length; i++) {
      gaps.push((visitDates[i-1] - visitDates[i]) / (1000 * 60 * 60 * 24));
    }
    avgVisitFrequency = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  // Calculate transaction metrics
  const totalTransactionVolume = transactions?.reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0) || 0;

  // Determine segment
  const segment = determineSegment(totalProducts, successfulVisits, totalTransactionVolume);
  
  // Calculate health score
  const healthScore = calculateHealthScore(lastVisitDate, successfulVisits, totalVisits, activeProducts);

  // Calculate churn probability
  const churnProbability = calculateChurnProbability(lastVisitDate, avgVisitFrequency, healthScore);

  // Determine lifecycle stage
  const lifecycleStage = determineLifecycleStage(company, visits, products);

  // Generate recommendations using AI
  let recommendations: any = {
    recommended_products: [],
    cross_sell_opportunities: [],
    next_best_actions: [],
  };

  if (apiKey) {
    try {
      recommendations = await generateAIRecommendations(apiKey, company, products, visits, healthScore);
    } catch (e) {
      console.log('AI recommendations failed:', e);
    }
  }

  // Build interaction summary
  const interactionSummary = {
    total_visits: totalVisits,
    last_30_days: visits?.filter((v: any) => {
      const date = new Date(v.visit_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }).length || 0,
    by_result: {
      positive: successfulVisits,
      negative: visits?.filter((v: any) => v.result === 'negative').length || 0,
      pending: visits?.filter((v: any) => v.result === 'pending').length || 0,
    },
    channels_used: [...new Set(visits?.map((v: any) => v.channel).filter(Boolean) || [])],
  };

  // Calculate RFM score
  const rfmScore = calculateRFM(lastVisitDate, totalVisits, totalTransactionVolume);

  // Prepare the profile
  const profile = {
    company_id: companyId,
    rfm_score: rfmScore,
    churn_probability: churnProbability,
    credit_score: company.credit_score || null,
    clv_score: calculateCLV(totalTransactionVolume, churnProbability),
    health_score: healthScore,
    total_visits: totalVisits,
    successful_visits: successfulVisits,
    last_visit_date: lastVisitDate,
    avg_visit_frequency_days: avgVisitFrequency,
    total_products: totalProducts,
    active_products: activeProducts,
    total_transaction_volume: totalTransactionVolume,
    avg_monthly_volume: totalTransactionVolume / 12,
    segment,
    tier: determineTier(healthScore, totalTransactionVolume),
    lifecycle_stage: lifecycleStage,
    recommended_products: recommendations.recommended_products,
    cross_sell_opportunities: recommendations.cross_sell_opportunities,
    next_best_actions: recommendations.next_best_actions,
    interaction_summary: interactionSummary,
    last_calculated_at: new Date().toISOString(),
  };

  // Upsert the profile
  const { error } = await supabase
    .from('customer_360_profiles')
    .upsert(profile, { onConflict: 'company_id' });

  if (error) throw error;

  // Log interactions from visits
  for (const visit of (visits?.slice(0, 10) || [])) {
    await supabase
      .from('customer_interactions')
      .upsert({
        company_id: companyId,
        interaction_type: 'visit',
        interaction_date: visit.visit_date,
        channel: visit.channel || 'presencial',
        subject: `Visita ${visit.result}`,
        description: visit.notes,
        outcome: visit.result,
        related_entity_type: 'visit',
        related_entity_id: visit.id,
      }, { onConflict: 'related_entity_id' });
  }

  return profile;
}

function determineSegment(products: number, successfulVisits: number, volume: number): string {
  if (products >= 5 && successfulVisits >= 10 && volume > 100000) return 'Premium';
  if (products >= 3 || successfulVisits >= 5 || volume > 50000) return 'Growth';
  if (products >= 1 || successfulVisits >= 1) return 'Standard';
  return 'New';
}

function calculateHealthScore(lastVisitDate: string | null, successfulVisits: number, totalVisits: number, activeProducts: number): number {
  let score = 50; // Base score

  // Recency factor (max 25 points)
  if (lastVisitDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 30) score += 25;
    else if (daysSince <= 60) score += 20;
    else if (daysSince <= 90) score += 15;
    else if (daysSince <= 180) score += 10;
    else score += 5;
  }

  // Success rate factor (max 15 points)
  if (totalVisits > 0) {
    const successRate = successfulVisits / totalVisits;
    score += Math.round(successRate * 15);
  }

  // Product engagement (max 10 points)
  score += Math.min(activeProducts * 2, 10);

  return Math.min(score, 100);
}

function calculateChurnProbability(lastVisitDate: string | null, avgFrequency: number | null, healthScore: number): number {
  if (!lastVisitDate) return 0.8;

  const daysSince = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
  
  let baseProb = 0.1;
  
  if (daysSince > 180) baseProb = 0.7;
  else if (daysSince > 90) baseProb = 0.5;
  else if (daysSince > 60) baseProb = 0.3;
  else if (daysSince > 30) baseProb = 0.2;

  // Adjust based on health score
  const healthAdjustment = (100 - healthScore) / 200;
  
  return Math.min(baseProb + healthAdjustment, 0.95);
}

function determineLifecycleStage(company: any, visits: any[], products: any[]): string {
  const daysSinceCreation = Math.floor((Date.now() - new Date(company.created_at).getTime()) / (1000 * 60 * 60 * 24));
  const hasProducts = products && products.length > 0;
  const hasVisits = visits && visits.length > 0;

  if (!hasProducts && !hasVisits) return 'Prospecto';
  if (daysSinceCreation <= 90 && hasProducts) return 'Nuevo Cliente';
  if (hasProducts && products.filter((p: any) => p.active).length > 0) return 'Cliente Activo';
  if (hasProducts && products.filter((p: any) => p.active).length === 0) return 'En Riesgo';
  return 'Maduro';
}

function calculateRFM(lastVisitDate: string | null, totalVisits: number, volume: number): { r: number; f: number; m: number; score: number } {
  // Recency (1-5)
  let r = 1;
  if (lastVisitDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 30) r = 5;
    else if (daysSince <= 60) r = 4;
    else if (daysSince <= 90) r = 3;
    else if (daysSince <= 180) r = 2;
  }

  // Frequency (1-5)
  let f = 1;
  if (totalVisits >= 20) f = 5;
  else if (totalVisits >= 10) f = 4;
  else if (totalVisits >= 5) f = 3;
  else if (totalVisits >= 2) f = 2;

  // Monetary (1-5)
  let m = 1;
  if (volume >= 100000) m = 5;
  else if (volume >= 50000) m = 4;
  else if (volume >= 20000) m = 3;
  else if (volume >= 5000) m = 2;

  return { r, f, m, score: r + f + m };
}

function calculateCLV(volume: number, churnProb: number): number {
  const avgMargin = 0.15; // 15% margin assumption
  const retentionRate = 1 - churnProb;
  const avgLifespan = retentionRate > 0 ? 1 / (1 - retentionRate) : 1;
  
  return volume * avgMargin * avgLifespan;
}

function determineTier(healthScore: number, volume: number): string {
  if (healthScore >= 80 && volume >= 100000) return 'Platinum';
  if (healthScore >= 70 && volume >= 50000) return 'Gold';
  if (healthScore >= 50 && volume >= 20000) return 'Silver';
  return 'Bronze';
}

async function generateAIRecommendations(apiKey: string, company: any, products: any[], visits: any[], healthScore: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `Eres un analista de banca comercial experto en cross-selling y retención de clientes.
            
Genera recomendaciones personalizadas basadas en el perfil del cliente.

Responde SOLO con JSON válido:
{
  "recommended_products": ["Producto 1", "Producto 2"],
  "cross_sell_opportunities": [
    {"product": "nombre", "reason": "razón", "priority": "high/medium/low"}
  ],
  "next_best_actions": [
    {"action": "descripción", "priority": "high/medium/low", "expected_impact": "descripción impacto"}
  ]
}`
          },
          {
            role: 'user',
            content: `Empresa: ${company.name}
Sector: ${company.sector || 'No especificado'}
Facturación: ${company.facturacion_anual || 0}€
Productos actuales: ${products?.map((p: any) => p.product?.name).join(', ') || 'Ninguno'}
Visitas totales: ${visits?.length || 0}
Health Score: ${healthScore}/100
CNAE: ${company.cnae || 'No especificado'}`
          }
        ]
      })
    });

    clearTimeout(timeout);

    if (!response.ok) return getDefaultRecommendations();

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
  } catch (e) {
    clearTimeout(timeout);
    console.log('AI recommendations error:', e);
    return getDefaultRecommendations();
  }
}

function getDefaultRecommendations() {
  return {
    recommended_products: ['TPV', 'Cuenta Empresa', 'Línea de Crédito'],
    cross_sell_opportunities: [
      { product: 'Seguro de Negocio', reason: 'Protección patrimonial', priority: 'medium' }
    ],
    next_best_actions: [
      { action: 'Programar visita de seguimiento', priority: 'high', expected_impact: 'Mejora retención' }
    ]
  };
}
