import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_tasks' | 'approve' | 'reject' | 'delegate' | 'request_signature';
  context?: Record<string, unknown>;
  taskId?: string;
  comments?: string;
  reason?: string;
  newAssigneeId?: string;
  documentId?: string;
  signerIds?: string[];
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

    const { action, context, taskId, comments, reason, newAssigneeId, documentId, signerIds } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_tasks':
        systemPrompt = `Eres un gestor de flujos de trabajo y aprobaciones contables.

FORMATO DE RESPUESTA (JSON estricto):
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "type": "approval|review|signature|action",
      "status": "pending|in_progress|approved|rejected|completed",
      "priority": "low|medium|high|urgent",
      "assignedToName": "string",
      "dueDate": "ISO date",
      "createdAt": "ISO date",
      "relatedEntity": {
        "type": "journal_entry|invoice|payment|report",
        "id": "string",
        "reference": "string"
      }
    }
  ],
  "templates": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "triggerType": "manual|automatic",
      "isActive": true
    }
  ],
  "stats": {
    "pendingCount": number,
    "approvedToday": number,
    "avgApprovalTime": number
  }
}`;
        userPrompt = `Genera lista de tareas pendientes para: ${JSON.stringify(context || {})}`;
        break;

      case 'approve':
        systemPrompt = `Eres un sistema de aprobaciones.

FORMATO DE RESPUESTA (JSON estricto):
{
  "approved": true,
  "approvedAt": "ISO date",
  "nextStep": "string",
  "notifications": ["string"]
}`;
        userPrompt = `Aprobar tarea ${taskId}. Comentarios: ${comments || 'ninguno'}`;
        break;

      case 'reject':
        systemPrompt = `Eres un sistema de rechazos con feedback.

FORMATO DE RESPUESTA (JSON estricto):
{
  "rejected": true,
  "rejectedAt": "ISO date",
  "returnedTo": "string",
  "requiredActions": ["string"]
}`;
        userPrompt = `Rechazar tarea ${taskId}. Razón: ${reason}`;
        break;

      case 'delegate':
        systemPrompt = `Eres un sistema de delegación de tareas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "delegated": true,
  "delegatedTo": "string",
  "delegatedAt": "ISO date",
  "notificationSent": true
}`;
        userPrompt = `Delegar tarea ${taskId} a usuario ${newAssigneeId}`;
        break;

      case 'request_signature':
        systemPrompt = `Eres un sistema de firmas digitales.

FORMATO DE RESPUESTA (JSON estricto):
{
  "signatureRequestId": "string",
  "status": "sent",
  "signers": [
    {
      "id": "string",
      "email": "string",
      "status": "pending"
    }
  ],
  "expiresAt": "ISO date"
}`;
        userPrompt = `Solicitar firma para documento ${documentId} a: ${JSON.stringify(signerIds || [])}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-workflow] Processing action: ${action}`);

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
        max_tokens: 2000,
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
      console.error('[obelixia-workflow] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-workflow] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-workflow] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
