import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionRequest {
  action: 'get_documents' | 'semantic_search' | 'process_ocr' | 'ai_analyze' | 'create_version' | 'archive';
  context?: Record<string, unknown>;
  documentId?: string;
  query?: string;
  filters?: Record<string, unknown>;
  changes?: string;
  newFileUrl?: string;
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

    const { action, context, documentId, query, filters, changes, newFileUrl } = await req.json() as FunctionRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'get_documents':
        systemPrompt = `Eres un gestor de archivo documental contable con IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "documents": [
    {
      "id": "string",
      "name": "string",
      "type": "invoice|receipt|contract|report|statement|other",
      "category": "string",
      "status": "pending|processed|verified|archived",
      "uploadedAt": "ISO date",
      "size": number,
      "mimeType": "string",
      "tags": ["string"],
      "aiAnalysis": {
        "confidence": number,
        "entities": ["string"],
        "summary": "string"
      }
    }
  ],
  "stats": {
    "totalDocuments": number,
    "pendingProcessing": number,
    "storageUsed": "string"
  },
  "recentActivity": [
    {
      "action": "string",
      "documentName": "string",
      "timestamp": "ISO date"
    }
  ]
}`;
        userPrompt = `Genera lista de documentos para: ${JSON.stringify(context || {})}`;
        break;

      case 'semantic_search':
        systemPrompt = `Eres un buscador semántico de documentos contables.

FORMATO DE RESPUESTA (JSON estricto):
{
  "results": [
    {
      "documentId": "string",
      "documentName": "string",
      "relevanceScore": number,
      "matchedText": "string",
      "highlights": ["string"]
    }
  ],
  "totalResults": number,
  "searchTime": number,
  "suggestions": ["string"]
}`;
        userPrompt = `Búsqueda semántica: "${query}". Filtros: ${JSON.stringify(filters || {})}`;
        break;

      case 'process_ocr':
        systemPrompt = `Eres un sistema OCR avanzado para documentos contables.

FORMATO DE RESPUESTA (JSON estricto):
{
  "processed": true,
  "extractedText": "string",
  "structuredData": {
    "vendor": "string",
    "date": "string",
    "amount": number,
    "taxAmount": number,
    "lineItems": []
  },
  "confidence": number,
  "warnings": []
}`;
        userPrompt = `Procesar OCR del documento: ${documentId}`;
        break;

      case 'ai_analyze':
        systemPrompt = `Eres un analista de documentos contables con IA.

FORMATO DE RESPUESTA (JSON estricto):
{
  "analysis": {
    "documentType": "string",
    "entities": [
      {
        "type": "string",
        "value": "string",
        "confidence": number
      }
    ],
    "summary": "string",
    "keyInsights": ["string"],
    "suggestedCategory": "string",
    "suggestedTags": ["string"],
    "relatedDocuments": ["string"],
    "complianceFlags": []
  }
}`;
        userPrompt = `Analizar documento con IA: ${documentId}`;
        break;

      case 'create_version':
        systemPrompt = `Eres un gestor de versiones de documentos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "versionCreated": true,
  "versionNumber": number,
  "previousVersion": number,
  "changes": "string",
  "createdAt": "ISO date"
}`;
        userPrompt = `Crear versión del documento ${documentId}. Cambios: ${changes}`;
        break;

      case 'archive':
        systemPrompt = `Eres un archivador de documentos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "archived": true,
  "archivedAt": "ISO date",
  "retentionPeriod": "string",
  "archiveLocation": "string"
}`;
        userPrompt = `Archivar documento: ${documentId}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[obelixia-documents] Processing action: ${action}`);

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
      console.error('[obelixia-documents] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[obelixia-documents] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-documents] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
