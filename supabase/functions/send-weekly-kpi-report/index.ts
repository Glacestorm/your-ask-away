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

interface WeeklyEvolution {
  week: string;
  visits: number;
  visitSheets: number;
  newClients: number;
  products: number;
}

interface OfficeComparison {
  office: string;
  visits: number;
  visitSheets: number;
  products: number;
  avgProgress: number;
  gestorCount: number;
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
  weeklyEvolution: WeeklyEvolution[];
  officeComparison: OfficeComparison[];
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

async function getWeeklyEvolution(supabase: any): Promise<WeeklyEvolution[]> {
  const weeks: WeeklyEvolution[] = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 7);
    
    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];
    
    const [visitsResult, sheetsResult, clientsResult, productsResult] = await Promise.all([
      supabase.from("visits").select("*", { count: "exact", head: true })
        .gte("visit_date", startStr).lte("visit_date", endStr),
      supabase.from("visit_sheets").select("*", { count: "exact", head: true })
        .gte("fecha", startStr).lte("fecha", endStr),
      supabase.from("companies").select("*", { count: "exact", head: true })
        .gte("created_at", startStr).lte("created_at", endStr),
      supabase.from("company_products").select("*", { count: "exact", head: true })
        .gte("created_at", startStr).lte("created_at", endStr)
    ]);
    
    weeks.push({
      week: `Sem ${6 - i}`,
      visits: visitsResult.count || 0,
      visitSheets: sheetsResult.count || 0,
      newClients: clientsResult.count || 0,
      products: productsResult.count || 0
    });
  }
  
  return weeks;
}

async function getOfficeComparison(supabase: any): Promise<OfficeComparison[]> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, oficina")
    .not("oficina", "is", null);
  
  if (!profiles || profiles.length === 0) return [];
  
  const officeMap: Record<string, { gestorIds: string[] }> = {};
  profiles.forEach((p: any) => {
    if (!officeMap[p.oficina]) {
      officeMap[p.oficina] = { gestorIds: [] };
    }
    officeMap[p.oficina].gestorIds.push(p.id);
  });
  
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = today.toISOString().split("T")[0];
  
  const comparisons: OfficeComparison[] = [];
  
  for (const [office, data] of Object.entries(officeMap)) {
    const gestorIds = data.gestorIds;
    
    const [visitsResult, sheetsResult, productsResult] = await Promise.all([
      supabase.from("visits").select("*", { count: "exact", head: true })
        .in("gestor_id", gestorIds)
        .gte("visit_date", monthStart).lte("visit_date", monthEnd),
      supabase.from("visit_sheets").select("*", { count: "exact", head: true })
        .in("gestor_id", gestorIds)
        .gte("fecha", monthStart).lte("fecha", monthEnd),
      supabase.from("company_products").select("company_id, companies!inner(gestor_id)", { count: "exact", head: true })
        .in("companies.gestor_id", gestorIds)
        .gte("created_at", monthStart).lte("created_at", monthEnd)
    ]);
    
    // Calculate average goal progress for this office
    const { data: goals } = await supabase
      .from("goals")
      .select("*, profiles:assigned_to(oficina)")
      .in("assigned_to", gestorIds)
      .lte("period_start", monthEnd)
      .gte("period_end", monthStart);
    
    let avgProgress = 0;
    if (goals && goals.length > 0) {
      const progresses = await Promise.all(
        goals.map((g: Goal) => calculateGoalProgress(supabase, g))
      );
      avgProgress = progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
    }
    
    comparisons.push({
      office,
      visits: visitsResult.count || 0,
      visitSheets: sheetsResult.count || 0,
      products: productsResult.count || 0,
      avgProgress,
      gestorCount: gestorIds.length
    });
  }
  
  return comparisons.sort((a, b) => b.avgProgress - a.avgProgress);
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

  // Get evolution and comparison data in parallel
  const [weeklyEvolution, officeComparison] = await Promise.all([
    getWeeklyEvolution(supabase),
    getOfficeComparison(supabase)
  ]);

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
      weeklyEvolution,
      officeComparison
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
    weeklyEvolution,
    officeComparison
  };
}

function generateEvolutionChart(evolution: WeeklyEvolution[]): string {
  if (evolution.length === 0) return "";
  
  const maxVisits = Math.max(...evolution.map(e => e.visits), 1);
  const maxSheets = Math.max(...evolution.map(e => e.visitSheets), 1);
  const chartWidth = 500;
  const chartHeight = 200;
  const barWidth = 30;
  const gap = 50;
  
  const visitBars = evolution.map((e, i) => {
    const x = 40 + i * (barWidth * 2 + gap);
    const height = (e.visits / maxVisits) * 150;
    return `<rect x="${x}" y="${180 - height}" width="${barWidth}" height="${height}" fill="#059669" rx="4"/>
            <text x="${x + barWidth/2}" y="${195}" text-anchor="middle" font-size="10" fill="#6b7280">${e.week}</text>
            <text x="${x + barWidth/2}" y="${175 - height}" text-anchor="middle" font-size="10" fill="#059669">${e.visits}</text>`;
  }).join("");
  
  const sheetBars = evolution.map((e, i) => {
    const x = 40 + i * (barWidth * 2 + gap) + barWidth + 5;
    const height = (e.visitSheets / maxSheets) * 150;
    return `<rect x="${x}" y="${180 - height}" width="${barWidth}" height="${height}" fill="#3b82f6" rx="4"/>
            <text x="${x + barWidth/2}" y="${175 - height}" text-anchor="middle" font-size="10" fill="#3b82f6">${e.visitSheets}</text>`;
  }).join("");
  
  return `
    <svg width="${chartWidth}" height="${chartHeight + 40}" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
      <rect width="100%" height="100%" fill="#f9fafb" rx="8"/>
      <text x="250" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">Evolución Semanal</text>
      ${visitBars}
      ${sheetBars}
      <rect x="150" y="${chartHeight + 15}" width="12" height="12" fill="#059669" rx="2"/>
      <text x="167" y="${chartHeight + 25}" font-size="11" fill="#6b7280">Visitas</text>
      <rect x="250" y="${chartHeight + 15}" width="12" height="12" fill="#3b82f6" rx="2"/>
      <text x="267" y="${chartHeight + 25}" font-size="11" fill="#6b7280">Fichas</text>
    </svg>
  `;
}

function generateOfficeComparisonChart(comparison: OfficeComparison[]): string {
  if (comparison.length === 0) return "";
  
  const maxProgress = Math.max(...comparison.map(c => c.avgProgress), 1);
  const chartHeight = comparison.length * 50 + 60;
  
  const bars = comparison.map((c, i) => {
    const y = 50 + i * 50;
    const width = (c.avgProgress / 100) * 350;
    const progressColor = c.avgProgress >= 75 ? "#059669" : c.avgProgress >= 50 ? "#f59e0b" : "#ef4444";
    
    return `
      <text x="10" y="${y + 5}" font-size="12" fill="#1f2937" font-weight="500">${c.office}</text>
      <text x="10" y="${y + 20}" font-size="10" fill="#9ca3af">${c.gestorCount} gestores</text>
      <rect x="130" y="${y - 10}" width="350" height="30" fill="#e5e7eb" rx="4"/>
      <rect x="130" y="${y - 10}" width="${width}" height="30" fill="${progressColor}" rx="4"/>
      <text x="${140 + width}" y="${y + 8}" font-size="12" fill="${width > 50 ? 'white' : '#1f2937'}" font-weight="bold">${c.avgProgress.toFixed(1)}%</text>
      <text x="500" y="${y}" font-size="10" fill="#6b7280">V: ${c.visits}</text>
      <text x="500" y="${y + 15}" font-size="10" fill="#6b7280">F: ${c.visitSheets}</text>
      <text x="550" y="${y}" font-size="10" fill="#6b7280">P: ${c.products}</text>
    `;
  }).join("");
  
  return `
    <svg width="600" height="${chartHeight}" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
      <rect width="100%" height="100%" fill="#f9fafb" rx="8"/>
      <text x="300" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#1f2937">Comparativa por Oficina</text>
      ${bars}
    </svg>
  `;
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
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <div style="display: inline-block; background: ${data.avgProgress >= 75 ? '#dcfce7' : data.avgProgress >= 50 ? '#fef3c7' : '#fef2f2'}; padding: 4px 12px; border-radius: 20px; color: ${data.avgProgress >= 75 ? '#166534' : data.avgProgress >= 50 ? '#92400e' : '#dc2626'}; font-weight: 600;">
            ${data.avgProgress.toFixed(1)}%
          </div>
        </td>
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
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; width: 24px; height: 24px; background: ${i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7c2e' : '#e5e7eb'}; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-weight: bold; margin-right: 8px;">${i + 1}</span>
          ${p.name}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${p.completed}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <div style="display: inline-block; background: ${p.avgProgress >= 75 ? '#dcfce7' : p.avgProgress >= 50 ? '#fef3c7' : '#fef2f2'}; padding: 4px 12px; border-radius: 20px; color: ${p.avgProgress >= 75 ? '#166534' : p.avgProgress >= 50 ? '#92400e' : '#dc2626'}; font-weight: 600;">
            ${p.avgProgress.toFixed(1)}%
          </div>
        </td>
      </tr>
    `).join("");

  const evolutionChart = generateEvolutionChart(stats.weeklyEvolution);
  const officeComparisonChart = generateOfficeComparisonChart(stats.officeComparison);

  // Weekly evolution summary table
  const evolutionSummary = stats.weeklyEvolution.map(e => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${e.week}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${e.visits}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${e.visitSheets}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${e.newClients}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${e.products}</td>
    </tr>
  `).join("");

  // Office comparison table
  const officeComparisonTable = stats.officeComparison.map((c, i) => `
    <tr style="background: ${i === 0 ? '#f0fdf4' : 'transparent'};">
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}${c.office}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.gestorCount}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.visits}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.visitSheets}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${c.products}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <div style="display: inline-block; background: ${c.avgProgress >= 75 ? '#dcfce7' : c.avgProgress >= 50 ? '#fef3c7' : '#fef2f2'}; padding: 4px 12px; border-radius: 20px; color: ${c.avgProgress >= 75 ? '#166534' : c.avgProgress >= 50 ? '#92400e' : '#dc2626'}; font-weight: 600;">
          ${c.avgProgress.toFixed(1)}%
        </div>
      </td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resumen Semanal de Rendimiento</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6;">
      <div style="max-width: 750px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Resumen Semanal de Rendimiento</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Informe generado el ${reportDate}</p>
        </div>

        <!-- KPI Summary -->
        <div style="padding: 30px;">
          <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">📈 Resumen General</h2>
          
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

          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 25px; border-radius: 12px; text-align: center; margin-bottom: 30px; color: white;">
            <div style="font-size: 14px; margin-bottom: 5px; opacity: 0.9;">Progreso Promedio Global</div>
            <div style="font-size: 48px; font-weight: bold;">${stats.averageProgress.toFixed(1)}%</div>
          </div>

          <!-- Weekly Evolution Chart -->
          <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">📅 Evolución Últimas 6 Semanas</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            ${evolutionChart}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Semana</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Visitas</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Fichas</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Clientes</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Productos</th>
              </tr>
            </thead>
            <tbody>
              ${evolutionSummary || '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #9ca3af;">Sin datos</td></tr>'}
            </tbody>
          </table>

          <!-- Office Comparison Chart -->
          <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">🏢 Comparativa entre Oficinas</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            ${officeComparisonChart}
          </div>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Oficina</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Gestores</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Visitas</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Fichas</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Productos</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Progreso</th>
              </tr>
            </thead>
            <tbody>
              ${officeComparisonTable || '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #9ca3af;">Sin datos</td></tr>'}
            </tbody>
          </table>

          <!-- By Metric Type -->
          <h2 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">📊 Por Tipo de Métrica</h2>
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
            Este es un correo automático generado por el sistema de gestión de Creand.
          </p>
          <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 11px;">
            Para más detalles, acceda al panel de administración.
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
    console.log("Starting weekly performance report generation...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get directors and admins
    const { data: directorRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["director_comercial", "director_oficina", "superadmin", "responsable_comercial"]);

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

    // Generate KPI stats with evolution and comparison
    console.log("Generating KPI stats with evolution charts...");
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
          subject: `📊 Resumen Semanal de Rendimiento - ${reportDate}`,
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

    console.log(`Weekly performance report sent to ${successCount}/${results.length} directors`);

    // Save report to history
    await supabase.from("kpi_report_history").insert({
      report_type: "weekly",
      report_date: new Date().toISOString().split("T")[0],
      stats: stats,
      html_content: htmlContent,
      recipients: profiles.map((p) => p.email),
      total_recipients: profiles.length,
      sent_count: successCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Weekly performance report sent to ${successCount} directors`,
        stats: {
          totalGoals: stats.totalGoals,
          averageProgress: stats.averageProgress,
          officeCount: stats.officeComparison.length,
          weeksAnalyzed: stats.weeklyEvolution.length
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating weekly performance report:", error);
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
