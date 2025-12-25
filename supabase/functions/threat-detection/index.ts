import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatRequest {
  action: 'get_threats' | 'run_scan' | 'investigate' | 'mitigate' | 'acknowledge_alert';
  timeRange?: string;
  scope?: string;
  target?: string;
  indicatorId?: string;
  alertId?: string;
  mitigationAction?: string;
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

    const { action, timeRange, scope, target, indicatorId, alertId, mitigationAction } = await req.json() as ThreatRequest;

    console.log(`[threat-detection] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_threats':
        systemPrompt = `Eres un sistema de detección de amenazas enterprise.
        
Genera indicadores de amenazas y alertas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "indicators": [
    {
      "id": "uuid",
      "threat_type": "malware|phishing|brute_force|ddos|data_exfiltration|insider_threat|anomaly",
      "severity": "low|medium|high|critical",
      "confidence": 0-100,
      "source_ip": "IP",
      "target_resource": "recurso",
      "indicators": ["indicadores"],
      "first_seen": "ISO timestamp",
      "last_seen": "ISO timestamp",
      "occurrence_count": número,
      "status": "active|investigating|mitigated|false_positive",
      "mitre_tactics": ["tácticas MITRE"],
      "mitre_techniques": ["técnicas MITRE"]
    }
  ],
  "alerts": [
    {
      "id": "uuid",
      "indicator_id": "uuid",
      "alert_type": "tipo",
      "title": "título",
      "description": "descripción",
      "severity": "low|medium|high|critical",
      "triggered_at": "ISO timestamp",
      "recommended_actions": ["acciones"]
    }
  ],
  "intelligence": [
    {
      "id": "uuid",
      "source": "fuente",
      "ioc_type": "ip|domain|hash|url|email",
      "ioc_value": "valor",
      "threat_type": "tipo",
      "confidence": 0-100,
      "tags": ["tags"]
    }
  ]
}`;
        userPrompt = `Detectar amenazas en rango: ${timeRange || '24h'}`;
        break;

      case 'run_scan':
        systemPrompt = `Eres un escáner de seguridad avanzado.
        
FORMATO DE RESPUESTA (JSON estricto):
{
  "scan_results": {
    "scan_id": "uuid",
    "scope": "${scope || 'quick'}",
    "started_at": "ISO timestamp",
    "completed_at": "ISO timestamp",
    "duration_seconds": número,
    "threats_found": número,
    "vulnerabilities": [
      {
        "id": "uuid",
        "type": "tipo",
        "severity": "severidad",
        "affected_asset": "activo",
        "description": "descripción",
        "remediation": "remediación"
      }
    ],
    "recommendations": []
  }
}`;
        userPrompt = `Ejecutar escaneo ${scope} ${target ? `en ${target}` : 'completo'}`;
        break;

      case 'investigate':
        systemPrompt = `Eres un investigador de amenazas de seguridad.
        
FORMATO DE RESPUESTA (JSON estricto):
{
  "investigation": {
    "indicator_id": "uuid",
    "status": "in_progress|completed",
    "timeline": [
      {
        "timestamp": "ISO timestamp",
        "event": "evento",
        "details": "detalles"
      }
    ],
    "affected_systems": [],
    "attack_chain": [],
    "iocs_discovered": [],
    "root_cause": "causa raíz",
    "recommendations": [],
    "confidence": 0-100
  }
}`;
        userPrompt = `Investigar amenaza ${indicatorId}`;
        break;

      case 'mitigate':
        systemPrompt = `Eres un sistema de mitigación de amenazas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "mitigation": {
    "indicator_id": "uuid",
    "action_taken": "acción",
    "status": "success|partial|failed",
    "blocked_resources": [],
    "quarantined_items": [],
    "rules_applied": [],
    "rollback_available": boolean,
    "follow_up_required": boolean
  }
}`;
        userPrompt = `Mitigar amenaza ${indicatorId} con acción: ${mitigationAction}`;
        break;

      case 'acknowledge_alert':
        systemPrompt = `Eres un gestor de alertas de seguridad.

FORMATO DE RESPUESTA (JSON estricto):
{
  "acknowledged": true,
  "alert_id": "uuid",
  "acknowledged_at": "ISO timestamp",
  "next_steps": []
}`;
        userPrompt = `Reconocer alerta ${alertId}`;
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

    console.log(`[threat-detection] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[threat-detection] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
