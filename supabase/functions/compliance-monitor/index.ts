import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  action: 'get_status' | 'run_assessment' | 'generate_report' | 'update_control';
  frameworkId?: string;
  controlId?: string;
  status?: string;
  evidence?: string;
  reportType?: 'assessment' | 'gap_analysis' | 'remediation';
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

    const { action, frameworkId, controlId, status, evidence, reportType } = await req.json() as ComplianceRequest;

    console.log(`[compliance-monitor] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_status':
        systemPrompt = `Eres un sistema de monitoreo de compliance enterprise. Genera el estado de frameworks de compliance y controles.
FORMATO DE RESPUESTA (JSON estricto):
{
  "frameworks": [{"id": "uuid", "name": "nombre", "version": "1.0", "description": "desc", "total_controls": 100, "compliant_controls": 90, "non_compliant_controls": 5, "not_applicable_controls": 5, "compliance_percentage": 90, "last_assessment": "ISO", "next_assessment": "ISO", "status": "compliant"}],
  "controls": [{"id": "uuid", "framework_id": "uuid", "control_id": "código", "control_name": "nombre", "description": "desc", "category": "cat", "status": "compliant", "evidence_required": true, "evidence_status": "complete", "risk_level": "medium", "last_reviewed": "ISO"}]
}`;
        userPrompt = frameworkId ? `Estado de compliance para framework: ${frameworkId}` : 'Estado general de todos los frameworks';
        break;

      case 'run_assessment':
        systemPrompt = `Eres un evaluador de compliance.
FORMATO DE RESPUESTA (JSON estricto):
{"assessment": {"id": "uuid", "framework_id": "uuid", "started_at": "ISO", "completed_at": "ISO", "status": "completed", "controls_assessed": 100, "compliant": 90, "non_compliant": 10, "findings": [{"control_id": "código", "finding": "hallazgo", "severity": "medium", "recommendation": "recomendación"}], "overall_score": 90}}`;
        userPrompt = `Ejecutar evaluación de compliance para framework: ${frameworkId}`;
        break;

      case 'generate_report':
        systemPrompt = `Eres un generador de informes de compliance.
FORMATO DE RESPUESTA (JSON estricto):
{"report": {"id": "uuid", "framework_id": "uuid", "report_type": "${reportType || 'assessment'}", "generated_at": "ISO", "period_start": "ISO", "period_end": "ISO", "overall_score": 90, "findings": [], "executive_summary": "resumen"}}`;
        userPrompt = `Generar informe de ${reportType || 'assessment'} para framework: ${frameworkId}`;
        break;

      case 'update_control':
        systemPrompt = `Eres un gestor de controles de compliance.
FORMATO DE RESPUESTA (JSON estricto):
{"updated": true, "control": {"id": "uuid", "status": "${status}", "updated_at": "ISO"}}`;
        userPrompt = `Actualizar control ${controlId} a estado: ${status}`;
        break;

      default:
        return new Response(JSON.stringify({ success: false, error: `Acción no soportada: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.7, max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in AI response');

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
      else throw new Error('No JSON found');
    } catch { result = { rawContent: content, parseError: true }; }

    console.log(`[compliance-monitor] Success: ${action}`);

    return new Response(JSON.stringify({ success: true, action, ...result, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[compliance-monitor] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
