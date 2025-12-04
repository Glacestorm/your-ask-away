import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Goal {
  id: string;
  metric_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  assigned_to: string | null;
  profiles?: { full_name: string; email: string; oficina: string | null };
}

interface KPIStats {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  atRiskGoals: number;
  averageProgress: number;
  byMetricType: Record<string, { count: number; avgProgress: number }>;
  byOffice: Record<string, { count: number; avgProgress: number; completed: number }>;
  topPerformers: Array<{ name: string; avgProgress: number; completed: number }>;
}

async function calculateGoalProgress(
  supabase: any,
  goal: Goal
): Promise<number> {
  const gestorId = goal.assigned_to;
  if (!gestorId) return 0;

  const periodStart = goal.period_start;
  const periodEnd = goal.period_end;

  let currentValue = 0;

  switch (goal.metric_type) {
    case "visits":
    case "total_visits": {
      const { count } = await supabase
        .from("visits")
        .select("*", { count: "exact", head: true })
        .eq("gestor_id", gestorId)
        .gte("visit_date", periodStart)
        .lte("visit_date", periodEnd);
      currentValue = count || 0;
      break;
    }
    case "successful_visits": {
      const { count } = await supabase
        .from("visits")
        .select("*", { count: "exact", head: true })
        .eq("gestor_id", gestorId)
        .eq("result", "exitosa")
        .gte("visit_date", periodStart)
        .lte("visit_date", periodEnd);
      currentValue = count || 0;
      break;
    }
    case "new_clients": {
      const { count } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("gestor_id", gestorId)
        .gte("created_at", periodStart)
        .lte("created_at", periodEnd);
      currentValue = count || 0;
      break;
    }
    case "visit_sheets": {
      const { count } = await supabase
        .from("visit_sheets")
        .select("*", { count: "exact", head: true })
        .eq("gestor_id", gestorId)
        .gte("fecha", periodStart)
        .lte("fecha", periodEnd);
      currentValue = count || 0;
      break;
    }
    case "tpv_volume": {
      const { data: companies } = await supabase
        .from("companies")
        .select("id")
        .eq("gestor_id", gestorId);
      
      if (companies && companies.length > 0) {
        const companyIds = companies.map((c: any) => c.id);
        const { data: terminals } = await supabase
          .from("company_tpv_terminals")
          .select("monthly_volume")
          .in("company_id", companyIds)
          .eq("status", "active");
        
        currentValue = terminals?.reduce((sum: number, t: any) => sum + (t.monthly_volume || 0), 0) || 0;
      }
      break;
    }
    case "products_per_client": {
      const { data: companies } = await supabase
        .from("companies")
        .select("id")
        .eq("gestor_id", gestorId);
      
      if (companies && companies.length > 0) {
        const companyIds = companies.map((c: any) => c.id);
        const { count: productCount } = await supabase
          .from("company_products")
          .select("*", { count: "exact", head: true })
          .in("company_id", companyIds)
          .eq("active", true);
        
        currentValue = companies.length > 0 ? (productCount || 0) / companies.length : 0;
      }
      break;
    }
    case "client_facturacion": {
      const { data: companies } = await supabase
        .from("companies")
        .select("facturacion_anual")
        .eq("gestor_id", gestorId);
      
      currentValue = companies?.reduce((sum: number, c: any) => sum + (c.facturacion_anual || 0), 0) || 0;
      break;
    }
    default:
      currentValue = 0;
  }

  return goal.target_value > 0 ? Math.min((currentValue / goal.target_value) * 100, 100) : 0;
}

async function generateKPIStats(supabase: any): Promise<KPIStats> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data: goals } = await supabase
    .from("goals")
    .select(`
      *,
      profiles:assigned_to (full_name, email, oficina)
    `)
    .lte("period_start", today)
    .gte("period_end", today);

  if (!goals || goals.length === 0) {
    return {
      totalGoals: 0,
      completedGoals: 0,
      inProgressGoals: 0,
      atRiskGoals: 0,
      averageProgress: 0,
      byMetricType: {},
      byOffice: {},
      topPerformers: [],
    };
  }

  const goalsWithProgress = await Promise.all(
    goals.map(async (goal: Goal) => ({
      ...goal,
      progress: await calculateGoalProgress(supabase, goal),
    }))
  );

  const completedGoals = goalsWithProgress.filter((g) => g.progress >= 100).length;
  const atRiskGoals = goalsWithProgress.filter((g) => g.progress < 50).length;
  const inProgressGoals = goalsWithProgress.filter((g) => g.progress >= 50 && g.progress < 100).length;
  const averageProgress = goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / goalsWithProgress.length;

  // By metric type
  const byMetricType: Record<string, { count: number; avgProgress: number }> = {};
  goalsWithProgress.forEach((g) => {
    if (!byMetricType[g.metric_type]) {
      byMetricType[g.metric_type] = { count: 0, avgProgress: 0 };
    }
    byMetricType[g.metric_type].count++;
    byMetricType[g.metric_type].avgProgress += g.progress;
  });
  Object.keys(byMetricType).forEach((key) => {
    byMetricType[key].avgProgress /= byMetricType[key].count;
  });

  // By office
  const byOffice: Record<string, { count: number; avgProgress: number; completed: number }> = {};
  goalsWithProgress.forEach((g) => {
    const office = g.profiles?.oficina || "Sin oficina";
    if (!byOffice[office]) {
      byOffice[office] = { count: 0, avgProgress: 0, completed: 0 };
    }
    byOffice[office].count++;
    byOffice[office].avgProgress += g.progress;
    if (g.progress >= 100) byOffice[office].completed++;
  });
  Object.keys(byOffice).forEach((key) => {
    byOffice[key].avgProgress /= byOffice[key].count;
  });

  // Top performers
  const gestorStats: Record<string, { name: string; totalProgress: number; count: number; completed: number }> = {};
  goalsWithProgress.forEach((g) => {
    if (g.assigned_to && g.profiles) {
      if (!gestorStats[g.assigned_to]) {
        gestorStats[g.assigned_to] = { name: g.profiles.full_name || "Sin nombre", totalProgress: 0, count: 0, completed: 0 };
      }
      gestorStats[g.assigned_to].totalProgress += g.progress;
      gestorStats[g.assigned_to].count++;
      if (g.progress >= 100) gestorStats[g.assigned_to].completed++;
    }
  });

  const topPerformers = Object.values(gestorStats)
    .map((s) => ({ name: s.name, avgProgress: s.totalProgress / s.count, completed: s.completed }))
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 5);

  return {
    totalGoals: goals.length,
    completedGoals,
    inProgressGoals,
    atRiskGoals,
    averageProgress,
    byMetricType,
    byOffice,
    topPerformers,
  };
}

function generateEmailHTML(stats: KPIStats, reportDate: string): string {
  const metricLabels: Record<string, string> = {
    visits: "Visitas Totales",
    total_visits: "Visitas Totales",
    successful_visits: "Visitas Exitosas",
    new_clients: "Nuevos Clientes",
    visit_sheets: "Fichas de Visita",
    tpv_volume: "Volumen TPV",
    products_per_client: "Productos por Cliente",
    client_facturacion: "Facturación Clientes",
    conversion_rate: "Tasa de Conversión",
    follow_ups: "Seguimientos",
  };

  const metricTypeRows = Object.entries(stats.byMetricType)
    .map(([type, data]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${metricLabels[type] || type}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${data.count}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${data.avgProgress.toFixed(1)}%</td>
      </tr>
    `).join("");

  const officeRows = Object.entries(stats.byOffice)
    .map(([office, data]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${office}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${data.count}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${data.completed}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${data.avgProgress.toFixed(1)}%</td>
      </tr>
    `).join("");

  const topPerformersRows = stats.topPerformers
    .map((p, i) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${i + 1}. ${p.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.completed}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.avgProgress.toFixed(1)}%</td>
      </tr>
    `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resumen Semanal de KPIs - Objetivos</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Resumen Semanal de KPIs</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Informe generado el ${reportDate}</p>
        </div>

        <!-- KPI Summary -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Resumen General</h2>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #059669;">${stats.totalGoals}</div>
              <div style="color: #6b7280; font-size: 14px;">Objetivos Activos</div>
            </div>
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #10b981;">${stats.completedGoals}</div>
              <div style="color: #6b7280; font-size: 14px;">Completados</div>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.inProgressGoals}</div>
              <div style="color: #6b7280; font-size: 14px;">En Progreso</div>
            </div>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${stats.atRiskGoals}</div>
              <div style="color: #6b7280; font-size: 14px;">En Riesgo</div>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Progreso Promedio</div>
            <div style="font-size: 36px; font-weight: bold; color: #059669;">${stats.averageProgress.toFixed(1)}%</div>
          </div>

          <!-- By Metric Type -->
          <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">Por Tipo de Métrica</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Métrica</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Objetivos</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Progreso</th>
              </tr>
            </thead>
            <tbody>
              ${metricTypeRows || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #9ca3af;">Sin datos</td></tr>'}
            </tbody>
          </table>

          <!-- By Office -->
          <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">Por Oficina</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Oficina</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Objetivos</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Completados</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Progreso</th>
              </tr>
            </thead>
            <tbody>
              ${officeRows || '<tr><td colspan="4" style="padding: 12px; text-align: center; color: #9ca3af;">Sin datos</td></tr>'}
            </tbody>
          </table>

          <!-- Top Performers -->
          <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">🏆 Top 5 Gestores</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Gestor</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Completados</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Progreso</th>
              </tr>
            </thead>
            <tbody>
              ${topPerformersRows || '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #9ca3af;">Sin datos</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Este es un correo automático generado por el sistema de gestión de objetivos.
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

  try {
    console.log("Starting weekly KPI report generation...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get directors and admins
    const { data: directorRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["director_comercial", "director_oficina", "superadmin"]);

    if (!directorRoles || directorRoles.length === 0) {
      console.log("No directors found to send report");
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
      console.log("No director profiles found");
      return new Response(JSON.stringify({ message: "No profiles found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate KPI stats
    const stats = await generateKPIStats(supabase);
    const reportDate = new Date().toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const htmlContent = generateEmailHTML(stats, reportDate);

    // Send emails to all directors
    const emailPromises = profiles.map(async (profile) => {
      try {
        const result = await resend.emails.send({
          from: "Creand <onboarding@resend.dev>",
          to: [profile.email],
          subject: `📊 Resumen Semanal de KPIs - ${reportDate}`,
          html: htmlContent,
        });
        console.log(`Email sent to ${profile.email}:`, result);
        return { email: profile.email, success: true };
      } catch (error) {
        console.error(`Failed to send email to ${profile.email}:`, error);
        return { email: profile.email, success: false, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`Weekly KPI report sent to ${successCount}/${results.length} directors`);

    return new Response(
      JSON.stringify({
        message: "Weekly KPI report sent",
        sent: successCount,
        total: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-kpi-report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
