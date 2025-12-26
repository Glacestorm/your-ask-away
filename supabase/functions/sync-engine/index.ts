import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  action: 'list_configs' | 'create_config' | 'update_config' | 'start_sync' | 'cancel_sync' | 'get_job_status' | 'list_jobs' | 'get_stats';
  config?: Record<string, unknown>;
  configId?: string;
  updates?: Record<string, unknown>;
  options?: { fullSync?: boolean };
  jobId?: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, config, configId, updates, options, jobId, limit } = await req.json() as SyncRequest;
    console.log(`[sync-engine] Action: ${action}`);

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'list_configs':
        result = {
          configs: [
            {
              id: 'sync_001',
              name: 'CRM to ERP Sync',
              source_system: 'salesforce',
              target_system: 'sap',
              sync_type: 'incremental',
              schedule_cron: '0 */4 * * *',
              is_active: true,
              field_mappings: [
                { source_field: 'AccountName', target_field: 'CustomerName', transform: null, is_key: false },
                { source_field: 'AccountId', target_field: 'ExternalId', transform: null, is_key: true }
              ],
              conflict_resolution: 'source_wins',
              batch_size: 500,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'sync_002',
              name: 'Product Catalog Sync',
              source_system: 'pim',
              target_system: 'ecommerce',
              sync_type: 'full',
              schedule_cron: '0 2 * * *',
              is_active: true,
              field_mappings: [
                { source_field: 'sku', target_field: 'product_sku', transform: null, is_key: true },
                { source_field: 'name', target_field: 'title', transform: 'uppercase', is_key: false }
              ],
              conflict_resolution: 'newest_wins',
              batch_size: 1000,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
        };
        break;

      case 'create_config':
        result = {
          config: {
            id: `sync_${Date.now()}`,
            ...config,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };
        break;

      case 'update_config':
        result = { updated: true, configId };
        break;

      case 'start_sync':
        result = {
          job: {
            id: `job_${Date.now()}`,
            config_id: configId,
            status: 'running',
            started_at: new Date().toISOString(),
            completed_at: null,
            records_processed: 0,
            records_created: 0,
            records_updated: 0,
            records_failed: 0,
            error_log: [],
            progress_percentage: 0
          }
        };
        break;

      case 'cancel_sync':
        result = { cancelled: true, jobId };
        break;

      case 'get_job_status':
        const progress = Math.min(100, Math.floor(Math.random() * 30) + 70);
        result = {
          job: {
            id: jobId,
            config_id: 'sync_001',
            status: progress >= 100 ? 'completed' : 'running',
            started_at: new Date(Date.now() - 300000).toISOString(),
            completed_at: progress >= 100 ? new Date().toISOString() : null,
            records_processed: Math.floor(progress * 15),
            records_created: Math.floor(progress * 5),
            records_updated: Math.floor(progress * 8),
            records_failed: Math.floor(progress * 0.2),
            error_log: [],
            progress_percentage: progress
          }
        };
        break;

      case 'list_jobs':
        result = {
          jobs: Array.from({ length: Math.min(limit || 5, 5) }, (_, i) => ({
            id: `job_${Date.now() - i * 3600000}`,
            config_id: configId || 'sync_001',
            status: i === 0 ? 'running' : 'completed',
            started_at: new Date(Date.now() - (i + 1) * 4 * 3600000).toISOString(),
            completed_at: i === 0 ? null : new Date(Date.now() - i * 4 * 3600000).toISOString(),
            records_processed: 1500 + Math.floor(Math.random() * 500),
            records_created: 200 + Math.floor(Math.random() * 100),
            records_updated: 800 + Math.floor(Math.random() * 200),
            records_failed: Math.floor(Math.random() * 10),
            error_log: [],
            progress_percentage: i === 0 ? 65 : 100
          }))
        };
        break;

      case 'get_stats':
        result = {
          stats: {
            total_syncs: 1247,
            successful_syncs: 1235,
            failed_syncs: 12,
            records_synced_today: 45230,
            avg_sync_duration_ms: 185000,
            last_sync_at: new Date().toISOString()
          }
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[sync-engine] Success: ${action}`);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[sync-engine] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
