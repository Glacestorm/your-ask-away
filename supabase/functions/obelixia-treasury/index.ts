/**
 * ObelixIA Treasury Edge Function - Fase 8
 * Intelligent Cash Flow Management & Treasury
 * Enterprise SaaS 2025-2026
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TreasuryRequest {
  action: 
    | 'forecast_cash_flow' 
    | 'get_liquidity_positions' 
    | 'optimize_payments' 
    | 'get_alerts'
    | 'analyze_working_capital'
    | 'resolve_alert'
    | 'simulate_scenario';
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

    const { action, context, params } = await req.json() as TreasuryRequest;

    console.log(`[obelixia-treasury] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'forecast_cash_flow':
        const horizonMonths = (params?.horizonMonths as number) || 3;
        systemPrompt = `Eres un experto en gestión de tesorería y flujo de caja para empresas.
        
GENERA una proyección de flujo de caja para los próximos ${horizonMonths} meses.

FORMATO DE RESPUESTA (JSON estricto):
{
  "forecasts": [
    {
      "id": "uuid",
      "period": "2025-01",
      "periodLabel": "Enero 2025",
      "expectedInflows": 150000,
      "expectedOutflows": 120000,
      "netCashFlow": 30000,
      "openingBalance": 50000,
      "closingBalance": 80000,
      "confidence": 85,
      "riskLevel": "low",
      "factors": ["Cobros estacionales", "Pagos a proveedores fijos"]
    }
  ],
  "summary": {
    "totalInflows": 450000,
    "totalOutflows": 360000,
    "netPosition": 90000,
    "lowestPoint": 45000,
    "lowestPointDate": "2025-02-15"
  },
  "insights": ["El flujo es positivo pero hay riesgo en febrero"]
}`;

        userPrompt = context 
          ? `Genera proyección de flujo de caja considerando: ${JSON.stringify(context)}`
          : `Genera proyección de flujo de caja para los próximos ${horizonMonths} meses con datos de ejemplo realistas.`;
        break;

      case 'get_liquidity_positions':
        systemPrompt = `Eres un analista de tesorería especializado en posiciones de liquidez.

ANALIZA y retorna las posiciones de liquidez actuales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "positions": [
    {
      "id": "uuid",
      "accountName": "Cuenta Principal BBVA",
      "accountType": "bank",
      "currentBalance": 125000,
      "availableBalance": 120000,
      "currency": "EUR",
      "lastUpdated": "2025-01-15T10:30:00Z",
      "trend": "up",
      "trendPercentage": 5.2
    }
  ],
  "totalLiquidity": 250000,
  "totalAvailable": 235000,
  "byCurrency": {
    "EUR": 200000,
    "USD": 50000
  }
}`;

        userPrompt = context 
          ? `Obtén posiciones de liquidez para: ${JSON.stringify(context)}`
          : 'Genera posiciones de liquidez de ejemplo para una empresa mediana.';
        break;

      case 'optimize_payments':
        systemPrompt = `Eres un experto en optimización de pagos y gestión de tesorería.

ANALIZA los pagos pendientes y recomienda optimizaciones para maximizar descuentos y gestionar el flujo de caja.

FORMATO DE RESPUESTA (JSON estricto):
{
  "optimizations": [
    {
      "id": "uuid",
      "vendorName": "Proveedor XYZ",
      "invoiceRef": "FAC-2025-001",
      "amount": 15000,
      "dueDate": "2025-02-15",
      "discountAvailable": 2,
      "discountDeadline": "2025-01-31",
      "recommendedPayDate": "2025-01-30",
      "savingsIfOptimized": 300,
      "priority": "high",
      "reasoning": "Descuento 2% por pronto pago disponible hasta fin de mes"
    }
  ],
  "totalPotentialSavings": 850,
  "recommendations": [
    "Priorizar pagos con descuento por pronto pago",
    "Agrupar pagos del mismo proveedor"
  ]
}`;

        userPrompt = context 
          ? `Optimiza pagos considerando: ${JSON.stringify(context)}`
          : 'Genera recomendaciones de optimización de pagos con ejemplos realistas.';
        break;

      case 'get_alerts':
        systemPrompt = `Eres un sistema de alertas inteligente para gestión de tesorería.

GENERA alertas relevantes sobre flujo de caja, liquidez y riesgos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "alerts": [
    {
      "id": "uuid",
      "alertType": "shortage",
      "severity": "warning",
      "title": "Posible déficit de caja en Febrero",
      "message": "Se proyecta un déficit de €15,000 para la segunda semana de febrero",
      "affectedPeriod": "2025-02-08 a 2025-02-15",
      "projectedImpact": -15000,
      "suggestedActions": [
        "Acelerar cobros pendientes",
        "Negociar extensión de pagos",
        "Considerar línea de crédito"
      ],
      "createdAt": "2025-01-15T08:00:00Z",
      "isResolved": false
    }
  ],
  "summary": {
    "critical": 0,
    "warnings": 2,
    "info": 3
  }
}`;

        userPrompt = context 
          ? `Genera alertas de tesorería para: ${JSON.stringify(context)}`
          : 'Genera alertas de tesorería de ejemplo para una empresa.';
        break;

      case 'analyze_working_capital':
        systemPrompt = `Eres un analista financiero especializado en capital de trabajo.

ANALIZA los ratios y métricas de capital de trabajo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "metrics": {
    "currentRatio": 1.8,
    "quickRatio": 1.2,
    "cashRatio": 0.4,
    "daysReceivable": 45,
    "daysPayable": 30,
    "daysInventory": 60,
    "cashConversionCycle": 75,
    "workingCapital": 150000,
    "workingCapitalTrend": "improving",
    "recommendations": [
      "Reducir días de cobro mejorando gestión de crédito",
      "Negociar mejores términos con proveedores",
      "Optimizar rotación de inventario"
    ]
  },
  "benchmarks": {
    "industry": "Retail",
    "currentRatioAvg": 1.5,
    "quickRatioAvg": 1.0
  },
  "trend": {
    "direction": "positive",
    "change": 8.5
  }
}`;

        userPrompt = context 
          ? `Analiza capital de trabajo para: ${JSON.stringify(context)}`
          : 'Genera análisis de capital de trabajo con métricas de ejemplo.';
        break;

      case 'resolve_alert':
        systemPrompt = `Eres un asistente de tesorería que gestiona alertas.

Confirma la resolución de la alerta y proporciona un resumen.

FORMATO DE RESPUESTA (JSON estricto):
{
  "resolved": true,
  "alertId": "${params?.alertId}",
  "resolutionSummary": "Alerta resuelta correctamente",
  "timestamp": "2025-01-15T12:00:00Z"
}`;

        userPrompt = `Resuelve la alerta ${params?.alertId} con resolución: ${params?.resolution || 'Sin detalles adicionales'}`;
        break;

      case 'simulate_scenario':
        const scenarioType = params?.scenarioType || 'pessimistic';
        systemPrompt = `Eres un experto en análisis de escenarios financieros.

SIMULA un escenario ${scenarioType} para el flujo de caja.

FORMATO DE RESPUESTA (JSON estricto):
{
  "scenario": {
    "type": "${scenarioType}",
    "assumptions": [
      "Reducción de ventas del 20%",
      "Aumento de morosidad del 15%"
    ],
    "projectedForecasts": [
      {
        "period": "2025-01",
        "netCashFlow": 15000,
        "closingBalance": 65000
      }
    ],
    "worstCaseBalance": 25000,
    "worstCaseDate": "2025-03-15",
    "requiredBuffer": 40000,
    "recommendations": [
      "Mantener reserva de emergencia de €40,000",
      "Preparar línea de crédito de respaldo"
    ]
  },
  "comparison": {
    "vsBase": {
      "netCashFlowChange": -35,
      "closingBalanceChange": -28
    }
  }
}`;

        userPrompt = params?.parameters 
          ? `Simula escenario ${scenarioType} con parámetros: ${JSON.stringify(params.parameters)}`
          : `Simula escenario ${scenarioType} con supuestos estándar.`;
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
      console.error('[obelixia-treasury] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-treasury] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-treasury] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
