/**
 * obelixia-smart-reconciliation - Fase 7: Automated Reconciliation & Smart Matching
 * Edge Function para conciliación automática con IA
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'start_reconciliation' | 'get_suggested_matches' | 'confirm_match' | 'reject_match' | 
          'auto_match_batch' | 'get_rules' | 'create_rule' | 'get_stats' | 'learn_from_match';
  context?: {
    sessionId?: string;
    reconciliationType?: 'bank' | 'ar' | 'ap' | 'intercompany';
    dateRange?: { start: string; end: string };
    accountIds?: string[];
    partnerIds?: string[];
  };
  params?: Record<string, unknown>;
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, context, params } = await req.json() as FunctionRequest;

    console.log(`[obelixia-smart-reconciliation] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'start_reconciliation':
        systemPrompt = `Eres un experto en conciliación bancaria y contable con capacidades de IA avanzadas.
Tu rol es analizar transacciones y encontrar matches entre diferentes fuentes de datos.

TIPOS DE CONCILIACIÓN:
- bank: Conciliación bancaria (extractos vs contabilidad)
- ar: Cuentas por cobrar (facturas vs pagos recibidos)
- ap: Cuentas por pagar (facturas vs pagos realizados)
- intercompany: Transacciones intercompañía

CRITERIOS DE MATCHING:
1. Importe exacto o con tolerancia configurable
2. Fechas cercanas (±3 días por defecto)
3. Referencias cruzadas (números de factura, pedido, etc.)
4. Descripción similar (fuzzy matching)
5. Patrones aprendidos de matches anteriores

FORMATO DE RESPUESTA (JSON estricto):
{
  "session": {
    "id": "uuid",
    "sessionType": "bank|ar|ap|intercompany",
    "status": "in_progress",
    "totalItems": number,
    "matchedItems": number,
    "unmatchedItems": number,
    "autoMatchedItems": number,
    "manualMatchedItems": number,
    "startedAt": "ISO date"
  },
  "matches": [
    {
      "id": "uuid",
      "sourceType": "bank|invoice|payment|journal",
      "sourceId": "id",
      "sourceDescription": "descripción",
      "sourceAmount": number,
      "sourceDate": "ISO date",
      "targetType": "bank|invoice|payment|journal",
      "targetId": "id",
      "targetDescription": "descripción",
      "targetAmount": number,
      "targetDate": "ISO date",
      "matchConfidence": 0-1,
      "matchReason": "explicación del match",
      "status": "pending",
      "differenceAmount": number,
      "suggestedAction": "acción sugerida si hay diferencia"
    }
  ],
  "unmatchedItems": [...],
  "summary": {
    "autoMatchPotential": number,
    "reviewRequired": number,
    "totalAmount": number
  }
}`;

        userPrompt = `Inicia una sesión de conciliación con estos parámetros:
Tipo: ${context?.reconciliationType || 'bank'}
Rango de fechas: ${context?.dateRange?.start || 'último mes'} a ${context?.dateRange?.end || 'hoy'}
${context?.accountIds ? `Cuentas: ${context.accountIds.join(', ')}` : ''}
${context?.partnerIds ? `Partners: ${context.partnerIds.join(', ')}` : ''}

Genera datos de ejemplo realistas de una empresa española con:
- Transacciones bancarias típicas (pagos, cobros, comisiones)
- Facturas de proveedores y clientes
- Matches sugeridos con diferentes niveles de confianza
- Algunos items sin match para revisión manual`;
        break;

      case 'get_suggested_matches':
        systemPrompt = `Eres un sistema de matching inteligente para conciliación contable.
Analiza las transacciones y sugiere matches basándote en:
1. Importes (exactos o con diferencias pequeñas)
2. Fechas cercanas
3. Referencias en descripciones
4. Patrones históricos

FORMATO DE RESPUESTA (JSON estricto):
{
  "matches": [
    {
      "id": "uuid",
      "sourceType": "bank",
      "sourceId": "id",
      "sourceDescription": "descripción",
      "sourceAmount": number,
      "sourceDate": "ISO date",
      "targetType": "invoice",
      "targetId": "id",
      "targetDescription": "descripción",
      "targetAmount": number,
      "targetDate": "ISO date",
      "matchConfidence": 0-1,
      "matchReason": "razón del match",
      "status": "pending",
      "differenceAmount": number
    }
  ],
  "confidenceDistribution": {
    "high": number,
    "medium": number,
    "low": number
  }
}`;

        userPrompt = `Busca matches sugeridos para: ${JSON.stringify(context)}`;
        break;

      case 'confirm_match':
      case 'reject_match':
        systemPrompt = `Eres un sistema de gestión de conciliación.
Procesa la ${action === 'confirm_match' ? 'confirmación' : 'rechazo'} del match.

FORMATO DE RESPUESTA (JSON estricto):
{
  "matchId": "id",
  "action": "confirmed|rejected",
  "timestamp": "ISO date",
  "affectedRecords": [...],
  "journalEntryGenerated": boolean,
  "notes": "notas adicionales"
}`;

        userPrompt = `${action === 'confirm_match' ? 'Confirma' : 'Rechaza'} el match: ${JSON.stringify(params)}`;
        break;

      case 'auto_match_batch':
        systemPrompt = `Eres un sistema de auto-matching para conciliación contable.
Aplica matches automáticamente cuando la confianza supera el umbral.

FORMATO DE RESPUESTA (JSON estricto):
{
  "autoMatchedCount": number,
  "matchedItems": [
    {
      "matchId": "id",
      "confidence": number,
      "sourceAmount": number,
      "targetAmount": number
    }
  ],
  "skippedCount": number,
  "skippedReasons": [...],
  "totalAmountReconciled": number,
  "timestamp": "ISO date"
}`;

        userPrompt = `Aplica auto-match con umbral de confianza: ${params?.confidenceThreshold || 0.95}`;
        break;

      case 'get_rules':
        systemPrompt = `Eres un sistema de gestión de reglas de conciliación.
Proporciona las reglas configuradas para matching automático.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rules": [
    {
      "id": "uuid",
      "ruleName": "nombre descriptivo",
      "ruleType": "exact|fuzzy|pattern|ai_learned",
      "sourceField": "campo origen",
      "targetField": "campo destino",
      "matchCriteria": {...},
      "confidenceThreshold": 0-1,
      "autoApply": boolean,
      "isActive": boolean,
      "matchCount": number,
      "createdAt": "ISO date"
    }
  ]
}`;

        userPrompt = `Obtén las reglas de conciliación configuradas`;
        break;

      case 'create_rule':
        systemPrompt = `Eres un sistema de creación de reglas de matching.
Crea una nueva regla basada en los parámetros proporcionados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rule": {
    "id": "uuid",
    "ruleName": "nombre",
    "ruleType": "exact|fuzzy|pattern|ai_learned",
    "sourceField": "campo",
    "targetField": "campo",
    "matchCriteria": {...},
    "confidenceThreshold": number,
    "autoApply": boolean,
    "isActive": true,
    "matchCount": 0,
    "createdAt": "ISO date"
  },
  "validationResult": {
    "isValid": boolean,
    "potentialMatches": number,
    "warnings": []
  }
}`;

        userPrompt = `Crea una regla de conciliación: ${JSON.stringify(params?.rule)}`;
        break;

      case 'get_stats':
        systemPrompt = `Eres un sistema de análisis de conciliación.
Proporciona estadísticas sobre el rendimiento del matching.

FORMATO DE RESPUESTA (JSON estricto):
{
  "stats": {
    "totalReconciliations": number,
    "autoMatchRate": 0-100,
    "avgConfidence": 0-100,
    "pendingMatches": number,
    "savedHours": number,
    "accuracy": 0-100,
    "trendsWeekly": [
      {
        "week": "2024-W01",
        "autoMatched": number,
        "manualMatched": number
      }
    ]
  }
}`;

        userPrompt = `Obtén estadísticas de conciliación`;
        break;

      case 'learn_from_match':
        systemPrompt = `Eres un sistema de aprendizaje automático para conciliación.
Aprende patrones de matches manuales para mejorar futuros matches automáticos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "patternLearned": {
    "patternId": "uuid",
    "patternType": "description|amount|reference|combined",
    "extractedFeatures": {...},
    "confidenceBoost": number,
    "applicableScenarios": number
  },
  "rulesSuggested": [
    {
      "ruleName": "nombre sugerido",
      "ruleType": "ai_learned",
      "potentialMatches": number
    }
  ]
}`;

        userPrompt = `Aprende del match manual: ${JSON.stringify(params)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    // AI Call
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
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
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
      console.error('[obelixia-smart-reconciliation] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-smart-reconciliation] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-smart-reconciliation] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
