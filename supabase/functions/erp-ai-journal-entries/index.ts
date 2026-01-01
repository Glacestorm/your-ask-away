/**
 * ERP AI Journal Entries - Sugerencia automática de asientos contables con IA
 * Tendencia 2025: Contabilidad autónoma con IA generativa
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIJournalRequest {
  action: 'suggest_entries' | 'validate_entry' | 'auto_classify' | 'detect_patterns' | 'generate_narrative';
  company_id?: string;
  transaction_data?: any;
  entry_data?: any;
  document_text?: string;
  country_code?: string;
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
    const { action, company_id, transaction_data, entry_data, document_text, country_code } = await req.json() as AIJournalRequest;

    let systemPrompt = '';
    let userPrompt = '';
    let result: any = {};

    switch (action) {
      case 'suggest_entries':
        systemPrompt = `Eres un experto contable con conocimiento profundo del Plan General Contable (PGC) español y normativas internacionales IFRS/NIC.

Tu rol es analizar transacciones y sugerir asientos contables correctos.

REGLAS:
1. Siempre respeta el principio de partida doble
2. Usa códigos de cuenta del PGC español (4 dígitos mínimo)
3. Incluye descripción clara y profesional
4. Detecta automáticamente el tipo de operación
5. Sugiere cuentas alternativas cuando sea apropiado

FORMATO DE RESPUESTA (JSON estricto):
{
  "suggested_entries": [
    {
      "confidence": 0-100,
      "operation_type": "string",
      "description": "string",
      "lines": [
        {
          "account_code": "string",
          "account_name": "string",
          "debit": number,
          "credit": number,
          "description": "string"
        }
      ],
      "tax_implications": ["string"],
      "regulatory_notes": ["string"],
      "alternative_accounts": [{"code": "string", "name": "string", "reason": "string"}]
    }
  ],
  "warnings": ["string"],
  "recommendations": ["string"]
}`;

        userPrompt = `Analiza la siguiente transacción y sugiere el asiento contable apropiado:

${JSON.stringify(transaction_data, null, 2)}

País: ${country_code || 'ES'}`;
        break;

      case 'validate_entry':
        systemPrompt = `Eres un auditor contable experto. Tu trabajo es validar asientos contables verificando:

1. Cuadre de partida doble (Debe = Haber)
2. Códigos de cuenta correctos según PGC
3. Coherencia lógica del asiento
4. Cumplimiento normativo
5. Posibles errores o fraudes

FORMATO DE RESPUESTA (JSON estricto):
{
  "is_valid": boolean,
  "balance_check": {
    "total_debit": number,
    "total_credit": number,
    "is_balanced": boolean
  },
  "account_validation": [
    {
      "account_code": "string",
      "is_valid": boolean,
      "issues": ["string"]
    }
  ],
  "coherence_score": 0-100,
  "fraud_risk_score": 0-100,
  "fraud_indicators": ["string"],
  "recommendations": ["string"],
  "regulatory_compliance": {
    "pgc_compliant": boolean,
    "tax_compliant": boolean,
    "notes": ["string"]
  }
}`;

        userPrompt = `Valida el siguiente asiento contable:

${JSON.stringify(entry_data, null, 2)}`;
        break;

      case 'auto_classify':
        systemPrompt = `Eres un sistema de clasificación automática de documentos contables.

Analiza el texto del documento y clasifica:
1. Tipo de documento (factura, nómina, extracto bancario, etc.)
2. Tipo de operación contable
3. Cuentas afectadas
4. Importes detectados
5. Terceros involucrados (clientes, proveedores)
6. Fechas relevantes

FORMATO DE RESPUESTA (JSON estricto):
{
  "document_type": "invoice" | "payroll" | "bank_statement" | "expense" | "receipt" | "contract" | "other",
  "operation_type": "string",
  "detected_amounts": [
    {
      "type": "base" | "tax" | "total" | "retention",
      "amount": number,
      "currency": "string"
    }
  ],
  "third_parties": [
    {
      "type": "customer" | "supplier" | "employee" | "bank" | "tax_authority",
      "name": "string",
      "tax_id": "string"
    }
  ],
  "dates": {
    "document_date": "string",
    "due_date": "string",
    "operation_date": "string"
  },
  "suggested_accounts": [
    {
      "code": "string",
      "name": "string",
      "amount": number,
      "position": "debit" | "credit"
    }
  ],
  "confidence": 0-100,
  "ocr_quality": 0-100,
  "needs_review": boolean,
  "review_reasons": ["string"]
}`;

        userPrompt = `Clasifica y extrae información del siguiente documento:

${document_text}`;
        break;

      case 'detect_patterns':
        systemPrompt = `Eres un analista de patrones contables con expertise en detección de tendencias.

Analiza el historial de transacciones para detectar:
1. Patrones recurrentes (gastos fijos, ingresos periódicos)
2. Anomalías estadísticas
3. Tendencias de crecimiento/decrecimiento
4. Estacionalidad
5. Correlaciones entre cuentas

FORMATO DE RESPUESTA (JSON estricto):
{
  "recurring_patterns": [
    {
      "description": "string",
      "frequency": "daily" | "weekly" | "monthly" | "quarterly" | "annual",
      "average_amount": number,
      "next_expected_date": "string",
      "confidence": 0-100
    }
  ],
  "anomalies": [
    {
      "transaction_id": "string",
      "type": "amount" | "timing" | "account" | "description",
      "severity": "low" | "medium" | "high",
      "description": "string"
    }
  ],
  "trends": [
    {
      "account_code": "string",
      "trend": "increasing" | "decreasing" | "stable",
      "change_percentage": number,
      "period": "string"
    }
  ],
  "seasonality": [
    {
      "pattern": "string",
      "peak_months": [number],
      "low_months": [number]
    }
  ],
  "predictions": [
    {
      "account_code": "string",
      "predicted_value": number,
      "prediction_date": "string",
      "confidence": 0-100
    }
  ]
}`;

        userPrompt = `Analiza los siguientes patrones de transacciones:

${JSON.stringify(transaction_data, null, 2)}`;
        break;

      case 'generate_narrative':
        systemPrompt = `Eres un redactor de memorias contables y explicaciones financieras.

Genera narrativas profesionales para:
1. Memorias anuales
2. Informes de gestión
3. Explicaciones de variaciones
4. Notas a los estados financieros

El tono debe ser profesional, claro y conforme a las normas de presentación de cuentas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "narrative": "string",
  "key_points": ["string"],
  "figures_mentioned": [
    {
      "description": "string",
      "value": number,
      "comparison": "string"
    }
  ],
  "regulatory_references": ["string"],
  "suggested_disclosures": ["string"]
}`;

        userPrompt = `Genera una narrativa profesional para los siguientes datos contables:

${JSON.stringify(transaction_data, null, 2)}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[erp-ai-journal-entries] Processing action: ${action}`);

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
        temperature: 0.3,
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
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[erp-ai-journal-entries] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    // Log para auditoría
    await supabase.from('erp_audit_events').insert({
      company_id,
      entity_type: 'ai_journal_suggestion',
      action,
      after_json: result,
      metadata: { 
        model: 'google/gemini-2.5-flash',
        tokens_used: data.usage?.total_tokens 
      }
    });

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-ai-journal-entries] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
