import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleGenerationRequest {
  cnae_code: string;
  custom_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { cnae_code, custom_name } = await req.json() as ModuleGenerationRequest;
    
    if (!cnae_code) {
      return new Response(JSON.stringify({ error: 'CNAE code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Generating module for CNAE: ${cnae_code}`);

    // Step 1: Look up CNAE in mapping table
    const { data: cnaeMapping, error: cnaeMappingError } = await supabase
      .from('cnae_sector_mapping')
      .select('*')
      .eq('cnae_code', cnae_code)
      .single();

    let sector = '';
    let sectorName = '';
    let defaultKpis: string[] = [];
    let defaultRegulations: string[] = [];
    let aiGenerated = false;

    if (cnaeMapping) {
      // CNAE found in mapping
      sector = cnaeMapping.sector;
      sectorName = cnaeMapping.sector_name;
      defaultKpis = cnaeMapping.default_kpis || [];
      defaultRegulations = cnaeMapping.default_regulations || [];
      console.log(`Found CNAE mapping: ${sector} - ${sectorName}`);
    } else {
      // CNAE not found - use AI to identify sector
      console.log('CNAE not in mapping, using AI to identify sector...');
      aiGenerated = true;
      
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ 
          error: 'CNAE not found in mapping and AI API key not configured' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          max_tokens: 4000,
          messages: [
            {
              role: 'system',
              content: `Eres un experto en clasificación económica CNAE de España. Dado un código CNAE, debes:
1. Identificar el sector económico más cercano
2. Proporcionar regulaciones aplicables buscando en BOE (Boletín Oficial del Estado) y DOUE
3. Definir KPIs específicos del sector
4. Proporcionar ratios contables específicos para análisis Z-Score sectorial

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "sector": "codigo_sector_snake_case",
  "sector_name": "Nombre del Sector",
  "description": "Descripción del sector",
  "regulations": ["Regulación 1", "Regulación 2"],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"],
  "accounting_ratios": {
    "z_score_coefficients": {
      "working_capital_ta": 1.2,
      "retained_earnings_ta": 1.4,
      "ebit_ta": 3.3,
      "equity_tl": 0.6,
      "sales_ta": 1.0
    },
    "sector_benchmarks": {
      "liquidity_ratio": 1.5,
      "debt_ratio": 0.4,
      "roe": 0.12
    }
  },
  "visit_form_fields": ["Campo 1", "Campo 2"],
  "compliance_checks": ["Check 1", "Check 2"]
}`
            },
            {
              role: 'user',
              content: `Analiza el código CNAE ${cnae_code} y genera la configuración completa del módulo sectorial.`
            }
          ]
        })
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', errorText);
        return new Response(JSON.stringify({ 
          error: 'AI service error', 
          details: errorText 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content;
      
      if (!aiContent) {
        return new Response(JSON.stringify({ error: 'No AI response content' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Parse AI response
      let aiParsed;
      try {
        const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiParsed = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiContent);
        return new Response(JSON.stringify({ 
          error: 'Failed to parse AI response',
          raw_response: aiContent 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      sector = aiParsed.sector || `sector_${cnae_code}`;
      sectorName = aiParsed.sector_name || `Sector CNAE ${cnae_code}`;
      defaultKpis = aiParsed.kpis || [];
      defaultRegulations = aiParsed.regulations || [];

      // Also save the new mapping for future use
      await supabase.from('cnae_sector_mapping').insert({
        cnae_code: cnae_code,
        sector: sector,
        sector_name: sectorName,
        cnae_description: aiParsed.description || null,
        default_kpis: defaultKpis,
        default_regulations: defaultRegulations
      });
    }

    // Step 2: Retrieve sector regulations from sector_regulations table
    const { data: sectorRegulations } = await supabase
      .from('sector_regulations')
      .select('*')
      .eq('sector', sector);

    // Step 3: Generate module specification
    const moduleKey = custom_name 
      ? custom_name.toLowerCase().replace(/\s+/g, '_')
      : `mod_${sector}_${cnae_code}`;
    
    const moduleName = custom_name || `Módulo ${sectorName}`;

    // Build components array based on sector
    const components = [
      {
        component_key: 'sector_dashboard',
        component_name: `Dashboard ${sectorName}`,
        config: {
          kpis: defaultKpis,
          charts: ['revenue_trend', 'performance_gauge', 'comparison_chart']
        }
      },
      {
        component_key: 'sector_visit_form',
        component_name: `Ficha Visita ${sectorName}`,
        config: {
          custom_fields: defaultKpis.slice(0, 5),
          validations: true
        }
      },
      {
        component_key: 'sector_compliance',
        component_name: `Compliance ${sectorName}`,
        config: {
          regulations: defaultRegulations,
          auto_checks: true
        }
      },
      {
        component_key: 'sector_analytics',
        component_name: `Análisis ${sectorName}`,
        config: {
          ratios: true,
          benchmarks: true,
          z_score: true
        }
      }
    ];

    // Build regulations array
    const regulations = [
      ...defaultRegulations.map((reg: string) => ({
        name: reg,
        source: 'cnae_mapping',
        mandatory: true
      })),
      ...(sectorRegulations || []).map((reg: any) => ({
        name: reg.regulation_name,
        source: 'sector_regulations',
        mandatory: reg.mandatory || false,
        compliance_deadline: reg.compliance_deadline
      }))
    ];

    // Build accounting ratios
    const accountingRatios = {
      z_score_coefficients: {
        working_capital_ta: 1.2,
        retained_earnings_ta: 1.4,
        ebit_ta: 3.3,
        equity_tl: 0.6,
        sales_ta: 1.0
      },
      sector_benchmarks: {
        liquidity_ratio: 1.5,
        debt_ratio: 0.4,
        roe: 0.12,
        roa: 0.08
      }
    };

    // Build visit form config
    const visitFormConfig = {
      custom_fields: defaultKpis.slice(0, 8).map((kpi: string, idx: number) => ({
        field_key: `kpi_${idx + 1}`,
        field_label: kpi,
        field_type: 'number',
        required: idx < 3
      })),
      sections: [
        { key: 'general', label: 'Información General' },
        { key: 'financial', label: 'Datos Financieros' },
        { key: 'compliance', label: 'Cumplimiento Normativo' },
        { key: 'opportunities', label: 'Oportunidades' }
      ]
    };

    // Build compliance panel config
    const compliancePanelConfig = {
      regulations: defaultRegulations,
      check_frequency: 'monthly',
      alert_threshold: 0.8,
      auto_report: true
    };

    // Step 4: Save to generated_modules table
    const { data: generatedModule, error: insertError } = await supabase
      .from('generated_modules')
      .insert({
        cnae_code: cnae_code,
        module_key: moduleKey,
        module_name: moduleName,
        sector: sector,
        sector_name: sectorName,
        description: `Módulo generado automáticamente para el sector ${sectorName} (CNAE ${cnae_code})`,
        components: components,
        regulations: regulations,
        kpis: defaultKpis,
        accounting_ratios: accountingRatios,
        visit_form_config: visitFormConfig,
        compliance_panel_config: compliancePanelConfig,
        ai_generated: aiGenerated,
        generation_metadata: {
          generated_at: new Date().toISOString(),
          source: aiGenerated ? 'ai_gemini' : 'cnae_mapping',
          cnae_code: cnae_code
        },
        is_published: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving generated module:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save generated module',
        details: insertError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Successfully generated module: ${moduleKey}`);

    return new Response(JSON.stringify({
      success: true,
      module: generatedModule,
      message: `Módulo "${moduleName}" generado correctamente para CNAE ${cnae_code}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in generate-module-from-cnae:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
