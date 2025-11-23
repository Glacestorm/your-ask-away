import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Visit {
  id: string;
  company_id: string;
  gestor_id: string;
  visit_date: string;
  notes: string | null;
  company: {
    name: string;
    address: string;
  }[];
}

interface ReminderPreference {
  user_id: string;
  enabled: boolean;
  minutes_before: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Starting visit reminders check...');

    // Get all active reminder preferences
    const { data: preferences, error: prefsError } = await supabaseClient
      .from('visit_reminder_preferences')
      .select('*')
      .eq('enabled', true);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      console.log('No active reminder preferences found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active preferences',
          notificationsSent: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${preferences.length} users with active reminders`);

    let notificationsSent = 0;
    const now = new Date();

    // Process each user's preferences
    for (const pref of preferences as ReminderPreference[]) {
      // Calculate time window for reminders
      const reminderWindowStart = new Date(now.getTime() + pref.minutes_before * 60 * 1000);
      const reminderWindowEnd = new Date(reminderWindowStart.getTime() + 5 * 60 * 1000); // 5 min window

      console.log(`Checking visits for user ${pref.user_id} between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`);

      // Find upcoming visits for this user that fall within the reminder window
      const { data: visits, error: visitsError } = await supabaseClient
        .from('visits')
        .select(`
          id,
          company_id,
          gestor_id,
          visit_date,
          notes,
          company:companies(name, address)
        `)
        .eq('gestor_id', pref.user_id)
        .gte('visit_date', reminderWindowStart.toISOString())
        .lte('visit_date', reminderWindowEnd.toISOString());

      if (visitsError) {
        console.error(`Error fetching visits for user ${pref.user_id}:`, visitsError);
        continue;
      }

      if (!visits || visits.length === 0) {
        console.log(`No upcoming visits found for user ${pref.user_id}`);
        continue;
      }

      console.log(`Found ${visits.length} upcoming visits for user ${pref.user_id}`);

      // Create notifications for each visit
      for (const visit of visits as Visit[]) {
        const companyName = visit.company?.[0]?.name || 'Empresa desconocida';
        const visitTime = new Date(visit.visit_date).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });

        let reminderText = '';
        if (pref.minutes_before < 60) {
          reminderText = `${pref.minutes_before} minutos`;
        } else if (pref.minutes_before < 1440) {
          const hours = Math.floor(pref.minutes_before / 60);
          reminderText = `${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
          const days = Math.floor(pref.minutes_before / 1440);
          reminderText = `${days} día${days > 1 ? 's' : ''}`;
        }

        // Insert notification in database
        const { error: notifError } = await supabaseClient
          .from('notifications')
          .insert({
            user_id: pref.user_id,
            title: '📅 Recordatorio de Visita',
            message: `Visita programada a ${companyName}`,
            severity: 'info',
            metric_value: null,
            threshold_value: null,
            alert_id: null,
          });

        if (notifError) {
          console.error('Error creating notification:', notifError);
        } else {
          notificationsSent++;
          console.log(`Notification created for visit to ${companyName}`);
        }
      }
    }

    console.log(`Check completed. Sent ${notificationsSent} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent,
        usersChecked: preferences.length,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-visit-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
