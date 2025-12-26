import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  action: 'log_action' | 'get_audit_trail' | 'analyze_security' | 'get_access_history' | 'check_permissions' | 'generate_compliance_report';
  params?: {
    entity_type?: string;
    entity_id?: string;
    action_type?: string;
    action_details?: Record<string, unknown>;
    user_id?: string;
    session_id?: string;
    ip_address?: string;
    user_agent?: string;
    severity?: 'info' | 'warning' | 'critical';
    start_date?: string;
    end_date?: string;
    limit?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, params } = await req.json() as AuditRequest;

    console.log(`[support-audit-logger] Action: ${action}`, params);

    switch (action) {
      case 'log_action': {
        // Log an action to the audit trail
        const auditEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          entity_type: params?.entity_type || 'unknown',
          entity_id: params?.entity_id,
          action_type: params?.action_type || 'unknown',
          action_details: params?.action_details || {},
          user_id: params?.user_id,
          session_id: params?.session_id,
          ip_address: params?.ip_address || 'unknown',
          user_agent: params?.user_agent || 'unknown',
          severity: params?.severity || 'info',
          created_at: new Date().toISOString()
        };

        // In a real implementation, this would insert into a database table
        // For now, we simulate the storage
        console.log(`[Audit Log] ${JSON.stringify(auditEntry)}`);

        return new Response(JSON.stringify({
          success: true,
          data: {
            audit_id: auditEntry.id,
            logged_at: auditEntry.timestamp,
            message: 'Action logged successfully'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_audit_trail': {
        // Simulate fetching audit trail
        const mockAuditTrail = [
          {
            id: crypto.randomUUID(),
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            entity_type: 'session',
            entity_id: 'session-123',
            action_type: 'session_started',
            user_id: params?.user_id,
            severity: 'info',
            details: { duration: 45, client: 'CompanyX' }
          },
          {
            id: crypto.randomUUID(),
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            entity_type: 'action',
            entity_id: 'action-456',
            action_type: 'remote_command_executed',
            user_id: params?.user_id,
            severity: 'warning',
            details: { command: 'system_restart', approved: true }
          },
          {
            id: crypto.randomUUID(),
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            entity_type: 'security',
            entity_id: 'sec-789',
            action_type: 'permission_elevated',
            user_id: params?.user_id,
            severity: 'critical',
            details: { from: 'user', to: 'admin', reason: 'emergency access' }
          }
        ];

        return new Response(JSON.stringify({
          success: true,
          data: {
            entries: mockAuditTrail,
            total_count: mockAuditTrail.length,
            filters_applied: {
              entity_type: params?.entity_type,
              start_date: params?.start_date,
              end_date: params?.end_date
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'analyze_security': {
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY is not configured');
        }

        const systemPrompt = `Eres un analista de seguridad experto para sistemas de soporte remoto.

CONTEXTO:
Analizas logs de auditoría y detectas patrones de seguridad, amenazas potenciales y 
comportamientos anómalos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "security_score": 0-100,
  "risk_level": "low" | "medium" | "high" | "critical",
  "threats_detected": [
    {
      "type": "string",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "string",
      "recommendation": "string"
    }
  ],
  "anomalies": [
    {
      "pattern": "string",
      "occurrences": number,
      "risk_assessment": "string"
    }
  ],
  "compliance_issues": [
    {
      "standard": "string",
      "issue": "string",
      "remediation": "string"
    }
  ],
  "recommendations": ["string"]
}`;

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
              { role: 'user', content: `Analiza la seguridad del sistema de soporte remoto con estos parámetros: ${JSON.stringify(params)}` }
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
        } catch {
          result = { rawContent: content };
        }

        return new Response(JSON.stringify({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_access_history': {
        const mockAccessHistory = [
          {
            id: crypto.randomUUID(),
            user_id: params?.user_id,
            access_type: 'login',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            ip_address: '192.168.1.100',
            location: 'Madrid, Spain',
            device: 'Chrome on Windows',
            success: true
          },
          {
            id: crypto.randomUUID(),
            user_id: params?.user_id,
            access_type: 'session_access',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            ip_address: '192.168.1.100',
            location: 'Madrid, Spain',
            device: 'Chrome on Windows',
            success: true,
            resource: 'Client Session #123'
          },
          {
            id: crypto.randomUUID(),
            user_id: 'unknown',
            access_type: 'login_attempt',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            ip_address: '45.67.89.123',
            location: 'Unknown',
            device: 'Unknown',
            success: false,
            failure_reason: 'Invalid credentials'
          }
        ];

        return new Response(JSON.stringify({
          success: true,
          data: {
            history: mockAccessHistory,
            summary: {
              total_accesses: mockAccessHistory.length,
              successful: mockAccessHistory.filter(h => h.success).length,
              failed: mockAccessHistory.filter(h => !h.success).length,
              unique_ips: [...new Set(mockAccessHistory.map(h => h.ip_address))].length
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'check_permissions': {
        const mockPermissions = {
          user_id: params?.user_id,
          role: 'support_admin',
          permissions: [
            { resource: 'remote_sessions', actions: ['view', 'create', 'manage', 'terminate'] },
            { resource: 'audit_logs', actions: ['view', 'export'] },
            { resource: 'client_data', actions: ['view'] },
            { resource: 'system_settings', actions: ['view', 'modify'] },
            { resource: 'user_management', actions: ['view', 'create', 'modify'] }
          ],
          restrictions: [
            { type: 'time_based', rule: 'No access outside business hours', active: false },
            { type: 'ip_based', rule: 'Only from approved IPs', active: true },
            { type: 'mfa_required', rule: 'MFA required for sensitive actions', active: true }
          ],
          last_permission_review: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
          next_review_due: new Date(Date.now() + 60 * 24 * 3600000).toISOString()
        };

        return new Response(JSON.stringify({
          success: true,
          data: mockPermissions
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_compliance_report': {
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY is not configured');
        }

        const systemPrompt = `Eres un experto en compliance y generación de informes regulatorios.

CONTEXTO:
Generas informes de cumplimiento para sistemas de soporte remoto, incluyendo
GDPR, ISO 27001, SOC 2, y otras regulaciones aplicables.

FORMATO DE RESPUESTA (JSON estricto):
{
  "report_id": "string",
  "generated_at": "ISO date",
  "period": { "start": "ISO date", "end": "ISO date" },
  "overall_compliance_score": 0-100,
  "frameworks": [
    {
      "name": "string",
      "compliance_level": 0-100,
      "status": "compliant" | "partial" | "non_compliant",
      "findings": [
        {
          "control_id": "string",
          "description": "string",
          "status": "pass" | "fail" | "warning",
          "evidence": "string",
          "remediation": "string"
        }
      ]
    }
  ],
  "executive_summary": "string",
  "risk_assessment": {
    "high_risks": number,
    "medium_risks": number,
    "low_risks": number
  },
  "recommendations": ["string"]
}`;

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
              { role: 'user', content: `Genera un informe de compliance para el período ${params?.start_date || 'último mes'} a ${params?.end_date || 'hoy'}` }
            ],
            temperature: 0.3,
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
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawContent: content };
        } catch {
          result = { rawContent: content };
        }

        return new Response(JSON.stringify({
          success: true,
          data: result,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[support-audit-logger] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
