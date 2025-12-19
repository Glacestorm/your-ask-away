import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BPMNNode {
  id: string;
  type: 'start' | 'end' | 'task' | 'gateway_xor' | 'gateway_and' | 'gateway_or';
  label: string;
  position: { x: number; y: number };
  config?: {
    sla_hours?: number;
    auto_advance?: boolean;
    escalation_hours?: number;
    escalation_to?: string[];
    conditions?: Record<string, unknown>;
  };
}

interface BPMNEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

interface ProcessDefinition {
  id: string;
  nodes: BPMNNode[];
  edges: BPMNEdge[];
  sla_config: Record<string, unknown>;
  escalation_rules: Array<{
    node_id: string;
    hours: number;
    escalate_to: string[];
  }>;
}

interface ProcessInstance {
  id: string;
  process_definition_id: string;
  entity_type: string;
  entity_id: string;
  current_node_id: string;
  status: string;
  variables: Record<string, unknown>;
  started_at: string;
  expected_completion: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event_id, event, action } = await req.json();

    console.log('BPMN Engine processing:', { event_id, action });

    // Handle different actions
    if (action === 'start_process') {
      return await handleStartProcess(supabase, event);
    } else if (action === 'advance_process') {
      return await handleAdvanceProcess(supabase, event);
    } else if (action === 'check_sla') {
      return await handleCheckSLA(supabase);
    } else if (event) {
      // Process incoming event
      return await handleProcessEvent(supabase, event);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'No action taken' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in bpmn-engine:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleProcessEvent(supabase: any, event: any) {
  console.log('Processing event for BPMN:', event);

  // Find active process instances for this entity
  const { data: instances } = await supabase
    .from('bpmn_process_instances')
    .select(`
      *,
      process_definition:bpmn_process_definitions(*)
    `)
    .eq('entity_type', event.entity_type)
    .eq('entity_id', event.entity_id)
    .eq('status', 'running');

  if (!instances || instances.length === 0) {
    // Check if we should auto-start a process
    const { data: definitions } = await supabase
      .from('bpmn_process_definitions')
      .select('*')
      .eq('entity_type', event.entity_type)
      .eq('is_active', true);

    if (definitions && definitions.length > 0) {
      // Auto-start first matching process on 'created' event
      if (event.action === 'created') {
        for (const def of definitions) {
          await startProcessInstance(supabase, def, event.entity_type, event.entity_id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event processed, no active instances' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Process each active instance
  for (const instance of instances) {
    await evaluateTransitions(supabase, instance, event);
  }

  return new Response(
    JSON.stringify({ success: true, instances_processed: instances.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleStartProcess(supabase: any, params: any) {
  const { definition_id, entity_type, entity_id, variables } = params;

  const { data: definition } = await supabase
    .from('bpmn_process_definitions')
    .select('*')
    .eq('id', definition_id)
    .single();

  if (!definition) {
    return new Response(
      JSON.stringify({ error: 'Process definition not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const instance = await startProcessInstance(supabase, definition, entity_type, entity_id, variables);

  return new Response(
    JSON.stringify({ success: true, instance }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function startProcessInstance(
  supabase: any, 
  definition: ProcessDefinition, 
  entityType: string, 
  entityId: string,
  variables: Record<string, unknown> = {}
) {
  const nodes = definition.nodes as BPMNNode[];
  const startNode = nodes.find(n => n.type === 'start');
  
  if (!startNode) {
    console.error('No start node found in process definition');
    return null;
  }

  // Find first task after start
  const edges = definition.edges as BPMNEdge[];
  const firstEdge = edges.find(e => e.source === startNode.id);
  const firstNodeId = firstEdge?.target || startNode.id;

  // Calculate expected completion based on SLA
  let expectedCompletion: string | null = null;
  const slaConfig = definition.sla_config as Record<string, number>;
  if (slaConfig && Object.keys(slaConfig).length > 0) {
    const totalHours = Object.values(slaConfig).reduce((sum, hours) => sum + (hours || 0), 0);
    if (totalHours > 0) {
      expectedCompletion = new Date(Date.now() + totalHours * 60 * 60 * 1000).toISOString();
    }
  }

  const { data: instance, error } = await supabase
    .from('bpmn_process_instances')
    .insert({
      process_definition_id: definition.id,
      entity_type: entityType,
      entity_id: entityId,
      current_node_id: firstNodeId,
      status: 'running',
      variables,
      expected_completion: expectedCompletion,
      history: [{
        node_id: startNode.id,
        entered_at: new Date().toISOString(),
        action: 'process_started'
      }]
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating process instance:', error);
    return null;
  }

  console.log('Process instance started:', instance.id);
  return instance;
}

async function evaluateTransitions(supabase: any, instance: any, event: any) {
  const definition = instance.process_definition;
  const nodes = definition.nodes as BPMNNode[];
  const edges = definition.edges as BPMNEdge[];
  
  const currentNode = nodes.find(n => n.id === instance.current_node_id);
  if (!currentNode) {
    console.error('Current node not found:', instance.current_node_id);
    return;
  }

  // Check if event triggers a transition
  const outgoingEdges = edges.filter(e => e.source === currentNode.id);
  
  for (const edge of outgoingEdges) {
    const shouldTransition = evaluateEdgeCondition(edge, event, instance.variables);
    
    if (shouldTransition) {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!targetNode) continue;

      // Update instance
      const history = [...(instance.history || []), {
        node_id: currentNode.id,
        exited_at: new Date().toISOString(),
        trigger_event: event.action
      }, {
        node_id: targetNode.id,
        entered_at: new Date().toISOString()
      }];

      const updateData: Record<string, unknown> = {
        current_node_id: targetNode.id,
        previous_node_id: currentNode.id,
        history,
        updated_at: new Date().toISOString()
      };

      // Check if this is an end node
      if (targetNode.type === 'end') {
        updateData.status = 'completed';
        updateData.actual_completion = new Date().toISOString();
      }

      await supabase
        .from('bpmn_process_instances')
        .update(updateData)
        .eq('id', instance.id);

      console.log(`Transitioned from ${currentNode.id} to ${targetNode.id}`);

      // Check SLA for new node
      if (targetNode.config?.sla_hours) {
        await checkNodeSLA(supabase, instance.id, targetNode);
      }

      break; // Only one transition per event
    }
  }
}

function evaluateEdgeCondition(edge: BPMNEdge, event: any, variables: Record<string, unknown>): boolean {
  // If no condition, check if event action matches edge label
  if (!edge.condition) {
    if (edge.label) {
      return event.action === edge.label || event.to_state === edge.label;
    }
    return true; // No condition = always transition
  }

  // Simple condition evaluation
  try {
    // Replace variables in condition
    let condition = edge.condition;
    for (const [key, value] of Object.entries(variables)) {
      condition = condition.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value));
    }
    
    // Replace event data
    condition = condition.replace(/\$\{event\.action\}/g, event.action || '');
    condition = condition.replace(/\$\{event\.to_state\}/g, event.to_state || '');
    
    // Evaluate simple conditions
    if (condition.includes('==')) {
      const [left, right] = condition.split('==').map(s => s.trim().replace(/['"]/g, ''));
      return left === right;
    }
    
    return false;
  } catch (e) {
    console.error('Error evaluating condition:', e);
    return false;
  }
}

async function checkNodeSLA(supabase: any, instanceId: string, node: BPMNNode) {
  if (!node.config?.sla_hours) return;

  const slaDeadline = new Date(Date.now() + node.config.sla_hours * 60 * 60 * 1000);
  
  // Schedule SLA check (in production, use a proper scheduler)
  console.log(`SLA check scheduled for node ${node.id} at ${slaDeadline.toISOString()}`);
}

async function handleAdvanceProcess(supabase: any, params: any) {
  const { instance_id, target_node_id, variables } = params;

  const { data: instance } = await supabase
    .from('bpmn_process_instances')
    .select(`
      *,
      process_definition:bpmn_process_definitions(*)
    `)
    .eq('id', instance_id)
    .single();

  if (!instance) {
    return new Response(
      JSON.stringify({ error: 'Process instance not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const nodes = instance.process_definition.nodes as BPMNNode[];
  const targetNode = nodes.find(n => n.id === target_node_id);

  if (!targetNode) {
    return new Response(
      JSON.stringify({ error: 'Target node not found' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const history = [...(instance.history || []), {
    node_id: instance.current_node_id,
    exited_at: new Date().toISOString(),
    action: 'manual_advance'
  }, {
    node_id: targetNode.id,
    entered_at: new Date().toISOString()
  }];

  const updateData: Record<string, unknown> = {
    current_node_id: targetNode.id,
    previous_node_id: instance.current_node_id,
    history,
    variables: { ...instance.variables, ...variables },
    updated_at: new Date().toISOString()
  };

  if (targetNode.type === 'end') {
    updateData.status = 'completed';
    updateData.actual_completion = new Date().toISOString();
  }

  const { data: updated, error } = await supabase
    .from('bpmn_process_instances')
    .update(updateData)
    .eq('id', instance_id)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, instance: updated }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCheckSLA(supabase: any) {
  console.log('Checking SLA violations...');

  // Find running instances with expected completion in the past
  const { data: atRiskInstances } = await supabase
    .from('bpmn_process_instances')
    .select(`
      *,
      process_definition:bpmn_process_definitions(*)
    `)
    .eq('status', 'running')
    .lt('expected_completion', new Date().toISOString());

  if (!atRiskInstances || atRiskInstances.length === 0) {
    return new Response(
      JSON.stringify({ success: true, violations: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let violationCount = 0;

  for (const instance of atRiskInstances) {
    // Update SLA status
    await supabase
      .from('bpmn_process_instances')
      .update({ sla_status: 'breached' })
      .eq('id', instance.id);

    // Create violation record
    const expectedTime = new Date(instance.expected_completion).getTime();
    const actualTime = Date.now();
    const overageMs = actualTime - expectedTime;

    await supabase
      .from('process_sla_violations')
      .insert({
        instance_id: instance.id,
        node_id: instance.current_node_id,
        violation_type: 'time_exceeded',
        expected_value: `${Math.floor((actualTime - new Date(instance.started_at).getTime()) / 3600000)} hours`,
        actual_value: `${Math.floor(overageMs / 3600000)} hours overage`
      });

    violationCount++;

    // Check escalation rules
    const rules = instance.process_definition.escalation_rules || [];
    for (const rule of rules) {
      if (rule.node_id === instance.current_node_id || rule.node_id === '*') {
        console.log(`Escalating to:`, rule.escalate_to);
        // In production, send notifications here
      }
    }
  }

  console.log(`Found ${violationCount} SLA violations`);

  return new Response(
    JSON.stringify({ success: true, violations: violationCount }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
