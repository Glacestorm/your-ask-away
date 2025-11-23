import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  to: string[];
  alertName: string;
  metricType: string;
  metricValue: number;
  thresholdValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, alertName, metricType, metricValue, thresholdValue, severity, message }: AlertEmailRequest = await req.json();

    console.log('Sending alert email:', { to, alertName, severity });

    // Determine severity styling
    const severityConfig = {
      critical: {
        color: '#dc2626',
        bgColor: '#fee2e2',
        label: '🚨 CRÍTICO',
        emoji: '🚨'
      },
      warning: {
        color: '#ea580c',
        bgColor: '#ffedd5',
        label: '⚠️ ADVERTENCIA',
        emoji: '⚠️'
      },
      info: {
        color: '#2563eb',
        bgColor: '#dbeafe',
        label: 'ℹ️ INFORMACIÓN',
        emoji: 'ℹ️'
      }
    };

    const config = severityConfig[severity];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alerta: ${alertName}</title>
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
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background-color: ${config.color};
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .severity-badge {
              display: inline-block;
              background-color: rgba(255, 255, 255, 0.2);
              padding: 8px 16px;
              border-radius: 4px;
              margin-top: 10px;
              font-size: 14px;
              font-weight: 600;
            }
            .content {
              padding: 30px 20px;
            }
            .alert-details {
              background-color: ${config.bgColor};
              border-left: 4px solid ${config.color};
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .alert-details h2 {
              margin: 0 0 15px 0;
              font-size: 18px;
              color: ${config.color};
            }
            .metric-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid rgba(0,0,0,0.1);
            }
            .metric-row:last-child {
              border-bottom: none;
            }
            .metric-label {
              font-weight: 600;
              color: #666;
            }
            .metric-value {
              font-weight: 700;
              color: #333;
              font-size: 18px;
            }
            .message {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
              color: #555;
            }
            .cta-button {
              display: inline-block;
              background-color: ${config.color};
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .footer p {
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${config.emoji} ${alertName}</h1>
              <div class="severity-badge">${config.label}</div>
            </div>
            
            <div class="content">
              <p>Se ha detectado una condición de alerta en tu sistema de métricas comerciales.</p>
              
              <div class="alert-details">
                <h2>Detalles de la Alerta</h2>
                <div class="metric-row">
                  <span class="metric-label">Métrica:</span>
                  <span class="metric-value">${metricType}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Valor Actual:</span>
                  <span class="metric-value" style="color: ${config.color};">${metricValue.toFixed(2)}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">Umbral Configurado:</span>
                  <span class="metric-value">${thresholdValue.toFixed(2)}</span>
                </div>
              </div>

              <div class="message">
                <strong>Mensaje:</strong><br>
                ${message}
              </div>

              <div style="text-align: center;">
                <a href="https://avaugfnqvvqcilhiudlf.lovable.app/dashboard" class="cta-button">
                  Ver Dashboard
                </a>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                ${severity === 'critical' ? '⚡ Esta alerta requiere atención inmediata.' : 
                  severity === 'warning' ? '⏰ Revisa esta métrica cuando sea posible.' : 
                  'ℹ️ Esta es una notificación informativa.'}
              </p>
            </div>

            <div class="footer">
              <p><strong>Dashboard Comercial</strong></p>
              <p>Sistema de Alertas Automáticas</p>
              <p style="margin-top: 15px;">
                Este es un correo automático. Si deseas dejar de recibir estas notificaciones, 
                contacta con tu administrador del sistema.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Dashboard Comercial <onboarding@resend.dev>",
      to: to,
      subject: `${config.emoji} Alerta ${severity.toUpperCase()}: ${alertName}`,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-alert-email function:", error);
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
