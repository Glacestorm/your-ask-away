/**
 * ERP Anomaly Detection - Detección de anomalías y fraude con IA
 * Tendencia 2025-2027: AML/Fraud detection, behavioral analytics
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnomalyRequest {
  action: 'detect_anomalies' | 'fraud_score' | 'behavioral_analysis' | 'real_time_monitor';
  company_id?: string;
  transactions?: any[];
  user_behavior?: any;
  time_range?: { start: string; end: string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, company_id, transactions, user_behavior, time_range } = await req.json() as AnomalyRequest;

    let systemPrompt = '';
    let userPrompt = '';
    let result: any = {};

    switch (action) {
      case 'detect_anomalies':
        systemPrompt = `Eres un sistema avanzado de detección de anomalías contables usando técnicas de ML.

TIPOS DE ANOMALÍAS A DETECTAR:
1. Outliers estadísticos (desviación >3σ)
2. Anomalías temporales (horarios inusuales)
3. Patrones de splitting (fraccionamiento para evadir controles)
4. Duplicados ocultos
5. Cuentas puente sospechosas
6. Variaciones inexplicables
7. Descuadres sistemáticos
8. Operaciones circulares

TÉCNICAS:
- Isolation Forest conceptual
- DBSCAN clustering
- Análisis de series temporales
- Reglas de negocio

FORMATO DE RESPUESTA (JSON estricto):
{
  "anomalies": [
    {
      "id": "string",
      "type": "statistical" | "temporal" | "behavioral" | "pattern" | "structural",
      "severity": "low" | "medium" | "high" | "critical",
      "score": 0-100,
      "description": "string",
      "affected_transactions": ["string"],
      "affected_accounts": ["string"],
      "detection_method": "string",
      "recommendations": ["string"],
      "false_positive_probability": 0-100
    }
  ],
  "summary": {
    "total_analyzed": number,
    "anomalies_found": number,
    "critical_count": number,
    "high_count": number,
    "medium_count": number,
    "low_count": number,
    "overall_risk_score": 0-100
  },
  "patterns_detected": [
    {
      "pattern": "string",
      "frequency": number,
      "risk_level": "string"
    }
  ],
  "recommended_actions": ["string"]
}`;

        userPrompt = `Analiza las siguientes transacciones en busca de anomalías:

${JSON.stringify(transactions, null, 2)}

Período: ${time_range?.start} a ${time_range?.end}`;
        break;

      case 'fraud_score':
        systemPrompt = `Eres un sistema de scoring de fraude especializado en contabilidad.

INDICADORES DE FRAUDE (Triángulo del Fraude):
1. Presión: objetivos agresivos, bonos vinculados
2. Oportunidad: controles débiles, segregación inadecuada
3. Racionalización: justificaciones sospechosas

SEÑALES DE ALERTA:
- Transacciones fuera de horario laboral
- Redondeos sospechosos (000, 999)
- Proveedores con datos incompletos
- Cuentas de gastos excesivas
- Ajustes manuales frecuentes
- Anulaciones sistemáticas

FORMATO DE RESPUESTA (JSON estricto):
{
  "fraud_score": 0-100,
  "risk_level": "minimal" | "low" | "moderate" | "high" | "critical",
  "indicators": [
    {
      "indicator": "string",
      "weight": 0-100,
      "evidence": "string",
      "category": "pressure" | "opportunity" | "rationalization"
    }
  ],
  "red_flags": [
    {
      "flag": "string",
      "severity": "string",
      "details": "string"
    }
  ],
  "benign_explanations": ["string"],
  "investigation_priority": 1-10,
  "recommended_investigations": ["string"],
  "control_weaknesses": ["string"],
  "mitigation_suggestions": ["string"]
}`;

        userPrompt = `Calcula el score de fraude para la siguiente actividad:

${JSON.stringify(transactions, null, 2)}`;
        break;

      case 'behavioral_analysis':
        systemPrompt = `Eres un sistema de análisis de comportamiento de usuarios contables.

ANALIZA:
1. Patrones de acceso (horarios, frecuencia)
2. Tipos de operaciones realizadas
3. Cambios en patrones habituales
4. Accesos a información sensible
5. Intentos de evadir controles
6. Comportamiento colaborativo/aislado

FORMATO DE RESPUESTA (JSON estricto):
{
  "user_profile": {
    "typical_hours": [number],
    "typical_operations": ["string"],
    "average_transaction_value": number,
    "risk_tolerance": "low" | "medium" | "high"
  },
  "current_behavior": {
    "deviation_score": 0-100,
    "unusual_activities": ["string"],
    "time_anomalies": ["string"]
  },
  "risk_indicators": [
    {
      "indicator": "string",
      "current_value": "string",
      "baseline_value": "string",
      "deviation_percentage": number
    }
  ],
  "recommendations": ["string"],
  "alerts": [
    {
      "type": "string",
      "message": "string",
      "urgency": "low" | "medium" | "high"
    }
  ]
}`;

        userPrompt = `Analiza el comportamiento del siguiente usuario:

${JSON.stringify(user_behavior, null, 2)}`;
        break;

      case 'real_time_monitor':
        systemPrompt = `Eres un monitor en tiempo real de transacciones contables.

EVALÚA INSTANTÁNEAMENTE:
1. Si la transacción es normal
2. Si requiere revisión adicional
3. Si debe bloquearse
4. Alertas a generar

DECISIONES EN <100ms conceptualmente:
- ALLOW: transacción normal
- REVIEW: necesita supervisión
- BLOCK: detener y alertar
- ESCALATE: notificar a superiores

FORMATO DE RESPUESTA (JSON estricto):
{
  "decision": "allow" | "review" | "block" | "escalate",
  "confidence": 0-100,
  "processing_time_ms": number,
  "risk_score": 0-100,
  "factors": [
    {
      "factor": "string",
      "impact": "positive" | "negative" | "neutral",
      "weight": 0-100
    }
  ],
  "alerts": [
    {
      "type": "string",
      "message": "string",
      "recipients": ["string"]
    }
  ],
  "audit_trail": {
    "timestamp": "string",
    "decision_rationale": "string",
    "model_version": "string"
  }
}`;

        userPrompt = `Evalúa esta transacción en tiempo real:

${JSON.stringify(transactions?.[0], null, 2)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-anomaly-detection] Processing action: ${action}`);

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
        temperature: 0.2,
        max_tokens: 4000,
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

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[erp-anomaly-detection] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    // Guardar anomalías detectadas
    if (action === 'detect_anomalies' && result.anomalies?.length > 0) {
      for (const anomaly of result.anomalies) {
        if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
          await supabase.from('erp_audit_events').insert({
            company_id,
            entity_type: 'anomaly_detected',
            action: anomaly.type,
            metadata: anomaly
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-anomaly-detection] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
