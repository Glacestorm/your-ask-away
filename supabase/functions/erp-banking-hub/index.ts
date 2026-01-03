import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BankingRequest {
  action: 'sync' | 'auto_reconcile' | 'create_entries' | 'analyze_transaction' | 'get_position';
  company_id: string;
  connection_id?: string;
  sync_type?: 'transactions' | 'balance' | 'full';
  transaction_ids?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, company_id, connection_id, sync_type, transaction_ids } = await req.json() as BankingRequest;

    console.log(`[erp-banking-hub] Action: ${action}, Company: ${company_id}`);

    switch (action) {
      case 'sync': {
        if (!connection_id) throw new Error('connection_id required');

        // Get connection details
        const { data: connection, error: connError } = await supabase
          .from('erp_bank_connections')
          .select('*, provider:erp_banking_providers(*)')
          .eq('id', connection_id)
          .single();

        if (connError || !connection) throw new Error('Connection not found');

        // Create sync log
        const { data: syncLog } = await supabase
          .from('erp_bank_sync_logs')
          .insert({
            connection_id,
            company_id,
            sync_type: sync_type || 'transactions',
            status: 'running',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        // Simulate API sync (in production, connect to actual bank APIs)
        // For now, generate sample transactions for demo
        const sampleTransactions = generateSampleTransactions(connection_id, company_id, 5);
        
        let recordsProcessed = 0;
        for (const tx of sampleTransactions) {
          const { error: insertError } = await supabase
            .from('erp_bank_transactions')
            .upsert(tx, { onConflict: 'connection_id,external_id' });
          
          if (!insertError) recordsProcessed++;
        }

        // Update sync log
        await supabase
          .from('erp_bank_sync_logs')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            records_fetched: sampleTransactions.length,
            records_processed: recordsProcessed
          })
          .eq('id', syncLog?.id);

        // Update connection
        await supabase
          .from('erp_bank_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            status: 'active',
            error_count: 0
          })
          .eq('id', connection_id);

        return new Response(JSON.stringify({
          success: true,
          records_fetched: sampleTransactions.length,
          records_processed: recordsProcessed,
          sync_log_id: syncLog?.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'auto_reconcile': {
        // Get pending transactions
        let query = supabase
          .from('erp_bank_transactions')
          .select('*')
          .eq('company_id', company_id)
          .eq('status', 'pending');

        if (transaction_ids?.length) {
          query = query.in('id', transaction_ids);
        }

        const { data: transactions, error: txError } = await query.limit(50);
        if (txError) throw txError;

        if (!transactions?.length) {
          return new Response(JSON.stringify({
            success: true,
            matched_count: 0,
            message: 'No pending transactions'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get invoices and payments for matching
        const { data: invoices } = await supabase
          .from('erp_sales_invoices')
          .select('id, invoice_number, total_amount, customer_id, due_date')
          .eq('company_id', company_id)
          .eq('status', 'pending');

        const { data: supplierInvoices } = await supabase
          .from('erp_supplier_invoices')
          .select('id, invoice_number, total_amount, supplier_id, due_date')
          .eq('company_id', company_id)
          .eq('status', 'pending');

        // Use AI for intelligent matching
        let matchedCount = 0;
        const aiAnalysisResults: Array<{id: string, analysis: unknown}> = [];

        if (LOVABLE_API_KEY) {
          for (const tx of transactions) {
            const matchContext = {
              transaction: {
                amount: tx.amount,
                description: tx.description,
                reference: tx.reference,
                counterparty: tx.counterparty_name,
                date: tx.transaction_date
              },
              invoices: invoices?.slice(0, 20) || [],
              supplierInvoices: supplierInvoices?.slice(0, 20) || []
            };

            try {
              const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                      content: `Eres un experto en conciliación bancaria. Analiza la transacción y busca coincidencias con facturas.

RESPONDE SOLO JSON:
{
  "matched": true/false,
  "entity_type": "sales_invoice" | "supplier_invoice" | "payment" | null,
  "entity_id": "uuid o null",
  "confidence": 0-100,
  "reasoning": "explicación breve",
  "suggested_account": "código cuenta contable sugerida",
  "category": "ventas" | "compras" | "gastos" | "nominas" | "impuestos" | "financiero" | "otros"
}`
                    },
                    {
                      role: 'user',
                      content: JSON.stringify(matchContext)
                    }
                  ],
                  temperature: 0.3,
                  max_tokens: 500
                })
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                const content = aiData.choices?.[0]?.message?.content;
                
                if (content) {
                  const jsonMatch = content.match(/\{[\s\S]*\}/);
                  if (jsonMatch) {
                    const analysis = JSON.parse(jsonMatch[0]);
                    aiAnalysisResults.push({ id: tx.id, analysis });

                    if (analysis.matched && analysis.confidence >= 80) {
                      await supabase
                        .from('erp_bank_transactions')
                        .update({
                          status: 'matched',
                          matched_entity_type: analysis.entity_type,
                          matched_entity_id: analysis.entity_id,
                          match_confidence: analysis.confidence,
                          ai_analysis: analysis,
                          processed_at: new Date().toISOString()
                        })
                        .eq('id', tx.id);
                      
                      matchedCount++;
                    } else {
                      // Save AI analysis even if not matched
                      await supabase
                        .from('erp_bank_transactions')
                        .update({
                          ai_analysis: analysis,
                          processed_at: new Date().toISOString()
                        })
                        .eq('id', tx.id);
                    }
                  }
                }
              }
            } catch (aiError) {
              console.error('[erp-banking-hub] AI analysis error:', aiError);
            }
          }
        } else {
          // Fallback: simple amount matching
          for (const tx of transactions) {
            const absAmount = Math.abs(tx.amount);
            
            // Check sales invoices for incoming payments
            if (tx.amount > 0 && invoices) {
              const match = invoices.find(inv => Math.abs(inv.total_amount - absAmount) < 0.01);
              if (match) {
                await supabase
                  .from('erp_bank_transactions')
                  .update({
                    status: 'matched',
                    matched_entity_type: 'sales_invoice',
                    matched_entity_id: match.id,
                    match_confidence: 95,
                    processed_at: new Date().toISOString()
                  })
                  .eq('id', tx.id);
                matchedCount++;
              }
            }
            
            // Check supplier invoices for outgoing payments
            if (tx.amount < 0 && supplierInvoices) {
              const match = supplierInvoices.find(inv => Math.abs(inv.total_amount - absAmount) < 0.01);
              if (match) {
                await supabase
                  .from('erp_bank_transactions')
                  .update({
                    status: 'matched',
                    matched_entity_type: 'supplier_invoice',
                    matched_entity_id: match.id,
                    match_confidence: 95,
                    processed_at: new Date().toISOString()
                  })
                  .eq('id', tx.id);
                matchedCount++;
              }
            }
          }
        }

        return new Response(JSON.stringify({
          success: true,
          matched_count: matchedCount,
          total_processed: transactions.length,
          ai_analysis: aiAnalysisResults
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'create_entries': {
        if (!transaction_ids?.length) throw new Error('transaction_ids required');

        // Get matched transactions
        const { data: transactions, error: txError } = await supabase
          .from('erp_bank_transactions')
          .select('*')
          .in('id', transaction_ids)
          .eq('status', 'matched');

        if (txError) throw txError;

        let entriesCreated = 0;

        for (const tx of transactions || []) {
          // Get default journal for bank entries
          const { data: journal } = await supabase
            .from('erp_journals')
            .select('id')
            .eq('company_id', company_id)
            .eq('journal_type', 'bank')
            .limit(1)
            .single();

          if (!journal) continue;

          // Create journal entry
          const { data: entry, error: entryError } = await supabase
            .from('erp_journal_entries')
            .insert({
              company_id,
              journal_id: journal.id,
              entry_date: tx.transaction_date,
              description: tx.description || `Transacción bancaria: ${tx.reference || tx.external_id}`,
              reference: tx.reference || tx.external_id,
              status: 'draft',
              source_type: 'bank_transaction',
              source_id: tx.id
            })
            .select()
            .single();

          if (entryError || !entry) continue;

          // Create entry lines (simplified - in production, use proper account mapping)
          const bankAccountCode = '572'; // Bancos
          const counterAccountCode = tx.amount > 0 ? '430' : '400'; // Clientes / Proveedores

          await supabase.from('erp_journal_entry_lines').insert([
            {
              entry_id: entry.id,
              account_code: bankAccountCode,
              debit_amount: tx.amount > 0 ? Math.abs(tx.amount) : 0,
              credit_amount: tx.amount < 0 ? Math.abs(tx.amount) : 0,
              description: tx.description
            },
            {
              entry_id: entry.id,
              account_code: counterAccountCode,
              debit_amount: tx.amount < 0 ? Math.abs(tx.amount) : 0,
              credit_amount: tx.amount > 0 ? Math.abs(tx.amount) : 0,
              description: tx.description
            }
          ]);

          // Update transaction
          await supabase
            .from('erp_bank_transactions')
            .update({
              status: 'reconciled',
              journal_entry_id: entry.id,
              reconciled_at: new Date().toISOString()
            })
            .eq('id', tx.id);

          entriesCreated++;
        }

        return new Response(JSON.stringify({
          success: true,
          entries_created: entriesCreated
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_position': {
        // Calculate current bank position
        const { data: accounts } = await supabase
          .from('erp_bank_accounts')
          .select('*')
          .eq('company_id', company_id)
          .eq('is_active', true);

        const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.current_balance || 0), 0) || 0;
        const totalAvailable = accounts?.reduce((sum, acc) => sum + (acc.available_balance || 0), 0) || 0;
        const totalCreditLines = accounts?.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0) || 0;

        const byCurrency: Record<string, number> = {};
        const byBank: Record<string, number> = {};
        const byAccount: Record<string, { balance: number; name: string }> = {};

        for (const acc of accounts || []) {
          const currency = acc.currency || 'EUR';
          const bank = acc.bank_name || 'Sin banco';
          
          byCurrency[currency] = (byCurrency[currency] || 0) + (acc.current_balance || 0);
          byBank[bank] = (byBank[bank] || 0) + (acc.current_balance || 0);
          byAccount[acc.id] = { balance: acc.current_balance || 0, name: acc.account_name };
        }

        // Upsert position
        const today = new Date().toISOString().split('T')[0];
        const { data: position } = await supabase
          .from('erp_bank_positions')
          .upsert({
            company_id,
            position_date: today,
            total_balance: totalBalance,
            total_available: totalAvailable,
            total_credit_lines: totalCreditLines,
            total_used_credit: totalCreditLines - totalAvailable,
            by_currency: byCurrency,
            by_bank: byBank,
            by_account: byAccount
          }, { onConflict: 'company_id,position_date' })
          .select()
          .single();

        return new Response(JSON.stringify({
          success: true,
          position
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[erp-banking-hub] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to generate sample transactions for demo
function generateSampleTransactions(connectionId: string, companyId: string, count: number) {
  const descriptions = [
    'Transferencia recibida cliente',
    'Pago proveedor factura',
    'Comisión bancaria',
    'Intereses préstamo',
    'Cobro remesa',
    'Pago nóminas',
    'Ingreso efectivo',
    'Domiciliación suministros'
  ];

  const transactions = [];
  for (let i = 0; i < count; i++) {
    const isIncoming = Math.random() > 0.5;
    const amount = (Math.random() * 5000 + 100) * (isIncoming ? 1 : -1);
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    transactions.push({
      connection_id: connectionId,
      company_id: companyId,
      external_id: `TXN-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      transaction_date: date.toISOString().split('T')[0],
      value_date: date.toISOString().split('T')[0],
      amount: Math.round(amount * 100) / 100,
      currency: 'EUR',
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      reference: `REF-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      counterparty_name: isIncoming ? 'Cliente Demo S.L.' : 'Proveedor Demo S.A.',
      status: 'pending'
    });
  }

  return transactions;
}
