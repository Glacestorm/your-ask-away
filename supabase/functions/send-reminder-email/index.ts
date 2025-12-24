import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ReminderEmailRequest {
  to: string;
  gestorName: string;
  companyName: string;
  reminderType: string;
  reminderDate: string;
  daysUntil: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication - allow cron, service role, or valid JWT
  const authResult = validateCronOrServiceAuth(req);
  if (!authResult.valid) {
    console.error('Authentication failed:', authResult.error);
    return new Response(
      JSON.stringify({ error: authResult.error }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  console.log(`Request authenticated via: ${authResult.source}`);

  try {
    const { to, gestorName, companyName, reminderType, reminderDate, daysUntil }: ReminderEmailRequest = await req.json();

    console.log(`Sending reminder email to ${to} for ${companyName} - ${reminderType}`);

    const urgencyText = daysUntil === 0 ? '¡HOY!' : daysUntil === 1 ? 'mañana' : `en ${daysUntil} días`;
    const urgencyColor = daysUntil <= 1 ? '#ef4444' : '#f97316';

    const emailResponse = await resend.emails.send({
      from: "Recordatorios ObelixIA <onboarding@resend.dev>",
      to: [to],
      subject: `⏰ Recordatorio: ${reminderType} - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio de Visita</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              
              <!-- Header con urgencia -->
              <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  ⏰ Recordatorio ${urgencyText.toUpperCase()}
                </h1>
              </div>

              <!-- Información principal -->
              <div style="margin-bottom: 24px;">
                <p style="font-size: 16px; margin-bottom: 8px;">
                  Hola <strong>${gestorName}</strong>,
                </p>
                <p style="font-size: 16px; margin-bottom: 16px;">
                  Te recordamos que tienes pendiente:
                </p>
              </div>

              <!-- Detalles del recordatorio -->
              <div style="background-color: #f9fafb; border-left: 4px solid ${urgencyColor}; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280; width: 40%;">Tipo:</td>
                    <td style="padding: 8px 0; color: #111827;">${reminderType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Empresa:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Fecha:</td>
                    <td style="padding: 8px 0; color: #111827;">${new Date(reminderDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Tiempo restante:</td>
                    <td style="padding: 8px 0; color: ${urgencyColor}; font-weight: 700; font-size: 18px;">${urgencyText}</td>
                  </tr>
                </table>
              </div>

              <!-- Mensaje de acción -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  💡 <strong>Consejo:</strong> Asegúrate de preparar toda la documentación necesaria y confirmar la disponibilidad del cliente.
                </p>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px; text-align: center;">
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                  Este es un recordatorio automático del sistema de gestión comercial.
                </p>
                <p style="font-size: 13px; color: #6b7280; margin: 8px 0 0 0;">
                  © ${new Date().getFullYear()} ObelixIA. Todos los derechos reservados.
                </p>
              </div>

            </div>
          </body>
        </html>
      `,
    });

    console.log("Reminder email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending reminder email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
