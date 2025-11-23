import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Alert {
  id: string;
  alert_name: string;
  metric_type: string;
  condition_type: string;
  threshold_value: number;
  period_type: string;
  active: boolean;
  created_by: string;
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

    console.log('Starting alert check...');

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabaseClient
      .from('alerts')
      .select('*')
      .eq('active', true);

    if (alertsError) throw alertsError;
    if (!alerts || alerts.length === 0) {
      console.log('No active alerts found');
      return new Response(JSON.stringify({ message: 'No active alerts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`Found ${alerts.length} active alerts`);

    // Get all users to notify
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id');

    if (profilesError) throw profilesError;

    const notificationsToCreate = [];

    for (const alert of alerts as Alert[]) {
      console.log(`Checking alert: ${alert.alert_name}`);
      
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (alert.period_type) {
        case 'daily':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 1));
      }

      // Fetch visits data for the period
      const { data: visits, error: visitsError } = await supabaseClient
        .from('visits')
        .select('*')
        .gte('visit_date', startDate.toISOString().split('T')[0]);

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        continue;
      }

      if (!visits || visits.length === 0) {
        console.log(`No visits found for period ${alert.period_type}`);
        continue;
      }

      // Calculate metric value
      let metricValue = 0;
      
      switch (alert.metric_type) {
        case 'visits':
          metricValue = visits.length;
          break;
        case 'success_rate':
          const successfulVisits = visits.filter(v => v.result === 'exitosa').length;
          metricValue = (successfulVisits / visits.length) * 100;
          break;
        case 'vinculacion':
          const vinculacionVisits = visits.filter(v => v.porcentaje_vinculacion != null);
          if (vinculacionVisits.length > 0) {
            const totalVinculacion = vinculacionVisits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0);
            metricValue = totalVinculacion / vinculacionVisits.length;
          }
          break;
        case 'engagement':
          // Calculate engagement as visits with notes or follow-ups
          const engagedVisits = visits.filter(v => v.notes || v.pactos_realizados).length;
          metricValue = (engagedVisits / visits.length) * 100;
          break;
        case 'products':
          // Count total products offered
          metricValue = visits.reduce((sum, v) => sum + (v.productos_ofrecidos?.length || 0), 0);
          break;
      }

      console.log(`Metric ${alert.metric_type}: ${metricValue}, Threshold: ${alert.threshold_value}`);

      // Check if alert condition is met
      let shouldAlert = false;
      
      switch (alert.condition_type) {
        case 'below':
          shouldAlert = metricValue < alert.threshold_value;
          break;
        case 'above':
          shouldAlert = metricValue > alert.threshold_value;
          break;
        case 'equals':
          shouldAlert = Math.abs(metricValue - alert.threshold_value) < 0.01;
          break;
      }

      if (shouldAlert) {
        console.log(`Alert triggered: ${alert.alert_name}`);
        
        // Determine severity
        const difference = Math.abs(metricValue - alert.threshold_value);
        const percentageDiff = (difference / alert.threshold_value) * 100;
        let severity: 'info' | 'warning' | 'critical';
        
        if (percentageDiff > 30) {
          severity = 'critical';
        } else if (percentageDiff > 15) {
          severity = 'warning';
        } else {
          severity = 'info';
        }

        // Create notification for all users
        for (const profile of profiles || []) {
          notificationsToCreate.push({
            alert_id: alert.id,
            user_id: profile.id,
            title: alert.alert_name,
            message: `La métrica ${alert.metric_type} está ${alert.condition_type === 'below' ? 'por debajo' : 'por encima'} del umbral establecido (${alert.threshold_value}). Valor actual: ${metricValue.toFixed(2)}`,
            severity,
            metric_value: metricValue,
            threshold_value: alert.threshold_value,
            is_read: false,
          });
        }

        // Update last_checked timestamp
        await supabaseClient
          .from('alerts')
          .update({ last_checked: new Date().toISOString() })
          .eq('id', alert.id);
      }
    }

    // Create all notifications
    if (notificationsToCreate.length > 0) {
      const { error: notificationsError } = await supabaseClient
        .from('notifications')
        .insert(notificationsToCreate);

      if (notificationsError) throw notificationsError;
      
      console.log(`Created ${notificationsToCreate.length} notifications`);
    } else {
      console.log('No alerts triggered');
    }

    return new Response(
      JSON.stringify({
        success: true,
        alerts_checked: alerts.length,
        notifications_created: notificationsToCreate.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-alerts function:', error);
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
