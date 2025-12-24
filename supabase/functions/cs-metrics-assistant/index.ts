import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Complete CS Metrics knowledge base
const CS_METRICS_KNOWLEDGE = `
# BASE DE CONOCIMIENTO DE MÉTRICAS CUSTOMER SUCCESS

## MÉTRICAS DE PERCEPCIÓN

### NPS (Net Promoter Score)
- **Fórmula**: %Promotores (9-10) - %Detractores (0-6)
- **Rango**: -100 a +100
- **Benchmarks SaaS**: <0 (malo), 0-30 (bueno), 30-70 (excelente), >70 (world-class)
- **Interpretación**: 
  - >50: Excelente lealtad, motor de crecimiento orgánico
  - 30-50: Buena base de promotores, espacio para mejorar
  - 0-30: Aceptable pero hay trabajo que hacer
  - <0: Crítico, más detractores que promotores
- **Acciones**: Seguimiento de detractores, programa de referidos con promotores

### CSAT (Customer Satisfaction Score)
- **Fórmula**: (Respuestas 4-5 / Total) × 100
- **Rango**: 0-100%
- **Benchmarks SaaS**: <60% (malo), 60-75% (aceptable), 75-85% (bueno), >85% (excelente)
- **Uso**: Medir satisfacción post-interacción o con producto

### CES (Customer Effort Score)
- **Fórmula**: Suma de puntuaciones / Número de respuestas
- **Escala**: 1-7 (menor es mejor)
- **Benchmarks**: >5 (difícil), 3-5 (normal), <3 (fácil)
- **Correlación**: Bajo CES correlaciona con alta retención

## MÉTRICAS DE RETENCIÓN

### Churn Rate
- **Fórmula**: (Clientes perdidos / Clientes inicio) × 100
- **Benchmarks mensuales SaaS**: <3% (excelente), 3-5% (bueno), 5-7% (aceptable), >7% (crítico)
- **Impacto**: 1% menos de churn = +12% ingresos anuales (típicamente)

### Retention Rate
- **Fórmula**: ((Clientes fin - Nuevos) / Clientes inicio) × 100
- **Relación con Churn**: Retention = 100% - Churn

### NRR (Net Revenue Retention)
- **Fórmula**: (Ingresos fin clientes existentes / Ingresos inicio) × 100
- **Incluye**: Expansiones, downgrades, churn
- **Benchmarks SaaS**: <100% (contracción), 100-110% (saludable), 110-130% (excelente), >130% (best-in-class)
- **Importancia**: Principal indicador de crecimiento sostenible

### GRR (Gross Revenue Retention)
- **Fórmula**: (MRR inicio - Downgrades - Churn) / MRR inicio × 100
- **NO incluye**: Expansiones (diferencia con NRR)
- **Benchmarks**: <80% (preocupante), 80-90% (aceptable), >90% (excelente)

## MÉTRICAS DE VALOR

### CLV (Customer Lifetime Value)
- **Fórmula**: (Ingreso medio × Duración) - CAC
- **Ratio CLV:CAC recomendado**: ≥3:1
- **Importancia**: Determina cuánto puedes invertir en adquisición

### CAC (Customer Acquisition Cost)
- **Fórmula**: (Marketing + Ventas) / Nuevos clientes
- **Payback Period**: CAC / (Ingreso mensual × Margen)
- **Benchmark**: Payback <12 meses es saludable

### ARR (Annual Recurring Revenue)
- **Fórmula**: MRR × 12
- **Uso**: Métrica principal de crecimiento para SaaS

### ROI
- **Fórmula**: (Beneficio - Inversión) / Inversión × 100

## MÉTRICAS AVANZADAS 2025

### Quick Ratio
- **Fórmula**: (New MRR + Expansion) / (Churn + Contraction)
- **Benchmarks**: <1 (contracción), 1-2 (crecimiento lento), 2-4 (saludable), >4 (excelente)

### Time-to-Value
- **Definición**: Tiempo hasta que cliente obtiene primer valor
- **Benchmark**: <14 días para SaaS B2B
- **Impacto**: TTV corto = mayor activación y retención

### Feature Adoption Rate
- **Fórmula**: (Usuarios usando feature / Usuarios activos) × 100
- **Objetivo**: >60% para features core

### Expansion Rate
- **Fórmula**: (Ingresos expansión / Ingresos inicio) × 100
- **Benchmark**: >5% mensual es excelente

### Payback Period
- **Fórmula**: CAC / (Ingreso mensual × Margen bruto)
- **Benchmark**: <12 meses para venture-backed, <18 para bootstrapped

## CORRELACIONES IMPORTANTES

1. **NPS ↔ NRR**: Correlación positiva fuerte (r>0.7)
2. **CES ↔ Churn**: Correlación negativa (bajo esfuerzo = menor churn)
3. **Time-to-Value ↔ Activación**: TTV corto = mayor activación
4. **Feature Adoption ↔ Retention**: Mayor adopción = mayor retención
5. **Health Score ↔ Churn**: Health Score es predictor de churn

## HEALTH SCORE COMPUESTO

Pesos recomendados:
- NPS: 20%
- CSAT: 15%
- CES: 15%
- Retención: 20%
- NRR: 20%
- Engagement: 10%

Rangos:
- 70-100: Saludable
- 40-69: En Riesgo
- 0-39: Crítico
`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, currentMessage } = await req.json() as {
      messages: Message[];
      currentMessage: string;
    };

    console.log(`[cs-metrics-assistant] Processing message: ${currentMessage.substring(0, 50)}...`);

    const systemPrompt = `Eres un experto asistente de Customer Success especializado en métricas y KPIs.

Tu rol es ayudar a los usuarios a:
1. ENTENDER métricas CS: explicar qué son, cómo se calculan y para qué sirven
2. CALCULAR métricas: ayudar con cálculos y verificar resultados
3. INTERPRETAR valores: explicar si un valor es bueno, malo, o necesita atención
4. COMPARAR con benchmarks: contextualizar valores según la industria
5. RECOMENDAR acciones: sugerir mejoras basadas en los valores actuales
6. CORRELACIONAR métricas: explicar cómo se relacionan entre sí

BASE DE CONOCIMIENTO:
${CS_METRICS_KNOWLEDGE}

INSTRUCCIONES:
- Responde siempre en español
- Sé conciso pero completo
- Usa ejemplos numéricos cuando sea útil
- Si te dan valores, proporciona interpretación y recomendaciones
- Menciona correlaciones relevantes entre métricas
- Si no tienes suficiente información, pregunta
- Usa formato markdown para estructurar respuestas largas
- Incluye emojis relevantes para hacer la respuesta más visual

FORMATO DE RESPUESTA:
Para explicaciones: breve definición, fórmula, ejemplo, benchmarks
Para cálculos: mostrar el cálculo paso a paso
Para interpretaciones: calificación, comparación con benchmark, acciones
Para comparaciones: tabla o lista comparativa`;

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
          ...messages.slice(-10) // Keep last 10 messages for context
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error(`[cs-metrics-assistant] AI API error: ${status}`);
      
      if (status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: 'Demasiadas solicitudes. Por favor, espera un momento.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log(`[cs-metrics-assistant] Response generated successfully`);

    // Extract mentioned metrics (simple pattern matching)
    const metricPatterns = [
      'NPS', 'CSAT', 'CES', 'Churn', 'NRR', 'GRR', 'CLV', 'CAC', 'ARR', 'ROI',
      'Quick Ratio', 'Time-to-Value', 'TTV', 'Feature Adoption', 'Expansion Rate',
      'Health Score', 'Payback Period', 'Retention'
    ];
    
    const metricsMentioned = metricPatterns.filter(metric => 
      content.toLowerCase().includes(metric.toLowerCase())
    );

    return new Response(JSON.stringify({
      success: true,
      response: content,
      metadata: {
        metricsMentioned,
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[cs-metrics-assistant] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      response: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
