/**
 * ObelixIA Tax Planning Edge Function - Fase 9
 * Intelligent Tax Planning & Optimization
 * Enterprise SaaS 2025-2026
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaxPlanningRequest {
  action: 
    | 'get_tax_summary' 
    | 'analyze_optimizations' 
    | 'simulate_scenario' 
    | 'get_tax_calendar'
    | 'analyze_deductions'
    | 'update_optimization'
    | 'generate_report';
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

    const { action, context, params } = await req.json() as TaxPlanningRequest;

    console.log(`[obelixia-tax-planning] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_tax_summary':
        systemPrompt = `Eres un experto fiscal y asesor tributario para empresas.
        
GENERA un resumen fiscal completo con métricas clave.

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": {
    "currentYearLiability": 45000,
    "estimatedAnnualTax": 52000,
    "effectiveTaxRate": 23.5,
    "potentialSavings": 8500,
    "optimizationsIdentified": 7,
    "upcomingDeadlines": 3,
    "complianceScore": 92,
    "yearOverYearChange": -5.2
  },
  "breakdown": {
    "corporateTax": 35000,
    "vatLiability": 12000,
    "withholdingTaxes": 5000
  },
  "insights": [
    "Tipo efectivo por debajo de la media del sector",
    "3 optimizaciones pendientes de implementar"
  ]
}`;

        userPrompt = context 
          ? `Genera resumen fiscal para: ${JSON.stringify(context)}`
          : 'Genera un resumen fiscal de ejemplo para una empresa mediana.';
        break;

      case 'analyze_optimizations':
        systemPrompt = `Eres un experto en optimización fiscal y planificación tributaria.

ANALIZA e identifica oportunidades de optimización fiscal legales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "optimizations": [
    {
      "id": "uuid",
      "category": "deduction",
      "title": "Amortización acelerada de activos tecnológicos",
      "description": "Aplicar coeficientes de amortización acelerada para equipos informáticos según normativa vigente",
      "potentialSavings": 3500,
      "implementationComplexity": "low",
      "riskLevel": "low",
      "deadline": "2025-12-31",
      "requirements": ["Inventario de activos actualizado", "Justificación de uso profesional"],
      "status": "identified",
      "aiConfidence": 92
    },
    {
      "id": "uuid",
      "category": "credit",
      "title": "Crédito fiscal por I+D+i",
      "description": "Aplicar deducciones por actividades de investigación y desarrollo tecnológico",
      "potentialSavings": 12000,
      "implementationComplexity": "high",
      "riskLevel": "medium",
      "deadline": null,
      "requirements": ["Informe motivado", "Documentación técnica del proyecto"],
      "status": "identified",
      "aiConfidence": 78
    }
  ],
  "totalPotentialSavings": 15500,
  "priorityActions": ["Iniciar documentación I+D", "Revisar amortizaciones"]
}`;

        userPrompt = context 
          ? `Analiza optimizaciones fiscales para: ${JSON.stringify(context)}`
          : 'Genera análisis de optimizaciones fiscales de ejemplo.';
        break;

      case 'simulate_scenario':
        const scenarioName = params?.scenarioName || 'Escenario Base';
        const assumptions = params?.assumptions || {};
        
        systemPrompt = `Eres un experto en simulación y planificación fiscal.

SIMULA un escenario fiscal con las asunciones proporcionadas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "scenario": {
    "id": "uuid",
    "name": "${scenarioName}",
    "description": "Simulación basada en las asunciones proporcionadas",
    "assumptions": ${JSON.stringify(assumptions) || '{"revenueGrowth": 10, "costReduction": 5}'},
    "projectedTaxLiability": 48000,
    "effectiveTaxRate": 22.8,
    "comparedToBase": -8.5,
    "recommendations": [
      "Optimizar timing de facturación",
      "Considerar inversiones deducibles antes de cierre fiscal"
    ],
    "createdAt": "${new Date().toISOString()}"
  },
  "comparison": {
    "baseScenario": 52000,
    "simulatedScenario": 48000,
    "savingsOrCost": -4000
  }
}`;

        userPrompt = `Simula escenario "${scenarioName}" con asunciones: ${JSON.stringify(assumptions)}`;
        break;

      case 'get_tax_calendar':
        systemPrompt = `Eres un experto en calendario fiscal y obligaciones tributarias.

GENERA un calendario fiscal con próximas obligaciones y fechas clave.

FORMATO DE RESPUESTA (JSON estricto):
{
  "events": [
    {
      "id": "uuid",
      "eventType": "filing",
      "title": "Declaración IVA Trimestral (Modelo 303)",
      "description": "Presentación del modelo 303 correspondiente al 4T",
      "dueDate": "2025-01-30",
      "taxType": "IVA",
      "estimatedAmount": 8500,
      "status": "upcoming",
      "priority": "high",
      "reminderDays": [7, 3, 1]
    },
    {
      "id": "uuid",
      "eventType": "payment",
      "title": "Pago fraccionado IS",
      "description": "Tercer pago fraccionado del Impuesto sobre Sociedades",
      "dueDate": "2025-02-20",
      "taxType": "IS",
      "estimatedAmount": 12000,
      "status": "pending",
      "priority": "high",
      "reminderDays": [14, 7, 3]
    }
  ],
  "summary": {
    "thisMonth": 2,
    "nextMonth": 3,
    "overdue": 0,
    "totalEstimatedPayments": 25000
  }
}`;

        userPrompt = context 
          ? `Genera calendario fiscal para: ${JSON.stringify(context)}`
          : 'Genera calendario fiscal de ejemplo para una empresa española.';
        break;

      case 'analyze_deductions':
        systemPrompt = `Eres un experto en deducciones fiscales y beneficios tributarios.

ANALIZA las deducciones disponibles y oportunidades de maximización.

FORMATO DE RESPUESTA (JSON estricto):
{
  "deductions": [
    {
      "id": "uuid",
      "category": "Formación profesional",
      "description": "Gastos de formación del personal deducibles",
      "currentAmount": 5000,
      "maxAllowable": 15000,
      "potentialAdditional": 10000,
      "requirements": ["Facturas de cursos", "Registro de asistencia"],
      "expiresAt": "2025-12-31",
      "confidence": 95
    },
    {
      "id": "uuid",
      "category": "Inversiones medioambientales",
      "description": "Deducciones por inversiones en sostenibilidad",
      "currentAmount": 0,
      "maxAllowable": 25000,
      "potentialAdditional": 25000,
      "requirements": ["Certificación ambiental", "Proyecto de inversión"],
      "expiresAt": null,
      "confidence": 72
    }
  ],
  "totalCurrentDeductions": 45000,
  "totalPotentialAdditional": 35000,
  "recommendations": [
    "Maximizar gastos de formación antes de fin de año",
    "Evaluar inversiones sostenibles con beneficio fiscal"
  ]
}`;

        userPrompt = context 
          ? `Analiza deducciones para: ${JSON.stringify(context)}`
          : 'Genera análisis de deducciones de ejemplo.';
        break;

      case 'update_optimization':
        systemPrompt = `Eres un asistente de gestión fiscal.

Confirma la actualización del estado de la optimización.

FORMATO DE RESPUESTA (JSON estricto):
{
  "updated": true,
  "optimizationId": "${params?.optimizationId}",
  "newStatus": "${params?.status}",
  "timestamp": "${new Date().toISOString()}"
}`;

        userPrompt = `Actualiza optimización ${params?.optimizationId} a estado: ${params?.status}. Notas: ${params?.notes || 'Sin notas'}`;
        break;

      case 'generate_report':
        const reportType = params?.reportType || 'summary';
        
        systemPrompt = `Eres un experto en reporting fiscal y documentación tributaria.

GENERA un informe fiscal de tipo "${reportType}".

FORMATO DE RESPUESTA (JSON estricto):
{
  "report": {
    "type": "${reportType}",
    "generatedAt": "${new Date().toISOString()}",
    "period": "2024",
    "sections": [
      {
        "title": "Resumen Ejecutivo",
        "content": "La situación fiscal de la empresa presenta un tipo efectivo del 23.5%..."
      },
      {
        "title": "Optimizaciones Implementadas",
        "content": "Durante el ejercicio se han aplicado 5 estrategias de optimización..."
      },
      {
        "title": "Recomendaciones",
        "content": "Para el próximo ejercicio se recomienda..."
      }
    ],
    "metrics": {
      "taxPaid": 45000,
      "savingsAchieved": 8500,
      "complianceScore": 95
    }
  }
}`;

        userPrompt = context 
          ? `Genera informe fiscal tipo ${reportType} para: ${JSON.stringify(context)}`
          : `Genera informe fiscal tipo ${reportType} de ejemplo.`;
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
      console.error('[obelixia-tax-planning] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-tax-planning] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-tax-planning] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
