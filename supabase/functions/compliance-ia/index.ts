import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  action: 'check_compliance' | 'generate_report' | 'assess_risk' | 'get_recommendations' | 'monitor_changes';
  context?: {
    regulations?: string[];
    industry?: string;
    jurisdiction?: string;
    documentContent?: string;
    processDescription?: string;
  };
  entityId?: string;
  entityType?: string;
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

    const { action, context, entityId, entityType } = await req.json() as ComplianceRequest;
    console.log(`[compliance-ia] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'check_compliance':
        systemPrompt = `Eres un experto en cumplimiento normativo empresarial.

EVALÚA el cumplimiento contra las regulaciones especificadas.

RESPONDE EN JSON ESTRICTO:
{
  "overallStatus": "compliant" | "partial" | "non_compliant",
  "score": number,
  "checkResults": [
    {
      "regulation": string,
      "requirement": string,
      "status": "pass" | "fail" | "warning",
      "details": string,
      "remediation": string
    }
  ],
  "criticalIssues": string[],
  "upcomingDeadlines": [{ "date": string, "requirement": string }]
}`;
        userPrompt = `Verifica cumplimiento para:
Regulaciones: ${context?.regulations?.join(', ')}
Industria: ${context?.industry}
Jurisdicción: ${context?.jurisdiction}
Proceso/Documento: ${context?.processDescription || context?.documentContent}`;
        break;

      case 'generate_report':
        systemPrompt = `Eres un generador de informes de cumplimiento normativo.

GENERA un informe completo de cumplimiento.

RESPONDE EN JSON ESTRICTO:
{
  "reportSummary": string,
  "executiveSummary": string,
  "complianceMetrics": {
    "overallScore": number,
    "byRegulation": [{ "name": string, "score": number, "trend": string }]
  },
  "findings": [{ "severity": string, "finding": string, "recommendation": string }],
  "actionItems": [{ "priority": number, "item": string, "deadline": string, "owner": string }],
  "historicalTrend": string
}`;
        userPrompt = `Genera informe de cumplimiento para entidad ${entityType}: ${entityId}`;
        break;

      case 'assess_risk':
        systemPrompt = `Eres un evaluador de riesgos de cumplimiento.

EVALÚA los riesgos de incumplimiento normativo.

RESPONDE EN JSON ESTRICTO:
{
  "riskLevel": "critical" | "high" | "medium" | "low",
  "riskScore": number,
  "riskFactors": [
    { "factor": string, "impact": string, "likelihood": string, "mitigation": string }
  ],
  "potentialPenalties": string[],
  "mitigationPlan": string[],
  "monitoringRecommendations": string[]
}`;
        userPrompt = `Evalúa riesgos de cumplimiento para: ${context?.processDescription}
Regulaciones aplicables: ${context?.regulations?.join(', ')}`;
        break;

      case 'get_recommendations':
        systemPrompt = `Eres un asesor de mejoras en cumplimiento normativo.

PROPORCIONA recomendaciones para mejorar el cumplimiento.

RESPONDE EN JSON ESTRICTO:
{
  "priorityRecommendations": [
    { "title": string, "description": string, "impact": string, "effort": string, "deadline": string }
  ],
  "quickWins": string[],
  "longTermInitiatives": string[],
  "trainingNeeds": string[],
  "toolsRequired": string[]
}`;
        userPrompt = `Recomienda mejoras de cumplimiento para industria ${context?.industry}`;
        break;

      case 'monitor_changes':
        systemPrompt = `Eres un monitor de cambios regulatorios.

IDENTIFICA cambios regulatorios relevantes y su impacto.

RESPONDE EN JSON ESTRICTO:
{
  "recentChanges": [
    { "regulation": string, "change": string, "effectiveDate": string, "impact": string }
  ],
  "upcomingChanges": [
    { "regulation": string, "expectedChange": string, "timeline": string }
  ],
  "actionRequired": string[],
  "impactAssessment": string
}`;
        userPrompt = `Monitorea cambios regulatorios para: ${context?.regulations?.join(', ')} en ${context?.jurisdiction}`;
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
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[compliance-ia] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[compliance-ia] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
