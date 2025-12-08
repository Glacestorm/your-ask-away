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
    const { query, companyId, fiscalYear, conversationId, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate embedding for the query
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
      throw new Error("Failed to generate query embedding");
    }

    const queryEmbeddingData = await queryEmbeddingResponse.json();
    const queryEmbedding = queryEmbeddingData.data?.[0]?.embedding;

    if (!queryEmbedding) {
      throw new Error("No embedding returned for query");
    }

    // Search for similar embeddings using the database function
    const { data: similarDocs, error: searchError } = await supabase.rpc(
      'search_financial_embeddings',
      {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.5,
        match_count: 8,
        filter_company_id: companyId || null,
        filter_fiscal_year: fiscalYear || null
      }
    );

    if (searchError) {
      console.error("Search error:", searchError);
      throw new Error("Failed to search embeddings");
    }

    // Build context from similar documents
    const context = similarDocs?.map((doc: { content: string; document_type: string; fiscal_year: number; similarity: number }) => 
      `[${doc.document_type} - Year ${doc.fiscal_year}]: ${doc.content}`
    ).join('\n\n') || 'No relevant financial documents found.';

    // Get company info if companyId provided
    let companyInfo = '';
    if (companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('name, bp, tax_id, cnae, sector')
        .eq('id', companyId)
        .single();
      
      if (company) {
        companyInfo = `Company: ${company.name}, BP: ${company.bp || 'N/A'}, Sector: ${company.sector || 'N/A'}`;
      }
    }

    // Generate response using RAG
    const systemPrompt = `You are a financial analyst assistant specialized in analyzing company financial statements according to the PGC (Plan General Contable) of Andorra and Spain. 

You have access to the following financial documents:
${context}

${companyInfo ? `Context: ${companyInfo}` : ''}

Guidelines:
- Provide accurate financial analysis based ONLY on the provided documents
- Use specific numbers and ratios when available
- If information is not in the documents, clearly state that
- Respond in the same language as the user's question
- Be concise but thorough in your analysis
- Calculate and explain relevant financial ratios when appropriate (liquidity, solvency, profitability)`;

    const chatResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 2000
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Chat API error:", errorText);
      
      if (chatResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (chatResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error("Failed to generate response");
    }

    const chatData = await chatResponse.json();
    const assistantMessage = chatData.choices?.[0]?.message?.content || "Unable to generate response.";

    // Store messages in conversation if conversationId provided
    if (conversationId && userId) {
      // Store user message
      await supabase.from('financial_rag_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: query,
        sources: []
      });

      // Store assistant message with sources
      await supabase.from('financial_rag_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage,
        sources: similarDocs?.map((doc: { id: string; document_type: string; fiscal_year: number; similarity: number }) => ({
          id: doc.id,
          type: doc.document_type,
          year: doc.fiscal_year,
          similarity: doc.similarity
        })) || []
      });
    }

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      sources: similarDocs?.map((doc: { id: string; document_type: string; fiscal_year: number; similarity: number; content: string }) => ({
        id: doc.id,
        type: doc.document_type,
        year: doc.fiscal_year,
        similarity: Math.round(doc.similarity * 100),
        excerpt: doc.content.substring(0, 200) + '...'
      })) || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in RAG chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
