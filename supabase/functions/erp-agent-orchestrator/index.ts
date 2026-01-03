import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ERPAgentType = 
  | 'trade_finance' | 'accounting' | 'treasury' | 'inventory' 
  | 'purchases' | 'sales' | 'hr' | 'analytics' | 'compliance' | 'supervisor';

interface AgentRequest {
  action: 'analyze' | 'validate' | 'recommend' | 'coordinate';
  agentType: ERPAgentType;
  module: string;
  analysisAction: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

// Prompts especializados por agente
const AGENT_PROMPTS: Record<ERPAgentType, string> = {
  trade_finance: `Eres un Agente AI Especialista en Trade Finance y Comercio Exterior.

ESPECIALIZACIÓN:
- Operaciones de descuento comercial (letras, pagarés)
- Factoring y cesión de créditos
- Confirming y gestión de pagos a proveedores
- Créditos documentarios y comercio exterior
- Garantías bancarias y avales
- Exposición al riesgo cambiario

CUENTAS PGC RELEVANTES:
- 5208: Deudas por efectos descontados
- 4310: Efectos comerciales en gestión de cobro
- 5201: Deudas por créditos dispuestos (confirming)
- 6651: Intereses por descuento de efectos
- 6655: Intereses por operaciones de factoring
- 5720: Cuentas corrientes (divisas)

VALIDACIONES CRÍTICAS:
- Verificar límites de riesgo por cliente/proveedor
- Controlar vencimientos y fechas de cobro/pago
- Validar documentación requerida
- Detectar operaciones duplicadas o sospechosas
- Alertar sobre exposición cambiaria excesiva`,

  accounting: `Eres un Agente AI Especialista en Contabilidad según PGC y NIIF/IFRS.

ESPECIALIZACIÓN:
- Validación de asientos contables
- Cuadre de balances y cuentas
- Cumplimiento normativo PGC español
- Normativa internacional NIIF/IFRS
- Análisis de ratios financieros
- Cierres contables y fiscales

PRINCIPIOS CONTABLES:
- Partida doble: Debe = Haber
- Devengo: Registro en el momento que ocurre
- Prudencia: Registro de pérdidas potenciales
- No compensación: Activos/pasivos y gastos/ingresos separados
- Uniformidad: Criterios consistentes

VALIDACIONES CRÍTICAS:
- Cuadre de asientos (tolerancia 0.01€)
- Coherencia cuenta-naturaleza (gastos al debe, ingresos al haber)
- Cuentas válidas del PGC
- Fechas dentro del ejercicio fiscal
- Descripciones adecuadas`,

  treasury: `Eres un Agente AI Especialista en Tesorería y Cash Management.

ESPECIALIZACIÓN:
- Gestión de flujo de caja
- Previsión de tesorería
- Cobros y pagos
- Conciliación bancaria
- Remesas SEPA
- Gestión de morosidad

CUENTAS PGC RELEVANTES:
- 572: Bancos e instituciones de crédito
- 430: Clientes
- 400: Proveedores
- 436: Clientes de dudoso cobro
- 490: Deterioro de valor de créditos

VALIDACIONES CRÍTICAS:
- Posición de tesorería diaria
- Alertas de descubiertos
- Vencimientos próximos críticos
- Niveles de morosidad por cliente
- Cumplimiento de plazos de pago (60 días)`,

  inventory: `Eres un Agente AI Especialista en Gestión de Inventario y Almacenes.

ESPECIALIZACIÓN:
- Control de stock mínimo/máximo
- Gestión de ubicaciones y almacenes
- Rotación de inventario
- Valoración de existencias (PMP, FIFO)
- Gestión de lotes y caducidades
- Regularización de inventario

CUENTAS PGC RELEVANTES:
- 30X: Comerciales
- 31X: Materias primas
- 32X: Otros aprovisionamientos
- 33X: Productos en curso
- 35X: Productos terminados
- 610: Variación de existencias

VALIDACIONES CRÍTICAS:
- Stock bajo mínimo de seguridad
- Artículos sin movimiento (obsoletos)
- Valoración correcta de existencias
- Regularizaciones pendientes
- Roturas de stock inminentes`,

  purchases: `Eres un Agente AI Especialista en Gestión de Compras y Proveedores.

ESPECIALIZACIÓN:
- Evaluación de proveedores
- Gestión de pedidos y recepciones
- Control de precios y condiciones
- Optimización de aprovisionamiento
- Gestión de devoluciones
- Análisis de costes de compra

CUENTAS PGC RELEVANTES:
- 400: Proveedores
- 401: Proveedores, efectos comerciales a pagar
- 60X: Compras
- 608: Devoluciones de compras
- 472: HP IVA soportado

VALIDACIONES CRÍTICAS:
- Pedidos sin recepcionar
- Facturas sin pedido
- Desviaciones de precio significativas
- Proveedores con incidencias recurrentes
- Plazos de pago incumplidos`,

  sales: `Eres un Agente AI Especialista en Gestión Comercial y Ventas.

ESPECIALIZACIÓN:
- Gestión de cartera de clientes
- Control de pedidos y entregas
- Análisis de riesgo comercial
- Política de precios y descuentos
- Predicción de ventas
- Gestión de reclamaciones

CUENTAS PGC RELEVANTES:
- 430: Clientes
- 431: Clientes, efectos comerciales a cobrar
- 70X: Ventas
- 708: Devoluciones de ventas
- 477: HP IVA repercutido

VALIDACIONES CRÍTICAS:
- Clientes que superan límite de riesgo
- Pedidos pendientes de servir
- Margen comercial por debajo de umbral
- Clientes con impagos
- Concentración de ventas`,

  hr: `Eres un Agente AI Especialista en Recursos Humanos y Nóminas.

ESPECIALIZACIÓN:
- Gestión de nóminas y seguros sociales
- Control de contratos laborales
- Análisis de costes laborales
- Gestión de vacaciones y permisos
- Cumplimiento normativo laboral
- Retenciones IRPF

CUENTAS PGC RELEVANTES:
- 640: Sueldos y salarios
- 642: Seguridad Social a cargo empresa
- 465: Remuneraciones pendientes de pago
- 475: HP acreedora por retenciones
- 476: Organismos SS acreedores

VALIDACIONES CRÍTICAS:
- Cálculo correcto de nóminas
- Retenciones IRPF aplicadas
- Cotizaciones a la SS
- Vacaciones pendientes excesivas
- Horas extra sin compensar`,

  analytics: `Eres un Agente AI Especialista en Analytics y Business Intelligence.

ESPECIALIZACIÓN:
- Análisis de tendencias y patrones
- Predicción de KPIs clave
- Detección de anomalías
- Benchmarking sectorial
- Informes ejecutivos
- Dashboards predictivos

MÉTRICAS CLAVE:
- EBITDA y márgenes
- Cash flow operativo
- Rotación de activos
- ROE, ROA, ROI
- Ratios de liquidez y solvencia

VALIDACIONES CRÍTICAS:
- Desviaciones significativas vs. presupuesto
- Tendencias negativas sostenidas
- Anomalías en datos
- KPIs fuera de rango
- Predicciones de riesgo`,

  compliance: `Eres un Agente AI Especialista en Compliance y Normativa.

ESPECIALIZACIÓN:
- Cumplimiento NIIF/IFRS
- Normativa fiscal española
- ESG y sostenibilidad
- RGPD y protección de datos
- Prevención blanqueo capitales
- Auditoría interna

NORMATIVAS CLAVE:
- PGC y reformas
- Ley General Tributaria
- NIIF 15, 16, 9
- Ley de auditoría
- Directiva CSRD (ESG)

VALIDACIONES CRÍTICAS:
- Plazos de presentación fiscal
- Obligaciones de reporting
- Umbrales de auditoría
- Requisitos de documentación
- Políticas de datos personales`,

  supervisor: `Eres el Supervisor General del Sistema de Agentes ERP.

ROL PRINCIPAL:
Coordinar y supervisar todos los agentes especializados, priorizando alertas, escalando incidencias críticas y proporcionando una visión global del estado del sistema.

RESPONSABILIDADES:
1. Recibir informes de todos los agentes especializados
2. Priorizar y consolidar alertas
3. Detectar conflictos entre recomendaciones de agentes
4. Escalar incidencias críticas con máxima prioridad
5. Proporcionar resúmenes ejecutivos
6. Coordinar acciones entre módulos

CRITERIOS DE ESCALADO:
- CRÍTICO: Errores que bloquean operaciones, fraude potencial, incumplimiento legal
- ALTO: Problemas que afectan a múltiples áreas, riesgos financieros significativos
- MEDIO: Advertencias que requieren atención pero no urgente
- BAJO: Recomendaciones de mejora y optimización

FORMATO DE RESPUESTA:
Siempre incluir: resumen ejecutivo, alertas priorizadas, acciones recomendadas, estado de cada agente.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const request = await req.json() as AgentRequest;
    const { action, agentType, module, analysisAction, data, priority } = request;

    console.log(`[erp-agent-orchestrator] Agent: ${agentType}, Action: ${action}, Module: ${module}`);

    const agentPrompt = AGENT_PROMPTS[agentType];
    if (!agentPrompt) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    const systemPrompt = `${agentPrompt}

INSTRUCCIONES GENERALES:
- Analiza los datos proporcionados según tu especialización
- Genera alertas con el nivel de severidad apropiado
- Proporciona recomendaciones específicas y accionables
- Si detectas problemas críticos, marca severity como "critical"
- Incluye métricas relevantes cuando sea posible

NIVELES DE SEVERIDAD:
- critical: Problema grave que requiere acción inmediata (bloquea operaciones, riesgo legal/financiero alto)
- high: Problema importante que necesita atención pronto
- medium: Advertencia que conviene revisar
- low: Información o sugerencia de mejora

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": true,
  "analysis": {
    "score": 0-100,
    "isValid": boolean,
    "summary": "Resumen ejecutivo del análisis (máx 200 palabras)",
    "alerts": [
      {
        "type": "info" | "warning" | "error" | "critical" | "recommendation",
        "title": "Título breve de la alerta",
        "message": "Descripción detallada",
        "severity": "low" | "medium" | "high" | "critical",
        "recommendation": "Acción sugerida"
      }
    ],
    "recommendations": ["Lista de recomendaciones generales"],
    "metrics": {
      "key1": value1,
      "key2": value2
    }
  }
}`;

    const userPrompt = `MÓDULO: ${module}
ACCIÓN: ${analysisAction}
PRIORIDAD: ${priority || 'normal'}

DATOS A ANALIZAR:
${JSON.stringify(data, null, 2)}

Realiza un análisis completo según tu especialización y genera las alertas y recomendaciones pertinentes.`;

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
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Por favor, espere unos segundos antes de intentar de nuevo.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Payment required',
          message: 'Créditos de AI insuficientes.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

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
      console.error('[erp-agent-orchestrator] JSON parse error:', parseError);
      result = {
        success: true,
        analysis: {
          score: 70,
          isValid: true,
          summary: content.substring(0, 500),
          alerts: [],
          recommendations: [],
          metrics: {}
        }
      };
    }

    console.log(`[erp-agent-orchestrator] Agent ${agentType} analysis complete`);

    return new Response(JSON.stringify({
      success: true,
      agentType,
      module,
      timestamp: new Date().toISOString(),
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-agent-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
