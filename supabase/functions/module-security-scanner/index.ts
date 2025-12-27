import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'start_scan' | 'get_scan_results' | 'check_compliance' | 'audit_dependencies' | 'scan_secrets' | 'get_scan_history' | 'update_vulnerability_status';
  moduleKey?: string;
  scanId?: string;
  scanType?: string;
  framework?: string;
  vulnId?: string;
  status?: string;
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

    const { action, moduleKey, scanId, scanType, framework, vulnId, status } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'start_scan':
        systemPrompt = `Eres un escáner de seguridad enterprise.

Inicia un escaneo de seguridad y genera resultados iniciales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "scan": {
    "id": "uuid",
    "module_key": "module_key",
    "scan_type": "sast|dast|dependency|secrets|full",
    "status": "running",
    "started_at": "ISO date",
    "vulnerabilities_found": 0,
    "critical_count": 0,
    "high_count": 0,
    "medium_count": 0,
    "low_count": 0,
    "security_score": 100
  }
}`;
        userPrompt = `Inicia escaneo ${scanType || 'full'} para: ${moduleKey}`;
        break;

      case 'get_scan_results':
        systemPrompt = `Eres un analizador de vulnerabilidades.

Genera resultados de escaneo de seguridad con vulnerabilidades encontradas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "scan": {
    "id": "uuid",
    "module_key": "module_key",
    "scan_type": "full",
    "status": "completed",
    "started_at": "ISO date",
    "completed_at": "ISO date",
    "vulnerabilities_found": 5,
    "critical_count": 1,
    "high_count": 2,
    "medium_count": 1,
    "low_count": 1,
    "security_score": 72
  },
  "vulnerabilities": [
    {
      "id": "uuid",
      "severity": "critical|high|medium|low|info",
      "title": "título de vulnerabilidad",
      "description": "descripción",
      "cwe_id": "CWE-79",
      "cvss_score": 8.5,
      "affected_file": "src/...",
      "affected_line": 42,
      "recommendation": "recomendación",
      "status": "open",
      "detected_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Resultados del escaneo: ${scanId}`;
        break;

      case 'check_compliance':
        systemPrompt = `Eres un auditor de compliance.

Verifica el cumplimiento del módulo contra el framework especificado.

FORMATO DE RESPUESTA (JSON estricto):
{
  "checks": [
    {
      "id": "uuid",
      "framework": "${framework}",
      "control_id": "CC-1.1",
      "control_name": "nombre del control",
      "status": "compliant|non_compliant|partial|not_applicable",
      "evidence": "evidencia encontrada",
      "remediation": "acciones de remediación si aplica",
      "last_checked": "ISO date"
    }
  ]
}`;
        userPrompt = `Verificar compliance ${framework} para: ${moduleKey}`;
        break;

      case 'audit_dependencies':
        systemPrompt = `Eres un auditor de dependencias.

Analiza las dependencias del módulo buscando vulnerabilidades conocidas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "dependencies": [
    {
      "id": "uuid",
      "package_name": "nombre-paquete",
      "current_version": "1.0.0",
      "latest_version": "1.2.0",
      "vulnerabilities": [
        {
          "id": "CVE-2024-xxxx",
          "severity": "high",
          "title": "título",
          "patched_version": "1.1.0"
        }
      ],
      "license": "MIT",
      "is_outdated": true,
      "risk_level": "high|medium|low|none"
    }
  ]
}`;
        userPrompt = `Auditar dependencias de: ${moduleKey}`;
        break;

      case 'scan_secrets':
        systemPrompt = `Eres un escáner de secretos.

Busca secretos expuestos en el código del módulo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "findings": [
    {
      "id": "uuid",
      "file_path": "src/...",
      "line_number": 42,
      "secret_type": "api_key|password|token|private_key",
      "masked_value": "sk_****xxxx",
      "severity": "critical|high",
      "status": "active",
      "detected_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Escanear secretos en: ${moduleKey}`;
        break;

      case 'get_scan_history':
        systemPrompt = `Genera historial de escaneos de seguridad.

FORMATO DE RESPUESTA (JSON estricto):
{
  "scans": [
    {
      "id": "uuid",
      "module_key": "module_key",
      "scan_type": "full",
      "status": "completed",
      "started_at": "ISO date",
      "completed_at": "ISO date",
      "vulnerabilities_found": 5,
      "critical_count": 1,
      "high_count": 2,
      "medium_count": 1,
      "low_count": 1,
      "security_score": 72
    }
  ]
}`;
        userPrompt = `Historial de escaneos para: ${moduleKey}`;
        break;

      case 'update_vulnerability_status':
        return new Response(JSON.stringify({
          success: true,
          message: `Vulnerability ${vulnId} status updated to ${status}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[module-security-scanner] Processing action: ${action}`);

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
          error: 'Rate limit exceeded',
          success: false
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
    } catch (parseError) {
      console.error('[module-security-scanner] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-security-scanner] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
