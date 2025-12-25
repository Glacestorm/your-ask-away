import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const { action, scope, anomaly_id, status, notes } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'detect':
        systemPrompt = `Eres un sistema de detección de anomalías multi-dimensional.

Detecta desviaciones significativas en métricas de negocio, comportamiento y rendimiento.

FORMATO JSON:
{
  "anomalies": [
    {
      "id": "uuid",
      "anomaly_type": "revenue|usage|behavior|security|performance|cost",
      "severity": "low|medium|high|critical",
      "detected_at": "ISO date",
      "entity_type": "company|user|product|system",
      "entity_id": "uuid",
      "entity_name": "string",
      "metric_name": "string",
      "expected_value": number,
      "actual_value": number,
      "deviation_percentage": number,
      "confidence": 0-100,
      "root_cause_analysis": [
        { "cause": "string", "probability": 0-100, "evidence": ["string"], "related_anomalies": ["uuid"] }
      ],
      "recommended_actions": [
        { "action": "string", "priority": "low|medium|high|urgent", "automated": boolean, "estimated_time_minutes": number }
      ],
      "status": "new"
    }
  ],
  "stats": {
    "total_detected": number,
    "by_severity": { "low": number, "medium": number, "high": number, "critical": number },
    "by_type": { "revenue": number, "usage": number, "behavior": number, "security": number, "performance": number, "cost": number },
    "false_positive_rate": number,
    "avg_resolution_time_hours": number,
    "trend": "increasing|stable|decreasing"
  }
}`;
        userPrompt = `Detecta anomalías${scope ? ` con filtros: ${JSON.stringify(scope)}` : ' en todo el sistema'}. Genera 8-12 anomalías variadas.`;
        break;

      case 'analyze':
        systemPrompt = `Realiza análisis profundo de una anomalía específica.

FORMATO JSON:
{
  "analysis": {
    "anomaly_id": "string",
    "detailed_timeline": [
      { "timestamp": "ISO date", "event": "string", "significance": "string" }
    ],
    "impact_assessment": {
      "financial_impact": number,
      "users_affected": number,
      "severity_escalation_risk": 0-100
    },
    "correlation_map": [
      { "related_entity": "string", "correlation_strength": 0-100, "relationship": "string" }
    ],
    "resolution_playbook": {
      "immediate_actions": ["string"],
      "short_term_fixes": ["string"],
      "long_term_prevention": ["string"]
    }
  }
}`;
        userPrompt = `Analiza anomalía ID: ${anomaly_id}`;
        break;

      case 'update_status':
        return new Response(JSON.stringify({
          success: true,
          updated: { anomaly_id, status, notes, updated_at: new Date().toISOString() }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      case 'get_patterns':
        systemPrompt = `Identifica patrones recurrentes de anomalías.

FORMATO JSON:
{
  "patterns": [
    {
      "pattern_id": "uuid",
      "pattern_name": "string",
      "frequency": number,
      "typical_severity": "low|medium|high|critical",
      "common_causes": ["string"],
      "auto_resolution_possible": boolean
    }
  ]
}`;
        userPrompt = `Identifica los 5-8 patrones de anomalías más frecuentes.`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[predictive-anomalies] Processing: ${action}`);

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      result = {};
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('[predictive-anomalies] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
