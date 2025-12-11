import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, extract_tables, extract_entities, expected_document_type, language } = await req.json();
    
    if (!fileUrl) {
      throw new Error("fileUrl is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch the document
    let documentContent = "";
    let isImage = false;
    
    if (fileUrl.startsWith("data:image") || /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(fileUrl)) {
      isImage = true;
    }

    const systemPrompt = `Ets un expert en OCR i extracció de documents bancaris. Analitza el document i extreu informació estructurada.

TIPUS DE DOCUMENTS:
- invoice: factures
- contract: contractes
- id_document: DNI, passaport, NIE
- financial_statement: balanços, comptes resultats
- receipt: rebuts, tiquets
- other: altres documents

ENTITATS A EXTREURE:
- company_name: noms d'empreses
- tax_id: NIF, CIF, NRT
- amount: imports monetaris
- date: dates
- address: adreces
- person: noms de persones
- account_number: números de compte bancari

Per a cada entitat, proporciona:
- type: tipus d'entitat
- value: valor extret
- confidence: confiança 0-1
- normalized_value: valor normalitzat (dates ISO, imports sense símbol)

Respon NOMÉS amb JSON vàlid.`;

    const userPrompt = `Processa aquest document:

URL: ${fileUrl}
Tipus esperat: ${expected_document_type || 'auto-detect'}
Idioma: ${language || 'auto'}

Opcions:
- Extreure taules: ${extract_tables ?? true}
- Extreure entitats: ${extract_entities ?? true}

${isImage ? 'NOTA: El document és una imatge. Aplica OCR per extreure el text.' : ''}

Retorna JSON amb:
{
  "document_type": "invoice"|"contract"|"id_document"|"financial_statement"|"receipt"|"other",
  "confidence": 0-1,
  "extracted_text": "text complet extret del document",
  "structured_data": {
    "camp1": "valor1",
    "camp2": "valor2"
  },
  "entities": [
    {
      "type": "company_name"|"tax_id"|"amount"|"date"|"address"|"person"|"account_number",
      "value": "valor original",
      "confidence": 0-1,
      "position": { "page": 1, "bbox": [x1, y1, x2, y2] },
      "normalized_value": "valor normalitzat"
    }
  ],
  "tables": [
    {
      "headers": ["col1", "col2"],
      "rows": [["val1", "val2"]],
      "confidence": 0-1,
      "page": 1
    }
  ],
  "metadata": {
    "pages": número de pàgines,
    "language": "ca"|"es"|"en"|"fr",
    "quality_score": 0-1 (qualitat del document),
    "processing_time_ms": temps processament,
    "detected_format": "PDF"|"Image"|"Scan"
  },
  "validation_flags": [
    {
      "type": "warning"|"error"|"info",
      "message": "descripció problema o nota",
      "field": "camp afectat opcional"
    }
  ]
}`;

    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (isImage && fileUrl.startsWith("http")) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: fileUrl } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const startTime = Date.now();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 6000,
      }),
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const result = JSON.parse(content);

    // Add actual processing time
    if (result.metadata) {
      result.metadata.processing_time_ms = processingTime;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("intelligent-ocr error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
