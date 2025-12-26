import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  version: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  source_type: 'manual' | 'imported' | 'ai_generated';
  language: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface RAGRequest {
  action: 'search' | 'ask' | 'add_article' | 'update_article' | 'delete_article' | 
          'list_articles' | 'get_article' | 'get_versions' | 'reindex' | 
          'import_document' | 'export_all' | 'submit_feedback' | 'get_analytics' |
          'generate_embedding';
  query?: string;
  question?: string;
  limit?: number;
  article?: Partial<KnowledgeArticle>;
  id?: string;
  updates?: Partial<KnowledgeArticle>;
  category?: string;
  status?: string;
  document?: {
    content: string;
    title?: string;
    source_url?: string;
    source_type: 'pdf' | 'docx' | 'txt' | 'url';
  };
  feedback?: {
    article_id: string;
    is_helpful: boolean;
    comment?: string;
  };
  context?: {
    department?: string;
    userRole?: string;
  };
}

// Generate embedding using Lovable AI
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    // Use AI to create a semantic representation
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `Eres un generador de embeddings semánticos. Dado un texto, genera un array de 1536 números decimales entre -1 y 1 que represente semánticamente el contenido. 
            
RESPONDE SOLO con un array JSON de 1536 números, sin explicaciones adicionales.
Ejemplo: [0.123, -0.456, 0.789, ...]`
          },
          { 
            role: 'user', 
            content: `Genera embedding para: "${text.substring(0, 2000)}"` 
          }
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      console.error('Error generating embedding:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Try to parse the embedding array
    const arrayMatch = content.match(/\[[\d\s,.\-e]+\]/);
    if (arrayMatch) {
      const embedding = JSON.parse(arrayMatch[0]);
      if (Array.isArray(embedding) && embedding.length === 1536) {
        return embedding;
      }
    }
    
    // Fallback: generate a deterministic pseudo-embedding based on text hash
    return generatePseudoEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return generatePseudoEmbedding(text);
  }
}

// Generate a deterministic pseudo-embedding for fallback
function generatePseudoEmbedding(text: string): number[] {
  const embedding: number[] = [];
  const normalized = text.toLowerCase();
  
  for (let i = 0; i < 1536; i++) {
    const charIndex = i % normalized.length;
    const charCode = normalized.charCodeAt(charIndex);
    const seed = (charCode * (i + 1) * 31) % 10000;
    embedding.push((seed / 10000) * 2 - 1); // Range -1 to 1
  }
  
  return embedding;
}

// Calculate cosine similarity between two embeddings
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.json() as RAGRequest;
    const { action, query, question, limit = 10, article, id, updates, category, status, document, feedback, context } = requestBody;
    
    console.log(`[knowledge-base-rag] Processing action: ${action}`);

    // === LIST ARTICLES ===
    if (action === 'list_articles') {
      let queryBuilder = supabase
        .from('knowledge_articles')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (category && category !== 'all') {
        queryBuilder = queryBuilder.eq('category', category);
      }
      if (status && status !== 'all') {
        queryBuilder = queryBuilder.eq('status', status);
      }
      
      const { data: articles, error } = await queryBuilder.limit(100);
      
      if (error) throw error;
      
      // Get category stats
      const { data: categoryStats } = await supabase
        .from('knowledge_articles')
        .select('category')
        .eq('status', 'published');
      
      const categories: Record<string, number> = {};
      categoryStats?.forEach(a => {
        categories[a.category] = (categories[a.category] || 0) + 1;
      });
      
      return new Response(JSON.stringify({
        success: true,
        articles: articles || [],
        categories,
        totalCount: articles?.length || 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === GET SINGLE ARTICLE ===
    if (action === 'get_article') {
      const { data: articleData, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Increment view count
      await supabase.rpc('increment_knowledge_article_view', { article_id: id });
      
      return new Response(JSON.stringify({
        success: true,
        article: articleData,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === ADD ARTICLE ===
    if (action === 'add_article') {
      const content = article?.content || '';
      const title = article?.title || 'Nuevo Artículo';
      
      // Generate embedding for the article
      const embedding = await generateEmbedding(`${title} ${content}`, LOVABLE_API_KEY);
      
      // Generate summary using AI
      let summary = article?.summary;
      if (!summary && content.length > 100) {
        try {
          const summaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'Resume el siguiente texto en máximo 2 oraciones. Responde solo con el resumen.' },
                { role: 'user', content: content.substring(0, 2000) }
              ],
              temperature: 0.3,
              max_tokens: 200,
            }),
          });
          
          if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            summary = summaryData.choices?.[0]?.message?.content?.trim();
          }
        } catch (e) {
          console.error('Error generating summary:', e);
        }
      }
      
      const newArticle = {
        title,
        content,
        summary,
        category: article?.category || 'general',
        tags: article?.tags || [],
        status: article?.status || 'draft',
        source_type: article?.source_type || 'manual',
        language: article?.language || 'es',
        embedding: embedding ? `[${embedding.join(',')}]` : null,
      };
      
      const { data: insertedArticle, error } = await supabase
        .from('knowledge_articles')
        .insert(newArticle)
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        article: insertedArticle,
        message: 'Artículo añadido correctamente',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === UPDATE ARTICLE ===
    if (action === 'update_article') {
      const updateData: any = { ...updates };
      
      // If content or title changed, regenerate embedding
      if (updates?.content || updates?.title) {
        const { data: currentArticle } = await supabase
          .from('knowledge_articles')
          .select('title, content')
          .eq('id', id)
          .single();
        
        const newTitle = updates?.title || currentArticle?.title || '';
        const newContent = updates?.content || currentArticle?.content || '';
        
        const embedding = await generateEmbedding(`${newTitle} ${newContent}`, LOVABLE_API_KEY);
        if (embedding) {
          updateData.embedding = `[${embedding.join(',')}]`;
        }
      }
      
      // Update published_at if status changed to published
      if (updates?.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
      
      const { data: updatedArticle, error } = await supabase
        .from('knowledge_articles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        article: updatedArticle,
        message: 'Artículo actualizado correctamente',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === DELETE ARTICLE ===
    if (action === 'delete_article') {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Artículo eliminado correctamente',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === GET ARTICLE VERSIONS ===
    if (action === 'get_versions') {
      const { data: versions, error } = await supabase
        .from('knowledge_article_versions')
        .select('*')
        .eq('article_id', id)
        .order('version', { ascending: false });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        versions: versions || [],
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === IMPORT DOCUMENT ===
    if (action === 'import_document') {
      if (!document?.content) {
        throw new Error('Document content is required');
      }
      
      // Use AI to extract structured content
      const extractResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `Eres un extractor de contenido para una base de conocimiento. Analiza el documento y extrae:

RESPONDE EN JSON:
{
  "title": "Título inferido del documento",
  "summary": "Resumen en 2-3 oraciones",
  "category": "Una de: guias, normativa, productos, faqs, procesos, troubleshooting, general",
  "tags": ["array", "de", "tags", "relevantes"],
  "sections": [
    {
      "title": "Título de sección",
      "content": "Contenido de la sección"
    }
  ],
  "mainContent": "Contenido principal limpio y formateado"
}`
            },
            { role: 'user', content: document.content.substring(0, 10000) }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });
      
      if (!extractResponse.ok) throw new Error('Failed to extract document content');
      
      const extractData = await extractResponse.json();
      const extractedContent = extractData.choices?.[0]?.message?.content;
      
      let parsed;
      try {
        const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch {
        parsed = { title: document.title || 'Documento Importado', mainContent: document.content };
      }
      
      // Generate embedding
      const embedding = await generateEmbedding(`${parsed.title} ${parsed.mainContent || document.content}`, LOVABLE_API_KEY);
      
      // Create article
      const newArticle = {
        title: parsed.title || document.title || 'Documento Importado',
        content: parsed.mainContent || document.content,
        summary: parsed.summary,
        category: parsed.category || 'general',
        tags: parsed.tags || [],
        status: 'draft',
        source_type: 'imported',
        source_url: document.source_url,
        embedding: embedding ? `[${embedding.join(',')}]` : null,
      };
      
      const { data: insertedArticle, error } = await supabase
        .from('knowledge_articles')
        .insert(newArticle)
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        article: insertedArticle,
        extracted: parsed,
        message: 'Documento importado correctamente',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === EXPORT ALL ===
    if (action === 'export_all') {
      const { data: articles, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, content, summary, category, tags, status, version, view_count, helpful_count, created_at, updated_at')
        .order('category')
        .order('title');
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        articles: articles || [],
        exportedAt: new Date().toISOString(),
        totalCount: articles?.length || 0,
        format: 'json'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SUBMIT FEEDBACK ===
    if (action === 'submit_feedback') {
      if (!feedback?.article_id) {
        throw new Error('Article ID is required for feedback');
      }
      
      const { error: feedbackError } = await supabase
        .from('knowledge_user_feedback')
        .insert({
          article_id: feedback.article_id,
          is_helpful: feedback.is_helpful,
          comment: feedback.comment
        });
      
      if (feedbackError) throw feedbackError;
      
      // Update article counts
      const { data: currentArticle } = await supabase
        .from('knowledge_articles')
        .select('helpful_count, not_helpful_count')
        .eq('id', feedback.article_id)
        .single();
      
      if (feedback.is_helpful) {
        await supabase
          .from('knowledge_articles')
          .update({ helpful_count: (currentArticle?.helpful_count || 0) + 1 })
          .eq('id', feedback.article_id);
      } else {
        await supabase
          .from('knowledge_articles')
          .update({ not_helpful_count: (currentArticle?.not_helpful_count || 0) + 1 })
          .eq('id', feedback.article_id);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Feedback registrado correctamente',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === GET ANALYTICS ===
    if (action === 'get_analytics') {
      // Get article stats
      const { data: articleStats } = await supabase
        .from('knowledge_articles')
        .select('category, status, view_count, helpful_count, not_helpful_count');
      
      // Get search logs
      const { data: searchLogs } = await supabase
        .from('knowledge_search_logs')
        .select('query, query_type, was_helpful, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      
      // Get top articles by views
      const { data: topArticles } = await supabase
        .from('knowledge_articles')
        .select('id, title, category, view_count, helpful_count')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(10);
      
      // Get recent feedback
      const { data: recentFeedback } = await supabase
        .from('knowledge_user_feedback')
        .select('article_id, is_helpful, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Calculate stats
      const totalArticles = articleStats?.length || 0;
      const publishedArticles = articleStats?.filter(a => a.status === 'published').length || 0;
      const totalViews = articleStats?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;
      const totalHelpful = articleStats?.reduce((sum, a) => sum + (a.helpful_count || 0), 0) || 0;
      const totalNotHelpful = articleStats?.reduce((sum, a) => sum + (a.not_helpful_count || 0), 0) || 0;
      
      const categoryDistribution: Record<string, number> = {};
      articleStats?.forEach(a => {
        categoryDistribution[a.category] = (categoryDistribution[a.category] || 0) + 1;
      });
      
      // Popular searches
      const searchCounts: Record<string, number> = {};
      searchLogs?.forEach(log => {
        const normalizedQuery = log.query.toLowerCase().trim();
        searchCounts[normalizedQuery] = (searchCounts[normalizedQuery] || 0) + 1;
      });
      const popularSearches = Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));
      
      return new Response(JSON.stringify({
        success: true,
        analytics: {
          totalArticles,
          publishedArticles,
          draftArticles: totalArticles - publishedArticles,
          totalViews,
          totalHelpful,
          totalNotHelpful,
          helpfulnessRate: totalHelpful + totalNotHelpful > 0 
            ? Math.round((totalHelpful / (totalHelpful + totalNotHelpful)) * 100) 
            : 0,
          categoryDistribution,
          topArticles: topArticles || [],
          popularSearches,
          recentFeedback: recentFeedback || [],
          searchesLast7Days: searchLogs?.filter(l => {
            const logDate = new Date(l.created_at);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return logDate > weekAgo;
          }).length || 0
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === REINDEX ===
    if (action === 'reindex') {
      // Get all articles without embeddings
      const { data: articlesToIndex, error: fetchError } = await supabase
        .from('knowledge_articles')
        .select('id, title, content')
        .is('embedding', null);
      
      if (fetchError) throw fetchError;
      
      let indexedCount = 0;
      const errors: string[] = [];
      
      for (const article of articlesToIndex || []) {
        try {
          const embedding = await generateEmbedding(`${article.title} ${article.content}`, LOVABLE_API_KEY);
          if (embedding) {
            await supabase
              .from('knowledge_articles')
              .update({ embedding: `[${embedding.join(',')}]` })
              .eq('id', article.id);
            indexedCount++;
          }
        } catch (e) {
          errors.push(`Error indexing ${article.id}: ${e}`);
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Base de conocimiento reindexada',
        indexedCount,
        totalToIndex: articlesToIndex?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SEMANTIC SEARCH ===
    if (action === 'search') {
      if (!query) throw new Error('Query is required for search');
      
      // Log search
      await supabase.from('knowledge_search_logs').insert({
        query,
        query_type: 'search',
        results_count: 0
      });
      
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query, LOVABLE_API_KEY);
      
      // Get all published articles with embeddings
      const { data: articles, error: fetchError } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('status', 'published');
      
      if (fetchError) throw fetchError;
      
      // Calculate similarities
      const results = (articles || [])
        .map(article => {
          let similarity = 0;
          
          if (queryEmbedding && article.embedding) {
            try {
              const articleEmbedding = JSON.parse(article.embedding);
              similarity = cosineSimilarity(queryEmbedding, articleEmbedding);
            } catch {
              // Fallback to text matching
              const queryLower = query.toLowerCase();
              const titleMatch = article.title.toLowerCase().includes(queryLower) ? 0.5 : 0;
              const contentMatch = article.content.toLowerCase().includes(queryLower) ? 0.3 : 0;
              const tagMatch = article.tags.some((t: string) => t.toLowerCase().includes(queryLower)) ? 0.2 : 0;
              similarity = titleMatch + contentMatch + tagMatch;
            }
          } else {
            // Fallback text search
            const queryLower = query.toLowerCase();
            const titleMatch = article.title.toLowerCase().includes(queryLower) ? 0.5 : 0;
            const contentMatch = article.content.toLowerCase().includes(queryLower) ? 0.3 : 0;
            const tagMatch = article.tags.some((t: string) => t.toLowerCase().includes(queryLower)) ? 0.2 : 0;
            similarity = titleMatch + contentMatch + tagMatch;
          }
          
          return { article, similarity };
        })
        .filter(r => r.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(r => ({
          article: {
            id: r.article.id,
            title: r.article.title,
            content: r.article.content,
            summary: r.article.summary,
            category: r.article.category,
            tags: r.article.tags,
            view_count: r.article.view_count,
            helpful_count: r.article.helpful_count,
            last_updated: r.article.updated_at
          },
          similarity: Math.round(r.similarity * 100) / 100,
          matched_chunks: [],
          answer_snippet: r.article.summary || r.article.content.substring(0, 200) + '...'
        }));
      
      // Update search log with results count
      await supabase
        .from('knowledge_search_logs')
        .update({ 
          results_count: results.length,
          top_result_id: results[0]?.article.id 
        })
        .eq('query', query)
        .order('created_at', { ascending: false })
        .limit(1);
      
      return new Response(JSON.stringify({
        success: true,
        results,
        totalResults: results.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === ASK QUESTION (RAG) ===
    if (action === 'ask') {
      if (!question) throw new Error('Question is required');
      
      // Log search
      await supabase.from('knowledge_search_logs').insert({
        query: question,
        query_type: 'ask'
      });
      
      // Get relevant articles
      const queryEmbedding = await generateEmbedding(question, LOVABLE_API_KEY);
      
      const { data: articles } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('status', 'published');
      
      // Find most relevant articles
      const relevantArticles = (articles || [])
        .map(article => {
          let similarity = 0;
          if (queryEmbedding && article.embedding) {
            try {
              const articleEmbedding = JSON.parse(article.embedding);
              similarity = cosineSimilarity(queryEmbedding, articleEmbedding);
            } catch {
              similarity = 0;
            }
          }
          return { article, similarity };
        })
        .filter(r => r.similarity > 0.2)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);
      
      // Build context for AI
      const contextText = relevantArticles
        .map(r => `### ${r.article.title}\n${r.article.content}`)
        .join('\n\n---\n\n');
      
      // Generate answer using AI
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `Eres un asistente experto en banca comercial que responde preguntas basándose en la base de conocimiento interna.

BASE DE CONOCIMIENTO DISPONIBLE:
${contextText || 'No se encontró información relevante.'}

Proporciona respuestas precisas, profesionales y útiles basándote SOLO en la información de la base de conocimiento. Si no hay información suficiente, indícalo claramente.

RESPONDE EN JSON:
{
  "answer": "Respuesta completa y profesional",
  "sources": [{ "title": "Título", "id": "id", "relevance": 0.0-1.0 }],
  "confidence": 0.0-1.0,
  "follow_up_questions": ["Pregunta 1", "Pregunta 2", "Pregunta 3"]
}`
            },
            { role: 'user', content: question }
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      let result;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      } catch {
        result = {
          answer: content || 'No se pudo generar una respuesta.',
          sources: relevantArticles.map(r => ({
            title: r.article.title,
            id: r.article.id,
            relevance: r.similarity
          })),
          confidence: 0.5,
          follow_up_questions: []
        };
      }
      
      return new Response(JSON.stringify({
        success: true,
        response: {
          answer: result.answer || '',
          sources: result.sources || [],
          confidence: result.confidence || 0.5,
          follow_up_questions: result.follow_up_questions || []
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Acción no soportada: ${action}`);

  } catch (error) {
    console.error('[knowledge-base-rag] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
