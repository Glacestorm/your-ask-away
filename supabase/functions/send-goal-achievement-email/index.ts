import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoalAchievementEmailRequest {
  to: string;
  gestorName: string;
  metricLabel: string;
  targetValue: string;
  achievedValue: string;
  progressPercentage: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      gestorName, 
      metricLabel, 
      targetValue, 
      achievedValue, 
      progressPercentage 
    }: GoalAchievementEmailRequest = await req.json();

    console.log(`Sending achievement email to ${to} for ${metricLabel}`);

    const emailResponse = await resend.emails.send({
      from: "Creand CRM <onboarding@resend.dev>",
      to: [to],
      subject: `🎯 Felicitats! Has assolit el teu objectiu de ${metricLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 16px;">🎯</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                        Objectiu Assolit!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 24px 0; line-height: 1.6;">
                        Hola <strong>${gestorName}</strong>,
                      </p>
                      
                      <p style="color: #374151; font-size: 16px; margin: 0 0 32px 0; line-height: 1.6;">
                        Ens complau comunicar-te que has assolit el teu objectiu de <strong>${metricLabel}</strong>. La teva dedicació i esforç han donat fruits!
                      </p>
                      
                      <!-- Stats Box -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; margin-bottom: 32px;">
                        <tr>
                          <td style="padding: 24px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="50%" style="text-align: center; padding: 16px;">
                                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase;">Objectiu</p>
                                  <p style="color: #374151; font-size: 24px; font-weight: 700; margin: 0;">${targetValue}</p>
                                </td>
                                <td width="50%" style="text-align: center; padding: 16px; border-left: 2px solid #d1fae5;">
                                  <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase;">Aconseguit</p>
                                  <p style="color: #10b981; font-size: 24px; font-weight: 700; margin: 0;">${achievedValue}</p>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Progress bar -->
                            <div style="margin-top: 24px;">
                              <div style="background-color: #d1fae5; border-radius: 8px; height: 12px; overflow: hidden;">
                                <div style="background: linear-gradient(90deg, #10b981, #059669); height: 100%; width: ${Math.min(Number(progressPercentage), 100)}%;"></div>
                              </div>
                              <p style="color: #10b981; font-size: 18px; font-weight: 700; text-align: center; margin: 12px 0 0 0;">
                                ${progressPercentage}% completat
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
                        Continua així! El teu rendiment és excel·lent i estem orgullosos del teu treball.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        Aquest és un missatge automàtic del sistema CRM de Creand.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Achievement email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-goal-achievement-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
