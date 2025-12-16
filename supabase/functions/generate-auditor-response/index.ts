import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResponseRequest {
  questionId: string;
  periodStart: string;
  periodEnd: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { questionId, periodStart, periodEnd }: ResponseRequest = await req.json();

    console.log(`Generating AI response for question ${questionId}`);

    // 1. Fetch the question
    const { data: question, error: questionError } = await supabase
      .from('auditor_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      throw new Error('Question not found');
    }

    // 2. Collect relevant evidence based on question category
    const evidenceData: Record<string, any> = {};

    // Based on category, fetch relevant data
    if (question.category.toLowerCase().includes('acceso') || question.question_code.includes('A9')) {
      // Access control related
      const { data: accessLogs, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('action', 'LOGIN')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);
      
      evidenceData.access_logs = { count, successful: accessLogs?.length || 0 };
      
      // Count unique users
      const { data: users } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });
      evidenceData.total_users = users?.length || 0;
    }

    if (question.category.toLowerCase().includes('incidente') || question.question_code.includes('INC')) {
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('*')
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);
      
      evidenceData.incidents = {
        total: incidents?.length || 0,
        resolved: incidents?.filter(i => i.status === 'resolved').length || 0,
        open: incidents?.filter(i => i.status === 'open').length || 0,
      };

      // Calculate average resolution time
      const resolvedIncidents = incidents?.filter(i => i.resolution_time);
      if (resolvedIncidents?.length) {
        const avgTime = resolvedIncidents.reduce((acc, i) => {
          const detection = new Date(i.detection_time);
          const resolution = new Date(i.resolution_time);
          return acc + (resolution.getTime() - detection.getTime());
        }, 0) / resolvedIncidents.length;
        evidenceData.incidents.avg_resolution_hours = Math.round(avgTime / (1000 * 60 * 60) * 10) / 10;
      }
    }

    if (question.category.toLowerCase().includes('backup') || question.category.toLowerCase().includes('continuidad')) {
      const { data: backups } = await supabase
        .from('backup_verifications')
        .select('*')
        .gte('verification_date', periodStart)
        .lte('verification_date', periodEnd);
      
      evidenceData.backups = {
        total: backups?.length || 0,
        successful: backups?.filter(b => b.restored_successfully).length || 0,
        integrity_verified: backups?.filter(b => b.data_integrity_verified).length || 0,
      };
    }

    if (question.category.toLowerCase().includes('resiliencia') || question.question_code.includes('RES')) {
      const { data: stressTests } = await supabase
        .from('stress_test_executions')
        .select('*')
        .gte('execution_start', periodStart)
        .lte('execution_start', periodEnd);
      
      evidenceData.stress_tests = {
        total: stressTests?.length || 0,
        passed: stressTests?.filter(s => s.passed).length || 0,
      };

      const { data: resilienceTests } = await supabase
        .from('resilience_tests')
        .select('*')
        .gte('test_date', periodStart)
        .lte('test_date', periodEnd);
      
      evidenceData.resilience_tests = {
        total: resilienceTests?.length || 0,
        passed: resilienceTests?.filter(r => r.status === 'completed').length || 0,
      };
    }

    if (question.category.toLowerCase().includes('riesgo')) {
      const { data: riskAssessments } = await supabase
        .from('risk_assessments')
        .select('*')
        .gte('assessment_date', periodStart)
        .lte('assessment_date', periodEnd);
      
      evidenceData.risk_assessments = {
        total: riskAssessments?.length || 0,
        high_risks: riskAssessments?.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length || 0,
      };
    }

    // General audit logs count
    const { count: totalAuditLogs } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);
    evidenceData.total_audit_events = totalAuditLogs || 0;

    // 3. Generate AI response using Gemini
    const prompt = `
Eres un experto en compliance y auditoría para el sector ${question.sector_key}. 
Genera una respuesta profesional y detallada para la siguiente pregunta de auditoría:

**Pregunta (${question.question_code}):** ${question.question_text}

**Categoría:** ${question.category}
**Prioridad:** ${question.priority}
**Período del informe:** ${periodStart} a ${periodEnd}

**Datos recopilados del sistema:**
${JSON.stringify(evidenceData, null, 2)}

**Plantilla de respuesta sugerida:** ${question.standard_response_template || 'No disponible'}

**Instrucciones:**
1. Genera una respuesta formal y profesional en español
2. Incluye datos específicos del sistema cuando estén disponibles
3. Si faltan datos, indica qué información adicional se necesitaría
4. La respuesta debe ser adecuada para un informe de auditoría oficial
5. Máximo 300 palabras
6. Usa terminología técnica apropiada para el sector ${question.sector_key}

Responde SOLO con el texto de la respuesta, sin encabezados ni explicaciones adicionales.
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un experto en auditoría y compliance bancario. Respondes de forma profesional y técnica.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI Gateway error:', await aiResponse.text());
      // Fallback to template response
      const fallbackResponse = question.standard_response_template || 
        `Durante el período ${periodStart} a ${periodEnd}, se han implementado los controles correspondientes según los requisitos de ${question.regulation_code}. Se adjunta evidencia de cumplimiento.`;
      
      // Save the response
      const { data: savedResponse, error: saveError } = await supabase
        .from('auditor_responses')
        .upsert({
          question_id: questionId,
          response_text: fallbackResponse,
          auto_generated_evidence: evidenceData,
          status: 'draft',
          last_updated_at: new Date().toISOString(),
        }, {
          onConflict: 'question_id',
        })
        .select()
        .single();

      return new Response(JSON.stringify({
        success: true,
        response: {
          text: fallbackResponse,
          evidence: evidenceData,
          ai_generated: false,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content || question.standard_response_template;

    // 4. Save or update the response
    const { data: existingResponse } = await supabase
      .from('auditor_responses')
      .select('id')
      .eq('question_id', questionId)
      .single();

    let savedResponse;
    if (existingResponse) {
      const { data, error } = await supabase
        .from('auditor_responses')
        .update({
          response_text: generatedText,
          auto_generated_evidence: evidenceData,
          status: 'draft',
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', existingResponse.id)
        .select()
        .single();
      savedResponse = data;
    } else {
      const { data, error } = await supabase
        .from('auditor_responses')
        .insert({
          question_id: questionId,
          response_text: generatedText,
          auto_generated_evidence: evidenceData,
          status: 'draft',
        })
        .select()
        .single();
      savedResponse = data;
    }

    console.log(`Response generated successfully for question ${question.question_code}`);

    return new Response(JSON.stringify({
      success: true,
      response: {
        id: savedResponse?.id,
        text: generatedText,
        evidence: evidenceData,
        ai_generated: true,
        question_code: question.question_code,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating auditor response:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
