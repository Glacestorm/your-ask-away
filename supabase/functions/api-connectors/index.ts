import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectorRequest {
  action: 'list_connectors' | 'create_connector' | 'test_connection' | 'check_health' | 'sync_connector';
  connector?: Record<string, unknown>;
  connectorId?: string;
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

    const { action, connector, connectorId } = await req.json() as ConnectorRequest;

    console.log(`[api-connectors] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'list_connectors':
        systemPrompt = `Eres un gestor de conectores API enterprise.
        
Genera una lista de conectores API configurados con información realista.

FORMATO DE RESPUESTA (JSON estricto):
{
  "connectors": [
    {
      "id": "uuid",
      "name": "nombre del conector",
      "type": "rest|graphql|soap|grpc",
      "endpoint": "https://api.example.com/v1",
      "auth_type": "api_key|oauth2|basic|bearer|none",
      "status": "active|inactive|error",
      "last_sync_at": "ISO timestamp",
      "sync_frequency": "hourly|daily|weekly",
      "created_at": "ISO timestamp",
      "updated_at": "ISO timestamp"
    }
  ]
}`;
        userPrompt = 'Genera 5-7 conectores API enterprise típicos (CRM, ERP, Payment, etc.)';
        break;

      case 'create_connector':
        systemPrompt = `Eres un gestor de conectores API.
        
Valida y crea un nuevo conector API basado en la configuración proporcionada.

FORMATO DE RESPUESTA (JSON estricto):
{
  "connector": {
    "id": "uuid generado",
    "name": "nombre",
    "type": "tipo",
    "endpoint": "url",
    "auth_type": "tipo auth",
    "status": "inactive",
    "created_at": "ISO timestamp",
    "updated_at": "ISO timestamp"
  },
  "validation": {
    "is_valid": true,
    "warnings": []
  }
}`;
        userPrompt = `Crea conector con config: ${JSON.stringify(connector)}`;
        break;

      case 'test_connection':
        systemPrompt = `Eres un sistema de pruebas de conectividad API.
        
Simula una prueba de conexión y reporta resultados.

FORMATO DE RESPUESTA (JSON estricto):
{
  "test_result": {
    "success": true|false,
    "latency_ms": número,
    "status_code": 200,
    "message": "Connection successful",
    "details": {
      "ssl_valid": true,
      "auth_valid": true,
      "endpoint_reachable": true
    }
  }
}`;
        userPrompt = `Prueba conexión para conector: ${connectorId}`;
        break;

      case 'check_health':
        systemPrompt = `Eres un monitor de salud de APIs.
        
Genera un reporte de salud de todos los conectores.

FORMATO DE RESPUESTA (JSON estricto):
{
  "health": [
    {
      "connector_id": "uuid",
      "status": "healthy|degraded|down",
      "latency_ms": número,
      "success_rate": 0-100,
      "last_check_at": "ISO timestamp",
      "error_count": número
    }
  ]
}`;
        userPrompt = 'Genera reporte de salud para 5-7 conectores';
        break;

      case 'sync_connector':
        systemPrompt = `Eres un orquestador de sincronización de datos.
        
Inicia una sincronización de datos para un conector.

FORMATO DE RESPUESTA (JSON estricto):
{
  "sync": {
    "id": "uuid",
    "connector_id": "uuid",
    "status": "running",
    "started_at": "ISO timestamp",
    "estimated_duration_ms": número,
    "records_to_sync": número
  }
}`;
        userPrompt = `Inicia sincronización para conector: ${connectorId}`;
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
        max_tokens: 2000,
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

    console.log(`[api-connectors] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[api-connectors] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
