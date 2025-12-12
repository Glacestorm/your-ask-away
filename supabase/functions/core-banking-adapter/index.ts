import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Adapter interfaces
interface CoreBankingAdapter {
  name: string;
  transformOutbound(data: any, mappings: FieldMapping[]): any;
  transformInbound(data: any, mappings: FieldMapping[]): any;
  buildRequest(operation: string, payload: any, config: CoreConfig): RequestInit;
  parseResponse(response: Response, operation: string): Promise<any>;
}

interface CoreConfig {
  api_endpoint: string;
  api_version: string;
  auth_type: string;
  auth_config: any;
  timeout_ms: number;
  retry_config: { maxRetries: number; backoffMs: number };
}

interface FieldMapping {
  obelixia_field: string;
  core_field: string;
  transformation_rule: any;
  direction: string;
  is_required: boolean;
  default_value: string | null;
}

// Temenos T24/Transact Adapter
const temenosAdapter: CoreBankingAdapter = {
  name: 'temenos',
  
  transformOutbound(data: any, mappings: FieldMapping[]): any {
    const result: any = {};
    for (const mapping of mappings.filter(m => ['outbound', 'bidirectional'].includes(m.direction))) {
      let value = data[mapping.obelixia_field];
      
      if (value === undefined && mapping.default_value) {
        value = mapping.default_value;
      }
      
      if (value !== undefined || mapping.is_required) {
        // Apply transformation rules
        if (mapping.transformation_rule?.type === 'date_format') {
          value = formatDate(value, mapping.transformation_rule.format);
        } else if (mapping.transformation_rule?.type === 'number_scale') {
          value = Number(value) * (mapping.transformation_rule.scale || 1);
        } else if (mapping.transformation_rule?.type === 'lookup') {
          value = mapping.transformation_rule.values?.[value] || value;
        }
        
        setNestedValue(result, mapping.core_field, value);
      }
    }
    return { body: result };
  },
  
  transformInbound(data: any, mappings: FieldMapping[]): any {
    const result: any = {};
    for (const mapping of mappings.filter(m => ['inbound', 'bidirectional'].includes(m.direction))) {
      let value = getNestedValue(data, mapping.core_field);
      
      if (value !== undefined) {
        // Reverse transformation
        if (mapping.transformation_rule?.type === 'date_format') {
          value = parseDate(value, mapping.transformation_rule.format);
        } else if (mapping.transformation_rule?.type === 'number_scale') {
          value = Number(value) / (mapping.transformation_rule.scale || 1);
        } else if (mapping.transformation_rule?.type === 'lookup') {
          const reverseMap = Object.fromEntries(
            Object.entries(mapping.transformation_rule.values || {}).map(([k, v]) => [v, k])
          );
          value = reverseMap[value] || value;
        }
        
        result[mapping.obelixia_field] = value;
      }
    }
    return result;
  },
  
  buildRequest(operation: string, payload: any, config: CoreConfig): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add auth headers based on type
    if (config.auth_type === 'basic') {
      const credentials = btoa(`${config.auth_config.username}:${config.auth_config.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (config.auth_type === 'api_key') {
      headers[config.auth_config.header_name || 'X-API-Key'] = config.auth_config.api_key;
    } else if (config.auth_type === 'oauth2') {
      headers['Authorization'] = `Bearer ${config.auth_config.access_token}`;
    }
    
    return {
      method: operation.startsWith('get') ? 'GET' : 'POST',
      headers,
      body: operation.startsWith('get') ? undefined : JSON.stringify(payload),
    };
  },
  
  async parseResponse(response: Response, operation: string): Promise<any> {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      if (json.body) return json.body;
      if (json.data) return json.data;
      return json;
    } catch {
      return { raw: text };
    }
  }
};

// Finastra Fusion Adapter
const finastraAdapter: CoreBankingAdapter = {
  name: 'finastra',
  
  transformOutbound(data: any, mappings: FieldMapping[]): any {
    const result: any = { data: { attributes: {} } };
    for (const mapping of mappings.filter(m => ['outbound', 'bidirectional'].includes(m.direction))) {
      let value = data[mapping.obelixia_field];
      if (value !== undefined || mapping.is_required) {
        if (mapping.transformation_rule?.type) {
          value = applyTransformation(value, mapping.transformation_rule);
        }
        result.data.attributes[mapping.core_field] = value ?? mapping.default_value;
      }
    }
    return result;
  },
  
  transformInbound(data: any, mappings: FieldMapping[]): any {
    const attributes = data?.data?.attributes || data;
    const result: any = {};
    for (const mapping of mappings.filter(m => ['inbound', 'bidirectional'].includes(m.direction))) {
      const value = attributes[mapping.core_field];
      if (value !== undefined) {
        result[mapping.obelixia_field] = reverseTransformation(value, mapping.transformation_rule);
      }
    }
    return result;
  },
  
  buildRequest(operation: string, payload: any, config: CoreConfig): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    };
    
    if (config.auth_type === 'oauth2') {
      headers['Authorization'] = `Bearer ${config.auth_config.access_token}`;
    }
    
    return {
      method: getHttpMethod(operation),
      headers,
      body: ['GET', 'DELETE'].includes(getHttpMethod(operation)) ? undefined : JSON.stringify(payload),
    };
  },
  
  async parseResponse(response: Response, operation: string): Promise<any> {
    const json = await response.json();
    return json.data?.attributes || json.data || json;
  }
};

// Mambu Adapter
const mambuAdapter: CoreBankingAdapter = {
  name: 'mambu',
  
  transformOutbound(data: any, mappings: FieldMapping[]): any {
    const result: any = {};
    for (const mapping of mappings.filter(m => ['outbound', 'bidirectional'].includes(m.direction))) {
      let value = data[mapping.obelixia_field];
      if (value !== undefined || mapping.is_required) {
        result[mapping.core_field] = applyTransformation(value, mapping.transformation_rule) ?? mapping.default_value;
      }
    }
    return result;
  },
  
  transformInbound(data: any, mappings: FieldMapping[]): any {
    const result: any = {};
    for (const mapping of mappings.filter(m => ['inbound', 'bidirectional'].includes(m.direction))) {
      const value = data[mapping.core_field];
      if (value !== undefined) {
        result[mapping.obelixia_field] = reverseTransformation(value, mapping.transformation_rule);
      }
    }
    return result;
  },
  
  buildRequest(operation: string, payload: any, config: CoreConfig): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.mambu.v2+json',
    };
    
    if (config.auth_type === 'api_key') {
      headers['apiKey'] = config.auth_config.api_key;
    } else if (config.auth_type === 'basic') {
      headers['Authorization'] = `Basic ${btoa(`${config.auth_config.username}:${config.auth_config.password}`)}`;
    }
    
    return {
      method: getHttpMethod(operation),
      headers,
      body: ['GET', 'DELETE'].includes(getHttpMethod(operation)) ? undefined : JSON.stringify(payload),
    };
  },
  
  async parseResponse(response: Response, operation: string): Promise<any> {
    return await response.json();
  }
};

// Thought Machine Vault Adapter
const thoughtMachineAdapter: CoreBankingAdapter = {
  name: 'thought_machine',
  
  transformOutbound(data: any, mappings: FieldMapping[]): any {
    const result: any = { request_id: crypto.randomUUID() };
    for (const mapping of mappings.filter(m => ['outbound', 'bidirectional'].includes(m.direction))) {
      let value = data[mapping.obelixia_field];
      if (value !== undefined || mapping.is_required) {
        setNestedValue(result, mapping.core_field, applyTransformation(value, mapping.transformation_rule) ?? mapping.default_value);
      }
    }
    return result;
  },
  
  transformInbound(data: any, mappings: FieldMapping[]): any {
    const result: any = {};
    for (const mapping of mappings.filter(m => ['inbound', 'bidirectional'].includes(m.direction))) {
      const value = getNestedValue(data, mapping.core_field);
      if (value !== undefined) {
        result[mapping.obelixia_field] = reverseTransformation(value, mapping.transformation_rule);
      }
    }
    return result;
  },
  
  buildRequest(operation: string, payload: any, config: CoreConfig): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
    };
    
    if (config.auth_type === 'oauth2') {
      headers['Authorization'] = `Bearer ${config.auth_config.access_token}`;
    }
    
    return {
      method: getHttpMethod(operation),
      headers,
      body: ['GET', 'DELETE'].includes(getHttpMethod(operation)) ? undefined : JSON.stringify(payload),
    };
  },
  
  async parseResponse(response: Response, operation: string): Promise<any> {
    const json = await response.json();
    return json.result || json;
  }
};

// Helper functions
function getAdapter(coreType: string): CoreBankingAdapter {
  const adapters: Record<string, CoreBankingAdapter> = {
    temenos: temenosAdapter,
    finastra: finastraAdapter,
    mambu: mambuAdapter,
    thought_machine: thoughtMachineAdapter,
    custom: temenosAdapter, // Default to Temenos format for custom
  };
  return adapters[coreType] || temenosAdapter;
}

function getHttpMethod(operation: string): string {
  if (operation.startsWith('get') || operation.startsWith('pull') || operation.startsWith('fetch')) return 'GET';
  if (operation.startsWith('delete') || operation.startsWith('remove')) return 'DELETE';
  if (operation.startsWith('update') || operation.startsWith('patch')) return 'PATCH';
  return 'POST';
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((curr, key) => curr?.[key], obj);
}

function formatDate(value: any, format: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (format === 'YYYYMMDD') {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
  return date.toISOString();
}

function parseDate(value: string, format: string): string {
  if (!value) return '';
  if (format === 'YYYYMMDD' && value.length === 8) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
}

function applyTransformation(value: any, rule: any): any {
  if (!rule?.type) return value;
  
  switch (rule.type) {
    case 'date_format':
      return formatDate(value, rule.format);
    case 'number_scale':
      return Number(value) * (rule.scale || 1);
    case 'lookup':
      return rule.values?.[value] || value;
    case 'string_pad':
      return String(value || '').padStart(rule.length || 0, rule.char || '0');
    case 'uppercase':
      return String(value || '').toUpperCase();
    case 'lowercase':
      return String(value || '').toLowerCase();
    default:
      return value;
  }
}

function reverseTransformation(value: any, rule: any): any {
  if (!rule?.type) return value;
  
  switch (rule.type) {
    case 'date_format':
      return parseDate(value, rule.format);
    case 'number_scale':
      return Number(value) / (rule.scale || 1);
    case 'lookup':
      const reverseMap = Object.fromEntries(
        Object.entries(rule.values || {}).map(([k, v]) => [v, k])
      );
      return reverseMap[value] || value;
    default:
      return value;
  }
}

async function executeWithRetry(
  fn: () => Promise<Response>,
  config: CoreConfig
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= config.retry_config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout_ms);
      
      const response = await fn();
      clearTimeout(timeoutId);
      
      if (response.ok || response.status < 500) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
    }
    
    if (attempt < config.retry_config.maxRetries) {
      await new Promise(resolve => 
        setTimeout(resolve, config.retry_config.backoffMs * Math.pow(2, attempt))
      );
    }
  }
  
  throw lastError;
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

    const { operation, config_id, payload, queue_id } = await req.json();

    console.log(`[CoreBankingAdapter] Operation: ${operation}, Config: ${config_id}`);

    // Get configuration
    const { data: config, error: configError } = await supabase
      .from('core_banking_configs')
      .select('*')
      .eq('id', config_id)
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      console.error('[CoreBankingAdapter] Config not found:', configError);
      return new Response(JSON.stringify({ error: 'Configuration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get field mappings
    const { data: mappings } = await supabase
      .from('integration_mappings')
      .select('*')
      .eq('config_id', config_id);

    const adapter = getAdapter(config.core_type);
    
    // Transform outbound data
    const transformedPayload = adapter.transformOutbound(payload, mappings || []);
    
    // Build and execute request
    const requestConfig = adapter.buildRequest(operation, transformedPayload, config);
    const endpoint = `${config.api_endpoint}/${config.api_version}/${operation}`;
    
    console.log(`[CoreBankingAdapter] Calling: ${endpoint}`);

    // Update queue status if queue_id provided
    if (queue_id) {
      await supabase
        .from('integration_queue')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', queue_id);
    }

    const response = await executeWithRetry(
      () => fetch(endpoint, requestConfig),
      config
    );

    const responseData = await adapter.parseResponse(response, operation);
    
    // Transform inbound data
    const transformedResponse = adapter.transformInbound(responseData, mappings || []);

    // Update queue on completion
    if (queue_id) {
      await supabase
        .from('integration_queue')
        .update({
          status: response.ok ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          result: response.ok ? transformedResponse : null,
          error_message: response.ok ? null : JSON.stringify(responseData)
        })
        .eq('id', queue_id);
    }

    // Log the operation
    await supabase.from('audit_logs').insert({
      action: 'core_banking_operation',
      table_name: 'integration_queue',
      record_id: queue_id,
      new_data: {
        operation,
        config_id,
        core_type: config.core_type,
        success: response.ok,
        status_code: response.status
      },
      category: 'integration',
      severity: response.ok ? 'info' : 'warn'
    });

    return new Response(JSON.stringify({
      success: response.ok,
      data: transformedResponse,
      raw_response: responseData,
      status_code: response.status
    }), {
      status: response.ok ? 200 : response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CoreBankingAdapter] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
