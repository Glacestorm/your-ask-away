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

    console.log('Starting KPI alert check...');

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

    // Get directors to notify
    const { data: directors, error: directorsError } = await supabaseClient
      .from('user_roles')
      .select('user_id, profiles(id, email, full_name)')
      .in('role', ['superadmin', 'director_comercial', 'director_oficina', 'responsable_comercial']);

    if (directorsError) throw directorsError;

    const directorEmails = directors
      ?.map(d => d.profiles?.email)
      .filter((email): email is string => email != null) || [];

    const notificationsToCreate: any[] = [];

    for (const alert of alerts as Alert[]) {
      console.log(`Checking alert: ${alert.alert_name} (${alert.metric_type})`);
      
      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (alert.period_type) {
        case 'daily':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 1);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Calculate metric value based on type
      let metricValue = 0;
      
      switch (alert.metric_type) {
        case 'visits': {
          const { data: visits } = await supabaseClient
            .from('visits')
            .select('id')
            .gte('visit_date', startDateStr);
          metricValue = visits?.length || 0;
          break;
        }
        
        case 'success_rate': {
          const { data: visits } = await supabaseClient
            .from('visits')
            .select('result')
            .gte('visit_date', startDateStr);
          if (visits && visits.length > 0) {
            const successful = visits.filter(v => v.result === 'exitosa').length;
            metricValue = (successful / visits.length) * 100;
          }
          break;
        }
        
        case 'vinculacion': {
          const { data: visits } = await supabaseClient
            .from('visits')
            .select('porcentaje_vinculacion')
            .gte('visit_date', startDateStr)
            .not('porcentaje_vinculacion', 'is', null);
          if (visits && visits.length > 0) {
            const total = visits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0);
            metricValue = total / visits.length;
          }
          break;
        }
        
        case 'engagement': {
          const { data: visits } = await supabaseClient
            .from('visits')
            .select('notes, pactos_realizados')
            .gte('visit_date', startDateStr);
          if (visits && visits.length > 0) {
            const engaged = visits.filter(v => v.notes || v.pactos_realizados).length;
            metricValue = (engaged / visits.length) * 100;
          }
          break;
        }
        
        case 'products': {
          const { data: visits } = await supabaseClient
            .from('visits')
            .select('productos_ofrecidos')
            .gte('visit_date', startDateStr);
          if (visits) {
            metricValue = visits.reduce((sum, v) => sum + (v.productos_ofrecidos?.length || 0), 0);
          }
          break;
        }
        
        case 'tpv_volume': {
          const { data: tpvTerminals } = await supabaseClient
            .from('company_tpv_terminals')
            .select('monthly_volume')
            .eq('status', 'active');
          if (tpvTerminals) {
            metricValue = tpvTerminals.reduce((sum, t) => sum + (t.monthly_volume || 0), 0);
          }
          break;
        }
        
        case 'facturacion': {
          const { data: companies } = await supabaseClient
            .from('companies')
            .select('facturacion_anual');
          if (companies) {
            metricValue = companies.reduce((sum, c) => sum + (c.facturacion_anual || 0), 0);
          }
          break;
        }
        
        case 'visit_sheets': {
          const { data: sheets } = await supabaseClient
            .from('visit_sheets')
            .select('id')
            .gte('fecha', startDateStr);
          metricValue = sheets?.length || 0;
          break;
        }
        
        case 'new_clients': {
          const { data: companies } = await supabaseClient
            .from('companies')
            .select('id')
            .gte('created_at', startDate.toISOString());
          metricValue = companies?.length || 0;
          break;
        }
        
        case 'avg_visits_per_gestor': {
          const { data: visits } = await supabaseClient
            .from('visits')
            .select('gestor_id')
            .gte('visit_date', startDateStr);
          if (visits && visits.length > 0) {
            const uniqueGestors = new Set(visits.map(v => v.gestor_id)).size;
            metricValue = uniqueGestors > 0 ? visits.length / uniqueGestors : 0;
          }
          break;
        }
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
        const percentageDiff = alert.threshold_value > 0 
          ? (difference / alert.threshold_value) * 100 
          : 100;
        
        let severity: string;
        if (percentageDiff > 30) {
          severity = 'critical';
        } else if (percentageDiff > 15) {
          severity = 'warning';
        } else {
          severity = 'info';
        }

        const metricLabels: Record<string, string> = {
          visits: 'Visitas Totales',
          success_rate: 'Tasa de Éxito',
          vinculacion: 'Vinculación Promedio',
          engagement: 'Engagement',
          products: 'Productos Ofrecidos',
          tpv_volume: 'Volumen TPV',
          facturacion: 'Facturación Total',
          visit_sheets: 'Fichas de Visita',
          new_clients: 'Nuevos Clientes',
          avg_visits_per_gestor: 'Visitas por Gestor',
        };

        const conditionLabels: Record<string, string> = {
          below: 'por debajo del',
          above: 'por encima del',
          equals: 'igual al',
        };

        const message = `${metricLabels[alert.metric_type] || alert.metric_type} está ${conditionLabels[alert.condition_type]} umbral (${alert.threshold_value}). Valor actual: ${metricValue.toFixed(2)}`;

        // Create notifications for directors
        for (const director of directors || []) {
          notificationsToCreate.push({
            alert_id: alert.id,
            user_id: director.user_id,
            title: `⚠️ Alerta KPI: ${alert.alert_name}`,
            message,
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

      // Send email for critical alerts
      const criticalNotifications = notificationsToCreate.filter(n => n.severity === 'critical');
      
      if (criticalNotifications.length > 0 && directorEmails.length > 0) {
        console.log(`Sending critical alert emails to ${directorEmails.length} directors`);
        
        const uniqueAlerts = new Map<string, typeof notificationsToCreate[0]>();
        criticalNotifications.forEach(notif => {
          if (!uniqueAlerts.has(notif.alert_id)) {
            uniqueAlerts.set(notif.alert_id, notif);
          }
        });

        for (const notification of uniqueAlerts.values()) {
          try {
            const emailResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  to: directorEmails,
                  alertName: notification.title,
                  metricType: notification.title,
                  metricValue: notification.metric_value,
                  thresholdValue: notification.threshold_value,
                  severity: notification.severity,
                  message: notification.message,
                }),
              }
            );

            if (!emailResponse.ok) {
              console.error('Failed to send email:', await emailResponse.text());
            } else {
              console.log('Email sent successfully for alert:', notification.title);
            }
          } catch (emailError) {
            console.error('Error sending email:', emailError);
          }
        }
      }
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