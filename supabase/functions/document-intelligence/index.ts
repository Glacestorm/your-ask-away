import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentRequest {
  action: 'extract_data' | 'classify' | 'summarize' | 'compare' | 'validate';
  documentContent?: string;
  documentType?: string;
  documents?: string[];
  validationRules?: string[];
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

    const { action, documentContent, documentType, documents, validationRules } = await req.json() as DocumentRequest;
    console.log(`[document-intelligence] Processing action: ${action}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'extract_data':
        systemPrompt = `Eres un experto en extracción de datos de documentos empresariales.

EXTRAE información estructurada del documento.

RESPONDE EN JSON ESTRICTO:
{
  "extractedFields": [
    { "field": string, "value": string, "confidence": number, "location": string }
  ],
  "entities": {
    "companies": string[],
    "people": string[],
    "dates": string[],
    "amounts": string[],
    "addresses": string[]
  },
  "metadata": {
    "documentDate": string,
    "language": string,
    "pageCount": number
  }
}`;
        userPrompt = `Extrae datos de este documento (tipo: ${documentType}): ${documentContent}`;
        break;

      case 'classify':
        systemPrompt = `Eres un clasificador de documentos empresariales.

CLASIFICA el documento según su tipo y contenido.

RESPONDE EN JSON ESTRICTO:
{
  "primaryCategory": string,
  "secondaryCategories": string[],
  "documentType": string,
  "urgency": "high" | "medium" | "low",
  "department": string,
  "tags": string[],
  "confidence": number
}`;
        userPrompt = `Clasifica este documento: ${documentContent}`;
        break;

      case 'summarize':
        systemPrompt = `Eres un especialista en síntesis de documentos corporativos.

RESUME el documento de forma concisa pero completa.

RESPONDE EN JSON ESTRICTO:
{
  "executiveSummary": string,
  "keyPoints": string[],
  "actionItems": string[],
  "decisions": string[],
  "nextSteps": string[],
  "wordCount": { "original": number, "summary": number }
}`;
        userPrompt = `Resume este documento: ${documentContent}`;
        break;

      case 'compare':
        systemPrompt = `Eres un analista comparativo de documentos.

COMPARA los documentos e identifica diferencias y similitudes.

RESPONDE EN JSON ESTRICTO:
{
  "similarities": string[],
  "differences": [
    { "aspect": string, "doc1": string, "doc2": string, "significance": string }
  ],
  "conflictingClauses": string[],
  "recommendations": string[]
}`;
        userPrompt = `Compara estos documentos: ${documents?.join('\n---\n')}`;
        break;

      case 'validate':
        systemPrompt = `Eres un validador de documentos empresariales.

VALIDA el documento contra las reglas especificadas.

RESPONDE EN JSON ESTRICTO:
{
  "isValid": boolean,
  "validationResults": [
    { "rule": string, "passed": boolean, "details": string }
  ],
  "missingFields": string[],
  "warnings": string[],
  "completenessScore": number
}`;
        userPrompt = `Valida este documento: ${documentContent}
Reglas: ${validationRules?.join(', ')}`;
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
        temperature: 0.5,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result = { rawContent: content, parseError: true };
    }

    console.log(`[document-intelligence] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[document-intelligence] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
