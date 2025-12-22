import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RevenueContext {
  currentMRR?: number;
  nrr?: number;
  churnRate?: number;
  expansionMRR?: number;
  atRiskAccounts?: number;
  recentAlerts?: unknown[];
  topOpportunities?: unknown[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, context } = await req.json() as {
      message: string;
      sessionId?: string;
      context?: RevenueContext;
    };

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get or create session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from('revenue_copilot_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = data;
    }

    if (!session) {
      const { data, error } = await supabase
        .from('revenue_copilot_sessions')
        .insert({
          messages: [],
          context: context || {},
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      session = data;
    }

    // Build conversation history
    const messages: ChatMessage[] = session.messages || [];
    messages.push({ role: 'user', content: message });

    // Build system prompt with revenue context
    const systemPrompt = buildSystemPrompt(context || session.context);

    // Call Lovable AI
    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || 
      'Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo.';

    // Update session with new messages
    messages.push({ role: 'assistant', content: assistantMessage });
    
    const { error: updateError } = await supabase
      .from('revenue_copilot_sessions')
      .update({
        messages,
        context: context || session.context,
        last_message_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Extract any insights or actions from the response
    const insights = extractInsights(assistantMessage);

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      message: assistantMessage,
      insights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in revenue-copilot-chat:', error);
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

function buildSystemPrompt(context: RevenueContext): string {
  const contextInfo = context ? `
CONTEXTO ACTUAL DE REVENUE:
- MRR Actual: ${context.currentMRR ? `€${context.currentMRR.toLocaleString()}` : 'No disponible'}
- NRR: ${context.nrr ? `${context.nrr}%` : 'No disponible'}
- Tasa de Churn: ${context.churnRate ? `${context.churnRate}%` : 'No disponible'}
- MRR de Expansión: ${context.expansionMRR ? `€${context.expansionMRR.toLocaleString()}` : 'No disponible'}
- Cuentas en Riesgo: ${context.atRiskAccounts || 0}
- Alertas Recientes: ${context.recentAlerts?.length || 0}
- Oportunidades Top: ${context.topOpportunities?.length || 0}
` : '';

  return `Eres el Revenue Operations Copilot, un asistente de IA especializado en inteligencia de ingresos y operaciones comerciales.

${contextInfo}

CAPACIDADES:
1. Análisis de métricas de Revenue (MRR, ARR, NRR, Churn, Expansion)
2. Identificación de oportunidades de expansión y upsell
3. Detección y análisis de riesgo de churn
4. Recomendaciones basadas en datos para mejorar ingresos
5. Explicación de tendencias y anomalías
6. Predicción y forecasting de revenue
7. Priorización de cuentas y acciones

INSTRUCCIONES:
- Responde siempre en español
- Sé conciso pero informativo
- Usa datos específicos cuando estén disponibles
- Proporciona recomendaciones accionables
- Cuando identifiques insights importantes, márcalos con [INSIGHT]
- Cuando sugieras acciones, márcalas con [ACCIÓN]
- Usa formato markdown para mejor legibilidad
- Si te preguntan algo fuera de tu ámbito, redirige amablemente al tema de revenue

Recuerda: tu objetivo es ayudar a maximizar los ingresos y reducir el churn proporcionando análisis y recomendaciones basadas en datos.`;
}

function extractInsights(message: string): string[] {
  const insights: string[] = [];
  const insightMatches = message.match(/\[INSIGHT\][^\[]+/g);
  const actionMatches = message.match(/\[ACCIÓN\][^\[]+/g);
  
  if (insightMatches) {
    insights.push(...insightMatches.map(i => i.replace('[INSIGHT]', '').trim()));
  }
  if (actionMatches) {
    insights.push(...actionMatches.map(a => a.replace('[ACCIÓN]', '').trim()));
  }
  
  return insights;
}
