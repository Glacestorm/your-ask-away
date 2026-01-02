import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceCommand {
  transcript: string;
  language: string;
  context?: Record<string, unknown>;
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

    const { transcript, language, context } = await req.json() as VoiceCommand;

    console.log("[erp-voice-orchestrator] Processing transcript:", transcript);
    console.log("[erp-voice-orchestrator] Language:", language);

    const systemPrompt = `Eres el orquestador de comandos de voz para un ERP contable avanzado.

IDIOMAS SOPORTADOS: Español (es), Catalán (ca), Inglés (en), Francés (fr)

COMANDOS DISPONIBLES:
1. CREAR ASIENTO: "crear asiento", "nuevo asiento", "registrar asiento"
2. CONSULTAR SALDO: "saldo de", "balance de", "cuánto tiene"
3. GENERAR INFORME: "generar informe", "crear reporte", "mostrar balance"
4. CONSULTAR IVA: "IVA del", "impuestos del"
5. BUSCAR CLIENTE: "buscar cliente", "encontrar cliente"
6. BUSCAR PROVEEDOR: "buscar proveedor"
7. VER FACTURAS: "ver facturas", "listar facturas"
8. CONSULTA NIIF: "norma NIIF", "NIC", "cumplimiento"
9. AYUDA: "ayuda", "qué puedo hacer", "comandos"

Tu tarea es:
1. Detectar la intención del usuario
2. Extraer entidades (importes, fechas, nombres, cuentas)
3. Determinar si se requiere confirmación
4. Generar la respuesta hablada apropiada

FORMATO DE RESPUESTA (JSON estricto):
{
  "intent": "create_journal" | "query_balance" | "generate_report" | "query_vat" | "search_customer" | "search_supplier" | "list_invoices" | "niif_query" | "help" | "unknown",
  "confidence": 0-100,
  "entities": {
    "amount": number | null,
    "currency": "EUR" | "USD" | null,
    "date": "YYYY-MM-DD" | null,
    "period": "Q1" | "Q2" | "Q3" | "Q4" | "month" | "year" | null,
    "account": string | null,
    "customer": string | null,
    "supplier": string | null,
    "reportType": "balance_sheet" | "income_statement" | "cash_flow" | null,
    "niifStandard": string | null
  },
  "requiresConfirmation": boolean,
  "confirmationMessage": "Mensaje de confirmación en el idioma del usuario",
  "action": {
    "type": "edge_function" | "database_query" | "navigation" | "display",
    "target": "nombre de función o ruta",
    "params": {}
  },
  "spokenResponse": "Respuesta hablada en el idioma del usuario",
  "followUpQuestion": "Pregunta de seguimiento si es necesario" | null
}`;

    const userPrompt = `Procesa el siguiente comando de voz:
Transcripción: "${transcript}"
Idioma detectado: ${language}
Contexto actual: ${JSON.stringify(context || {})}`;

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
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          spokenResponse: language === 'es' ? 'Lo siento, estamos procesando muchas solicitudes. Inténtalo de nuevo en unos segundos.' :
                         language === 'ca' ? 'Ho sento, estem processant moltes sol·licituds. Intenta-ho de nou en uns segons.' :
                         language === 'fr' ? 'Désolé, nous traitons de nombreuses demandes. Réessayez dans quelques secondes.' :
                         'Sorry, we are processing many requests. Please try again in a few seconds.'
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
      console.error('[erp-voice-orchestrator] JSON parse error:', parseError);
      result = {
        intent: 'unknown',
        confidence: 0,
        entities: {},
        requiresConfirmation: false,
        spokenResponse: language === 'es' ? 'No he entendido tu solicitud. ¿Puedes repetirlo?' :
                       language === 'ca' ? 'No he entès la teva sol·licitud. Pots repetir-ho?' :
                       language === 'fr' ? 'Je n\'ai pas compris votre demande. Pouvez-vous répéter?' :
                       'I didn\'t understand your request. Can you repeat that?'
      };
    }

    console.log(`[erp-voice-orchestrator] Intent: ${result.intent}, Confidence: ${result.confidence}`);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      originalTranscript: transcript,
      language,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-voice-orchestrator] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      intent: 'error',
      spokenResponse: 'Ha ocurrido un error procesando tu solicitud.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
