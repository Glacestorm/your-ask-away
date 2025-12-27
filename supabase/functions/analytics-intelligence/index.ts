import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  action: 'detect_anomalies' | 'generate_insights' | 'forecast_metrics' | 'create_dynamic_dashboard' | 
          'correlate_metrics' | 'benchmark_performance' | 'get_recommendations' | 'pattern_recognition' |
          'real_time_analysis' | 'cohort_analysis';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
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

    const { action, context, params } = await req.json() as AnalyticsRequest;
    console.log(`[analytics-intelligence] Action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'detect_anomalies':
        systemPrompt = `Eres un sistema de detección de anomalías en tiempo real para métricas empresariales.

CAPACIDADES:
- Detectar desviaciones estadísticas significativas
- Identificar patrones anómalos en series temporales
- Clasificar severidad de anomalías
- Proporcionar contexto y posibles causas

FORMATO DE RESPUESTA (JSON):
{
  "anomalies": [
    {
      "id": "string",
      "metric_name": "string",
      "current_value": number,
      "expected_value": number,
      "deviation_percentage": number,
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": number,
      "detected_at": "ISO timestamp",
      "pattern_type": "spike" | "drop" | "trend_change" | "seasonality_break" | "outlier",
      "possible_causes": ["string"],
      "recommended_actions": ["string"],
      "historical_context": {
        "avg_7d": number,
        "avg_30d": number,
        "std_deviation": number
      }
    }
  ],
  "summary": {
    "total_anomalies": number,
    "critical_count": number,
    "requires_immediate_action": boolean,
    "overall_health_score": number
  }
}`;
        userPrompt = `Analiza las siguientes métricas en busca de anomalías: ${JSON.stringify(context)}`;
        break;

      case 'generate_insights':
        systemPrompt = `Eres un generador de insights empresariales impulsado por IA.

CAPACIDADES:
- Extraer insights accionables de datos
- Identificar tendencias ocultas
- Conectar métricas aparentemente no relacionadas
- Priorizar insights por impacto potencial

FORMATO DE RESPUESTA (JSON):
{
  "insights": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "growth" | "efficiency" | "risk" | "opportunity" | "optimization",
      "impact_level": "low" | "medium" | "high" | "transformational",
      "confidence": number,
      "data_points": [
        {"metric": "string", "value": "string", "trend": "up" | "down" | "stable"}
      ],
      "recommended_actions": [
        {"action": "string", "priority": number, "estimated_impact": "string"}
      ],
      "time_sensitivity": "immediate" | "short_term" | "medium_term" | "long_term"
    }
  ],
  "key_takeaways": ["string"],
  "strategic_recommendations": ["string"]
}`;
        userPrompt = `Genera insights empresariales basándote en: ${JSON.stringify(context)}`;
        break;

      case 'forecast_metrics':
        systemPrompt = `Eres un sistema de pronóstico predictivo para métricas de negocio.

CAPACIDADES:
- Pronósticos multi-horizonte (corto, medio, largo plazo)
- Análisis de escenarios (optimista, base, pesimista)
- Factores de influencia y su peso
- Intervalos de confianza

FORMATO DE RESPUESTA (JSON):
{
  "forecasts": [
    {
      "metric_name": "string",
      "current_value": number,
      "predictions": [
        {
          "horizon": "7d" | "30d" | "90d" | "365d",
          "scenarios": {
            "optimistic": {"value": number, "probability": number},
            "base": {"value": number, "probability": number},
            "pessimistic": {"value": number, "probability": number}
          },
          "confidence_interval": {"lower": number, "upper": number},
          "trend_direction": "up" | "down" | "stable"
        }
      ],
      "influencing_factors": [
        {"factor": "string", "weight": number, "direction": "positive" | "negative"}
      ],
      "seasonality_detected": boolean,
      "model_accuracy": number
    }
  ],
  "overall_outlook": "positive" | "neutral" | "negative",
  "key_risks": ["string"],
  "opportunities": ["string"]
}`;
        userPrompt = `Genera pronósticos para: ${JSON.stringify(params)}`;
        break;

      case 'create_dynamic_dashboard':
        systemPrompt = `Eres un diseñador de dashboards dinámicos impulsado por IA.

CAPACIDADES:
- Crear layouts optimizados según objetivos
- Seleccionar visualizaciones apropiadas
- Configurar alertas y umbrales
- Personalizar según rol del usuario

FORMATO DE RESPUESTA (JSON):
{
  "dashboard": {
    "id": "string",
    "name": "string",
    "description": "string",
    "layout": "grid" | "flow" | "tabs" | "sections",
    "refresh_rate_seconds": number,
    "widgets": [
      {
        "id": "string",
        "type": "metric_card" | "line_chart" | "bar_chart" | "pie_chart" | "gauge" | "table" | "heatmap" | "funnel" | "kpi_tile",
        "title": "string",
        "position": {"row": number, "col": number, "width": number, "height": number},
        "data_source": "string",
        "config": {
          "primary_metric": "string",
          "comparison": "string" | null,
          "thresholds": {"warning": number, "critical": number} | null,
          "visualization_options": {}
        },
        "interactivity": {
          "drill_down": boolean,
          "filters": ["string"],
          "click_action": "string" | null
        }
      }
    ],
    "global_filters": [
      {"name": "string", "type": "date_range" | "select" | "multi_select", "options": []}
    ],
    "ai_features": {
      "auto_insights": boolean,
      "anomaly_highlighting": boolean,
      "predictive_overlays": boolean,
      "natural_language_query": boolean
    }
  },
  "recommendations": ["string"]
}`;
        userPrompt = `Crea un dashboard dinámico para: ${JSON.stringify(params)}`;
        break;

      case 'correlate_metrics':
        systemPrompt = `Eres un sistema de correlación de métricas empresariales.

CAPACIDADES:
- Identificar correlaciones entre métricas
- Detectar relaciones causales potenciales
- Analizar lag y lead indicators
- Sugerir métricas relacionadas

FORMATO DE RESPUESTA (JSON):
{
  "correlations": [
    {
      "metric_a": "string",
      "metric_b": "string",
      "correlation_coefficient": number,
      "relationship_type": "positive" | "negative" | "none",
      "strength": "weak" | "moderate" | "strong" | "very_strong",
      "lag_days": number,
      "potential_causality": {
        "direction": "a_causes_b" | "b_causes_a" | "mutual" | "unknown",
        "confidence": number,
        "explanation": "string"
      },
      "business_interpretation": "string"
    }
  ],
  "metric_clusters": [
    {
      "name": "string",
      "metrics": ["string"],
      "common_drivers": ["string"]
    }
  ],
  "lead_indicators": [
    {"metric": "string", "predicts": "string", "lead_time_days": number, "accuracy": number}
  ],
  "recommended_monitoring": ["string"]
}`;
        userPrompt = `Analiza correlaciones entre: ${JSON.stringify(context)}`;
        break;

      case 'benchmark_performance':
        systemPrompt = `Eres un sistema de benchmarking y comparación de rendimiento.

CAPACIDADES:
- Comparar contra industria y mejores prácticas
- Identificar brechas de rendimiento
- Sugerir objetivos realistas
- Priorizar áreas de mejora

FORMATO DE RESPUESTA (JSON):
{
  "benchmarks": [
    {
      "metric_name": "string",
      "current_value": number,
      "benchmarks": {
        "industry_average": number,
        "top_quartile": number,
        "best_in_class": number
      },
      "percentile_rank": number,
      "gap_analysis": {
        "gap_to_average": number,
        "gap_to_top_quartile": number,
        "improvement_required_pct": number
      },
      "improvement_potential": "low" | "medium" | "high",
      "recommended_target": number,
      "timeline_to_target": "string"
    }
  ],
  "overall_performance": {
    "score": number,
    "rating": "below_average" | "average" | "above_average" | "top_performer",
    "strongest_areas": ["string"],
    "weakest_areas": ["string"]
  },
  "improvement_roadmap": [
    {"area": "string", "current": number, "target": number, "priority": number, "actions": ["string"]}
  ]
}`;
        userPrompt = `Realiza benchmarking para: ${JSON.stringify(params)}`;
        break;

      case 'get_recommendations':
        systemPrompt = `Eres un sistema de recomendaciones estratégicas basado en datos.

CAPACIDADES:
- Generar recomendaciones accionables
- Priorizar por impacto y esfuerzo
- Estimar ROI de cada recomendación
- Crear planes de implementación

FORMATO DE RESPUESTA (JSON):
{
  "recommendations": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "category": "revenue" | "efficiency" | "cost_reduction" | "risk_mitigation" | "growth",
      "priority": "critical" | "high" | "medium" | "low",
      "impact": {
        "type": "revenue" | "cost" | "efficiency" | "satisfaction",
        "estimated_value": number,
        "confidence": number,
        "timeframe": "string"
      },
      "effort": {
        "level": "low" | "medium" | "high",
        "resources_required": ["string"],
        "estimated_duration": "string"
      },
      "roi_score": number,
      "implementation_steps": [
        {"step": number, "action": "string", "owner": "string", "deadline": "string"}
      ],
      "success_metrics": ["string"],
      "risks": ["string"],
      "dependencies": ["string"]
    }
  ],
  "quick_wins": ["string"],
  "strategic_initiatives": ["string"],
  "prioritization_matrix": {
    "high_impact_low_effort": ["string"],
    "high_impact_high_effort": ["string"],
    "low_impact_low_effort": ["string"],
    "low_impact_high_effort": ["string"]
  }
}`;
        userPrompt = `Genera recomendaciones basadas en: ${JSON.stringify(context)}`;
        break;

      case 'pattern_recognition':
        systemPrompt = `Eres un sistema de reconocimiento de patrones en datos empresariales.

CAPACIDADES:
- Identificar patrones recurrentes
- Detectar ciclos y estacionalidad
- Reconocer patrones de comportamiento
- Predecir patrones futuros

FORMATO DE RESPUESTA (JSON):
{
  "patterns": [
    {
      "id": "string",
      "name": "string",
      "type": "cyclical" | "seasonal" | "trend" | "behavioral" | "event_driven",
      "description": "string",
      "frequency": "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "irregular",
      "strength": number,
      "predictability": number,
      "affected_metrics": ["string"],
      "triggers": ["string"],
      "expected_next_occurrence": "ISO timestamp",
      "business_impact": "string",
      "recommended_actions": ["string"]
    }
  ],
  "emerging_patterns": [
    {"pattern": "string", "confidence": number, "monitoring_recommendation": "string"}
  ],
  "pattern_changes": [
    {"pattern": "string", "change_type": "weakening" | "strengthening" | "shifting", "details": "string"}
  ],
  "forecasting_confidence": number
}`;
        userPrompt = `Identifica patrones en: ${JSON.stringify(context)}`;
        break;

      case 'real_time_analysis':
        systemPrompt = `Eres un sistema de análisis en tiempo real para métricas de negocio.

CAPACIDADES:
- Procesar streams de datos en tiempo real
- Detectar eventos significativos instantáneamente
- Generar alertas contextuales
- Proporcionar análisis instantáneo

FORMATO DE RESPUESTA (JSON):
{
  "current_state": {
    "timestamp": "ISO timestamp",
    "overall_health": number,
    "active_alerts": number,
    "metrics_summary": [
      {"name": "string", "value": number, "trend": "up" | "down" | "stable", "status": "normal" | "warning" | "critical"}
    ]
  },
  "real_time_events": [
    {
      "id": "string",
      "type": "threshold_breach" | "trend_change" | "anomaly" | "milestone" | "correlation_shift",
      "severity": "info" | "warning" | "critical",
      "message": "string",
      "affected_metrics": ["string"],
      "detected_at": "ISO timestamp",
      "auto_resolved": boolean,
      "action_required": boolean
    }
  ],
  "live_insights": [
    {"insight": "string", "relevance": number, "expires_in_minutes": number}
  ],
  "streaming_recommendations": [
    {"action": "string", "urgency": "immediate" | "soon" | "when_possible", "reason": "string"}
  ],
  "next_predicted_event": {
    "type": "string",
    "probability": number,
    "expected_time": "ISO timestamp"
  }
}`;
        userPrompt = `Analiza en tiempo real: ${JSON.stringify(context)}`;
        break;

      case 'cohort_analysis':
        systemPrompt = `Eres un sistema de análisis de cohortes empresariales.

CAPACIDADES:
- Segmentar usuarios/clientes en cohortes
- Analizar comportamiento por cohorte
- Identificar cohortes de alto valor
- Predecir evolución de cohortes

FORMATO DE RESPUESTA (JSON):
{
  "cohorts": [
    {
      "id": "string",
      "name": "string",
      "definition": "string",
      "size": number,
      "created_period": "string",
      "metrics": {
        "retention_rate": number,
        "lifetime_value": number,
        "engagement_score": number,
        "churn_rate": number,
        "growth_rate": number
      },
      "behavior_patterns": ["string"],
      "comparison_to_average": {
        "retention": number,
        "value": number,
        "engagement": number
      },
      "prediction": {
        "expected_ltv_30d": number,
        "churn_probability": number,
        "upsell_potential": number
      }
    }
  ],
  "cohort_trends": [
    {"trend": "string", "direction": "improving" | "declining" | "stable", "significance": number}
  ],
  "high_value_cohorts": ["string"],
  "at_risk_cohorts": ["string"],
  "recommendations_by_cohort": [
    {"cohort": "string", "recommendations": ["string"]}
  ],
  "optimal_cohort_profile": {
    "characteristics": ["string"],
    "acquisition_channels": ["string"],
    "engagement_patterns": ["string"]
  }
}`;
        userPrompt = `Realiza análisis de cohortes para: ${JSON.stringify(params)}`;
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
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

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
      console.error('[analytics-intelligence] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[analytics-intelligence] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[analytics-intelligence] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
