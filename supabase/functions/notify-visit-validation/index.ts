import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  visitSheetId?: string;
  companyName: string;
  gestorName: string;
  gestorEmail: string;
  productosOfrecidos: any[];
  fecha: string;
  probabilidadCierre?: number;
  potencialAnual?: number | null;
  type?: 'pending' | 'validation_result';
  approved?: boolean;
  validationNotes?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: ValidationRequest = await req.json();
    const {
      visitSheetId,
      companyName,
      gestorName,
      gestorEmail,
      productosOfrecidos,
      fecha,
      probabilidadCierre,
      potencialAnual,
      type = 'pending',
      approved,
      validationNotes,
    } = requestData;

    console.log("Processing validation notification, type:", type);

    // Handle validation result notification to gestor
    if (type === 'validation_result' && gestorEmail) {
      console.log("Sending validation result email to gestor:", gestorEmail);
      
      const productosHtml = productosOfrecidos.length > 0
        ? productosOfrecidos.map((p: any) => `<li>${p.name || p}</li>`).join("")
        : "<li>Sin productos especificados</li>";

      const statusColor = approved ? '#22c55e' : '#ef4444';
      const statusText = approved ? 'APROBADA' : 'RECHAZADA';
      const statusEmoji = approved ? '✅' : '❌';

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: bold; background: ${statusColor}; color: white; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
            .products-list { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .notes { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${statusEmoji} Ficha de Visita ${statusText}</h1>
            </div>
            <div class="content">
              <p>Hola ${gestorName},</p>
              <p>Tu ficha de visita ha sido revisada por el Responsable Comercial:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <span class="status-badge">${statusText}</span>
              </div>

              <div class="info-row">
                <strong>Empresa:</strong>
                <span>${companyName}</span>
              </div>
              <div class="info-row">
                <strong>Fecha de visita:</strong>
                <span>${fecha}</span>
              </div>
              
              <div class="products-list">
                <h3 style="margin-top: 0;">📦 Productos Ofrecidos:</h3>
                <ul>${productosHtml}</ul>
              </div>

              ${approved && productosOfrecidos.length > 0 ? `
              <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;">
                <strong>✅ Los productos han sido añadidos automáticamente al cliente.</strong>
              </div>
              ` : ''}

              ${validationNotes ? `
              <div class="notes">
                <strong>📝 Notas del validador:</strong>
                <p style="margin-bottom: 0;">${validationNotes}</p>
              </div>
              ` : ''}

              <p style="margin-top: 20px;">Puedes acceder a la plataforma para ver más detalles.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResponse = await resend.emails.send({
        from: "Creand <onboarding@resend.dev>",
        to: [gestorEmail],
        subject: `${statusEmoji} Tu Ficha de Visita ha sido ${statusText} - ${companyName}`,
        html: emailHtml,
      });

      console.log("Gestor notification email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, type: 'validation_result' }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle pending validation notification to responsable_comercial
    console.log("Processing pending validation notification for visit sheet:", visitSheetId);

    // Get all responsable_comercial users
    const { data: responsables, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "responsable_comercial");

    if (rolesError) {
      console.error("Error fetching responsable_comercial roles:", rolesError);
      throw rolesError;
    }

    if (!responsables || responsables.length === 0) {
      console.log("No responsable_comercial users found");
      return new Response(
        JSON.stringify({ message: "No responsable_comercial users found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = responsables.map((r) => r.user_id);

    // Get their emails
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const emails = profiles?.map((p) => p.email).filter(Boolean) || [];

    if (emails.length === 0) {
      console.log("No emails found for responsable_comercial users");
      return new Response(
        JSON.stringify({ message: "No emails found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create in-app notifications for each responsable comercial
    for (const profile of profiles || []) {
      await supabase.from("notifications").insert({
        user_id: profile.id,
        title: "Ficha de Visita Pendiente de Validación",
        message: `${gestorName} ha completado una ficha de visita para ${companyName} con productos ofrecidos. Requiere su validación.`,
        severity: "info",
        metric_value: probabilidadCierre || 0,
        threshold_value: 0,
      });
    }

    // Format products for email
    const productosHtml = productosOfrecidos.length > 0
      ? productosOfrecidos.map((p: any) => `<li>${p.name || p}</li>`).join("")
      : "<li>Sin productos especificados</li>";

    // Send email notification
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e7a3b 0%, #2d9a4e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-pending { background: #ffc107; color: #000; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
          .products-list { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 Ficha de Visita Pendiente de Validación</h1>
          </div>
          <div class="content">
            <p>Se ha completado una ficha de visita que requiere su validación:</p>
            
            <div class="info-row">
              <strong>Empresa:</strong>
              <span>${companyName}</span>
            </div>
            <div class="info-row">
              <strong>Gestor:</strong>
              <span>${gestorName} (${gestorEmail})</span>
            </div>
            <div class="info-row">
              <strong>Fecha de visita:</strong>
              <span>${fecha}</span>
            </div>
            <div class="info-row">
              <strong>Probabilidad de cierre:</strong>
              <span>${probabilidadCierre || 0}%</span>
            </div>
            ${potencialAnual ? `
            <div class="info-row">
              <strong>Potencial anual:</strong>
              <span>${potencialAnual.toLocaleString('es-ES')} €</span>
            </div>
            ` : ''}
            
            <div class="products-list">
              <h3 style="margin-top: 0;">📦 Productos Ofrecidos:</h3>
              <ul>${productosHtml}</ul>
            </div>

            <p><span class="badge badge-pending">⏳ Pendiente de validación</span></p>
            
            <p>Por favor, acceda a la plataforma para validar esta ficha de visita y confirmar si los productos ofrecidos fueron contratados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Creand <onboarding@resend.dev>",
      to: emails,
      subject: `⚡ Validación Requerida: Ficha de Visita - ${companyName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailsSent: emails.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-visit-validation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});