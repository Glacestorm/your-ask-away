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

    const { companyId, quarter, year } = await req.json();

    if (!companyId || !quarter || !year) {
      throw new Error('companyId, quarter, and year are required');
    }

    console.log(`Generating QBR for company: ${companyId}, ${quarter}-${year}`);

    // Get company data
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    // Get success plan
    const { data: successPlan } = await supabase
      .from('success_plans')
      .select('*, success_plan_goals(*)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get health score history
    const { data: healthScores } = await supabase
      .from('customer_health_scores')
      .select('overall_score, calculated_at')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(12);

    // Get adoption scores
    const { data: adoptionScore } = await supabase
      .from('adoption_scores')
      .select('*')
      .eq('company_id', companyId)
      .single();

    // Get NPS responses
    const { data: npsResponses } = await supabase
      .from('nps_responses')
      .select('score, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(4);

    // Get milestones achieved
    const { data: milestones } = await supabase
      .from('company_milestones')
      .select('*, adoption_milestones(*)')
      .eq('company_id', companyId)
      .order('achieved_at', { ascending: false })
      .limit(10);

    // Get feature usage
    const { data: featureUsage } = await supabase
      .from('feature_usage_tracking')
      .select('feature_key, usage_count')
      .eq('company_id', companyId)
      .order('usage_count', { ascending: false })
      .limit(10);

    // Get recent activities
    const { data: recentInteractions } = await supabase
      .from('customer_interactions')
      .select('interaction_type, summary, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build QBR context
    const context = {
      company: {
        name: company?.name,
        sector: company?.sector,
        segment: company?.segment,
      },
      healthScore: {
        current: healthScores?.[0]?.overall_score || 50,
        previous: healthScores?.[3]?.overall_score || 50,
        trend: (healthScores?.[0]?.overall_score || 50) - (healthScores?.[3]?.overall_score || 50),
      },
      adoption: adoptionScore || {},
      nps: {
        current: npsResponses?.[0]?.score,
        average: npsResponses?.length 
          ? npsResponses.reduce((acc, r) => acc + r.score, 0) / npsResponses.length 
          : null,
      },
      successPlan: successPlan ? {
        name: successPlan.plan_name,
        goalsCompleted: successPlan.success_plan_goals?.filter((g: { status: string }) => g.status === 'completed').length || 0,
        goalsTotal: successPlan.success_plan_goals?.length || 0,
      } : null,
      milestonesAchieved: milestones?.length || 0,
      topFeatures: featureUsage?.slice(0, 5) || [],
      recentInteractions: recentInteractions?.slice(0, 5) || [],
    };

    // Generate AI summary and recommendations
    const aiPrompt = `Genera un resumen para la Quarterly Business Review (QBR) de la siguiente empresa:

Empresa: ${context.company.name}
Sector: ${context.company.sector}
Período: ${quarter}-${year}

Métricas del trimestre:
- Health Score: ${context.healthScore.current}% (${context.healthScore.trend >= 0 ? '+' : ''}${context.healthScore.trend}% vs trimestre anterior)
- Score de Adopción: ${(context.adoption as { overall_score?: number })?.overall_score || 'N/A'}%
- NPS actual: ${context.nps.current || 'N/A'}
- NPS promedio: ${context.nps.average?.toFixed(1) || 'N/A'}
${context.successPlan ? `- Plan de éxito: ${context.successPlan.goalsCompleted}/${context.successPlan.goalsTotal} objetivos completados` : ''}
- Hitos alcanzados: ${context.milestonesAchieved}

Features más usados: ${context.topFeatures.map((f: { feature_key: string }) => f.feature_key).join(', ') || 'No disponible'}

Genera un JSON con:
{
  "period_summary": {
    "highlights": ["Logro 1", "Logro 2"],
    "challenges": ["Desafío 1"],
    "key_metrics": {
      "health_score_change": "+/-X%",
      "adoption_change": "+/-X%"
    }
  },
  "achievements": [
    {"title": "Logro", "impact": "alto/medio/bajo", "description": "Descripción"}
  ],
  "challenges": [
    {"title": "Desafío", "severity": "alta/media/baja", "recommendation": "Recomendación"}
  ],
  "next_quarter_goals": [
    {"title": "Objetivo", "priority": 1, "kpis": ["KPI 1"]}
  ],
  "expansion_opportunities": [
    {"product": "Producto", "reason": "Razón", "potential_value": "Alto/Medio/Bajo"}
  ],
  "ai_recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ],
  "risk_assessment": {
    "level": "bajo/medio/alto",
    "factors": ["Factor 1"],
    "mitigations": ["Mitigación 1"]
  }
}`;

    // Call Lovable AI
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/lovable-ai`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en Customer Success y QBRs. Genera análisis detallados y accionables en JSON válido.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    let aiAnalysis;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      try {
        const content = aiData.choices?.[0]?.message?.content || aiData.content;
        aiAnalysis = JSON.parse(content);
      } catch {
        console.log('Failed to parse AI response, using defaults');
        aiAnalysis = generateDefaultQBRAnalysis(context);
      }
    } else {
      aiAnalysis = generateDefaultQBRAnalysis(context);
    }

    // Create QBR record
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 7);

    const { data: qbr, error: qbrError } = await supabase
      .from('qbr_records')
      .insert({
        company_id: companyId,
        success_plan_id: successPlan?.id,
        quarter,
        year,
        status: 'scheduled',
        scheduled_date: scheduledDate.toISOString(),
        duration_minutes: 60,
        agenda: [
          { topic: 'Resumen del período', duration_minutes: 10, presenter: 'CSM' },
          { topic: 'Métricas y KPIs', duration_minutes: 15, presenter: 'CSM' },
          { topic: 'Logros y desafíos', duration_minutes: 15, presenter: 'Cliente' },
          { topic: 'Objetivos próximo trimestre', duration_minutes: 15, presenter: 'Ambos' },
          { topic: 'Q&A y cierre', duration_minutes: 5, presenter: 'Ambos' },
        ],
        period_summary: aiAnalysis.period_summary,
        achievements: aiAnalysis.achievements,
        challenges: aiAnalysis.challenges,
        metrics_reviewed: {
          health_score: context.healthScore.current,
          adoption_score: (context.adoption as { overall_score?: number })?.overall_score,
          nps: context.nps.current,
        },
        health_score_at_review: context.healthScore.current,
        nps_at_review: context.nps.current,
        next_quarter_goals: aiAnalysis.next_quarter_goals,
        expansion_opportunities: aiAnalysis.expansion_opportunities,
        ai_generated_summary: `QBR ${quarter}-${year} para ${context.company.name}. Health Score: ${context.healthScore.current}%. Tendencia: ${context.healthScore.trend >= 0 ? 'positiva' : 'negativa'}.`,
        ai_generated_recommendations: aiAnalysis.ai_recommendations,
        ai_risk_assessment: aiAnalysis.risk_assessment,
      })
      .select()
      .single();

    if (qbrError) throw qbrError;

    console.log(`QBR created: ${qbr.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        qbr,
        analysis: aiAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating QBR:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateDefaultQBRAnalysis(context: {
  company: { name?: string };
  healthScore: { current: number; trend: number };
  adoption: { overall_score?: number };
  successPlan: { goalsCompleted: number; goalsTotal: number } | null;
}) {
  const isHealthy = context.healthScore.current >= 70;
  const isImproving = context.healthScore.trend >= 0;

  return {
    period_summary: {
      highlights: isHealthy 
        ? ['Cliente saludable con buen engagement', 'Uso consistente del producto']
        : ['Identificadas áreas de mejora', 'Plan de acción definido'],
      challenges: isImproving 
        ? []
        : ['Necesita aumentar la adopción'],
      key_metrics: {
        health_score_change: `${context.healthScore.trend >= 0 ? '+' : ''}${context.healthScore.trend}%`,
        adoption_change: 'Ver detalle',
      }
    },
    achievements: [
      {
        title: context.successPlan 
          ? `${context.successPlan.goalsCompleted} objetivos completados`
          : 'Onboarding en progreso',
        impact: context.successPlan && context.successPlan.goalsCompleted > 0 ? 'alto' : 'medio',
        description: 'Progreso en el plan de éxito'
      }
    ],
    challenges: isHealthy ? [] : [
      {
        title: 'Adopción por debajo del objetivo',
        severity: 'media',
        recommendation: 'Programar sesión de entrenamiento'
      }
    ],
    next_quarter_goals: [
      {
        title: 'Mantener health score sobre 70%',
        priority: 1,
        kpis: ['Health Score', 'NPS']
      },
      {
        title: 'Expandir uso de features avanzados',
        priority: 2,
        kpis: ['Features activos', 'Profundidad de uso']
      }
    ],
    expansion_opportunities: isHealthy ? [
      {
        product: 'Módulo adicional',
        reason: 'Cliente saludable con potencial de crecimiento',
        potential_value: 'Alto'
      }
    ] : [],
    ai_recommendations: [
      'Revisar objetivos del plan de éxito',
      'Programar check-in mensual',
      isHealthy ? 'Explorar oportunidades de expansión' : 'Enfocarse en aumentar adopción'
    ],
    risk_assessment: {
      level: isHealthy ? 'bajo' : (context.healthScore.current < 50 ? 'alto' : 'medio'),
      factors: isHealthy ? [] : ['Health score por debajo del objetivo'],
      mitigations: ['Seguimiento proactivo', 'Plan de recuperación si necesario']
    }
  };
}
