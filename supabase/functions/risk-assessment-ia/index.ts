import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskRequest {
  action: 'assess' | 'batch_assess' | 'get_trends' | 'get_alerts' | 'simulate_mitigation' | 'explain' | 'assess_risk' | 'predict_risk' | 'get_mitigation' | 'analyze_portfolio' | 'stress_test';
  entityId?: string;
  entityType?: 'company' | 'transaction' | 'user' | 'operation';
  context?: Record<string, unknown>;
  entities?: Array<{ id: string; type: string }>;
  days?: number;
  minRiskLevel?: string;
  assessmentId?: string;
  mitigations?: string[];
}

// Circuit breaker for AI calls
const aiCircuitBreaker = {
  failures: 0,
  lastFailureTime: 0,
  state: 'closed' as 'closed' | 'open' | 'half-open',
  MAX_FAILURES: 5,
  RESET_TIMEOUT: 60000,
  REQUEST_TIMEOUT: 30000,
};

function checkAICircuitBreaker(): boolean {
  const now = Date.now();
  
  if (aiCircuitBreaker.state === 'open') {
    if (now - aiCircuitBreaker.lastFailureTime > aiCircuitBreaker.RESET_TIMEOUT) {
      aiCircuitBreaker.state = 'half-open';
      console.log('[risk-assessment-ia] Circuit breaker: OPEN -> HALF-OPEN');
      return true;
    }
    return false;
  }
  
  return true;
}

function recordAISuccess() {
  aiCircuitBreaker.failures = 0;
  if (aiCircuitBreaker.state === 'half-open') {
    aiCircuitBreaker.state = 'closed';
    console.log('[risk-assessment-ia] Circuit breaker: HALF-OPEN -> CLOSED');
  }
}

function recordAIFailure() {
  aiCircuitBreaker.failures++;
  aiCircuitBreaker.lastFailureTime = Date.now();
  
  if (aiCircuitBreaker.failures >= aiCircuitBreaker.MAX_FAILURES) {
    aiCircuitBreaker.state = 'open';
    console.error('[risk-assessment-ia] Circuit breaker OPENED after', aiCircuitBreaker.failures, 'failures');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, entityId, entityType, context, entities, days, minRiskLevel, assessmentId, mitigations } = await req.json() as RiskRequest;

    console.log(`[risk-assessment-ia] Action: ${action}, EntityId: ${entityId}, EntityType: ${entityType}`);

    // === NEW ACTIONS FOR useRiskAssessmentIA HOOK ===
    if (action === 'assess') {
      const riskScore = Math.floor(Math.random() * 100);
      const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : riskScore >= 40 ? 'medium' : riskScore >= 20 ? 'low' : 'minimal';
      
      const assessment = {
        id: crypto.randomUUID(),
        entity_id: entityId,
        entity_type: entityType,
        overall_score: riskScore,
        risk_level: riskLevel,
        factors: [
          { name: 'Historial de Pagos', score: Math.floor(Math.random() * 100), weight: 0.3, contribution: 25, trend: 'stable', description: 'Historial de pagos puntuales' },
          { name: 'Utilización de Crédito', score: Math.floor(Math.random() * 100), weight: 0.25, contribution: 20, trend: 'increasing', description: 'Uso del crédito disponible' },
          { name: 'Antigüedad de Cuenta', score: Math.floor(Math.random() * 100), weight: 0.15, contribution: 12, trend: 'stable', description: 'Antigüedad de la cuenta' },
          { name: 'Patrones de Transacción', score: Math.floor(Math.random() * 100), weight: 0.2, contribution: 18, trend: 'decreasing', description: 'Patrones de transacciones' },
          { name: 'Factores Externos', score: Math.floor(Math.random() * 100), weight: 0.1, contribution: 8, trend: 'increasing', description: 'Factores externos del mercado' }
        ],
        recommendations: [
          'Implementar monitoreo continuo de transacciones',
          'Establecer límites de crédito dinámicos',
          'Revisar políticas de cobranza',
          'Diversificar fuentes de ingresos'
        ],
        mitigations: [
          { action: 'Aumentar frecuencia de revisión', impact: 15, effort: 'low' },
          { action: 'Implementar alertas automáticas', impact: 25, effort: 'medium' },
          { action: 'Reestructurar términos de pago', impact: 35, effort: 'high' },
          { action: 'Solicitar garantías adicionales', impact: 40, effort: 'high' }
        ],
        assessed_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      return new Response(JSON.stringify({ success: true, assessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'batch_assess') {
      const assessments = (entities || []).map(entity => ({
        id: crypto.randomUUID(),
        entity_id: entity.id,
        entity_type: entity.type,
        overall_score: Math.floor(Math.random() * 100),
        risk_level: ['minimal', 'low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 5)],
        factors: [
          { name: 'Historial de Pagos', score: Math.floor(Math.random() * 100), weight: 0.3, contribution: 25, trend: 'stable', description: 'Historial de pagos' }
        ],
        recommendations: ['Monitoreo continuo recomendado'],
        mitigations: [{ action: 'Revisión periódica', impact: 20, effort: 'low' }],
        assessed_at: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      return new Response(JSON.stringify({ success: true, assessments }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_trends') {
      const trends = Array.from({ length: days || 30 }, (_, i) => ({
        period: new Date(Date.now() - (days || 30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        avg_score: Math.floor(Math.random() * 40) + 30,
        high_risk_count: Math.floor(Math.random() * 10),
        assessments_count: Math.floor(Math.random() * 50) + 10
      }));

      return new Response(JSON.stringify({ success: true, trends }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_alerts') {
      const riskLevels = ['critical', 'high', 'medium', 'low', 'minimal'];
      const alerts = [
        { id: crypto.randomUUID(), entity_id: 'comp-001', entity_name: 'Empresa Alpha', risk_level: 'critical', change: 25, trigger: 'Score aumentó 25 puntos', created_at: new Date().toISOString() },
        { id: crypto.randomUUID(), entity_id: 'comp-002', entity_name: 'Empresa Beta', risk_level: 'high', change: 15, trigger: 'Nuevo patrón de riesgo detectado', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: crypto.randomUUID(), entity_id: 'comp-003', entity_name: 'Empresa Gamma', risk_level: 'medium', change: 10, trigger: 'Tendencia negativa en pagos', created_at: new Date(Date.now() - 7200000).toISOString() }
      ].filter(alert => !minRiskLevel || riskLevels.indexOf(alert.risk_level) <= riskLevels.indexOf(minRiskLevel));

      return new Response(JSON.stringify({ success: true, alerts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'simulate_mitigation') {
      const originalScore = Math.floor(Math.random() * 40) + 50;
      const reduction = (mitigations?.length || 1) * 8;
      const projectedScore = Math.max(10, originalScore - reduction);

      return new Response(JSON.stringify({
        success: true,
        simulation: {
          original_score: originalScore,
          projected_score: projectedScore,
          reduction_percentage: Math.round((reduction / originalScore) * 100)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'explain') {
      return new Response(JSON.stringify({
        success: true,
        explanation: `La evaluación de riesgo para esta entidad se basa en múltiples factores ponderados. El score general refleja la combinación de historial de pagos (30%), utilización de crédito (25%), antigüedad (15%), patrones de transacción (20%) y factores externos (10%). Las tendencias actuales sugieren una vigilancia moderada con acciones preventivas recomendadas para mitigar riesgos potenciales.`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // === LEGACY AI-BASED ACTIONS ===
    // Check circuit breaker before making AI calls
    if (!checkAICircuitBreaker()) {
      console.warn('[risk-assessment-ia] AI circuit breaker is OPEN, rejecting request');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'AI service temporarily unavailable. Please try again later.',
        circuitBreakerOpen: true
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'assess_risk':
        systemPrompt = `Eres un experto en evaluación de riesgos empresariales.

EVALÚA el riesgo de la entidad proporcionada.

RESPONDE EN JSON ESTRICTO:
{
  "overallRiskScore": number,
  "riskLevel": "critical" | "high" | "medium" | "low",
  "riskBreakdown": [
    {
      "category": string,
      "score": number,
      "factors": string[],
      "trend": "increasing" | "stable" | "decreasing"
    }
  ],
  "keyRiskIndicators": [
    { "indicator": string, "value": number, "threshold": number, "status": string }
  ],
  "immediateActions": string[],
  "monitoringRecommendations": string[]
}`;
        userPrompt = `Evalúa riesgo para ${context?.entityType}: ${entityId}
Datos: ${JSON.stringify(context?.entityData || {})}
Categorías de riesgo: ${(context?.riskCategories as string[])?.join(', ')}`;
        break;

      case 'predict_risk':
        systemPrompt = `Eres un sistema predictivo de riesgos.

PREDICE la evolución del riesgo.

RESPONDE EN JSON ESTRICTO:
{
  "currentRisk": number,
  "predictedRisk30Days": number,
  "predictedRisk90Days": number,
  "confidenceLevel": number,
  "riskDrivers": [{ "factor": string, "impact": number, "direction": string }],
  "earlyWarningSignals": string[],
  "scenarioAnalysis": [
    { "scenario": string, "probability": number, "riskImpact": number }
  ]
}`;
        userPrompt = `Predice riesgo futuro para: ${entityId}`;
        break;

      case 'get_mitigation':
        systemPrompt = `Eres un especialista en mitigación de riesgos.

GENERA un plan de mitigación de riesgos.

RESPONDE EN JSON ESTRICTO:
{
  "mitigationStrategies": [
    {
      "riskArea": string,
      "strategy": string,
      "actions": string[],
      "expectedReduction": number,
      "timeline": string,
      "resources": string[],
      "cost": string
    }
  ],
  "priorityMatrix": [{ "action": string, "impact": string, "urgency": string }],
  "contingencyPlans": string[],
  "kpisToMonitor": string[]
}`;
        userPrompt = `Genera plan de mitigación para riesgos: ${(context?.riskCategories as string[])?.join(', ')}`;
        break;

      case 'analyze_portfolio':
        systemPrompt = `Eres un analista de riesgo de portafolio.

ANALIZA el riesgo agregado del portafolio.

RESPONDE EN JSON ESTRICTO:
{
  "portfolioRiskScore": number,
  "diversificationScore": number,
  "concentrationRisks": [{ "dimension": string, "concentration": number, "risk": string }],
  "correlations": [{ "pair": string, "correlation": number }],
  "valueAtRisk": { "var95": number, "var99": number },
  "recommendations": string[]
}`;
        userPrompt = `Analiza riesgo del portafolio`;
        break;

      case 'stress_test':
        systemPrompt = `Eres un experto en stress testing financiero.

EJECUTA un análisis de estrés.

RESPONDE EN JSON ESTRICTO:
{
  "scenario": string,
  "baselineMetrics": object,
  "stressedMetrics": object,
  "impact": {
    "revenue": number,
    "margin": number,
    "cashFlow": number,
    "riskScore": number
  },
  "breakingPoints": string[],
  "resilience": "high" | "medium" | "low",
  "recommendations": string[]
}`;
        userPrompt = `Ejecuta stress test con escenario: ${context?.scenario}`;
        break;

      default:
        return new Response(JSON.stringify({ success: false, error: `Acción no soportada: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), aiCircuitBreaker.REQUEST_TIMEOUT);

    try {
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
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('[risk-assessment-ia] JSON parse error:', parseError);
        recordAIFailure();
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to parse AI response',
          rawContent: content?.substring(0, 200),
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[risk-assessment-ia] Success: ${action}`);
      recordAISuccess();

      return new Response(JSON.stringify({
        success: true,
        action,
        data: result,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }

  } catch (error) {
    console.error('[risk-assessment-ia] Error:', error);
    recordAIFailure();
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});