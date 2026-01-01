/**
 * ERP Auto Reconciliation - Reconciliación bancaria automática con IA
 * Tendencia 2025-2027: Matching inteligente, Open Banking
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationRequest {
  action: 'auto_match' | 'suggest_matches' | 'learn_patterns' | 'reconcile_batch' | 'predict_matches';
  company_id?: string;
  bank_transactions?: any[];
  accounting_entries?: any[];
  historical_matches?: any[];
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
    const { action, company_id, bank_transactions, accounting_entries, historical_matches } = await req.json() as ReconciliationRequest;

    let systemPrompt = '';
    let userPrompt = '';
    let result: any = {};

    switch (action) {
      case 'auto_match':
        systemPrompt = `Eres un sistema experto de reconciliación bancaria automática.

CRITERIOS DE MATCHING:
1. Importe exacto (prioridad alta)
2. Fecha cercana (±3 días)
3. Descripción/concepto similar (NLP)
4. Referencia coincidente
5. Patrones históricos aprendidos
6. Tercero identificado

TIPOS DE MATCH:
- 1:1 - Una transacción bancaria = Un asiento
- 1:N - Una bancaria = Múltiples asientos
- N:1 - Múltiples bancarias = Un asiento (pagos parciales)
- N:M - Complejo (requiere revisión)

FORMATO DE RESPUESTA (JSON estricto):
{
  "auto_matched": [
    {
      "bank_transaction_id": "string",
      "accounting_entry_ids": ["string"],
      "match_type": "1:1" | "1:N" | "N:1" | "N:M",
      "confidence": 0-100,
      "match_reasons": ["string"],
      "amount_bank": number,
      "amount_accounting": number,
      "difference": number,
      "auto_approved": boolean
    }
  ],
  "pending_review": [
    {
      "bank_transaction_id": "string",
      "possible_matches": [
        {
          "entry_id": "string",
          "confidence": 0-100,
          "reasons": ["string"]
        }
      ],
      "review_reason": "string"
    }
  ],
  "unmatched_bank": ["string"],
  "unmatched_accounting": ["string"],
  "summary": {
    "total_bank": number,
    "total_accounting": number,
    "auto_matched_count": number,
    "pending_count": number,
    "unmatched_count": number,
    "match_rate": number
  }
}`;

        userPrompt = `Realiza la reconciliación automática entre:

TRANSACCIONES BANCARIAS:
${JSON.stringify(bank_transactions, null, 2)}

ASIENTOS CONTABLES:
${JSON.stringify(accounting_entries, null, 2)}`;
        break;

      case 'suggest_matches':
        systemPrompt = `Eres un asistente de reconciliación que sugiere posibles matches.

Para cada transacción sin conciliar, ordena los posibles matches por probabilidad.

USA:
- Similitud de importes (fuzzy matching para centavos)
- Análisis semántico de descripciones
- Proximidad temporal
- Historial de matches similares
- Identificación de terceros (NIF, nombres)

FORMATO DE RESPUESTA (JSON estricto):
{
  "suggestions": [
    {
      "bank_transaction_id": "string",
      "bank_amount": number,
      "bank_description": "string",
      "suggested_matches": [
        {
          "entry_id": "string",
          "entry_amount": number,
          "entry_description": "string",
          "confidence": 0-100,
          "match_factors": [
            {
              "factor": "string",
              "score": 0-100,
              "details": "string"
            }
          ],
          "warnings": ["string"]
        }
      ]
    }
  ],
  "no_suggestions": [
    {
      "bank_transaction_id": "string",
      "reason": "string",
      "recommended_action": "string"
    }
  ]
}`;

        userPrompt = `Sugiere matches para:

TRANSACCIONES BANCARIAS SIN CONCILIAR:
${JSON.stringify(bank_transactions, null, 2)}

ASIENTOS DISPONIBLES:
${JSON.stringify(accounting_entries, null, 2)}`;
        break;

      case 'learn_patterns':
        systemPrompt = `Eres un sistema de aprendizaje de patrones de reconciliación.

APRENDE DE:
1. Matches históricos exitosos
2. Correcciones manuales
3. Patrones de la empresa
4. Comportamiento de terceros

GENERA:
1. Reglas de matching personalizadas
2. Patrones de descripción recurrentes
3. Perfiles de terceros
4. Excepciones conocidas

FORMATO DE RESPUESTA (JSON estricto):
{
  "learned_patterns": [
    {
      "pattern_id": "string",
      "pattern_type": "description" | "amount" | "timing" | "third_party",
      "pattern_rule": "string",
      "confidence": 0-100,
      "examples_count": number,
      "last_seen": "string"
    }
  ],
  "third_party_profiles": [
    {
      "name": "string",
      "aliases": ["string"],
      "typical_amounts": { "min": number, "max": number, "avg": number },
      "typical_timing": "string",
      "account_codes": ["string"]
    }
  ],
  "custom_rules": [
    {
      "rule_name": "string",
      "condition": "string",
      "action": "string",
      "priority": number
    }
  ],
  "accuracy_improvement": number
}`;

        userPrompt = `Aprende de estos matches históricos:

${JSON.stringify(historical_matches, null, 2)}`;
        break;

      case 'predict_matches':
        systemPrompt = `Eres un sistema predictivo de reconciliación.

PREDICE:
1. Transacciones bancarias esperadas (domiciliaciones, nóminas)
2. Cobros pendientes probables
3. Timing de reconciliación
4. Problemas potenciales

FORMATO DE RESPUESTA (JSON estricto):
{
  "predicted_transactions": [
    {
      "type": "expected_payment" | "expected_receipt" | "recurring",
      "description": "string",
      "predicted_amount": number,
      "predicted_date": "string",
      "confidence": 0-100,
      "related_accounting_entry": "string",
      "source_pattern": "string"
    }
  ],
  "potential_issues": [
    {
      "issue_type": "string",
      "description": "string",
      "affected_items": ["string"],
      "recommended_action": "string"
    }
  ],
  "reconciliation_forecast": {
    "expected_match_rate": number,
    "expected_manual_review": number,
    "expected_completion_date": "string"
  }
}`;

        userPrompt = `Predice próximas transacciones basándote en:

PATRONES HISTÓRICOS:
${JSON.stringify(historical_matches, null, 2)}

PENDIENTES ACTUALES:
${JSON.stringify(accounting_entries, null, 2)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-auto-reconciliation] Processing action: ${action}`);

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
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded' 
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

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('[erp-auto-reconciliation] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-auto-reconciliation] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
