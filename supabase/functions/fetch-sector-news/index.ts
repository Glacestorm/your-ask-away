import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RSS Feed sources for Spanish business/compliance news
const RSS_SOURCES = [
  { name: 'BOE', url: 'https://www.boe.es/rss/canal.php?c=tributarios', category: 'Fiscal' },
  { name: 'Europa Press Economía', url: 'https://www.europapress.es/rss/rss.aspx?ch=281', category: 'Empresarial' },
  { name: 'Expansión', url: 'https://e00-expansion.uecdn.es/rss/mercados.xml', category: 'Finanzas' },
  { name: 'El Economista', url: 'https://www.eleconomista.es/rss/rss-empresas.php', category: 'Empresarial' },
  { name: 'Cinco Días', url: 'https://cincodias.elpais.com/seccion/rss/mercados/', category: 'Finanzas' },
];

// Keywords to filter relevant news
const RELEVANT_KEYWORDS = [
  'compliance', 'rgpd', 'gdpr', 'protección de datos', 'ciberseguridad',
  'banca', 'fintech', 'pyme', 'empresa', 'fiscal', 'impuesto', 'iva',
  'inteligencia artificial', 'ia', 'automatización', 'digitalización',
  'dora', 'nis2', 'mifid', 'psd2', 'normativa', 'regulación',
  'blanqueo', 'prevención', 'auditoría', 'control interno',
  'inversión', 'financiación', 'crédito', 'subvención', 'ayuda',
  'tecnología', 'software', 'cloud', 'nube', 'transformación digital'
];

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
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
      headers: { 'User-Agent': 'ObelixIA News Bot/1.0' }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    const items: RSSItem[] = [];
    
    // Simple XML parsing for RSS items
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

function isRelevantNews(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return RELEVANT_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
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

async function generateAISummary(title: string, description: string, apiKey: string): Promise<{ summary: string; relevanceScore: number; tags: string[] }> {
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
            content: `Eres un analista de noticias empresariales. Dado un título y descripción de una noticia, genera:
1. Un resumen ejecutivo de 2-3 oraciones para directivos (máx 200 caracteres)
2. Una puntuación de relevancia del 1-100 para empresas españolas (PYMES, banca, compliance)
3. 3-5 tags relevantes en español

Responde SOLO en JSON válido con este formato exacto:
{"summary": "...", "relevanceScore": 75, "tags": ["tag1", "tag2", "tag3"]}`
          },
          {
            role: 'user',
            content: `Título: ${title}\n\nDescripción: ${description}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return { summary: description.substring(0, 200), relevanceScore: 50, tags: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || description.substring(0, 200),
        relevanceScore: Math.min(100, Math.max(1, parsed.relevanceScore || 50)),
        tags: Array.isArray(parsed.tags) ? parsed.tags : []
      };
    }
    
    return { summary: description.substring(0, 200), relevanceScore: 50, tags: [] };
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return { summary: description.substring(0, 200), relevanceScore: 50, tags: [] };
  }
}

async function findNewsImage(title: string): Promise<string> {
  // Generate a relevant placeholder image URL based on category keywords
  const keywords = ['business', 'finance', 'technology', 'office', 'corporate'];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  const seed = title.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  // Use Unsplash source for dynamic images
  return `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop&q=80`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting news fetch job...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const allNews: any[] = [];
    
    // Fetch from all RSS sources
    for (const source of RSS_SOURCES) {
      const items = await parseRSSFeed(source.url);
      
      for (const item of items.slice(0, 5)) { // Limit to 5 per source
        if (isRelevantNews(item.title, item.description)) {
          const slug = generateSlug(item.title) + '-' + Date.now().toString(36);
          
          // Generate AI summary if API key available
          let aiData = { summary: item.description.substring(0, 200), relevanceScore: 50, tags: [] as string[] };
          if (lovableApiKey) {
            aiData = await generateAISummary(item.title, item.description, lovableApiKey);
          }
          
          const imageUrl = await findNewsImage(item.title);
          
          allNews.push({
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
            is_featured: aiData.relevanceScore >= 80
          });
        }
      }
    }
    
    console.log(`Found ${allNews.length} relevant news articles`);
    
    // Insert news articles (upsert based on source_url to avoid duplicates)
    if (allNews.length > 0) {
      const { data, error } = await supabase
        .from('news_articles')
        .upsert(allNews, { onConflict: 'source_url', ignoreDuplicates: true })
        .select();
      
      if (error) {
        console.error('Error inserting news:', error);
        throw error;
      }
      
      console.log(`Successfully inserted/updated ${data?.length || 0} news articles`);
    }
    
    // Mark the most relevant recent article as featured
    const { error: featuredError } = await supabase
      .from('news_articles')
      .update({ is_featured: false })
      .eq('is_featured', true);
    
    if (!featuredError) {
      await supabase
        .from('news_articles')
        .update({ is_featured: true })
        .order('relevance_score', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(1);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${allNews.length} news articles`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in fetch-sector-news:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
