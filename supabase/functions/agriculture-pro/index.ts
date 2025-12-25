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
    console.log(`[agriculture-pro] Action: ${action}`);

    const mockResponses: Record<string, unknown> = {
      get_precision_data: {
        field_id: params?.fieldId,
        ndvi_index: 0.78,
        soil_moisture: 42,
        crop_health_score: 85,
        last_updated: new Date().toISOString()
      },
      get_weather_predictions: Array.from({ length: params?.days || 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        temperature: { min: 12 + Math.random() * 5, max: 22 + Math.random() * 8 },
        precipitation_probability: Math.random() * 100,
        agricultural_advice: ['Condiciones óptimas para siembra']
      })),
      get_irrigation_plan: {
        field_id: params?.fieldId,
        zones: [{ zone_id: 'Z1', water_need_mm: 25, scheduled_time: '06:00', duration_minutes: 45 }],
        total_water_m3: 150,
        water_savings_percent: 32
      }
    };

    const result = mockResponses[action] || { message: `Action ${action} processed` };

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[agriculture-pro] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
