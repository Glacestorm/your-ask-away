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

    const { articleId, companyId } = await req.json();

    // Get company profile
    let companyProfile;
    let company;

    if (companyId) {
      const { data: profile } = await supabase
        .from('company_news_profiles')
        .select('*')
        .eq('company_id', companyId)
        .single();

      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, cnae, sector, parroquia')
        .eq('id', companyId)
        .single();

      companyProfile = profile;
      company = companyData;

      if (!companyProfile && company) {
        // Create default profile from company data
        const { data: newProfile } = await supabase
          .from('company_news_profiles')
          .insert({
            company_id: companyId,
            cnae_codes: company.cnae ? [company.cnae] : [],
            sectors: company.sector ? [company.sector] : [],
            regions: company.parroquia ? [company.parroquia] : [],
          })
          .select()
          .single();
        companyProfile = newProfile;
      }
    }

    if (!companyProfile || !company) {
      throw new Error('Company profile required');
    }

    // Get article(s) to analyze
    let articles = [];
    if (articleId) {
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', articleId)
        .single();
      if (data) articles = [data];
    } else {
      // Get recent articles
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false })
        .limit(20);
      articles = data || [];
    }

    const results: any[] = [];

    for (const article of articles) {
      // Check if already calculated
      const { data: existing } = await supabase
        .from('personalized_news_scores')
        .select('id')
        .eq('article_id', article.id)
        .eq('company_id', companyId)
        .single();

      if (existing) continue;

      // Calculate personalized score
      let score = article.relevance_score || 50;
      const impactFactors: any = {};
      const relevanceReasons: string[] = [];

      // CNAE matching
      const companyCnaes = companyProfile.cnae_codes || [];
      const articleCnaes = article.related_cnaes || [];
      const cnaeMatch = companyCnaes.some((c: string) => articleCnaes.includes(c));
      if (cnaeMatch) {
        score += 15;
        impactFactors.cnae_match = true;
        relevanceReasons.push('Coincide con el código CNAE de la empresa');
      }

      // Sector matching
      const companySectors = companyProfile.sectors || [];
      if (article.category && companySectors.some((s: string) => 
        article.category.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(article.category.toLowerCase())
      )) {
        score += 10;
        impactFactors.sector_match = true;
        relevanceReasons.push('Sector relevante para la empresa');
      }

      // Custom keywords matching
      const customKeywords = companyProfile.custom_keywords || [];
      const articleText = `${article.title} ${article.ai_summary || ''}`.toLowerCase();
      const matchedKeywords = customKeywords.filter((kw: string) => 
        articleText.includes(kw.toLowerCase())
      );
      if (matchedKeywords.length > 0) {
        score += 5 * matchedKeywords.length;
        impactFactors.keyword_matches = matchedKeywords;
        relevanceReasons.push(`Contiene palabras clave: ${matchedKeywords.join(', ')}`);
      }

      // Importance level boost
      if (article.importance_level === 'critical') {
        score += 10;
        impactFactors.critical = true;
        relevanceReasons.push('Noticia marcada como crítica');
      } else if (article.importance_level === 'high') {
        score += 5;
        impactFactors.high_importance = true;
      }

      // Use AI for deeper analysis if available
      if (lovableApiKey && (cnaeMatch || matchedKeywords.length > 0)) {
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
                  content: 'Analiza el impacto de una noticia para una empresa específica. Responde SOLO con JSON: {"impact_level": "high"|"medium"|"low", "reason": "explicación breve (máx 100 caracteres)", "opportunity": true|false}'
                },
                {
                  role: 'user',
                  content: `Empresa: ${company.name}\nSector: ${company.sector || 'N/A'}\nCNAE: ${company.cnae || 'N/A'}\n\nNoticia: ${article.title}\nResumen: ${article.ai_summary || 'N/A'}`
                }
              ],
            }),
          });

          if (response.ok) {
            const aiData = await response.json();
            const content = aiData.choices?.[0]?.message?.content || '';
            try {
              const parsed = JSON.parse(content);
              if (parsed.impact_level === 'high') score += 10;
              else if (parsed.impact_level === 'medium') score += 5;
              if (parsed.reason) relevanceReasons.push(parsed.reason);
              impactFactors.ai_analysis = parsed;
            } catch {
              // Ignore parsing errors
            }
          }
        } catch (error) {
          console.error('AI analysis error:', error);
        }
      }

      // Cap score at 100
      score = Math.min(100, score);

      // Save personalized score
      const { data: savedScore, error: saveError } = await supabase
        .from('personalized_news_scores')
        .insert({
          article_id: article.id,
          company_id: companyId,
          personalized_score: score,
          impact_factors: impactFactors,
          relevance_reasons: relevanceReasons,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving score:', saveError);
      }

      results.push({
        articleId: article.id,
        title: article.title,
        originalScore: article.relevance_score,
        personalizedScore: score,
        reasons: relevanceReasons,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      companyId,
      articlesProcessed: articles.length,
      scoresCalculated: results.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-personalized-impact:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
