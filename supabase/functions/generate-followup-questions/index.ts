import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FollowupQuestion {
  question: string;
  question_type: 'open_text' | 'single_choice' | 'scale';
  options?: string[];
  priority: number;
  context: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      survey_id,
      company_id,
      initial_score,
      survey_type,
      initial_feedback,
      company_context
    } = await req.json();

    console.log(`[generate-followup] Generating questions for score ${initial_score}, type ${survey_type}`);

    // Get company context if not provided
    let context = company_context;
    if (!context && company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name, sector, segmento, facturacion_anual')
        .eq('id', company_id)
        .single();
      
      context = company;
    }

    // Get configured flows for this survey
    const { data: flows } = await supabase
      .from('conversational_survey_flows')
      .select('*')
      .eq('survey_id', survey_id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const questions: FollowupQuestion[] = [];

    // Check configured flows first
    if (flows && flows.length > 0) {
      for (const flow of flows) {
        if (matchesCondition(flow, initial_score, context, initial_feedback)) {
          questions.push({
            question: flow.followup_question,
            question_type: flow.question_type,
            options: flow.options,
            priority: flow.priority,
            context: `Configured flow: ${flow.condition_type}`
          });
        }
      }
    }

    // Generate AI-powered dynamic questions if needed
    if (questions.length === 0) {
      const dynamicQuestions = await generateDynamicQuestions(
        initial_score,
        survey_type,
        initial_feedback,
        context
      );
      questions.push(...dynamicQuestions);
    }

    // Sort by priority and limit
    const sortedQuestions = questions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);

    return new Response(
      JSON.stringify({
        success: true,
        questions: sortedQuestions,
        total_available: questions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[generate-followup] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function matchesCondition(
  flow: any,
  score: number,
  context: any,
  feedback: string | null
): boolean {
  const { condition_type, condition_value } = flow;

  switch (condition_type) {
    case 'score_range':
      const { min_score = 0, max_score = 10 } = condition_value;
      return score >= min_score && score <= max_score;

    case 'segment':
      if (!context?.segmento) return false;
      return context.segmento === condition_value.segment;

    case 'sentiment':
      if (!feedback) return false;
      // Simple keyword matching for sentiment
      const negativeSentiment = condition_value.sentiment === 'negative';
      const hasNegativeKeywords = /problema|mal|peor|terrible|horrible|frustrado/i.test(feedback);
      return negativeSentiment ? hasNegativeKeywords : !hasNegativeKeywords;

    case 'previous_answer':
      // This would need the previous answer context
      return false;

    default:
      return false;
  }
}

async function generateDynamicQuestions(
  score: number,
  surveyType: string,
  feedback: string | null,
  context: any
): Promise<FollowupQuestion[]> {
  const questions: FollowupQuestion[] = [];
  const sector = context?.sector?.toLowerCase() || '';
  const segment = context?.segmento || '';

  // Detractor questions (0-6)
  if (score <= 6) {
    questions.push({
      question: '¿Cuál es el principal problema que has experimentado?',
      question_type: 'single_choice',
      options: [
        'Tiempo de respuesta lento',
        'Calidad del servicio/producto',
        'Comunicación deficiente',
        'Precio no competitivo',
        'Falta de seguimiento',
        'Otro'
      ],
      priority: 1,
      context: 'detractor_root_cause'
    });

    questions.push({
      question: '¿Qué podríamos hacer para mejorar tu experiencia?',
      question_type: 'open_text',
      priority: 2,
      context: 'detractor_improvement'
    });

    // Sector-specific for detractors
    if (sector.includes('retail') || sector.includes('comercio')) {
      questions.push({
        question: '¿Has considerado cambiarte a la competencia?',
        question_type: 'single_choice',
        options: ['Sí, activamente buscando', 'Lo he pensado', 'No por ahora', 'No, me quedo con vosotros'],
        priority: 3,
        context: 'detractor_churn_risk'
      });
    }
  }
  // Passive questions (7-8)
  else if (score <= 8) {
    questions.push({
      question: '¿Qué nos falta para que nos recomiendes con más entusiasmo?',
      question_type: 'open_text',
      priority: 1,
      context: 'passive_gap'
    });

    questions.push({
      question: '¿Qué aspecto valoras más de nuestra relación?',
      question_type: 'single_choice',
      options: [
        'Atención personalizada',
        'Calidad de productos/servicios',
        'Precio competitivo',
        'Rapidez de respuesta',
        'Confianza y transparencia'
      ],
      priority: 2,
      context: 'passive_value'
    });
  }
  // Promoter questions (9-10)
  else {
    questions.push({
      question: '¿Qué es lo que más valoras de trabajar con nosotros?',
      question_type: 'open_text',
      priority: 1,
      context: 'promoter_value'
    });

    questions.push({
      question: '¿Estarías dispuesto a darnos un testimonio o participar en un caso de éxito?',
      question_type: 'single_choice',
      options: ['Sí, con gusto', 'Quizás más adelante', 'Prefiero no hacerlo'],
      priority: 2,
      context: 'promoter_advocacy'
    });

    // Upsell opportunity for high-value promoters
    if (segment === 'enterprise' || (context?.facturacion_anual && context.facturacion_anual > 1000000)) {
      questions.push({
        question: '¿Te gustaría conocer nuestros nuevos servicios premium?',
        question_type: 'single_choice',
        options: ['Sí, contactadme', 'Enviadme información por email', 'No por ahora'],
        priority: 3,
        context: 'promoter_upsell'
      });
    }
  }

  // CES-specific questions
  if (surveyType === 'ces') {
    if (score >= 5) { // High effort
      questions.push({
        question: '¿En qué parte del proceso encontraste más fricción?',
        question_type: 'single_choice',
        options: [
          'Encontrar información',
          'Contactar con alguien',
          'Resolver mi problema',
          'Tiempos de espera',
          'Proceso en general'
        ],
        priority: 1,
        context: 'ces_friction_point'
      });
    }
  }

  return questions;
}