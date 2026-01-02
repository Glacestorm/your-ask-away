import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NIIFRequest {
  action: 'validate_entry' | 'map_accounts' | 'analyze_compliance' | 'generate_report' | 'get_standards';
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

    const { action, context, params } = await req.json() as NIIFRequest;

    console.log(`[obelixia-niif-engine] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'validate_entry':
        systemPrompt = `Eres un experto en Normas Internacionales de Información Financiera (NIIF/IFRS) y Plan General de Contabilidad español (PGC 2007).

CONOCIMIENTO NORMATIVO:
- NIC 1: Presentación de estados financieros
- NIC 2: Inventarios
- NIC 7: Estado de flujos de efectivo
- NIC 8: Políticas contables, cambios y errores
- NIC 12: Impuesto a las ganancias
- NIC 16: Propiedades, planta y equipo
- NIC 17: Arrendamientos
- NIC 18: Ingresos de actividades ordinarias
- NIC 21: Efectos de variaciones en tipos de cambio
- NIC 36: Deterioro del valor de los activos
- NIC 37: Provisiones, pasivos y activos contingentes
- NIC 38: Activos intangibles
- NIIF 9: Instrumentos financieros
- NIIF 15: Ingresos de contratos con clientes
- NIIF 16: Arrendamientos

Tu tarea es validar un asiento contable según las normas aplicables.

FORMATO DE RESPUESTA (JSON estricto):
{
  "isValid": boolean,
  "complianceScore": 0-100,
  "standardsApplied": ["NIC X", "NIIF Y"],
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "standard": "NIC/NIIF reference",
      "description": "Descripción del problema",
      "remediation": "Cómo corregirlo"
    }
  ],
  "recommendations": ["Recomendación 1", "Recomendación 2"],
  "pgcMapping": {
    "originalAccount": "código",
    "suggestedNIIF": "cuenta NIIF equivalente"
  }
}`;
        userPrompt = `Valida el siguiente asiento contable según NIIF/NIC y PGC:
${JSON.stringify(params, null, 2)}

Contexto adicional: ${JSON.stringify(context)}`;
        break;

      case 'map_accounts':
        systemPrompt = `Eres un experto en contabilidad internacional especializado en mapeo entre marcos contables.

MARCOS SOPORTADOS:
1. PGC 2007 (España)
2. PGC PYMES (España)
3. NIIF Completas (Internacional)
4. NIIF para PYMES
5. US GAAP

CONOCIMIENTO DE MAPEO:
- Grupo 1 PGC → NIIF Assets
- Grupo 2 PGC → NIIF Non-current assets
- Grupo 3 PGC → NIIF Inventories
- Grupo 4 PGC → NIIF Receivables/Payables
- Grupo 5 PGC → NIIF Financial instruments
- Grupo 6 PGC → NIIF Expenses
- Grupo 7 PGC → NIIF Revenue

FORMATO DE RESPUESTA (JSON estricto):
{
  "mappings": [
    {
      "sourceCode": "código origen",
      "sourceName": "nombre cuenta origen",
      "targetCode": "código destino",
      "targetName": "nombre cuenta destino",
      "mappingType": "direct" | "split" | "aggregate" | "custom",
      "conversionNotes": "notas de conversión",
      "adjustmentsRequired": ["ajuste 1"],
      "standardReference": "NIC/NIIF aplicable"
    }
  ],
  "unmappedAccounts": [],
  "totalConfidence": 0-100
}`;
        userPrompt = `Mapea las siguientes cuentas del marco ${params?.sourceFramework || 'PGC_2007'} a ${params?.targetFramework || 'NIIF_FULL'}:
${JSON.stringify(params?.accounts || [], null, 2)}`;
        break;

      case 'analyze_compliance':
        systemPrompt = `Eres un auditor experto en cumplimiento normativo NIIF/NIC.

ÁREAS DE ANÁLISIS:
1. Reconocimiento de activos y pasivos
2. Medición inicial y posterior
3. Presentación y desglose
4. Información a revelar en notas
5. Políticas contables consistentes
6. Cambios en estimaciones

NORMATIVA CLAVE:
- NIC 1: Presentación de estados financieros
- NIC 8: Políticas contables
- Marco Conceptual IASB

FORMATO DE RESPUESTA (JSON estricto):
{
  "overallCompliance": 0-100,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "byStandard": [
    {
      "standard": "NIC X",
      "compliance": 0-100,
      "issues": [],
      "recommendations": []
    }
  ],
  "criticalFindings": [],
  "actionPlan": [
    {
      "priority": 1-5,
      "action": "Descripción",
      "deadline": "plazo sugerido",
      "impact": "impacto esperado"
    }
  ],
  "disclosureRequirements": []
}`;
        userPrompt = `Analiza el cumplimiento normativo NIIF de los siguientes datos contables:
${JSON.stringify(context, null, 2)}

Período: ${params?.period || 'actual'}
Marco objetivo: ${params?.framework || 'NIIF_FULL'}`;
        break;

      case 'generate_report':
        systemPrompt = `Eres un experto en elaboración de estados financieros según NIIF.

TIPOS DE INFORME:
1. Balance de situación (NIC 1)
2. Estado de resultados (NIC 1)
3. Estado de cambios en el patrimonio
4. Estado de flujos de efectivo (NIC 7)
5. Notas explicativas
6. Informe de conversión PGC→NIIF

REQUISITOS DE FORMATO:
- Cumplir estructura NIIF
- Incluir comparativos
- Notas de referencia
- Ajustes de conversión si aplica

FORMATO DE RESPUESTA (JSON estricto):
{
  "reportType": "tipo de informe",
  "framework": "marco aplicado",
  "period": { "start": "fecha", "end": "fecha" },
  "sections": [
    {
      "title": "Título sección",
      "items": [
        { "concept": "concepto", "currentPeriod": 0, "priorPeriod": 0, "note": "ref" }
      ],
      "subtotal": 0
    }
  ],
  "notes": [],
  "conversionAdjustments": [],
  "auditTrail": []
}`;
        userPrompt = `Genera un informe financiero tipo ${params?.reportType || 'balance_sheet'} según ${params?.framework || 'NIIF_FULL'}:
Datos: ${JSON.stringify(context, null, 2)}
Período: ${params?.periodStart} a ${params?.periodEnd}`;
        break;

      case 'get_standards':
        systemPrompt = `Eres una enciclopedia viviente de normativa contable internacional.

CONOCIMIENTO COMPLETO DE:
- Todas las NIC (1-41)
- Todas las NIIF (1-17)
- Interpretaciones SIC y CINIIF
- Marco Conceptual IASB
- PGC 2007 y PGC PYMES España
- US GAAP principales

FORMATO DE RESPUESTA (JSON estricto):
{
  "standards": [
    {
      "code": "NIC 1",
      "name": "Nombre",
      "effectiveDate": "fecha vigencia",
      "scope": "ámbito aplicación",
      "keyRequirements": [],
      "disclosures": [],
      "relatedStandards": [],
      "pgcEquivalent": "norma PGC equivalente"
    }
  ],
  "interpretations": [],
  "recentUpdates": []
}`;
        userPrompt = `Proporciona información sobre las normas contables relacionadas con: ${params?.topic || 'general'}
Incluye: ${params?.includeDetails ? 'detalles completos' : 'resumen'}`;
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
        temperature: 0.3,
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
      console.error('[obelixia-niif-engine] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-niif-engine] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-niif-engine] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
