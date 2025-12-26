import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RevenueEngineRequest {
  action: 'get_trials' | 'create_trial' | 'analyze_trial_conversion' | 
          'get_usage_metrics' | 'calculate_billing' | 'generate_invoice' |
          'get_affiliates' | 'register_affiliate' | 'track_referral' | 'calculate_commissions' |
          'generate_quote' | 'get_quotes' | 'approve_quote' | 'get_cnae_pricing';
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { action, params } = await req.json() as RevenueEngineRequest;

    console.log(`[revenue-engine] Action: ${action}`, params);

    let result: any;

    switch (action) {
      // ============ SMART TRIALS BY CNAE ============
      case 'get_trials': {
        const { data: trials, error } = await supabase
          .from('company_trials')
          .select(`
            *,
            companies:company_id (
              name,
              cnae_code,
              sector
            )
          `)
          .order('created_at', { ascending: false })
          .limit(params?.limit as number || 50);

        if (error) throw error;

        // Enrich with CNAE-based recommendations
        const enrichedTrials = await Promise.all((trials || []).map(async (trial: any) => {
          const cnaeCode = trial.companies?.cnae_code;
          let trialConfig = {
            recommended_duration_days: 14,
            recommended_features: ['basic', 'reports'],
            conversion_probability: 0.5,
            upsell_opportunities: []
          };

          if (cnaeCode && LOVABLE_API_KEY) {
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
                      content: `Eres un experto en estrategias de trial para SaaS B2B. Analiza el CNAE y recomienda configuración de trial óptima.
                      
RESPONDE SOLO EN JSON:
{
  "recommended_duration_days": number,
  "recommended_features": string[],
  "conversion_probability": number (0-1),
  "upsell_opportunities": string[],
  "engagement_tactics": string[]
}`
                    },
                    {
                      role: 'user',
                      content: `CNAE: ${cnaeCode}, Sector: ${trial.companies?.sector}, Días en trial: ${trial.days_elapsed || 0}, Uso actual: ${JSON.stringify(trial.usage_metrics || {})}`
                    }
                  ],
                  temperature: 0.3,
                  max_tokens: 500,
                }),
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                const content = aiData.choices?.[0]?.message?.content;
                const jsonMatch = content?.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  trialConfig = JSON.parse(jsonMatch[0]);
                }
              }
            } catch (e) {
              console.error('[revenue-engine] AI trial analysis error:', e);
            }
          }

          return { ...trial, ai_recommendations: trialConfig };
        }));

        result = { trials: enrichedTrials };
        break;
      }

      case 'create_trial': {
        const { company_id, plan_type, features, duration_days } = params as any;
        
        // Get CNAE-based trial configuration
        const { data: company } = await supabase
          .from('companies')
          .select('cnae_code, sector, name')
          .eq('id', company_id)
          .single();

        let smartDuration = duration_days || 14;
        let smartFeatures = features || ['basic'];

        // AI-powered trial configuration based on CNAE
        if (company?.cnae_code && LOVABLE_API_KEY) {
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
                    content: `Configura un trial inteligente basado en el CNAE del cliente.
                    
RESPONDE SOLO EN JSON:
{
  "duration_days": number,
  "features": string[],
  "onboarding_priority": string[],
  "success_metrics": string[]
}`
                  },
                  {
                    role: 'user',
                    content: `CNAE: ${company.cnae_code}, Sector: ${company.sector}, Empresa: ${company.name}`
                  }
                ],
                temperature: 0.3,
                max_tokens: 400,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content;
              const jsonMatch = content?.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const config = JSON.parse(jsonMatch[0]);
                smartDuration = config.duration_days || smartDuration;
                smartFeatures = config.features || smartFeatures;
              }
            }
          } catch (e) {
            console.error('[revenue-engine] AI trial config error:', e);
          }
        }

        const trialData = {
          company_id,
          plan_type: plan_type || 'professional',
          features: smartFeatures,
          duration_days: smartDuration,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + smartDuration * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          usage_metrics: {},
          conversion_score: 0
        };

        const { data: trial, error } = await supabase
          .from('company_trials')
          .insert([trialData])
          .select()
          .single();

        if (error) throw error;
        result = { trial, smart_config: { duration: smartDuration, features: smartFeatures } };
        break;
      }

      case 'analyze_trial_conversion': {
        const { trial_id } = params as any;

        const { data: trial } = await supabase
          .from('company_trials')
          .select(`
            *,
            companies:company_id (name, cnae_code, sector)
          `)
          .eq('id', trial_id)
          .single();

        if (!trial) throw new Error('Trial not found');

        let analysis = {
          conversion_probability: 0.5,
          risk_factors: [],
          recommendations: [],
          next_best_actions: []
        };

        if (LOVABLE_API_KEY) {
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
                  content: `Analiza la probabilidad de conversión de un trial y proporciona recomendaciones.
                  
RESPONDE SOLO EN JSON:
{
  "conversion_probability": number (0-1),
  "risk_factors": string[],
  "positive_signals": string[],
  "recommendations": string[],
  "next_best_actions": [{ "action": string, "priority": "high"|"medium"|"low", "impact": string }],
  "predicted_plan": string,
  "predicted_mrr": number
}`
                },
                {
                  role: 'user',
                  content: `Trial: ${JSON.stringify(trial)}`
                }
              ],
              temperature: 0.3,
              max_tokens: 800,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            const jsonMatch = content?.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
            }
          }
        }

        result = { trial, analysis };
        break;
      }

      // ============ USAGE-BASED BILLING ============
      case 'get_usage_metrics': {
        const { company_id, period_start, period_end } = params as any;

        const { data: usage, error } = await supabase
          .from('usage_events')
          .select('*')
          .eq('company_id', company_id)
          .gte('created_at', period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .lte('created_at', period_end || new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Aggregate by metric type
        const aggregated: Record<string, number> = {};
        (usage || []).forEach((event: any) => {
          aggregated[event.metric_type] = (aggregated[event.metric_type] || 0) + (event.quantity || 1);
        });

        result = { 
          usage_events: usage || [], 
          aggregated,
          period: {
            start: period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: period_end || new Date().toISOString()
          }
        };
        break;
      }

      case 'calculate_billing': {
        const { company_id, period_start, period_end } = params as any;

        // Get usage metrics
        const { data: usage } = await supabase
          .from('usage_events')
          .select('*')
          .eq('company_id', company_id)
          .gte('created_at', period_start)
          .lte('created_at', period_end);

        // Get pricing rules
        const { data: pricingRules } = await supabase
          .from('usage_pricing_rules')
          .select('*')
          .eq('is_active', true);

        // Calculate billing
        const billing: Record<string, { quantity: number; unit_price: number; total: number }> = {};
        let totalAmount = 0;

        (usage || []).forEach((event: any) => {
          const rule = (pricingRules || []).find((r: any) => r.metric_type === event.metric_type);
          if (rule) {
            const quantity = event.quantity || 1;
            const unitPrice = rule.unit_price || 0;
            const total = quantity * unitPrice;

            if (!billing[event.metric_type]) {
              billing[event.metric_type] = { quantity: 0, unit_price: unitPrice, total: 0 };
            }
            billing[event.metric_type].quantity += quantity;
            billing[event.metric_type].total += total;
            totalAmount += total;
          }
        });

        result = {
          company_id,
          period: { start: period_start, end: period_end },
          line_items: billing,
          subtotal: totalAmount,
          tax: totalAmount * 0.21,
          total: totalAmount * 1.21
        };
        break;
      }

      case 'generate_invoice': {
        const { company_id, billing_data } = params as any;

        // Create invoice in Stripe if configured
        if (STRIPE_SECRET_KEY) {
          const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;
          const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

          // Get or create Stripe customer
          const { data: company } = await supabase
            .from('companies')
            .select('stripe_customer_id, email, name')
            .eq('id', company_id)
            .single();

          let customerId = company?.stripe_customer_id;
          if (!customerId && company?.email) {
            const customer = await stripe.customers.create({
              email: company.email,
              name: company.name,
              metadata: { company_id }
            });
            customerId = customer.id;

            await supabase
              .from('companies')
              .update({ stripe_customer_id: customerId })
              .eq('id', company_id);
          }

          if (customerId) {
            // Create invoice items
            for (const [metric, data] of Object.entries(billing_data.line_items || {})) {
              const itemData = data as any;
              await stripe.invoiceItems.create({
                customer: customerId,
                amount: Math.round(itemData.total * 100),
                currency: 'eur',
                description: `${metric}: ${itemData.quantity} unidades @ €${itemData.unit_price}`
              });
            }

            // Create and finalize invoice
            const invoice = await stripe.invoices.create({
              customer: customerId,
              auto_advance: true,
              collection_method: 'charge_automatically'
            });

            await stripe.invoices.finalizeInvoice(invoice.id);

            result = { 
              invoice_id: invoice.id,
              invoice_url: invoice.hosted_invoice_url,
              invoice_pdf: invoice.invoice_pdf,
              amount: invoice.amount_due / 100
            };
          } else {
            result = { error: 'No customer email configured' };
          }
        } else {
          result = { error: 'Stripe not configured', billing_data };
        }
        break;
      }

      // ============ AFFILIATES SYSTEM ============
      case 'get_affiliates': {
        const { data: affiliates, error } = await supabase
          .from('affiliates')
          .select(`
            *,
            referrals:affiliate_referrals(count),
            total_commission:affiliate_referrals(commission_amount.sum())
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = { affiliates: affiliates || [] };
        break;
      }

      case 'register_affiliate': {
        const { user_id, name, email, commission_rate, payment_method } = params as any;

        const affiliateCode = `AFF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { data: affiliate, error } = await supabase
          .from('affiliates')
          .insert([{
            user_id,
            name,
            email,
            affiliate_code: affiliateCode,
            commission_rate: commission_rate || 0.20,
            payment_method: payment_method || 'bank_transfer',
            status: 'active',
            total_referrals: 0,
            total_earnings: 0,
            pending_payout: 0
          }])
          .select()
          .single();

        if (error) throw error;
        result = { affiliate };
        break;
      }

      case 'track_referral': {
        const { affiliate_code, referred_company_id, deal_value } = params as any;

        // Get affiliate
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('*')
          .eq('affiliate_code', affiliate_code)
          .single();

        if (!affiliate) throw new Error('Affiliate not found');

        const commissionAmount = deal_value * (affiliate.commission_rate || 0.20);

        // Create referral record
        const { data: referral, error } = await supabase
          .from('affiliate_referrals')
          .insert([{
            affiliate_id: affiliate.id,
            referred_company_id,
            deal_value,
            commission_rate: affiliate.commission_rate,
            commission_amount: commissionAmount,
            status: 'pending',
            conversion_date: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;

        // Update affiliate stats
        await supabase
          .from('affiliates')
          .update({
            total_referrals: (affiliate.total_referrals || 0) + 1,
            pending_payout: (affiliate.pending_payout || 0) + commissionAmount
          })
          .eq('id', affiliate.id);

        result = { referral, commission: commissionAmount };
        break;
      }

      case 'calculate_commissions': {
        const { affiliate_id, period_start, period_end } = params as any;

        const { data: referrals } = await supabase
          .from('affiliate_referrals')
          .select('*')
          .eq('affiliate_id', affiliate_id)
          .gte('conversion_date', period_start)
          .lte('conversion_date', period_end);

        const totals = (referrals || []).reduce((acc: any, ref: any) => {
          acc.total_deals += 1;
          acc.total_value += ref.deal_value || 0;
          acc.total_commission += ref.commission_amount || 0;
          if (ref.status === 'pending') acc.pending += ref.commission_amount || 0;
          if (ref.status === 'paid') acc.paid += ref.commission_amount || 0;
          return acc;
        }, { total_deals: 0, total_value: 0, total_commission: 0, pending: 0, paid: 0 });

        result = { referrals, totals };
        break;
      }

      // ============ AI-POWERED QUOTES ============
      case 'get_quotes': {
        const { status, company_id } = params as any;

        let query = supabase
          .from('quotes')
          .select(`
            *,
            companies:company_id (name, cnae_code, sector)
          `)
          .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (company_id) query = query.eq('company_id', company_id);

        const { data: quotes, error } = await query.limit(50);
        if (error) throw error;

        result = { quotes: quotes || [] };
        break;
      }

      case 'generate_quote': {
        const { company_id, requirements, contact_info } = params as any;

        // Get company info including CNAE
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', company_id)
          .single();

        // Get CNAE pricing if available
        const { data: cnaePricing } = await supabase
          .from('cnae_pricing')
          .select('*')
          .eq('cnae_code', company?.cnae_code)
          .single();

        let quoteData: any = {
          company_id,
          status: 'draft',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          line_items: [],
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          ai_generated: true
        };

        // AI-powered quote generation
        if (LOVABLE_API_KEY) {
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
                  content: `Genera una cotización profesional basada en los requisitos del cliente y su sector.
                  
RESPONDE SOLO EN JSON:
{
  "line_items": [
    { "description": string, "quantity": number, "unit_price": number, "total": number }
  ],
  "subtotal": number,
  "discount_percentage": number,
  "discount_amount": number,
  "tax_rate": number,
  "tax_amount": number,
  "total": number,
  "payment_terms": string,
  "delivery_timeline": string,
  "notes": string,
  "upsell_suggestions": string[]
}`
                },
                {
                  role: 'user',
                  content: `Empresa: ${company?.name}, CNAE: ${company?.cnae_code}, Sector: ${company?.sector}
Requisitos: ${JSON.stringify(requirements)}
Pricing base CNAE: ${JSON.stringify(cnaePricing)}`
                }
              ],
              temperature: 0.4,
              max_tokens: 1000,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            const jsonMatch = content?.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const aiQuote = JSON.parse(jsonMatch[0]);
              quoteData = {
                ...quoteData,
                line_items: aiQuote.line_items,
                subtotal: aiQuote.subtotal,
                discount: aiQuote.discount_amount,
                tax: aiQuote.tax_amount,
                total: aiQuote.total,
                payment_terms: aiQuote.payment_terms,
                delivery_timeline: aiQuote.delivery_timeline,
                notes: aiQuote.notes,
                ai_suggestions: aiQuote.upsell_suggestions
              };
            }
          }
        }

        const { data: quote, error } = await supabase
          .from('quotes')
          .insert([quoteData])
          .select()
          .single();

        if (error) throw error;
        result = { quote };
        break;
      }

      case 'approve_quote': {
        const { quote_id, approved_by } = params as any;

        const { data: quote, error } = await supabase
          .from('quotes')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by
          })
          .eq('id', quote_id)
          .select()
          .single();

        if (error) throw error;
        result = { quote };
        break;
      }

      case 'get_cnae_pricing': {
        const { cnae_code } = params as any;

        const { data: pricing, error } = await supabase
          .from('cnae_pricing')
          .select('*')
          .eq('cnae_code', cnae_code)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        result = { pricing: pricing || null };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[revenue-engine] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
