import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  action: 'analyze' | 'import' | 'validate';
  targetType: 'customers' | 'suppliers' | 'items' | 'taxes' | 'payment_terms' | 'warehouses' | 'bank_accounts' | 'series';
  fileContent: string;
  fileName: string;
  fileType: string;
  companyId?: string;
  options?: {
    autoCreate?: boolean;
    updateExisting?: boolean;
    dryRun?: boolean;
  };
}

const ENTITY_SCHEMAS: Record<string, object> = {
  customers: {
    required: ['code', 'name'],
    optional: ['tax_id', 'email', 'phone', 'address', 'city', 'postal_code', 'country', 'payment_terms', 'credit_limit', 'notes'],
    example: { code: 'CLI001', name: 'Empresa ABC', tax_id: 'B12345678', email: 'contacto@empresa.com' }
  },
  suppliers: {
    required: ['code', 'name'],
    optional: ['tax_id', 'email', 'phone', 'address', 'city', 'postal_code', 'country', 'payment_terms', 'notes'],
    example: { code: 'PROV001', name: 'Proveedor XYZ', tax_id: 'A87654321', email: 'compras@proveedor.com' }
  },
  items: {
    required: ['code', 'name'],
    optional: ['description', 'unit', 'category', 'purchase_price', 'sale_price', 'tax_rate', 'min_stock', 'barcode', 'weight', 'notes'],
    example: { code: 'ART001', name: 'Producto ejemplo', sale_price: 100.00, tax_rate: 21 }
  },
  taxes: {
    required: ['code', 'name', 'rate'],
    optional: ['type', 'account_code', 'is_active', 'notes'],
    example: { code: 'IVA21', name: 'IVA 21%', rate: 21.00, type: 'VAT' }
  },
  payment_terms: {
    required: ['code', 'name'],
    optional: ['days', 'discount_percent', 'discount_days', 'type', 'notes'],
    example: { code: 'NET30', name: 'Neto 30 días', days: 30 }
  },
  warehouses: {
    required: ['code', 'name'],
    optional: ['address', 'city', 'is_active', 'manager', 'notes'],
    example: { code: 'ALM01', name: 'Almacén Principal', city: 'Madrid' }
  },
  bank_accounts: {
    required: ['bank_name', 'iban'],
    optional: ['bic', 'account_holder', 'currency', 'is_default', 'notes'],
    example: { bank_name: 'Banco Ejemplo', iban: 'ES9121000418450200051332' }
  },
  series: {
    required: ['code', 'name', 'module'],
    optional: ['prefix', 'suffix', 'next_number', 'format', 'is_active'],
    example: { code: 'FAC', name: 'Facturas', module: 'sales', prefix: 'F-', next_number: 1 }
  }
};

const ENTITY_LABELS: Record<string, string> = {
  customers: 'Clientes',
  suppliers: 'Proveedores',
  items: 'Artículos',
  taxes: 'Impuestos',
  payment_terms: 'Condiciones de Pago',
  warehouses: 'Almacenes',
  bank_accounts: 'Cuentas Bancarias',
  series: 'Series'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, targetType, fileContent, fileName, fileType, companyId, options } = await req.json() as ImportRequest;

    console.log(`[erp-maestros-ai-import] Action: ${action}, Target: ${targetType}, File: ${fileName}`);

    const schema = ENTITY_SCHEMAS[targetType];
    if (!schema) {
      throw new Error(`Tipo de entidad no soportado: ${targetType}`);
    }

    const systemPrompt = `Eres un experto en importación de datos para sistemas ERP.
Tu tarea es analizar archivos de cualquier formato (CSV, Excel, JSON, XML, texto plano, PDF escaneado, imágenes) y extraer datos estructurados.

ENTIDAD OBJETIVO: ${ENTITY_LABELS[targetType]}
ESQUEMA REQUERIDO:
- Campos obligatorios: ${JSON.stringify((schema as any).required)}
- Campos opcionales: ${JSON.stringify((schema as any).optional)}
- Ejemplo de registro válido: ${JSON.stringify((schema as any).example)}

INSTRUCCIONES:
1. Analiza el contenido del archivo y detecta el formato automáticamente
2. Identifica las columnas/campos que corresponden a cada propiedad del esquema
3. Extrae todos los registros encontrados
4. Normaliza los datos (fechas, números, textos)
5. Valida cada registro según el esquema
6. Genera un mapeo de campos detectado → campo destino

FORMATO DE RESPUESTA (JSON estricto):
{
  "success": true,
  "analysis": {
    "format_detected": "csv|excel|json|xml|text|pdf|image",
    "encoding": "utf-8|latin1|etc",
    "total_rows": 100,
    "header_row": 1,
    "data_start_row": 2,
    "columns_detected": ["col1", "col2", "..."],
    "field_mapping": {
      "columna_origen": "campo_destino"
    },
    "confidence": 0.95
  },
  "records": [
    {
      "row_number": 1,
      "status": "valid|warning|error",
      "original_data": {...},
      "transformed_data": {...},
      "validation_messages": ["mensaje si aplica"]
    }
  ],
  "summary": {
    "total": 100,
    "valid": 95,
    "warnings": 3,
    "errors": 2,
    "by_field_issues": {
      "campo": 5
    }
  },
  "suggestions": [
    "Sugerencia de mejora o corrección"
  ],
  "ready_to_import": true
}`;

    const userPrompt = `Archivo: ${fileName}
Tipo MIME: ${fileType}
Contenido:
${fileContent.substring(0, 50000)}

${action === 'validate' ? 'Solo valida los datos sin importar.' : ''}
${action === 'import' && options?.dryRun ? 'Modo simulación - no guardar datos.' : ''}

Analiza este archivo y extrae los datos para importar como ${ENTITY_LABELS[targetType]}.`;

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
        temperature: 0.3,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'rate_limit',
          message: 'Demasiadas solicitudes. Intenta en unos segundos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No se recibió respuesta del análisis');
    }

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se encontró JSON en la respuesta');
      }
    } catch (parseError) {
      console.error('[erp-maestros-ai-import] Parse error:', parseError);
      result = { 
        success: false,
        error: 'parse_error',
        raw_content: content.substring(0, 1000)
      };
    }

    console.log(`[erp-maestros-ai-import] Analysis complete: ${result.summary?.total || 0} records`);

    return new Response(JSON.stringify({
      success: true,
      action,
      targetType,
      fileName,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-maestros-ai-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
