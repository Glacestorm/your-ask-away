import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Goal {
  id: string;
  assigned_to: string;
  metric_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  period_type: string;
  description: string | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  oficina: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting goal achievements check...');

    // Get all active goals (within period)
    const today = new Date().toISOString().split('T')[0];
    const { data: goals, error: goalsError } = await supabaseClient
      .from('goals')
      .select('*')
      .lte('period_start', today)
      .gte('period_end', today);

    if (goalsError) throw goalsError;
    if (!goals || goals.length === 0) {
      console.log('No active goals found');
      return new Response(JSON.stringify({ message: 'No active goals' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${goals.length} active goals`);

    // Get all gestors profiles
    const gestorIds = [...new Set(goals.map(g => g.assigned_to))];
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, oficina')
      .in('id', gestorIds);

    if (profilesError) throw profilesError;

    const profilesMap = new Map<string, Profile>(
      profiles?.map(p => [p.id, p]) || []
    );

    // Get directors/managers to notify
    const { data: managers, error: managersError } = await supabaseClient
      .from('user_roles')
      .select('user_id, role, profiles(id, email, full_name)')
      .in('role', ['director_comercial', 'director_oficina', 'responsable_comercial', 'admin', 'superadmin']);

    if (managersError) throw managersError;

    const achievementsToNotify: Array<{
      goal: Goal;
      gestor: Profile;
      currentValue: number;
      progressPercentage: number;
    }> = [];

    // Check each goal's progress
    for (const goal of goals as Goal[]) {
      const gestor = profilesMap.get(goal.assigned_to);
      if (!gestor) continue;

      // Check if already notified for this goal achievement
      const achievementNotificationTitle = `🎯 Objectiu assolit: ${getMetricLabel(goal.metric_type)}`;
      const { data: existingNotification } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('user_id', goal.assigned_to)
        .eq('title', achievementNotificationTitle)
        .gte('created_at', goal.period_start)
        .single();

      if (existingNotification) {
        console.log(`Achievement already notified for goal ${goal.id}`);
        continue;
      }

      // Calculate current progress
      const currentValue = await calculateMetricValue(
        supabaseClient,
        goal.assigned_to,
        goal.metric_type,
        goal.period_start,
        goal.period_end
      );

      const progressPercentage = goal.target_value > 0 
        ? (currentValue / goal.target_value) * 100 
        : 0;

      console.log(`Goal ${goal.id}: ${goal.metric_type} - Progress: ${progressPercentage.toFixed(1)}% (${currentValue}/${goal.target_value})`);

      // Check if goal is achieved (>= 100%)
      if (progressPercentage >= 100) {
        achievementsToNotify.push({
          goal,
          gestor,
          currentValue,
          progressPercentage
        });
      }
    }

    console.log(`Found ${achievementsToNotify.length} new achievements to notify`);

    const notificationsCreated: string[] = [];

    // Create notifications for achievements
    for (const achievement of achievementsToNotify) {
      const { goal, gestor, currentValue, progressPercentage } = achievement;
      const metricLabel = getMetricLabel(goal.metric_type);
      
      // Notification for the gestor who achieved the goal
      const gestorNotification = {
        user_id: gestor.id,
        title: `🎯 Objectiu assolit: ${metricLabel}`,
        message: `Felicitats! Has assolit el teu objectiu de ${metricLabel}. Objectiu: ${formatValue(goal.target_value, goal.metric_type)}, Aconseguit: ${formatValue(currentValue, goal.metric_type)} (${progressPercentage.toFixed(0)}%)`,
        severity: 'info',
        is_read: false,
      };

      const { error: gestorNotifError } = await supabaseClient
        .from('notifications')
        .insert(gestorNotification);

      if (gestorNotifError) {
        console.error('Error creating gestor notification:', gestorNotifError);
      } else {
        notificationsCreated.push(`Gestor: ${gestor.full_name || gestor.email}`);
        console.log(`Created achievement notification for gestor ${gestor.email}`);
      }

      // Notifications for managers/directors
      for (const manager of managers || []) {
        const managerProfile = manager.profiles as Profile | null;
        if (!managerProfile || managerProfile.id === gestor.id) continue;

        // Office directors only get notified for their office gestors
        if (manager.role === 'director_oficina') {
          const { data: directorProfile } = await supabaseClient
            .from('profiles')
            .select('oficina')
            .eq('id', manager.user_id)
            .single();
          
          if (directorProfile?.oficina !== gestor.oficina) continue;
        }

        const managerNotification = {
          user_id: manager.user_id,
          title: `🏆 ${gestor.full_name || gestor.email} ha assolit un objectiu`,
          message: `El gestor ${gestor.full_name || gestor.email} ha assolit l'objectiu de ${metricLabel}. Objectiu: ${formatValue(goal.target_value, goal.metric_type)}, Aconseguit: ${formatValue(currentValue, goal.metric_type)} (${progressPercentage.toFixed(0)}%)`,
          severity: 'info',
          is_read: false,
        };

        const { error: managerNotifError } = await supabaseClient
          .from('notifications')
          .insert(managerNotification);

        if (managerNotifError) {
          console.error('Error creating manager notification:', managerNotifError);
        } else {
          console.log(`Created achievement notification for manager ${managerProfile.email}`);
        }
      }

      // Send email to gestor
      try {
        const emailResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-goal-achievement-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              to: gestor.email,
              gestorName: gestor.full_name || gestor.email,
              metricLabel,
              targetValue: formatValue(goal.target_value, goal.metric_type),
              achievedValue: formatValue(currentValue, goal.metric_type),
              progressPercentage: progressPercentage.toFixed(0),
            }),
          }
        );

        if (!emailResponse.ok) {
          console.error('Failed to send achievement email:', await emailResponse.text());
        } else {
          console.log('Achievement email sent successfully to:', gestor.email);
        }
      } catch (emailError) {
        console.error('Error sending achievement email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        goals_checked: goals.length,
        achievements_notified: achievementsToNotify.length,
        notifications_created: notificationsCreated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-goal-achievements function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    total_visits: 'Visites Totals',
    successful_visits: 'Visites Exitoses',
    assigned_companies: 'Empreses Assignades',
    products_offered: 'Productes Oferts',
    average_vinculacion: 'Vinculació Mitjana',
    new_clients: 'Nous Clients',
    visit_sheets: 'Fitxes de Visita',
    tpv_volume: 'Volum TPV',
    conversion_rate: 'Taxa de Conversió',
    client_facturacion: 'Facturació Clients',
    products_per_client: 'Productes per Client',
    follow_ups: 'Seguiments',
  };
  return labels[metric] || metric;
}

function formatValue(value: number, metricType: string): string {
  if (['average_vinculacion', 'conversion_rate'].includes(metricType)) {
    return `${value.toFixed(1)}%`;
  }
  if (['tpv_volume', 'client_facturacion'].includes(metricType)) {
    return `${value.toLocaleString()}€`;
  }
  if (metricType === 'products_per_client') {
    return value.toFixed(1);
  }
  return value.toString();
}

async function calculateMetricValue(
  supabase: any,
  gestorId: string,
  metricType: string,
  periodStart: string,
  periodEnd: string
): Promise<number> {
  switch (metricType) {
    case 'total_visits': {
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
        .gte('visit_date', periodStart)
        .lte('visit_date', periodEnd);
      return count || 0;
    }
    case 'successful_visits': {
      const { count } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
        .eq('result', 'exitosa')
        .gte('visit_date', periodStart)
        .lte('visit_date', periodEnd);
      return count || 0;
    }
    case 'assigned_companies': {
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId);
      return count || 0;
    }
    case 'products_offered': {
      const { data: visits } = await supabase
        .from('visits')
        .select('productos_ofrecidos')
        .eq('gestor_id', gestorId)
        .gte('visit_date', periodStart)
        .lte('visit_date', periodEnd);
      return visits?.reduce((acc: number, v: any) => acc + (v.productos_ofrecidos?.length || 0), 0) || 0;
    }
    case 'average_vinculacion': {
      const { data: companies } = await supabase
        .from('companies')
        .select('vinculacion_entidad_1')
        .eq('gestor_id', gestorId)
        .not('vinculacion_entidad_1', 'is', null);
      if (!companies?.length) return 0;
      return companies.reduce((acc: number, c: any) => acc + (c.vinculacion_entidad_1 || 0), 0) / companies.length;
    }
    case 'new_clients': {
      const { count } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);
      return count || 0;
    }
    case 'visit_sheets': {
      const { count } = await supabase
        .from('visit_sheets')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
        .gte('fecha', periodStart)
        .lte('fecha', periodEnd);
      return count || 0;
    }
    case 'tpv_volume': {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('gestor_id', gestorId);
      if (!companies?.length) return 0;
      const { data: terminals } = await supabase
        .from('company_tpv_terminals')
        .select('monthly_volume')
        .in('company_id', companies.map((c: any) => c.id))
        .eq('status', 'active');
      return terminals?.reduce((acc: number, t: any) => acc + (Number(t.monthly_volume) || 0), 0) || 0;
    }
    case 'conversion_rate': {
      const { count: total } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
        .gte('visit_date', periodStart)
        .lte('visit_date', periodEnd);
      const { count: successful } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
        .eq('result', 'exitosa')
        .gte('visit_date', periodStart)
        .lte('visit_date', periodEnd);
      return total && total > 0 ? ((successful || 0) / total) * 100 : 0;
    }
    case 'client_facturacion': {
      const { data: companies } = await supabase
        .from('companies')
        .select('facturacion_anual')
        .eq('gestor_id', gestorId);
      return companies?.reduce((acc: number, c: any) => acc + (Number(c.facturacion_anual) || 0), 0) || 0;
    }
    case 'products_per_client': {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('gestor_id', gestorId);
      if (!companies?.length) return 0;
      const { count: productsCount } = await supabase
        .from('company_products')
        .select('*', { count: 'exact', head: true })
        .in('company_id', companies.map((c: any) => c.id))
        .eq('active', true);
      return (productsCount || 0) / companies.length;
    }
    case 'follow_ups': {
      const { count } = await supabase
        .from('visit_sheets')
        .select('*', { count: 'exact', head: true })
        .eq('gestor_id', gestorId)
        .gte('fecha', periodStart)
        .lte('fecha', periodEnd)
        .or('proxima_llamada.not.is.null,proxima_cita.not.is.null');
      return count || 0;
    }
    default:
      return 0;
  }
}
