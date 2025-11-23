import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/v135/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GestorPerformance {
  gestor_id: string;
  gestor_name: string;
  gestor_email: string;
  total_visits: number;
  successful_visits: number;
  conversion_rate: number;
  avg_vinculacion: number;
  rank: number;
  badge: string;
}

// Helper functions for email generation
const getBadgeEmoji = (rank: number) => {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  if (rank <= 5) return "⭐";
  return "📊";
};

const getPerformanceColor = (value: number, average: number) => {
  if (value >= average * 1.2) return "#10b981";
  if (value >= average * 0.8) return "#f59e0b";
  return "#ef4444";
};

const generateAchievements = (gestor: GestorPerformance) => {
  const achievements = [];
  if (gestor.rank === 1) achievements.push('<div style="padding: 10px 15px; background: #fef3c7; border-radius: 20px; font-size: 14px;">🏆 Campeón del Mes</div>');
  if (gestor.rank <= 3) achievements.push('<div style="padding: 10px 15px; background: #dbeafe; border-radius: 20px; font-size: 14px;">🥇 Top 3 Performer</div>');
  if (gestor.rank <= 5) achievements.push('<div style="padding: 10px 15px; background: #e0e7ff; border-radius: 20px; font-size: 14px;">⭐ Top 5 del Equipo</div>');
  if (gestor.total_visits >= 20) achievements.push('<div style="padding: 10px 15px; background: #dcfce7; border-radius: 20px; font-size: 14px;">🚀 Alta Actividad</div>');
  if (gestor.conversion_rate >= 60) achievements.push('<div style="padding: 10px 15px; background: #fce7f3; border-radius: 20px; font-size: 14px;">🎯 Alto Rendimiento</div>');
  if (gestor.avg_vinculacion >= 70) achievements.push('<div style="padding: 10px 15px; background: #fef3c7; border-radius: 20px; font-size: 14px;">💎 Excelente Vinculación</div>');
  return achievements.join('');
};

const getMotivationTitle = (rank: number) => {
  if (rank === 1) return '🎉 ¡Sigue así, eres el número 1!';
  if (rank <= 3) return '💪 ¡Excelente trabajo! Estás entre los mejores';
  if (rank <= 5) return '⭐ ¡Buen desempeño! Sigue mejorando';
  return '🚀 ¡Vamos! El próximo mes puede ser tu mejor mes';
};

const getMotivationMessage = (rank: number) => {
  if (rank === 1) return 'Mantén el liderazgo y sigue inspirando al equipo';
  return 'Cada visita cuenta. ¡Sigue adelante!';
};

const generateEmailHTML = (
  gestor: GestorPerformance,
  teamAvg: { visits: number; conversion: number; vinculacion: number },
  topPerformer: string,
  totalGestores: number,
  month: string
): string => {

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Mensual de Rendimiento</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📊 Reporte de Rendimiento</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${month}</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    
    <!-- Saludo personalizado -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #667eea; margin: 0 0 10px 0;">Hola ${gestor.gestor_name} ${getBadgeEmoji(gestor.rank)}</h2>
      <p style="margin: 0; color: #666; font-size: 14px;">Aquí está tu resumen de rendimiento del mes pasado</p>
    </div>

    <!-- Ranking destacado -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
      <div style="font-size: 48px; margin-bottom: 10px;">${getBadgeEmoji(gestor.rank)}</div>
      <div style="font-size: 18px; opacity: 0.9; margin-bottom: 5px;">Tu Posición</div>
      <div style="font-size: 36px; font-weight: bold; margin-bottom: 5px;">#${gestor.rank}</div>
      <div style="font-size: 14px; opacity: 0.8;">de ${totalGestores} gestores</div>
      ${gestor.rank <= 3 ? `<div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; font-size: 14px;">🎉 ¡Felicitaciones! Estás en el Top 3</div>` : ''}
    </div>

    <!-- Métricas principales -->
    <div style="margin-bottom: 30px;">
      <h3 style="color: #333; margin: 0 0 20px 0; font-size: 18px;">📈 Tus Métricas</h3>
      
      <div style="display: table; width: 100%; margin-bottom: 15px;">
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Visitas Realizadas</div>
            <div style="font-size: 28px; font-weight: bold; color: ${getPerformanceColor(gestor.total_visits, teamAvg.visits)};">${gestor.total_visits}</div>
            <div style="font-size: 11px; color: #999; margin-top: 5px;">Promedio equipo: ${teamAvg.visits.toFixed(0)}</div>
          </div>
        </div>
      </div>

      <div style="display: table; width: 100%; margin-bottom: 15px;">
        <div style="display: table-row;">
          <div style="display: table-cell; padding: 15px; background: #f8f9fa; border-radius: 8px; width: 48%;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Tasa de Conversión</div>
            <div style="font-size: 24px; font-weight: bold; color: ${getPerformanceColor(gestor.conversion_rate, teamAvg.conversion)};">${gestor.conversion_rate.toFixed(1)}%</div>
            <div style="font-size: 11px; color: #999; margin-top: 5px;">Promedio: ${teamAvg.conversion.toFixed(1)}%</div>
          </div>
          <div style="display: table-cell; width: 4%;"></div>
          <div style="display: table-cell; padding: 15px; background: #f8f9fa; border-radius: 8px; width: 48%;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Vinculación Media</div>
            <div style="font-size: 24px; font-weight: bold; color: ${getPerformanceColor(gestor.avg_vinculacion, teamAvg.vinculacion)};">${gestor.avg_vinculacion.toFixed(1)}%</div>
            <div style="font-size: 11px; color: #999; margin-top: 5px;">Promedio: ${teamAvg.vinculacion.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logros -->
    <div style="margin-bottom: 30px;">
      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">🏆 Tus Logros</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        ${gestor.rank === 1 ? '<div style="padding: 10px 15px; background: #fef3c7; border-radius: 20px; font-size: 14px;">🏆 Campeón del Mes</div>' : ''}
        ${gestor.rank <= 3 ? '<div style="padding: 10px 15px; background: #dbeafe; border-radius: 20px; font-size: 14px;">🥇 Top 3 Performer</div>' : ''}
        ${gestor.rank <= 5 ? '<div style="padding: 10px 15px; background: #e0e7ff; border-radius: 20px; font-size: 14px;">⭐ Top 5 del Equipo</div>' : ''}
        ${gestor.total_visits >= 20 ? '<div style="padding: 10px 15px; background: #dcfce7; border-radius: 20px; font-size: 14px;">🚀 Alta Actividad</div>' : ''}
        ${gestor.conversion_rate >= 60 ? '<div style="padding: 10px 15px; background: #fce7f3; border-radius: 20px; font-size: 14px;">🎯 Alto Rendimiento</div>' : ''}
        ${gestor.avg_vinculacion >= 70 ? '<div style="padding: 10px 15px; background: #fef3c7; border-radius: 20px; font-size: 14px;">💎 Excelente Vinculación</div>' : ''}
      </div>
    </div>

    <!-- Información del top performer -->
    ${gestor.rank !== 1 ? `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 30px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 5px;">🏆 Top Performer del Mes</div>
      <div style="font-size: 18px; font-weight: bold; color: #333;">${topPerformer}</div>
      <div style="font-size: 13px; color: #666; margin-top: 5px;">¡Sigue trabajando para alcanzar el primer lugar!</div>
    </div>
    ` : ''}

    <!-- Motivación -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
        ${gestor.rank === 1 ? '🎉 ¡Sigue así, eres el número 1!' : 
          gestor.rank <= 3 ? '💪 ¡Excelente trabajo! Estás entre los mejores' :
          gestor.rank <= 5 ? '⭐ ¡Buen desempeño! Sigue mejorando' :
          '🚀 ¡Vamos! El próximo mes puede ser tu mejor mes'}
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        ${gestor.rank === 1 ? 'Mantén el liderazgo y sigue inspirando al equipo' :
          'Cada visita cuenta. ¡Sigue adelante!'}
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">Este reporte se genera automáticamente cada mes</p>
      <p style="margin: 0;">¿Preguntas? Contacta a tu supervisor</p>
    </div>

  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Starting monthly report generation...");

    // Fetch the active email template
    const { data: templateData, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', 'monthly_report')
      .eq('is_active', true)
      .single();

    if (templateError || !templateData) {
      console.error("No active email template found, using default");
    }

    // Get date range for last month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthName = lastMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    console.log(`Generating reports for: ${monthName}`);

    // Fetch all visits with gestor info for last month
    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select(`
        gestor_id,
        result,
        porcentaje_vinculacion,
        profiles!visits_gestor_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .gte('visit_date', lastMonth.toISOString())
      .lte('visit_date', monthEnd.toISOString());

    if (visitsError) throw visitsError;

    if (!visitsData || visitsData.length === 0) {
      console.log("No visits found for last month");
      return new Response(
        JSON.stringify({ message: "No visits found for last month" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate performance for each gestor
    const gestorMap = new Map<string, GestorPerformance>();

    visitsData.forEach((visit: any) => {
      const gestorId = visit.gestor_id;
      const profile = visit.profiles;

      if (!gestorId || !profile) return;

      if (!gestorMap.has(gestorId)) {
        gestorMap.set(gestorId, {
          gestor_id: gestorId,
          gestor_name: profile.full_name || profile.email || 'Sin nombre',
          gestor_email: profile.email,
          total_visits: 0,
          successful_visits: 0,
          conversion_rate: 0,
          avg_vinculacion: 0,
          rank: 0,
          badge: '',
        });
      }

      const gestorStats = gestorMap.get(gestorId)!;
      gestorStats.total_visits++;

      if (
        visit.result === 'positivo' ||
        visit.result === 'contrato' ||
        (visit.porcentaje_vinculacion && visit.porcentaje_vinculacion > 50)
      ) {
        gestorStats.successful_visits++;
      }

      if (visit.porcentaje_vinculacion) {
        gestorStats.avg_vinculacion += visit.porcentaje_vinculacion;
      }
    });

    // Calculate final metrics
    const gestoresArray = Array.from(gestorMap.values()).map((gestor) => {
      const conversion_rate = gestor.total_visits > 0
        ? (gestor.successful_visits / gestor.total_visits) * 100
        : 0;

      const avg_vinculacion = gestor.successful_visits > 0
        ? gestor.avg_vinculacion / gestor.successful_visits
        : 0;

      const score = 
        (gestor.total_visits * 2) +
        (conversion_rate * 1.5) +
        (avg_vinculacion * 1);

      return {
        ...gestor,
        conversion_rate,
        avg_vinculacion,
        score,
      };
    });

    // Sort and assign ranks
    gestoresArray.sort((a, b) => b.score - a.score);
    gestoresArray.forEach((gestor, index) => {
      gestor.rank = index + 1;
    });

    // Calculate team averages
    const teamAvg = {
      visits: gestoresArray.reduce((sum, g) => sum + g.total_visits, 0) / gestoresArray.length,
      conversion: gestoresArray.reduce((sum, g) => sum + g.conversion_rate, 0) / gestoresArray.length,
      vinculacion: gestoresArray.reduce((sum, g) => sum + g.avg_vinculacion, 0) / gestoresArray.length,
    };

    const topPerformer = gestoresArray[0]?.gestor_name || 'N/A';
    const totalGestores = gestoresArray.length;

    console.log(`Sending reports to ${totalGestores} gestores...`);

    // Send email to each gestor
    const emailPromises = gestoresArray.map(async (gestor) => {
      try {
        // Use template from database or fallback to default
        let html: string;
        let subject: string;

        if (templateData) {
          // Replace template variables with actual data
          html = templateData.html_content;
          subject = templateData.subject;

          const variables: Record<string, string> = {
            gestor_name: gestor.gestor_name,
            month: monthName,
            rank: gestor.rank.toString(),
            total_gestores: totalGestores.toString(),
            badge_emoji: getBadgeEmoji(gestor.rank),
            total_visits: gestor.total_visits.toString(),
            conversion_rate: gestor.conversion_rate.toFixed(1),
            avg_vinculacion: gestor.avg_vinculacion.toFixed(1),
            avg_visits: teamAvg.visits.toFixed(0),
            avg_conversion: teamAvg.conversion.toFixed(1),
            avg_team_vinculacion: teamAvg.vinculacion.toFixed(1),
            visits_color: getPerformanceColor(gestor.total_visits, teamAvg.visits),
            conversion_color: getPerformanceColor(gestor.conversion_rate, teamAvg.conversion),
            vinculacion_color: getPerformanceColor(gestor.avg_vinculacion, teamAvg.vinculacion),
            achievements: generateAchievements(gestor),
            top_3_badge: gestor.rank <= 3 ? '<div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; font-size: 14px;">🎉 ¡Felicitaciones! Estás en el Top 3</div>' : '',
            top_performer_section: gestor.rank !== 1 ? `<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 30px;"><div style="font-size: 14px; color: #666; margin-bottom: 5px;">🏆 Top Performer del Mes</div><div style="font-size: 18px; font-weight: bold; color: #333;">${topPerformer}</div><div style="font-size: 13px; color: #666; margin-top: 5px;">¡Sigue trabajando para alcanzar el primer lugar!</div></div>` : '',
            motivation_title: getMotivationTitle(gestor.rank),
            motivation_message: getMotivationMessage(gestor.rank)
          };

          // Replace all variables in template
          Object.entries(variables).forEach(([key, value]) => {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
            subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
          });
        } else {
          // Fallback to default template
          html = generateEmailHTML(gestor, teamAvg, topPerformer, totalGestores, monthName);
          subject = `📊 Tu Reporte de Rendimiento - ${monthName}`;
        }

        const { error } = await resend.emails.send({
          from: 'Sistema de Gestión <onboarding@resend.dev>',
          to: [gestor.gestor_email],
          subject,
          html,
        });

        if (error) {
          console.error(`Error sending email to ${gestor.gestor_email}:`, error);
          return { success: false, email: gestor.gestor_email, error };
        }

        console.log(`✅ Email sent to ${gestor.gestor_email} (Rank #${gestor.rank})`);
        return { success: true, email: gestor.gestor_email };
      } catch (error) {
        console.error(`Failed to send email to ${gestor.gestor_email}:`, error);
        return { success: false, email: gestor.gestor_email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Reports sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({
        message: "Monthly reports sent",
        successful,
        failed,
        total: totalGestores,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-monthly-reports function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
