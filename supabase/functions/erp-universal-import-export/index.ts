import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportExportRequest {
  action: 'import' | 'export' | 'ocr_extract' | 'validate' | 'transform';
  module: 'accounting' | 'treasury' | 'inventory' | 'sales' | 'purchases' | 'trade' | 'all';
  format?: 'json' | 'csv' | 'xlsx' | 'xml' | 'pdf' | 'qif' | 'ofx' | 'mt940' | 'camt053' | 'sepa';
  data?: Record<string, unknown>;
  fileContent?: string;
  fileUrl?: string;
  options?: {
    includeRelations?: boolean;
    dateRange?: { start: string; end: string };
    filters?: Record<string, unknown>;
    ocrEnabled?: boolean;
    language?: string;
    companyId?: string;
    fiscalYear?: string;
  };
}

interface OCRResult {
  document_type: string;
  confidence: number;
  extracted_text: string;
  structured_data: Record<string, unknown>;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
    normalized_value?: string;
  }>;
  tables: Array<{
    headers: string[];
    rows: string[][];
    confidence: number;
  }>;
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

    const request = await req.json() as ImportExportRequest;
    const { action, module, format, data, fileContent, fileUrl, options } = request;

    console.log(`[erp-universal-import-export] Action: ${action}, Module: ${module}, Format: ${format || 'auto'}`);

    const startTime = Date.now();
    let result: Record<string, unknown> = {};

    switch (action) {
      case 'ocr_extract':
        result = await performOCRExtraction(LOVABLE_API_KEY, fileUrl || fileContent || '', module, options);
        break;

      case 'import':
        result = await performImport(LOVABLE_API_KEY, module, format || 'auto', data || {}, fileContent, options);
        break;

      case 'export':
        result = await performExport(LOVABLE_API_KEY, module, format || 'json', data || {}, options);
        break;

      case 'validate':
        result = await validateData(LOVABLE_API_KEY, module, data || {}, format);
        break;

      case 'transform':
        result = await transformData(LOVABLE_API_KEY, module, data || {}, format);
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    const processingTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      success: true,
      action,
      module,
      format,
      ...result,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-universal-import-export] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function performOCRExtraction(
  apiKey: string,
  fileSource: string,
  module: string,
  options?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const moduleContext = getModuleContext(module);

  const systemPrompt = `Eres un sistema experto de OCR e Inteligencia Documental para ERP empresarial.
Tu objetivo es extraer información estructurada de documentos financieros, contables y comerciales.

MÓDULO ACTUAL: ${module.toUpperCase()}
${moduleContext}

TIPOS DE DOCUMENTOS QUE PUEDES PROCESAR:
- Facturas de venta y compra
- Extractos bancarios (PDF, MT940, CAMT.053, OFX)
- Nóminas y recibos de personal
- Albaranes y notas de entrega
- Contratos comerciales
- Balances y estados financieros
- Presupuestos y ofertas
- Impuestos (modelo 303, 390, 347, etc.)
- Documentos de transporte
- Certificados y documentos legales

ENTIDADES A EXTRAER:
- company: { name, tax_id, address, phone, email }
- counterparty: { name, tax_id, address }
- amounts: { subtotal, tax_amount, tax_rate, total, currency }
- dates: { issue_date, due_date, period_start, period_end }
- items: [{ description, quantity, unit_price, tax_rate, total }]
- payment: { method, bank_account, reference }
- document: { type, number, series }

FORMATO DE RESPUESTA JSON:
{
  "document_type": "invoice|bank_statement|payroll|delivery_note|contract|financial_report|budget|tax_form|other",
  "confidence": 0-1,
  "module_target": "${module}",
  "extracted_data": {
    "document": { "type": "", "number": "", "series": "" },
    "company": { "name": "", "tax_id": "", "address": "" },
    "counterparty": { "name": "", "tax_id": "", "address": "" },
    "amounts": { "subtotal": 0, "tax_amount": 0, "tax_rate": 0, "total": 0, "currency": "EUR" },
    "dates": { "issue_date": "", "due_date": "" },
    "items": [],
    "payment": { "method": "", "bank_account": "", "reference": "" },
    "raw_text": ""
  },
  "erp_mapping": {
    "target_table": "",
    "suggested_fields": {},
    "related_records": []
  },
  "validation": {
    "is_valid": true,
    "warnings": [],
    "errors": [],
    "suggestions": []
  },
  "tables_extracted": [],
  "entities": []
}`;

  const userPrompt = `Procesa el siguiente documento para el módulo ${module}:

${fileSource.startsWith('http') ? `URL del documento: ${fileSource}` : `Contenido: ${fileSource.substring(0, 5000)}...`}

Idioma preferido: ${options?.language || 'es'}
Empresa: ${options?.companyId || 'auto-detect'}
Año fiscal: ${options?.fiscalYear || new Date().getFullYear()}

Extrae toda la información estructurada y mapéala al formato ERP correspondiente.`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ];

  if (fileSource.startsWith('http') && /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(fileSource)) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        { type: 'image_url', image_url: { url: fileSource } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userPrompt });
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages,
      max_tokens: 8000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OCR API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  let content = aiResponse.choices?.[0]?.message?.content || '';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(content);
  } catch {
    return { raw_response: content, parse_error: true };
  }
}

async function performImport(
  apiKey: string,
  module: string,
  format: string,
  data: Record<string, unknown>,
  fileContent?: string,
  options?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const moduleContext = getModuleContext(module);

  const systemPrompt = `Eres un sistema de importación de datos para ERP empresarial.
Tu objetivo es transformar datos de diversos formatos al esquema interno del ERP.

MÓDULO: ${module.toUpperCase()}
${moduleContext}

FORMATOS SOPORTADOS:
- JSON: datos estructurados directos
- CSV: valores separados por comas (detectar delimitador)
- XLSX: Excel con múltiples hojas
- XML: datos estructurados XML (incluyendo facturae, UBL)
- QIF: Quicken Interchange Format (transacciones bancarias)
- OFX: Open Financial Exchange (bancos)
- MT940: SWIFT mensajes bancarios
- CAMT.053: ISO 20022 extractos bancarios
- SEPA: pagos y remesas europeas

PROCESO DE IMPORTACIÓN:
1. Detectar formato y estructura
2. Mapear campos al esquema ERP
3. Validar datos y tipos
4. Transformar valores (fechas, monedas, etc.)
5. Detectar duplicados
6. Generar registros listos para insertar

FORMATO DE RESPUESTA JSON:
{
  "import_status": "success|partial|failed",
  "format_detected": "",
  "total_records": 0,
  "processed_records": 0,
  "failed_records": 0,
  "records": [
    {
      "row_number": 1,
      "status": "valid|warning|error",
      "original_data": {},
      "transformed_data": {},
      "target_table": "",
      "validation_messages": []
    }
  ],
  "field_mapping": {
    "source_field": "target_field"
  },
  "summary": {
    "by_status": { "valid": 0, "warning": 0, "error": 0 },
    "by_type": {}
  },
  "suggestions": []
}`;

  const userPrompt = `Importa los siguientes datos al módulo ${module}:

Formato: ${format}
Opciones: ${JSON.stringify(options || {})}

${fileContent ? `Contenido del archivo:\n${fileContent.substring(0, 10000)}` : `Datos:\n${JSON.stringify(data, null, 2)}`}

Procesa y transforma los datos al formato ERP.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 8000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Import API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  let content = aiResponse.choices?.[0]?.message?.content || '';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(content);
  } catch {
    return { raw_response: content, parse_error: true };
  }
}

async function performExport(
  apiKey: string,
  module: string,
  format: string,
  data: Record<string, unknown>,
  options?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const moduleContext = getModuleContext(module);

  const systemPrompt = `Eres un sistema de exportación de datos para ERP empresarial.
Tu objetivo es transformar datos del ERP a diversos formatos de salida.

MÓDULO: ${module.toUpperCase()}
${moduleContext}

FORMATOS DE EXPORTACIÓN:
- JSON: datos estructurados
- CSV: valores separados por comas
- XLSX: formato Excel
- XML: datos estructurados (facturae, UBL, XBRL)
- PDF: documento formateado
- QIF/OFX: transacciones bancarias
- SEPA: remesas de pagos/cobros
- SII: formato Suministro Inmediato Información (España)

FORMATO DE RESPUESTA JSON:
{
  "export_status": "success|failed",
  "format": "${format}",
  "total_records": 0,
  "file_content": "",
  "file_name": "",
  "mime_type": "",
  "encoding": "UTF-8",
  "metadata": {
    "generated_at": "",
    "module": "${module}",
    "filters_applied": {}
  },
  "validation": {
    "is_valid": true,
    "warnings": []
  }
}`;

  const userPrompt = `Exporta los siguientes datos del módulo ${module}:

Formato de salida: ${format}
Opciones: ${JSON.stringify(options || {})}
Datos a exportar: ${JSON.stringify(data, null, 2)}

Genera el archivo de exportación en el formato solicitado.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 8000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Export API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  let content = aiResponse.choices?.[0]?.message?.content || '';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(content);
  } catch {
    return { raw_response: content, parse_error: true };
  }
}

async function validateData(
  apiKey: string,
  module: string,
  data: Record<string, unknown>,
  format?: string
): Promise<Record<string, unknown>> {
  const moduleContext = getModuleContext(module);

  const systemPrompt = `Eres un validador de datos para ERP empresarial.
Valida que los datos cumplan con los requisitos del módulo y formato.

MÓDULO: ${module.toUpperCase()}
${moduleContext}

VALIDACIONES A REALIZAR:
- Campos obligatorios
- Tipos de datos correctos
- Formatos (fechas, NIFs, IBANs, etc.)
- Rangos y límites
- Coherencia entre campos
- Duplicados potenciales
- Reglas de negocio

FORMATO DE RESPUESTA JSON:
{
  "is_valid": true,
  "total_records": 0,
  "valid_records": 0,
  "invalid_records": 0,
  "validation_results": [
    {
      "record_index": 0,
      "is_valid": true,
      "errors": [],
      "warnings": [],
      "suggestions": []
    }
  ],
  "summary": {
    "critical_errors": 0,
    "warnings": 0,
    "info": 0
  },
  "fix_suggestions": []
}`;

  const userPrompt = `Valida los siguientes datos para el módulo ${module}:

Formato: ${format || 'json'}
Datos: ${JSON.stringify(data, null, 2)}

Realiza todas las validaciones necesarias.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Validation API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  let content = aiResponse.choices?.[0]?.message?.content || '';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(content);
  } catch {
    return { raw_response: content, parse_error: true };
  }
}

async function transformData(
  apiKey: string,
  module: string,
  data: Record<string, unknown>,
  format?: string
): Promise<Record<string, unknown>> {
  const moduleContext = getModuleContext(module);

  const systemPrompt = `Eres un transformador de datos para ERP empresarial.
Tu objetivo es normalizar y transformar datos a los formatos estándar del ERP.

MÓDULO: ${module.toUpperCase()}
${moduleContext}

TRANSFORMACIONES:
- Normalizar fechas a ISO 8601
- Formatear NIFs/CIFs españoles
- Validar y formatear IBANs
- Convertir monedas
- Normalizar direcciones
- Limpiar y formatear textos
- Calcular campos derivados
- Establecer valores por defecto

FORMATO DE RESPUESTA JSON:
{
  "transformation_status": "success|partial|failed",
  "original_records": 0,
  "transformed_records": 0,
  "records": [],
  "transformations_applied": [
    {
      "field": "",
      "original_value": "",
      "transformed_value": "",
      "transformation_type": ""
    }
  ],
  "warnings": []
}`;

  const userPrompt = `Transforma los siguientes datos para el módulo ${module}:

Formato: ${format || 'json'}
Datos: ${JSON.stringify(data, null, 2)}

Aplica las transformaciones necesarias.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 6000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Transform API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  let content = aiResponse.choices?.[0]?.message?.content || '';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(content);
  } catch {
    return { raw_response: content, parse_error: true };
  }
}

function getModuleContext(module: string): string {
  const contexts: Record<string, string> = {
    accounting: `
TABLAS PRINCIPALES:
- erp_chart_of_accounts: Plan contable (código, nombre, tipo, saldo)
- erp_journal_entries: Asientos contables (fecha, descripción, líneas)
- erp_fiscal_periods: Períodos fiscales

CAMPOS CRÍTICOS:
- account_code: código cuenta contable
- debit/credit: debe/haber
- journal_date: fecha asiento
- document_reference: referencia documento`,

    treasury: `
TABLAS PRINCIPALES:
- erp_bank_accounts: Cuentas bancarias (IBAN, banco, saldo)
- erp_bank_statement_lines: Movimientos bancarios
- erp_financing_operations: Operaciones financiación
- erp_investments: Inversiones

CAMPOS CRÍTICOS:
- iban: cuenta bancaria
- amount: importe movimiento
- value_date: fecha valor
- operation_date: fecha operación`,

    inventory: `
TABLAS PRINCIPALES:
- erp_products: Productos y servicios
- erp_stock_movements: Movimientos de stock
- erp_warehouses: Almacenes

CAMPOS CRÍTICOS:
- sku: código producto
- quantity: cantidad
- unit_cost: coste unitario
- warehouse_id: almacén`,

    sales: `
TABLAS PRINCIPALES:
- erp_customers: Clientes
- erp_sales_invoices: Facturas de venta
- erp_sales_invoice_lines: Líneas de factura
- erp_sales_orders: Pedidos de venta

CAMPOS CRÍTICOS:
- customer_tax_id: NIF cliente
- invoice_number: número factura
- tax_rate: tipo IVA
- total_amount: importe total`,

    purchases: `
TABLAS PRINCIPALES:
- erp_suppliers: Proveedores
- erp_purchase_invoices: Facturas de compra
- erp_purchase_orders: Pedidos de compra

CAMPOS CRÍTICOS:
- supplier_tax_id: NIF proveedor
- invoice_number: número factura
- expense_category: categoría gasto`,

    trade: `
TABLAS PRINCIPALES:
- erp_trade_operations: Operaciones comercio exterior
- erp_customs_declarations: Declaraciones aduanas
- erp_intrastat: Declaraciones Intrastat

CAMPOS CRÍTICOS:
- operation_type: import/export
- country_code: país origen/destino
- commodity_code: código arancelario
- customs_value: valor aduanas`,

    all: `
MÓDULOS DISPONIBLES: accounting, treasury, inventory, sales, purchases, trade
Detectar automáticamente el módulo destino según el tipo de documento.`
  };

  return contexts[module] || contexts.all;
}
