import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  id: string;
  name: string;
  facturacion_anual: number | null;
  ingresos_creand: number | null;
  fecha_ultima_visita: string | null;
  visit_count: number;
  product_count: number;
  total_opportunity_value: number;
}

interface RFMScore {
  company_id: string;
  recency_days: number;
  recency_score: number;
  frequency_count: number;
  frequency_score: number;
  monetary_value: number;
  monetary_score: number;
  rfm_segment: string;
  segment_description: string;
  recommended_actions: string[];
}

// RFM Segment definitions based on scores
const RFM_SEGMENTS: Record<string, { name: string; description: string; actions: string[] }> = {
  '555': { name: 'Champions', description: 'Mejores clientes: compran a menudo, gastan mucho y recientemente', actions: ['Programa VIP exclusivo', 'Acceso anticipado a nuevos productos', 'Descuentos personalizados'] },
  '554': { name: 'Champions', description: 'Mejores clientes con ligera disminución en frecuencia', actions: ['Mantener engagement', 'Ofertas de fidelización'] },
  '544': { name: 'Champions', description: 'Alto valor con frecuencia moderada', actions: ['Incrementar frecuencia de visitas', 'Cross-selling'] },
  '545': { name: 'Champions', description: 'Clientes de alto valor activos', actions: ['Programa de referidos', 'Servicios premium'] },
  '454': { name: 'Loyal Customers', description: 'Clientes leales con buen comportamiento', actions: ['Upselling', 'Programa de lealtad', 'Encuestas de satisfacción'] },
  '455': { name: 'Loyal Customers', description: 'Muy frecuentes y de alto valor', actions: ['Reconocimiento especial', 'Beneficios exclusivos'] },
  '445': { name: 'Loyal Customers', description: 'Clientes consistentes', actions: ['Mantener relación', 'Cross-selling'] },
  '444': { name: 'Loyal Customers', description: 'Buenos clientes estables', actions: ['Programa de retención', 'Ofertas personalizadas'] },
  '535': { name: 'Potential Loyalists', description: 'Clientes recientes con potencial', actions: ['Programa de onboarding', 'Incentivos de frecuencia', 'Educación de productos'] },
  '534': { name: 'Potential Loyalists', description: 'Nuevos clientes prometedores', actions: ['Seguimiento proactivo', 'Ofertas de bienvenida'] },
  '435': { name: 'Potential Loyalists', description: 'Clientes en desarrollo', actions: ['Aumentar engagement', 'Programa de puntos'] },
  '525': { name: 'New Customers', description: 'Clientes muy recientes', actions: ['Onboarding intensivo', 'Primera compra especial', 'Educación sobre productos'] },
  '524': { name: 'New Customers', description: 'Nuevos con potencial', actions: ['Seguimiento temprano', 'Encuesta de necesidades'] },
  '523': { name: 'New Customers', description: 'Recién adquiridos', actions: ['Comunicación de bienvenida', 'Tour de servicios'] },
  '425': { name: 'Promising', description: 'Compradores recientes pero poco frecuentes', actions: ['Crear hábito de compra', 'Promociones de frecuencia'] },
  '424': { name: 'Promising', description: 'Potencial de desarrollo', actions: ['Incentivos de segunda compra', 'Seguimiento personalizado'] },
  '334': { name: 'Need Attention', description: 'Clientes que muestran señales de desenganche', actions: ['Campaña de reactivación', 'Encuesta de satisfacción', 'Oferta especial'] },
  '343': { name: 'Need Attention', description: 'Requieren atención inmediata', actions: ['Llamada de seguimiento', 'Descuento reactivación'] },
  '333': { name: 'Need Attention', description: 'En riesgo de pérdida', actions: ['Visita personal urgente', 'Propuesta de valor renovada'] },
  '244': { name: 'About to Sleep', description: 'Poco recientes pero antes frecuentes', actions: ['Campaña de win-back', 'Recordatorio de beneficios'] },
  '243': { name: 'About to Sleep', description: 'Disminución de actividad', actions: ['Oferta especial limitada', 'Comunicación personalizada'] },
  '234': { name: 'About to Sleep', description: 'En camino a inactividad', actions: ['Urgente: contacto personal', 'Propuesta de reactivación'] },
  '155': { name: 'At Risk', description: 'Alto valor pero inactivos hace tiempo', actions: ['Rescate VIP urgente', 'Llamada de director', 'Propuesta personalizada'] },
  '154': { name: 'At Risk', description: 'Clientes valiosos en peligro', actions: ['Plan de rescate', 'Visita presencial'] },
  '145': { name: 'At Risk', description: 'Necesitan intervención', actions: ['Oferta irresistible', 'Resolución de problemas'] },
  '255': { name: 'Cannot Lose Them', description: 'Clientes críticos que debemos retener a toda costa', actions: ['Intervención ejecutiva', 'Solución personalizada', 'Descuentos VIP'] },
  '254': { name: 'Cannot Lose Them', description: 'Máxima prioridad de retención', actions: ['Director comercial involucrado', 'Propuesta premium'] },
  '133': { name: 'Hibernating', description: 'Inactivos pero recuperables', actions: ['Campaña de reactivación masiva', 'Novedades del producto'] },
  '132': { name: 'Hibernating', description: 'Largo tiempo sin actividad', actions: ['Email marketing', 'Promoción de retorno'] },
  '122': { name: 'Hibernating', description: 'Casi perdidos', actions: ['Última oportunidad de contacto', 'Encuesta de salida'] },
  '111': { name: 'Lost', description: 'Clientes perdidos', actions: ['Archivar para campañas masivas', 'Análisis de causa de pérdida'] },
  '112': { name: 'Lost', description: 'Sin actividad prolongada', actions: ['Campañas de reactivación masivas', 'Ofertas de retorno'] },
  '121': { name: 'Lost', description: 'Prácticamente inactivos', actions: ['Evaluar coste de recuperación', 'Segmentar para futuras campañas'] },
};

function getSegmentInfo(r: number, f: number, m: number): { name: string; description: string; actions: string[] } {
  const key = `${r}${f}${m}`;
  
  // Try exact match first
  if (RFM_SEGMENTS[key]) {
    return RFM_SEGMENTS[key];
  }
  
  // Fallback logic based on score ranges
  const avgScore = (r + f + m) / 3;
  
  if (r >= 4 && f >= 4 && m >= 4) {
    return { name: 'Champions', description: 'Clientes de alto valor muy activos', actions: ['Mantener engagement', 'Programa VIP'] };
  } else if (r >= 4 && f >= 3 && m >= 3) {
    return { name: 'Loyal Customers', description: 'Clientes leales y frecuentes', actions: ['Programa de lealtad', 'Upselling'] };
  } else if (r >= 4 && f <= 2) {
    return { name: 'New Customers', description: 'Clientes nuevos por desarrollar', actions: ['Onboarding', 'Seguimiento proactivo'] };
  } else if (r >= 3 && f >= 3 && m >= 3) {
    return { name: 'Potential Loyalists', description: 'Alto potencial de conversión', actions: ['Incentivos de frecuencia', 'Cross-selling'] };
  } else if (r >= 3 && avgScore >= 3) {
    return { name: 'Promising', description: 'Clientes prometedores', actions: ['Desarrollo de relación', 'Ofertas personalizadas'] };
  } else if (r <= 2 && f >= 4 && m >= 4) {
    return { name: 'Cannot Lose Them', description: 'Clientes VIP en riesgo', actions: ['Intervención urgente', 'Rescate VIP'] };
  } else if (r <= 2 && (f >= 3 || m >= 3)) {
    return { name: 'At Risk', description: 'Clientes valiosos en peligro', actions: ['Reactivación urgente', 'Visita personal'] };
  } else if (r <= 2 && f <= 2 && m >= 3) {
    return { name: 'About to Sleep', description: 'Próximos a perderse', actions: ['Campaña de win-back', 'Oferta especial'] };
  } else if (r <= 2 && f <= 2 && m <= 2) {
    return { name: 'Lost', description: 'Clientes perdidos', actions: ['Análisis de causa', 'Campañas masivas'] };
  } else if (avgScore <= 2.5) {
    return { name: 'Hibernating', description: 'Clientes inactivos', actions: ['Reactivación', 'Email marketing'] };
  } else {
    return { name: 'Need Attention', description: 'Requieren atención', actions: ['Seguimiento', 'Evaluación de necesidades'] };
  }
}

function calculateScore(value: number, percentiles: number[]): number {
  if (value <= percentiles[0]) return 1;
  if (value <= percentiles[1]) return 2;
  if (value <= percentiles[2]) return 3;
  if (value <= percentiles[3]) return 4;
  return 5;
}

function calculateRecencyScore(days: number, maxDays: number): number {
  // For recency, lower days = higher score (more recent = better)
  if (days <= 7) return 5;
  if (days <= 30) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { gestorId, officeFilter } = await req.json().catch(() => ({}));

    console.log('Starting RFM Analysis...', { gestorId, officeFilter });

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('ml_model_executions')
      .insert({
        model_type: 'RFM',
        model_version: '1.0',
        execution_status: 'running',
        parameters: { gestorId, officeFilter }
      })
      .select()
      .single();

    if (execError) {
      console.error('Error creating execution record:', execError);
    }

    const startTime = Date.now();

    // Fetch all companies with their metrics
    let companiesQuery = supabase
      .from('companies')
      .select('id, name, facturacion_anual, ingresos_creand, fecha_ultima_visita, gestor_id, oficina');

    if (gestorId) {
      companiesQuery = companiesQuery.eq('gestor_id', gestorId);
    }
    if (officeFilter) {
      companiesQuery = companiesQuery.eq('oficina', officeFilter);
    }

    const { data: companies, error: compError } = await companiesQuery;

    if (compError) {
      throw new Error(`Error fetching companies: ${compError.message}`);
    }

    console.log(`Found ${companies?.length || 0} companies to analyze`);

    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No companies found to analyze',
        stats: { processed: 0, segments: {} }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get visit counts per company
    const { data: visitCounts } = await supabase
      .from('visits')
      .select('company_id')
      .in('company_id', companies.map(c => c.id));

    const visitCountMap: Record<string, number> = {};
    visitCounts?.forEach(v => {
      visitCountMap[v.company_id] = (visitCountMap[v.company_id] || 0) + 1;
    });

    // Get product counts per company
    const { data: productCounts } = await supabase
      .from('company_products')
      .select('company_id')
      .in('company_id', companies.map(c => c.id))
      .eq('active', true);

    const productCountMap: Record<string, number> = {};
    productCounts?.forEach(p => {
      productCountMap[p.company_id] = (productCountMap[p.company_id] || 0) + 1;
    });

    // Get opportunity values per company
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('company_id, estimated_value')
      .in('company_id', companies.map(c => c.id))
      .eq('status', 'won');

    const opportunityValueMap: Record<string, number> = {};
    opportunities?.forEach(o => {
      opportunityValueMap[o.company_id] = (opportunityValueMap[o.company_id] || 0) + (o.estimated_value || 0);
    });

    // Build company data array
    const companyData: CompanyData[] = companies.map(c => ({
      id: c.id,
      name: c.name,
      facturacion_anual: c.facturacion_anual,
      ingresos_creand: c.ingresos_creand,
      fecha_ultima_visita: c.fecha_ultima_visita,
      visit_count: visitCountMap[c.id] || 0,
      product_count: productCountMap[c.id] || 0,
      total_opportunity_value: opportunityValueMap[c.id] || 0
    }));

    // Calculate recency days
    const today = new Date();
    const recencyData = companyData.map(c => {
      if (!c.fecha_ultima_visita) return 365; // Default to 1 year if no visit
      const lastVisit = new Date(c.fecha_ultima_visita);
      return Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
    });

    // Calculate frequency (visits + products)
    const frequencyData = companyData.map(c => c.visit_count + c.product_count);

    // Calculate monetary value
    const monetaryData = companyData.map(c => 
      (c.facturacion_anual || 0) + (c.ingresos_creand || 0) + (c.total_opportunity_value || 0)
    );

    // Calculate percentiles for frequency and monetary
    const sortedFrequency = [...frequencyData].sort((a, b) => a - b);
    const sortedMonetary = [...monetaryData].sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p)] || 0;

    const frequencyPercentiles = [
      getPercentile(sortedFrequency, 0.2),
      getPercentile(sortedFrequency, 0.4),
      getPercentile(sortedFrequency, 0.6),
      getPercentile(sortedFrequency, 0.8)
    ];

    const monetaryPercentiles = [
      getPercentile(sortedMonetary, 0.2),
      getPercentile(sortedMonetary, 0.4),
      getPercentile(sortedMonetary, 0.6),
      getPercentile(sortedMonetary, 0.8)
    ];

    // Calculate RFM scores for each company
    const rfmScores: RFMScore[] = companyData.map((company, index) => {
      const recencyDays = recencyData[index];
      const frequency = frequencyData[index];
      const monetary = monetaryData[index];

      const recencyScore = calculateRecencyScore(recencyDays, 365);
      const frequencyScore = calculateScore(frequency, frequencyPercentiles);
      const monetaryScore = calculateScore(monetary, monetaryPercentiles);

      const segmentInfo = getSegmentInfo(recencyScore, frequencyScore, monetaryScore);

      return {
        company_id: company.id,
        recency_days: recencyDays,
        recency_score: recencyScore,
        frequency_count: frequency,
        frequency_score: frequencyScore,
        monetary_value: monetary,
        monetary_score: monetaryScore,
        rfm_segment: segmentInfo.name,
        segment_description: segmentInfo.description,
        recommended_actions: segmentInfo.actions
      };
    });

    // Upsert RFM scores to database
    const { error: upsertError } = await supabase
      .from('customer_rfm_scores')
      .upsert(
        rfmScores.map(score => ({
          ...score,
          calculated_at: new Date().toISOString()
        })),
        { onConflict: 'company_id' }
      );

    if (upsertError) {
      console.error('Error upserting RFM scores:', upsertError);
      throw new Error(`Error saving RFM scores: ${upsertError.message}`);
    }

    // Calculate segment distribution
    const segmentCounts: Record<string, number> = {};
    rfmScores.forEach(score => {
      segmentCounts[score.rfm_segment] = (segmentCounts[score.rfm_segment] || 0) + 1;
    });

    const executionTime = Date.now() - startTime;

    // Update execution record
    if (execution) {
      await supabase
        .from('ml_model_executions')
        .update({
          execution_status: 'completed',
          companies_processed: companies.length,
          segments_created: Object.keys(segmentCounts).length,
          execution_time_ms: executionTime,
          results_summary: {
            total_companies: companies.length,
            segment_distribution: segmentCounts,
            percentiles: {
              frequency: frequencyPercentiles,
              monetary: monetaryPercentiles
            }
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id);
    }

    console.log('RFM Analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      stats: {
        processed: companies.length,
        segments: segmentCounts,
        executionTimeMs: executionTime
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('RFM Analysis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
