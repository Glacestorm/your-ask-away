import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreenAnalysisRequest {
  action: 'analyze_screenshot' | 'detect_errors' | 'compare_screens' | 'extract_text' | 'get_error_patterns' | 'generate_guide';
  imageData?: string;
  beforeImage?: string;
  afterImage?: string;
  context?: Record<string, unknown>;
  expectedState?: Record<string, unknown>;
  problemDescription?: string;
  targetScreens?: string[];
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

    const body: ScreenAnalysisRequest = await req.json();
    const { action } = body;

    console.log(`[screen-understanding] Processing action: ${action}`);

    let result;

    switch (action) {
      case 'analyze_screenshot': {
        const { imageData, context } = body;
        
        // Use vision model to analyze screenshot
        const analysisPrompt = `Analiza esta captura de pantalla de una aplicación de soporte técnico.

CONTEXTO:
- Sesión: ${context?.sessionId || 'No especificada'}
- Aplicación: ${context?.applicationName || 'No especificada'}
- Tipo de pantalla: ${context?.screenType || 'No especificada'}

TAREAS:
1. Identifica todos los elementos UI visibles (botones, inputs, textos, imágenes)
2. Detecta cualquier error visual (mensajes de error, estados de error, inconsistencias)
3. Extrae el texto relevante de la pantalla
4. Proporciona sugerencias para resolver problemas visibles

FORMATO DE RESPUESTA (JSON):
{
  "errorDetected": boolean,
  "errorType": "string o null",
  "errorLocation": { "x": number, "y": number, "width": number, "height": number } o null,
  "uiElements": [
    {
      "id": "string",
      "type": "button|input|text|image|error|warning|dialog|menu",
      "label": "string",
      "bounds": { "x": number, "y": number, "width": number, "height": number },
      "state": "normal|disabled|error|loading|selected",
      "confidence": number
    }
  ],
  "textContent": ["string"],
  "suggestions": ["string"],
  "confidence": number
}`;

        const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en análisis visual de interfaces de usuario y detección de errores. Responde siempre en JSON válido.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: analysisPrompt },
                  ...(imageData?.startsWith('data:') || imageData?.startsWith('http') 
                    ? [{ type: 'image_url', image_url: { url: imageData } }]
                    : [])
                ]
              }
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        if (!visionResponse.ok) {
          throw new Error(`Vision API error: ${visionResponse.status}`);
        }

        const visionData = await visionResponse.json();
        const content = visionData.choices?.[0]?.message?.content || '';
        
        let analysis;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          analysis = {
            errorDetected: false,
            uiElements: [],
            textContent: [],
            suggestions: ['No se pudo analizar la imagen correctamente'],
            confidence: 0.5
          };
        }

        // Generate AI annotations
        const annotations = [];
        if (analysis?.errorDetected && analysis?.errorLocation) {
          annotations.push({
            id: crypto.randomUUID(),
            type: 'rectangle',
            position: { x: analysis.errorLocation.x, y: analysis.errorLocation.y },
            size: { width: analysis.errorLocation.width, height: analysis.errorLocation.height },
            color: '#ef4444',
            label: analysis.errorType || 'Error detectado',
            createdBy: 'ai',
            timestamp: new Date().toISOString()
          });
        }

        result = {
          success: true,
          analysis,
          annotations,
          insights: analysis?.suggestions || []
        };
        break;
      }

      case 'detect_errors': {
        const { imageData, expectedState } = body;
        
        const errorPrompt = `Detecta errores visuales en esta captura de pantalla.

BUSCA:
1. Mensajes de error visibles
2. Estados de carga fallidos
3. Elementos rotos o mal renderizados
4. Inconsistencias visuales
5. Problemas de accesibilidad visual

${expectedState ? `ESTADO ESPERADO: ${JSON.stringify(expectedState)}` : ''}

RESPONDE EN JSON:
{
  "errors": [
    {
      "type": "string",
      "severity": "low|medium|high|critical",
      "description": "string",
      "location": { "x": number, "y": number },
      "suggestedFix": "string"
    }
  ]
}`;

        const errorResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en QA visual y detección de bugs. Responde en JSON.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: errorPrompt },
                  ...(imageData ? [{ type: 'image_url', image_url: { url: imageData } }] : [])
                ]
              }
            ],
            temperature: 0.2,
            max_tokens: 1500,
          }),
        });

        const errorData = await errorResponse.json();
        const errorContent = errorData.choices?.[0]?.message?.content || '{"errors":[]}';
        
        let errors = [];
        try {
          const jsonMatch = errorContent.match(/\{[\s\S]*\}/);
          errors = jsonMatch ? JSON.parse(jsonMatch[0]).errors || [] : [];
        } catch {
          errors = [];
        }

        result = { success: true, errors };
        break;
      }

      case 'compare_screens': {
        const { beforeImage, afterImage, context } = body;
        
        const comparePrompt = `Compara estas dos capturas de pantalla (antes y después) e identifica:
1. Cambios realizados
2. Problemas resueltos
3. Nuevos problemas introducidos
4. Diferencias en estado de UI

RESPONDE EN JSON:
{
  "changes": [
    { "type": "string", "description": "string", "significance": "low|medium|high" }
  ],
  "problemsResolved": ["string"],
  "newIssues": ["string"],
  "overallAssessment": "string"
}`;

        const compareResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en comparación visual de interfaces. Responde en JSON.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: comparePrompt },
                  ...(beforeImage ? [{ type: 'image_url', image_url: { url: beforeImage } }] : []),
                  ...(afterImage ? [{ type: 'image_url', image_url: { url: afterImage } }] : [])
                ]
              }
            ],
            temperature: 0.3,
            max_tokens: 1500,
          }),
        });

        const compareData = await compareResponse.json();
        const compareContent = compareData.choices?.[0]?.message?.content || '';
        
        let comparison;
        try {
          const jsonMatch = compareContent.match(/\{[\s\S]*\}/);
          comparison = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          comparison = { changes: [], problemsResolved: [], newIssues: [], overallAssessment: 'No se pudo comparar' };
        }

        result = { success: true, comparison };
        break;
      }

      case 'extract_text': {
        const { imageData } = body;
        
        const ocrPrompt = `Extrae TODO el texto visible en esta captura de pantalla.
Organízalo por secciones si es posible.
Incluye: títulos, botones, labels, mensajes, etc.

RESPONDE EN JSON:
{
  "text": ["string"],
  "sections": [
    { "title": "string", "content": ["string"] }
  ]
}`;

        const ocrResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en OCR y extracción de texto. Responde en JSON.' },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: ocrPrompt },
                  ...(imageData ? [{ type: 'image_url', image_url: { url: imageData } }] : [])
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        });

        const ocrData = await ocrResponse.json();
        const ocrContent = ocrData.choices?.[0]?.message?.content || '{"text":[]}';
        
        let extracted;
        try {
          const jsonMatch = ocrContent.match(/\{[\s\S]*\}/);
          extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : { text: [] };
        } catch {
          extracted = { text: [] };
        }

        result = { success: true, text: extracted.text || [], sections: extracted.sections || [] };
        break;
      }

      case 'get_error_patterns': {
        // Return common error patterns
        result = {
          success: true,
          patterns: [
            {
              id: '1',
              patternType: 'connection_error',
              description: 'Error de conexión a servidor',
              visualSignature: 'Mensaje rojo con icono de red',
              frequency: 45,
              resolutionSteps: ['Verificar conectividad', 'Reiniciar aplicación', 'Contactar soporte'],
              lastSeen: new Date().toISOString()
            },
            {
              id: '2',
              patternType: 'validation_error',
              description: 'Error de validación de formulario',
              visualSignature: 'Campos con borde rojo y mensaje de error',
              frequency: 78,
              resolutionSteps: ['Revisar campos marcados', 'Corregir formato', 'Reintentar envío'],
              lastSeen: new Date().toISOString()
            },
            {
              id: '3',
              patternType: 'loading_timeout',
              description: 'Tiempo de carga excedido',
              visualSignature: 'Spinner infinito o pantalla en blanco',
              frequency: 32,
              resolutionSteps: ['Refrescar página', 'Limpiar caché', 'Reportar si persiste'],
              lastSeen: new Date().toISOString()
            }
          ]
        };
        break;
      }

      case 'generate_guide': {
        const { problemDescription, targetScreens } = body;
        
        const guidePrompt = `Genera una guía visual paso a paso para resolver:
PROBLEMA: ${problemDescription}

La guía debe incluir:
1. Pasos numerados claros
2. Descripción de qué buscar en pantalla
3. Acciones específicas a realizar
4. Puntos de verificación

RESPONDE EN JSON:
{
  "title": "string",
  "steps": [
    {
      "number": number,
      "title": "string",
      "description": "string",
      "action": "string",
      "verification": "string",
      "screenshot": "string (descripción de qué debería verse)"
    }
  ],
  "tips": ["string"],
  "commonMistakes": ["string"]
}`;

        const guideResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en documentación técnica y guías de usuario. Responde en JSON.' },
              { role: 'user', content: guidePrompt }
            ],
            temperature: 0.4,
            max_tokens: 2000,
          }),
        });

        const guideData = await guideResponse.json();
        const guideContent = guideData.choices?.[0]?.message?.content || '';
        
        let guide;
        try {
          const jsonMatch = guideContent.match(/\{[\s\S]*\}/);
          guide = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          guide = { title: 'Guía no disponible', steps: [], tips: [], commonMistakes: [] };
        }

        result = { success: true, guide };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[screen-understanding] Action ${action} completed successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[screen-understanding] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
