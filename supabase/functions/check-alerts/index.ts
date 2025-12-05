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
  target_type: string | null;
  target_office: string | null;
  target_gestor_id: string | null;
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

    console.log('Starting KPI alert check with targeting support...');

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
      .select('user_id, profiles(id, email, full_name, oficina)')
      .in('role', ['superadmin', 'director_comercial', 'director_oficina', 'responsable_comercial']);

    if (directorsError) throw directorsError;

    // Get all profiles for gestor lookups
    const { data: allProfiles } = await supabaseClient
      .from('profiles')
      .select('id, full_name, oficina');

    const profilesMap = new Map((allProfiles || []).map(p => [p.id, p]));

    const notificationsToCreate: any[] = [];

    for (const alert of alerts as Alert[]) {
      const targetType = alert.target_type || 'global';
      console.log(`Checking alert: ${alert.alert_name} (${alert.metric_type}) - Target: ${targetType}`);
      
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
      
      // Build filter conditions based on target type
      const getGestorIds = async (): Promise<string[] | null> => {
        if (targetType === 'gestor' && alert.target_gestor_id) {
          return [alert.target_gestor_id];
        }
        if (targetType === 'office' && alert.target_office) {
          const { data: officeGestors } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('oficina', alert.target_office);
          return officeGestors?.map(g => g.id) || [];
        }
        return null; // global - no filter
      };

      const gestorIds = await getGestorIds();
      
      // Calculate metric value based on type with targeting
      let metricValue = 0;
      
      switch (alert.metric_type) {
        case 'visits': {
          let query = supabaseClient
            .from('visits')
            .select('id, gestor_id')
            .gte('visit_date', startDateStr);
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: visits } = await query;
          metricValue = visits?.length || 0;
          break;
        }
        
        case 'success_rate': {
          let query = supabaseClient
            .from('visits')
            .select('result, gestor_id')
            .gte('visit_date', startDateStr);
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: visits } = await query;
          if (visits && visits.length > 0) {
            const successful = visits.filter(v => v.result === 'exitosa').length;
            metricValue = (successful / visits.length) * 100;
          }
          break;
        }
        
        case 'vinculacion': {
          let query = supabaseClient
            .from('visits')
            .select('porcentaje_vinculacion, gestor_id')
            .gte('visit_date', startDateStr)
            .not('porcentaje_vinculacion', 'is', null);
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: visits } = await query;
          if (visits && visits.length > 0) {
            const total = visits.reduce((sum, v) => sum + (v.porcentaje_vinculacion || 0), 0);
            metricValue = total / visits.length;
          }
          break;
        }
        
        case 'engagement': {
          let query = supabaseClient
            .from('visits')
            .select('notes, pactos_realizados, gestor_id')
            .gte('visit_date', startDateStr);
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: visits } = await query;
          if (visits && visits.length > 0) {
            const engaged = visits.filter(v => v.notes || v.pactos_realizados).length;
            metricValue = (engaged / visits.length) * 100;
          }
          break;
        }
        
        case 'products': {
          let query = supabaseClient
            .from('visits')
            .select('productos_ofrecidos, gestor_id')
            .gte('visit_date', startDateStr);
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: visits } = await query;
          if (visits) {
            metricValue = visits.reduce((sum, v) => sum + (v.productos_ofrecidos?.length || 0), 0);
          }
          break;
        }
        
        case 'tpv_volume': {
          let query = supabaseClient
            .from('company_tpv_terminals')
            .select('monthly_volume, companies!fk_company_tpv(gestor_id)')
            .eq('status', 'active');
          
          const { data: tpvTerminals } = await query;
          
          if (tpvTerminals) {
            const filtered = gestorIds 
              ? tpvTerminals.filter((t: any) => gestorIds.includes(t.companies?.gestor_id))
              : tpvTerminals;
            metricValue = filtered.reduce((sum: number, t: any) => sum + (t.monthly_volume || 0), 0);
          }
          break;
        }
        
        case 'facturacion': {
          let query = supabaseClient
            .from('companies')
            .select('facturacion_anual, gestor_id');
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: companies } = await query;
          if (companies) {
            metricValue = companies.reduce((sum, c) => sum + (c.facturacion_anual || 0), 0);
          }
          break;
        }
        
        case 'visit_sheets': {
          let query = supabaseClient
            .from('visit_sheets')
            .select('id, gestor_id')
            .gte('fecha', startDateStr);
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: sheets } = await query;
          metricValue = sheets?.length || 0;
          break;
        }
        
        case 'new_clients': {
          let query = supabaseClient
            .from('companies')
            .select('id, gestor_id')
            .gte('created_at', startDate.toISOString());
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: companies } = await query;
          metricValue = companies?.length || 0;
          break;
        }
        
        case 'avg_visits_per_gestor': {
          let query = supabaseClient
            .from('visits')
            .select('gestor_id')
            .gte('visit_date', startDateStr);
          
          if (gestorIds) {
            query = query.in('gestor_id', gestorIds);
          }
          
          const { data: visits } = await query;
          if (visits && visits.length > 0) {
            const uniqueGestors = new Set(visits.map(v => v.gestor_id)).size;
            metricValue = uniqueGestors > 0 ? visits.length / uniqueGestors : 0;
          }
          break;
        }
      }

      console.log(`Metric ${alert.metric_type} (${targetType}): ${metricValue}, Threshold: ${alert.threshold_value}`);

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
        
        // Log to alert_history
        const { error: historyError } = await supabaseClient
          .from('alert_history')
          .insert({
            alert_id: alert.id,
            alert_name: alert.alert_name,
            metric_type: alert.metric_type,
            metric_value: metricValue,
            threshold_value: alert.threshold_value,
            condition_type: alert.condition_type,
            target_type: targetType,
            target_office: alert.target_office,
            target_gestor_id: alert.target_gestor_id,
          });
        
        if (historyError) {
          console.error('Error logging alert history:', historyError);
        } else {
          console.log('Alert logged to history');
        }
        
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

        // Add target info to message
        let targetInfo = '';
        if (targetType === 'office' && alert.target_office) {
          targetInfo = ` [Oficina: ${alert.target_office}]`;
        } else if (targetType === 'gestor' && alert.target_gestor_id) {
          const gestor = profilesMap.get(alert.target_gestor_id);
          targetInfo = ` [Gestor: ${gestor?.full_name || 'Desconocido'}]`;
        }

        const message = `${metricLabels[alert.metric_type] || alert.metric_type}${targetInfo} está ${conditionLabels[alert.condition_type]} umbral (${alert.threshold_value}). Valor actual: ${metricValue.toFixed(2)}`;

        // Determine who to notify based on target type
        const notifyUsers: string[] = [];
        
        if (targetType === 'gestor' && alert.target_gestor_id) {
          // Notify the specific gestor
          notifyUsers.push(alert.target_gestor_id);
          // Also notify their office director
          const gestor = profilesMap.get(alert.target_gestor_id);
          if (gestor?.oficina) {
            const officeDirectors = directors?.filter(d => 
              d.profiles?.oficina === gestor.oficina
            ) || [];
            officeDirectors.forEach(d => notifyUsers.push(d.user_id));
          }
        } else if (targetType === 'office' && alert.target_office) {
          // Notify office director and gestors in that office
          const officeDirectors = directors?.filter(d => 
            d.profiles?.oficina === alert.target_office
          ) || [];
          officeDirectors.forEach(d => notifyUsers.push(d.user_id));
        }
        
        // Always notify superadmins and commercial directors
        directors?.filter(d => {
          const role = (d as any).role;
          return role === 'superadmin' || role === 'director_comercial';
        }).forEach(d => notifyUsers.push(d.user_id));

        // If no specific users, notify all directors
        if (notifyUsers.length === 0) {
          directors?.forEach(d => notifyUsers.push(d.user_id));
        }

        // Deduplicate
        const uniqueUsers = [...new Set(notifyUsers)];

        for (const userId of uniqueUsers) {
          notificationsToCreate.push({
            alert_id: alert.id,
            user_id: userId,
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
      
      if (criticalNotifications.length > 0) {
        const directorEmails = directors
          ?.map(d => d.profiles?.email)
          .filter((email): email is string => email != null) || [];

        if (directorEmails.length > 0) {
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