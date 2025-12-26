import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmbeddingRequest {
  action: 'generate' | 'search' | 'bulk_generate';
  documentId?: string;
  documentIds?: string[];
  query?: string;
  limit?: number;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, documentId, documentIds, query, limit = 5, category } = await req.json() as EmbeddingRequest;

    console.log(`[support-knowledge-embeddings] Action: ${action}`);

    // === GENERATE EMBEDDING FOR SINGLE DOCUMENT ===
    if (action === 'generate' && documentId) {
      const { data: doc, error: docError } = await supabase
        .from('support_knowledge_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Update status to processing
      await supabase
        .from('support_knowledge_documents')
        .update({ embedding_status: 'processing' })
        .eq('id', documentId);

      // Create text for embedding
      const textToEmbed = `${doc.title}\n\n${doc.content}\n\nCategoría: ${doc.category || 'general'}\nTags: ${(doc.tags || []).join(', ')}`;

      // Generate embedding using Lovable AI
      const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: textToEmbed
        }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error("Embedding generation failed:", errorText);
        
        await supabase
          .from('support_knowledge_documents')
          .update({ embedding_status: 'failed' })
          .eq('id', documentId);

        if (embeddingResponse.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded', 
            message: 'Demasiadas solicitudes. Intenta más tarde.' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        throw new Error(`Embedding API error: ${embeddingResponse.status}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data?.[0]?.embedding;

      if (!embedding) {
        throw new Error("No embedding returned from API");
      }

      // Store embedding in metadata
      const { error: updateError } = await supabase
        .from('support_knowledge_documents')
        .update({ 
          embedding_status: 'completed',
          metadata: {
            ...((doc.metadata as Record<string, unknown>) || {}),
            embedding: embedding,
            embedding_generated_at: new Date().toISOString(),
            embedding_model: 'text-embedding-3-small'
          }
        })
        .eq('id', documentId);

      if (updateError) {
        throw updateError;
      }

      console.log(`[support-knowledge-embeddings] Generated embedding for document ${documentId}`);

      return new Response(JSON.stringify({
        success: true,
        documentId,
        message: 'Embedding generated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === BULK GENERATE EMBEDDINGS ===
    if (action === 'bulk_generate') {
      const targetIds = documentIds || [];
      
      // If no specific IDs, get all documents without embeddings
      let docsToProcess: string[] = targetIds;
      
      if (docsToProcess.length === 0) {
        const { data: pendingDocs } = await supabase
          .from('support_knowledge_documents')
          .select('id')
          .in('embedding_status', ['pending', 'failed'])
          .limit(10);
        
        docsToProcess = (pendingDocs || []).map(d => d.id);
      }

      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const docId of docsToProcess) {
        try {
          const { data: doc } = await supabase
            .from('support_knowledge_documents')
            .select('*')
            .eq('id', docId)
            .single();

          if (!doc) continue;

          await supabase
            .from('support_knowledge_documents')
            .update({ embedding_status: 'processing' })
            .eq('id', docId);

          const textToEmbed = `${doc.title}\n\n${doc.content}\n\nCategoría: ${doc.category || 'general'}\nTags: ${(doc.tags || []).join(', ')}`;

          const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: textToEmbed
            }),
          });

          if (!embeddingResponse.ok) {
            throw new Error(`API error: ${embeddingResponse.status}`);
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data?.[0]?.embedding;

          if (embedding) {
            await supabase
              .from('support_knowledge_documents')
              .update({ 
                embedding_status: 'completed',
                metadata: {
                  ...((doc.metadata as Record<string, unknown>) || {}),
                  embedding: embedding,
                  embedding_generated_at: new Date().toISOString(),
                  embedding_model: 'text-embedding-3-small'
                }
              })
              .eq('id', docId);

            results.push({ id: docId, success: true });
          }
        } catch (err) {
          console.error(`Error processing document ${docId}:`, err);
          
          await supabase
            .from('support_knowledge_documents')
            .update({ embedding_status: 'failed' })
            .eq('id', docId);

          results.push({ 
            id: docId, 
            success: false, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return new Response(JSON.stringify({
        success: true,
        processed: results.length,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // === SEMANTIC SEARCH ===
    if (action === 'search' && query) {
      // Generate embedding for query
      const queryEmbeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: query
        }),
      });

      if (!queryEmbeddingResponse.ok) {
        if (queryEmbeddingResponse.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded', 
            message: 'Demasiadas solicitudes. Intenta más tarde.' 
          }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`Query embedding failed: ${queryEmbeddingResponse.status}`);
      }

      const queryEmbeddingData = await queryEmbeddingResponse.json();
      const queryEmbedding = queryEmbeddingData.data?.[0]?.embedding;

      if (!queryEmbedding) {
        throw new Error("No query embedding returned");
      }

      // Get all documents with embeddings
      let docsQuery = supabase
        .from('support_knowledge_documents')
        .select('id, title, content, document_type, category, tags, metadata, is_published')
        .eq('embedding_status', 'completed')
        .eq('is_published', true);

      if (category) {
        docsQuery = docsQuery.eq('category', category);
      }

      const { data: docs, error: docsError } = await docsQuery;

      if (docsError) {
        throw docsError;
      }

      // Calculate cosine similarity for each document
      const resultsWithScores = (docs || [])
        .map(doc => {
          const docEmbedding = (doc.metadata as any)?.embedding;
          if (!docEmbedding) return null;

          const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
          return {
            id: doc.id,
            title: doc.title,
            content: doc.content,
            document_type: doc.document_type,
            category: doc.category,
            tags: doc.tags,
            similarity_score: similarity
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);

      // Log usage
      for (const result of resultsWithScores) {
        await supabase
          .from('support_knowledge_usage')
          .insert({
            document_id: result.id,
            usage_type: 'semantic_search',
            context: { query, similarity_score: result.similarity_score }
          });
      }

      console.log(`[support-knowledge-embeddings] Search found ${resultsWithScores.length} results for: "${query}"`);

      return new Response(JSON.stringify({
        success: true,
        query,
        results: resultsWithScores
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`Invalid action: ${action}`);

  } catch (error) {
    console.error('[support-knowledge-embeddings] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Cosine similarity helper function
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
