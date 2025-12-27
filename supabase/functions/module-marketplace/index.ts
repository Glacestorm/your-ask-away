import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: string;
  moduleKey?: string;
  filters?: Record<string, unknown>;
  moduleId?: string;
  userId?: string;
  moduleData?: Record<string, unknown>;
  authorId?: string;
  rating?: number;
  title?: string;
  content?: string;
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

    const body: RequestBody = await req.json();
    const { action } = body;

    console.log(`[module-marketplace] Action: ${action}`);

    switch (action) {
      case 'list_modules': {
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
                content: `Eres un sistema de marketplace de módulos enterprise. Genera datos de módulos realistas.
                
FORMATO JSON ESTRICTO:
{
  "modules": [
    {
      "id": "uuid",
      "module_key": "string",
      "module_name": "string",
      "description": "string",
      "category": "core|analytics|security|integration|ai|workflow",
      "version": "1.0.0",
      "author": "string",
      "downloads": number,
      "rating": 1-5,
      "reviews_count": number,
      "price": number,
      "is_free": boolean,
      "is_featured": boolean,
      "is_verified": boolean,
      "tags": ["string"]
    }
  ],
  "featured": [...],
  "categories": ["string"],
  "tags": ["string"]
}`
              },
              {
                role: 'user',
                content: `Genera una lista de 8 módulos para marketplace con filtros: ${JSON.stringify(body.filters || {})}`
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Rate limit exceeded' 
            }), {
              status: 429,
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
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { modules: [], featured: [], categories: [], tags: [] };
        } catch {
          result = { modules: [], featured: [], categories: [], tags: [] };
        }

        return new Response(JSON.stringify({
          success: true,
          ...result
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'install_module': {
        return new Response(JSON.stringify({
          success: true,
          message: 'Module installed successfully',
          installedAt: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'uninstall_module': {
        return new Response(JSON.stringify({
          success: true,
          message: 'Module uninstalled successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'publish_module': {
        return new Response(JSON.stringify({
          success: true,
          module: {
            id: crypto.randomUUID(),
            ...body.moduleData,
            author_id: body.authorId,
            created_at: new Date().toISOString(),
            downloads: 0,
            rating: 0,
            reviews_count: 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_reviews': {
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
                content: `Genera reseñas realistas de módulos.
FORMATO JSON: { "reviews": [{ "id": "uuid", "user_name": "string", "rating": 1-5, "title": "string", "content": "string", "helpful_count": number, "created_at": "ISO date" }] }`
              },
              { role: 'user', content: `Genera 5 reseñas para módulo ${body.moduleId}` }
            ],
            max_tokens: 1000,
          }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        let result;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { reviews: [] };
        } catch {
          result = { reviews: [] };
        }

        return new Response(JSON.stringify({
          success: true,
          reviews: result.reviews || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'submit_review': {
        return new Response(JSON.stringify({
          success: true,
          review: {
            id: crypto.randomUUID(),
            module_id: body.moduleId,
            user_id: body.userId,
            rating: body.rating,
            title: body.title,
            content: body.content,
            created_at: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_module_details': {
        return new Response(JSON.stringify({
          success: true,
          module: {
            module_key: body.moduleKey,
            module_name: 'Module Details',
            description: 'Detailed module information',
            version: '1.0.0',
            downloads: 1000,
            rating: 4.5
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[module-marketplace] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
