import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskRequest {
  action: 'get_risks' | 'assess_risk' | 'create_mitigation' | 'monitor_kris' | 'stress_test';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

// Circuit breaker state
const circuitBreaker = {
  failures: 0,
  lastFailureTime: 0,
  state: 'closed' as 'closed' | 'open' | 'half-open',
  MAX_FAILURES: 5,
  RESET_TIMEOUT: 60000, // 1 minute
  RETRY_TIMEOUT: 30000, // 30 seconds for AI API
};

function checkCircuitBreaker(): boolean {
  const now = Date.now();
  
  if (circuitBreaker.state === 'open') {
    if (now - circuitBreaker.lastFailureTime > circuitBreaker.RESET_TIMEOUT) {
      circuitBreaker.state = 'half-open';
      console.log('[obelixia-risk-management] Circuit breaker: OPEN -> HALF-OPEN');
      return true;
    }
    return false;
  }
  
  return true;
}

function recordSuccess() {
  circuitBreaker.failures = 0;
  if (circuitBreaker.state === 'half-open') {
    circuitBreaker.state = 'closed';
    console.log('[obelixia-risk-management] Circuit breaker: HALF-OPEN -> CLOSED');
  }
}

function recordFailure() {
  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = Date.now();
  
  if (circuitBreaker.failures >= circuitBreaker.MAX_FAILURES) {
    circuitBreaker.state = 'open';
    console.error('[obelixia-risk-management] Circuit breaker OPENED after', circuitBreaker.failures, 'failures');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check circuit breaker
    if (!checkCircuitBreaker()) {
      console.warn('[obelixia-risk-management] Circuit breaker is OPEN, rejecting request');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Service temporarily unavailable. Please try again later.',
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

    const { action, context, params } = await req.json() as RiskRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_risks':
        systemPrompt = `Eres un gestor de riesgos financieros empresariales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "risks": [
    {
      "id": "string",
      "name": "string",
      "category": "credit" | "market" | "liquidity" | "operational" | "compliance" | "strategic",
      "description": "string",
      "probability": "high" | "medium" | "low",
      "impact": "critical" | "high" | "medium" | "low",
      "riskScore": 0-100,
      "status": "active" | "mitigated" | "accepted" | "transferred",
      "owner": "string",
      "mitigations": [],
      "kris": [],
      "lastAssessment": "ISO date"
    }
  ],
  "summary": {
    "totalRisks": number,
    "criticalRisks": number,
    "overallExposure": number,
    "mitigationCoverage": number
  },
  "heatmap": {}
}`;
        userPrompt = context 
          ? `Obtén riesgos para: ${JSON.stringify(context)}`
          : 'Lista todos los riesgos financieros activos';
        break;

      case 'assess_risk':
        systemPrompt = `Eres un evaluador de riesgos financieros con metodología cuantitativa.

FORMATO DE RESPUESTA (JSON estricto):
{
  "assessment": {
    "riskId": "string",
    "assessmentDate": "ISO date",
    "methodology": "string",
    "inherentRisk": {
      "probability": number,
      "impact": number,
      "score": number,
      "category": "string"
    },
    "residualRisk": {
      "probability": number,
      "impact": number,
      "score": number,
      "category": "string"
    },
    "controls": [
      {
        "id": "string",
        "name": "string",
        "type": "preventive" | "detective" | "corrective",
        "effectiveness": number,
        "status": "string"
      }
    ],
    "quantification": {
      "expectedLoss": number,
      "worstCase": number,
      "var95": number,
      "var99": number
    }
  },
  "recommendations": [],
  "nextReviewDate": "ISO date"
}`;
        userPrompt = `Evalúa riesgo: ${JSON.stringify(params)}`;
        break;

      case 'create_mitigation':
        systemPrompt = `Eres un experto en estrategias de mitigación de riesgos financieros.

FORMATO DE RESPUESTA (JSON estricto):
{
  "mitigation": {
    "id": "string",
    "riskId": "string",
    "strategy": "avoid" | "reduce" | "transfer" | "accept",
    "name": "string",
    "description": "string",
    "actions": [
      {
        "id": "string",
        "action": "string",
        "responsible": "string",
        "dueDate": "ISO date",
        "status": "pending" | "in_progress" | "completed",
        "cost": number
      }
    ],
    "expectedReduction": number,
    "costBenefit": {
      "implementationCost": number,
      "expectedBenefit": number,
      "roi": number,
      "paybackPeriod": "string"
    },
    "kpis": []
  },
  "alternatives": [],
  "monitoring": {}
}`;
        userPrompt = `Crea plan de mitigación: ${JSON.stringify(params)}`;
        break;

      case 'monitor_kris':
        systemPrompt = `Eres un monitor de indicadores clave de riesgo (KRIs).

FORMATO DE RESPUESTA (JSON estricto):
{
  "kris": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "currentValue": number,
      "threshold": {
        "green": number,
        "yellow": number,
        "red": number
      },
      "status": "green" | "yellow" | "red",
      "trend": "improving" | "stable" | "worsening",
      "trendPercentage": number,
      "lastUpdated": "ISO date",
      "history": [],
      "alerts": []
    }
  ],
  "dashboard": {
    "greenCount": number,
    "yellowCount": number,
    "redCount": number,
    "overallHealth": number
  },
  "criticalAlerts": []
}`;
        userPrompt = context 
          ? `Monitorea KRIs para: ${JSON.stringify(context)}`
          : 'Obtén estado actual de todos los KRIs';
        break;

      case 'stress_test':
        systemPrompt = `Eres un experto en pruebas de estrés financiero y análisis de escenarios adversos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "stressTest": {
    "id": "string",
    "name": "string",
    "scenario": "string",
    "severity": "mild" | "moderate" | "severe" | "extreme",
    "assumptions": {},
    "results": {
      "baselineMetrics": {},
      "stressedMetrics": {},
      "impact": {
        "revenue": number,
        "expenses": number,
        "cashFlow": number,
        "capitalRatio": number,
        "liquidityRatio": number
      },
      "breachThresholds": [],
      "recoveryTime": "string"
    },
    "vulnerabilities": [],
    "mitigations": []
  },
  "comparison": {},
  "recommendations": []
}`;
        userPrompt = `Ejecuta prueba de estrés: ${JSON.stringify(params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-risk-management] Processing action: ${action}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), circuitBreaker.RETRY_TIMEOUT);

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
          temperature: 0.7,
          max_tokens: 3000,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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
        console.error('[obelixia-risk-management] JSON parse error:', parseError);
        // Limit recursion by returning error instead of retrying
        recordFailure();
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to parse AI response',
          rawContent: content?.substring(0, 200), // Truncate for safety
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[obelixia-risk-management] Success: ${action}`);
      recordSuccess(); // Record successful completion

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
    console.error('[obelixia-risk-management] Error:', error);
    recordFailure(); // Record failure for circuit breaker
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
