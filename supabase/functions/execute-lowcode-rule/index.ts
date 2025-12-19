import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  logic?: 'AND' | 'OR';
}

interface RuleAction {
  id: string;
  type: string;
  config: Record<string, any>;
  order: number;
}

interface RuleTrigger {
  type: string;
  config: Record<string, any>;
}

interface LowCodeRule {
  id: string;
  rule_key: string;
  rule_name: string;
  trigger_type: string;
  trigger_config: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  is_active: boolean;
  priority: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rule_id, trigger_data, triggered_by } = await req.json();

    console.log(`Executing rule: ${rule_id}`);
    console.log(`Trigger data:`, JSON.stringify(trigger_data));

    // Fetch the rule
    const { data: rule, error: ruleError } = await supabase
      .from('lowcode_rules')
      .select('*')
      .eq('id', rule_id)
      .eq('is_active', true)
      .single();

    if (ruleError || !rule) {
      console.error('Rule not found or inactive:', ruleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Rule not found or inactive' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const typedRule = rule as LowCodeRule;

    // Create execution record
    const { data: execution, error: execError } = await supabase
      .from('lowcode_rule_executions')
      .insert({
        rule_id: rule_id,
        triggered_by: triggered_by || null,
        trigger_data: trigger_data,
        input_data: trigger_data,
        status: 'running'
      })
      .select()
      .single();

    if (execError) {
      console.error('Failed to create execution record:', execError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create execution record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const startTime = Date.now();
    let conditionsMet = true;
    let executionError: string | null = null;
    const actionResults: Record<string, any>[] = [];

    try {
      // Evaluate conditions
      const conditions = Array.isArray(typedRule.conditions) 
        ? typedRule.conditions 
        : JSON.parse(typedRule.conditions as unknown as string);

      console.log(`Evaluating ${conditions.length} conditions`);

      if (conditions.length > 0) {
        conditionsMet = evaluateConditions(conditions, trigger_data);
        console.log(`Conditions met: ${conditionsMet}`);
      }

      if (!conditionsMet) {
        // Update execution as skipped
        await supabase
          .from('lowcode_rule_executions')
          .update({
            status: 'skipped',
            output_data: { reason: 'Conditions not met' },
            execution_time_ms: Date.now() - startTime
          })
          .eq('id', execution.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            execution_id: execution.id,
            status: 'skipped',
            reason: 'Conditions not met'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Execute actions
      const actions = Array.isArray(typedRule.actions) 
        ? typedRule.actions 
        : JSON.parse(typedRule.actions as unknown as string);

      // Sort by order
      actions.sort((a: RuleAction, b: RuleAction) => a.order - b.order);

      console.log(`Executing ${actions.length} actions`);

      for (const action of actions) {
        const result = await executeAction(supabase, action, trigger_data, supabaseUrl, supabaseServiceKey);
        actionResults.push({ action_id: action.id, type: action.type, result });
        console.log(`Action ${action.type} result:`, result);
      }

      // Update execution as success
      await supabase
        .from('lowcode_rule_executions')
        .update({
          status: 'success',
          output_data: { actions: actionResults },
          execution_time_ms: Date.now() - startTime
        })
        .eq('id', execution.id);

      console.log(`Rule execution completed successfully in ${Date.now() - startTime}ms`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          execution_id: execution.id,
          status: 'success',
          actions_executed: actionResults.length,
          execution_time_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      executionError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Execution error:', executionError);

      // Update execution as failed
      await supabase
        .from('lowcode_rule_executions')
        .update({
          status: 'failed',
          error_message: executionError,
          output_data: { actions: actionResults },
          execution_time_ms: Date.now() - startTime
        })
        .eq('id', execution.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          execution_id: execution.id,
          error: executionError
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function evaluateConditions(conditions: RuleCondition[], data: Record<string, any>): boolean {
  if (conditions.length === 0) return true;

  let result = true;
  let currentLogic: 'AND' | 'OR' = 'AND';

  for (let i = 0; i < conditions.length; i++) {
    const condition = conditions[i];
    const fieldValue = getNestedValue(data, condition.field);
    const conditionResult = evaluateSingleCondition(fieldValue, condition.operator, condition.value);

    if (i === 0) {
      result = conditionResult;
    } else {
      if (currentLogic === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }
    }

    currentLogic = condition.logic || 'AND';
  }

  return result;
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function evaluateSingleCondition(fieldValue: any, operator: string, targetValue: any): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue == targetValue;
    case 'not_equals':
      return fieldValue != targetValue;
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(targetValue).toLowerCase());
    case 'starts_with':
      return String(fieldValue).toLowerCase().startsWith(String(targetValue).toLowerCase());
    case 'ends_with':
      return String(fieldValue).toLowerCase().endsWith(String(targetValue).toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(targetValue);
    case 'less_than':
      return Number(fieldValue) < Number(targetValue);
    case 'greater_or_equal':
      return Number(fieldValue) >= Number(targetValue);
    case 'less_or_equal':
      return Number(fieldValue) <= Number(targetValue);
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === '';
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    case 'is_null':
      return fieldValue === null || fieldValue === undefined;
    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined;
    case 'in_list':
    case 'in':
      return Array.isArray(targetValue) ? targetValue.includes(fieldValue) : false;
    case 'not_in_list':
      return Array.isArray(targetValue) ? !targetValue.includes(fieldValue) : true;
    case 'matches_regex':
      try {
        return new RegExp(targetValue).test(String(fieldValue));
      } catch {
        return false;
      }
    case 'between':
      if (Array.isArray(targetValue) && targetValue.length === 2) {
        const val = Number(fieldValue);
        return val >= Number(targetValue[0]) && val <= Number(targetValue[1]);
      }
      return false;
    default:
      console.warn(`Unknown operator: ${operator}`);
      return false;
  }
}

async function executeAction(
  supabase: any, 
  action: RuleAction, 
  triggerData: Record<string, any>,
  supabaseUrl: string,
  serviceKey: string
): Promise<Record<string, any>> {
  const config = action.config;

  switch (action.type) {
    case 'send_email':
      return await sendEmail(supabaseUrl, serviceKey, config, triggerData);

    case 'send_notification':
      return await createNotification(supabase, config, triggerData);

    case 'create_record':
      return await createRecord(supabase, config, triggerData);

    case 'update_record':
      return await updateRecord(supabase, config, triggerData);

    case 'delete_record':
      return await deleteRecord(supabase, config, triggerData);

    case 'call_webhook':
      return await callWebhook(config, triggerData);

    case 'assign_user':
      return await assignUser(supabase, config, triggerData);

    case 'change_status':
      return await changeStatus(supabase, config, triggerData);

    case 'execute_rule':
      return await executeChildRule(supabaseUrl, serviceKey, config, triggerData);

    case 'log_event':
      return await logEvent(supabase, config, triggerData);

    case 'send_sms':
      return await sendSms(supabaseUrl, serviceKey, config, triggerData);

    default:
      console.warn(`Unknown action type: ${action.type}`);
      return { success: false, error: `Unknown action type: ${action.type}` };
  }
}

function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const value = getNestedValue(data, key.trim());
    return value !== undefined ? String(value) : '';
  });
}

async function sendEmail(
  supabaseUrl: string, 
  serviceKey: string, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const to = interpolateTemplate(config.to || '', data);
    const subject = interpolateTemplate(config.subject || '', data);
    const body = interpolateTemplate(config.body || '', data);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ to, subject, html: body })
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`);
    }

    return { success: true, to, subject };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function createNotification(
  supabase: any, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const userId = interpolateTemplate(config.user_id || '', data);
    const title = interpolateTemplate(config.title || '', data);
    const message = interpolateTemplate(config.message || '', data);

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        severity: config.severity || 'info'
      });

    if (error) throw error;
    return { success: true, user_id: userId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function createRecord(
  supabase: any, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const tableName = config.table;
    const recordData: Record<string, any> = {};

    for (const [key, value] of Object.entries(config.data || {})) {
      recordData[key] = interpolateTemplate(String(value), data);
    }

    const { data: result, error } = await supabase
      .from(tableName)
      .insert(recordData)
      .select()
      .single();

    if (error) throw error;
    return { success: true, record_id: result?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function updateRecord(
  supabase: any, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const tableName = config.table;
    const recordId = interpolateTemplate(config.record_id || '', data);
    const updateData: Record<string, any> = {};

    for (const [key, value] of Object.entries(config.data || {})) {
      updateData[key] = interpolateTemplate(String(value), data);
    }

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', recordId);

    if (error) throw error;
    return { success: true, record_id: recordId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function deleteRecord(
  supabase: any, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const tableName = config.table;
    const recordId = interpolateTemplate(config.record_id || '', data);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', recordId);

    if (error) throw error;
    return { success: true, record_id: recordId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function callWebhook(
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const url = config.url;
    const method = config.method || 'POST';
    const headers = config.headers || {};
    
    let body = config.body;
    if (typeof body === 'string') {
      body = interpolateTemplate(body, data);
    } else if (typeof body === 'object') {
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: method !== 'GET' ? body : undefined
    });

    return { 
      success: response.ok, 
      status: response.status,
      response: await response.text().catch(() => null)
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function assignUser(
  supabase: any, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const tableName = config.table;
    const recordId = interpolateTemplate(config.record_id || '', data);
    const userId = interpolateTemplate(config.user_id || '', data);
    const field = config.field || 'assigned_to';

    const { error } = await supabase
      .from(tableName)
      .update({ [field]: userId })
      .eq('id', recordId);

    if (error) throw error;
    return { success: true, record_id: recordId, user_id: userId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function changeStatus(
  supabase: any, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const tableName = config.table;
    const recordId = interpolateTemplate(config.record_id || '', data);
    const status = config.status;
    const field = config.field || 'status';

    const { error } = await supabase
      .from(tableName)
      .update({ [field]: status })
      .eq('id', recordId);

    if (error) throw error;
    return { success: true, record_id: recordId, status };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function executeChildRule(
  supabaseUrl: string, 
  serviceKey: string, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const ruleId = config.rule_id;

    const response = await fetch(`${supabaseUrl}/functions/v1/execute-lowcode-rule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({
        rule_id: ruleId,
        trigger_data: data,
        triggered_by: null
      })
    });

    const result = await response.json();
    return { success: response.ok, child_rule_id: ruleId, result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function logEvent(
  supabase: any, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const message = interpolateTemplate(config.message || '', data);
    const level = config.level || 'info';

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action: 'lowcode_rule_log',
        table_name: 'lowcode_rules',
        new_data: { message, level, trigger_data: data },
        category: 'automation',
        severity: level
      });

    if (error) throw error;
    return { success: true, message };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendSms(
  supabaseUrl: string, 
  serviceKey: string, 
  config: Record<string, any>, 
  data: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const to = interpolateTemplate(config.to || '', data);
    const message = interpolateTemplate(config.message || '', data);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({ to, message })
    });

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`);
    }

    return { success: true, to };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
