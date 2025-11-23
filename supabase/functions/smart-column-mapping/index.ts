import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColumnMappingRequest {
  columns: string[];
  sampleData?: { [key: string]: any }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { columns, sampleData }: ColumnMappingRequest = await req.json();

    if (!columns || columns.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No columns provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare the system prompt with database schema information
    const systemPrompt = `Eres un experto en mapeo de datos y análisis de hojas de cálculo. Tu tarea es analizar las columnas de una hoja Excel y mapearlas inteligentemente a los campos de una base de datos de empresas.

Los campos disponibles en la base de datos son:
- name (obligatorio): Nombre de la empresa
- address (obligatorio): Dirección completa
- latitude (obligatorio): Latitud en formato decimal (-90 a 90)
- longitude (obligatorio): Longitud en formato decimal (-180 a 180)
- parroquia (obligatorio): Parroquia/localidad
- tax_id: NIF/CIF de la empresa
- cnae: Código CNAE de actividad económica
- sector: Sector económico
- oficina: Oficina asignada
- phone: Teléfono de contacto
- email: Email de contacto
- website: Sitio web
- employees: Número de empleados (número)
- turnover: Facturación anual (número)
- pl_banco: P&L del banco (número)
- beneficios: Beneficios (número)
- vinculacion_entidad_1: Vinculación entidad 1 (número, porcentaje 0-100)
- vinculacion_entidad_2: Vinculación entidad 2 (número, porcentaje 0-100)
- vinculacion_entidad_3: Vinculación entidad 3 (número, porcentaje 0-100)
- bp: Cuenta bancaria/BP
- client_type: Tipo de cliente ('cliente' o 'potencial_cliente')
- registration_number: Número de registro
- legal_form: Forma legal
- observaciones: Observaciones o notas

Debes analizar el nombre de cada columna y, si se proporcionan, los datos de ejemplo, para determinar a qué campo de la base de datos corresponde. Ten en cuenta:
- Variaciones de idioma (español, catalán, inglés, francés)
- Abreviaturas comunes
- Sinónimos y términos relacionados
- El contexto de los datos de ejemplo

Si una columna no corresponde a ningún campo de la base de datos, devuelve "skip" como campo.

IMPORTANTE: Devuelve SOLO un objeto JSON válido con el formato:
{
  "mappings": [
    { "excelColumn": "nombre_columna_excel", "dbField": "campo_db", "confidence": 0.95, "reasoning": "breve explicación" }
  ]
}`;

    // Prepare the user prompt
    let userPrompt = `Analiza las siguientes columnas de Excel y mapéalas a los campos de la base de datos:\n\nColumnas:\n${columns.map((col, i) => `${i + 1}. ${col}`).join('\n')}`;

    if (sampleData && sampleData.length > 0) {
      userPrompt += `\n\nDatos de ejemplo (primeras 3 filas):\n${JSON.stringify(sampleData.slice(0, 3), null, 2)}`;
    }

    console.log('Calling Lovable AI for column mapping...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse, null, 2));

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from the response (in case it's wrapped in markdown)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '').trim();
    }

    const mappingResult = JSON.parse(jsonContent);

    // Validate the result structure
    if (!mappingResult.mappings || !Array.isArray(mappingResult.mappings)) {
      throw new Error("Invalid mapping result structure");
    }

    // Filter out invalid mappings and ensure required fields
    const validMappings = mappingResult.mappings.filter((m: any) => 
      m.excelColumn && m.dbField && m.dbField !== 'skip'
    );

    console.log('Smart mapping completed:', validMappings.length, 'mappings found');

    return new Response(
      JSON.stringify({ 
        mappings: validMappings,
        totalColumns: columns.length,
        mappedColumns: validMappings.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Smart mapping error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
