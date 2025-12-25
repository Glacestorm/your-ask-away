import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  action: 'get_events' | 'analyze_risks' | 'export_log';
  context?: {
    timeRange?: string;
    filters?: Record<string, unknown>;
  };
  format?: string;
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

    const { action, context, format } = await req.json() as AuditRequest;

    console.log(`[security-audit] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_events':
        systemPrompt = `Eres un sistema de auditoría de seguridad enterprise.
        
Genera eventos de auditoría de seguridad realistas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "events": [
    {
      "id": "uuid",
      "event_type": "tipo",
      "severity": "low|medium|high|critical",
      "user_id": "uuid",
      "user_email": "email",
      "action": "descripción de acción",
      "resource_type": "tipo recurso",
      "resource_id": "uuid",
      "ip_address": "IP",
      "status": "success|failure|blocked",
      "timestamp": "ISO timestamp"
    }
  ],
  "summary": {
    "total_events": número,
    "by_severity": {"low": n, "medium": n, "high": n, "critical": n},
    "by_status": {"success": n, "failure": n, "blocked": n},
    "recent_critical": [],
    "top_users": [],
    "suspicious_patterns": []
  }
}`;
        userPrompt = `Genera eventos de auditoría para rango: ${context?.timeRange || 'day'}`;
        break;

      case 'analyze_risks':
        systemPrompt = `Eres un analista de riesgos de seguridad.
        
FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "risk_score": 0-100,
    "risk_level": "low|medium|high|critical",
    "top_risks": [
      {
        "risk_type": "tipo",
        "description": "descripción",
        "likelihood": 0-100,
        "impact": 0-100,
        "recommendations": ["recomendaciones"]
      }
    ],
    "attack_vectors": [],
    "vulnerable_assets": [],
    "trend": "improving|stable|worsening"
  }
}`;
        userPrompt = 'Analiza riesgos de seguridad del sistema';
        break;

      case 'export_log':
        systemPrompt = `Eres un generador de informes de auditoría.
        
FORMATO DE RESPUESTA (JSON estricto):
{
  "export": {
    "format": "${format || 'json'}",
    "generated_at": "ISO timestamp",
    "period": "descripción período",
    "total_records": número,
    "file_size_kb": número,
    "download_url": "url",
    "checksum": "hash"
  }
}`;
        userPrompt = `Exportar log en formato ${format || 'json'}`;
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
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

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

    console.log(`[security-audit] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[security-audit] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
