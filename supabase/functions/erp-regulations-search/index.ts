import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegulationSearchRequest {
  action: 'search_and_update' | 'get_regulations' | 'check_updates';
  country_code: string;
  company_id?: string;
  category?: string;
}

// Configuración de fuentes por país
const COUNTRY_SOURCES: Record<string, { name: string; sources: string[]; regulators: string[] }> = {
  AD: {
    name: 'Andorra',
    sources: ['BOPA (Butlletí Oficial del Principat d\'Andorra)', 'Govern d\'Andorra', 'AFA (Autoritat Financera Andorrana)'],
    regulators: ['Ministeri de Finances', 'AFA', 'INAF']
  },
  ES: {
    name: 'España',
    sources: ['BOE (Boletín Oficial del Estado)', 'AEAT', 'ICAC', 'Banco de España'],
    regulators: ['Ministerio de Hacienda', 'AEAT', 'ICAC', 'CNMV']
  },
  FR: {
    name: 'Francia',
    sources: ['Journal Officiel', 'Légifrance', 'Direction Générale des Finances Publiques'],
    regulators: ['Ministère de l\'Économie', 'ANC (Autorité des Normes Comptables)', 'AMF']
  },
  DE: {
    name: 'Alemania',
    sources: ['Bundesgesetzblatt', 'Bundesanzeiger', 'Bundesministerium der Finanzen'],
    regulators: ['Bundesfinanzministerium', 'DRSC', 'BaFin']
  },
  PT: {
    name: 'Portugal',
    sources: ['Diário da República', 'Portal das Finanças', 'CMVM'],
    regulators: ['Ministério das Finanças', 'Autoridade Tributária', 'CNC']
  },
  UK: {
    name: 'Reino Unido',
    sources: ['legislation.gov.uk', 'HMRC', 'FRC'],
    regulators: ['HMRC', 'FCA', 'FRC']
  },
  US: {
    name: 'Estados Unidos',
    sources: ['Federal Register', 'IRS', 'SEC', 'FASB'],
    regulators: ['IRS', 'SEC', 'FASB', 'PCAOB']
  },
  MX: {
    name: 'México',
    sources: ['DOF (Diario Oficial de la Federación)', 'SAT', 'CNBV'],
    regulators: ['SAT', 'SHCP', 'CINIF', 'CNBV']
  },
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, country_code, company_id, category } = await req.json() as RegulationSearchRequest;

    console.log(`[erp-regulations-search] Action: ${action}, Country: ${country_code}`);

    const countryConfig = COUNTRY_SOURCES[country_code] || COUNTRY_SOURCES['ES'];

    if (action === 'search_and_update') {
      // Obtener normativas existentes para comparar
      const { data: existingRegulations } = await supabase
        .from('erp_accounting_regulations')
        .select('regulation_code, updated_at')
        .eq('country_code', country_code)
        .eq('is_active', true);

      const existingCodes = new Set((existingRegulations || []).map(r => r.regulation_code));

      // Construir prompt para búsqueda de normativas
      const systemPrompt = `Eres un experto en normativa contable, fiscal y mercantil de ${countryConfig.name}.

Tu tarea es proporcionar información actualizada sobre las normativas que afectan a la contabilidad empresarial.

FUENTES OFICIALES A CONSULTAR:
${countryConfig.sources.map(s => `- ${s}`).join('\n')}

ORGANISMOS REGULADORES:
${countryConfig.regulators.map(r => `- ${r}`).join('\n')}

CATEGORÍAS DE NORMATIVAS:
- Impuestos directos (IRPF, IS, equivalentes locales)
- Impuestos indirectos (IVA, IGI, equivalentes)
- Plan General Contable / Normas de contabilidad
- Facturación electrónica y requisitos de facturación
- Libros contables obligatorios
- Auditoría y cuentas anuales
- Prevención de blanqueo de capitales
- Protección de datos en contexto contable
- Seguridad Social y obligaciones laborales
- Obligaciones mercantiles

FORMATO DE RESPUESTA (JSON estricto):
{
  "regulations": [
    {
      "regulation_code": "Código oficial único (ej: Ley 27/2014, RD 1619/2012)",
      "regulation_type": "law|standard|decree|circular|guideline",
      "title": "Título oficial completo",
      "description": "Descripción breve (2-3 líneas)",
      "content_markdown": "Contenido detallado en markdown con secciones relevantes para contabilidad",
      "effective_date": "YYYY-MM-DD",
      "category": "Categoría (de la lista anterior)",
      "tags": ["tag1", "tag2"],
      "source_url": "URL oficial si está disponible"
    }
  ],
  "summary": "Resumen de las normativas encontradas",
  "last_updates": "Descripción de cambios recientes"
}`;

      const userPrompt = `Proporciona una lista completa y actualizada de todas las normativas contables, fiscales y mercantiles vigentes en ${countryConfig.name} que afectan a empresas.

${category ? `Enfócate especialmente en la categoría: ${category}` : 'Incluye todas las categorías relevantes.'}

Para cada normativa incluye:
1. El código oficial exacto
2. El tipo (ley, norma, decreto, circular, guía)
3. Título oficial
4. Descripción práctica de cómo afecta a la contabilidad
5. Contenido detallado con los puntos más relevantes (tipos impositivos, plazos, obligaciones, etc.)
6. Fecha de entrada en vigor
7. Categoría y etiquetas relevantes

Asegúrate de incluir las últimas modificaciones y actualizaciones normativas.
Fecha actual: ${new Date().toISOString().split('T')[0]}`;

      console.log('[erp-regulations-search] Calling Lovable AI for regulation search...');

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
            error: 'Rate limit exceeded. Please try again later.' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ 
            success: false,
            error: 'Payment required. Please add credits to continue.' 
          }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`AI API error: ${response.status}`);
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content;

      if (!content) throw new Error('No content in AI response');

      // Parsear respuesta JSON
      let parsedResult;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('[erp-regulations-search] JSON parse error:', parseError);
        throw new Error('Failed to parse AI response');
      }

      const regulations = parsedResult.regulations || [];
      let newCount = 0;
      let updatedCount = 0;

      // Insertar o actualizar normativas
      for (const reg of regulations) {
        const regulationData = {
          country_code,
          regulation_type: reg.regulation_type || 'standard',
          regulation_code: reg.regulation_code,
          title: reg.title,
          description: reg.description || '',
          content_markdown: reg.content_markdown || '',
          effective_date: reg.effective_date || new Date().toISOString().split('T')[0],
          source_url: reg.source_url || null,
          tags: reg.tags || [],
          category: reg.category || 'General',
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        if (existingCodes.has(reg.regulation_code)) {
          // Actualizar existente
          const { error: updateError } = await supabase
            .from('erp_accounting_regulations')
            .update(regulationData)
            .eq('country_code', country_code)
            .eq('regulation_code', reg.regulation_code);

          if (!updateError) updatedCount++;
        } else {
          // Insertar nueva
          const { error: insertError } = await supabase
            .from('erp_accounting_regulations')
            .insert({
              ...regulationData,
              created_at: new Date().toISOString(),
            });

          if (!insertError) newCount++;
        }
      }

      // Obtener todas las normativas actualizadas
      const { data: allRegulations } = await supabase
        .from('erp_accounting_regulations')
        .select('*')
        .eq('country_code', country_code)
        .eq('is_active', true)
        .order('effective_date', { ascending: false });

      console.log(`[erp-regulations-search] Completed: ${newCount} new, ${updatedCount} updated`);

      return new Response(JSON.stringify({
        success: true,
        regulations: allRegulations || [],
        newRegulations: newCount,
        updatedRegulations: updatedCount,
        sources: countryConfig.sources,
        summary: parsedResult.summary,
        lastUpdates: parsedResult.last_updates,
        searchTimestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_regulations') {
      const { data: regulations, error } = await supabase
        .from('erp_accounting_regulations')
        .select('*')
        .eq('country_code', country_code)
        .eq('is_active', true)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        regulations: regulations || [],
        sources: countryConfig.sources,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error('[erp-regulations-search] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
