import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  from_state: string | null;
  to_state: string | null;
  occurred_at: string;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
}

interface ProcessVariant {
  path: string[];
  count: number;
  avg_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
}

interface Bottleneck {
  from_state: string;
  to_state: string;
  avg_duration_ms: number;
  median_duration_ms: number;
  p95_duration_ms: number;
  count: number;
  is_bottleneck: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      entity_type, 
      start_date, 
      end_date, 
      analysis_type = 'full',
      tenant_id 
    } = await req.json();

    console.log('Process Mining Analysis:', { entity_type, analysis_type, start_date, end_date });

    if (!entity_type) {
      return new Response(
        JSON.stringify({ error: 'entity_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch events
    let query = supabase
      .from('process_events')
      .select('*')
      .eq('entity_type', entity_type)
      .order('occurred_at', { ascending: true });

    if (start_date) {
      query = query.gte('occurred_at', start_date);
    }
    if (end_date) {
      query = query.lte('occurred_at', end_date);
    }
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No events found',
          analysis: {
            total_events: 0,
            total_cases: 0,
            variants: [],
            bottlenecks: [],
            sla_compliance: { on_track: 0, at_risk: 0, breached: 0 }
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group events by entity (case)
    const caseMap = new Map<string, ProcessEvent[]>();
    for (const event of events) {
      const caseEvents = caseMap.get(event.entity_id) || [];
      caseEvents.push(event);
      caseMap.set(event.entity_id, caseEvents);
    }

    // Analyze variants
    const variants = analyzeVariants(caseMap);

    // Detect bottlenecks
    const bottlenecks = detectBottlenecks(events);

    // Calculate transition matrix
    const transitionMatrix = calculateTransitionMatrix(events);

    // Calculate conformance (compare to expected process)
    const { data: definitions } = await supabase
      .from('bpmn_process_definitions')
      .select('*')
      .eq('entity_type', entity_type)
      .eq('is_active', true)
      .limit(1);

    let conformance = null;
    if (definitions && definitions.length > 0) {
      conformance = calculateConformance(caseMap, definitions[0]);
    }

    // SLA compliance
    const { data: instances } = await supabase
      .from('bpmn_process_instances')
      .select('sla_status')
      .eq('entity_type', entity_type);

    const slaCompliance = {
      on_track: instances?.filter(i => i.sla_status === 'on_track').length || 0,
      at_risk: instances?.filter(i => i.sla_status === 'at_risk').length || 0,
      breached: instances?.filter(i => i.sla_status === 'breached').length || 0
    };

    // Calculate time stats
    const timeStats = calculateTimeStats(caseMap);

    // Store snapshot
    await supabase
      .from('process_mining_snapshots')
      .insert({
        entity_type,
        analysis_date: new Date().toISOString(),
        total_events: events.length,
        total_cases: caseMap.size,
        variants_count: variants.length,
        top_variants: variants.slice(0, 10),
        bottleneck_analysis: bottlenecks,
        conformance_score: conformance?.score || null,
        avg_cycle_time_hours: timeStats.avgCycleTimeHours,
        sla_compliance: slaCompliance
      });

    const analysis = {
      total_events: events.length,
      total_cases: caseMap.size,
      variants,
      bottlenecks,
      transition_matrix: transitionMatrix,
      conformance,
      sla_compliance: slaCompliance,
      time_stats: timeStats
    };

    console.log('Analysis complete:', {
      events: events.length,
      cases: caseMap.size,
      variants: variants.length,
      bottlenecks: bottlenecks.filter(b => b.is_bottleneck).length
    });

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in process-mining-analyze:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeVariants(caseMap: Map<string, ProcessEvent[]>): ProcessVariant[] {
  const variantMap = new Map<string, { count: number; durations: number[] }>();

  for (const [_, events] of caseMap) {
    // Create path string from actions/states
    const path = events.map(e => e.to_state || e.action).filter(Boolean);
    const pathKey = path.join(' -> ');

    // Calculate case duration
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const duration = new Date(lastEvent.occurred_at).getTime() - new Date(firstEvent.occurred_at).getTime();

    const existing = variantMap.get(pathKey) || { count: 0, durations: [] };
    existing.count++;
    existing.durations.push(duration);
    variantMap.set(pathKey, existing);
  }

  // Convert to array and calculate stats
  const variants: ProcessVariant[] = [];
  for (const [pathKey, data] of variantMap) {
    const path = pathKey.split(' -> ');
    const durations = data.durations;
    
    variants.push({
      path,
      count: data.count,
      avg_duration_ms: durations.reduce((a, b) => a + b, 0) / durations.length,
      min_duration_ms: Math.min(...durations),
      max_duration_ms: Math.max(...durations)
    });
  }

  // Sort by frequency
  return variants.sort((a, b) => b.count - a.count);
}

function detectBottlenecks(events: ProcessEvent[]): Bottleneck[] {
  // Group by transition
  const transitionMap = new Map<string, number[]>();

  for (const event of events) {
    if (event.from_state && event.to_state && event.duration_ms) {
      const key = `${event.from_state} -> ${event.to_state}`;
      const durations = transitionMap.get(key) || [];
      durations.push(event.duration_ms);
      transitionMap.set(key, durations);
    }
  }

  // Calculate stats for each transition
  const bottlenecks: Bottleneck[] = [];
  const allAvgDurations: number[] = [];

  for (const [key, durations] of transitionMap) {
    const [from_state, to_state] = key.split(' -> ');
    const sorted = [...durations].sort((a, b) => a - b);
    
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    allAvgDurations.push(avg);

    bottlenecks.push({
      from_state,
      to_state,
      avg_duration_ms: avg,
      median_duration_ms: sorted[Math.floor(sorted.length / 2)],
      p95_duration_ms: sorted[Math.floor(sorted.length * 0.95)],
      count: durations.length,
      is_bottleneck: false // Will be set below
    });
  }

  // Identify bottlenecks (transitions with avg duration > 1.5x overall average)
  if (allAvgDurations.length > 0) {
    const overallAvg = allAvgDurations.reduce((a, b) => a + b, 0) / allAvgDurations.length;
    for (const b of bottlenecks) {
      b.is_bottleneck = b.avg_duration_ms > overallAvg * 1.5;
    }
  }

  return bottlenecks.sort((a, b) => b.avg_duration_ms - a.avg_duration_ms);
}

function calculateTransitionMatrix(events: ProcessEvent[]): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};

  for (const event of events) {
    const from = event.from_state || 'START';
    const to = event.to_state || event.action;

    if (!matrix[from]) {
      matrix[from] = {};
    }
    matrix[from][to] = (matrix[from][to] || 0) + 1;
  }

  return matrix;
}

function calculateConformance(
  caseMap: Map<string, ProcessEvent[]>, 
  definition: any
): { score: number; deviations: string[] } {
  const nodes = definition.nodes || [];
  const edges = definition.edges || [];
  
  // Build expected transitions
  const expectedTransitions = new Set<string>();
  for (const edge of edges) {
    const sourceNode = nodes.find((n: any) => n.id === edge.source);
    const targetNode = nodes.find((n: any) => n.id === edge.target);
    if (sourceNode && targetNode) {
      expectedTransitions.add(`${sourceNode.label} -> ${targetNode.label}`);
    }
  }

  let conformingCases = 0;
  const deviations: string[] = [];

  for (const [caseId, events] of caseMap) {
    let isConforming = true;
    
    for (let i = 0; i < events.length - 1; i++) {
      const from = events[i].to_state || events[i].action;
      const to = events[i + 1].to_state || events[i + 1].action;
      const transition = `${from} -> ${to}`;
      
      if (!expectedTransitions.has(transition)) {
        isConforming = false;
        if (!deviations.includes(transition)) {
          deviations.push(transition);
        }
      }
    }
    
    if (isConforming) {
      conformingCases++;
    }
  }

  const score = caseMap.size > 0 ? (conformingCases / caseMap.size) * 100 : 0;

  return { score, deviations };
}

function calculateTimeStats(caseMap: Map<string, ProcessEvent[]>): {
  avgCycleTimeHours: number;
  minCycleTimeHours: number;
  maxCycleTimeHours: number;
  completedCases: number;
} {
  const cycleTimes: number[] = [];

  for (const [_, events] of caseMap) {
    if (events.length >= 2) {
      const first = new Date(events[0].occurred_at).getTime();
      const last = new Date(events[events.length - 1].occurred_at).getTime();
      const cycleTimeHours = (last - first) / (1000 * 60 * 60);
      cycleTimes.push(cycleTimeHours);
    }
  }

  if (cycleTimes.length === 0) {
    return {
      avgCycleTimeHours: 0,
      minCycleTimeHours: 0,
      maxCycleTimeHours: 0,
      completedCases: 0
    };
  }

  return {
    avgCycleTimeHours: cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length,
    minCycleTimeHours: Math.min(...cycleTimes),
    maxCycleTimeHours: Math.max(...cycleTimes),
    completedCases: cycleTimes.length
  };
}
