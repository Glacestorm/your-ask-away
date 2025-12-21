import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent high-impact articles
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('*')
      .in('importance_level', ['critical', 'high'])
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('published_at', { ascending: false })
      .limit(20);

    if (articlesError) throw articlesError;

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No hay artículos de alto impacto para analizar',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get companies with relevant sectors/CNAEs
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, cnae, sector, parroquia, gestor_id')
      .limit(100);

    if (companiesError) throw companiesError;

    const opportunitiesCreated: any[] = [];

    for (const article of articles) {
      // Check if already analyzed for opportunities
      const { data: existingOpp } = await supabase
        .from('news_commercial_opportunities')
        .select('id')
        .eq('article_id', article.id)
        .limit(1);

      if (existingOpp && existingOpp.length > 0) continue;

      // Match with companies based on sector/CNAE
      const matchingCompanies = (companies || []).filter(company => {
        const articleCnaes = article.related_cnaes || [];
        const articleCategories = [article.category, ...(article.tags || [])].filter(Boolean);
        
        // CNAE match
        if (company.cnae && articleCnaes.some((c: string) => c.startsWith(company.cnae?.substring(0, 2)))) {
          return true;
        }
        
        // Sector match
        if (company.sector && articleCategories.some((cat: string) => 
          cat.toLowerCase().includes(company.sector?.toLowerCase() || '') ||
          (company.sector?.toLowerCase() || '').includes(cat.toLowerCase())
        )) {
          return true;
        }
        
        return false;
      }).slice(0, 5); // Limit to 5 companies per article

      if (matchingCompanies.length === 0) continue;

      // Use AI to identify opportunity type and details
      if (!lovableApiKey) continue;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Eres un analista comercial. Identifica oportunidades de negocio bancario a partir de noticias. 
                
Responde SOLO con JSON:
{
  "opportunity_type": "upsell"|"cross_sell"|"new_lead"|"retention"|"expansion"|"risk_mitigation",
  "title": "título corto de la oportunidad",
  "description": "descripción de la oportunidad (máx 200 caracteres)",
  "potential_value_range": "low"|"medium"|"high",
  "priority": "low"|"medium"|"high"|"critical",
  "confidence": 0.0-1.0,
  "action_items": ["acción 1", "acción 2"],
  "expires_days": numero_de_dias_hasta_expiracion
}`
              },
              {
                role: 'user',
                content: `Noticia: ${article.title}\n\nResumen: ${article.ai_summary || ''}\n\nImportancia: ${article.importance_level}\n\nEmpresas potencialmente afectadas: ${matchingCompanies.map(c => `${c.name} (${c.sector || 'Sin sector'})`).join(', ')}`
              }
            ],
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          
          try {
            const analysis = JSON.parse(content);
            
            // Estimate potential value
            const valueMap: Record<string, number> = {
              'low': 5000,
              'medium': 25000,
              'high': 100000,
            };
            const potentialValue = valueMap[analysis.potential_value_range] || 10000;

            // Create opportunities for matching companies
            for (const company of matchingCompanies) {
              const expiresAt = analysis.expires_days 
                ? new Date(Date.now() + analysis.expires_days * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

              const { data: newOpp, error: oppError } = await supabase
                .from('news_commercial_opportunities')
                .insert({
                  article_id: article.id,
                  company_id: company.id,
                  opportunity_type: analysis.opportunity_type || 'cross_sell',
                  title: analysis.title || `Oportunidad: ${article.title.substring(0, 50)}`,
                  description: analysis.description,
                  potential_value: potentialValue,
                  confidence_score: analysis.confidence || 0.5,
                  priority: analysis.priority || 'medium',
                  assigned_to: company.gestor_id,
                  assigned_at: company.gestor_id ? new Date().toISOString() : null,
                  action_items: analysis.action_items || [],
                  expires_at: expiresAt,
                })
                .select()
                .single();

              if (!oppError && newOpp) {
                opportunitiesCreated.push({
                  id: newOpp.id,
                  company: company.name,
                  type: analysis.opportunity_type,
                  priority: analysis.priority,
                });

                // Create lead link
                await supabase
                  .from('news_lead_links')
                  .upsert({
                    article_id: article.id,
                    company_id: company.id,
                    link_type: 'auto',
                    relevance_score: Math.round((analysis.confidence || 0.5) * 100),
                    relevance_reason: analysis.description,
                  }, {
                    onConflict: 'article_id,company_id'
                  });
              }
            }
          } catch {
            // Ignore parsing errors
          }
        }
      } catch (error) {
        console.error('AI analysis error:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      articlesAnalyzed: articles.length,
      opportunitiesCreated: opportunitiesCreated.length,
      opportunities: opportunitiesCreated,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in detect-news-opportunities:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
