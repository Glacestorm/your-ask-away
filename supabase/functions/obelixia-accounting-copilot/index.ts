/**
 * ObelixIA Accounting Copilot - Edge Function
 * Fase 1: AI Chatbot inteligente para contabilidad
 * 
 * Acciones:
 * - chat: Conversación con el copilot
 * - analyze_accounts: Análisis de cuentas
 * - explain_transaction: Explicar asiento/transacción
 * - suggest_entries: Sugerir asientos pendientes
 * - detect_anomalies: Detectar anomalías contables
 * - get_quick_actions: Obtener acciones rápidas
 * - generate_suggestions: Generar sugerencias proactivas
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CopilotRequest {
  action: 'chat' | 'analyze_accounts' | 'explain_transaction' | 'suggest_entries' | 
          'detect_anomalies' | 'get_quick_actions' | 'generate_suggestions';
  conversationId?: string;
  message?: string;
  context?: {
    fiscalConfigId?: string;
    accountId?: string;
    entryId?: string;
    partnerId?: string;
    periodStart?: string;
    periodEnd?: string;
  };
  stream?: boolean;
}

// System prompts por tipo de acción
const SYSTEM_PROMPTS = {
  general: `Eres ObelixIA Accounting Copilot, un asistente experto en contabilidad española y andorrana.

CAPACIDADES:
- Análisis de balances y cuentas de resultados
- Generación y explicación de asientos contables
- Asesoramiento fiscal (IVA, IRPF, Impuesto Sociedades)
- Conciliación bancaria
- Detección de anomalías contables
- Optimización fiscal legal

JURISDICCIONES:
- España: PGC 2007, SII, modelos 303, 390, 111, 190, 200
- Andorra: PGC Andorrano, IGI (4.5%), IS (10%)

REGLAS:
1. Siempre responde en español
2. Sé preciso con números y fechas
3. Cita normativa cuando sea relevante
4. Sugiere asientos con formato Debe/Haber
5. Alerta sobre obligaciones fiscales próximas
6. Mantén confidencialidad absoluta

FORMATO DE RESPUESTA:
- Usa Markdown para estructurar
- Tablas para datos numéricos
- Listas para pasos o items
- Negrita para conceptos clave`,

  analyze: `Eres un analista contable experto. Analiza los datos proporcionados y genera insights accionables.

ANÁLISIS A REALIZAR:
1. Ratios financieros clave (liquidez, solvencia, rentabilidad)
2. Tendencias y comparativas
3. Puntos de atención o riesgo
4. Recomendaciones de mejora

FORMATO:
Usa JSON para datos estructurados cuando sea apropiado.
Incluye siempre métricas numéricas con su interpretación.`,

  entries: `Eres un experto en asientos contables según PGC español y andorrano.

REGLAS PARA ASIENTOS:
1. Siempre Debe = Haber
2. Usar cuentas del PGC correctamente
3. Incluir concepto descriptivo
4. Indicar IVA si aplica
5. Sugerir contrapartidas lógicas

FORMATO DE ASIENTO:
| Cuenta | Concepto | Debe | Haber |
|--------|----------|------|-------|
| XXXX   | Desc     | X.XX | 0.00  |
| XXXX   | Desc     | 0.00 | X.XX  |`,

  anomalies: `Eres un auditor interno especializado en detección de fraude y errores contables.

TIPOS DE ANOMALÍAS A DETECTAR:
1. Descuadres en asientos
2. Patrones inusuales de gastos
3. Transacciones fuera de horario
4. Importes redondos sospechosos
5. Proveedores/clientes duplicados
6. Falta de documentación
7. Desviaciones presupuestarias significativas

CLASIFICACIÓN DE RIESGO:
- CRÍTICO: Requiere acción inmediata
- ALTO: Investigar en 24-48h
- MEDIO: Revisar en próxima auditoría
- BAJO: Monitorizar`
};

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar API Key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener usuario
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const { action, conversationId, message, context, stream = false } = await req.json() as CopilotRequest;

    console.log(`[obelixia-accounting-copilot] Action: ${action}, User: ${userId}`);

    // ==========================================
    // ACTION: get_quick_actions
    // ==========================================
    if (action === 'get_quick_actions') {
      const { data: quickActions, error } = await supabase
        .from('obelixia_copilot_quick_actions')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        data: quickActions
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // ACTION: generate_suggestions
    // ==========================================
    if (action === 'generate_suggestions') {
      // Obtener contexto contable para sugerencias
      let accountingContext = '';
      
      if (context?.fiscalConfigId) {
        // Obtener datos de balance trial
        const { data: trialBalance } = await supabase
          .from('obelixia_trial_balance')
          .select('*')
          .eq('fiscal_config_id', context.fiscalConfigId)
          .limit(50);

        // Obtener movimientos bancarios pendientes
        const { data: pendingTransactions } = await supabase
          .from('obelixia_bank_transactions')
          .select('*')
          .eq('reconciled', false)
          .limit(20);

        // Obtener declaraciones pendientes
        const { data: pendingDeclarations } = await supabase
          .from('obelixia_tax_declarations')
          .select('*')
          .in('status', ['pending', 'draft'])
          .limit(10);

        accountingContext = `
BALANCE DE COMPROBACIÓN:
${JSON.stringify(trialBalance || [], null, 2)}

MOVIMIENTOS PENDIENTES CONCILIAR:
${JSON.stringify(pendingTransactions || [], null, 2)}

DECLARACIONES PENDIENTES:
${JSON.stringify(pendingDeclarations || [], null, 2)}
`;
      }

      const suggestionsPrompt = `Basándote en el contexto contable, genera sugerencias proactivas para mejorar la gestión.

${accountingContext}

Genera exactamente 5 sugerencias en formato JSON:
{
  "suggestions": [
    {
      "type": "entry|reconciliation|anomaly|optimization|compliance",
      "title": "Título corto",
      "description": "Descripción detallada",
      "priority": "low|medium|high|critical",
      "action": { "type": "string", "params": {} }
    }
  ]
}`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: SYSTEM_PROMPTS.analyze },
            { role: 'user', content: suggestionsPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('[obelixia-accounting-copilot] AI error:', errorText);
        throw new Error(`AI service error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';

      // Parsear sugerencias
      let suggestions = [];
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          suggestions = parsed.suggestions || [];
        }
      } catch (e) {
        console.error('[obelixia-accounting-copilot] Parse suggestions error:', e);
      }

      // Guardar sugerencias en BD
      if (userId && suggestions.length > 0) {
        const suggestionsToInsert = suggestions.map((s: any) => ({
          user_id: userId,
          fiscal_config_id: context?.fiscalConfigId,
          suggestion_type: s.type,
          title: s.title,
          description: s.description,
          priority: s.priority,
          suggested_action: s.action,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
        }));

        await supabase
          .from('obelixia_copilot_suggestions')
          .insert(suggestionsToInsert);
      }

      return new Response(JSON.stringify({
        success: true,
        data: { suggestions }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // ACTION: chat (y otras acciones de conversación)
    // ==========================================
    
    // Determinar system prompt según acción
    let systemPrompt = SYSTEM_PROMPTS.general;
    if (action === 'analyze_accounts') systemPrompt = SYSTEM_PROMPTS.analyze;
    if (action === 'suggest_entries' || action === 'explain_transaction') systemPrompt = SYSTEM_PROMPTS.entries;
    if (action === 'detect_anomalies') systemPrompt = SYSTEM_PROMPTS.anomalies;

    // Obtener o crear conversación
    let convId = conversationId;
    
    if (!convId && userId) {
      const { data: newConv, error: convError } = await supabase
        .from('obelixia_copilot_conversations')
        .insert({
          user_id: userId,
          title: message?.substring(0, 50) || 'Nueva conversación',
          context_type: action === 'chat' ? 'general' : action,
          context_id: context?.entryId || context?.accountId,
          fiscal_config_id: context?.fiscalConfigId
        })
        .select()
        .single();

      if (convError) throw convError;
      convId = newConv.id;
    }

    // Obtener historial de conversación
    let conversationHistory: Array<{ role: string; content: string }> = [];
    
    if (convId) {
      const { data: messages } = await supabase
        .from('obelixia_copilot_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (messages) {
        conversationHistory = messages.map(m => ({
          role: m.role as string,
          content: m.content
        }));
      }
    }

    // Construir contexto contable
    let accountingContextPrompt = '';
    
    if (context?.fiscalConfigId) {
      // Obtener configuración fiscal
      const { data: fiscalConfig } = await supabase
        .from('obelixia_fiscal_config')
        .select('*')
        .eq('id', context.fiscalConfigId)
        .single();

      if (fiscalConfig) {
        accountingContextPrompt += `\nCONFIGURACIÓN FISCAL:
- Jurisdicción: ${fiscalConfig.jurisdiction}
- Moneda: ${fiscalConfig.currency}
- Ejercicio: ${fiscalConfig.fiscal_year}
`;
      }

      // Si hay cuenta específica
      if (context.accountId) {
        const { data: account } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('*')
          .eq('id', context.accountId)
          .single();

        if (account) {
          accountingContextPrompt += `\nCUENTA SELECCIONADA:
- Código: ${account.code}
- Nombre: ${account.name}
- Tipo: ${account.account_type}
- Saldo: ${account.current_balance}
`;
        }
      }

      // Si hay asiento específico
      if (context.entryId) {
        const { data: entry } = await supabase
          .from('obelixia_journal_entries')
          .select('*, obelixia_journal_entry_lines(*)')
          .eq('id', context.entryId)
          .single();

        if (entry) {
          accountingContextPrompt += `\nASIENTO SELECCIONADO:
- Número: ${entry.entry_number}
- Fecha: ${entry.entry_date}
- Estado: ${entry.status}
- Concepto: ${entry.description}
- Líneas: ${JSON.stringify(entry.obelixia_journal_entry_lines)}
`;
        }
      }
    }

    // Preparar mensaje del usuario
    const userMessage = message || 'Analiza la situación contable actual';
    const enrichedUserMessage = accountingContextPrompt 
      ? `${accountingContextPrompt}\n\nPREGUNTA DEL USUARIO:\n${userMessage}`
      : userMessage;

    // Guardar mensaje del usuario
    if (convId && userId) {
      await supabase
        .from('obelixia_copilot_messages')
        .insert({
          conversation_id: convId,
          role: 'user',
          content: userMessage
        });
    }

    // Llamar a Lovable AI
    const startTime = Date.now();
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: enrichedUserMessage }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        stream: stream
      }),
    });

    // Manejar rate limiting
    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Demasiadas solicitudes. Por favor, espera un momento.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Payment required',
        message: 'Créditos de IA agotados.'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[obelixia-accounting-copilot] AI error:', errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    // Si es streaming, pasar directamente
    if (stream) {
      return new Response(aiResponse.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
      });
    }

    // Respuesta normal
    const aiData = await aiResponse.json();
    const assistantContent = aiData.choices?.[0]?.message?.content || 'No pude generar una respuesta.';
    const latencyMs = Date.now() - startTime;

    // Guardar respuesta del asistente
    if (convId && userId) {
      await supabase
        .from('obelixia_copilot_messages')
        .insert({
          conversation_id: convId,
          role: 'assistant',
          content: assistantContent,
          metadata: {
            model: 'google/gemini-2.5-flash',
            latency_ms: latencyMs,
            tokens: aiData.usage
          }
        });
    }

    console.log(`[obelixia-accounting-copilot] Success in ${latencyMs}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        conversationId: convId,
        message: assistantContent,
        metadata: {
          model: 'google/gemini-2.5-flash',
          latency_ms: latencyMs,
          tokens: aiData.usage
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[obelixia-accounting-copilot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
