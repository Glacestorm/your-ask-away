import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceCoachRequest {
  action: 'analyze_performance' | 'start_session' | 'get_growth_plan' | 'generate_recommendations' | 'complete_action' | 'peer_comparison';
  userId?: string;
  focusAreas?: string[];
  insightId?: string;
  actionIndex?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, focusAreas } = await req.json() as PerformanceCoachRequest;
    console.log(`[performance-coach] Processing action: ${action}`);

    switch (action) {
      case 'analyze_performance':
        const metrics = [
          { metric_name: 'Tasa de Cierre', current_value: 32, target_value: 40, previous_value: 28, trend: 'up' as const, percentile_rank: 75 },
          { metric_name: 'Tiempo Respuesta', current_value: 2.5, target_value: 2, previous_value: 3.2, trend: 'up' as const, percentile_rank: 60 },
          { metric_name: 'Satisfacción Cliente', current_value: 4.2, target_value: 4.5, previous_value: 4.0, trend: 'up' as const, percentile_rank: 80 },
          { metric_name: 'Visitas Completadas', current_value: 85, target_value: 100, previous_value: 78, trend: 'up' as const, percentile_rank: 70 },
          { metric_name: 'Tickets Resueltos', current_value: 45, target_value: 50, previous_value: 42, trend: 'up' as const, percentile_rank: 65 }
        ];
        const insights = [
          {
            id: 'i1',
            category: 'strength' as const,
            title: 'Excelente mejora en satisfacción',
            description: 'Has mejorado tu puntuación de satisfacción un 5% respecto al mes anterior',
            action_items: ['Mantén tu enfoque en la comunicación proactiva', 'Documenta tus mejores prácticas'],
            priority: 'medium' as const,
            related_metrics: ['Satisfacción Cliente'],
            resources: [{ title: 'Guía de comunicación', url: '#' }]
          },
          {
            id: 'i2',
            category: 'improvement' as const,
            title: 'Oportunidad en tasa de cierre',
            description: 'Tu tasa de cierre está 8 puntos por debajo del objetivo',
            action_items: ['Revisa las objeciones más comunes', 'Practica técnicas de cierre', 'Analiza casos de éxito del equipo'],
            priority: 'high' as const,
            related_metrics: ['Tasa de Cierre'],
            resources: [{ title: 'Técnicas de cierre efectivo', url: '#' }]
          },
          {
            id: 'i3',
            category: 'opportunity' as const,
            title: 'Potencial de cross-selling',
            description: 'Detectamos oportunidades de venta cruzada en el 30% de tus clientes',
            action_items: ['Identifica productos complementarios', 'Prepara propuestas personalizadas'],
            priority: 'medium' as const,
            related_metrics: ['Tasa de Cierre', 'Satisfacción Cliente']
          }
        ];
        return new Response(JSON.stringify({
          success: true,
          metrics,
          insights
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'start_session':
        const session = {
          id: crypto.randomUUID(),
          user_id: userId || 'current-user',
          started_at: new Date().toISOString(),
          insights_generated: 0,
          actions_completed: 0,
          improvement_score: 0
        };
        return new Response(JSON.stringify({
          success: true,
          session
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get_growth_plan':
        const plan = {
          id: 'gp-1',
          title: 'Plan de Desarrollo Q1 2025',
          objectives: [
            { description: 'Aumentar tasa de cierre al 40%', target_date: '2025-03-31', completed: false },
            { description: 'Reducir tiempo de respuesta a < 2h', target_date: '2025-02-28', completed: false },
            { description: 'Completar certificación de ventas', target_date: '2025-01-31', completed: true }
          ],
          milestones: [
            { name: 'Evaluación inicial', due_date: '2025-01-15', status: 'completed' },
            { name: 'Primera revisión', due_date: '2025-02-15', status: 'in_progress' },
            { name: 'Evaluación final', due_date: '2025-03-31', status: 'pending' }
          ],
          recommended_training: ['Técnicas avanzadas de negociación', 'Gestión del tiempo', 'CRM Avanzado'],
          progress_percentage: 45
        };
        return new Response(JSON.stringify({
          success: true,
          plan
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'generate_recommendations':
        const recommendations = (focusAreas || ['general']).map((area, idx) => ({
          id: `rec-${idx}`,
          category: 'improvement' as const,
          title: `Mejora en ${area}`,
          description: `Recomendaciones personalizadas para mejorar en ${area}`,
          action_items: [`Acción 1 para ${area}`, `Acción 2 para ${area}`],
          priority: 'high' as const,
          related_metrics: [area]
        }));
        return new Response(JSON.stringify({
          success: true,
          recommendations
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'complete_action':
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'peer_comparison':
        return new Response(JSON.stringify({
          success: true,
          comparison: {
            rank: 12,
            percentile: 75,
            comparison: {
              'Tasa de Cierre': { user: 32, avg: 28, top: 45 },
              'Satisfacción': { user: 4.2, avg: 3.8, top: 4.8 },
              'Visitas': { user: 85, avg: 72, top: 120 }
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

  } catch (error) {
    console.error('[performance-coach] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
