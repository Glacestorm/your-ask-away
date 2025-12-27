/**
 * Module Copilot Edge Function
 * AI-powered assistant for Module Studio
 * 
 * Actions:
 * - analyze: Deep module analysis
 * - suggest_improvements: AI suggestions
 * - auto_fix: Automatic fixes
 * - generate_docs: Documentation generation
 * - predict_conflicts: Conflict prediction
 * - natural_language_edit: NL editing
 * - explain_module: Module explanation
 * - optimize_dependencies: Dependency optimization
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleCopilotRequest {
  action: 
    | 'analyze' 
    | 'suggest_improvements' 
    | 'auto_fix'
    | 'generate_docs'
    | 'predict_conflicts'
    | 'natural_language_edit'
    | 'explain_module'
    | 'optimize_dependencies'
    | 'create_from_template'
    | 'get_dependencies'
    | 'resolve_conflict'
    | 'update_dependency';
  params?: Record<string, unknown>;
  conversationHistory?: Array<{ role: string; content: string }>;
  templateId?: string;
  templateConfig?: Record<string, unknown>;
  customization?: Record<string, unknown>;
  moduleKey?: string;
  conflictId?: string;
  dependencyKey?: string;
  targetVersion?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, params, conversationHistory } = await req.json() as ModuleCopilotRequest;
    const moduleContext = params?.moduleContext as Record<string, unknown> | undefined;

    console.log(`[module-copilot] Processing action: ${action}`);
    console.log(`[module-copilot] Module context:`, moduleContext?.moduleKey);

    // Build system prompt based on action
    let systemPrompt = '';
    let userPrompt = '';

    const baseSystemPrompt = `Eres un experto asistente de IA para gestión de módulos enterprise.
Tu rol es analizar, sugerir mejoras, y ayudar a optimizar módulos de software.

CONTEXTO DEL MÓDULO:
${moduleContext ? JSON.stringify(moduleContext, null, 2) : 'No hay módulo seleccionado'}

REGLAS:
- Responde en español
- Sé conciso pero completo
- Proporciona ejemplos prácticos cuando sea útil
- Si detectas problemas, sugiere soluciones concretas
- Prioriza la compatibilidad hacia atrás
- Considera las dependencias al hacer sugerencias`;

    switch (action) {
      case 'analyze':
        systemPrompt = `${baseSystemPrompt}

TAREA: Análisis profundo del módulo
Debes evaluar:
1. Arquitectura y estructura
2. Dependencias y su salud
3. Documentación existente
4. Aspectos de seguridad
5. Rendimiento potencial
6. Mantenibilidad

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Resumen narrativo del análisis",
  "analysis": {
    "overallScore": 0-100,
    "categories": {
      "architecture": 0-100,
      "dependencies": 0-100,
      "documentation": 0-100,
      "security": 0-100,
      "performance": 0-100,
      "maintainability": 0-100
    },
    "strengths": ["punto fuerte 1", "punto fuerte 2"],
    "weaknesses": ["debilidad 1", "debilidad 2"],
    "recommendations": ["recomendación 1", "recomendación 2"],
    "conflictRisks": [
      {
        "targetModule": "module_key",
        "probability": 0-100,
        "description": "descripción del riesgo",
        "preventionSteps": ["paso 1", "paso 2"]
      }
    ]
  }
}`;
        userPrompt = `Analiza en profundidad el módulo "${moduleContext?.moduleName || 'seleccionado'}".
Evalúa todos los aspectos y proporciona puntuaciones detalladas.
Incluye fortalezas, debilidades y recomendaciones específicas.`;
        break;

      case 'suggest_improvements':
        systemPrompt = `${baseSystemPrompt}

TAREA: Sugerir mejoras para el módulo
Considera:
- Optimizaciones de código
- Mejoras de UX
- Seguridad
- Rendimiento
- Compatibilidad
- Documentación

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Resumen de las sugerencias",
  "suggestions": [
    {
      "id": "sug_unique_id",
      "type": "improvement|optimization|security|compatibility|performance",
      "title": "Título de la mejora",
      "description": "Descripción detallada",
      "impact": "low|medium|high",
      "effort": "low|medium|high",
      "priority": 1-10,
      "autoApplicable": true|false,
      "code": "código opcional para aplicar"
    }
  ]
}`;
        const focusAreas = params?.focusAreas as string[] | undefined;
        userPrompt = `Sugiere mejoras para el módulo "${moduleContext?.moduleName || 'seleccionado'}".
${focusAreas ? `Áreas de enfoque: ${focusAreas.join(', ')}` : 'Considera todas las áreas.'}
Máximo ${params?.maxSuggestions || 5} sugerencias ordenadas por prioridad.`;
        break;

      case 'auto_fix':
        systemPrompt = `${baseSystemPrompt}

TAREA: Aplicar correcciones automáticas
Solo sugiere correcciones que sean:
- Seguras (no rompan compatibilidad)
- Reversibles
- Bien documentadas

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Descripción de las correcciones aplicables",
  "fixes": [
    {
      "id": "fix_unique_id",
      "issue": "Descripción del problema",
      "solution": "Descripción de la solución",
      "field": "campo_afectado",
      "oldValue": "valor anterior",
      "newValue": "valor nuevo",
      "applied": false,
      "riskLevel": "safe|moderate|risky"
    }
  ],
  "affectedModules": ["module_key_1", "module_key_2"]
}`;
        userPrompt = params?.safeOnly 
          ? `Identifica y propone correcciones SEGURAS para el módulo "${moduleContext?.moduleName}".
Solo incluye cambios que no rompan compatibilidad.`
          : `Identifica problemas y propone correcciones para el módulo "${moduleContext?.moduleName}".
Incluye el nivel de riesgo de cada corrección.`;
        break;

      case 'generate_docs':
        const format = params?.format || 'readme';
        systemPrompt = `${baseSystemPrompt}

TAREA: Generar documentación ${format.toString().toUpperCase()}
Genera documentación completa y profesional.

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Documentación generada en formato markdown",
  "format": "${format}",
  "sections": ["lista de secciones incluidas"]
}`;
        userPrompt = `Genera documentación ${format} para el módulo "${moduleContext?.moduleName}".
${params?.includeExamples ? 'Incluye ejemplos de uso.' : ''}
La documentación debe ser clara, completa y profesional.`;
        break;

      case 'predict_conflicts':
        systemPrompt = `${baseSystemPrompt}

TAREA: Predecir conflictos potenciales
Analiza:
- Dependencias conflictivas
- Cambios que podrían romper otros módulos
- Incompatibilidades de versiones
- Conflictos de API

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Análisis de conflictos potenciales",
  "conflictRisks": [
    {
      "targetModule": "module_key",
      "probability": 0-100,
      "description": "descripción del conflicto potencial",
      "preventionSteps": ["paso preventivo 1", "paso preventivo 2"]
    }
  ],
  "affectedModules": ["module_key_1", "module_key_2"]
}`;
        userPrompt = `Predice conflictos potenciales que podrían surgir con el módulo "${moduleContext?.moduleName}".
Considera las dependencias: ${JSON.stringify(moduleContext?.dependencies || [])}
Y los módulos dependientes: ${JSON.stringify(moduleContext?.dependents || [])}`;
        break;

      case 'natural_language_edit':
        const instruction = params?.instruction as string;
        systemPrompt = `${baseSystemPrompt}

TAREA: Interpretar instrucción en lenguaje natural y proponer cambios
El usuario quiere modificar el módulo usando lenguaje natural.
Interpreta su intención y propón los cambios necesarios.

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Interpretación y descripción de los cambios propuestos",
  "interpretation": "cómo interpretas la instrucción",
  "proposedChanges": [
    {
      "field": "campo a modificar",
      "currentValue": "valor actual",
      "newValue": "valor propuesto",
      "reason": "razón del cambio"
    }
  ],
  "preview": true,
  "warnings": ["advertencia si aplica"]
}`;
        userPrompt = instruction || 'Describe los cambios que deseas realizar en el módulo.';
        break;

      case 'explain_module':
        systemPrompt = `${baseSystemPrompt}

TAREA: Explicar el módulo de forma clara y comprensible
Incluye:
- Propósito principal
- Funcionalidades clave
- Cómo se integra con otros módulos
- Casos de uso típicos
- Arquitectura básica

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Explicación completa del módulo en formato narrativo",
  "keyPoints": ["punto clave 1", "punto clave 2"],
  "useCases": ["caso de uso 1", "caso de uso 2"],
  "integrations": ["integración 1", "integración 2"]
}`;
        userPrompt = `Explica de forma clara y comprensible el módulo "${moduleContext?.moduleName}".
Audiencia: ${params?.audience === 'technical' ? 'desarrolladores técnicos' : 'usuarios de negocio'}
${params?.includeArchitecture ? 'Incluye detalles de arquitectura.' : ''}`;
        break;

      case 'optimize_dependencies':
        systemPrompt = `${baseSystemPrompt}

TAREA: Optimizar dependencias del módulo
Analiza:
- Dependencias no utilizadas
- Dependencias que podrían actualizarse
- Alternativas más ligeras
- Conflictos de versiones

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Análisis y recomendaciones de optimización de dependencias",
  "currentDependencies": ["dep1", "dep2"],
  "recommendations": [
    {
      "type": "remove|update|replace|add",
      "dependency": "nombre_dependencia",
      "reason": "razón de la recomendación",
      "alternative": "alternativa si aplica"
    }
  ],
  "estimatedImpact": {
    "performanceGain": "bajo|medio|alto",
    "sizeReduction": "bajo|medio|alto",
    "riskLevel": "bajo|medio|alto"
  }
}`;
        userPrompt = `Optimiza las dependencias del módulo "${moduleContext?.moduleName}".
Dependencias actuales: ${JSON.stringify(moduleContext?.dependencies || [])}
${params?.removeUnused ? 'Identifica y sugiere eliminar dependencias no utilizadas.' : ''}
${params?.suggestAlternatives ? 'Sugiere alternativas más eficientes si existen.' : ''}`;
        break;

      case 'create_from_template':
        systemPrompt = `${baseSystemPrompt}

TAREA: Crear un nuevo módulo desde un template
El usuario quiere crear un módulo basado en una plantilla predefinida.

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Descripción del módulo creado",
  "module": {
    "key": "string",
    "name": "string",
    "description": "string",
    "category": "string",
    "version": "1.0.0",
    "config": {},
    "dependencies": [],
    "createdAt": "ISO date"
  },
  "appliedCustomizations": ["customización 1", "customización 2"]
}`;
        const templateId = (req as any).templateId || params?.templateId;
        const customization = (req as any).customization || params?.customization;
        userPrompt = `Crea un nuevo módulo basado en el template "${templateId}".
Personalización solicitada: ${JSON.stringify(customization || {})}
Genera la configuración completa del nuevo módulo.`;
        break;

      case 'get_dependencies':
        systemPrompt = `${baseSystemPrompt}

TAREA: Obtener árbol de dependencias del módulo
Analiza todas las dependencias directas e indirectas.

FORMATO DE RESPUESTA (JSON estricto):
{
  "dependencies": [
    {
      "id": "string",
      "moduleKey": "string",
      "moduleName": "string",
      "version": "string",
      "requiredVersion": "string",
      "status": "satisfied|outdated|missing|conflict",
      "isRequired": true,
      "isDev": false,
      "size": 245,
      "lastUpdated": "ISO date"
    }
  ],
  "conflicts": [
    {
      "id": "string",
      "type": "version|circular|missing|incompatible",
      "severity": "error|warning|info",
      "moduleA": "string",
      "moduleB": "string",
      "description": "string",
      "resolution": "string",
      "autoResolvable": true
    }
  ],
  "updates": [
    {
      "moduleKey": "string",
      "currentVersion": "string",
      "latestVersion": "string",
      "updateType": "patch|minor|major",
      "breakingChanges": false,
      "changelog": ["cambio 1"],
      "releaseDate": "ISO date"
    }
  ],
  "tree": {
    "root": "string",
    "nodes": [],
    "depth": 2,
    "totalDependencies": 4
  }
}`;
        const depModuleKey = (req as any).moduleKey || params?.moduleKey;
        userPrompt = `Obtén el árbol completo de dependencias para el módulo "${depModuleKey || moduleContext?.moduleKey}".
Incluye conflictos, actualizaciones disponibles y estructura del árbol.`;
        break;

      case 'resolve_conflict':
        systemPrompt = `${baseSystemPrompt}

TAREA: Resolver un conflicto de dependencias
Analiza el conflicto y propón/aplica una solución.

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Descripción de la resolución",
  "resolved": true,
  "conflictId": "string",
  "resolution": {
    "type": "upgrade|downgrade|replace|ignore",
    "affectedModules": ["module1", "module2"],
    "changes": [
      {
        "module": "string",
        "from": "version",
        "to": "version"
      }
    ]
  },
  "warnings": ["advertencia si aplica"]
}`;
        const conflictId = (req as any).conflictId || params?.conflictId;
        userPrompt = `Resuelve el conflicto "${conflictId}" para el módulo "${moduleContext?.moduleKey}".
Proporciona una solución segura y reversible.`;
        break;

      case 'update_dependency':
        systemPrompt = `${baseSystemPrompt}

TAREA: Actualizar una dependencia específica
Verifica compatibilidad y actualiza la dependencia.

FORMATO DE RESPUESTA (JSON estricto):
{
  "content": "Descripción de la actualización",
  "updated": true,
  "dependency": {
    "moduleKey": "string",
    "previousVersion": "string",
    "newVersion": "string",
    "breakingChanges": [],
    "migrationSteps": []
  },
  "affectedModules": ["module1"],
  "rollbackAvailable": true
}`;
        const updDepKey = (req as any).dependencyKey || params?.dependencyKey;
        const targetVersion = (req as any).targetVersion || params?.targetVersion;
        userPrompt = `Actualiza la dependencia "${updDepKey}" a la versión "${targetVersion}" para el módulo "${moduleContext?.moduleKey}".
Verifica compatibilidad y proporciona pasos de migración si es necesario.`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    // Add current user prompt
    messages.push({ role: 'user', content: userPrompt });

    // Call AI API
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    // Handle rate limits and errors
    if (!response.ok) {
      if (response.status === 429) {
        console.error('[module-copilot] Rate limit exceeded');
        return new Response(JSON.stringify({
          success: false,
          error: 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.',
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        console.error('[module-copilot] Payment required');
        return new Response(JSON.stringify({
          success: false,
          error: 'Créditos de IA insuficientes.',
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[module-copilot] AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('[module-copilot] AI response received, parsing...');

    // Parse JSON from response
    let result: Record<string, unknown>;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, wrap the content
        result = { content };
      }
    } catch (parseError) {
      console.warn('[module-copilot] JSON parse error, using raw content:', parseError);
      result = { content, parseError: true };
    }

    console.log(`[module-copilot] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[module-copilot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
