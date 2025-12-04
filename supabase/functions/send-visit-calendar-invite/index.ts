import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarInviteRequest {
  to: string;
  gestorName: string;
  companyName: string;
  companyAddress: string;
  visitDate: string;
  visitTime: string;
  duration: number;
  visitType: string;
  canal: string;
  notes?: string;
  participants?: Array<{ name: string; email: string }>;
}

function generateICSContent(data: CalendarInviteRequest): string {
  const startDate = new Date(`${data.visitDate}T${data.visitTime || '09:00'}:00`);
  const endDate = new Date(startDate.getTime() + (data.duration || 60) * 60 * 1000);
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `visit-${Date.now()}@creand.ad`;
  const now = formatDate(new Date());
  
  let attendees = '';
  if (data.participants && data.participants.length > 0) {
    attendees = data.participants
      .map(p => `ATTENDEE;CN=${p.name};RSVP=TRUE:mailto:${p.email}`)
      .join('\r\n');
  }

  const location = data.canal === 'Presencial' ? data.companyAddress : 
                   data.canal === 'Videollamada' ? 'Videollamada' :
                   data.canal === 'Teléfono' ? 'Llamada telefónica' : 'Email';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Creand//Visit Calendar//ES
METHOD:REQUEST
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${data.visitType} - ${data.companyName}
DESCRIPTION:Visita comercial programada.\\n\\nTipo: ${data.visitType}\\nCanal: ${data.canal}\\n${data.notes ? `Notas: ${data.notes}` : ''}
LOCATION:${location}
ORGANIZER;CN=${data.gestorName}:mailto:${data.to}
${attendees}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '\r\n');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: CalendarInviteRequest = await req.json();

    console.log(`Sending calendar invite to ${data.to} for visit to ${data.companyName}`);

    const icsContent = generateICSContent(data);
    const icsBase64 = btoa(icsContent);

    const visitDateFormatted = new Date(data.visitDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Preparar lista de destinatarios
    const recipients = [data.to];
    if (data.participants) {
      data.participants.forEach(p => {
        if (p.email && !recipients.includes(p.email)) {
          recipients.push(p.email);
        }
      });
    }

    const participantsHtml = data.participants && data.participants.length > 0 
      ? `<tr>
          <td style="padding: 8px 0; font-weight: 600; color: #6b7280; width: 40%;">Participantes:</td>
          <td style="padding: 8px 0; color: #111827;">${data.participants.map(p => p.name).join(', ')}</td>
        </tr>`
      : '';

    const emailResponse = await resend.emails.send({
      from: "Calendario Creand <onboarding@resend.dev>",
      to: recipients,
      subject: `📅 Visita programada: ${data.companyName} - ${visitDateFormatted}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Visita Programada</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
              
              <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                  📅 Visita Programada
                </h1>
              </div>

              <div style="margin-bottom: 24px;">
                <p style="font-size: 16px; margin-bottom: 8px;">
                  Hola <strong>${data.gestorName}</strong>,
                </p>
                <p style="font-size: 16px; margin-bottom: 16px;">
                  Se ha programado una visita comercial. Encontrarás el archivo .ics adjunto para añadirlo a tu calendario.
                </p>
              </div>

              <div style="background-color: #f9fafb; border-left: 4px solid #22c55e; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280; width: 40%;">Empresa:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: 600;">${data.companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Fecha:</td>
                    <td style="padding: 8px 0; color: #111827;">${visitDateFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Hora:</td>
                    <td style="padding: 8px 0; color: #111827;">${data.visitTime || '09:00'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Duración:</td>
                    <td style="padding: 8px 0; color: #111827;">${data.duration || 60} minutos</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Tipo:</td>
                    <td style="padding: 8px 0; color: #111827;">${data.visitType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Canal:</td>
                    <td style="padding: 8px 0; color: #111827;">${data.canal}</td>
                  </tr>
                  ${data.canal === 'Presencial' ? `
                  <tr>
                    <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Dirección:</td>
                    <td style="padding: 8px 0; color: #111827;">${data.companyAddress}</td>
                  </tr>
                  ` : ''}
                  ${participantsHtml}
                </table>
              </div>

              ${data.notes ? `
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  📝 <strong>Notas:</strong> ${data.notes}
                </p>
              </div>
              ` : ''}

              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Instrucciones:</strong> Abre el archivo .ics adjunto para añadir esta visita a tu calendario de Outlook o Google Calendar.
                </p>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px; text-align: center;">
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                  Este es un mensaje automático del sistema de gestión comercial.
                </p>
                <p style="font-size: 13px; color: #6b7280; margin: 8px 0 0 0;">
                  © ${new Date().getFullYear()} Creand. Todos los derechos reservados.
                </p>
              </div>

            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: 'visita.ics',
          content: icsBase64,
          contentType: 'text/calendar',
        }
      ],
    });

    console.log("Calendar invite sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending calendar invite:", error);
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
