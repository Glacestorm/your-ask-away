import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MCC Code to Category mapping
const mccCategories: Record<string, { category: string; subcategory: string }> = {
  '5411': { category: 'Alimentación', subcategory: 'Supermercados' },
  '5541': { category: 'Transporte', subcategory: 'Gasolineras' },
  '5812': { category: 'Restauración', subcategory: 'Restaurantes' },
  '5813': { category: 'Restauración', subcategory: 'Bares y Cafeterías' },
  '5912': { category: 'Salud', subcategory: 'Farmacias' },
  '5311': { category: 'Comercio', subcategory: 'Grandes Almacenes' },
  '5651': { category: 'Comercio', subcategory: 'Ropa y Moda' },
  '5732': { category: 'Tecnología', subcategory: 'Electrónica' },
  '5942': { category: 'Ocio', subcategory: 'Librerías' },
  '7011': { category: 'Viajes', subcategory: 'Hoteles' },
  '4111': { category: 'Transporte', subcategory: 'Transporte Público' },
  '4121': { category: 'Transporte', subcategory: 'Taxis' },
  '6011': { category: 'Finanzas', subcategory: 'Cajeros ATM' },
  '4814': { category: 'Telecomunicaciones', subcategory: 'Telefonía' },
  '4900': { category: 'Servicios', subcategory: 'Suministros' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, companyId } = await req.json();
    
    if (!transactions || !Array.isArray(transactions)) {
      throw new Error('Se requiere un array de transacciones');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    const enrichedTransactions = [];

    for (const tx of transactions) {
      // Basic enrichment from MCC if available
      let category = 'Sin categoría';
      let subcategory = '';
      
      if (tx.mcc_code && mccCategories[tx.mcc_code]) {
        category = mccCategories[tx.mcc_code].category;
        subcategory = mccCategories[tx.mcc_code].subcategory;
      }

      // Detect recurring patterns
      const isRecurring = detectRecurring(tx.raw_description || tx.description || '');
      
      // Use AI for advanced enrichment
      let merchantName = tx.merchant_name || '';
      let merchantLogo = '';
      
      if (!merchantName && tx.raw_description) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              max_tokens: 500,
              messages: [
                {
                  role: 'system',
                  content: `Eres un experto en análisis de transacciones bancarias. Extrae información del comerciante de la descripción de la transacción.
                  
Responde SOLO con JSON válido:
{
  "merchant_name": "Nombre limpio del comerciante",
  "category": "Categoría principal",
  "subcategory": "Subcategoría",
  "is_subscription": true/false,
  "subscription_type": "mensual/anual/semanal/null"
}`
                },
                {
                  role: 'user',
                  content: `Descripción de transacción: "${tx.raw_description}"\nImporte: ${tx.amount}€`
                }
              ]
            })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || '';
            
            try {
              const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
              merchantName = parsed.merchant_name || merchantName;
              if (!category || category === 'Sin categoría') {
                category = parsed.category || category;
                subcategory = parsed.subcategory || subcategory;
              }
            } catch (e) {
              console.log('Could not parse AI response:', e);
            }
          }
        } catch (e) {
          console.log('AI enrichment failed:', e);
        }
      }

      const enriched = {
        company_id: companyId,
        original_transaction_id: tx.id || tx.transaction_id,
        transaction_date: tx.date || tx.transaction_date,
        amount: parseFloat(tx.amount) || 0,
        merchant_name: merchantName,
        merchant_logo_url: merchantLogo,
        category,
        subcategory,
        mcc_code: tx.mcc_code || null,
        location: tx.location || {},
        is_recurring: isRecurring.isRecurring,
        recurring_type: isRecurring.type,
        recurring_frequency: isRecurring.frequency,
        confidence_score: merchantName ? 0.9 : 0.5,
        raw_description: tx.raw_description || tx.description,
      };

      enrichedTransactions.push(enriched);
    }

    // Store enriched transactions
    if (enrichedTransactions.length > 0 && companyId) {
      const { error: insertError } = await supabase
        .from('enriched_transactions')
        .insert(enrichedTransactions);

      if (insertError) {
        console.error('Error inserting enriched transactions:', insertError);
      }
    }

    // Calculate transaction summary for 360 profile
    const summary = calculateTransactionSummary(enrichedTransactions);

    // Update customer 360 profile with transaction data
    if (companyId) {
      await supabase
        .from('customer_360_profiles')
        .upsert({
          company_id: companyId,
          total_transaction_volume: summary.totalVolume,
          avg_monthly_volume: summary.avgMonthlyVolume,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' });
    }

    return new Response(
      JSON.stringify({
        success: true,
        enriched_count: enrichedTransactions.length,
        transactions: enrichedTransactions,
        summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in enrich-transaction:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectRecurring(description: string): { isRecurring: boolean; type: string | null; frequency: string | null } {
  const lowerDesc = description.toLowerCase();
  
  const subscriptionKeywords = ['netflix', 'spotify', 'amazon prime', 'hbo', 'disney', 'adobe', 'microsoft', 'google', 'apple', 'gym', 'gimnasio', 'seguro', 'alquiler', 'hipoteca', 'luz', 'agua', 'gas', 'telefon', 'internet', 'movistar', 'vodafone', 'orange'];
  
  const isSubscription = subscriptionKeywords.some(kw => lowerDesc.includes(kw));
  
  if (isSubscription) {
    return {
      isRecurring: true,
      type: 'subscription',
      frequency: 'mensual'
    };
  }

  return { isRecurring: false, type: null, frequency: null };
}

function calculateTransactionSummary(transactions: any[]) {
  const totalVolume = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const categoryBreakdown: Record<string, number> = {};
  
  for (const tx of transactions) {
    const cat = tx.category || 'Sin categoría';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Math.abs(tx.amount);
  }

  return {
    totalVolume,
    avgMonthlyVolume: totalVolume / 12,
    transactionCount: transactions.length,
    categoryBreakdown,
    recurringCount: transactions.filter(t => t.is_recurring).length,
  };
}
