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
    let aiRegulationsData: any = null;

    if (cnaeMapping) {
      sector = cnaeMapping.sector;
      sectorName = cnaeMapping.sector_name;
      defaultKpis = cnaeMapping.default_kpis || [];
      defaultRegulations = cnaeMapping.default_regulations || [];
      console.log(`Found CNAE mapping: ${sector} - ${sectorName}`);
    } else {
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

      // AI call to identify sector AND search official regulations
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          max_tokens: 6000,
          messages: [
            {
              role: 'system',
              content: `Eres un experto en clasificación económica CNAE de España y normativa bancaria/empresarial europea.
Dado un código CNAE, debes:
1. Identificar el sector económico más cercano
2. BUSCAR y listar normativas oficiales aplicables del BOE (Boletín Oficial del Estado) y DOUE (Diario Oficial UE)
3. Incluir referencias reales a leyes, reales decretos, directivas UE
4. Definir KPIs específicos del sector
5. Proporcionar ratios contables específicos para análisis Z-Score sectorial

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "sector": "codigo_sector_snake_case",
  "sector_name": "Nombre del Sector",
  "description": "Descripción del sector",
  "official_regulations": [
    {
      "name": "Nombre completo de la normativa",
      "source": "BOE/DOUE",
      "reference": "Referencia oficial (ej: BOE-A-2023-12345)",
      "url": "https://www.boe.es/...",
      "effective_date": "2023-01-01",
      "is_mandatory": true,
      "summary": "Breve resumen de la normativa",
      "requirements": ["Requisito 1", "Requisito 2"]
    }
  ],
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
              content: `Analiza el código CNAE ${cnae_code} y genera la configuración completa del módulo sectorial, incluyendo normativas oficiales reales del BOE y DOUE aplicables a este sector.`
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

      sector = aiParsed.sector || `sector_${cnae_code}`;
      sectorName = aiParsed.sector_name || `Sector CNAE ${cnae_code}`;
      defaultKpis = aiParsed.kpis || [];
      defaultRegulations = (aiParsed.official_regulations || []).map((r: any) => r.name);
      aiRegulationsData = aiParsed.official_regulations || [];

      // Save the new mapping
      await supabase.from('cnae_sector_mapping').insert({
        cnae_code: cnae_code,
        sector: sector,
        sector_name: sectorName,
        cnae_description: aiParsed.description || null,
        default_kpis: defaultKpis,
        default_regulations: defaultRegulations
      });
    }

    // Step 2: Create official regulation documents in organization_compliance_documents
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

    // Step 3: Retrieve sector regulations from sector_regulations table
    const { data: sectorRegulations } = await supabase
      .from('sector_regulations')
      .select('*')
      .eq('sector', sector);

    // Step 4: Generate module specification
    const moduleKey = custom_name 
      ? custom_name.toLowerCase().replace(/\s+/g, '_')
      : `mod_${sector}_${cnae_code}`;
    
    const moduleName = custom_name || `Módulo ${sectorName}`;

    // Build components array - includes compliance panel
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
          z_score: true
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

    // Build compliance panel config - includes official regulations
    const compliancePanelConfig = {
      regulations: defaultRegulations,
      official_document_ids: createdRegulations.map(r => r.id),
      check_frequency: 'monthly',
      alert_threshold: 0.8,
      auto_report: true,
      acknowledgment_workflow: true
    };

    // Step 5: Save to generated_modules table
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
          source: aiGenerated ? 'ai_gemini_boe_doue' : 'cnae_mapping',
          cnae_code: cnae_code,
          official_regulations_created: createdRegulations.length
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
      official_regulations_created: createdRegulations.length,
      message: `Módulo "${moduleName}" generado correctamente para CNAE ${cnae_code} con ${createdRegulations.length} normativas oficiales`
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
