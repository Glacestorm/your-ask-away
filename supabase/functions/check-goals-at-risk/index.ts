import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

interface Goal {
  id: string;
  metric_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  assigned_to: string | null;
  description: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  oficina: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication - allow cron, service role, or valid JWT
  const authResult = validateCronOrServiceAuth(req);
  if (!authResult.valid) {
    console.error('Authentication failed:', authResult.error);
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  console.log(`Request authenticated via: ${authResult.source}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting at-risk goals check...');

    // Fetch active goals
    const today = new Date().toISOString().split('T')[0];
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .gte('period_end', today)
      .lte('period_start', today);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      throw goalsError;
    }

    console.log(`Found ${goals?.length || 0} active goals to check`);

    // Fetch all profiles for progress calculation
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Fetch directors (office directors and commercial directors)
    const { data: directorRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['director_oficina', 'director_comercial', 'superadmin']);

    if (rolesError) {
      console.error('Error fetching director roles:', rolesError);
      throw rolesError;
    }

    const directorIds = directorRoles?.map(r => r.user_id) || [];
    const directorProfiles = profiles?.filter(p => directorIds.includes(p.id)) || [];

    let alertsSent = 0;

    for (const goal of goals || []) {
      // Calculate progress for this goal
      const progress = await calculateGoalProgress(supabase, goal);
      
      // Calculate expected progress based on time elapsed
      const periodStart = new Date(goal.period_start);
      const periodEnd = new Date(goal.period_end);
      const now = new Date();
      
      const totalDays = Math.max(1, (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(0, (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const expectedProgressPercent = (daysElapsed / totalDays) * 100;
      
      // Goal is at risk if actual progress is less than 70% of expected progress
      const progressGap = expectedProgressPercent - progress.percentage;
      const isAtRisk = progressGap > 20 && progress.percentage < 80;
      
      // Goal is critical if progress gap is more than 40%
      const isCritical = progressGap > 40 && progress.percentage < 60;

      if (isAtRisk || isCritical) {
        console.log(`Goal ${goal.id} is ${isCritical ? 'CRITICAL' : 'at risk'}: ${progress.percentage.toFixed(1)}% vs expected ${expectedProgressPercent.toFixed(1)}%`);

        // Get gestor info
        const gestor = profiles?.find(p => p.id === goal.assigned_to);
        const gestorName = gestor?.full_name || gestor?.email || 'Sense assignar';
        const gestorOficina = gestor?.oficina;

        // Check if we already sent a notification for this goal today
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .ilike('title', `%${isCritical ? 'CRÍTIC' : 'en risc'}%`)
          .eq('alert_id', goal.id)
          .gte('created_at', today)
          .limit(1);

        if (existingNotification && existingNotification.length > 0) {
          console.log(`Notification already sent today for goal ${goal.id}`);
          continue;
        }

        // Determine which directors to notify
        const directorsToNotify = directorProfiles.filter(d => {
          const directorRole = directorRoles?.find(r => r.user_id === d.id);
          // Commercial directors and superadmins see all
          if (directorRole?.role === 'director_comercial' || directorRole?.role === 'superadmin') {
            return true;
          }
          // Office directors only see their office's gestores
          if (directorRole?.role === 'director_oficina' && gestorOficina) {
            return d.oficina === gestorOficina;
          }
          return false;
        });

        const metricLabel = getMetricLabel(goal.metric_type);
        const severity = isCritical ? 'high' : 'medium';
        const title = isCritical 
          ? `⚠️ Objectiu CRÍTIC: ${metricLabel}`
          : `📊 Objectiu en risc: ${metricLabel}`;
        
        const message = `El gestor ${gestorName} té un objectiu amb baix progrés: ${progress.percentage.toFixed(1)}% completat vs ${expectedProgressPercent.toFixed(1)}% esperat. Meta: ${formatValue(goal.metric_type, goal.target_value)}`;

        // Create notifications for each director
        for (const director of directorsToNotify) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: director.id,
              title,
              message,
              severity,
              alert_id: goal.id,
              metric_value: progress.percentage,
              threshold_value: expectedProgressPercent
            });

          if (notifError) {
            console.error(`Error creating notification for director ${director.id}:`, notifError);
          } else {
            alertsSent++;
            console.log(`Notification sent to director ${director.full_name || director.email}`);
          }
        }

        // Also notify the gestor themselves
        if (goal.assigned_to) {
          const gestorTitle = isCritical 
            ? `⚠️ El teu objectiu necessita atenció urgent: ${metricLabel}`
            : `📊 El teu objectiu necessita atenció: ${metricLabel}`;
          
          const gestorMessage = `El teu objectiu de ${metricLabel} està al ${progress.percentage.toFixed(1)}% quan hauries d'estar al ${expectedProgressPercent.toFixed(1)}%. Temps restant: ${Math.ceil(totalDays - daysElapsed)} dies.`;

          const { error: gestorNotifError } = await supabase
            .from('notifications')
            .insert({
              user_id: goal.assigned_to,
              title: gestorTitle,
              message: gestorMessage,
              severity,
              alert_id: goal.id,
              metric_value: progress.percentage,
              threshold_value: expectedProgressPercent
            });

          if (!gestorNotifError) {
            alertsSent++;
            console.log(`Notification sent to gestor ${gestorName}`);
          }
        }
      }
    }

    console.log(`At-risk goals check completed. ${alertsSent} alerts sent.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${goals?.length || 0} goals, sent ${alertsSent} alerts` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in check-goals-at-risk:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateGoalProgress(supabase: any, goal: Goal): Promise<{ current: number; percentage: number }> {
  const userId = goal.assigned_to;
  if (!userId) return { current: 0, percentage: 0 };

  let current = 0;

  try {
    switch (goal.metric_type) {
      case 'visits':
      case 'total_visits': {
        const { count } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId)
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end);
        current = count || 0;
        break;
      }

      case 'successful_visits': {
        const { count } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId)
          .eq('result', 'Exitosa')
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end);
        current = count || 0;
        break;
      }

      case 'new_clients': {
        const { count } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId)
          .gte('created_at', goal.period_start)
          .lte('created_at', goal.period_end);
        current = count || 0;
        break;
      }

      case 'visit_sheets': {
        const { count } = await supabase
          .from('visit_sheets')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId)
          .gte('fecha', goal.period_start)
          .lte('fecha', goal.period_end);
        current = count || 0;
        break;
      }

      case 'companies': {
        const { count } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId);
        current = count || 0;
        break;
      }

      case 'products_offered': {
        const { data: visitsData } = await supabase
          .from('visits')
          .select('productos_ofrecidos')
          .eq('gestor_id', userId)
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end)
          .not('productos_ofrecidos', 'is', null);
        
        current = visitsData?.reduce((sum: number, visit: any) => {
          return sum + (visit.productos_ofrecidos?.length || 0);
        }, 0) || 0;
        break;
      }

      case 'tpv_volume': {
        const { data: tpvData } = await supabase
          .from('company_tpv_terminals')
          .select('monthly_volume, companies!inner(gestor_id)')
          .eq('companies.gestor_id', userId)
          .eq('status', 'active');
        current = tpvData?.reduce((sum: number, t: any) => sum + (Number(t.monthly_volume) || 0), 0) || 0;
        break;
      }

      case 'conversion_rate': {
        const { count: totalVisits } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId)
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end);
        const { count: successfulVisits } = await supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId)
          .eq('result', 'Exitosa')
          .gte('visit_date', goal.period_start)
          .lte('visit_date', goal.period_end);
        current = totalVisits && totalVisits > 0 
          ? ((successfulVisits || 0) / totalVisits) * 100 
          : 0;
        break;
      }

      case 'client_facturacion': {
        const { data: facturacionData } = await supabase
          .from('companies')
          .select('facturacion_anual')
          .eq('gestor_id', userId)
          .not('facturacion_anual', 'is', null);
        current = facturacionData?.reduce((sum: number, c: any) => sum + (Number(c.facturacion_anual) || 0), 0) || 0;
        break;
      }

      case 'follow_ups': {
        const { count } = await supabase
          .from('visit_sheets')
          .select('*', { count: 'exact', head: true })
          .eq('gestor_id', userId)
          .gte('fecha', goal.period_start)
          .lte('fecha', goal.period_end)
          .or('proxima_llamada.not.is.null,proxima_cita.not.is.null');
        current = count || 0;
        break;
      }

      default:
        current = 0;
    }
  } catch (error) {
    console.error(`Error calculating progress for metric ${goal.metric_type}:`, error);
  }

  const percentage = goal.target_value > 0 
    ? Math.min(100, (current / goal.target_value) * 100)
    : 0;

  return { current, percentage };
}

function getMetricLabel(metricType: string): string {
  const labels: Record<string, string> = {
    visits: 'Visites totals',
    total_visits: 'Visites totals',
    successful_visits: 'Visites exitoses',
    new_clients: 'Nous clients',
    visit_sheets: 'Fitxes de visita',
    companies: 'Empreses assignades',
    products_offered: 'Productes oferts',
    tpv_volume: 'Volum TPV',
    conversion_rate: 'Taxa de conversió',
    client_facturacion: 'Facturació clients',
    follow_ups: 'Seguiments programats'
  };
  return labels[metricType] || metricType;
}

function formatValue(metricType: string, value: number): string {
  if (metricType === 'conversion_rate') return `${value.toFixed(1)}%`;
  if (metricType === 'tpv_volume' || metricType === 'client_facturacion') {
    return `${value.toLocaleString('es-ES')}€`;
  }
  return value.toLocaleString('es-ES');
}
