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

    const { companyId, planType = 'standard' } = await req.json();

    if (!companyId) {
      throw new Error('companyId is required');
    }

    console.log(`Generating success plan for company: ${companyId}, type: ${planType}`);

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError) throw companyError;

    // Get adoption scores
    const { data: adoptionScore } = await supabase
      .from('adoption_scores')
      .select('*')
      .eq('company_id', companyId)
      .single();

    // Get onboarding progress
    const { data: onboardingProgress } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get feature usage
    const { data: featureUsage } = await supabase
      .from('feature_usage_tracking')
      .select('feature_key, product_key, usage_count, last_used_at')
      .eq('company_id', companyId)
      .order('usage_count', { ascending: false })
      .limit(10);

    // Get health score
    const { data: healthScore } = await supabase
      .from('customer_health_scores')
      .select('*')
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    // Build context for AI
    const context = {
      company: {
        name: company?.name,
        sector: company?.sector,
        segment: company?.segment,
        facturacion: company?.facturacion_anual,
        empleados: company?.empleados,
      },
      adoption: adoptionScore || { overall_score: 50, risk_level: 'medium' },
      onboarding: {
        status: onboardingProgress?.status || 'not_started',
        progress: onboardingProgress?.progress_percentage || 0,
      },
      topFeatures: featureUsage?.slice(0, 5) || [],
      health: healthScore?.overall_score || 50,
      planType,
    };

    // Generate AI-powered success plan
    const aiPrompt = `Genera un plan de éxito del cliente para la siguiente empresa:

Empresa: ${context.company.name}
Sector: ${context.company.sector || 'No especificado'}
Segmento: ${context.company.segment || 'No especificado'}
Facturación anual: ${context.company.facturacion ? `€${context.company.facturacion.toLocaleString()}` : 'No especificado'}

Estado actual:
- Score de adopción: ${context.adoption.overall_score}%
- Nivel de riesgo: ${context.adoption.risk_level}
- Progreso onboarding: ${context.onboarding.progress}%
- Health Score: ${context.health}%
- Tipo de plan: ${planType}

Features más usados: ${context.topFeatures.map((f: { feature_key: string }) => f.feature_key).join(', ') || 'Ninguno'}

Genera un JSON con el siguiente formato:
{
  "plan_name": "Nombre descriptivo del plan",
  "objectives": [
    {
      "id": "obj_1",
      "title": "Título del objetivo",
      "description": "Descripción detallada",
      "target_date_days": 30,
      "kpis": ["KPI 1", "KPI 2"]
    }
  ],
  "goals": [
    {
      "title": "Título de la meta",
      "description": "Descripción",
      "type": "adoption|engagement|outcome|expansion",
      "target_metric": "nombre_metrica",
      "target_value": 80,
      "unit": "%",
      "target_days": 30,
      "milestones": [
        {"title": "Milestone 1", "target_days": 7}
      ]
    }
  ],
  "risk_factors": [
    {
      "risk": "Descripción del riesgo",
      "mitigation": "Estrategia de mitigación",
      "severity": "low|medium|high"
    }
  ],
  "success_criteria": [
    "Criterio 1",
    "Criterio 2"
  ],
  "recommendations": [
    "Recomendación 1",
    "Recomendación 2"
  ]
}

Asegúrate de que el plan sea específico para el perfil de la empresa y su estado actual.`;

    // Call Lovable AI endpoint
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
            content: 'Eres un experto en Customer Success. Genera planes de éxito detallados y accionables en formato JSON válido.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    let aiPlan;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      try {
        const content = aiData.choices?.[0]?.message?.content || aiData.content;
        aiPlan = JSON.parse(content);
      } catch {
        console.log('Failed to parse AI response, using default plan');
        aiPlan = generateDefaultPlan(context);
      }
    } else {
      console.log('AI request failed, using default plan');
      aiPlan = generateDefaultPlan(context);
    }

    // Calculate dates
    const startDate = new Date();
    const targetCompletionDate = new Date();
    targetCompletionDate.setDate(startDate.getDate() + 90);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(startDate.getDate() + 30);

    // Create success plan
    const { data: successPlan, error: planError } = await supabase
      .from('success_plans')
      .insert({
        company_id: companyId,
        plan_name: aiPlan.plan_name || `Plan de Éxito - ${company?.name}`,
        plan_type: planType,
        status: 'active',
        objectives: aiPlan.objectives || [],
        current_health_score: context.health,
        target_health_score: 80,
        ai_generated: true,
        ai_generation_context: context,
        risk_factors: aiPlan.risk_factors || [],
        success_criteria: aiPlan.success_criteria || [],
        start_date: startDate.toISOString().split('T')[0],
        target_completion_date: targetCompletionDate.toISOString().split('T')[0],
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        review_frequency: planType === 'accelerated' ? 'weekly' : 'monthly',
      })
      .select()
      .single();

    if (planError) throw planError;

    // Create goals
    if (aiPlan.goals && aiPlan.goals.length > 0) {
      const goalsToInsert = aiPlan.goals.map((goal: {
        title: string;
        description?: string;
        type?: string;
        target_metric?: string;
        target_value?: number;
        unit?: string;
        target_days?: number;
        milestones?: { title: string; target_days: number }[];
      }) => {
        const targetDate = new Date();
        targetDate.setDate(startDate.getDate() + (goal.target_days || 30));
        
        return {
          plan_id: successPlan.id,
          goal_title: goal.title,
          goal_description: goal.description,
          goal_type: goal.type || 'adoption',
          target_metric: goal.target_metric,
          target_value: goal.target_value,
          unit: goal.unit || '%',
          start_date: startDate.toISOString().split('T')[0],
          target_date: targetDate.toISOString().split('T')[0],
          status: 'not_started',
          milestones: goal.milestones || [],
          ai_recommendations: aiPlan.recommendations || [],
        };
      });

      await supabase.from('success_plan_goals').insert(goalsToInsert);
    }

    console.log(`Success plan created: ${successPlan.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        plan: successPlan,
        recommendations: aiPlan.recommendations || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating success plan:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateDefaultPlan(context: {
  company: { name?: string };
  adoption: { overall_score?: number; risk_level?: string };
  onboarding: { progress?: number };
}) {
  const isLowAdoption = (context.adoption?.overall_score || 0) < 50;
  const isOnboardingIncomplete = (context.onboarding?.progress || 0) < 100;

  return {
    plan_name: `Plan de Éxito - ${context.company.name}`,
    objectives: [
      {
        id: 'obj_1',
        title: isOnboardingIncomplete ? 'Completar Onboarding' : 'Aumentar Adopción',
        description: isOnboardingIncomplete 
          ? 'Asegurar que el cliente complete todos los pasos del onboarding'
          : 'Incrementar el uso de features clave del producto',
        target_date_days: 30,
        kpis: ['Progreso de onboarding', 'Features activos']
      },
      {
        id: 'obj_2',
        title: 'Demostrar Valor',
        description: 'Ayudar al cliente a obtener valor tangible del producto',
        target_date_days: 60,
        kpis: ['ROI demostrado', 'Casos de uso implementados']
      }
    ],
    goals: [
      {
        title: isOnboardingIncomplete ? 'Completar onboarding al 100%' : 'Alcanzar 70% de adopción',
        description: 'Meta principal de activación',
        type: 'adoption',
        target_metric: isOnboardingIncomplete ? 'onboarding_progress' : 'adoption_score',
        target_value: isOnboardingIncomplete ? 100 : 70,
        unit: '%',
        target_days: 30,
        milestones: [
          { title: 'Primer checkpoint', target_days: 7 },
          { title: 'Revisión intermedia', target_days: 14 }
        ]
      },
      {
        title: 'Engagement semanal consistente',
        description: 'Lograr uso activo del producto cada semana',
        type: 'engagement',
        target_metric: 'weekly_active_days',
        target_value: 4,
        unit: 'días',
        target_days: 60,
        milestones: []
      }
    ],
    risk_factors: isLowAdoption ? [
      {
        risk: 'Bajo nivel de adopción actual',
        mitigation: 'Programar sesiones de entrenamiento personalizadas',
        severity: 'high'
      }
    ] : [],
    success_criteria: [
      'Cliente usando el producto regularmente',
      'Al menos 3 casos de uso implementados',
      'NPS >= 8'
    ],
    recommendations: [
      'Programar llamada de seguimiento semanal durante el primer mes',
      'Enviar recursos de capacitación personalizados',
      'Identificar quick wins para demostrar valor rápidamente'
    ]
  };
}
