import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  action: 'run_check' | 'get_summary' | 'get_alerts' | 'analyze_document' | 'generate_remediation' | 'update_check' |
          'check_compliance' | 'generate_report' | 'assess_risk' | 'get_recommendations' | 'monitor_changes';
  regulation?: string;
  documentContent?: string;
  checkIds?: string[];
  checkId?: string;
  status?: string;
  evidence?: string;
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

// Mock data generators
function generateMockSummary() {
  return [
    { regulation: 'GDPR', compliance_score: 87, checks_total: 45, checks_passed: 39, last_audit: '2025-01-15' },
    { regulation: 'SOX', compliance_score: 92, checks_total: 30, checks_passed: 28, last_audit: '2025-01-10' },
    { regulation: 'HIPAA', compliance_score: 78, checks_total: 50, checks_passed: 39, last_audit: '2025-01-05' },
    { regulation: 'PCI-DSS', compliance_score: 95, checks_total: 25, checks_passed: 24, last_audit: '2025-01-20' },
    { regulation: 'ISO 27001', compliance_score: 88, checks_total: 60, checks_passed: 53, last_audit: '2025-01-12' }
  ];
}

function generateMockAlerts() {
  return [
    { id: 'alert-1', type: 'deadline' as const, title: 'Renovación certificación ISO', description: 'Certificación ISO 27001 vence en 30 días', regulation: 'ISO 27001', due_date: '2025-02-27', severity: 'high' as const },
    { id: 'alert-2', type: 'violation' as const, title: 'Política de retención incumplida', description: 'Datos de clientes exceden período de retención', regulation: 'GDPR', severity: 'critical' as const },
    { id: 'alert-3', type: 'change' as const, title: 'Nueva regulación de IA', description: 'EU AI Act entra en vigor Q2 2025', regulation: 'EU AI Act', due_date: '2025-04-01', severity: 'medium' as const },
    { id: 'alert-4', type: 'audit' as const, title: 'Auditoría SOX programada', description: 'Auditoría externa programada para marzo', regulation: 'SOX', due_date: '2025-03-15', severity: 'medium' as const }
  ];
}

function generateMockReport(regulation: string) {
  return {
    id: `report-${Date.now()}`,
    regulation,
    overall_score: Math.floor(Math.random() * 20) + 80,
    checks: [
      { id: 'chk-1', regulation, requirement: 'Consentimiento explícito', status: 'compliant', evidence: 'Forms actualizados', last_checked: new Date().toISOString(), next_review: '2025-04-01', risk_level: 'low' },
      { id: 'chk-2', regulation, requirement: 'Derecho al olvido', status: 'partial', evidence: 'Proceso manual', last_checked: new Date().toISOString(), next_review: '2025-03-01', risk_level: 'medium' },
      { id: 'chk-3', regulation, requirement: 'Portabilidad de datos', status: 'compliant', evidence: 'API implementada', last_checked: new Date().toISOString(), next_review: '2025-04-01', risk_level: 'low' }
    ],
    gaps: [
      { requirement: 'Automatización del derecho al olvido', recommendation: 'Implementar flujo automatizado de eliminación de datos' },
      { requirement: 'Registro de actividades de procesamiento', recommendation: 'Completar registro de todas las actividades de procesamiento' }
    ],
    generated_at: new Date().toISOString()
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json() as ComplianceRequest;
    const { action } = requestBody;
    console.log(`[compliance-ia] Processing action: ${action}`);

    // Handle mock data actions (no AI needed)
    switch (action) {
      case 'get_summary':
        return new Response(JSON.stringify({
          success: true,
          summary: generateMockSummary(),
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_alerts':
        return new Response(JSON.stringify({
          success: true,
          alerts: generateMockAlerts(),
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'run_check':
        const report = generateMockReport(requestBody.regulation || 'GDPR');
        return new Response(JSON.stringify({
          success: true,
          report,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update_check':
        return new Response(JSON.stringify({
          success: true,
          checkId: requestBody.checkId,
          status: requestBody.status,
          updated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'generate_remediation':
        return new Response(JSON.stringify({
          success: true,
          plan: {
            steps: [
              { order: 1, action: 'Auditar procesos actuales', responsible: 'Compliance Officer', deadline: '2025-02-15' },
              { order: 2, action: 'Documentar gaps identificados', responsible: 'Legal Team', deadline: '2025-02-28' },
              { order: 3, action: 'Implementar controles', responsible: 'IT Security', deadline: '2025-03-15' },
              { order: 4, action: 'Validar implementación', responsible: 'Auditor Interno', deadline: '2025-03-30' }
            ],
            estimated_time: '6 semanas',
            resources_needed: ['Compliance Officer', 'Legal Team', 'IT Security', 'Auditor Externo']
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // For AI-powered actions
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';
    const { context, entityId, entityType, documentContent, regulation } = requestBody;

    switch (action) {
      case 'analyze_document':
        systemPrompt = `Eres un experto en análisis de cumplimiento normativo.

ANALIZA el documento contra la regulación especificada.

RESPONDE EN JSON ESTRICTO:
{
  "findings": [
    { "issue": string, "severity": "critical" | "high" | "medium" | "low", "recommendation": string }
  ],
  "score": number (0-100)
}`;
        userPrompt = `Analiza este documento para cumplimiento de ${regulation}:
${documentContent?.substring(0, 2000)}`;
        break;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[compliance-ia] Success: ${action}`);

    // Format response based on action
    const responseData: Record<string, unknown> = { success: true, action, timestamp: new Date().toISOString() };
    
    if (action === 'analyze_document') {
      responseData.analysis = result;
    } else {
      responseData.data = result;
    }

    return new Response(JSON.stringify(responseData), {
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
