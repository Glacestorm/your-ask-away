import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DailyStats {
  date: string;
  newVisits: number;
  newVisitSheets: number;
  newCompanies: number;
  goalsCompleted: number;
  visitsByResult: Record<string, number>;
  visitsByGestor: Array<{ name: string; count: number }>;
  upcomingReminders: number;
}

async function generateDailyStats(supabase: any, targetDate: string): Promise<DailyStats> {
  // Visits created yesterday
  const { count: newVisits } = await supabase
    .from("visits")
    .select("*", { count: "exact", head: true })
    .eq("visit_date", targetDate);

  // Visit sheets created yesterday
  const { count: newVisitSheets } = await supabase
    .from("visit_sheets")
    .select("*", { count: "exact", head: true })
    .eq("fecha", targetDate);

  // New companies
  const { count: newCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${targetDate}T00:00:00`)
    .lt("created_at", `${targetDate}T23:59:59`);

  // Visits by result
  const { data: visitResults } = await supabase
    .from("visits")
    .select("result")
    .eq("visit_date", targetDate);

  const visitsByResult: Record<string, number> = {};
  (visitResults || []).forEach((v: any) => {
    const result = v.result || "pendiente";
    visitsByResult[result] = (visitsByResult[result] || 0) + 1;
  });

  // Visits by gestor
  const { data: gestorVisits } = await supabase
    .from("visits")
    .select(`
      gestor_id,
      profiles:gestor_id (full_name)
    `)
    .eq("visit_date", targetDate);

  const gestorCounts: Record<string, { name: string; count: number }> = {};
  (gestorVisits || []).forEach((v: any) => {
    if (v.gestor_id) {
      if (!gestorCounts[v.gestor_id]) {
        gestorCounts[v.gestor_id] = { 
          name: v.profiles?.full_name || "Sin nombre", 
          count: 0 
        };
      }
      gestorCounts[v.gestor_id].count++;
    }
  });

  const visitsByGestor = Object.values(gestorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Upcoming reminders (next 3 days)
  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);

  const { count: upcomingReminders } = await supabase
    .from("visit_sheets")
    .select("*", { count: "exact", head: true })
    .or(`proxima_cita.gte.${today.toISOString().split('T')[0]},proxima_llamada.gte.${today.toISOString().split('T')[0]}`)
    .or(`proxima_cita.lte.${threeDaysLater.toISOString().split('T')[0]},proxima_llamada.lte.${threeDaysLater.toISOString().split('T')[0]}`);

  // Goals completed yesterday
  const { count: goalsCompleted } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .lte("period_end", targetDate)
    .gte("period_end", targetDate);

  return {
    date: targetDate,
    newVisits: newVisits || 0,
    newVisitSheets: newVisitSheets || 0,
    newCompanies: newCompanies || 0,
    goalsCompleted: goalsCompleted || 0,
    visitsByResult,
    visitsByGestor,
    upcomingReminders: upcomingReminders || 0,
  };
}

function generateDailyEmailHTML(stats: DailyStats, reportDate: string): string {
  const resultLabels: Record<string, string> = {
    exitosa: "✅ Exitosas",
    pendiente: "⏳ Pendientes",
    reprogramada: "📅 Reprogramadas",
    fallida: "❌ Fallidas",
  };

  const resultRows = Object.entries(stats.visitsByResult)
    .map(([result, count]) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${resultLabels[result] || result}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${count}</td>
      </tr>
    `).join("");

  const gestorRows = stats.visitsByGestor
    .map((g, i) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${i + 1}. ${g.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${g.count}</td>
      </tr>
    `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resumen Diario de Actividad</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 25px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">📋 Resumen Diario</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${reportDate}</p>
        </div>

        <!-- Quick Stats -->
        <div style="padding: 25px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 25px;">
            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${stats.newVisits}</div>
              <div style="color: #6b7280; font-size: 12px;">Visitas</div>
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #22c55e;">${stats.newVisitSheets}</div>
              <div style="color: #6b7280; font-size: 12px;">Fichas</div>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${stats.newCompanies}</div>
              <div style="color: #6b7280; font-size: 12px;">Nuevas Empresas</div>
            </div>
            <div style="background: #fce7f3; padding: 15px; border-radius: 8px; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #ec4899;">${stats.upcomingReminders}</div>
              <div style="color: #6b7280; font-size: 12px;">Recordatorios</div>
            </div>
          </div>

          <!-- Visits by Result -->
          ${Object.keys(stats.visitsByResult).length > 0 ? `
          <h2 style="color: #1f2937; margin: 20px 0 12px 0; font-size: 16px;">Visitas por Resultado</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tbody>
              ${resultRows}
            </tbody>
          </table>
          ` : ''}

          <!-- Top Gestores -->
          ${stats.visitsByGestor.length > 0 ? `
          <h2 style="color: #1f2937; margin: 20px 0 12px 0; font-size: 16px;">🏆 Gestores Más Activos</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${gestorRows}
            </tbody>
          </table>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 11px;">
            Informe diario automático del sistema de gestión comercial.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
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
    console.log("Starting daily KPI report generation...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().split("T")[0];

    // Get directors and admins
    const { data: directorRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["director_comercial", "director_oficina", "superadmin", "responsable_comercial"]);

    if (!directorRoles || directorRoles.length === 0) {
      console.log("No directors found");
      return new Response(JSON.stringify({ message: "No directors found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = directorRoles.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("email, full_name")
      .in("id", userIds);

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate daily stats
    const stats = await generateDailyStats(supabase, targetDate);
    const reportDate = yesterday.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = generateDailyEmailHTML(stats, reportDate);

    // Send emails
    const emailPromises = profiles.map(async (profile) => {
      try {
        await resend.emails.send({
          from: "ObelixIA <onboarding@resend.dev>",
          to: [profile.email],
          subject: `📋 Resumen Diario - ${reportDate}`,
          html: htmlContent,
        });
        return { email: profile.email, success: true };
      } catch (error) {
        console.error(`Failed to send to ${profile.email}:`, error);
        return { email: profile.email, success: false };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    // Save to history
    await supabase.from("kpi_report_history").insert({
      report_date: targetDate,
      report_type: "daily",
      stats: stats,
      html_content: htmlContent,
      recipients: profiles.map((p) => ({ email: p.email, name: p.full_name })),
      sent_count: successCount,
      total_recipients: profiles.length,
    });

    console.log(`Daily report sent to ${successCount}/${results.length} recipients`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: profiles.length,
        date: targetDate
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in daily KPI report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
