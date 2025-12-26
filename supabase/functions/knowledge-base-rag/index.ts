import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevance_score?: number;
  last_updated: string;
  view_count: number;
  helpful_count: number;
}

interface RAGRequest {
  action: 'search' | 'ask' | 'answer' | 'suggest_related' | 'summarize_topic' | 'add_article' | 'update_article' | 'list_articles' | 'reindex';
  query?: string;
  question?: string;
  topic?: string;
  limit?: number;
  article?: Partial<KnowledgeArticle>;
  id?: string;
  updates?: Partial<KnowledgeArticle>;
  category?: string;
  context?: {
    department?: string;
    userRole?: string;
    previousQueries?: string[];
  };
  filters?: {
    categories?: string[];
    dateRange?: { start: string; end: string };
    sources?: string[];
  };
}

// Simulated knowledge base (in production, this would be in a database)
const MOCK_ARTICLES: KnowledgeArticle[] = [
  {
    id: '1',
    title: 'Guía de Onboarding para Nuevos Gestores',
    content: 'Esta guía cubre los pasos esenciales para el onboarding de nuevos gestores comerciales. Incluye configuración de cuenta, formación inicial, asignación de cartera y primeros objetivos. El proceso de onboarding debe completarse en 2 semanas.',
    category: 'guias',
    tags: ['onboarding', 'gestores', 'formación'],
    last_updated: new Date().toISOString(),
    view_count: 156,
    helpful_count: 42
  },
  {
    id: '2',
    title: 'Política de Gestión de Riesgos',
    content: 'Normativa interna sobre la evaluación y gestión de riesgos en operaciones comerciales. Define los niveles de aprobación, límites de exposición y procedimientos de escalado para diferentes tipos de productos financieros.',
    category: 'normativa',
    tags: ['riesgos', 'compliance', 'políticas'],
    last_updated: new Date(Date.now() - 86400000).toISOString(),
    view_count: 89,
    helpful_count: 28
  },
  {
    id: '3',
    title: 'Productos de Financiación Empresarial',
    content: 'Catálogo completo de productos de financiación para empresas. Incluye líneas de crédito, préstamos a plazo, leasing, factoring y confirming. Cada producto tiene sus condiciones, requisitos y comisiones específicas.',
    category: 'productos',
    tags: ['financiación', 'empresas', 'productos'],
    last_updated: new Date(Date.now() - 172800000).toISOString(),
    view_count: 234,
    helpful_count: 67
  },
  {
    id: '4',
    title: 'FAQ: Preguntas Frecuentes de Clientes',
    content: 'Recopilación de las preguntas más frecuentes de clientes y sus respuestas. Incluye temas como apertura de cuentas, tipos de interés, plazos de tramitación, documentación requerida y canales de contacto.',
    category: 'faqs',
    tags: ['faq', 'clientes', 'soporte'],
    last_updated: new Date(Date.now() - 259200000).toISOString(),
    view_count: 412,
    helpful_count: 156
  },
  {
    id: '5',
    title: 'Proceso de Análisis de Solvencia',
    content: 'Procedimiento estándar para el análisis de solvencia de clientes empresariales. Incluye verificación de estados financieros, análisis de ratios, evaluación de garantías y scoring interno.',
    category: 'procesos',
    tags: ['solvencia', 'análisis', 'procedimientos'],
    last_updated: new Date(Date.now() - 345600000).toISOString(),
    view_count: 178,
    helpful_count: 45
  },
  {
    id: '6',
    title: 'Solución de Errores Comunes en CRM',
    content: 'Guía de resolución de problemas técnicos comunes en el sistema CRM. Incluye errores de sincronización, problemas de acceso, fallos en informes y cómo escalar incidencias al equipo técnico.',
    category: 'troubleshooting',
    tags: ['errores', 'técnico', 'soporte'],
    last_updated: new Date(Date.now() - 432000000).toISOString(),
    view_count: 567,
    helpful_count: 234
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const requestBody = await req.json() as RAGRequest;
    const { action, query, question, topic, limit = 5, article, id, updates, category, context, filters } = requestBody;
    
    console.log(`[knowledge-base-rag] Processing action: ${action}`);

    // Handle non-AI actions first
    if (action === 'list_articles') {
      let articles = [...MOCK_ARTICLES];
      if (category && category !== 'all') {
        articles = articles.filter(a => a.category === category);
      }
      return new Response(JSON.stringify({
        success: true,
        articles,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'add_article') {
      const newArticle: KnowledgeArticle = {
        id: crypto.randomUUID(),
        title: article?.title || 'Nuevo Artículo',
        content: article?.content || '',
        category: article?.category || 'general',
        tags: article?.tags || [],
        last_updated: new Date().toISOString(),
        view_count: 0,
        helpful_count: 0
      };
      
      return new Response(JSON.stringify({
        success: true,
        article: newArticle,
        message: 'Artículo añadido correctamente',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_article') {
      const existingArticle = MOCK_ARTICLES.find(a => a.id === id);
      if (!existingArticle) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Artículo no encontrado'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const updatedArticle = { ...existingArticle, ...updates, last_updated: new Date().toISOString() };
      
      return new Response(JSON.stringify({
        success: true,
        article: updatedArticle,
        message: 'Artículo actualizado correctamente',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reindex') {
      // Simulate reindexing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Base de conocimiento reindexada correctamente',
        indexedCount: MOCK_ARTICLES.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // AI-powered actions
    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'search':
        systemPrompt = `Eres un sistema de búsqueda semántica de base de conocimiento empresarial bancario.

ARTÍCULOS DISPONIBLES:
${MOCK_ARTICLES.map(a => `- ID: ${a.id}, Título: "${a.title}", Categoría: ${a.category}, Tags: ${a.tags.join(', ')}`).join('\n')}

Analiza la consulta del usuario y devuelve los artículos más relevantes ordenados por similitud.

RESPONDE EN JSON ESTRICTO:
{
  "results": [
    {
      "article": {
        "id": string,
        "title": string,
        "content": string,
        "category": string,
        "tags": string[],
        "last_updated": string,
        "view_count": number,
        "helpful_count": number
      },
      "similarity": number (0-1),
      "matched_chunks": string[],
      "answer_snippet": string
    }
  ],
  "totalResults": number
}`;
        userPrompt = `Busca artículos relevantes para: "${query}"
Límite: ${limit} resultados
${filters ? `Filtros: ${JSON.stringify(filters)}` : ''}`;
        break;

      case 'ask':
        systemPrompt = `Eres un asistente experto en banca comercial que responde preguntas basándose en la base de conocimiento interna.

BASE DE CONOCIMIENTO DISPONIBLE:
${MOCK_ARTICLES.map(a => `
### ${a.title} (${a.category})
${a.content}
Tags: ${a.tags.join(', ')}
`).join('\n---\n')}

Proporciona respuestas precisas, profesionales y útiles. Cita las fuentes cuando sea apropiado.

RESPONDE EN JSON ESTRICTO:
{
  "answer": string (respuesta completa y profesional),
  "sources": [
    { "title": string, "id": string, "relevance": number }
  ],
  "confidence": number (0-1),
  "follow_up_questions": string[]
}`;
        userPrompt = `Pregunta del usuario: "${question}"
${context ? `Contexto: ${JSON.stringify(context)}` : ''}`;
        break;

      case 'answer':
        systemPrompt = `Eres un asistente de conocimiento empresarial bancario que responde preguntas basándose en documentación interna.

BASE DE CONOCIMIENTO:
${MOCK_ARTICLES.map(a => `- ${a.title}: ${a.content.substring(0, 200)}...`).join('\n')}

RESPONDE EN JSON ESTRICTO:
{
  "answer": string,
  "confidence": number,
  "sources": [
    { "title": string, "url": string, "relevance": number }
  ],
  "relatedTopics": string[],
  "followUpQuestions": string[],
  "disclaimer": string | null
}`;
        userPrompt = `Pregunta: "${query}"
Contexto del usuario: ${JSON.stringify(context || {})}`;
        break;

      case 'suggest_related':
        systemPrompt = `Eres un sistema de recomendación de contenido de base de conocimiento bancario.

ARTÍCULOS DISPONIBLES:
${MOCK_ARTICLES.map(a => `- ${a.title} (${a.category}): ${a.content.substring(0, 100)}...`).join('\n')}

RESPONDE EN JSON ESTRICTO:
{
  "relatedArticles": [
    { "title": string, "summary": string, "relevance": string }
  ],
  "expertContacts": [
    { "name": string, "expertise": string, "department": string }
  ],
  "trainingResources": string[],
  "externalResources": string[]
}`;
        userPrompt = `Sugiere contenido relacionado con: "${topic}"`;
        break;

      case 'summarize_topic':
        systemPrompt = `Eres un sintetizador de conocimiento corporativo bancario.

BASE DE CONOCIMIENTO:
${MOCK_ARTICLES.map(a => `- ${a.title}: ${a.content}`).join('\n')}

RESPONDE EN JSON ESTRICTO:
{
  "topicSummary": string,
  "keyDefinitions": [{ "term": string, "definition": string }],
  "bestPractices": string[],
  "commonMistakes": string[],
  "usefulLinks": string[],
  "lastUpdated": string
}`;
        userPrompt = `Resume el tema: "${topic}"`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

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
        temperature: 0.6,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
      result = { rawContent: content, parseError: true };
    }

    console.log(`[knowledge-base-rag] Success: ${action}`);

    // Format response based on action
    let formattedResponse: any = {
      success: true,
      action,
      timestamp: new Date().toISOString()
    };

    if (action === 'search') {
      formattedResponse.results = result.results || [];
      formattedResponse.totalResults = result.totalResults || 0;
    } else if (action === 'ask') {
      formattedResponse.response = {
        answer: result.answer || '',
        sources: result.sources || [],
        confidence: result.confidence || 0.5,
        follow_up_questions: result.follow_up_questions || []
      };
    } else {
      formattedResponse.data = result;
    }

    return new Response(JSON.stringify(formattedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
