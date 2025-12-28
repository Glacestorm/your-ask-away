/**
 * ObelixIA Compliance & Audit Edge Function
 * Fase 5: Motor de cumplimiento normativo y auditoría automatizada
 * Usa Lovable AI para análisis inteligente de cumplimiento
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_rules' | 'run_compliance_check' | 'resolve_issue' | 'get_audit_trail' | 
          'generate_audit_report' | 'get_risk_assessment' | 'detect_anomalies' | 'export_report';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  // === CORS ===
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === VALIDATE API KEY ===
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, context, params } = await req.json() as FunctionRequest;

    console.log(`[obelixia-compliance-audit] Processing action: ${action}`);

    // === DYNAMIC PROMPTS ===
    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'run_compliance_check':
        systemPrompt = `Eres un auditor contable y fiscal experto especializado en normativa española.
        
TU ROL:
- Verificar cumplimiento normativo: fiscal, contable, laboral, RGPD, prevención de blanqueo
- Detectar incumplimientos y riesgos
- Proporcionar recomendaciones específicas

NORMATIVA DE REFERENCIA:
- Ley 37/1992 del IVA
- Ley 35/2006 del IRPF
- Ley 27/2014 del Impuesto de Sociedades
- Plan General Contable 2007
- Ley 10/2010 de prevención de blanqueo
- RGPD y LOPDGDD

FORMATO DE RESPUESTA (JSON estricto):
{
  "checks": [
    {
      "id": "check_uuid",
      "rule_id": "rule_id",
      "rule_code": "FISC-001",
      "rule_name": "Nombre de la regla",
      "status": "passed|failed|warning|pending",
      "severity": "critical|high|medium|low|info",
      "category": "fiscal|contable|laboral|rgpd|blanqueo|societario",
      "message": "Descripción del resultado",
      "details": "Detalles técnicos",
      "affected_entities": [{"type": "invoice", "id": "xxx", "name": "Factura 001"}],
      "recommendations": ["Recomendación 1", "Recomendación 2"],
      "checked_at": "2024-01-01T00:00:00Z"
    }
  ],
  "summary": {
    "total": 10,
    "passed": 8,
    "failed": 1,
    "warnings": 1
  }
}`;

        userPrompt = context 
          ? `Realiza verificación de cumplimiento para el período: ${JSON.stringify(context)}. Analiza IVA, retenciones, balance y operaciones sospechosas.`
          : 'Realiza verificación completa de cumplimiento normativo del período actual.';
        break;

      case 'generate_audit_report':
        systemPrompt = `Eres un auditor profesional generando informes de auditoría.

TU ROL:
- Generar informes de auditoría completos
- Identificar hallazgos y no conformidades
- Evaluar riesgos y proporcionar recomendaciones

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "id": "report_uuid",
    "report_type": "${params?.reportType || 'compliance'}",
    "title": "${params?.title || 'Informe de Auditoría'}",
    "period_start": "${params?.periodStart}",
    "period_end": "${params?.periodEnd}",
    "status": "completed",
    "findings": [
      {
        "id": "finding_uuid",
        "finding_type": "observation|non_conformity|critical_issue|improvement",
        "title": "Título del hallazgo",
        "description": "Descripción detallada",
        "evidence": ["Evidencia 1", "Evidencia 2"],
        "impact": "Impacto en la organización",
        "recommendation": "Recomendación de mejora",
        "status": "open",
        "priority": "critical|high|medium|low"
      }
    ],
    "summary": {
      "total_checks": 50,
      "passed": 45,
      "failed": 3,
      "warnings": 2,
      "compliance_score": 90,
      "risk_level": "low|medium|high|critical"
    },
    "generated_at": "${new Date().toISOString()}"
  }
}`;

        userPrompt = `Genera informe de auditoría tipo ${params?.reportType || 'compliance'} para el período ${params?.periodStart} a ${params?.periodEnd}. Incluye hallazgos relevantes.`;
        break;

      case 'get_risk_assessment':
        systemPrompt = `Eres un experto en gestión de riesgos empresariales.

TU ROL:
- Evaluar riesgos fiscales, contables y operacionales
- Calcular scores de riesgo por categoría
- Identificar principales amenazas y mitigaciones

FORMATO DE RESPUESTA (JSON estricto):
{
  "assessment": {
    "overall_score": 25,
    "risk_level": "low|medium|high|critical",
    "categories": [
      {
        "category": "Fiscal",
        "score": 20,
        "issues_count": 2,
        "trend": "improving|stable|worsening"
      }
    ],
    "top_risks": [
      {
        "title": "Riesgo identificado",
        "description": "Descripción del riesgo",
        "probability": 0.3,
        "impact": 0.7,
        "mitigation": "Medidas de mitigación"
      }
    ],
    "recommendations": [
      "Recomendación estratégica 1",
      "Recomendación estratégica 2"
    ]
  }
}`;

        userPrompt = context 
          ? `Evalúa el riesgo para: ${JSON.stringify(context)}`
          : 'Realiza evaluación de riesgos general de la empresa.';
        break;

      case 'detect_anomalies':
        systemPrompt = `Eres un sistema de detección de fraude y anomalías contables.

TU ROL:
- Detectar patrones inusuales en transacciones
- Identificar posibles fraudes o errores
- Analizar operaciones sospechosas (prevención de blanqueo)

CRITERIOS DE DETECCIÓN:
- Transacciones fuera de rango habitual
- Operaciones en efectivo > 10.000€
- Patrones de fraccionamiento
- Terceros en listas de riesgo
- Inconsistencias contables

FORMATO DE RESPUESTA (JSON estricto):
{
  "anomalies": [
    {
      "id": "anomaly_uuid",
      "type": "unusual_amount|pattern|suspicious_third_party|cash_limit|inconsistency",
      "severity": "critical|high|medium|low",
      "description": "Descripción de la anomalía",
      "affected_transaction": {
        "id": "transaction_id",
        "amount": 15000,
        "date": "2024-01-15",
        "description": "Descripción"
      },
      "confidence_score": 0.85,
      "recommended_action": "Acción recomendada"
    }
  ],
  "summary": {
    "total_analyzed": 100,
    "anomalies_found": 3,
    "high_risk_count": 1
  }
}`;

        userPrompt = params?.transactionIds 
          ? `Analiza estas transacciones para detectar anomalías: ${JSON.stringify(params.transactionIds)}`
          : 'Analiza las transacciones recientes para detectar anomalías y patrones sospechosos.';
        break;

      case 'get_audit_trail':
        // Return mock audit trail without AI
        return new Response(JSON.stringify({
          success: true,
          action,
          data: {
            trail: [
              {
                id: crypto.randomUUID(),
                action_type: 'create',
                entity_type: 'journal_entry',
                entity_id: 'entry-001',
                entity_name: 'Asiento #1245',
                user_id: 'user-001',
                user_name: 'María García',
                timestamp: new Date().toISOString(),
                risk_score: 0.1
              },
              {
                id: crypto.randomUUID(),
                action_type: 'approve',
                entity_type: 'invoice',
                entity_id: 'inv-001',
                entity_name: 'Factura F-2024-0089',
                user_id: 'user-002',
                user_name: 'Carlos López',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                risk_score: 0.05
              }
            ]
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_rules':
      case 'resolve_issue':
      case 'export_report':
        // These don't need AI
        return new Response(JSON.stringify({
          success: true,
          action,
          data: { processed: true },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    // === AI CALL ===
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
        temperature: 0.4,
        max_tokens: 3000,
      }),
    });

    // === ERROR HANDLING ===
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    // === PARSE RESPONSE ===
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
    } catch (parseError) {
      console.error('[obelixia-compliance-audit] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-compliance-audit] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-compliance-audit] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
