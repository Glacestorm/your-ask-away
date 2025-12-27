import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  action: 'export_module' | 'import_module' | 'validate_import';
  moduleKey?: string;
  options?: {
    format: 'json' | 'yaml' | 'zip';
    includeAssets: boolean;
    includeConfigs: boolean;
    includeVersions: boolean;
    encryptSensitiveData: boolean;
  };
  moduleData?: Record<string, unknown>;
  overwrite?: boolean;
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

    const { action, moduleKey, options, moduleData, overwrite } = await req.json() as ExportRequest;

    console.log(`[module-export-import] Action: ${action}, Module: ${moduleKey || 'N/A'}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'export_module':
        systemPrompt = `Eres un sistema experto en exportación de módulos SaaS enterprise.
Tu tarea es preparar un paquete de exportación completo para un módulo.

CONTEXTO:
- Debes generar metadatos, configuraciones y estructura del módulo
- Incluir documentación y dependencias
- Mantener compatibilidad de versiones

FORMATO DE RESPUESTA (JSON estricto):
{
  "module": {
    "moduleKey": "string",
    "moduleName": "string",
    "version": "string",
    "description": "string",
    "category": "string",
    "dependencies": ["string"],
    "config": {
      "routes": [],
      "permissions": [],
      "settings": {}
    },
    "assets": [],
    "changelog": [],
    "metadata": {
      "exportedAt": "ISO date",
      "exportVersion": "1.0",
      "compatibility": ">=2.0.0"
    }
  },
  "fileSize": number,
  "checksum": "string"
}`;

        userPrompt = `Exporta el módulo "${moduleKey}" con estas opciones:
- Formato: ${options?.format || 'json'}
- Incluir assets: ${options?.includeAssets ? 'sí' : 'no'}
- Incluir configs: ${options?.includeConfigs ? 'sí' : 'no'}
- Incluir versiones: ${options?.includeVersions ? 'sí' : 'no'}
- Encriptar datos sensibles: ${options?.encryptSensitiveData ? 'sí' : 'no'}

Genera el paquete de exportación completo.`;
        break;

      case 'import_module':
        systemPrompt = `Eres un sistema experto en importación de módulos SaaS enterprise.
Tu tarea es procesar e importar un módulo desde un paquete de exportación.

CONTEXTO:
- Validar estructura y compatibilidad
- Resolver conflictos si existen
- Aplicar transformaciones necesarias

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": true,
  "moduleKey": "string",
  "moduleName": "string",
  "importedVersion": "string",
  "warnings": ["string"],
  "transformationsApplied": ["string"],
  "conflictsResolved": []
}`;

        userPrompt = `Importa el siguiente módulo:
${JSON.stringify(moduleData, null, 2)}

Sobrescribir si existe: ${overwrite ? 'sí' : 'no'}

Procesa la importación y reporta el resultado.`;
        break;

      case 'validate_import':
        systemPrompt = `Eres un sistema de validación de módulos SaaS.
Tu tarea es validar un paquete de importación antes de procesarlo.

FORMATO DE RESPUESTA (JSON estricto):
{
  "isValid": boolean,
  "moduleName": "string",
  "moduleKey": "string",
  "version": "string",
  "compatibility": {
    "isCompatible": boolean,
    "requiredVersion": "string",
    "currentVersion": "string"
  },
  "warnings": ["string"],
  "errors": ["string"],
  "suggestions": ["string"]
}`;

        userPrompt = `Valida el siguiente paquete de importación:
${JSON.stringify(moduleData, null, 2)}

Verifica estructura, dependencias y compatibilidad.`;
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
      console.error('[module-export-import] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[module-export-import] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-export-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
