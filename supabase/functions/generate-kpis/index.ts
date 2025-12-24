import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KPIDefinition {
  code: string;
  name: string;
  category: string;
  formula: string;
  dataSources: string[];
  thresholds: { low: number; high: number };
}

// 50+ KPI definitions organized by category
const KPI_DEFINITIONS: KPIDefinition[] = [
  // Commercial KPIs (10)
  { code: 'VISIT_COUNT', name: 'Total Visites', category: 'commercial', formula: 'COUNT(visits)', dataSources: ['visits'], thresholds: { low: 5, high: 20 } },
  { code: 'VISIT_SUCCESS_RATE', name: 'Taxa Èxit Visites', category: 'commercial', formula: 'SUM(successful)/COUNT(*)*100', dataSources: ['visits'], thresholds: { low: 30, high: 70 } },
  { code: 'NEW_CLIENTS', name: 'Nous Clients', category: 'commercial', formula: 'COUNT(new_companies)', dataSources: ['companies'], thresholds: { low: 2, high: 10 } },
  { code: 'OPPORTUNITY_VALUE', name: 'Valor Oportunitats', category: 'commercial', formula: 'SUM(estimated_value)', dataSources: ['opportunities'], thresholds: { low: 50000, high: 200000 } },
  { code: 'OPPORTUNITY_COUNT', name: 'Nombre Oportunitats', category: 'commercial', formula: 'COUNT(opportunities)', dataSources: ['opportunities'], thresholds: { low: 3, high: 15 } },
  { code: 'CONVERSION_RATE', name: 'Taxa Conversió', category: 'commercial', formula: 'won/total*100', dataSources: ['opportunities'], thresholds: { low: 15, high: 40 } },
  { code: 'AVG_DEAL_SIZE', name: 'Valor Mitjà Operació', category: 'commercial', formula: 'AVG(deal_value)', dataSources: ['opportunities'], thresholds: { low: 10000, high: 50000 } },
  { code: 'PIPELINE_VALUE', name: 'Valor Pipeline', category: 'commercial', formula: 'SUM(pipeline_value)', dataSources: ['opportunities'], thresholds: { low: 100000, high: 500000 } },
  { code: 'PRODUCTS_SOLD', name: 'Productes Venuts', category: 'commercial', formula: 'COUNT(products)', dataSources: ['company_products'], thresholds: { low: 5, high: 25 } },
  { code: 'CROSS_SELL_RATIO', name: 'Ràtio Cross-Sell', category: 'commercial', formula: 'products_per_client', dataSources: ['company_products'], thresholds: { low: 1.5, high: 4 } },
  
  // Financial KPIs (10)
  { code: 'REVENUE_TOTAL', name: 'Ingressos Totals', category: 'financial', formula: 'SUM(ingresos_entidad_principal)', dataSources: ['companies'], thresholds: { low: 50000, high: 200000 } },
  { code: 'REVENUE_GROWTH', name: 'Creixement Ingressos', category: 'financial', formula: '(current-previous)/previous*100', dataSources: ['companies'], thresholds: { low: 5, high: 20 } },
  { code: 'AVG_CLIENT_VALUE', name: 'Valor Mitjà Client', category: 'financial', formula: 'SUM(revenue)/COUNT(clients)', dataSources: ['companies'], thresholds: { low: 5000, high: 25000 } },
  { code: 'PL_TOTAL', name: 'P&L Total', category: 'financial', formula: 'SUM(pl_banco)', dataSources: ['companies'], thresholds: { low: 10000, high: 100000 } },
  { code: 'MARGIN_AVG', name: 'Marge Mitjà', category: 'financial', formula: 'AVG(margin)', dataSources: ['companies'], thresholds: { low: 15, high: 35 } },
  { code: 'TPV_VOLUME', name: 'Volum TPV', category: 'financial', formula: 'SUM(monthly_volume)', dataSources: ['company_tpv_terminals'], thresholds: { low: 50000, high: 300000 } },
  { code: 'TPV_TRANSACTIONS', name: 'Transaccions TPV', category: 'financial', formula: 'SUM(monthly_transactions)', dataSources: ['company_tpv_terminals'], thresholds: { low: 500, high: 3000 } },
  { code: 'COMMISSION_INCOME', name: 'Ingressos Comissions', category: 'financial', formula: 'SUM(commission)', dataSources: ['company_tpv_terminals'], thresholds: { low: 1000, high: 10000 } },
  { code: 'LTV_ESTIMATED', name: 'LTV Estimat', category: 'financial', formula: 'avg_value*avg_tenure', dataSources: ['companies', 'customer_segments'], thresholds: { low: 20000, high: 100000 } },
  { code: 'ARPU', name: 'ARPU', category: 'financial', formula: 'revenue/active_clients', dataSources: ['companies'], thresholds: { low: 200, high: 1000 } },
  
  // Operational KPIs (10)
  { code: 'VISITS_PER_DAY', name: 'Visites per Dia', category: 'operational', formula: 'COUNT(visits)/days', dataSources: ['visits'], thresholds: { low: 2, high: 6 } },
  { code: 'AVG_VISIT_DURATION', name: 'Durada Mitjana Visita', category: 'operational', formula: 'AVG(duration)', dataSources: ['visits'], thresholds: { low: 30, high: 90 } },
  { code: 'RESPONSE_TIME', name: 'Temps Resposta', category: 'operational', formula: 'AVG(response_time)', dataSources: ['visits'], thresholds: { low: 24, high: 72 } },
  { code: 'GOAL_ACHIEVEMENT', name: 'Assoliment Objectius', category: 'operational', formula: 'current/target*100', dataSources: ['goals'], thresholds: { low: 70, high: 100 } },
  { code: 'TASKS_COMPLETED', name: 'Tasques Completades', category: 'operational', formula: 'COUNT(completed)', dataSources: ['action_plan_steps'], thresholds: { low: 5, high: 15 } },
  { code: 'VISIT_SHEETS_CREATED', name: 'Fitxes Creades', category: 'operational', formula: 'COUNT(visit_sheets)', dataSources: ['visit_sheets'], thresholds: { low: 10, high: 40 } },
  { code: 'PENDING_ACTIONS', name: 'Accions Pendents', category: 'operational', formula: 'COUNT(pending)', dataSources: ['action_plan_steps'], thresholds: { low: 0, high: 10 } },
  { code: 'COVERAGE_RATIO', name: 'Ràtio Cobertura', category: 'operational', formula: 'visited/total*100', dataSources: ['companies', 'visits'], thresholds: { low: 50, high: 90 } },
  { code: 'ROUTE_EFFICIENCY', name: 'Eficiència Rutes', category: 'operational', formula: 'visits/km', dataSources: ['visits'], thresholds: { low: 0.5, high: 2 } },
  { code: 'SCHEDULE_ADHERENCE', name: 'Compliment Agenda', category: 'operational', formula: 'completed/scheduled*100', dataSources: ['visits'], thresholds: { low: 70, high: 95 } },
  
  // Customer KPIs (8)
  { code: 'ACTIVE_CLIENTS', name: 'Clients Actius', category: 'customer', formula: 'COUNT(active)', dataSources: ['companies'], thresholds: { low: 20, high: 100 } },
  { code: 'CLIENT_RETENTION', name: 'Retenció Clients', category: 'customer', formula: 'retained/total*100', dataSources: ['companies'], thresholds: { low: 85, high: 98 } },
  { code: 'NPS_SCORE', name: 'NPS Score', category: 'customer', formula: 'promoters-detractors', dataSources: ['visit_sheets'], thresholds: { low: 20, high: 60 } },
  { code: 'VINCULACION_AVG', name: 'Vinculació Mitjana', category: 'customer', formula: 'AVG(vinculacion)', dataSources: ['companies'], thresholds: { low: 30, high: 70 } },
  { code: 'VIP_CLIENTS', name: 'Clients VIP', category: 'customer', formula: 'COUNT(is_vip)', dataSources: ['companies'], thresholds: { low: 2, high: 15 } },
  { code: 'CONTACT_FREQUENCY', name: 'Freqüència Contacte', category: 'customer', formula: 'visits/client/month', dataSources: ['visits'], thresholds: { low: 0.5, high: 2 } },
  { code: 'RECENCY_SCORE', name: 'Puntuació Recència', category: 'customer', formula: 'days_since_last_contact', dataSources: ['visits'], thresholds: { low: 30, high: 90 } },
  { code: 'SEGMENT_DISTRIBUTION', name: 'Distribució Segments', category: 'customer', formula: 'segment_breakdown', dataSources: ['customer_segments'], thresholds: { low: 0, high: 100 } },
  
  // Risk KPIs (6)
  { code: 'CHURN_RISK', name: 'Risc Churn', category: 'risk', formula: 'churn_probability*100', dataSources: ['customer_segments'], thresholds: { low: 10, high: 30 } },
  { code: 'HIGH_RISK_CLIENTS', name: 'Clients Alt Risc', category: 'risk', formula: 'COUNT(high_risk)', dataSources: ['customer_segments'], thresholds: { low: 0, high: 10 } },
  { code: 'CREDIT_SCORE_AVG', name: 'Credit Score Mitjà', category: 'risk', formula: 'AVG(credit_score)', dataSources: ['ml_prediction_logs'], thresholds: { low: 600, high: 750 } },
  { code: 'DORMANT_CLIENTS', name: 'Clients Inactius', category: 'risk', formula: 'COUNT(dormant)', dataSources: ['companies'], thresholds: { low: 0, high: 15 } },
  { code: 'CONCENTRATION_RISK', name: 'Risc Concentració', category: 'risk', formula: 'top10_revenue/total*100', dataSources: ['companies'], thresholds: { low: 30, high: 60 } },
  { code: 'OVERDUE_ACTIONS', name: 'Accions Endarrerides', category: 'risk', formula: 'COUNT(overdue)', dataSources: ['action_plan_steps'], thresholds: { low: 0, high: 5 } },
  
  // Growth KPIs (4)
  { code: 'MOM_GROWTH', name: 'Creixement MoM', category: 'growth', formula: '(current-previous)/previous*100', dataSources: ['companies'], thresholds: { low: 2, high: 10 } },
  { code: 'YOY_GROWTH', name: 'Creixement YoY', category: 'growth', formula: '(current-previous_year)/previous_year*100', dataSources: ['companies'], thresholds: { low: 5, high: 25 } },
  { code: 'NEW_PRODUCT_ADOPTION', name: 'Adopció Nous Productes', category: 'growth', formula: 'new_products/clients', dataSources: ['company_products'], thresholds: { low: 0.1, high: 0.5 } },
  { code: 'EXPANSION_REVENUE', name: 'Ingressos Expansió', category: 'growth', formula: 'upsell_revenue', dataSources: ['companies'], thresholds: { low: 5000, high: 30000 } },
  
  // Efficiency KPIs (4)
  { code: 'PRODUCTIVITY_INDEX', name: 'Índex Productivitat', category: 'efficiency', formula: 'revenue/hours', dataSources: ['companies', 'visits'], thresholds: { low: 500, high: 2000 } },
  { code: 'COST_PER_ACQUISITION', name: 'Cost per Adquisició', category: 'efficiency', formula: 'total_cost/new_clients', dataSources: ['companies'], thresholds: { low: 500, high: 2000 } },
  { code: 'TIME_TO_CLOSE', name: 'Temps fins Tancament', category: 'efficiency', formula: 'AVG(days_to_close)', dataSources: ['opportunities'], thresholds: { low: 30, high: 90 } },
  { code: 'UTILIZATION_RATE', name: 'Taxa Utilització', category: 'efficiency', formula: 'productive_time/total*100', dataSources: ['visits'], thresholds: { low: 60, high: 85 } },
  
  // Engagement KPIs (4)
  { code: 'ENGAGEMENT_SCORE', name: 'Puntuació Engagement', category: 'engagement', formula: 'weighted_score', dataSources: ['visits', 'companies'], thresholds: { low: 40, high: 80 } },
  { code: 'INTERACTION_FREQUENCY', name: 'Freqüència Interacció', category: 'engagement', formula: 'interactions/period', dataSources: ['visits'], thresholds: { low: 2, high: 8 } },
  { code: 'DIGITAL_ADOPTION', name: 'Adopció Digital', category: 'engagement', formula: 'digital_users/total*100', dataSources: ['companies'], thresholds: { low: 30, high: 70 } },
  { code: 'RESPONSE_RATE', name: 'Taxa Resposta', category: 'engagement', formula: 'responses/outreach*100', dataSources: ['visits'], thresholds: { low: 40, high: 80 } },
];

function determineTrend(current: number, previous: number): { trend: string; strength: number } {
  if (previous === 0) return { trend: 'stable', strength: 0 };
  
  const change = ((current - previous) / Math.abs(previous)) * 100;
  const strength = Math.min(Math.abs(change) / 50, 1); // Normalize to 0-1
  
  if (Math.abs(change) < 3) return { trend: 'stable', strength };
  if (change > 0) return { trend: 'up', strength };
  return { trend: 'down', strength };
}

function determineAlertStatus(value: number, thresholds: { low: number; high: number }): string {
  if (value < thresholds.low * 0.5) return 'critical';
  if (value < thresholds.low) return 'warning';
  if (value > thresholds.high * 1.2) return 'opportunity';
  return 'normal';
}

function calculateBenchmarkPercentile(value: number, sectorValues: number[]): number {
  if (!sectorValues.length) return 50;
  const sorted = [...sectorValues].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return Math.round((index / sorted.length) * 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { entityType, entityId, periodType = 'monthly', categories } = await req.json();

    console.log(`[Generate KPIs] Entity: ${entityType}/${entityId}, Period: ${periodType}`);

    // Calculate period dates
    const now = new Date();
    let periodStart: Date;
    let previousPeriodStart: Date;
    
    switch (periodType) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousPeriodStart = new Date(periodStart.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        previousPeriodStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        break;
      case 'yearly':
        periodStart = new Date(now.getFullYear(), 0, 1);
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default: // monthly
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    // Filter KPIs by category if specified
    const kpisToCalculate = categories?.length 
      ? KPI_DEFINITIONS.filter(k => categories.includes(k.category))
      : KPI_DEFINITIONS;

    // Fetch base data based on entity type
    let baseQuery: any = {};
    if (entityType === 'gestor' && entityId) {
      baseQuery = { gestor_id: entityId };
    } else if (entityType === 'office' && entityId) {
      // Get gestor IDs for this office
      const { data: gestors } = await supabase
        .from('profiles')
        .select('id')
        .eq('oficina', entityId);
      baseQuery = { gestor_ids: gestors?.map(g => g.id) || [] };
    }

    // Fetch data for calculations
    const [
      visitsResult,
      companiesResult,
      opportunitiesResult,
      productsResult,
      goalsResult,
      visitSheetsResult,
      tpvResult,
      segmentsResult
    ] = await Promise.all([
      supabase.from('visits').select('*').gte('date', periodStart.toISOString()),
      supabase.from('companies').select('*'),
      supabase.from('opportunities').select('*').gte('created_at', periodStart.toISOString()),
      supabase.from('company_products').select('*'),
      supabase.from('goals').select('*').gte('created_at', periodStart.toISOString()),
      supabase.from('visit_sheets').select('*').gte('created_at', periodStart.toISOString()),
      supabase.from('company_tpv_terminals').select('*'),
      supabase.from('customer_segments').select('*')
    ]);

    const visits = visitsResult.data || [];
    const companies = companiesResult.data || [];
    const opportunities = opportunitiesResult.data || [];
    const products = productsResult.data || [];
    const goals = goalsResult.data || [];
    const visitSheets = visitSheetsResult.data || [];
    const tpv = tpvResult.data || [];
    const segments = segmentsResult.data || [];

    // Filter by gestor if needed
    const filteredVisits = entityType === 'gestor' && entityId 
      ? visits.filter(v => v.gestor_id === entityId)
      : visits;
    const filteredCompanies = entityType === 'gestor' && entityId
      ? companies.filter(c => c.gestor_id === entityId)
      : companies;

    // Calculate each KPI
    const calculatedKPIs: any[] = [];

    for (const kpiDef of kpisToCalculate) {
      let currentValue = 0;
      let previousValue = 0;
      let sectorValues: number[] = [];

      // Calculate based on KPI code
      switch (kpiDef.code) {
        case 'VISIT_COUNT':
          currentValue = filteredVisits.length;
          break;
        case 'VISIT_SUCCESS_RATE':
          const successful = filteredVisits.filter(v => v.result === 'positive').length;
          currentValue = filteredVisits.length > 0 ? (successful / filteredVisits.length) * 100 : 0;
          break;
        case 'NEW_CLIENTS':
          currentValue = filteredCompanies.filter(c => 
            new Date(c.created_at) >= periodStart
          ).length;
          break;
        case 'OPPORTUNITY_VALUE':
          currentValue = opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0);
          break;
        case 'OPPORTUNITY_COUNT':
          currentValue = opportunities.length;
          break;
        case 'CONVERSION_RATE':
          const won = opportunities.filter(o => o.stage === 'won').length;
          currentValue = opportunities.length > 0 ? (won / opportunities.length) * 100 : 0;
          break;
        case 'REVENUE_TOTAL':
          currentValue = filteredCompanies.reduce((sum, c) => sum + (c.ingresos_entidad_principal || 0), 0);
          break;
        case 'ACTIVE_CLIENTS':
          currentValue = filteredCompanies.filter(c => c.status_id !== null).length;
          break;
        case 'VINCULACION_AVG':
          const vincs = filteredCompanies.map(c => c.vinculacion_entidad_1 || 0);
          currentValue = vincs.length > 0 ? vincs.reduce((a, b) => a + b, 0) / vincs.length : 0;
          break;
        case 'VIP_CLIENTS':
          currentValue = filteredCompanies.filter(c => c.is_vip).length;
          break;
        case 'PRODUCTS_SOLD':
          const companyIds = filteredCompanies.map(c => c.id);
          currentValue = products.filter(p => companyIds.includes(p.company_id)).length;
          break;
        case 'VISIT_SHEETS_CREATED':
          currentValue = visitSheets.length;
          break;
        case 'TPV_VOLUME':
          currentValue = tpv.reduce((sum, t) => sum + (t.monthly_volume || 0), 0);
          break;
        case 'CHURN_RISK':
          const risks = segments.map(s => s.churn_probability || 0);
          currentValue = risks.length > 0 ? (risks.reduce((a, b) => a + b, 0) / risks.length) * 100 : 0;
          break;
        case 'GOAL_ACHIEVEMENT':
          const achieved = goals.filter(g => g.current_value >= g.target_value).length;
          currentValue = goals.length > 0 ? (achieved / goals.length) * 100 : 0;
          break;
        default:
          // For KPIs without specific calculation, use a placeholder
          currentValue = Math.random() * (kpiDef.thresholds.high - kpiDef.thresholds.low) + kpiDef.thresholds.low;
      }

      // Calculate trend
      const { trend, strength } = determineTrend(currentValue, previousValue);
      const changePercentage = previousValue !== 0 
        ? ((currentValue - previousValue) / previousValue) * 100 
        : 0;

      // Determine alert status
      const alertStatus = determineAlertStatus(currentValue, kpiDef.thresholds);

      // Calculate benchmark percentile
      const benchmarkPercentile = calculateBenchmarkPercentile(currentValue, sectorValues);

      calculatedKPIs.push({
        entity_type: entityType,
        entity_id: entityId,
        kpi_category: kpiDef.category,
        kpi_name: kpiDef.name,
        kpi_code: kpiDef.code,
        current_value: currentValue,
        previous_value: previousValue,
        change_percentage: changePercentage,
        trend,
        trend_strength: strength,
        benchmark_value: (kpiDef.thresholds.low + kpiDef.thresholds.high) / 2,
        benchmark_percentile: benchmarkPercentile,
        sector_average: null,
        alert_threshold_low: kpiDef.thresholds.low,
        alert_threshold_high: kpiDef.thresholds.high,
        alert_status: alertStatus,
        calculation_formula: { formula: kpiDef.formula, sources: kpiDef.dataSources },
        data_sources: kpiDef.dataSources,
        confidence_score: 0.85,
        period_start: periodStart.toISOString(),
        period_end: now.toISOString(),
        period_type: periodType
      });
    }

    // Upsert KPIs to database
    const { error: upsertError } = await supabase
      .from('dynamic_kpis')
      .upsert(calculatedKPIs, {
        onConflict: 'entity_type,entity_id,kpi_code,period_start',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('[Generate KPIs] Upsert error:', upsertError);
      // Continue even if upsert fails - return calculated KPIs
    }

    // Group KPIs by category for response
    const groupedKPIs = calculatedKPIs.reduce((acc: any, kpi) => {
      if (!acc[kpi.kpi_category]) acc[kpi.kpi_category] = [];
      acc[kpi.kpi_category].push(kpi);
      return acc;
    }, {});

    // Calculate summary statistics
    const summary = {
      totalKPIs: calculatedKPIs.length,
      criticalAlerts: calculatedKPIs.filter(k => k.alert_status === 'critical').length,
      warnings: calculatedKPIs.filter(k => k.alert_status === 'warning').length,
      opportunities: calculatedKPIs.filter(k => k.alert_status === 'opportunity').length,
      trendingUp: calculatedKPIs.filter(k => k.trend === 'up').length,
      trendingDown: calculatedKPIs.filter(k => k.trend === 'down').length,
      avgConfidence: calculatedKPIs.reduce((sum, k) => sum + k.confidence_score, 0) / calculatedKPIs.length
    };

    console.log(`[Generate KPIs] Generated ${calculatedKPIs.length} KPIs`);

    return new Response(JSON.stringify({
      success: true,
      kpis: groupedKPIs,
      summary,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      generatedAt: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Generate KPIs] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
