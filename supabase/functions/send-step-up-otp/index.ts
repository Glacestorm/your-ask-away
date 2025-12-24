import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  userId: string;
  challengeId: string;
  otpCode: string;
  riskLevel: string;
  riskFactors: string[];
}

async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ObelixIA Platform <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return { success: false, error: errorData.message || "Email sending failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, challengeId, otpCode, riskLevel, riskFactors }: SendOTPRequest = await req.json();

    if (!userId || !challengeId || !otpCode) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user?.email) {
      console.error("Error fetching user:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = userData.user.email;
    const userName = userData.user.user_metadata?.full_name || userEmail.split('@')[0];

    // Format risk factors for email
    const riskFactorsList = riskFactors?.length > 0 
      ? riskFactors.map(f => `<li style="color: #666;">${f}</li>`).join('')
      : '<li style="color: #666;">Verificación de seguridad rutinaria</li>';

    const riskColor = riskLevel === 'critical' ? '#dc2626' 
      : riskLevel === 'high' ? '#ea580c' 
      : riskLevel === 'medium' ? '#ca8a04' 
      : '#16a34a';

    const riskLevelText = riskLevel === 'critical' ? 'Crítico'
      : riskLevel === 'high' ? 'Alto'
      : riskLevel === 'medium' ? 'Medio'
      : 'Bajo';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">🔐</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Verificación de Seguridad</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Autenticación Multifactor Adaptativa (AMA)</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 20px;">Hola <strong>${userName}</strong>,</p>
            
            <p style="color: #666; font-size: 14px; margin: 0 0 25px;">
              Hemos detectado una actividad que requiere verificación adicional según las normativas PSD2/PSD3 (SCA) y DORA.
            </p>
            
            <!-- OTP Code Box -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 25px; border: 2px dashed #cbd5e1;">
              <p style="color: #64748b; font-size: 12px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">Tu código de verificación</p>
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e3a5f; font-family: 'Courier New', monospace;">
                ${otpCode}
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0;">
                ⏱️ Válido durante 5 minutos
              </p>
            </div>
            
            <!-- Risk Level Badge -->
            <div style="background: ${riskColor}15; border-left: 4px solid ${riskColor}; padding: 15px; border-radius: 0 8px 8px 0; margin: 0 0 20px;">
              <p style="margin: 0; font-size: 13px;">
                <strong style="color: ${riskColor};">Nivel de riesgo: ${riskLevelText}</strong>
              </p>
              <p style="margin: 8px 0 0; color: #666; font-size: 12px;">Factores detectados:</p>
              <ul style="margin: 8px 0 0; padding-left: 20px; font-size: 12px;">
                ${riskFactorsList}
              </ul>
            </div>
            
            <!-- Warning -->
            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 0 0 20px;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">
                ⚠️ <strong>Importante:</strong> Si no has solicitado este código, ignora este mensaje. Tu cuenta podría estar siendo accedida desde un dispositivo no autorizado.
              </p>
            </div>
            
            <p style="color: #666; font-size: 13px; margin: 0;">
              Este código es de un solo uso y expirará en 5 minutos. No lo compartas con nadie.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              ObelixIA Platform - Sistema de Autenticación Adaptativa<br>
              Cumplimiento PSD2/PSD3 • DORA • OWASP MASVS
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResult = await sendEmailViaResend(
      userEmail,
      `🔐 Código de verificación: ${otpCode}`,
      emailHtml
    );

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      // Still log in audit but mark email as failed
    } else {
      console.log("OTP email sent successfully to:", userEmail);
    }

    // Update challenge to mark email sent
    await supabase
      .from("auth_challenges")
      .update({ 
        email_sent_at: new Date().toISOString() 
      })
      .eq("id", challengeId);

    // Log security event
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "STEP_UP_OTP_SENT",
      table_name: "auth_challenges",
      record_id: challengeId,
      new_data: {
        risk_level: riskLevel,
        email_sent_to: userEmail,
        email_success: emailResult.success,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ 
        success: emailResult.success, 
        message: emailResult.success ? "OTP sent successfully" : "OTP generated but email may have failed"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
