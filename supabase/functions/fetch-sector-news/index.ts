import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  articles_fetched: number;
  articles_relevant: number;
  error_count: number;
}

interface AIAnalysis {
  summary: string;
  relevanceScore: number;
  tags: string[];
  importanceLevel: 'critical' | 'high' | 'medium' | 'low';
  productConnection: string | null;
  productRelevanceReason: string | null;
  detectedTrends: string[];
  improvementSuggestions: string | null;
}

function extractTextFromXML(xmlString: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xmlString.match(regex);
  if (match) {
    return (match[1] || match[2] || '').trim().replace(/<[^>]+>/g, '');
  }
  return '';
}

async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  try {
    console.log(`Fetching RSS from: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ObelixIA News Bot/2.0' }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const items: RSSItem[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const title = extractTextFromXML(itemXml, 'title');
      const link = extractTextFromXML(itemXml, 'link');
      const description = extractTextFromXML(itemXml, 'description');
      const pubDate = extractTextFromXML(itemXml, 'pubDate');
      
      if (title && link) {
        items.push({ title, link, description, pubDate });
      }
    }
    
    console.log(`Parsed ${items.length} items from ${url}`);
    return items;
  } catch (error) {
    console.error(`Error parsing RSS ${url}:`, error);
    return [];
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

async function generateAIAnalysis(
  title: string, 
  description: string, 
  apiKey: string,
  keywords: string[]
): Promise<AIAnalysis> {
  const defaultResult: AIAnalysis = {
    summary: description.substring(0, 200),
    relevanceScore: 50,
    tags: [],
    importanceLevel: 'medium',
    productConnection: null,
    productRelevanceReason: null,
    detectedTrends: [],
    improvementSuggestions: null
  };

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Eres un analista de noticias empresariales especializado en compliance, tecnología y regulación para empresas españolas.

ObelixIA es una plataforma integral de gestión empresarial que incluye:
- CRM inteligente con gestión de visitas comerciales
- Compliance y protección de datos (RGPD, LOPD)
- Gestión documental y auditoría
- Automatización de procesos con IA
- Análisis predictivo y dashboards
- Gestión financiera y facturación
- Integración bancaria y Open Banking

Analiza la noticia y genera un JSON con:
1. summary: Resumen ejecutivo (máx 180 caracteres)
2. relevanceScore: Puntuación 1-100 para empresas españolas (PYMES, banca, compliance)
3. tags: 3-5 tags relevantes en español
4. importanceLevel: "critical" (afecta inmediatamente), "high" (muy relevante), "medium" (interesante), "low" (menor relevancia)
5. productConnection: Si la noticia se relaciona naturalmente con alguna funcionalidad de ObelixIA, explica brevemente cómo ayuda (máx 150 caracteres). NULL si no hay conexión natural.
6. productRelevanceReason: Por qué las empresas necesitarían ObelixIA respecto a esta noticia (máx 200 caracteres). NULL si no aplica naturalmente.
7. detectedTrends: Array de tendencias del mercado detectadas en esta noticia (máx 3)
8. improvementSuggestions: Si detectas alguna funcionalidad que ObelixIA podría añadir basándose en esta noticia, descríbela brevemente. NULL si no hay sugerencia clara.

IMPORTANTE: Solo incluye productConnection y productRelevanceReason si hay una conexión NATURAL y lógica. No fuerces la relación.

Responde SOLO con JSON válido.`
          },
          {
            role: 'user',
            content: `Título: ${title}\n\nDescripción: ${description}\n\nKeywords de interés: ${keywords.join(', ')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return defaultResult;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || description.substring(0, 180),
        relevanceScore: Math.min(100, Math.max(1, parsed.relevanceScore || 50)),
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
        importanceLevel: ['critical', 'high', 'medium', 'low'].includes(parsed.importanceLevel) 
          ? parsed.importanceLevel 
          : 'medium',
        productConnection: parsed.productConnection || null,
        productRelevanceReason: parsed.productRelevanceReason || null,
        detectedTrends: Array.isArray(parsed.detectedTrends) ? parsed.detectedTrends.slice(0, 3) : [],
        improvementSuggestions: parsed.improvementSuggestions || null
      };
    }
    
    return defaultResult;
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return defaultResult;
  }
}

function isRelevantNews(title: string, description: string, keywords: string[]): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

function getImageForCategory(category: string): string {
  const images: Record<string, string> = {
    'Legal': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=450&fit=crop',
    'Tecnología': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    'Economía': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
    'Ciberseguridad': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop',
    'Normativa': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=450&fit=crop',
    'Protección Datos': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=450&fit=crop',
    'Finanzas': 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&h=450&fit=crop',
    'Fiscal': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop',
    'Empresarial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=450&fit=crop'
  };
  return images[category] || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const sourcesStatus: Record<string, { fetched: number; relevant: number; error?: string }> = {};

  try {
    console.log('Starting enhanced news fetch job...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get active news sources from database
    const { data: dbSources, error: sourcesError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('is_active', true);
    
    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      errors.push(`Error fetching sources: ${sourcesError.message}`);
    }

    // Get keywords configuration
    const { data: keywordsConfig } = await supabase
      .from('news_admin_config')
      .select('setting_value')
      .eq('setting_key', 'keywords')
      .single();
    
    const keywords = keywordsConfig?.setting_value?.included || [
      'RGPD', 'protección de datos', 'ciberseguridad', 'compliance', 'LOPD',
      'normativa', 'auditoría', 'digitalización', 'IA', 'inteligencia artificial',
      'automatización', 'empresas', 'pymes', 'subvenciones', 'ayudas'
    ];

    // Get minimum relevance score
    const { data: minScoreConfig } = await supabase
      .from('news_admin_config')
      .select('setting_value')
      .eq('setting_key', 'min_relevance_score')
      .single();
    
    const minRelevanceScore = minScoreConfig?.setting_value?.score || 50;

    // Get auto-archive setting
    const { data: autoArchiveConfig } = await supabase
      .from('news_admin_config')
      .select('setting_value')
      .eq('setting_key', 'auto_archive_important')
      .single();
    
    const autoArchiveImportant = autoArchiveConfig?.setting_value?.enabled !== false;

    const sources: NewsSource[] = dbSources || [];
    const allNews: any[] = [];
    const newInsights: any[] = [];
    
    // Fetch from all active RSS sources
    for (const source of sources) {
      try {
        const items = await parseRSSFeed(source.url);
        sourcesStatus[source.name] = { fetched: items.length, relevant: 0 };
        
        for (const item of items.slice(0, 8)) {
          if (isRelevantNews(item.title, item.description, keywords)) {
            const slug = generateSlug(item.title) + '-' + Date.now().toString(36);
            
            // Generate enhanced AI analysis
            let aiData: AIAnalysis = {
              summary: item.description.substring(0, 180),
              relevanceScore: 50,
              tags: [],
              importanceLevel: 'medium',
              productConnection: null,
              productRelevanceReason: null,
              detectedTrends: [],
              improvementSuggestions: null
            };
            
            if (lovableApiKey) {
              aiData = await generateAIAnalysis(item.title, item.description, lovableApiKey, keywords);
            }
            
            // Only save if meets minimum relevance score
            if (aiData.relevanceScore >= minRelevanceScore) {
              sourcesStatus[source.name].relevant++;
              
              const imageUrl = getImageForCategory(source.category);
              
              const newsArticle = {
                title: item.title,
                slug,
                excerpt: item.description.substring(0, 300),
                content: item.description,
                image_url: imageUrl,
                source_url: item.link,
                source_name: source.name,
                category: source.category,
                tags: aiData.tags,
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
                ai_summary: aiData.summary,
                relevance_score: aiData.relevanceScore,
                is_featured: aiData.relevanceScore >= 85,
                importance_level: aiData.importanceLevel,
                product_connection: aiData.productConnection,
                product_relevance_reason: aiData.productRelevanceReason,
                detected_trends: aiData.detectedTrends,
                improvement_suggestions: aiData.improvementSuggestions,
                improvement_status: aiData.improvementSuggestions ? 'pending' : null,
                is_archived: autoArchiveImportant && aiData.importanceLevel === 'critical'
              };
              
              allNews.push(newsArticle);
              
              // Create improvement insight if there are suggestions
              if (aiData.improvementSuggestions) {
                newInsights.push({
                  insight_type: 'feature_request',
                  title: `Mejora detectada: ${item.title.substring(0, 60)}...`,
                  description: aiData.improvementSuggestions,
                  priority: aiData.importanceLevel === 'critical' ? 'high' : 
                           aiData.importanceLevel === 'high' ? 'medium' : 'low',
                  ai_recommendation: `Basado en la noticia "${item.title}", se sugiere: ${aiData.improvementSuggestions}`,
                  detected_from_trends: aiData.detectedTrends
                });
              }
            }
          }
        }
        
        // Update source statistics
        await supabase
          .from('news_sources')
          .update({
            articles_fetched: source.articles_fetched + sourcesStatus[source.name].fetched,
            articles_relevant: source.articles_relevant + sourcesStatus[source.name].relevant,
            last_fetch_at: new Date().toISOString(),
            error_count: 0,
            last_error: null
          })
          .eq('id', source.id);
          
      } catch (sourceError) {
        const errorMsg = sourceError instanceof Error ? sourceError.message : 'Unknown error';
        errors.push(`Error with source ${source.name}: ${errorMsg}`);
        sourcesStatus[source.name] = { fetched: 0, relevant: 0, error: errorMsg };
        
        await supabase
          .from('news_sources')
          .update({
            error_count: source.error_count + 1,
            last_error: errorMsg
          })
          .eq('id', source.id);
      }
    }
    
    console.log(`Found ${allNews.length} relevant news articles`);
    
    // Insert news articles
    let savedCount = 0;
    if (allNews.length > 0) {
      const { data, error } = await supabase
        .from('news_articles')
        .upsert(allNews, { onConflict: 'source_url', ignoreDuplicates: true })
        .select();
      
      if (error) {
        console.error('Error inserting news:', error);
        errors.push(`Error inserting news: ${error.message}`);
      } else {
        savedCount = data?.length || 0;
        console.log(`Successfully inserted/updated ${savedCount} news articles`);
        
        // Link insights to articles and insert them
        if (newInsights.length > 0 && data) {
          const insightsWithArticleIds = newInsights.map((insight, index) => ({
            ...insight,
            news_article_id: data[index]?.id || null
          }));
          
          const { error: insightError } = await supabase
            .from('news_improvement_insights')
            .insert(insightsWithArticleIds);
          
          if (insightError) {
            warnings.push(`Error saving insights: ${insightError.message}`);
          }
        }
      }
    }
    
    // Update featured article
    await supabase
      .from('news_articles')
      .update({ is_featured: false })
      .eq('is_featured', true);
    
    const { data: topArticle } = await supabase
      .from('news_articles')
      .select('id')
      .order('relevance_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(1)
      .single();
    
    if (topArticle) {
      await supabase
        .from('news_articles')
        .update({ is_featured: true })
        .eq('id', topArticle.id);
    }
    
    // Log execution
    const durationMs = Date.now() - startTime;
    await supabase
      .from('news_fetch_logs')
      .insert({
        duration_ms: durationMs,
        articles_fetched: Object.values(sourcesStatus).reduce((sum, s) => sum + s.fetched, 0),
        articles_processed: allNews.length,
        articles_saved: savedCount,
        errors: errors.length > 0 ? errors : null,
        warnings: warnings.length > 0 ? warnings : null,
        sources_status: sourcesStatus,
        status: errors.length > 0 ? 'completed_with_errors' : 'success'
      });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${allNews.length} news articles, saved ${savedCount}`,
        duration_ms: durationMs,
        sources_status: sourcesStatus,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in fetch-sector-news:', error);
    
    // Log failed execution
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('news_fetch_logs')
        .insert({
          duration_ms: Date.now() - startTime,
          articles_fetched: 0,
          articles_processed: 0,
          articles_saved: 0,
          errors: [errorMessage],
          status: 'failed'
        });
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
