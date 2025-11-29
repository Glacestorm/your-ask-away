import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisitSheet {
  id: string;
  gestor_id: string;
  company_id: string;
  proxima_llamada: string | null;
  revision_cartera: string | null;
  renovaciones: string | null;
  proxima_cita: string | null;
  company: {
    name: string;
  };
  gestor: {
    full_name: string | null;
    email: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking visit sheet reminders...');

    // Calculate date range: today and next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    console.log(`Checking reminders from ${todayStr} to ${nextWeekStr}`);

    // Fetch visit sheets with upcoming dates
    const { data: sheets, error: sheetsError } = await supabase
      .from('visit_sheets')
      .select(`
        id,
        gestor_id,
        company_id,
        proxima_llamada,
        revision_cartera,
        renovaciones,
        proxima_cita,
        company:companies(name),
        gestor:profiles!visit_sheets_gestor_id_fkey(full_name, email)
      `)
      .or(`proxima_llamada.gte.${todayStr},revision_cartera.gte.${todayStr},renovaciones.gte.${todayStr},proxima_cita.gte.${todayStr}`)
      .or(`proxima_llamada.lte.${nextWeekStr},revision_cartera.lte.${nextWeekStr},renovaciones.lte.${nextWeekStr},proxima_cita.lte.${nextWeekStr}`);

    if (sheetsError) {
      console.error('Error fetching visit sheets:', sheetsError);
      throw sheetsError;
    }

    console.log(`Found ${sheets?.length || 0} visit sheets with upcoming reminders`);

    const notifications = [];

    for (const sheet of sheets || []) {
      const companyName = (sheet.company as any)?.name || 'Cliente';
      const gestorName = (sheet.gestor as any)?.full_name || (sheet.gestor as any)?.email || 'Gestor';

      // Check each reminder type
      const reminders = [
        {
          date: sheet.proxima_llamada,
          type: 'Próxima Llamada',
          title: `Recordatorio: Llamada programada - ${companyName}`,
          message: `Tienes una llamada programada con ${companyName} para el ${sheet.proxima_llamada}`,
        },
        {
          date: sheet.revision_cartera,
          type: 'Revisión de Cartera',
          title: `Recordatorio: Revisión de cartera - ${companyName}`,
          message: `Es momento de revisar la cartera de ${companyName}. Fecha programada: ${sheet.revision_cartera}`,
        },
        {
          date: sheet.renovaciones,
          type: 'Renovaciones',
          title: `Recordatorio: Renovaciones pendientes - ${companyName}`,
          message: `Renovaciones pendientes con ${companyName} para el ${sheet.renovaciones}`,
        },
        {
          date: sheet.proxima_cita,
          type: 'Próxima Cita',
          title: `Recordatorio: Cita programada - ${companyName}`,
          message: `Tienes una cita programada con ${companyName} para el ${sheet.proxima_cita}`,
        },
      ];

      for (const reminder of reminders) {
        if (reminder.date) {
          const reminderDate = new Date(reminder.date);
          
          // Check if the date is within our range
          if (reminderDate >= today && reminderDate <= nextWeek) {
            // Calculate days until reminder
            const daysUntil = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Check if notification already exists for this date and type
            const { data: existingNotifications } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', sheet.gestor_id)
              .eq('title', reminder.title)
              .gte('created_at', todayStr);

            if (!existingNotifications || existingNotifications.length === 0) {
              console.log(`Creating notification: ${reminder.type} for ${companyName} in ${daysUntil} days`);
              
              notifications.push({
                user_id: sheet.gestor_id,
                title: reminder.title,
                message: reminder.message,
                severity: daysUntil <= 1 ? 'high' : daysUntil <= 3 ? 'medium' : 'info',
                is_read: false,
              });
            }
          }
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        throw notifError;
      }

      console.log(`Created ${notifications.length} notifications successfully`);
    } else {
      console.log('No new notifications to create');
    }

    return new Response(
      JSON.stringify({
        success: true,
        sheetsChecked: sheets?.length || 0,
        notificationsCreated: notifications.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in check-visit-sheet-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
