import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

interface AlertHistoryRecord {
  id: string;
  alert_id: string;
  alert_name: string;
  triggered_at: string;
  resolved_at: string | null;
  escalation_level: number;
  escalated_at: string | null;
  escalation_notified_to: string[];
  target_type: string;
  target_office: string | null;
  target_gestor_id: string | null;
}

interface Alert {
  id: string;
  escalation_enabled: boolean;
  escalation_hours: number;
  max_escalation_level: number;
}

serve(async (req) => {
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

    console.log('Starting alert escalation check...');

    // Get all unresolved alert history records
    const { data: unresolvedAlerts, error: alertsError } = await supabase
      .from('alert_history')
      .select('*')
      .is('resolved_at', null)
      .order('triggered_at', { ascending: true });

    if (alertsError) {
      console.error('Error fetching unresolved alerts:', alertsError);
      throw alertsError;
    }

    console.log(`Found ${unresolvedAlerts?.length || 0} unresolved alerts`);

    if (!unresolvedAlerts || unresolvedAlerts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No unresolved alerts to escalate' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get alert configurations for escalation settings
    const alertIds = [...new Set(unresolvedAlerts.map(a => a.alert_id))];
    const { data: alertConfigs, error: configError } = await supabase
      .from('alerts')
      .select('id, escalation_enabled, escalation_hours, max_escalation_level')
      .in('id', alertIds);

    if (configError) {
      console.error('Error fetching alert configs:', configError);
      throw configError;
    }

    const configMap = new Map<string, Alert>();
    alertConfigs?.forEach(config => configMap.set(config.id, config));

    // Get all directors and superadmins for escalation notifications
    const { data: directors, error: directorsError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['superadmin', 'director_comercial', 'director_oficina', 'responsable_comercial']);

    if (directorsError) {
      console.error('Error fetching directors:', directorsError);
      throw directorsError;
    }

    // Get profiles for office matching
    const directorIds = directors?.map(d => d.user_id) || [];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, oficina')
      .in('id', directorIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const profileMap = new Map<string, any>();
    profiles?.forEach(p => profileMap.set(p.id, p));

    const now = new Date();
    let escalatedCount = 0;
    const notifications: any[] = [];

    for (const alertRecord of unresolvedAlerts as AlertHistoryRecord[]) {
      const config = configMap.get(alertRecord.alert_id);
      
      // Skip if escalation not enabled
      if (!config?.escalation_enabled) {
        continue;
      }

      // Check if max escalation level reached
      if (alertRecord.escalation_level >= config.max_escalation_level) {
        continue;
      }

      // Calculate time since last escalation or trigger
      const lastEscalationTime = alertRecord.escalated_at 
        ? new Date(alertRecord.escalated_at) 
        : new Date(alertRecord.triggered_at);
      
      const hoursSinceLastEscalation = (now.getTime() - lastEscalationTime.getTime()) / (1000 * 60 * 60);

      // Check if enough time has passed for escalation
      if (hoursSinceLastEscalation < config.escalation_hours) {
        continue;
      }

      // Time to escalate!
      const newLevel = alertRecord.escalation_level + 1;
      console.log(`Escalating alert ${alertRecord.id} to level ${newLevel}`);

      // Determine who to notify based on escalation level
      const notifyRecipients: string[] = [];
      const alreadyNotified = new Set(alertRecord.escalation_notified_to || []);

      directors?.forEach(director => {
        const profile = profileMap.get(director.user_id);
        
        // Level 1: Notify office directors for their office
        if (newLevel >= 1 && director.role === 'director_oficina') {
          if (alertRecord.target_type === 'office' && profile?.oficina === alertRecord.target_office) {
            if (!alreadyNotified.has(director.user_id)) {
              notifyRecipients.push(director.user_id);
            }
          } else if (alertRecord.target_type === 'gestor') {
            // Check if gestor belongs to this office director
            // For simplicity, we'll include them anyway
            if (!alreadyNotified.has(director.user_id)) {
              notifyRecipients.push(director.user_id);
            }
          }
        }
        
        // Level 2: Notify commercial managers
        if (newLevel >= 2 && director.role === 'responsable_comercial') {
          if (!alreadyNotified.has(director.user_id)) {
            notifyRecipients.push(director.user_id);
          }
        }
        
        // Level 3: Notify commercial directors and superadmins
        if (newLevel >= 3 && (director.role === 'director_comercial' || director.role === 'superadmin')) {
          if (!alreadyNotified.has(director.user_id)) {
            notifyRecipients.push(director.user_id);
          }
        }
      });

      // Update alert history with new escalation level
      const allNotified = [...alreadyNotified, ...notifyRecipients];
      const { error: updateError } = await supabase
        .from('alert_history')
        .update({
          escalation_level: newLevel,
          escalated_at: now.toISOString(),
          escalation_notified_to: allNotified,
        })
        .eq('id', alertRecord.id);

      if (updateError) {
        console.error(`Error updating alert ${alertRecord.id}:`, updateError);
        continue;
      }

      // Create notifications for new recipients
      for (const recipientId of notifyRecipients) {
        const profile = profileMap.get(recipientId);
        notifications.push({
          user_id: recipientId,
          title: `⚠️ Alerta Escalada (Nivel ${newLevel})`,
          message: `La alerta "${alertRecord.alert_name}" ha sido escalada al nivel ${newLevel} por no resolverse en ${config.escalation_hours} horas.`,
          severity: newLevel >= 3 ? 'critical' : newLevel >= 2 ? 'high' : 'medium',
          alert_id: alertRecord.alert_id,
        });
      }

      escalatedCount++;
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error inserting notifications:', notifError);
      } else {
        console.log(`Created ${notifications.length} escalation notifications`);
      }
    }

    console.log(`Escalation check complete. Escalated ${escalatedCount} alerts.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        escalatedCount,
        notificationsSent: notifications.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in escalate-alerts function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
