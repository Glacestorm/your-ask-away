import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_currencies' | 'update_rates' | 'convert' | 'exposure_report' | 'manage_currency' | 'historical_rates';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

// Datos de divisas comunes
const COMMON_CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', decimals: 2 },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Yen japonés', symbol: '¥', decimals: 0 },
  { code: 'CHF', name: 'Franco suizo', symbol: 'CHF', decimals: 2 },
  { code: 'CAD', name: 'Dólar canadiense', symbol: 'C$', decimals: 2 },
  { code: 'AUD', name: 'Dólar australiano', symbol: 'A$', decimals: 2 },
  { code: 'CNY', name: 'Yuan chino', symbol: '¥', decimals: 2 },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', decimals: 2 },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', decimals: 2 },
];

serve(async (req) => {
  // === CORS ===
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === VALIDATE API KEY ===
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, context, params } = await req.json() as FunctionRequest;

    console.log(`[obelixia-multi-currency] Processing action: ${action}`);

    // === DYNAMIC PROMPTS ===
    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_currencies':
        systemPrompt = `Eres un experto en gestión de divisas y operaciones internacionales para sistemas contables enterprise.

CONTEXTO DEL ROL:
- Gestión de múltiples divisas para empresas multinacionales
- Tipos de cambio en tiempo real y históricos
- Cumplimiento con normativas contables internacionales (NIIF/IFRS)

FORMATO DE RESPUESTA (JSON estricto):
{
  "currencies": [
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€",
      "decimals": 2,
      "isBase": true,
      "isActive": true,
      "lastRate": 1.0,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ],
  "exchangeRates": [
    {
      "id": "uuid",
      "fromCurrency": "EUR",
      "toCurrency": "USD",
      "rate": 1.0856,
      "inverseRate": 0.9211,
      "source": "api",
      "validFrom": "2024-01-15T00:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}`;

        userPrompt = context 
          ? `Genera datos de divisas configuradas para la empresa. Contexto: ${JSON.stringify(context)}. Incluye EUR como base, USD, GBP y otras divisas comunes con tipos de cambio realistas actuales.`
          : 'Genera configuración de divisas por defecto con EUR como base y las principales divisas mundiales con tipos de cambio actuales realistas.';
        break;

      case 'update_rates':
        systemPrompt = `Eres un sistema de actualización de tipos de cambio en tiempo real.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rates": [
    {
      "id": "uuid-string",
      "fromCurrency": "EUR",
      "toCurrency": "USD",
      "rate": 1.0856,
      "inverseRate": 0.9211,
      "source": "api",
      "validFrom": "2024-01-15T00:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "updatedAt": "2024-01-15T10:30:00Z",
  "source": "European Central Bank",
  "nextUpdate": "2024-01-16T10:30:00Z"
}`;

        userPrompt = params?.manualRates 
          ? `Procesa estos tipos de cambio manuales: ${JSON.stringify(params.manualRates)}`
          : 'Genera tipos de cambio actualizados para EUR base contra USD, GBP, JPY, CHF, CAD, AUD, CNY, MXN, BRL usando valores de mercado realistas actuales.';
        break;

      case 'convert':
        const { amount, fromCurrency, toCurrency } = params || {};
        systemPrompt = `Eres una calculadora de conversión de divisas precisa.

FORMATO DE RESPUESTA (JSON estricto):
{
  "fromAmount": number,
  "fromCurrency": "string",
  "toAmount": number,
  "toCurrency": "string",
  "rate": number,
  "timestamp": "ISO-8601",
  "fees": 0
}`;

        userPrompt = `Convierte ${amount} ${fromCurrency} a ${toCurrency} usando tipos de cambio de mercado actuales realistas.`;
        break;

      case 'exposure_report':
        systemPrompt = `Eres un analista de riesgo cambiario y exposición de divisas para empresas multinacionales.

CONTEXTO DEL ROL:
- Análisis de exposición por divisa
- Cálculo de ganancias/pérdidas no realizadas
- Recomendaciones de cobertura (hedging)
- Cumplimiento NIIF/IFRS para diferencias de cambio

FORMATO DE RESPUESTA (JSON estricto):
{
  "baseCurrency": "EUR",
  "reportDate": "2024-01-15",
  "totalAssetsBase": 5000000,
  "totalLiabilitiesBase": 2000000,
  "exposures": [
    {
      "currency": "USD",
      "assets": 1500000,
      "liabilities": 500000,
      "netExposure": 1000000,
      "percentageOfTotal": 20,
      "unrealizedGainLoss": 25000,
      "riskLevel": "medium"
    }
  ],
  "recommendations": [
    "Considerar cobertura forward para exposición USD",
    "Diversificar activos en GBP para reducir riesgo"
  ],
  "riskScore": 65,
  "hedgingSuggestions": [
    {
      "action": "forward_contract",
      "currency": "USD",
      "amount": 500000,
      "reason": "Reducir exposición neta al 10%"
    }
  ]
}`;

        userPrompt = context 
          ? `Genera un reporte de exposición cambiaria detallado. Contexto empresa: ${JSON.stringify(context)}. Incluye análisis de riesgo y recomendaciones de cobertura.`
          : 'Genera un reporte de exposición cambiaria de ejemplo para una empresa mediana con operaciones en EUR, USD, GBP y otras divisas.';
        break;

      case 'manage_currency':
        const { operation, currencyCode } = params || {};
        systemPrompt = `Eres un gestor de configuración de divisas para sistemas contables.

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": true,
  "operation": "add|remove|set_base",
  "currency": {
    "code": "XXX",
    "name": "Currency Name",
    "symbol": "X",
    "decimals": 2,
    "isBase": false,
    "isActive": true
  },
  "message": "Operación completada correctamente",
  "warnings": []
}`;

        userPrompt = `Ejecuta operación "${operation}" para la divisa ${currencyCode}. Si es "add", proporciona datos completos de la divisa. Si es "set_base", confirma el cambio. Si es "remove", verifica que no haya transacciones pendientes.`;
        break;

      case 'historical_rates':
        const { from, to, period } = params || {};
        systemPrompt = `Eres un proveedor de datos históricos de tipos de cambio.

FORMATO DE RESPUESTA (JSON estricto):
{
  "pair": {
    "from": "EUR",
    "to": "USD"
  },
  "period": "30d",
  "dataPoints": [
    {
      "date": "2024-01-15",
      "rate": 1.0856,
      "high": 1.0890,
      "low": 1.0820,
      "change": 0.15
    }
  ],
  "statistics": {
    "average": 1.0845,
    "min": 1.0750,
    "max": 1.0920,
    "volatility": 0.8,
    "trend": "stable"
  }
}`;

        userPrompt = `Genera datos históricos de tipo de cambio ${from}/${to} para el período ${period}. Incluye estadísticas de volatilidad y tendencia.`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    // === AI CALL ===
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
        max_tokens: 3000,
      }),
    });

    // === ERROR HANDLING ===
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

    // === PARSE RESPONSE ===
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[obelixia-multi-currency] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-multi-currency] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-multi-currency] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
