import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleGenerationRequest {
  cnae_code: string;
  custom_name?: string;
  organization_id?: string;
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

    const { cnae_code, custom_name, organization_id } = await req.json() as ModuleGenerationRequest;
    
    if (!cnae_code) {
      return new Response(JSON.stringify({ error: 'CNAE code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Generating module for CNAE: ${cnae_code}`);

    // Step 1: Check if sector_chart_of_accounts already has config for this CNAE
    const { data: existingSectorChart } = await supabase
      .from('sector_chart_of_accounts')
      .select('*')
      .contains('cnae_codes', [cnae_code])
      .single();

    // Step 2: Look up CNAE in mapping table
    const { data: cnaeMapping } = await supabase
      .from('cnae_sector_mapping')
      .select('*')
      .eq('cnae_code', cnae_code)
      .single();

    let sector = '';
    let sectorName = '';
    let defaultKpis: string[] = [];
    let defaultRegulations: string[] = [];
    let aiGenerated = false;
    let aiRegulationsData: any = null;
    let sectorChartData: any = null;

    if (existingSectorChart) {
      // Use existing sector chart configuration
      sector = existingSectorChart.sector_key;
      sectorName = existingSectorChart.sector_name;
      sectorChartData = existingSectorChart;
      console.log(`Using existing sector chart: ${sector}`);
    } else if (cnaeMapping) {
      sector = cnaeMapping.sector;
      sectorName = cnaeMapping.sector_name;
      defaultKpis = cnaeMapping.default_kpis || [];
      defaultRegulations = cnaeMapping.default_regulations || [];
      console.log(`Found CNAE mapping: ${sector} - ${sectorName}`);
    } else {
      console.log('CNAE not in mapping, using AI to generate full accounting plan...');
      aiGenerated = true;
      
      if (!lovableApiKey) {
        return new Response(JSON.stringify({ 
          error: 'CNAE not found in mapping and AI API key not configured' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // AI call to generate complete sector accounting plan
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          max_tokens: 8000,
          messages: [
            {
              role: 'system',
              content: `Eres un experto en contabilidad sectorial española (PGC 2007) y análisis financiero.
Dado un código CNAE, debes generar un PLAN CONTABLE COMPLETO adaptado al sector, incluyendo:

1. ESTRUCTURA DE CUENTAS: Grupos contables relevantes y cuentas críticas según PGC
2. RATIOS FINANCIEROS: Fórmulas específicas del sector con pesos y rangos óptimos
3. MODELO Z-SCORE: Coeficientes apropiados (Altman Original para industria, Altman Services para servicios, Zmijewski para retail)
4. BENCHMARKS SECTORIALES: Rangos min/max/óptimo basados en datos reales del sector español
5. NORMATIVAS: Regulaciones BOE/DOUE aplicables
6. REGLAS DE CUMPLIMIENTO: Requisitos contables específicos

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "sector_key": "codigo_sector_snake_case",
  "sector_name": "Nombre del Sector en Español",
  "cnae_codes": ["${cnae_code}"],
  "account_structure": {
    "groups": ["Grupo 1", "Grupo 2", "Grupo 3"],
    "critical_accounts": ["100", "200", "300", "400", "572"]
  },
  "ratio_definitions": {
    "ratio_key": {
      "formula": "numerator / denominator",
      "weight": 1.0,
      "optimal_range": [0.5, 1.5]
    }
  },
  "zscore_model": "altman_original|altman_services|zmijewski",
  "zscore_coefficients": {
    "a": 1.2,
    "b": 1.4,
    "c": 3.3,
    "d": 0.6,
    "e": 1.0,
    "thresholds": {
      "safe": 2.99,
      "grey_upper": 2.99,
      "grey_lower": 1.81,
      "distress": 1.81
    }
  },
  "benchmark_ranges": {
    "current_ratio": {"min": 1.0, "max": 2.0, "optimal": 1.5},
    "debt_ratio": {"min": 0.3, "max": 0.6, "optimal": 0.45}
  },
  "compliance_rules": {
    "pgc_compliance": true,
    "inventory_valuation": "FIFO|LIFO|weighted_average",
    "depreciation_methods": ["linear", "declining_balance"]
  },
  "tax_implications": {
    "vat_regime": "general|simplified|special",
    "special_deductions": []
  },
  "official_regulations": [
    {
      "name": "Nombre normativa",
      "source": "BOE/DOUE",
      "reference": "BOE-A-XXXX-XXXXX",
      "url": "https://www.boe.es/...",
      "effective_date": "2023-01-01",
      "is_mandatory": true,
      "summary": "Breve descripción",
      "requirements": ["Requisito 1", "Requisito 2"]
    }
  ],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"],
  "visit_form_fields": ["Campo 1", "Campo 2"]
}`
            },
            {
              role: 'user',
              content: `Genera el plan contable completo para el código CNAE ${cnae_code}. 
Incluye ratios financieros específicos del sector, modelo Z-Score apropiado con coeficientes ajustados, 
benchmarks basados en datos reales del sector español, y normativas oficiales del BOE/DOUE aplicables.
Asegúrate de que los coeficientes Z-Score estén calibrados para el sector específico.`
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

      sector = aiParsed.sector_key || `sector_${cnae_code}`;
      sectorName = aiParsed.sector_name || `Sector CNAE ${cnae_code}`;
      defaultKpis = aiParsed.kpis || [];
      defaultRegulations = (aiParsed.official_regulations || []).map((r: any) => r.name);
      aiRegulationsData = aiParsed.official_regulations || [];

      // Step 3: Save to sector_chart_of_accounts (atomic sync source)
      const { data: newSectorChart, error: sectorChartError } = await supabase
        .from('sector_chart_of_accounts')
        .upsert({
          sector_key: sector,
          sector_name: sectorName,
          cnae_codes: aiParsed.cnae_codes || [cnae_code],
          account_structure: aiParsed.account_structure || { groups: [], critical_accounts: [] },
          ratio_definitions: aiParsed.ratio_definitions || {},
          zscore_model: aiParsed.zscore_model || 'altman_original',
          zscore_coefficients: aiParsed.zscore_coefficients || {
            a: 1.2, b: 1.4, c: 3.3, d: 0.6, e: 1.0,
            thresholds: { safe: 2.99, grey_upper: 2.99, grey_lower: 1.81, distress: 1.81 }
          },
          benchmark_ranges: aiParsed.benchmark_ranges || {},
          compliance_rules: aiParsed.compliance_rules || {},
          tax_implications: aiParsed.tax_implications || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'sector_key'
        })
        .select()
        .single();

      if (sectorChartError) {
        console.error('Error saving sector chart:', sectorChartError);
      } else {
        sectorChartData = newSectorChart;
        console.log(`Created/updated sector_chart_of_accounts: ${sector}`);
      }

      // Save the new mapping to cnae_sector_mapping
      await supabase.from('cnae_sector_mapping').upsert({
        cnae_code: cnae_code,
        sector: sector,
        sector_name: sectorName,
        cnae_description: `Sector ${sectorName}`,
        default_kpis: defaultKpis,
        default_regulations: defaultRegulations
      }, {
        onConflict: 'cnae_code'
      });
    }

    // Step 4: Create official regulation documents in organization_compliance_documents
    const createdRegulations: any[] = [];
    
    if (aiRegulationsData && aiRegulationsData.length > 0) {
      console.log(`Creating ${aiRegulationsData.length} official regulation documents...`);
      
      for (const reg of aiRegulationsData) {
        const { data: regDoc, error: regError } = await supabase
          .from('organization_compliance_documents')
          .insert({
            organization_id: organization_id || null,
            document_type: 'official_regulation',
            title: reg.name,
            description: reg.summary || null,
            sector: sector,
            sector_key: sector,
            regulation_source: reg.source || 'BOE',
            effective_date: reg.effective_date || null,
            is_mandatory: reg.is_mandatory !== false,
            requires_acknowledgment: reg.is_mandatory !== false,
            status: 'active',
            metadata: {
              reference: reg.reference,
              url: reg.url,
              cnae_code: cnae_code,
              ai_generated: true
            }
          })
          .select()
          .single();

        if (regDoc) {
          createdRegulations.push(regDoc);
          
          // Create compliance requirements for each regulation
          if (reg.requirements && reg.requirements.length > 0) {
            for (let i = 0; i < reg.requirements.length; i++) {
              await supabase.from('compliance_requirements').insert({
                document_id: regDoc.id,
                organization_id: organization_id || null,
                requirement_key: `${sector}_req_${i + 1}`,
                requirement_title: reg.requirements[i],
                requirement_description: `Requisito derivado de ${reg.name}`,
                category: 'regulatory',
                priority: reg.is_mandatory ? 'high' : 'medium',
                status: 'pending'
              });
            }
          }
        }
      }
    }

    // Step 5: Retrieve sector regulations from sector_regulations table
    const { data: sectorRegulations } = await supabase
      .from('sector_regulations')
      .select('*')
      .eq('sector', sector);

    // Step 6: Generate module specification
    const moduleKey = custom_name 
      ? custom_name.toLowerCase().replace(/\s+/g, '_')
      : `mod_${sector}_${cnae_code}`;
    
    const moduleName = custom_name || `Módulo ${sectorName}`;

    // Get accounting ratios from sector chart or defaults
    const accountingRatios = sectorChartData ? {
      z_score_model: sectorChartData.zscore_model,
      z_score_coefficients: sectorChartData.zscore_coefficients,
      sector_benchmarks: sectorChartData.benchmark_ranges,
      ratio_definitions: sectorChartData.ratio_definitions
    } : {
      z_score_model: 'altman_original',
      z_score_coefficients: {
        a: 1.2, b: 1.4, c: 3.3, d: 0.6, e: 1.0,
        thresholds: { safe: 2.99, grey_upper: 2.99, grey_lower: 1.81, distress: 1.81 }
      },
      sector_benchmarks: {
        current_ratio: { min: 1.0, max: 2.0, optimal: 1.5 },
        debt_ratio: { min: 0.3, max: 0.6, optimal: 0.45 }
      },
      ratio_definitions: {}
    };

    // Build components array
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
        component_key: 'sector_accounting',
        component_name: `Contabilidad ${sectorName}`,
        config: {
          account_structure: sectorChartData?.account_structure || null,
          ratio_definitions: accountingRatios.ratio_definitions,
          zscore_model: accountingRatios.z_score_model,
          benchmarks: accountingRatios.sector_benchmarks
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
        component_name: `Panel Compliance ${sectorName}`,
        config: {
          regulations: defaultRegulations,
          official_documents: createdRegulations.map(r => r.id),
          auto_checks: true,
          acknowledgment_required: true
        }
      },
      {
        component_key: 'sector_analytics',
        component_name: `Análisis ${sectorName}`,
        config: {
          ratios: true,
          benchmarks: true,
          z_score: true,
          z_score_coefficients: accountingRatios.z_score_coefficients
        }
      }
    ];

    // Build regulations array
    const regulations = [
      ...defaultRegulations.map((reg: string) => ({
        name: reg,
        source: aiGenerated ? 'ai_boe_doue' : 'cnae_mapping',
        mandatory: true
      })),
      ...(sectorRegulations || []).map((reg: any) => ({
        name: reg.regulation_name,
        source: 'sector_regulations',
        mandatory: reg.mandatory || false,
        compliance_deadline: reg.compliance_deadline
      }))
    ];

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
      official_document_ids: createdRegulations.map(r => r.id),
      check_frequency: 'monthly',
      alert_threshold: 0.8,
      auto_report: true,
      acknowledgment_workflow: true
    };

    // Step 7: Save to generated_modules table
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
          source: aiGenerated ? 'ai_gemini_sector_chart' : 'cnae_mapping',
          cnae_code: cnae_code,
          official_regulations_created: createdRegulations.length,
          sector_chart_id: sectorChartData?.id || null
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

    console.log(`Successfully generated module: ${moduleKey} with ${createdRegulations.length} official regulations`);

    return new Response(JSON.stringify({
      success: true,
      module: generatedModule,
      sector_chart: sectorChartData,
      official_regulations_created: createdRegulations.length,
      message: `Módulo "${moduleName}" generado correctamente para CNAE ${cnae_code} con plan contable sectorial y ${createdRegulations.length} normativas oficiales`
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
