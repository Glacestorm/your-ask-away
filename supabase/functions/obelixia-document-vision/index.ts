import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentRequest {
  action: 'analyze_document' | 'validate_extraction' | 'generate_entry';
  image_base64?: string;
  mime_type?: string;
  extracted_data?: Record<string, unknown>;
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

    const { action, image_base64, mime_type, extracted_data } = await req.json() as DocumentRequest;

    console.log(`[obelixia-document-vision] Processing action: ${action}`);

    if (action === 'analyze_document') {
      if (!image_base64 || !mime_type) {
        throw new Error('Missing image_base64 or mime_type');
      }

      const systemPrompt = `Eres un experto en OCR y extracción de datos de documentos contables españoles.
Tu tarea es analizar imágenes de facturas, tickets o extractos bancarios y extraer toda la información relevante.

TIPOS DE DOCUMENTO:
1. FACTURA (invoice): Incluye proveedor, NIF, número, fecha, líneas, impuestos, total
2. TICKET (receipt): Incluye comercio, fecha, artículos, total
3. EXTRACTO BANCARIO (bank_statement): Incluye banco, cuenta, movimientos, saldos

FORMATO DE RESPUESTA (JSON estricto):
{
  "document_type": "invoice" | "receipt" | "bank_statement",
  "confidence": 0.0-1.0,
  "extracted_data": {
    "type": "invoice" | "receipt" | "bank_statement",
    // Campos específicos según tipo
  },
  "warnings": ["lista de advertencias si hay datos dudosos"],
  "suggested_accounts": {
    "debit": "cuenta contable sugerida para débito",
    "credit": "cuenta contable sugerida para crédito"
  }
}

Para FACTURAS incluir:
- supplier_name, supplier_nif, invoice_number, invoice_date
- due_date (si existe), subtotal, tax_rate, tax_amount, total
- line_items: [{description, quantity, unit_price, amount}]

Para TICKETS incluir:
- merchant_name, date, time, items, total
- payment_method si es visible

Para EXTRACTOS incluir:
- bank_name, account_number, period_start, period_end
- opening_balance, closing_balance
- transactions: [{date, description, amount, balance, type}]

VALIDACIÓN DE NIF ESPAÑOL:
- Formato válido: 8 dígitos + letra O letra + 7 dígitos + letra
- Verificar letra de control si es posible`;

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
            { 
              role: 'user', 
              content: [
                { 
                  type: 'image_url', 
                  image_url: { 
                    url: `data:${mime_type};base64,${image_base64}` 
                  } 
                },
                { 
                  type: 'text', 
                  text: 'Analiza este documento y extrae toda la información. Responde SOLO con JSON válido.' 
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[obelixia-document-vision] AI API error:', errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Rate limit exceeded. Please try again later.' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in AI response');
      }

      // Parse JSON from response
      let result;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('[obelixia-document-vision] JSON parse error:', parseError);
        throw new Error('Failed to parse AI response');
      }

      console.log(`[obelixia-document-vision] Successfully analyzed: ${result.document_type}`);

      return new Response(JSON.stringify({
        success: true,
        document_type: result.document_type,
        confidence: result.confidence || 0.95,
        extracted_data: result.extracted_data,
        warnings: result.warnings || [],
        suggested_accounts: result.suggested_accounts,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'validate_extraction') {
      if (!extracted_data) {
        throw new Error('Missing extracted_data');
      }

      const warnings: string[] = [];
      let valid = true;

      // Validate based on document type
      const docType = extracted_data.type as string;

      if (docType === 'invoice') {
        const data = extracted_data as Record<string, unknown>;
        
        // Validate NIF
        const nif = data.supplier_nif as string;
        if (nif && !validateSpanishNIF(nif)) {
          warnings.push('NIF del proveedor no válido');
        }

        // Validate amounts
        const subtotal = Number(data.subtotal) || 0;
        const taxAmount = Number(data.tax_amount) || 0;
        const total = Number(data.total) || 0;

        if (Math.abs((subtotal + taxAmount) - total) > 0.02) {
          warnings.push('Los importes no cuadran (subtotal + IVA ≠ total)');
          valid = false;
        }

        // Validate date
        const invoiceDate = data.invoice_date as string;
        if (invoiceDate && new Date(invoiceDate) > new Date()) {
          warnings.push('La fecha de factura es futura');
        }
      }

      return new Response(JSON.stringify({
        valid,
        warnings
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate_entry') {
      if (!extracted_data) {
        throw new Error('Missing extracted_data');
      }

      const docType = extracted_data.type as string;
      let entry = null;

      if (docType === 'invoice') {
        const data = extracted_data as Record<string, unknown>;
        entry = {
          date: data.invoice_date || new Date().toISOString().split('T')[0],
          description: `Factura ${data.invoice_number} - ${data.supplier_name}`,
          debit_account: '600', // Compras
          credit_account: '410', // Acreedores
          amount: Number(data.subtotal) || 0,
          tax_amount: Number(data.tax_amount) || 0
        };
      } else if (docType === 'receipt') {
        const data = extracted_data as Record<string, unknown>;
        entry = {
          date: data.date || new Date().toISOString().split('T')[0],
          description: `Ticket ${data.merchant_name}`,
          debit_account: '629', // Otros gastos
          credit_account: '570', // Caja
          amount: Number(data.total) || 0
        };
      }

      return new Response(JSON.stringify({
        success: true,
        suggested_entry: entry
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('[obelixia-document-vision] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to validate Spanish NIF
function validateSpanishNIF(nif: string): boolean {
  if (!nif || nif.length < 9) return false;
  
  const cleanNif = nif.replace(/[\s-]/g, '').toUpperCase();
  
  // Pattern for NIF (8 digits + letter) or NIE (X/Y/Z + 7 digits + letter)
  const nifPattern = /^[0-9]{8}[A-Z]$/;
  const niePattern = /^[XYZ][0-9]{7}[A-Z]$/;
  const cifPattern = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/;
  
  return nifPattern.test(cleanNif) || niePattern.test(cleanNif) || cifPattern.test(cleanNif);
}
