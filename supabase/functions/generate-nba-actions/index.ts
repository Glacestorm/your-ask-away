import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, roles:user_roles(role)')
      .eq('id', userId)
      .single();

    const userRoles = profile?.roles?.map((r: any) => r.role) || ['gestor'];

    // Get relevant action types for user's roles
    const { data: actionTypes } = await supabase
      .from('nba_action_types')
      .select('*')
      .eq('is_active', true);

    const relevantActionTypes = (actionTypes || []).filter((at: any) => 
      at.target_roles.some((role: string) => userRoles.includes(role) || role === 'all')
    );

    const generatedNBAs: any[] = [];

    // Generate Revenue NBAs
    // 1. Hot leads to call
    const { data: hotLeads } = await supabase
      .from('opportunities')
      .select('id, title, probability, estimated_value, company:companies(id, name)')
      .eq('owner_id', userId)
      .gte('probability', 70)
      .in('stage', ['proposal', 'negotiation'])
      .limit(10);

    const callHotLeadType = relevantActionTypes.find((at: any) => at.action_code === 'CALL_HOT_LEAD');
    if (callHotLeadType && hotLeads?.length) {
      for (const lead of hotLeads) {
        // Check if NBA already exists
        const { data: existing } = await supabase
          .from('nba_queue')
          .select('id')
          .eq('user_id', userId)
          .eq('entity_type', 'opportunity')
          .eq('entity_id', lead.id)
          .eq('status', 'pending')
          .single();

        if (!existing) {
          generatedNBAs.push({
            user_id: userId,
            action_type_id: callHotLeadType.id,
            entity_type: 'opportunity',
            entity_id: lead.id,
            priority: Math.min(10, Math.floor(lead.probability / 10)),
            score: lead.probability,
            context_data: {
              company_name: (lead.company as any)?.name,
              opportunity_title: lead.title,
              probability: lead.probability,
            },
            ai_reasoning: `Oportunidad "${lead.title}" con ${lead.probability}% de probabilidad. Contacto inmediato puede acelerar el cierre.`,
            estimated_value: lead.estimated_value || callHotLeadType.estimated_mrr_impact,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    // 2. Retention calls for churn risk
    const { data: churnRisk } = await supabase
      .from('customer_360_profiles')
      .select('company_id, churn_probability, company:companies(id, name, gestor_id)')
      .gte('churn_probability', 0.6)
      .limit(10);

    const retentionCallType = relevantActionTypes.find((at: any) => at.action_code === 'RETENTION_CALL');
    if (retentionCallType && churnRisk?.length) {
      for (const customer of churnRisk) {
        if ((customer.company as any)?.gestor_id === userId) {
          const { data: existing } = await supabase
            .from('nba_queue')
            .select('id')
            .eq('user_id', userId)
            .eq('entity_type', 'company')
            .eq('entity_id', customer.company_id)
            .eq('action_type_id', retentionCallType.id)
            .eq('status', 'pending')
            .single();

          if (!existing) {
            generatedNBAs.push({
              user_id: userId,
              action_type_id: retentionCallType.id,
              entity_type: 'company',
              entity_id: customer.company_id,
              priority: 10, // Highest priority for retention
              score: customer.churn_probability * 100,
              context_data: {
                company_name: (customer.company as any)?.name,
                churn_probability: customer.churn_probability,
              },
              ai_reasoning: `Cliente "${(customer.company as any)?.name}" con ${(customer.churn_probability * 100).toFixed(0)}% de riesgo de abandono. Llamada de retención urgente.`,
              estimated_value: retentionCallType.estimated_mrr_impact || 3000,
              expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }
      }
    }

    // 3. Cross-sell opportunities
    const { data: crossSellCandidates } = await supabase
      .from('companies')
      .select('id, name, facturacion_anual')
      .eq('gestor_id', userId)
      .gte('facturacion_anual', 1000000)
      .limit(20);

    const crossSellType = relevantActionTypes.find((at: any) => at.action_code === 'CROSS_SELL_PRODUCT');
    if (crossSellType && crossSellCandidates?.length) {
      // Get companies with few products
      for (const company of crossSellCandidates.slice(0, 5)) {
        const { count } = await supabase
          .from('company_products')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('active', true);

        if ((count || 0) < 3) {
          const { data: existing } = await supabase
            .from('nba_queue')
            .select('id')
            .eq('user_id', userId)
            .eq('entity_type', 'company')
            .eq('entity_id', company.id)
            .eq('action_type_id', crossSellType.id)
            .eq('status', 'pending')
            .single();

          if (!existing) {
            generatedNBAs.push({
              user_id: userId,
              action_type_id: crossSellType.id,
              entity_type: 'company',
              entity_id: company.id,
              priority: 6,
              score: 60,
              context_data: {
                company_name: company.name,
                facturacion: company.facturacion_anual,
                current_products: count,
              },
              ai_reasoning: `"${company.name}" tiene facturación de €${company.facturacion_anual?.toLocaleString()} pero solo ${count || 0} productos activos. Alto potencial de cross-sell.`,
              estimated_value: crossSellType.estimated_mrr_impact || 800,
              expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }
        }
      }
    }

    // 4. Stale opportunities
    const { data: staleOpps } = await supabase
      .from('opportunities')
      .select('id, title, estimated_value, updated_at, company:companies(name)')
      .eq('owner_id', userId)
      .in('stage', ['discovery', 'qualification', 'proposal'])
      .lt('updated_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    const scheduleVisitType = relevantActionTypes.find((at: any) => at.action_code === 'SCHEDULE_VISIT');
    if (scheduleVisitType && staleOpps?.length) {
      for (const opp of staleOpps) {
        const { data: existing } = await supabase
          .from('nba_queue')
          .select('id')
          .eq('user_id', userId)
          .eq('entity_type', 'opportunity')
          .eq('entity_id', opp.id)
          .eq('action_type_id', scheduleVisitType.id)
          .eq('status', 'pending')
          .single();

        if (!existing) {
          const daysSinceUpdate = Math.floor((Date.now() - new Date(opp.updated_at).getTime()) / (24 * 60 * 60 * 1000));
          
          generatedNBAs.push({
            user_id: userId,
            action_type_id: scheduleVisitType.id,
            entity_type: 'opportunity',
            entity_id: opp.id,
            priority: 7,
            score: Math.min(100, 50 + daysSinceUpdate * 2),
            context_data: {
              company_name: (opp.company as any)?.name,
              opportunity_title: opp.title,
              days_stale: daysSinceUpdate,
            },
            ai_reasoning: `Oportunidad "${opp.title}" sin actividad hace ${daysSinceUpdate} días. Agendar visita para reactivar.`,
            estimated_value: opp.estimated_value || scheduleVisitType.estimated_mrr_impact,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
    }

    // 5. KYC updates needed (for admin roles)
    if (userRoles.includes('admin') || userRoles.includes('superadmin')) {
      const updateKycType = relevantActionTypes.find((at: any) => at.action_code === 'UPDATE_KYC');
      if (updateKycType) {
        // In a real scenario, check for expired KYC documents
        // For now, we'll create a placeholder
        console.log('Checking KYC updates for admin...');
      }
    }

    // Insert generated NBAs
    if (generatedNBAs.length > 0) {
      const { error } = await supabase
        .from('nba_queue')
        .insert(generatedNBAs);

      if (error) {
        console.error('Error inserting NBAs:', error);
        throw error;
      }
    }

    // Clean up expired NBAs
    await supabase
      .from('nba_queue')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    return new Response(JSON.stringify({
      success: true,
      generated: generatedNBAs.length,
      message: `${generatedNBAs.length} nuevas acciones generadas`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Generate NBA actions error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
