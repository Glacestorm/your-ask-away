import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface CriticalOpportunityRequest {
  visitSheetId: string;
  companyName: string;
  gestorName: string;
  gestorEmail: string;
  probabilidadCierre: number;
  potencialAnual: number | null;
  fecha: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      visitSheetId, 
      companyName, 
      gestorName, 
      gestorEmail,
      probabilidadCierre, 
      potencialAnual, 
      fecha 
    }: CriticalOpportunityRequest = await req.json();

    console.log('Processing critical opportunity email:', { visitSheetId, companyName, probabilidadCierre });

    // Get directors emails
    const { data: directors, error: directorsError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        profiles:user_id (email, full_name)
      `)
      .in('role', ['director_comercial', 'director_oficina', 'superadmin']);

    if (directorsError) {
      console.error('Error fetching directors:', directorsError);
      throw directorsError;
    }

    const directorEmails = directors
      ?.map((d: any) => d.profiles?.email)
      .filter((email: string | undefined): email is string => !!email) || [];

    if (directorEmails.length === 0) {
      console.log('No director emails found');
      return new Response(JSON.stringify({ message: 'No directors to notify' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Sending to directors:', directorEmails);

    const formattedDate = new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const potencialFormatted = potencialAnual 
      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(potencialAnual)
      : 'No especificado';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Oportunidad Crítica Detectada</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .header {
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
              color: white;
              padding: 40px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .critical-badge {
              display: inline-block;
              background-color: rgba(255, 255, 255, 0.2);
              padding: 10px 20px;
              border-radius: 50px;
              margin-top: 15px;
              font-size: 16px;
              font-weight: 600;
            }
            .probability {
              font-size: 48px;
              font-weight: 800;
              margin: 10px 0;
            }
            .content {
              padding: 30px 25px;
            }
            .highlight-box {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border-left: 4px solid #059669;
              padding: 20px;
              margin: 20px 0;
              border-radius: 8px;
            }
            .highlight-box h2 {
              margin: 0 0 15px 0;
              font-size: 18px;
              color: #047857;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid rgba(0,0,0,0.08);
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #666;
            }
            .detail-value {
              font-weight: 700;
              color: #333;
            }
            .cta-section {
              text-align: center;
              margin: 30px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
              color: white;
              padding: 14px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 13px;
            }
            .urgent-note {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Oportunidad Crítica</h1>
              <div class="critical-badge">¡Alta Probabilidad de Cierre!</div>
              <div class="probability">${probabilidadCierre}%</div>
            </div>
            
            <div class="content">
              <div class="urgent-note">
                <strong>⚡ Acción Recomendada:</strong> Esta oportunidad tiene una probabilidad de cierre muy alta. 
                Considere priorizar su seguimiento.
              </div>

              <div class="highlight-box">
                <h2>📊 Detalles de la Oportunidad</h2>
                <div class="detail-row">
                  <span class="detail-label">Empresa:</span>
                  <span class="detail-value">${companyName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Gestor:</span>
                  <span class="detail-value">${gestorName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fecha de Visita:</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Potencial Anual:</span>
                  <span class="detail-value" style="color: #059669;">${potencialFormatted}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Probabilidad Cierre:</span>
                  <span class="detail-value" style="color: #059669; font-size: 20px;">${probabilidadCierre}%</span>
                </div>
              </div>

              <div class="cta-section">
                <a href="https://avaugfnqvvqcilhiudlf.lovable.app/admin?section=visit-sheets" class="cta-button">
                  Ver Ficha de Visita
                </a>
              </div>

              <p style="color: #666; font-size: 14px; text-align: center;">
                Esta notificación se genera automáticamente cuando se detecta una oportunidad 
                con probabilidad de cierre ≥90%.
              </p>
            </div>

            <div class="footer">
              <p><strong>Dashboard Comercial ObelixIA</strong></p>
              <p>Sistema de Notificaciones de Oportunidades Críticas</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Dashboard Comercial <onboarding@resend.dev>",
      to: directorEmails,
      subject: `🎯 Oportunidad Crítica: ${companyName} - ${probabilidadCierre}% probabilidad`,
      html: html,
    });

    console.log("Critical opportunity email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-critical-opportunity-email:", error);
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
