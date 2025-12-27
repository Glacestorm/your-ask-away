import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NLQueryRequest {
  action: 'process_query' | 'get_suggestions' | 'explain_result' | 'execute' | 'get_history' | 'explain';
  query?: string;
  limit?: number;
  context?: {
    availableTables?: string[];
    userRole?: string;
    recentQueries?: string[];
  };
  resultData?: unknown;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, query, context, resultData } = await req.json() as NLQueryRequest;
    console.log(`[natural-language-query] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'process_query':
        systemPrompt = `Eres un asistente de análisis de datos empresariales que traduce consultas en lenguaje natural.

TABLAS DISPONIBLES: ${context?.availableTables?.join(', ') || 'companies, contacts, visits, operations, goals'}

Tu trabajo es:
1. Interpretar la pregunta del usuario
2. Generar datos de ejemplo realistas que respondan a la pregunta
3. Proporcionar insights y visualización sugerida

RESPONDE EN JSON ESTRICTO:
{
  "interpretation": string,
  "queryType": "aggregation" | "comparison" | "trend" | "detail" | "ranking",
  "data": [...],
  "columns": [{ "key": string, "label": string, "type": "string" | "number" | "date" | "percentage" }],
  "suggestedVisualization": "bar" | "line" | "pie" | "table" | "metric" | "map",
  "insights": string[],
  "followUpQuestions": string[]
}`;
        userPrompt = `Pregunta del usuario: "${query}"
Rol del usuario: ${context?.userRole || 'analyst'}`;
        break;

      case 'get_suggestions':
        systemPrompt = `Eres un asistente que sugiere consultas útiles para análisis de negocio.

Basándote en el contexto del usuario, sugiere consultas relevantes.

RESPONDE EN JSON ESTRICTO:
{
  "suggestions": [
    { "query": string, "category": string, "description": string }
  ]
}`;
        userPrompt = `Contexto: Rol ${context?.userRole}, Consultas recientes: ${context?.recentQueries?.join(', ') || 'ninguna'}`;
        break;

      case 'explain_result':
        systemPrompt = `Eres un analista que explica resultados de datos de forma clara y accionable.

RESPONDE EN JSON ESTRICTO:
{
  "summary": string,
  "keyFindings": string[],
  "recommendations": string[],
  "potentialConcerns": string[]
}`;
        userPrompt = `Explica estos resultados: ${JSON.stringify(resultData)}`;
        break;

      case 'execute':
        systemPrompt = `Eres un asistente de análisis de datos empresariales que traduce consultas en lenguaje natural.

TABLAS DISPONIBLES: companies, contacts, visits, operations, goals, profiles

Tu trabajo es:
1. Interpretar la pregunta del usuario
2. Generar una consulta SQL conceptual (no ejecutable)
3. Generar datos de ejemplo realistas
4. Proporcionar explicación y visualización sugerida

RESPONDE EN JSON ESTRICTO:
{
  "sql_generated": string,
  "data": [...],
  "columns": string[],
  "row_count": number,
  "execution_time_ms": number,
  "explanation": string,
  "visualization_type": "table" | "bar" | "line" | "pie" | "metric"
}`;
        userPrompt = `Consulta del usuario: "${query}"`;
        break;

      case 'get_history':
        // Return mock history data without calling AI
        return new Response(JSON.stringify({
          success: true,
          history: [
            { id: '1', query: '¿Cuántas empresas hay activas?', result_summary: '45 empresas activas', created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: '2', query: 'Top 10 clientes por facturación', result_summary: 'Lista de 10 principales clientes', created_at: new Date(Date.now() - 7200000).toISOString() },
            { id: '3', query: 'Tendencia de ventas mensual', result_summary: 'Gráfico de tendencia generado', created_at: new Date(Date.now() - 86400000).toISOString() }
          ]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'explain':
        systemPrompt = `Eres un experto en SQL que explica consultas de forma clara.
Explica qué haría esta consulta y cómo se traduciría a SQL.

RESPONDE EN JSON ESTRICTO:
{
  "explanation": string,
  "sql_concept": string,
  "tables_involved": string[]
}`;
        userPrompt = `Explica esta consulta en lenguaje natural: "${query}"`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[natural-language-query] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[natural-language-query] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
