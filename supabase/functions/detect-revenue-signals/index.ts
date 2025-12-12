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

    console.log("Starting revenue signal detection...");

    const signals: any[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Detect stale opportunities (no activity in 14+ days)
    const { data: staleOpps } = await supabase
      .from('opportunities')
      .select('*, companies(name), profiles!opportunities_owner_id_fkey(full_name)')
      .not('stage', 'in', '("closed_won","closed_lost")')
      .lt('updated_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString());

    for (const opp of staleOpps || []) {
      signals.push({
        signal_type: 'risk',
        severity: opp.estimated_value > 50000 ? 'high' : 'medium',
        title: `Oportunidad estancada: ${opp.title}`,
        description: `La oportunidad con ${opp.companies?.name} no ha tenido actividad en más de 14 días. Valor estimado: ${opp.estimated_value}€`,
        entity_type: 'opportunity',
        entity_id: opp.id,
        gestor_id: opp.owner_id,
        confidence_score: 0.85,
        potential_value: opp.estimated_value || 0,
        recommended_action: 'Contactar al cliente para reactivar la negociación',
      });
    }

    // 2. Detect high-probability opportunities needing attention
    const { data: hotOpps } = await supabase
      .from('opportunities')
      .select('*, companies(name)')
      .gte('probability', 70)
      .not('stage', 'in', '("closed_won","closed_lost")')
      .order('estimated_value', { ascending: false })
      .limit(10);

    for (const opp of hotOpps || []) {
      signals.push({
        signal_type: 'opportunity',
        severity: 'high',
        title: `Oportunidad de alto potencial: ${opp.title}`,
        description: `${opp.probability}% de probabilidad de cierre con ${opp.companies?.name}. ¡Priorizar seguimiento!`,
        entity_type: 'opportunity',
        entity_id: opp.id,
        gestor_id: opp.owner_id,
        confidence_score: opp.probability / 100,
        potential_value: opp.estimated_value || 0,
        recommended_action: 'Agendar reunión de cierre esta semana',
      });
    }

    // 3. Detect companies without recent visits
    const { data: neglectedCompanies } = await supabase
      .from('companies')
      .select('id, name, gestor_id, facturacion_anual')
      .not('gestor_id', 'is', null)
      .or(`fecha_ultima_visita.is.null,fecha_ultima_visita.lt.${thirtyDaysAgo.toISOString().split('T')[0]}`)
      .gt('facturacion_anual', 100000)
      .limit(20);

    for (const company of neglectedCompanies || []) {
      signals.push({
        signal_type: 'risk',
        severity: company.facturacion_anual > 500000 ? 'high' : 'medium',
        title: `Cliente sin visita reciente: ${company.name}`,
        description: `Empresa con ${company.facturacion_anual}€ de facturación sin visita en los últimos 30 días`,
        entity_type: 'company',
        entity_id: company.id,
        gestor_id: company.gestor_id,
        confidence_score: 0.9,
        potential_value: company.facturacion_anual * 0.02, // Estimate 2% as potential
        recommended_action: 'Programar visita de mantenimiento',
      });
    }

    // 4. Cross-sell opportunities (companies with few products)
    let crossSellCandidates = null;
    try {
      const result = await supabase.rpc('get_cross_sell_candidates');
      crossSellCandidates = result.data;
    } catch {
      // Function may not exist, use fallback
    }

    // Fallback: Get companies with less than 2 products but high revenue
    if (!crossSellCandidates) {
      const { data: potentialCrossSell } = await supabase
        .from('companies')
        .select('id, name, gestor_id, facturacion_anual')
        .gt('facturacion_anual', 200000)
        .limit(10);

      for (const company of potentialCrossSell || []) {
        // Check product count
        const { count: productCount } = await supabase
          .from('company_products')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)
          .eq('active', true);

        if ((productCount || 0) < 2) {
          signals.push({
            signal_type: 'opportunity',
            severity: 'medium',
            title: `Oportunidad de cross-selling: ${company.name}`,
            description: `Cliente con alta facturación (${company.facturacion_anual}€) pero solo ${productCount || 0} productos activos`,
            entity_type: 'company',
            entity_id: company.id,
            gestor_id: company.gestor_id,
            confidence_score: 0.75,
            potential_value: company.facturacion_anual * 0.05,
            recommended_action: 'Presentar productos complementarios en próxima visita',
          });
        }
      }
    }

    // 5. Trend signals - comparing current month vs previous
    const { data: currentMonthOpps } = await supabase
      .from('opportunities')
      .select('estimated_value')
      .eq('stage', 'closed_won')
      .gte('actual_close_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);

    const { data: lastMonthOpps } = await supabase
      .from('opportunities')
      .select('estimated_value')
      .eq('stage', 'closed_won')
      .gte('actual_close_date', new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0])
      .lt('actual_close_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);

    const currentTotal = currentMonthOpps?.reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0;
    const lastTotal = lastMonthOpps?.reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0;

    if (lastTotal > 0) {
      const changePercent = ((currentTotal - lastTotal) / lastTotal) * 100;
      
      if (changePercent > 20) {
        signals.push({
          signal_type: 'trend',
          severity: 'info',
          title: 'Tendencia positiva de ingresos',
          description: `Los cierres de este mes superan al anterior en un ${changePercent.toFixed(1)}%`,
          confidence_score: 0.95,
          potential_value: currentTotal,
          recommended_action: 'Mantener el momentum actual',
        });
      } else if (changePercent < -20) {
        signals.push({
          signal_type: 'trend',
          severity: 'high',
          title: 'Alerta: Tendencia negativa de ingresos',
          description: `Los cierres de este mes están un ${Math.abs(changePercent).toFixed(1)}% por debajo del anterior`,
          confidence_score: 0.95,
          potential_value: lastTotal - currentTotal,
          recommended_action: 'Revisar pipeline y acelerar oportunidades en negociación',
        });
      }
    }

    // 6. Generate AI recommendations using Lovable API
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableApiKey && signals.length > 0) {
      try {
        const prompt = `Basándote en estas señales de revenue detectadas, genera 2-3 recomendaciones estratégicas concisas:
${JSON.stringify(signals.slice(0, 5), null, 2)}

Responde en formato JSON con array de objetos: [{"title": "...", "description": "...", "action": "..."}]`;

        const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          
          try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const recommendations = JSON.parse(jsonMatch[0]);
              for (const rec of recommendations) {
                signals.push({
                  signal_type: 'recommendation',
                  severity: 'info',
                  title: rec.title,
                  description: rec.description,
                  recommended_action: rec.action,
                  confidence_score: 0.8,
                  ai_analysis: { source: 'lovable-ai' },
                });
              }
            }
          } catch (parseError) {
            console.log("Could not parse AI recommendations");
          }
        }
      } catch (aiError) {
        console.error("AI recommendation error:", aiError);
      }
    }

    // Insert signals to database
    if (signals.length > 0) {
      const { error: insertError } = await supabase
        .from('revenue_signals')
        .insert(signals);

      if (insertError) {
        console.error("Error inserting signals:", insertError);
      }
    }

    console.log(`Revenue signal detection completed. Generated ${signals.length} signals.`);

    return new Response(
      JSON.stringify({
        success: true,
        signalsGenerated: signals.length,
        signals: signals.map(s => ({ type: s.signal_type, title: s.title })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error detecting revenue signals:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
