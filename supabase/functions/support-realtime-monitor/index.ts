import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonitorRequest {
  action: 'get_status' | 'analyze_active' | 'generate_alerts' | 'get_health_metrics';
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
    const { action } = await req.json() as MonitorRequest;

    console.log(`[support-realtime-monitor] Processing action: ${action}`);

    // Fetch real-time data
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [activeSessions, recentActions, recentAlerts] = await Promise.all([
      supabase
        .from('remote_support_sessions')
        .select('*, profiles!remote_support_sessions_technician_id_fkey(full_name, email)')
        .eq('status', 'active')
        .order('started_at', { ascending: false }),
      supabase
        .from('session_actions')
        .select('*')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('remote_support_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const activeSessionsData = activeSessions.data || [];
    const recentActionsData = recentActions.data || [];
    const activeAlerts = recentAlerts.data || [];

    switch (action) {
      case 'get_status': {
        // Calculate real-time metrics
        const activeCount = activeSessionsData.length;
        const avgDurationActive = activeSessionsData.length > 0
          ? activeSessionsData.reduce((sum, s) => {
              const started = new Date(s.started_at).getTime();
              return sum + (now.getTime() - started);
            }, 0) / activeSessionsData.length
          : 0;

        const highRiskActionsLast30Min = recentActionsData.filter(a => 
          (a.risk_level === 'high' || a.risk_level === 'critical') &&
          new Date(a.created_at) >= thirtyMinutesAgo
        ).length;

        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;

        return new Response(JSON.stringify({
          success: true,
          data: {
            activeSessions: activeCount,
            avgActiveDuration: Math.round(avgDurationActive / 60000),
            actionsLast30Min: recentActionsData.filter(a => 
              new Date(a.created_at) >= thirtyMinutesAgo
            ).length,
            highRiskActionsLast30Min,
            activeAlerts: activeAlerts.length,
            criticalAlerts,
            systemHealth: criticalAlerts > 0 ? 'critical' : 
                          highRiskActionsLast30Min > 5 ? 'warning' : 'healthy',
            sessions: activeSessionsData.map(s => ({
              id: s.id,
              deviceName: s.device_name,
              companyName: s.company_name,
              technicianName: s.profiles?.full_name || 'No asignado',
              startedAt: s.started_at,
              durationMinutes: Math.round((now.getTime() - new Date(s.started_at).getTime()) / 60000)
            })),
            recentActions: recentActionsData.slice(0, 10).map(a => ({
              id: a.id,
              type: a.action_type,
              riskLevel: a.risk_level,
              status: a.status,
              createdAt: a.created_at
            })),
            timestamp: now.toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze_active': {
        if (activeSessionsData.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            data: {
              analysis: 'No hay sesiones activas para analizar',
              sessions: [],
              recommendations: []
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const systemPrompt = `Eres un analista de sesiones de soporte en tiempo real.

CAPACIDADES:
- Analizas sesiones activas para identificar problemas
- Detectas sesiones que tardan más de lo esperado
- Priorizas intervenciones necesarias

RESPUESTA JSON:
{
  "analysis": {
    "totalActive": number,
    "needsAttention": number,
    "avgDuration": number,
    "longestSession": { "id": "string", "duration": number, "concern": "string" }
  },
  "sessionAnalysis": [
    {
      "sessionId": "string",
      "status": "on_track" | "delayed" | "at_risk" | "critical",
      "durationMinutes": number,
      "riskFactors": ["string"],
      "recommendedAction": "string",
      "priority": 1-5
    }
  ],
  "immediateActions": [
    {
      "action": "string",
      "targetSession": "string",
      "urgency": "high" | "medium" | "low",
      "reason": "string"
    }
  ],
  "resourceNeeds": {
    "additionalTechniciansNeeded": number,
    "escalationRequired": boolean,
    "reason": "string"
  }
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
              { role: 'user', content: `Analiza estas sesiones activas:\n${JSON.stringify(activeSessionsData, null, 2)}\n\nAcciones recientes:\n${JSON.stringify(recentActionsData.slice(0, 20), null, 2)}` }
            ],
            temperature: 0.3,
            max_tokens: 2000,
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
          timestamp: now.toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_alerts': {
        const systemPrompt = `Eres un sistema de alertas para monitoreo de soporte técnico.

CAPACIDADES:
- Generas alertas basadas en condiciones detectadas
- Priorizas por severidad e impacto
- Recomiendas acciones correctivas

RESPUESTA JSON:
{
  "alerts": [
    {
      "id": "alert_<timestamp>",
      "type": "session_duration" | "high_risk_action" | "resource_shortage" | "performance_degradation",
      "severity": "critical" | "warning" | "info",
      "title": "string",
      "message": "string",
      "affectedEntity": { "type": "session" | "technician" | "system", "id": "string" },
      "recommendedAction": "string",
      "autoResolvable": boolean
    }
  ],
  "summary": {
    "totalAlerts": number,
    "bySeverity": { "critical": number, "warning": number, "info": number },
    "requiresImmediate": number
  },
  "systemStatus": "healthy" | "degraded" | "critical"
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
              { role: 'user', content: `Genera alertas basadas en:\n\nSesiones activas: ${activeSessionsData.length}\nAcciones recientes: ${recentActionsData.length}\nAlertas existentes: ${activeAlerts.length}\n\nDatos:\n${JSON.stringify({ sessions: activeSessionsData, actions: recentActionsData.slice(0, 15) }, null, 2)}` }
            ],
            temperature: 0.3,
            max_tokens: 2000,
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
          timestamp: now.toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_health_metrics': {
        // Calculate health metrics
        const actionsLastHour = recentActionsData.length;
        const highRiskRatio = actionsLastHour > 0 
          ? recentActionsData.filter(a => a.risk_level === 'high' || a.risk_level === 'critical').length / actionsLastHour
          : 0;
        
        const successRate = actionsLastHour > 0
          ? recentActionsData.filter(a => a.status === 'completed' || a.status === 'approved').length / actionsLastHour
          : 1;

        const avgResponseTime = activeSessionsData.length > 0
          ? activeSessionsData.reduce((sum, s) => sum + (now.getTime() - new Date(s.started_at).getTime()), 0) / activeSessionsData.length / 60000
          : 0;

        // Calculate overall health score
        let healthScore = 100;
        healthScore -= highRiskRatio * 30;
        healthScore -= (1 - successRate) * 25;
        healthScore -= Math.min(avgResponseTime / 60, 1) * 20;
        healthScore -= Math.min(activeAlerts.filter(a => a.severity === 'critical').length * 10, 25);

        return new Response(JSON.stringify({
          success: true,
          data: {
            healthScore: Math.max(0, Math.round(healthScore)),
            metrics: {
              activeSessions: activeSessionsData.length,
              actionsLastHour,
              highRiskRatio: Math.round(highRiskRatio * 100),
              successRate: Math.round(successRate * 100),
              avgResponseTimeMinutes: Math.round(avgResponseTime),
              activeAlerts: activeAlerts.length,
              criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length
            },
            status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
            lastUpdated: now.toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

  } catch (error) {
    console.error('[support-realtime-monitor] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
