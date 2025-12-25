import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccessControlRequest {
  action: 'get_overview' | 'create_policy' | 'update_policy' | 'revoke_session' | 'review_request' | 'assign_role';
  policy?: Record<string, unknown>;
  policyId?: string;
  updates?: Record<string, unknown>;
  sessionId?: string;
  reason?: string;
  requestId?: string;
  decision?: string;
  notes?: string;
  userId?: string;
  roleId?: string;
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

    const { action, policy, policyId, updates, sessionId, reason, requestId, decision, notes, userId, roleId } = await req.json() as AccessControlRequest;

    console.log(`[access-control] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_overview':
        systemPrompt = `Eres un sistema de control de acceso enterprise.
        
Genera visión general de políticas, sesiones, solicitudes y roles.

FORMATO DE RESPUESTA (JSON estricto):
{
  "policies": [
    {
      "id": "uuid",
      "policy_name": "nombre",
      "description": "descripción",
      "policy_type": "rbac|abac|pbac",
      "priority": número,
      "is_active": boolean,
      "conditions": {},
      "actions_allowed": ["acciones"],
      "resources": ["recursos"],
      "subjects": ["sujetos"],
      "effect": "allow|deny",
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ],
  "sessions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_email": "email",
      "session_start": "ISO timestamp",
      "last_activity": "ISO timestamp",
      "ip_address": "IP",
      "device_info": "info",
      "location": "ubicación",
      "is_active": boolean,
      "risk_score": 0-100,
      "mfa_verified": boolean,
      "permissions": ["permisos"]
    }
  ],
  "requests": [
    {
      "id": "uuid",
      "requester_id": "uuid",
      "requester_email": "email",
      "resource_type": "tipo",
      "resource_id": "uuid",
      "access_level": "nivel",
      "justification": "justificación",
      "status": "pending|approved|denied|expired",
      "requested_at": "ISO timestamp"
    }
  ],
  "roles": [
    {
      "id": "uuid",
      "role_name": "nombre",
      "description": "descripción",
      "permissions": ["permisos"],
      "is_system_role": boolean,
      "user_count": número,
      "created_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = 'Obtener visión general de control de acceso';
        break;

      case 'create_policy':
        systemPrompt = `Eres un gestor de políticas de acceso.
        
FORMATO DE RESPUESTA (JSON estricto):
{
  "policy": {
    "id": "uuid",
    "policy_name": "nombre",
    "description": "descripción",
    "policy_type": "tipo",
    "priority": número,
    "is_active": true,
    "conditions": {},
    "actions_allowed": [],
    "resources": [],
    "subjects": [],
    "effect": "allow|deny",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  }
}`;
        userPrompt = `Crear política: ${JSON.stringify(policy)}`;
        break;

      case 'update_policy':
        systemPrompt = `Eres un gestor de políticas de acceso.

FORMATO DE RESPUESTA (JSON estricto):
{
  "updated": true,
  "policy_id": "uuid",
  "updated_at": "ISO timestamp"
}`;
        userPrompt = `Actualizar política ${policyId}: ${JSON.stringify(updates)}`;
        break;

      case 'revoke_session':
        systemPrompt = `Eres un gestor de sesiones de seguridad.

FORMATO DE RESPUESTA (JSON estricto):
{
  "revoked": true,
  "session_id": "uuid",
  "revoked_at": "ISO timestamp",
  "reason": "razón",
  "user_notified": boolean
}`;
        userPrompt = `Revocar sesión ${sessionId}. Razón: ${reason || 'Revocación manual'}`;
        break;

      case 'review_request':
        systemPrompt = `Eres un revisor de solicitudes de acceso.

FORMATO DE RESPUESTA (JSON estricto):
{
  "reviewed": true,
  "request_id": "uuid",
  "decision": "${decision}",
  "reviewed_at": "ISO timestamp",
  "access_granted": boolean,
  "expires_at": "ISO timestamp o null"
}`;
        userPrompt = `Revisar solicitud ${requestId}. Decisión: ${decision}. Notas: ${notes || 'N/A'}`;
        break;

      case 'assign_role':
        systemPrompt = `Eres un gestor de roles.

FORMATO DE RESPUESTA (JSON estricto):
{
  "assigned": true,
  "user_id": "uuid",
  "role_id": "uuid",
  "assigned_at": "ISO timestamp",
  "effective_permissions": []
}`;
        userPrompt = `Asignar rol ${roleId} a usuario ${userId}`;
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

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[access-control] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[access-control] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
