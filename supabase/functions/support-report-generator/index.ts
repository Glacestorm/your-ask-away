import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  action: 'generate_metrics_report' | 'generate_session_report' | 'generate_performance_report' | 'export_data' | 'schedule_report' | 'get_templates';
  params?: {
    report_type?: string;
    format?: 'pdf' | 'excel' | 'csv' | 'json';
    start_date?: string;
    end_date?: string;
    metrics?: string[];
    filters?: Record<string, unknown>;
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      recipients: string[];
      time: string;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const { action, params } = await req.json() as ReportRequest;

    console.log(`[support-report-generator] Action: ${action}`, params);

    switch (action) {
      case 'generate_metrics_report': {
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY is not configured');
        }

        const systemPrompt = `Eres un generador de informes de métricas para sistemas de soporte.

FORMATO DE RESPUESTA (JSON estricto):
{
  "report_id": "string",
  "title": "string",
  "generated_at": "ISO date",
  "period": { "start": "ISO date", "end": "ISO date" },
  "summary": {
    "total_sessions": number,
    "avg_resolution_time_minutes": number,
    "satisfaction_score": number,
    "first_contact_resolution_rate": number
  },
  "metrics": [
    {
      "name": "string",
      "value": number,
      "unit": "string",
      "trend": "up" | "down" | "stable",
      "change_percentage": number,
      "target": number,
      "status": "on_track" | "at_risk" | "off_track"
    }
  ],
  "charts_data": {
    "sessions_by_day": [{ "date": "string", "count": number }],
    "resolution_times": [{ "category": "string", "avg_time": number }],
    "agent_performance": [{ "agent": "string", "score": number, "sessions": number }]
  },
  "insights": ["string"],
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
              { role: 'user', content: `Genera un informe de métricas de soporte para el período ${params?.start_date || 'última semana'} a ${params?.end_date || 'hoy'}. Métricas solicitadas: ${params?.metrics?.join(', ') || 'todas'}` }
            ],
            temperature: 0.4,
            max_tokens: 3000,
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
          format: params?.format || 'json',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_session_report': {
        const mockSessionReport = {
          report_id: crypto.randomUUID(),
          title: 'Informe de Sesiones de Soporte',
          generated_at: new Date().toISOString(),
          period: {
            start: params?.start_date || new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
            end: params?.end_date || new Date().toISOString()
          },
          sessions: {
            total: 156,
            completed: 142,
            cancelled: 8,
            in_progress: 6,
            avg_duration_minutes: 23.5,
            peak_hours: ['09:00-11:00', '14:00-16:00']
          },
          by_type: [
            { type: 'remote_desktop', count: 89, percentage: 57 },
            { type: 'screen_share', count: 45, percentage: 29 },
            { type: 'file_transfer', count: 22, percentage: 14 }
          ],
          by_agent: [
            { agent: 'Agent A', sessions: 45, avg_rating: 4.8, resolution_rate: 95 },
            { agent: 'Agent B', sessions: 38, avg_rating: 4.6, resolution_rate: 92 },
            { agent: 'Agent C', sessions: 35, avg_rating: 4.7, resolution_rate: 94 },
            { agent: 'Agent D', sessions: 38, avg_rating: 4.5, resolution_rate: 90 }
          ],
          issues_resolved: [
            { category: 'Software', count: 67, percentage: 43 },
            { category: 'Hardware', count: 34, percentage: 22 },
            { category: 'Network', count: 28, percentage: 18 },
            { category: 'Configuration', count: 27, percentage: 17 }
          ],
          satisfaction: {
            avg_score: 4.6,
            promoters: 78,
            passives: 15,
            detractors: 7,
            nps: 71
          }
        };

        return new Response(JSON.stringify({
          success: true,
          data: mockSessionReport,
          format: params?.format || 'json',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_performance_report': {
        const mockPerformanceReport = {
          report_id: crypto.randomUUID(),
          title: 'Informe de Rendimiento del Sistema',
          generated_at: new Date().toISOString(),
          system_health: {
            overall_score: 94,
            uptime_percentage: 99.97,
            avg_response_time_ms: 245,
            error_rate: 0.02
          },
          resources: {
            cpu_avg: 45,
            memory_avg: 62,
            bandwidth_used_gb: 1250,
            storage_used_percentage: 58
          },
          performance_trends: [
            { date: new Date(Date.now() - 6 * 24 * 3600000).toISOString().split('T')[0], latency: 220, errors: 3 },
            { date: new Date(Date.now() - 5 * 24 * 3600000).toISOString().split('T')[0], latency: 235, errors: 2 },
            { date: new Date(Date.now() - 4 * 24 * 3600000).toISOString().split('T')[0], latency: 248, errors: 5 },
            { date: new Date(Date.now() - 3 * 24 * 3600000).toISOString().split('T')[0], latency: 252, errors: 1 },
            { date: new Date(Date.now() - 2 * 24 * 3600000).toISOString().split('T')[0], latency: 241, errors: 2 },
            { date: new Date(Date.now() - 1 * 24 * 3600000).toISOString().split('T')[0], latency: 238, errors: 3 },
            { date: new Date().toISOString().split('T')[0], latency: 245, errors: 2 }
          ],
          bottlenecks: [
            { component: 'Database queries', severity: 'medium', recommendation: 'Optimizar índices' },
            { component: 'File uploads', severity: 'low', recommendation: 'Aumentar timeout' }
          ],
          recommendations: [
            'Considerar escalar recursos durante horas pico',
            'Implementar caching para consultas frecuentes',
            'Revisar configuración de CDN'
          ]
        };

        return new Response(JSON.stringify({
          success: true,
          data: mockPerformanceReport,
          format: params?.format || 'json',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'export_data': {
        const exportData = {
          export_id: crypto.randomUUID(),
          requested_at: new Date().toISOString(),
          format: params?.format || 'csv',
          status: 'ready',
          download_url: `https://example.com/exports/${crypto.randomUUID()}.${params?.format || 'csv'}`,
          expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
          rows_count: 1250,
          file_size_kb: 456,
          filters_applied: params?.filters || {}
        };

        return new Response(JSON.stringify({
          success: true,
          data: exportData,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'schedule_report': {
        const scheduleData = {
          schedule_id: crypto.randomUUID(),
          report_type: params?.report_type || 'metrics',
          frequency: params?.schedule?.frequency || 'weekly',
          recipients: params?.schedule?.recipients || [],
          next_run: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
          created_at: new Date().toISOString(),
          status: 'active',
          format: params?.format || 'pdf'
        };

        return new Response(JSON.stringify({
          success: true,
          data: scheduleData,
          message: 'Report scheduled successfully',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_templates': {
        const templates = [
          {
            id: 'metrics-weekly',
            name: 'Informe Semanal de Métricas',
            description: 'Resumen semanal de KPIs de soporte',
            sections: ['summary', 'sessions', 'agents', 'satisfaction'],
            default_format: 'pdf'
          },
          {
            id: 'sessions-daily',
            name: 'Informe Diario de Sesiones',
            description: 'Detalle de todas las sesiones del día',
            sections: ['sessions_list', 'issues', 'resolutions'],
            default_format: 'excel'
          },
          {
            id: 'performance-monthly',
            name: 'Informe Mensual de Rendimiento',
            description: 'Análisis completo de rendimiento del sistema',
            sections: ['health', 'resources', 'trends', 'recommendations'],
            default_format: 'pdf'
          },
          {
            id: 'compliance-quarterly',
            name: 'Informe Trimestral de Compliance',
            description: 'Auditoría de cumplimiento normativo',
            sections: ['frameworks', 'findings', 'remediation'],
            default_format: 'pdf'
          },
          {
            id: 'executive-summary',
            name: 'Resumen Ejecutivo',
            description: 'Dashboard resumido para directivos',
            sections: ['kpis', 'highlights', 'risks'],
            default_format: 'pdf'
          }
        ];

        return new Response(JSON.stringify({
          success: true,
          data: { templates },
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
    console.error('[support-report-generator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
