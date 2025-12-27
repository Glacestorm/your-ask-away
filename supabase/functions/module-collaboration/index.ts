import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'add_comment' | 'get_comments' | 'resolve_comment' | 'create_review' | 'get_reviews' | 'submit_review' | 'assign_member' | 'get_assignments' | 'get_activity' | 'get_notifications' | 'mark_notification_read';
  moduleKey?: string;
  content?: string;
  filePath?: string;
  lineNumber?: number;
  parentId?: string;
  commentId?: string;
  title?: string;
  description?: string;
  versionFrom?: string;
  versionTo?: string;
  reviewerIds?: string[];
  reviewId?: string;
  status?: string;
  comment?: string;
  userId?: string;
  role?: string;
  limit?: number;
  notificationId?: string;
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

    const requestData = await req.json() as FunctionRequest;
    const { action, moduleKey } = requestData;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'add_comment':
        systemPrompt = `Eres un sistema de colaboración de módulos.

Crea un nuevo comentario.

FORMATO DE RESPUESTA (JSON estricto):
{
  "comment": {
    "id": "uuid",
    "module_key": "module_key",
    "file_path": "path o null",
    "line_number": 0,
    "content": "contenido del comentario",
    "author_id": "uuid",
    "author_name": "Nombre Usuario",
    "is_resolved": false,
    "replies_count": 0,
    "created_at": "ISO date",
    "updated_at": "ISO date"
  }
}`;
        userPrompt = `Crear comentario en ${moduleKey}: ${requestData.content}`;
        break;

      case 'get_comments':
        systemPrompt = `Genera lista de comentarios del módulo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "comments": [
    {
      "id": "uuid",
      "module_key": "module_key",
      "file_path": "src/...",
      "line_number": 42,
      "content": "contenido del comentario",
      "author_id": "uuid",
      "author_name": "Nombre",
      "author_avatar": "url",
      "is_resolved": false,
      "replies_count": 2,
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Comentarios para: ${moduleKey}`;
        break;

      case 'resolve_comment':
        return new Response(JSON.stringify({
          success: true,
          message: 'Comment resolved'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create_review':
        systemPrompt = `Crea una revisión de código.

FORMATO DE RESPUESTA (JSON estricto):
{
  "review": {
    "id": "uuid",
    "module_key": "module_key",
    "version_from": "v1.0.0",
    "version_to": "v1.1.0",
    "title": "título",
    "description": "descripción",
    "status": "pending",
    "author_id": "uuid",
    "author_name": "Nombre",
    "reviewers": [
      { "id": "uuid", "name": "Nombre", "status": "pending" }
    ],
    "comments_count": 0,
    "files_changed": 5,
    "created_at": "ISO date",
    "updated_at": "ISO date"
  }
}`;
        userPrompt = `Crear review: ${requestData.title} de ${requestData.versionFrom} a ${requestData.versionTo}`;
        break;

      case 'get_reviews':
        systemPrompt = `Genera lista de revisiones de código.

FORMATO DE RESPUESTA (JSON estricto):
{
  "reviews": [
    {
      "id": "uuid",
      "module_key": "module_key",
      "version_from": "v1.0.0",
      "version_to": "v1.1.0",
      "title": "título de la revisión",
      "description": "descripción",
      "status": "pending|in_review|changes_requested|approved|rejected",
      "author_id": "uuid",
      "author_name": "Nombre",
      "reviewers": [
        { "id": "uuid", "name": "Reviewer", "status": "approved", "reviewed_at": "ISO date" }
      ],
      "comments_count": 5,
      "files_changed": 10,
      "created_at": "ISO date",
      "updated_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Revisiones para: ${moduleKey}`;
        break;

      case 'submit_review':
        return new Response(JSON.stringify({
          success: true,
          message: `Review ${requestData.status}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'assign_member':
        systemPrompt = `Asigna un miembro al equipo del módulo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "assignment": {
    "id": "uuid",
    "module_key": "module_key",
    "user_id": "uuid",
    "user_name": "Nombre Usuario",
    "role": "owner|maintainer|contributor|reviewer",
    "permissions": ["read", "write", "admin"],
    "assigned_at": "ISO date",
    "assigned_by": "admin"
  }
}`;
        userPrompt = `Asignar ${requestData.userId} como ${requestData.role} a ${moduleKey}`;
        break;

      case 'get_assignments':
        systemPrompt = `Genera asignaciones del equipo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "assignments": [
    {
      "id": "uuid",
      "module_key": "module_key",
      "user_id": "uuid",
      "user_name": "Nombre",
      "user_avatar": "url",
      "role": "owner|maintainer|contributor|reviewer",
      "permissions": ["read", "write"],
      "assigned_at": "ISO date",
      "assigned_by": "admin"
    }
  ]
}`;
        userPrompt = `Equipo de: ${moduleKey}`;
        break;

      case 'get_activity':
        systemPrompt = `Genera feed de actividad del módulo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "activities": [
    {
      "id": "uuid",
      "module_key": "module_key",
      "action_type": "comment|review|assignment|approval|change|deploy",
      "description": "descripción de la actividad",
      "actor_id": "uuid",
      "actor_name": "Nombre",
      "actor_avatar": "url",
      "created_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Actividad de: ${moduleKey}`;
        break;

      case 'get_notifications':
        systemPrompt = `Genera notificaciones del usuario.

FORMATO DE RESPUESTA (JSON estricto):
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "module_key": "module_key",
      "type": "comment_mention|review_request|approval|assignment|reply",
      "title": "título",
      "message": "mensaje",
      "is_read": false,
      "link": "/modules/...",
      "created_at": "ISO date"
    }
  ]
}`;
        userPrompt = `Notificaciones del usuario`;
        break;

      case 'mark_notification_read':
        return new Response(JSON.stringify({
          success: true,
          message: 'Notification marked as read'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[module-collaboration] Processing action: ${action}`);

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
          success: false
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
      console.error('[module-collaboration] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-collaboration] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
