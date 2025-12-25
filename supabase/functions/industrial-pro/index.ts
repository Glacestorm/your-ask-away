import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log(`[industrial-pro] Action: ${action}`);

    const mockResponses: Record<string, unknown> = {
      get_digital_twin: {
        id: crypto.randomUUID(),
        asset_id: params?.assetId,
        real_time_data: { temperature: 45, pressure: 2.3, rpm: 1200 },
        sensors: [{ id: 'S1', type: 'temperature', value: 45, status: 'normal' }],
        last_sync: new Date().toISOString()
      },
      get_predictive_maintenance: {
        asset_id: params?.assetId,
        failure_probability: 0.15,
        predicted_failure_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        confidence: 0.87,
        recommended_actions: [{ action: 'Lubricar rodamientos', priority: 'medium', estimated_cost: 250 }]
      },
      get_oee_metrics: {
        asset_id: params?.assetId,
        availability: 0.92,
        performance: 0.88,
        quality: 0.95,
        oee: 0.77,
        target_oee: 0.85
      },
      get_fleet_status: [
        { id: 'V1', vehicle_type: 'truck', status: 'in_transit', fuel_level: 75 },
        { id: 'V2', vehicle_type: 'van', status: 'available', fuel_level: 90 }
      ]
    };

    const result = mockResponses[action] || { message: `Action ${action} processed` };

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[industrial-pro] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
