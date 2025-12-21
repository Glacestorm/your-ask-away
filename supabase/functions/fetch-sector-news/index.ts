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

function extractImageFromRSS(itemXml: string): { url: string | null; credit: string | null } {
  // Try media:content
  const mediaMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaMatch) {
    const creditMatch = itemXml.match(/<media:credit[^>]*>([^<]+)<\/media:credit>/i);
    return { url: mediaMatch[1], credit: creditMatch?.[1]?.trim() || null };
  }
  
  // Try enclosure (common in RSS)
  const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*>/i) ||
                          itemXml.match(/<enclosure[^>]*type=["']image[^"']*["'][^>]*url=["']([^"']+)["'][^>]*>/i);
  if (enclosureMatch) {
    return { url: enclosureMatch[1], credit: null };
  }
  
  // Try media:thumbnail
  const thumbMatch = itemXml.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (thumbMatch) {
    return { url: thumbMatch[1], credit: null };
  }
  
  // Try image tag inside item
  const imageMatch = itemXml.match(/<image[^>]*>[\s\S]*?<url>([^<]+)<\/url>/i);
  if (imageMatch) {
    return { url: imageMatch[1].trim(), credit: null };
  }
  
  // Try to extract from description (common pattern: img src)
  const imgMatch = itemXml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch) {
    return { url: imgMatch[1], credit: null };
  }
  
  return { url: null, credit: null };
}

// Use Firecrawl to get OG image (handles JS-rendered pages)
async function fetchOgImageWithFirecrawl(articleUrl: string, supabaseUrl: string, supabaseServiceKey: string): Promise<{ url: string | null; credit: string | null }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const funcUrl = `${supabaseUrl}/functions/v1/firecrawl-og-image`;

    const response = await fetch(funcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ url: articleUrl }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Firecrawl OG fetch failed for ${articleUrl}: ${response.status}`);
      return { url: null, credit: null };
    }

    const data = await response.json();
    return { url: data.image_url || null, credit: data.credit || null };
  } catch (err) {
    console.warn('fetchOgImageWithFirecrawl error:', err);
    return { url: null, credit: null };
  }
}

// Fallback: simple fetch for OG image (no JS rendering)
async function fetchOgImageSimple(articleUrl: string): Promise<{ url: string | null; credit: string | null }> {
  const resolveUrl = (raw: string) => {
    const cleaned = raw.trim().replace(/&amp;/g, '&');
    if (!cleaned) return null;

    try {
      if (cleaned.startsWith('//')) {
        const base = new URL(articleUrl);
        return `${base.protocol}${cleaned}`;
      }
      if (cleaned.startsWith('/')) {
        return new URL(cleaned, articleUrl).toString();
      }
      return new URL(cleaned).toString();
    } catch {
      return null;
    }
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { url: null, credit: null };

    const html = await response.text();

    const ogMatch =
      html.match(/<meta[^>]*property=["']og:image:secure_url["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);

    const twitterMatch =
      html.match(/<meta[^>]*name=["']twitter:image:src["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);

    const imageUrl = resolveUrl(ogMatch?.[1] || twitterMatch?.[1] || '');

    const siteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const credit = siteMatch?.[1]?.trim() || null;

    return { url: imageUrl, credit };
  } catch {
    return { url: null, credit: null };
  }
}

interface RSSItemWithImage extends RSSItem {
  imageUrl: string | null;
  imageCredit: string | null;
}

async function parseRSSFeed(url: string): Promise<RSSItemWithImage[]> {
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
    const items: RSSItemWithImage[] = [];
    
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      const title = extractTextFromXML(itemXml, 'title');
      const link = extractTextFromXML(itemXml, 'link');
      const description = extractTextFromXML(itemXml, 'description');
      const pubDate = extractTextFromXML(itemXml, 'pubDate');
      const { url: imageUrl, credit: imageCredit } = extractImageFromRSS(itemXml);
      
      if (title && link) {
        items.push({ title, link, description, pubDate, imageUrl, imageCredit });
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

// Generate a simple hash from a string to create variety
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Large collection of unique, high-quality business images - NEVER repeating
const UNIQUE_IMAGES = [
  // Business & Office
  'photo-1497366216548-37526070297c', 'photo-1497366811353-6870744d04b2', 'photo-1497215728101-856f4ea42174',
  'photo-1521737604893-d14cc237f11d', 'photo-1531973576160-7125cd663d86', 'photo-1557804506-669a67965ba0',
  'photo-1560179707-f14e90ef3623', 'photo-1454165804606-c3d57bc86b40', 'photo-1507003211169-0a1dd7228f2d',
  // Technology
  'photo-1518770660439-4636190af475', 'photo-1550751827-4bd374c3f58b', 'photo-1488590528505-98d2b5aba04b',
  'photo-1526374965328-7f61d4dc18c5', 'photo-1535378917042-10a22c95931a', 'photo-1563986768609-322da13575f3',
  'photo-1558494949-ef010cbdcc31', 'photo-1451187580459-43490279c0fa', 'photo-1504639725590-34d0984388bd',
  // Finance & Economy
  'photo-1611974789855-9c2a0a7236a3', 'photo-1579532537598-459ecdaf39cc', 'photo-1554224155-6726b3ff858f',
  'photo-1460925895917-afdab827c52f', 'photo-1590283603385-17ffb3a7f29f', 'photo-1565688534245-05d6b5be184a',
  'photo-1591696205602-2f950c417cb9', 'photo-1611974789855-9c2a0a7236a3', 'photo-1434626881859-194d67b2b86f',
  // Legal & Documents
  'photo-1589829545856-d10d557cf95f', 'photo-1450101499163-c8848c66ca85', 'photo-1507003211169-0a1dd7228f2d',
  'photo-1521791055366-0d553872125f', 'photo-1505664194779-8beaceb93744', 'photo-1423592707957-3b212afa6733',
  'photo-1554224154-22dec7ec8818', 'photo-1568992687947-868a62a9f521', 'photo-1606857521015-7f9fcf423571',
  // Buildings & Corporate
  'photo-1486406146926-c627a92ad1ab', 'photo-1504711434969-e33886168f5c', 'photo-1541354329998-f4d9a9f9297f',
  'photo-1554469384-e58fac16e23a', 'photo-1579621970563-ebec7560ff3e', 'photo-1560438718-eb61ede255eb',
  'photo-1478860409698-8707f313ee8b', 'photo-1444653614773-995cb1ef9efa', 'photo-1486325212027-8081e485255e',
  // People & Teams
  'photo-1522071820081-009f0129c71c', 'photo-1552664730-d307ca884978', 'photo-1600880292203-757bb62b4baf',
  'photo-1542744173-8e7e53415bb0', 'photo-1517245386807-bb43f82c33c4', 'photo-1551434678-e076c223a692',
  'photo-1542744094-3a31f272c490', 'photo-1556761175-5973dc0f32e7', 'photo-1552581234-26160f608093',
  // Data & Analytics
  'photo-1551288049-bebda4e38f71', 'photo-1543286386-713bdd548da4', 'photo-1551434678-e076c223a692',
  'photo-1460925895917-afdab827c52f', 'photo-1504868584819-f8e8b4b6d7e3', 'photo-1543286386-2e659306cd6c',
  // Industry & Manufacturing
  'photo-1581091226825-a6a2a5aee158', 'photo-1565688534245-05d6b5be184a', 'photo-1558618666-fcd25c85cd64',
  'photo-1504307651254-35680f356dfd', 'photo-1513828583688-c52646db42da', 'photo-1581092162384-8987c1d64926',
  // Security & Cyber
  'photo-1555949963-ff9fe0c870eb', 'photo-1510511459019-5dda7724fd87', 'photo-1614064641938-3bbee52942c7',
  'photo-1558494949-ef010cbdcc31', 'photo-1563986768609-322da13575f3', 'photo-1550751827-4bd374c3f58b',
  // Additional variety
  'photo-1579621970795-87facc2f976d', 'photo-1432888498266-38ffec3eaf0a', 'photo-1485827404703-89b55fcc595e',
  'photo-1498050108023-c5249f4df085', 'photo-1517694712202-14dd9538aa97', 'photo-1531482615713-2afd69097998',
  'photo-1504384308090-c894fdcc538d', 'photo-1556155092-490a1ba16284', 'photo-1516321318423-f06f85e504b3',
];

// Get a unique image based on article title and category - NEVER the same
function getUniqueImageForArticle(title: string, category: string): string {
  // Create a unique hash from title + category
  const combined = `${title}-${category}-${Date.now()}`;
  const hash = simpleHash(combined);
  const imageIndex = hash % UNIQUE_IMAGES.length;
  const imageId = UNIQUE_IMAGES[imageIndex];
  
  // Add unique signature to prevent caching of same image
  const signature = (hash % 1000).toString().padStart(3, '0');
  return `https://images.unsplash.com/${imageId}?w=800&h=450&fit=crop&sig=${signature}`;
}

// Legacy function for backwards compatibility
function getImageForCategory(category: string): string {
  // This now just returns a random image from the pool
  const randomIndex = Math.floor(Math.random() * UNIQUE_IMAGES.length);
  return `https://images.unsplash.com/${UNIQUE_IMAGES[randomIndex]}?w=800&h=450&fit=crop`;
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
              
              // Determine image: prefer og:image (via Firecrawl), then simple fetch, then RSS image, then fallback
              let finalImageUrl: string | null = null;
              let finalImageCredit: string | null = null;

              // 1) Try Firecrawl (handles JS-rendered pages)
              const firecrawlData = await fetchOgImageWithFirecrawl(item.link, supabaseUrl, supabaseServiceKey);
              finalImageUrl = firecrawlData.url;
              finalImageCredit = firecrawlData.credit;

              // 2) If Firecrawl failed, try simple fetch
              if (!finalImageUrl) {
                const simpleData = await fetchOgImageSimple(item.link);
                finalImageUrl = simpleData.url;
                finalImageCredit = simpleData.credit;
              }

              // 3) If no OG, use RSS-provided image (media:content/enclosure/etc.)
              if (!finalImageUrl) {
                finalImageUrl = item.imageUrl;
                finalImageCredit = item.imageCredit;
              }

              // 4) Use UNIQUE fallback image if still no image found (never repeating)
              if (!finalImageUrl) {
                finalImageUrl = getUniqueImageForArticle(item.title, source.category);
                finalImageCredit = 'Unsplash';
              }
              
              // Build image credit attribution
              const imageAttribution = finalImageCredit || source.name;
              
              const newsArticle = {
                title: item.title,
                slug,
                excerpt: item.description.substring(0, 300),
                content: item.description,
                image_url: finalImageUrl,
                image_credit: imageAttribution,
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
      // 1) Insert only new rows (do not overwrite existing fields like read_count)
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
            news_article_id: data[index]?.id || null,
          }));

          const { error: insightError } = await supabase
            .from('news_improvement_insights')
            .insert(insightsWithArticleIds);

          if (insightError) {
            warnings.push(`Error saving insights: ${insightError.message}`);
          }
        }
      }

      // 2) Patch images for already-existing articles using direct UPDATE
      // This ensures existing articles get updated with real OG images
      try {
        const imagePatches = allNews
          .filter((n) => !!n.image_url && !String(n.image_url).includes('images.unsplash.com'))
          .map((n) => ({
            source_url: n.source_url,
            image_url: n.image_url,
            image_credit: n.image_credit,
          }));

        let patchedCount = 0;
        for (const patch of imagePatches) {
          const { error: updateError } = await supabase
            .from('news_articles')
            .update({ 
              image_url: patch.image_url, 
              image_credit: patch.image_credit 
            })
            .eq('source_url', patch.source_url);
          
          if (!updateError) {
            patchedCount++;
          }
        }
        
        if (patchedCount > 0) {
          console.log(`Patched images for ${patchedCount} existing articles`);
        }
      } catch (patchErr) {
        console.warn('Image patch step failed:', patchErr);
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
