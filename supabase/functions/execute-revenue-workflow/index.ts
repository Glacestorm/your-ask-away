import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: unknown;
}

interface WorkflowAction {
  type: 'create_alert' | 'send_notification' | 'update_status' | 'create_task' | 'invoke_function';
  config: Record<string, unknown>;
}

interface Workflow {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  cooldown_minutes: number;
  last_triggered_at: string | null;
  execution_count: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      triggerType, 
      triggerData, 
      workflowId 
    } = await req.json() as {
      triggerType?: string;
      triggerData?: Record<string, unknown>;
      workflowId?: string;
    };

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch applicable workflows
    let query = supabase
      .from('revenue_workflows')
      .select('*')
      .eq('is_active', true);

    if (workflowId) {
      query = query.eq('id', workflowId);
    } else if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }

    const { data: workflows, error } = await query;
    
    if (error) throw error;
    if (!workflows || workflows.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No matching workflows found',
        executed: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const executionResults = [];

    for (const workflowData of workflows) {
      const workflow = workflowData as Workflow;
      
      // Check cooldown
      if (workflow.last_triggered_at) {
        const lastTriggered = new Date(workflow.last_triggered_at);
        const cooldownEnd = new Date(lastTriggered.getTime() + workflow.cooldown_minutes * 60000);
        if (new Date() < cooldownEnd) {
          executionResults.push({
            workflowId: workflow.id,
            workflowName: workflow.name,
            status: 'skipped',
            reason: 'cooldown_active'
          });
          continue;
        }
      }

      // Evaluate conditions
      const conditionsMet = evaluateConditions(workflow.conditions, triggerData || {});
      
      if (!conditionsMet) {
        executionResults.push({
          workflowId: workflow.id,
          workflowName: workflow.name,
          status: 'skipped',
          reason: 'conditions_not_met'
        });
        continue;
      }

      // Create execution record
      const { data: execution, error: execError } = await supabase
        .from('revenue_workflow_executions')
        .insert({
          workflow_id: workflow.id,
          triggered_by: triggerType || 'manual',
          trigger_data: triggerData,
          execution_status: 'running'
        })
        .select()
        .single();

      if (execError) {
        console.error('Error creating execution:', execError);
        continue;
      }

      // Execute actions
      const actionsResults: { action: string; result?: unknown; error?: string; success: boolean }[] = [];
      let hasError = false;

      for (const action of workflow.actions) {
        try {
          const result = await executeAction(action, triggerData || {}, supabase);
          actionsResults.push({ action: action.type, result, success: true });
        } catch (actionError: unknown) {
          const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
          actionsResults.push({ action: action.type, error: errorMessage, success: false });
          hasError = true;
        }
      }

      // Update execution record
      await supabase
        .from('revenue_workflow_executions')
        .update({
          execution_status: hasError ? 'failed' : 'completed',
          actions_executed: actionsResults,
          result: { actionsCount: actionsResults.length, hasError },
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id);

      // Update workflow last triggered
      await supabase
        .from('revenue_workflows')
        .update({
          last_triggered_at: new Date().toISOString(),
          execution_count: (workflow.execution_count || 0) + 1
        })
        .eq('id', workflow.id);

      executionResults.push({
        workflowId: workflow.id,
        workflowName: workflow.name,
        executionId: execution.id,
        status: hasError ? 'completed_with_errors' : 'completed',
        actionsExecuted: actionsResults.length
      });
    }

    return new Response(JSON.stringify({
      success: true,
      executed: executionResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in execute-revenue-workflow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function evaluateConditions(conditions: WorkflowCondition[], data: Record<string, unknown>): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(condition => {
    const fieldValue = getNestedValue(data, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > (condition.value as number);
      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < (condition.value as number);
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value as string);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      default:
        return false;
    }
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

async function executeAction(
  action: WorkflowAction, 
  data: Record<string, unknown>,
  supabase: SupabaseClient
): Promise<unknown> {
  switch (action.type) {
    case 'create_alert': {
      const alertType = (action.config.alertType as string) || 'workflow';
      const severity = (action.config.severity as string) || 'medium';
      const title = interpolateString((action.config.title as string) || '', data);
      const description = interpolateString((action.config.description as string) || '', data);
      const recommendedActions = (action.config.recommendedActions as string[]) || [];

      const { data: alert, error } = await supabase
        .from('revenue_anomaly_alerts')
        .insert({
          anomaly_type: alertType,
          severity: severity,
          confidence: 1,
          title: title,
          description: description,
          recommended_actions: recommendedActions,
          status: 'open'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { alertId: alert?.id };
    }

    case 'send_notification': {
      const userId = action.config.userId as string;
      const title = interpolateString((action.config.title as string) || '', data);
      const message = interpolateString((action.config.message as string) || '', data);
      const severity = (action.config.severity as string) || 'info';

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: title,
          message: message,
          severity: severity
        });
      
      if (error) throw error;
      return { notificationSent: true };
    }

    case 'update_status': {
      const tableName = action.config.table as string;
      const recordIdField = action.config.recordIdField as string;
      const recordId = (action.config.recordId || data[recordIdField]) as string;
      const newStatus = action.config.newStatus as string;

      const { error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', recordId);
      
      if (error) throw error;
      return { statusUpdated: true, recordId, newStatus };
    }

    case 'create_task': {
      const title = interpolateString((action.config.title as string) || '', data);
      const description = interpolateString((action.config.description as string) || '', data);
      const taskType = (action.config.taskType as string) || 'workflow';
      const priority = (action.config.priority as number) || 5;
      const entityType = action.config.entityType as string;
      const entityIdField = action.config.entityIdField as string;
      const entityId = data[entityIdField] as string;

      const { data: task, error } = await supabase
        .from('ai_task_queue')
        .insert({
          task_title: title,
          task_description: description,
          task_type: taskType,
          priority: priority,
          target_entity_type: entityType,
          target_entity_id: entityId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { taskId: task?.id };
    }

    case 'invoke_function': {
      const functionName = action.config.functionName as string;
      const configBody = action.config.body as Record<string, unknown> || {};
      const functionBody = {
        ...configBody,
        triggerData: data
      };

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: functionBody
      });

      if (error) throw error;
      return { functionResult: result };
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

function interpolateString(template: string, data: Record<string, unknown>): string {
  if (!template) return '';
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    const value = getNestedValue(data, path);
    return value != null ? String(value) : '';
  });
}
