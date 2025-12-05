import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MINIMUM_PRODUCTS_OFFICE = 3;
const MINIMUM_PRODUCTS_GESTOR = 1;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailRecipient {
  email: string;
  name: string;
  type: 'office' | 'gestor';
  oficina?: string;
  productCount: number;
  minimum: number;
  monthLabel: string;
}

async function sendLowPerformanceEmail(recipient: EmailRecipient) {
  const isOffice = recipient.type === 'office';
  const severity = recipient.productCount === 0 ? 'crítico' : 'bajo';
  const severityColor = recipient.productCount === 0 ? '#dc2626' : '#f59e0b';
  
  const subject = isOffice 
    ? `⚠️ Alerta: Bajo Rendimiento en Oficina ${recipient.oficina}`
    : `📊 Alerta: Productos Contratados - ${recipient.monthLabel}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isOffice ? '⚠️ Alerta de Rendimiento de Oficina' : '📊 Alerta de Productos Contratados'}
          </h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hola <strong>${recipient.name}</strong>,
          </p>
          
          <div style="background-color: ${severityColor}15; border-left: 4px solid ${severityColor}; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong style="color: ${severityColor};">Nivel de alerta: ${severity.toUpperCase()}</strong>
            </p>
          </div>
          
          ${isOffice ? `
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              La oficina <strong>${recipient.oficina}</strong> presenta un rendimiento por debajo del mínimo esperado en ${recipient.monthLabel}:
            </p>
          ` : `
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Se ha detectado que tu nivel de productos contratados está por debajo del objetivo mínimo para ${recipient.monthLabel}:
            </p>
          `}
          
          <div style="display: flex; justify-content: space-around; margin: 25px 0; text-align: center;">
            <div style="flex: 1; padding: 15px; background: #fef2f2; border-radius: 8px; margin: 0 5px;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #dc2626;">${recipient.productCount}</p>
              <p style="margin: 5px 0 0; font-size: 12px; color: #6b7280;">Productos actuales</p>
            </div>
            <div style="flex: 1; padding: 15px; background: #f0fdf4; border-radius: 8px; margin: 0 5px;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #16a34a;">${recipient.minimum}</p>
              <p style="margin: 5px 0 0; font-size: 12px; color: #6b7280;">Mínimo requerido</p>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h3 style="margin: 0 0 10px; color: #1e3a5f; font-size: 14px;">📋 Recomendaciones:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
              <li>Revisa las visitas programadas y prioriza empresas con alta probabilidad de cierre</li>
              <li>Contacta con clientes potenciales que mostraron interés anteriormente</li>
              <li>Actualiza las fichas de visita con productos ofrecidos</li>
              ${isOffice ? '<li>Coordina con tu equipo de gestores para identificar oportunidades</li>' : '<li>Consulta con tu responsable comercial para apoyo adicional</li>'}
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 25px; text-align: center;">
            Accede a tu dashboard para más detalles y seguimiento de objetivos.
          </p>
        </div>
        
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
          Este es un correo automático del sistema de alertas de rendimiento.<br>
          © ${new Date().getFullYear()} Creand - Gestión Comercial
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: "Alertas Creand <onboarding@resend.dev>",
      to: [recipient.email],
      subject,
      html,
    });

    if (error) {
      console.error(`Error sending email to ${recipient.email}:`, error);
      return false;
    }
    
    console.log(`Email sent successfully to ${recipient.email}`);
    return true;
  } catch (error) {
    console.error(`Exception sending email to ${recipient.email}:`, error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthLabel = monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    console.log(`Checking low performance for ${monthLabel}`);

    // Get all contracted products this month with company info
    const { data: monthProducts, error: productsError } = await supabase
      .from('company_products')
      .select(`
        id, contract_date,
        company:companies(oficina, gestor_id)
      `)
      .gte('contract_date', monthStart.toISOString().split('T')[0])
      .lte('contract_date', monthEnd.toISOString().split('T')[0])
      .eq('active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    // Count products by office and gestor
    const officeProducts: Record<string, number> = {};
    const gestorProducts: Record<string, number> = {};

    for (const product of monthProducts || []) {
      const company = product.company as unknown as { oficina: string; gestor_id: string } | null;
      if (company?.oficina) {
        officeProducts[company.oficina] = (officeProducts[company.oficina] || 0) + 1;
      }
      if (company?.gestor_id) {
        gestorProducts[company.gestor_id] = (gestorProducts[company.gestor_id] || 0) + 1;
      }
    }

    // Get all offices from companies
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('oficina')
      .not('oficina', 'is', null);

    const allOffices = [...new Set((allCompanies || []).map(c => c.oficina).filter(Boolean))];

    // Get all gestores with email
    const { data: allGestores } = await supabase
      .from('profiles')
      .select('id, full_name, oficina, email');

    // Get directors for notifications
    const { data: directors } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('role', ['director_comercial', 'superadmin', 'director_oficina', 'responsable_comercial']);

    const alertsCreated: string[] = [];
    const emailsSent: string[] = [];

    // Check offices below minimum
    for (const oficina of allOffices) {
      const productCount = officeProducts[oficina as string] || 0;
      
      if (productCount < MINIMUM_PRODUCTS_OFFICE) {
        const officeDirectors = (directors || []).filter(d => {
          if (d.role === 'director_comercial' || d.role === 'superadmin' || d.role === 'responsable_comercial') {
            return true;
          }
          if (d.role === 'director_oficina') {
            const directorProfile = (allGestores || []).find(g => g.id === d.user_id);
            return directorProfile?.oficina === oficina;
          }
          return false;
        });

        for (const director of officeDirectors) {
          const directorProfile = (allGestores || []).find(g => g.id === director.user_id);
          
          // Check if notification already exists this month
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', director.user_id)
            .ilike('title', '%Bajo Rendimiento de Oficina%')
            .ilike('message', `%${oficina}%`)
            .gte('created_at', monthStart.toISOString())
            .maybeSingle();

          if (!existingNotif) {
            // Create in-app notification
            await supabase.from('notifications').insert({
              user_id: director.user_id,
              title: '⚠️ Bajo Rendimiento de Oficina',
              message: `La oficina ${oficina} solo tiene ${productCount} producto(s) contratado(s) en ${monthLabel}. Mínimo requerido: ${MINIMUM_PRODUCTS_OFFICE}`,
              severity: productCount === 0 ? 'error' : 'warning'
            });
            alertsCreated.push(`Office: ${oficina}`);

            // Send email notification
            if (directorProfile?.email) {
              const sent = await sendLowPerformanceEmail({
                email: directorProfile.email,
                name: directorProfile.full_name || 'Director',
                type: 'office',
                oficina: oficina as string,
                productCount,
                minimum: MINIMUM_PRODUCTS_OFFICE,
                monthLabel
              });
              if (sent) emailsSent.push(directorProfile.email);
            }
          }
        }
      }
    }

    // Check gestores below minimum
    for (const gestor of allGestores || []) {
      const productCount = gestorProducts[gestor.id] || 0;
      
      if (productCount < MINIMUM_PRODUCTS_GESTOR) {
        // Check if notification already exists for gestor
        const { data: existingGestorNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', gestor.id)
          .ilike('title', '%Productos Contratados%')
          .gte('created_at', monthStart.toISOString())
          .maybeSingle();

        if (!existingGestorNotif) {
          // Create in-app notification for gestor
          await supabase.from('notifications').insert({
            user_id: gestor.id,
            title: '📊 Alerta de Productos Contratados',
            message: `Este mes tienes ${productCount} producto(s) contratado(s). El objetivo mínimo es ${MINIMUM_PRODUCTS_GESTOR} producto(s) mensuales.`,
            severity: productCount === 0 ? 'error' : 'warning'
          });
          alertsCreated.push(`Gestor: ${gestor.full_name}`);

          // Send email to gestor
          if (gestor.email) {
            const sent = await sendLowPerformanceEmail({
              email: gestor.email,
              name: gestor.full_name || 'Gestor',
              type: 'gestor',
              productCount,
              minimum: MINIMUM_PRODUCTS_GESTOR,
              monthLabel
            });
            if (sent) emailsSent.push(gestor.email);
          }
        }

        // Notify office director
        if (gestor.oficina) {
          const officeDirector = (directors || []).find(d => {
            if (d.role === 'director_oficina') {
              const directorProfile = (allGestores || []).find(g => g.id === d.user_id);
              return directorProfile?.oficina === gestor.oficina;
            }
            return false;
          });

          if (officeDirector) {
            const { data: existingDirNotif } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', officeDirector.user_id)
              .ilike('message', `%${gestor.full_name}%`)
              .ilike('title', '%Gestor Bajo Mínimo%')
              .gte('created_at', monthStart.toISOString())
              .maybeSingle();

            if (!existingDirNotif) {
              await supabase.from('notifications').insert({
                user_id: officeDirector.user_id,
                title: '👤 Gestor Bajo Mínimo de Productos',
                message: `${gestor.full_name} tiene ${productCount} producto(s) contratado(s) en ${monthLabel}. Mínimo: ${MINIMUM_PRODUCTS_GESTOR}`,
                severity: productCount === 0 ? 'error' : 'warning'
              });
            }
          }
        }

        // Notify commercial directors and superadmins
        const commercialDirectors = (directors || []).filter(d => 
          d.role === 'director_comercial' || d.role === 'superadmin'
        );

        for (const cd of commercialDirectors) {
          const { data: existingCdNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', cd.user_id)
            .ilike('message', `%${gestor.full_name}%`)
            .ilike('title', '%Gestor Bajo Mínimo%')
            .gte('created_at', monthStart.toISOString())
            .maybeSingle();

          if (!existingCdNotif) {
            await supabase.from('notifications').insert({
              user_id: cd.user_id,
              title: '👤 Gestor Bajo Mínimo de Productos',
              message: `${gestor.full_name} (${gestor.oficina || 'Sin oficina'}) tiene ${productCount} producto(s) en ${monthLabel}. Mínimo: ${MINIMUM_PRODUCTS_GESTOR}`,
              severity: productCount === 0 ? 'error' : 'warning'
            });
          }
        }
      }
    }

    console.log(`Alerts created: ${alertsCreated.length}, Emails sent: ${emailsSent.length}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertsCreated: alertsCreated.length,
        emailsSent: emailsSent.length,
        details: alertsCreated,
        emailRecipients: emailsSent
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
