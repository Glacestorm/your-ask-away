import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SalesMetrics {
  gestor_id: string;
  total_value: number;
  total_visits: number;
  successful_visits: number;
  new_clients: number;
  products_sold: number;
  deals_won: number;
  points: number;
}

const ACHIEVEMENT_DEFINITIONS = [
  { type: 'first_visit', name: 'Primera Visita', points: 10, check: (m: SalesMetrics) => m.total_visits >= 1 },
  { type: 'visit_10', name: '10 Visitas', points: 50, check: (m: SalesMetrics) => m.total_visits >= 10 },
  { type: 'visit_50', name: '50 Visitas', points: 200, check: (m: SalesMetrics) => m.total_visits >= 50 },
  { type: 'first_deal', name: 'Primer Cierre', points: 100, check: (m: SalesMetrics) => m.deals_won >= 1 },
  { type: 'deal_5', name: '5 Cierres', points: 300, check: (m: SalesMetrics) => m.deals_won >= 5 },
  { type: 'cross_sell', name: 'Cross-selling', points: 75, check: (m: SalesMetrics) => m.products_sold >= 3 },
  { type: 'new_client_5', name: '5 Nuevos Clientes', points: 150, check: (m: SalesMetrics) => m.new_clients >= 5 },
  { type: 'high_performer', name: 'Alto Rendimiento', points: 500, check: (m: SalesMetrics) => m.total_value >= 100000 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { calculateAll, gestorId } = await req.json().catch(() => ({}));

    console.log("Starting sales performance calculation...");

    // Get current period dates
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all active gestors
    const { data: gestors, error: gestorsError } = await supabase
      .from('profiles')
      .select('id, full_name, oficina')
      .not('id', 'is', null);

    if (gestorsError) throw gestorsError;

    const targetGestors = gestorId 
      ? gestors?.filter(g => g.id === gestorId) 
      : gestors;

    const metricsMap: Record<string, SalesMetrics> = {};

    // Calculate metrics for each gestor
    for (const gestor of targetGestors || []) {
      // Get visits count
      const { count: visitsCount } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestor.id)
        .gte('visit_date', periodStart.toISOString())
        .lte('visit_date', periodEnd.toISOString());

      // Get successful visits
      const { count: successfulVisits } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestor.id)
        .eq('result', 'positive')
        .gte('visit_date', periodStart.toISOString())
        .lte('visit_date', periodEnd.toISOString());

      // Get opportunities won
      const { data: oppsWon } = await supabase
        .from('opportunities')
        .select('estimated_value')
        .eq('owner_id', gestor.id)
        .eq('stage', 'closed_won')
        .gte('actual_close_date', periodStart.toISOString().split('T')[0])
        .lte('actual_close_date', periodEnd.toISOString().split('T')[0]);

      const totalValue = oppsWon?.reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0;
      const dealsWon = oppsWon?.length || 0;

      // Get products sold
      const { count: productsSold } = await supabase
        .from('company_products')
        .select('*, companies!inner(gestor_id)', { count: 'exact', head: true })
        .eq('companies.gestor_id', gestor.id)
        .gte('contract_date', periodStart.toISOString().split('T')[0]);

      // Calculate points based on activities
      const points = 
        (visitsCount || 0) * 5 + // 5 points per visit
        (successfulVisits || 0) * 10 + // Extra 10 for successful
        dealsWon * 100 + // 100 points per deal
        (productsSold || 0) * 25; // 25 points per product

      metricsMap[gestor.id] = {
        gestor_id: gestor.id,
        total_value: totalValue,
        total_visits: visitsCount || 0,
        successful_visits: successfulVisits || 0,
        new_clients: 0, // Would need additional logic
        products_sold: productsSold || 0,
        deals_won: dealsWon,
        points: points,
      };
    }

    // Update quotas with actual values
    for (const [gestorId, metrics] of Object.entries(metricsMap)) {
      const { data: existingQuota } = await supabase
        .from('sales_quotas')
        .select('id')
        .eq('gestor_id', gestorId)
        .eq('period_type', 'monthly')
        .eq('period_start', periodStart.toISOString().split('T')[0])
        .single();

      if (existingQuota) {
        await supabase
          .from('sales_quotas')
          .update({
            actual_value: metrics.total_value,
            actual_visits: metrics.total_visits,
            actual_products_sold: metrics.products_sold,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingQuota.id);
      }
    }

    // Check and grant achievements
    for (const [gestorId, metrics] of Object.entries(metricsMap)) {
      for (const achievement of ACHIEVEMENT_DEFINITIONS) {
        if (achievement.check(metrics)) {
          // Check if already has this achievement
          const { data: existing } = await supabase
            .from('sales_achievements')
            .select('id')
            .eq('gestor_id', gestorId)
            .eq('achievement_type', achievement.type)
            .single();

          if (!existing) {
            await supabase
              .from('sales_achievements')
              .insert({
                gestor_id: gestorId,
                achievement_type: achievement.type,
                achievement_name: achievement.name,
                points: achievement.points,
                badge_icon: achievement.type,
                badge_color: '#8B5CF6',
              });

            console.log(`Achievement unlocked: ${achievement.name} for gestor ${gestorId}`);
          }
        }
      }
    }

    // Calculate leaderboard rankings
    const sortedMetrics = Object.values(metricsMap).sort((a, b) => b.points - a.points);

    for (let i = 0; i < sortedMetrics.length; i++) {
      const metrics = sortedMetrics[i];
      const rank = i + 1;

      // Get achievements count
      const { count: achievementsCount } = await supabase
        .from('sales_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', metrics.gestor_id);

      // Get previous rank
      const { data: prevEntry } = await supabase
        .from('sales_leaderboard')
        .select('rank_position')
        .eq('gestor_id', metrics.gestor_id)
        .eq('period_type', 'monthly')
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      const rankChange = prevEntry ? prevEntry.rank_position - rank : 0;

      // Upsert leaderboard entry
      await supabase
        .from('sales_leaderboard')
        .upsert({
          gestor_id: metrics.gestor_id,
          period_type: 'monthly',
          period_start: periodStart.toISOString().split('T')[0],
          rank_position: rank,
          total_points: metrics.points,
          total_value: metrics.total_value,
          total_visits: metrics.total_visits,
          total_deals_won: metrics.deals_won,
          achievements_count: achievementsCount || 0,
          previous_rank: prevEntry?.rank_position,
          rank_change: rankChange,
          calculated_at: new Date().toISOString(),
        }, {
          onConflict: 'gestor_id,period_type,period_start',
        });
    }

    // Take pipeline snapshot
    const { data: allOpps } = await supabase
      .from('opportunities')
      .select('*')
      .not('stage', 'in', '("closed_won","closed_lost")');

    const totalPipelineValue = allOpps?.reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0;
    const byStage = allOpps?.reduce((acc, o) => {
      acc[o.stage] = (acc[o.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    await supabase
      .from('pipeline_snapshots')
      .insert({
        snapshot_date: now.toISOString().split('T')[0],
        total_opportunities: allOpps?.length || 0,
        total_value: totalPipelineValue,
        by_stage: byStage,
        velocity_score: sortedMetrics.length > 0 ? sortedMetrics.reduce((sum, m) => sum + m.deals_won, 0) / sortedMetrics.length : 0,
        health_score: Math.min(100, ((allOpps?.length || 0) > 0 ? (totalPipelineValue / (allOpps?.length || 1)) / 1000 : 50)),
      });

    console.log("Sales performance calculation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        gestorsProcessed: targetGestors?.length || 0,
        leaderboardUpdated: true,
        pipelineSnapshotTaken: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error calculating sales performance:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
