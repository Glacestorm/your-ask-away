import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MonthlyStats {
  month: string;
  year: number;
  totalVisits: number;
  totalVisitSheets: number;
  newCompanies: number;
  goalsCompleted: number;
  goalsTotal: number;
  avgGoalProgress: number;
  visitSuccessRate: number;
  topGestores: Array<{ name: string; visits: number; successRate: number }>;
  topOffices: Array<{ office: string; visits: number; companies: number }>;
  monthlyTrend: Array<{ week: number; visits: number; sheets: number }>;
  productStats: Array<{ name: string; count: number }>;
}

async function generateMonthlyStats(supabase: any, year: number, month: number): Promise<MonthlyStats> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const monthName = new Date(year, month - 1).toLocaleDateString('es-ES', { month: 'long' });

  // Total visits
  const { data: visits } = await supabase
    .from("visits")
    .select("*, profiles:gestor_id(full_name, oficina)")
    .gte("visit_date", startDate)
    .lte("visit_date", endDate);

  const totalVisits = visits?.length || 0;
  const successfulVisits = visits?.filter((v: any) => v.result === 'exitosa').length || 0;
  const visitSuccessRate = totalVisits > 0 ? (successfulVisits / totalVisits) * 100 : 0;

  // Total visit sheets
  const { count: totalVisitSheets } = await supabase
    .from("visit_sheets")
    .select("*", { count: "exact", head: true })
    .gte("fecha", startDate)
    .lte("fecha", endDate);

  // New companies
  const { count: newCompanies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`);

  // Goals stats
  const { data: goals } = await supabase
    .from("goals")
    .select("*, profiles:assigned_to(full_name)")
    .lte("period_start", endDate)
    .gte("period_end", startDate);

  const goalsTotal = goals?.length || 0;
  let completedCount = 0;
  let totalProgress = 0;

  for (const goal of goals || []) {
    const progress = await calculateGoalProgress(supabase, goal, startDate, endDate);
    totalProgress += progress;
    if (progress >= 100) completedCount++;
  }

  const avgGoalProgress = goalsTotal > 0 ? totalProgress / goalsTotal : 0;

  // Top gestores by visits
  const gestorStats: Record<string, { name: string; visits: number; successful: number }> = {};
  (visits || []).forEach((v: any) => {
    if (v.gestor_id) {
      if (!gestorStats[v.gestor_id]) {
        gestorStats[v.gestor_id] = { 
          name: v.profiles?.full_name || "Sin nombre", 
          visits: 0, 
          successful: 0 
        };
      }
      gestorStats[v.gestor_id].visits++;
      if (v.result === 'exitosa') gestorStats[v.gestor_id].successful++;
    }
  });

  const topGestores = Object.values(gestorStats)
    .map(g => ({ 
      name: g.name, 
      visits: g.visits, 
      successRate: g.visits > 0 ? (g.successful / g.visits) * 100 : 0 
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Top offices
  const officeStats: Record<string, { office: string; visits: number; companies: Set<string> }> = {};
  (visits || []).forEach((v: any) => {
    const office = v.profiles?.oficina || "Sin oficina";
    if (!officeStats[office]) {
      officeStats[office] = { office, visits: 0, companies: new Set() };
    }
    officeStats[office].visits++;
    if (v.company_id) officeStats[office].companies.add(v.company_id);
  });

  const topOffices = Object.values(officeStats)
    .map(o => ({ office: o.office, visits: o.visits, companies: o.companies.size }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Weekly trend
  const monthlyTrend: Array<{ week: number; visits: number; sheets: number }> = [];
  for (let week = 1; week <= 4; week++) {
    const weekStart = new Date(year, month - 1, (week - 1) * 7 + 1);
    const weekEnd = new Date(year, month - 1, week * 7);
    
    const weekVisits = (visits || []).filter((v: any) => {
      const vDate = new Date(v.visit_date);
      return vDate >= weekStart && vDate <= weekEnd;
    }).length;

    monthlyTrend.push({ week, visits: weekVisits, sheets: Math.floor(weekVisits * 0.8) });
  }

  // Product stats
  const { data: companyProducts } = await supabase
    .from("company_products")
    .select("*, products(name)")
    .gte("created_at", `${startDate}T00:00:00`)
    .lte("created_at", `${endDate}T23:59:59`);

  const productCounts: Record<string, number> = {};
  (companyProducts || []).forEach((cp: any) => {
    const name = cp.products?.name || "Desconocido";
    productCounts[name] = (productCounts[name] || 0) + 1;
  });

  const productStats = Object.entries(productCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    month: monthName,
    year,
    totalVisits,
    totalVisitSheets: totalVisitSheets || 0,
    newCompanies: newCompanies || 0,
    goalsCompleted: completedCount,
    goalsTotal,
    avgGoalProgress,
    visitSuccessRate,
    topGestores,
    topOffices,
    monthlyTrend,
    productStats,
  };
}

async function calculateGoalProgress(supabase: any, goal: any, startDate: string, endDate: string): Promise<number> {
  const gestorId = goal.assigned_to;
  if (!gestorId) return 0;

  let currentValue = 0;

  switch (goal.metric_type) {
    case "visits":
    case "total_visits": {
      const { count } = await supabase
        .from("visits")
        .select("*", { count: "exact", head: true })
        .eq("gestor_id", gestorId)
        .gte("visit_date", startDate)
        .lte("visit_date", endDate);
      currentValue = count || 0;
      break;
    }
    case "successful_visits": {
      const { count } = await supabase
        .from("visits")
        .select("*", { count: "exact", head: true })
        .eq("gestor_id", gestorId)
        .eq("result", "exitosa")
        .gte("visit_date", startDate)
        .lte("visit_date", endDate);
      currentValue = count || 0;
      break;
    }
    default:
      currentValue = 0;
  }

  return goal.target_value > 0 ? Math.min((currentValue / goal.target_value) * 100, 100) : 0;
}

function generateMonthlyEmailHTML(stats: MonthlyStats): string {
  const gestorRows = stats.topGestores
    .map((g, i) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${i + 1}. ${g.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${g.visits}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${g.successRate.toFixed(0)}%</td>
      </tr>
    `).join("");

  const officeRows = stats.topOffices
    .map((o) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${o.office}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${o.visits}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${o.companies}</td>
      </tr>
    `).join("");

  const productRows = stats.productStats
    .map((p) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${p.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.count}</td>
      </tr>
    `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resumen Mensual - ${stats.month} ${stats.year}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📈 Resumen Mensual</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; text-transform: capitalize;">${stats.month} ${stats.year}</p>
        </div>

        <!-- Main Stats -->
        <div style="padding: 30px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 30px;">
            <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #8b5cf6;">${stats.totalVisits}</div>
              <div style="color: #6b7280; font-size: 13px;">Visitas Totales</div>
            </div>
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #10b981;">${stats.visitSuccessRate.toFixed(0)}%</div>
              <div style="color: #6b7280; font-size: 13px;">Tasa de Éxito</div>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${stats.newCompanies}</div>
              <div style="color: #6b7280; font-size: 13px;">Nuevas Empresas</div>
            </div>
          </div>

          <!-- Goals Summary -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">🎯 Objetivos del Mes</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #059669;">${stats.goalsCompleted}</div>
                <div style="font-size: 12px; color: #6b7280;">Completados</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${stats.goalsTotal}</div>
                <div style="font-size: 12px; color: #6b7280;">Total</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${stats.avgGoalProgress.toFixed(0)}%</div>
                <div style="font-size: 12px; color: #6b7280;">Progreso Medio</div>
              </div>
            </div>
          </div>

          <!-- Top Gestores -->
          ${stats.topGestores.length > 0 ? `
          <h2 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 16px;">🏆 Top 5 Gestores</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Gestor</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Visitas</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Éxito</th>
              </tr>
            </thead>
            <tbody>
              ${gestorRows}
            </tbody>
          </table>
          ` : ''}

          <!-- Top Offices -->
          ${stats.topOffices.length > 0 ? `
          <h2 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 16px;">🏢 Rendimiento por Oficina</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Oficina</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Visitas</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Empresas</th>
              </tr>
            </thead>
            <tbody>
              ${officeRows}
            </tbody>
          </table>
          ` : ''}

          <!-- Products -->
          ${stats.productStats.length > 0 ? `
          <h2 style="color: #1f2937; margin: 25px 0 12px 0; font-size: 16px;">📦 Productos Más Contratados</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${productRows}
            </tbody>
          </table>
          ` : ''}
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Informe mensual automático del sistema de gestión comercial.
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
    console.log("Starting monthly KPI report generation...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get previous month
    const today = new Date();
    const targetMonth = today.getMonth() === 0 ? 12 : today.getMonth();
    const targetYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

    // Get directors and admins
    const { data: directorRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["director_comercial", "director_oficina", "superadmin"]);

    if (!directorRoles || directorRoles.length === 0) {
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

    // Generate monthly stats
    const stats = await generateMonthlyStats(supabase, targetYear, targetMonth);
    const htmlContent = generateMonthlyEmailHTML(stats);

    // Send emails
    const emailPromises = profiles.map(async (profile) => {
      try {
        await resend.emails.send({
          from: "Creand <onboarding@resend.dev>",
          to: [profile.email],
          subject: `📈 Resumen Mensual - ${stats.month} ${stats.year}`,
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
    const reportDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    await supabase.from("kpi_report_history").insert({
      report_date: reportDate,
      report_type: "monthly",
      stats: stats,
      html_content: htmlContent,
      recipients: profiles.map((p) => ({ email: p.email, name: p.full_name })),
      sent_count: successCount,
      total_recipients: profiles.length,
    });

    console.log(`Monthly report sent to ${successCount}/${results.length} recipients`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: profiles.length,
        month: stats.month,
        year: targetYear
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in monthly KPI report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
