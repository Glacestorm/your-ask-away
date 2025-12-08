import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  challengeId: string;
  code: string;
  sessionId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { challengeId, code, sessionId } = await req.json() as VerifyRequest;

    if (!challengeId || !code || !sessionId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Faltan campos requeridos" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get challenge
    const { data: challenge, error: fetchError } = await supabase
      .from("auth_challenges")
      .select("*")
      .eq("id", challengeId)
      .eq("session_id", sessionId)
      .maybeSingle();

    if (fetchError || !challenge) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Desafío no encontrado" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already verified
    if (challenge.verified_at) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Desafío ya verificado anteriormente" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (new Date(challenge.expires_at) < new Date()) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "El código ha expirado. Solicita uno nuevo." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max attempts
    if (challenge.attempts >= challenge.max_attempts) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Máximo de intentos alcanzado. Solicita un nuevo código." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Increment attempts
    await supabase
      .from("auth_challenges")
      .update({ attempts: challenge.attempts + 1 })
      .eq("id", challengeId);

    // Verify code
    if (challenge.challenge_code !== code) {
      const remainingAttempts = challenge.max_attempts - challenge.attempts - 1;
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Código incorrecto. ${remainingAttempts} intentos restantes.`,
        remainingAttempts
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark challenge as verified
    await supabase
      .from("auth_challenges")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", challengeId);

    // Update session risk assessment
    await supabase
      .from("session_risk_assessments")
      .update({ 
        step_up_completed: true,
        step_up_factor: challenge.challenge_type,
        updated_at: new Date().toISOString()
      })
      .eq("session_id", sessionId)
      .eq("requires_step_up", true);

    // Mark device as trusted after successful step-up
    const { data: assessment } = await supabase
      .from("session_risk_assessments")
      .select("device_fingerprint_id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (assessment?.device_fingerprint_id) {
      await supabase
        .from("user_device_fingerprints")
        .update({ 
          is_trusted: true,
          trust_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq("id", assessment.device_fingerprint_id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Verificación completada exitosamente",
      deviceTrusted: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("verify-step-up-challenge error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Error desconocido"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
