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
    const { companyId, statementId, fiscalYear } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch financial data for the company
    const { data: balanceSheet } = await supabase
      .from('balance_sheets')
      .select('*')
      .eq('statement_id', statementId)
      .single();

    const { data: incomeStatement } = await supabase
      .from('income_statements')
      .select('*')
      .eq('statement_id', statementId)
      .single();

    const { data: cashFlow } = await supabase
      .from('cash_flow_statements')
      .select('statement_id, operating_result, corporate_tax_paid, financing_dividends_paid')
      .eq('statement_id', statementId)
      .single();

    const { data: financialNotes } = await supabase
      .from('financial_notes')
      .select('*')
      .eq('statement_id', statementId);

    const { data: company } = await supabase
      .from('companies')
      .select('name, bp, tax_id, cnae, sector')
      .eq('id', companyId)
      .single();

    // Create text chunks from financial data
    const chunks: { content: string; type: string; metadata: Record<string, unknown> }[] = [];

    if (balanceSheet) {
      const balanceText = `Balance Sheet for ${company?.name || 'Company'} (${fiscalYear}):
        Assets: Intangible ${balanceSheet.intangible_assets || 0}€, Tangible ${balanceSheet.tangible_assets || 0}€, 
        Inventory ${balanceSheet.inventory || 0}€, Trade Receivables ${balanceSheet.trade_receivables || 0}€, 
        Cash ${balanceSheet.cash_equivalents || 0}€.
        Liabilities: Share Capital ${balanceSheet.share_capital || 0}€, Reserves ${balanceSheet.voluntary_reserves || 0}€,
        Long-term Debt ${balanceSheet.long_term_debts || 0}€, Short-term Debt ${balanceSheet.short_term_debts || 0}€,
        Trade Payables ${balanceSheet.trade_payables || 0}€.
        Result: ${balanceSheet.current_year_result || 0}€.`;
      
      chunks.push({
        content: balanceText,
        type: 'balance_sheet',
        metadata: { 
          total_assets: (balanceSheet.intangible_assets || 0) + (balanceSheet.tangible_assets || 0) + (balanceSheet.inventory || 0) + (balanceSheet.trade_receivables || 0) + (balanceSheet.cash_equivalents || 0),
          company_name: company?.name
        }
      });
    }

    if (incomeStatement) {
      const incomeText = `Income Statement for ${company?.name || 'Company'} (${fiscalYear}):
        Net Turnover ${incomeStatement.net_turnover || 0}€, Work Performed ${incomeStatement.work_performed || 0}€,
        Raw Materials ${incomeStatement.raw_materials || 0}€, Personnel Expenses ${incomeStatement.personnel_expenses || 0}€,
        Depreciation ${incomeStatement.depreciation || 0}€, Operating Result ${incomeStatement.operating_result || 0}€,
        Financial Result ${incomeStatement.financial_result || 0}€, Pre-tax Result ${incomeStatement.pretax_result || 0}€,
        Net Result ${incomeStatement.net_result || 0}€.`;
      
      chunks.push({
        content: incomeText,
        type: 'income_statement',
        metadata: {
          net_turnover: incomeStatement.net_turnover,
          net_result: incomeStatement.net_result,
          company_name: company?.name
        }
      });
    }

    if (cashFlow) {
      const cashFlowText = `Cash Flow Statement for ${company?.name || 'Company'} (${fiscalYear}):
        Operating Result ${cashFlow.operating_result || 0}€, Corporate Tax Paid ${cashFlow.corporate_tax_paid || 0}€,
        Dividends Paid ${cashFlow.financing_dividends_paid || 0}€.`;
      
      chunks.push({
        content: cashFlowText,
        type: 'cash_flow',
        metadata: { company_name: company?.name }
      });
    }

    if (financialNotes && financialNotes.length > 0) {
      for (const note of financialNotes) {
        chunks.push({
          content: `Financial Note (${note.note_type || 'general'}): ${note.content}`,
          type: 'notes',
          metadata: { note_type: note.note_type, company_name: company?.name }
        });
      }
    }

    // Generate embeddings for each chunk using Lovable AI
    const embeddings: { content: string; embedding: number[]; type: string; metadata: Record<string, unknown> }[] = [];

    for (const chunk of chunks) {
      const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: chunk.content
        }),
      });

      if (!embeddingResponse.ok) {
        console.error("Embedding generation failed:", await embeddingResponse.text());
        continue;
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data?.[0]?.embedding;

      if (embedding) {
        embeddings.push({
          content: chunk.content,
          embedding,
          type: chunk.type,
          metadata: chunk.metadata
        });
      }
    }

    // Delete existing embeddings for this statement
    await supabase
      .from('financial_document_embeddings')
      .delete()
      .eq('statement_id', statementId);

    // Store embeddings in database
    for (let i = 0; i < embeddings.length; i++) {
      const emb = embeddings[i];
      await supabase
        .from('financial_document_embeddings')
        .insert({
          company_id: companyId,
          statement_id: statementId,
          document_type: emb.type,
          fiscal_year: fiscalYear,
          chunk_index: i,
          content: emb.content,
          metadata: emb.metadata,
          embedding: `[${emb.embedding.join(',')}]`
        });
    }

    console.log(`Generated ${embeddings.length} embeddings for statement ${statementId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      embeddingsCount: embeddings.length,
      message: `Successfully generated ${embeddings.length} embeddings`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating embeddings:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
