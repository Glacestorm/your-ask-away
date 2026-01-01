import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRRequest {
  action: 'analyze' | 'detect_plan' | 'extract' | 'map_accounts' | 'generate_entries';
  file_url?: string;
  file_base64?: string;
  company_id?: string;
  fiscal_year_id?: string;
  statement_type?: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance';
  country_code?: string;
  plan_code?: string;
  extracted_data?: Record<string, unknown>;
  import_id?: string;
}

interface AccountingPlan {
  id: string;
  country_code: string;
  country_name: string;
  plan_code: string;
  plan_name: string;
  ocr_field_mappings: Record<string, Record<string, string[]>>;
  detection_patterns: {
    keywords: string[];
    currency_symbol: string;
    decimal_separator: string;
    thousands_separator: string;
    date_format: string;
    language_codes: string[];
  };
  asset_groups: unknown[];
  liability_groups: unknown[];
  equity_groups: unknown[];
  income_groups: unknown[];
  expense_groups: unknown[];
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json() as OCRRequest;

    console.log(`[erp-financial-statement-ocr] Action: ${action}`);

    switch (action) {
      case 'detect_plan': {
        // Detectar país y plan contable basándose en el texto del documento
        const { file_url, file_base64 } = params;
        
        // Obtener todos los planes contables activos
        const { data: plans, error: plansError } = await supabase
          .from('erp_accounting_plans')
          .select('*')
          .eq('is_active', true);

        if (plansError) throw plansError;

        const detectionPrompt = `Analiza el siguiente documento financiero y detecta:
1. El país de origen (ES, FR, DE, IT, PT, GB, o IFRS para internacional)
2. El plan contable utilizado
3. El tipo de estado financiero (balance_sheet, income_statement, cash_flow, trial_balance)
4. El idioma del documento
5. La moneda utilizada

PLANES CONTABLES DISPONIBLES:
${(plans as AccountingPlan[]).map(p => `- ${p.country_code}: ${p.plan_name} (${p.plan_code}) - Keywords: ${p.detection_patterns?.keywords?.join(', ') || 'N/A'}`).join('\n')}

Responde ÚNICAMENTE con un JSON válido:
{
  "detected_country": "XX",
  "detected_plan": "PLAN_CODE",
  "statement_type": "balance_sheet|income_statement|cash_flow|trial_balance",
  "detected_language": "es|fr|de|it|pt|en",
  "confidence": 0-100,
  "currency": "EUR|GBP|USD",
  "reasoning": "breve explicación"
}`;

        const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [
          { role: 'system', content: 'Eres un experto en contabilidad internacional y OCR de estados financieros. Detectas el país y plan contable de documentos financieros.' }
        ];

        if (file_base64) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: detectionPrompt },
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${file_base64}` } }
            ]
          });
        } else {
          messages.push({ role: 'user', content: detectionPrompt + '\n\n[Documento a analizar]' });
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages,
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No JSON found' };
        } catch {
          result = { error: 'Parse error', raw: content };
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'detect_plan',
          data: result,
          available_plans: plans
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'extract': {
        // Extraer datos del estado financiero usando OCR + IA
        const { file_url, file_base64, country_code, plan_code, statement_type } = params;

        // Obtener el plan contable específico
        const { data: plan, error: planError } = await supabase
          .from('erp_accounting_plans')
          .select('*')
          .eq('country_code', country_code || 'ES')
          .eq('is_default', true)
          .single();

        if (planError && planError.code !== 'PGRST116') {
          console.error('Error fetching plan:', planError);
        }

        const typedPlan = plan as AccountingPlan | null;
        const fieldMappings = typedPlan?.ocr_field_mappings?.[statement_type || 'balance_sheet'] || {};

        const extractionPrompt = `Extrae TODOS los datos numéricos de este ${statement_type === 'balance_sheet' ? 'Balance de Situación' : statement_type === 'income_statement' ? 'Cuenta de Pérdidas y Ganancias' : 'Estado Financiero'}.

PLAN CONTABLE: ${typedPlan?.plan_name || 'Genérico'} (${typedPlan?.plan_code || 'N/A'})
PAÍS: ${typedPlan?.country_name || 'Desconocido'}

CAMPOS A BUSCAR:
${Object.entries(fieldMappings).map(([key, aliases]) => `- ${key}: buscar "${(aliases as string[]).join('", "')}"`).join('\n')}

INSTRUCCIONES:
1. Extrae TODOS los importes numéricos que encuentres
2. Mantén la estructura jerárquica del documento
3. Identifica el ejercicio/período al que corresponden los datos
4. Detecta si hay datos de ejercicios anteriores para comparación

Responde ÚNICAMENTE con un JSON válido:
{
  "fiscal_year": "2024",
  "period_end_date": "YYYY-MM-DD",
  "currency": "EUR",
  "data": {
    "assets": {
      "non_current": {
        "intangible_assets": 0,
        "tangible_assets": 0,
        "financial_investments": 0,
        "total": 0
      },
      "current": {
        "inventory": 0,
        "trade_receivables": 0,
        "cash_equivalents": 0,
        "total": 0
      },
      "total": 0
    },
    "equity_and_liabilities": {
      "equity": {
        "share_capital": 0,
        "reserves": 0,
        "retained_earnings": 0,
        "total": 0
      },
      "non_current_liabilities": {
        "bank_loans": 0,
        "total": 0
      },
      "current_liabilities": {
        "trade_payables": 0,
        "tax_liabilities": 0,
        "total": 0
      },
      "total": 0
    },
    "income_statement": {
      "revenue": 0,
      "cost_of_sales": 0,
      "gross_profit": 0,
      "operating_expenses": 0,
      "operating_profit": 0,
      "financial_result": 0,
      "profit_before_tax": 0,
      "tax_expense": 0,
      "net_profit": 0
    }
  },
  "prior_year_data": null,
  "validation": {
    "balance_check": true,
    "assets_equals_liabilities": true,
    "errors": []
  },
  "raw_line_items": []
}`;

        const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [
          { role: 'system', content: 'Eres un experto en contabilidad y OCR de estados financieros. Extraes datos con precisión y validas la coherencia de los importes.' }
        ];

        if (file_base64) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: extractionPrompt },
              { type: 'image_url', image_url: { url: `data:application/pdf;base64,${file_base64}` } }
            ]
          });
        } else {
          messages.push({ role: 'user', content: extractionPrompt });
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages,
            temperature: 0.2,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No JSON found' };
        } catch {
          result = { error: 'Parse error', raw: content };
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'extract',
          data: result,
          plan_used: typedPlan ? { id: typedPlan.id, name: typedPlan.plan_name, country: typedPlan.country_code } : null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'map_accounts': {
        // Mapear los datos extraídos a las cuentas del plan contable
        const { extracted_data, country_code, plan_code } = params;

        // Obtener el plan contable
        let query = supabase
          .from('erp_accounting_plans')
          .select('*')
          .eq('is_active', true);
        
        if (country_code) {
          query = query.eq('country_code', country_code);
        }
        if (plan_code) {
          query = query.eq('plan_code', plan_code);
        } else {
          query = query.eq('is_default', true);
        }

        const { data: plan } = await query.single();
        const typedPlan = plan as AccountingPlan | null;

        const mappingPrompt = `Mapea los siguientes datos financieros extraídos a las cuentas contables del ${typedPlan?.plan_name || 'Plan General de Contabilidad'}.

DATOS EXTRAÍDOS:
${JSON.stringify(extracted_data, null, 2)}

GRUPOS DE CUENTAS DEL PLAN:
ACTIVO: ${JSON.stringify(typedPlan?.asset_groups || [])}
PASIVO: ${JSON.stringify(typedPlan?.liability_groups || [])}
PATRIMONIO: ${JSON.stringify(typedPlan?.equity_groups || [])}
INGRESOS: ${JSON.stringify(typedPlan?.income_groups || [])}
GASTOS: ${JSON.stringify(typedPlan?.expense_groups || [])}

INSTRUCCIONES:
1. Asigna cada importe a su cuenta contable correspondiente
2. Usa los códigos de cuenta estándar del plan
3. Indica el nivel de confianza del mapeo

Responde con JSON:
{
  "mapped_accounts": [
    {
      "account_code": "210",
      "account_name": "Terrenos y bienes naturales",
      "amount": 0,
      "sign": "debit|credit",
      "confidence": 0-100,
      "source_field": "campo original"
    }
  ],
  "unmapped_items": [],
  "total_debit": 0,
  "total_credit": 0,
  "is_balanced": true
}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un experto en contabilidad que mapea datos financieros a cuentas contables según los planes oficiales de cada país.' },
              { role: 'user', content: mappingPrompt }
            ],
            temperature: 0.2,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No JSON found' };
        } catch {
          result = { error: 'Parse error', raw: content };
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'map_accounts',
          data: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_entries': {
        // Generar asientos contables de apertura a partir de los datos mapeados
        const { extracted_data, company_id, fiscal_year_id } = params;

        const entriesPrompt = `Genera los asientos contables de apertura basándote en los siguientes datos del balance:

DATOS MAPEADOS:
${JSON.stringify(extracted_data, null, 2)}

INSTRUCCIONES:
1. Crea un asiento de apertura con todas las cuentas
2. Las cuentas de activo van al DEBE
3. Las cuentas de pasivo y patrimonio neto van al HABER
4. El asiento debe estar cuadrado

Responde con JSON:
{
  "entries": [
    {
      "entry_type": "opening",
      "description": "Asiento de apertura del ejercicio",
      "date": "YYYY-01-01",
      "lines": [
        {
          "account_code": "210",
          "account_name": "Terrenos",
          "debit": 0,
          "credit": 0,
          "description": ""
        }
      ],
      "total_debit": 0,
      "total_credit": 0,
      "is_balanced": true
    }
  ],
  "summary": {
    "total_entries": 1,
    "total_lines": 0,
    "all_balanced": true
  }
}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un contable experto que genera asientos contables precisos y bien cuadrados.' },
              { role: 'user', content: entriesPrompt }
            ],
            temperature: 0.1,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No JSON found' };
        } catch {
          result = { error: 'Parse error', raw: content };
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'generate_entries',
          data: result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze': {
        // Análisis completo: detectar + extraer + mapear + generar
        const { file_base64, company_id, fiscal_year_id, statement_type } = params;

        // Paso 1: Detectar plan contable
        console.log('[erp-financial-statement-ocr] Step 1: Detecting plan...');
        
        const { data: plans } = await supabase
          .from('erp_accounting_plans')
          .select('*')
          .eq('is_active', true);

        const detectPrompt = `Analiza este documento financiero y detecta el país, plan contable y tipo de estado financiero.

PLANES DISPONIBLES:
${(plans as AccountingPlan[] || []).map(p => `- ${p.country_code}: ${p.plan_name}`).join('\n')}

Responde con JSON:
{
  "detected_country": "ES",
  "detected_plan": "PGC_2007",
  "statement_type": "balance_sheet",
  "confidence": 85
}`;

        const detectResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Experto en contabilidad internacional.' },
              { 
                role: 'user', 
                content: file_base64 
                  ? [
                      { type: 'text', text: detectPrompt },
                      { type: 'image_url', image_url: { url: `data:application/pdf;base64,${file_base64}` } }
                    ]
                  : detectPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        const detectData = await detectResponse.json();
        const detectContent = detectData.choices?.[0]?.message?.content || '{}';
        let detection;
        try {
          const jsonMatch = detectContent.match(/\{[\s\S]*\}/);
          detection = jsonMatch ? JSON.parse(jsonMatch[0]) : { detected_country: 'ES', detected_plan: 'PGC_2007' };
        } catch {
          detection = { detected_country: 'ES', detected_plan: 'PGC_2007' };
        }

        console.log('[erp-financial-statement-ocr] Detection result:', detection);

        // Paso 2: Extraer datos usando el plan detectado
        console.log('[erp-financial-statement-ocr] Step 2: Extracting data...');
        
        const { data: selectedPlan } = await supabase
          .from('erp_accounting_plans')
          .select('*')
          .eq('country_code', detection.detected_country)
          .eq('is_default', true)
          .single();

        const typedSelectedPlan = selectedPlan as AccountingPlan | null;

        const extractPrompt = `Extrae TODOS los datos de este ${detection.statement_type === 'balance_sheet' ? 'Balance' : 'Estado Financiero'} usando el ${typedSelectedPlan?.plan_name || 'plan contable estándar'}.

Responde con JSON estructurado con los datos completos del documento.`;

        const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Extrae datos financieros con precisión.' },
              { 
                role: 'user', 
                content: file_base64 
                  ? [
                      { type: 'text', text: extractPrompt },
                      { type: 'image_url', image_url: { url: `data:application/pdf;base64,${file_base64}` } }
                    ]
                  : extractPrompt
              }
            ],
            temperature: 0.2,
            max_tokens: 4000,
          }),
        });

        const extractData = await extractResponse.json();
        const extractContent = extractData.choices?.[0]?.message?.content || '{}';
        let extraction;
        try {
          const jsonMatch = extractContent.match(/\{[\s\S]*\}/);
          extraction = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch {
          extraction = { raw: extractContent };
        }

        console.log('[erp-financial-statement-ocr] Extraction complete');

        return new Response(JSON.stringify({
          success: true,
          action: 'analyze',
          data: {
            detection,
            extraction,
            plan: typedSelectedPlan ? {
              id: typedSelectedPlan.id,
              name: typedSelectedPlan.plan_name,
              country: typedSelectedPlan.country_name,
              code: typedSelectedPlan.plan_code
            } : null
          },
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Action not supported: ${action}`);
    }

  } catch (error) {
    console.error('[erp-financial-statement-ocr] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
