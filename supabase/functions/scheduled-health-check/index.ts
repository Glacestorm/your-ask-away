import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModuleCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  checks: { name: string; status: string; message: string }[];
  errorDetails?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine check type based on current hour (Madrid timezone)
    const now = new Date();
    const madridHour = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' })).getHours();
    const checkType = madridHour >= 6 && madridHour < 12 ? 'morning' : 'night';
    
    console.log(`Starting ${checkType} health check at ${now.toISOString()}`);

    const moduleResults: ModuleCheck[] = [];

    // 1. Check Authentication Module
    const authChecks: ModuleCheck['checks'] = [];
    try {
      const { count: rolesCount } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
      authChecks.push({ name: 'Tabla user_roles', status: rolesCount !== null ? 'passed' : 'failed', message: `${rolesCount || 0} registros` });
      
      const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      authChecks.push({ name: 'Tabla profiles', status: profilesCount !== null ? 'passed' : 'failed', message: `${profilesCount || 0} usuarios` });
    } catch (e: any) {
      authChecks.push({ name: 'Error general', status: 'failed', message: e.message });
    }
    moduleResults.push({
      name: 'Autenticación y Roles',
      status: authChecks.some(c => c.status === 'failed') ? 'error' : 'healthy',
      checks: authChecks
    });

    // 2. Check Companies Module
    const companiesChecks: ModuleCheck['checks'] = [];
    try {
      const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      companiesChecks.push({ name: 'Tabla companies', status: 'passed', message: `${companyCount || 0} empresas` });
      
      const { count: contactsCount } = await supabase.from('company_contacts').select('*', { count: 'exact', head: true });
      companiesChecks.push({ name: 'Tabla contactos', status: 'passed', message: `${contactsCount || 0} contactos` });
      
      const { count: productsCount } = await supabase.from('company_products').select('*', { count: 'exact', head: true });
      companiesChecks.push({ name: 'Productos empresa', status: 'passed', message: `${productsCount || 0} productos` });
    } catch (e: any) {
      companiesChecks.push({ name: 'Error general', status: 'failed', message: e.message });
    }
    moduleResults.push({
      name: 'Gestión de Empresas',
      status: companiesChecks.some(c => c.status === 'failed') ? 'error' : 'healthy',
      checks: companiesChecks
    });

    // 3. Check Visits Module
    const visitsChecks: ModuleCheck['checks'] = [];
    try {
      const { count: visitCount } = await supabase.from('visits').select('*', { count: 'exact', head: true });
      visitsChecks.push({ name: 'Tabla visits', status: 'passed', message: `${visitCount || 0} visitas` });
      
      const { count: sheetCount } = await supabase.from('visit_sheets').select('*', { count: 'exact', head: true });
      visitsChecks.push({ name: 'Fichas de visita', status: 'passed', message: `${sheetCount || 0} fichas` });
    } catch (e: any) {
      visitsChecks.push({ name: 'Error general', status: 'failed', message: e.message });
    }
    moduleResults.push({
      name: 'Visitas y Fichas',
      status: visitsChecks.some(c => c.status === 'failed') ? 'error' : 'healthy',
      checks: visitsChecks
    });

    // 4. Check Accounting Module
    const accountingChecks: ModuleCheck['checks'] = [];
    try {
      const { count: statementsCount } = await supabase.from('company_financial_statements').select('*', { count: 'exact', head: true });
      accountingChecks.push({ name: 'Estados financieros', status: 'passed', message: `${statementsCount || 0} estados` });
      
      const { count: balancesCount } = await supabase.from('balance_sheets').select('*', { count: 'exact', head: true });
      accountingChecks.push({ name: 'Balances', status: 'passed', message: `${balancesCount || 0} balances` });
    } catch (e: any) {
      accountingChecks.push({ name: 'Error general', status: 'failed', message: e.message });
    }
    moduleResults.push({
      name: 'Contabilidad',
      status: accountingChecks.some(c => c.status === 'failed') ? 'error' : 'healthy',
      checks: accountingChecks
    });

    // 5. Check Goals Module
    const goalsChecks: ModuleCheck['checks'] = [];
    try {
      const { count: goalCount } = await supabase.from('goals').select('*', { count: 'exact', head: true });
      goalsChecks.push({ name: 'Objetivos', status: 'passed', message: `${goalCount || 0} objetivos` });
      
      const { count: plansCount } = await supabase.from('action_plans').select('*', { count: 'exact', head: true });
      goalsChecks.push({ name: 'Planes de acción', status: 'passed', message: `${plansCount || 0} planes` });
    } catch (e: any) {
      goalsChecks.push({ name: 'Error general', status: 'failed', message: e.message });
    }
    moduleResults.push({
      name: 'Objetivos y Metas',
      status: goalsChecks.some(c => c.status === 'failed') ? 'error' : 'healthy',
      checks: goalsChecks
    });

    // 6. Check Notifications Module
    const notifChecks: ModuleCheck['checks'] = [];
    try {
      const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true });
      notifChecks.push({ name: 'Notificaciones', status: 'passed', message: `${notifCount || 0} notificaciones` });
      
      const { count: alertsCount } = await supabase.from('alerts').select('*', { count: 'exact', head: true });
      notifChecks.push({ name: 'Alertas', status: 'passed', message: `${alertsCount || 0} alertas` });
    } catch (e: any) {
      notifChecks.push({ name: 'Error general', status: 'failed', message: e.message });
    }
    moduleResults.push({
      name: 'Notificaciones',
      status: notifChecks.some(c => c.status === 'failed') ? 'error' : 'healthy',
      checks: notifChecks
    });

    // 7. Check Storage Module
    const storageChecks: ModuleCheck['checks'] = [];
    const buckets = ['avatars', 'company-photos', 'company-documents', 'visit-sheet-photos'];
    for (const bucket of buckets) {
      try {
        const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });
        storageChecks.push({ name: `Bucket ${bucket}`, status: error ? 'failed' : 'passed', message: error ? error.message : 'Accesible' });
      } catch (e: any) {
        storageChecks.push({ name: `Bucket ${bucket}`, status: 'failed', message: e.message });
      }
    }
    moduleResults.push({
      name: 'Almacenamiento',
      status: storageChecks.some(c => c.status === 'failed') ? 'error' : storageChecks.some(c => c.status === 'warning') ? 'warning' : 'healthy',
      checks: storageChecks
    });

    // 8. Check Database Performance
    const dbChecks: ModuleCheck['checks'] = [];
    const startTime = Date.now();
    try {
      await supabase.from('profiles').select('id').limit(1);
      const responseTime = Date.now() - startTime;
      dbChecks.push({ 
        name: 'Tiempo de respuesta DB', 
        status: responseTime < 200 ? 'passed' : responseTime < 1000 ? 'warning' : 'failed', 
        message: `${responseTime}ms` 
      });
    } catch (e: any) {
      dbChecks.push({ name: 'Conexión DB', status: 'failed', message: e.message });
    }
    moduleResults.push({
      name: 'Rendimiento Base de Datos',
      status: dbChecks.some(c => c.status === 'failed') ? 'error' : dbChecks.some(c => c.status === 'warning') ? 'warning' : 'healthy',
      checks: dbChecks
    });

    // Calculate overall status
    const healthyCount = moduleResults.filter(m => m.status === 'healthy').length;
    const warningCount = moduleResults.filter(m => m.status === 'warning').length;
    const errorCount = moduleResults.filter(m => m.status === 'error').length;
    const overallStatus = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';

    // Save health check to database
    const { data: healthCheck, error: insertError } = await supabase
      .from('scheduled_health_checks')
      .insert({
        check_type: checkType,
        overall_status: overallStatus,
        total_modules: moduleResults.length,
        healthy_modules: healthyCount,
        warning_modules: warningCount,
        error_modules: errorCount,
        details: moduleResults
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving health check:', insertError);
    }

    // Log diagnostic results
    for (const module of moduleResults) {
      if (module.status !== 'healthy') {
        await supabase.from('system_diagnostic_logs').insert({
          diagnostic_type: 'scheduled',
          module_key: module.name.toLowerCase().replace(/\s+/g, '_'),
          status: module.status,
          checks: module.checks,
          error_details: module.errorDetails
        });
      }
    }

    // Send email notification to admins
    if (resendApiKey) {
      
      // Get admin emails
      const { data: admins } = await supabase
        .from('profiles')
        .select('email')
        .in('id', (
          await supabase.from('user_roles').select('user_id').in('role', ['superadmin', 'admin'])
        ).data?.map(r => r.user_id) || []);

      const adminEmails = admins?.map(a => a.email).filter(Boolean) || [];
      
      if (adminEmails.length > 0) {
        const statusEmoji = overallStatus === 'healthy' ? '✅' : overallStatus === 'warning' ? '⚠️' : '❌';
        const statusText = overallStatus === 'healthy' ? 'SALUDABLE' : overallStatus === 'warning' ? 'CON ADVERTENCIAS' : 'CON ERRORES';
        
        const moduleRows = moduleResults.map(m => {
          const moduleEmoji = m.status === 'healthy' ? '✅' : m.status === 'warning' ? '⚠️' : '❌';
          const checksDetails = m.checks.map(c => 
            `<li style="margin: 4px 0;"><span style="color: ${c.status === 'passed' ? '#22c55e' : c.status === 'warning' ? '#f59e0b' : '#ef4444'}">${c.status === 'passed' ? '✓' : c.status === 'warning' ? '!' : '✗'}</span> <strong>${c.name}:</strong> ${c.message}</li>`
          ).join('');
          return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 16px; vertical-align: top;">
                <strong style="font-size: 16px;">${moduleEmoji} ${m.name}</strong>
              </td>
              <td style="padding: 16px; vertical-align: top;">
                <span style="background: ${m.status === 'healthy' ? '#dcfce7' : m.status === 'warning' ? '#fef3c7' : '#fee2e2'}; color: ${m.status === 'healthy' ? '#166534' : m.status === 'warning' ? '#92400e' : '#991b1b'}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">${m.status.toUpperCase()}</span>
              </td>
              <td style="padding: 16px; vertical-align: top;">
                <ul style="margin: 0; padding-left: 16px; list-style: none;">${checksDetails}</ul>
              </td>
            </tr>
          `;
        }).join('');

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Informe de Salud del Sistema - ${checkType === 'morning' ? 'Mañana' : 'Noche'}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🏥 Informe de Salud del Sistema</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">
        Chequeo ${checkType === 'morning' ? 'Matutino' : 'Nocturno'} - ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
    
    <!-- Summary -->
    <div style="background: white; padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 64px; margin-bottom: 16px;">${statusEmoji}</div>
        <h2 style="margin: 0; color: ${overallStatus === 'healthy' ? '#166534' : overallStatus === 'warning' ? '#92400e' : '#991b1b'}; font-size: 24px;">
          Estado General: ${statusText}
        </h2>
        <p style="color: #6b7280; margin: 8px 0 0 0;">
          Generado el ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
        </p>
      </div>
      
      <!-- Stats Grid -->
      <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 32px; flex-wrap: wrap;">
        <div style="background: #dcfce7; padding: 20px 32px; border-radius: 12px; text-align: center; min-width: 120px;">
          <div style="font-size: 32px; font-weight: bold; color: #166534;">${healthyCount}</div>
          <div style="color: #166534; font-size: 14px; margin-top: 4px;">Módulos OK</div>
        </div>
        <div style="background: #fef3c7; padding: 20px 32px; border-radius: 12px; text-align: center; min-width: 120px;">
          <div style="font-size: 32px; font-weight: bold; color: #92400e;">${warningCount}</div>
          <div style="color: #92400e; font-size: 14px; margin-top: 4px;">Advertencias</div>
        </div>
        <div style="background: #fee2e2; padding: 20px 32px; border-radius: 12px; text-align: center; min-width: 120px;">
          <div style="font-size: 32px; font-weight: bold; color: #991b1b;">${errorCount}</div>
          <div style="color: #991b1b; font-size: 14px; margin-top: 4px;">Errores</div>
        </div>
      </div>
      
      <!-- Detailed Table -->
      <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">📋 Detalle por Módulo</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Módulo</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Estado</th>
            <th style="padding: 12px 16px; text-align: left; font-weight: 600; color: #374151;">Verificaciones</th>
          </tr>
        </thead>
        <tbody>
          ${moduleRows}
        </tbody>
      </table>
    </div>
    
    <!-- Footer -->
    <div style="background: #1f2937; border-radius: 0 0 16px 16px; padding: 24px 32px; text-align: center;">
      <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">
        Este es un correo automático generado por el Sistema de Monitorización de Salud.
      </p>
      <p style="color: rgba(255,255,255,0.5); margin: 8px 0 0 0; font-size: 12px;">
        Creand Business Intelligence Platform
      </p>
    </div>
  </div>
</body>
</html>
        `;

        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'Sistema de Salud <onboarding@resend.dev>',
              to: adminEmails,
              subject: `${statusEmoji} Informe de Salud del Sistema [${checkType === 'morning' ? 'Mañana' : 'Noche'}] - ${statusText}`,
              html: emailHtml
            })
          });

          if (!emailResponse.ok) {
            throw new Error(`Email API error: ${emailResponse.status}`);
          }

          // Update health check with email sent status
          if (healthCheck) {
            await supabase
              .from('scheduled_health_checks')
              .update({ email_sent: true, email_sent_at: new Date().toISOString() })
              .eq('id', healthCheck.id);
          }

          console.log(`Email sent to ${adminEmails.length} admins`);
        } catch (emailError: any) {
          console.error('Error sending email:', emailError);
        }
      }
    }

    // If there are errors, trigger AI analysis
    if (errorCount > 0) {
      const errorModules = moduleResults.filter(m => m.status === 'error');
      for (const module of errorModules) {
        // Create AI intervention request
        await supabase.from('ai_interventions').insert({
          issue_description: `Error en módulo ${module.name}: ${module.checks.filter(c => c.status === 'failed').map(c => c.name + ': ' + c.message).join(', ')}`,
          ai_analysis: 'Pendiente de análisis',
          proposed_solution: 'Pendiente de análisis',
          status: 'pending',
          auto_execute_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      checkType,
      overallStatus,
      modules: moduleResults.length,
      healthy: healthyCount,
      warnings: warningCount,
      errors: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Scheduled health check error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
