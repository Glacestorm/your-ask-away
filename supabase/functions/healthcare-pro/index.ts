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
    console.log(`[healthcare-pro] Action: ${action}`);

    // Mock responses for healthcare vertical
    const mockResponses: Record<string, unknown> = {
      create_telemedicine_session: {
        id: crypto.randomUUID(),
        patient_id: params?.patientId,
        doctor_id: params?.doctorId,
        scheduled_at: params?.scheduledAt,
        status: 'scheduled',
        video_url: `https://meet.obelixia.com/${crypto.randomUUID()}`
      },
      ai_diagnosis_assist: {
        possible_conditions: [
          { condition: 'Common Cold', icd10_code: 'J00', probability: 0.75, reasoning: 'Symptoms match typical presentation' },
          { condition: 'Allergic Rhinitis', icd10_code: 'J30.9', probability: 0.20, reasoning: 'Seasonal pattern noted' }
        ],
        recommended_tests: ['Complete Blood Count', 'Allergy Panel'],
        red_flags: [],
        differential_diagnosis: ['Sinusitis', 'Viral infection']
      },
      check_drug_interactions: {
        interactions: params?.medications?.length > 1 ? [{
          drug1: params.medications[0],
          drug2: params.medications[1],
          severity: 'mild',
          description: 'Minor interaction detected',
          recommendation: 'Monitor patient'
        }] : []
      }
    };

    const result = mockResponses[action] || { message: `Action ${action} processed` };

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[healthcare-pro] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
