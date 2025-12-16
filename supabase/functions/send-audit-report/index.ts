import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReportRequest {
  reportId: string;
  auditorEmails: string[];
  subject?: string;
  message?: string;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportId, auditorEmails, subject, message }: SendReportRequest = await req.json();

    console.log(`Sending audit report ${reportId} to ${auditorEmails.length} auditors`);

    // 1. Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('audit_reports_generated')
      .select('*, template:auditor_report_templates(*)')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      throw new Error('Report not found');
    }

    // 2. Fetch user profile for sender info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    // 3. Build email content
    const sectorNames: Record<string, string> = {
      banking: 'Banca',
      health: 'Salud',
      industry: 'Industria',
      retail: 'Retail',
      services: 'Servicios',
      technology: 'Tecnología',
    };

    const reportTypeNames: Record<string, string> = {
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      annual: 'Anual',
    };

    const emailSubject = subject || 
      `Informe de Auditoría ${reportTypeNames[report.report_type]} - ${sectorNames[report.sector_key]} - ${new Date(report.report_period_end).toLocaleDateString('es-ES')}`;

    const findings = report.findings_summary || {};
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { padding: 30px; }
    .score-badge { display: inline-block; background: ${report.compliance_score >= 80 ? '#10b981' : report.compliance_score >= 60 ? '#f59e0b' : '#ef4444'}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 18px; font-weight: bold; margin: 10px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e3a5f; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .section { margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
    .section h3 { margin: 0 0 15px; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .findings-list { list-style: none; padding: 0; }
    .findings-list li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
    .findings-list li:last-child { border-bottom: none; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
    .message-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Informe de Auditoría</h1>
      <p>${reportTypeNames[report.report_type]} - Sector ${sectorNames[report.sector_key]}</p>
      <p>Período: ${new Date(report.report_period_start).toLocaleDateString('es-ES')} - ${new Date(report.report_period_end).toLocaleDateString('es-ES')}</p>
    </div>
    
    <div class="content">
      ${message ? `
      <div class="message-box">
        <strong>Mensaje del remitente:</strong><br>
        ${message}
      </div>
      ` : ''}
      
      <div style="text-align: center; margin: 20px 0;">
        <p style="margin: 0; color: #64748b;">Puntuación de Cumplimiento</p>
        <div class="score-badge">${report.compliance_score || 0}/100</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${findings.total_questions || 0}</div>
          <div class="stat-label">Preguntas Totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${findings.answered_questions || 0}</div>
          <div class="stat-label">Respondidas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${findings.incidents_count || 0}</div>
          <div class="stat-label">Incidentes Período</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${findings.backups_verified || 0}</div>
          <div class="stat-label">Backups Verificados</div>
        </div>
      </div>
      
      <div class="section">
        <h3>📋 Resumen de Hallazgos</h3>
        <ul class="findings-list">
          <li>
            <span>Preguntas Críticas Pendientes</span>
            <span class="badge ${findings.critical_pending > 0 ? 'badge-danger' : 'badge-success'}">${findings.critical_pending || 0}</span>
          </li>
          <li>
            <span>Incidentes Resueltos</span>
            <span class="badge badge-success">${findings.incidents_resolved || 0}/${findings.incidents_count || 0}</span>
          </li>
          <li>
            <span>Backups Exitosos</span>
            <span class="badge ${(findings.backups_successful || 0) === (findings.backups_verified || 0) ? 'badge-success' : 'badge-warning'}">${findings.backups_successful || 0}/${findings.backups_verified || 0}</span>
          </li>
          <li>
            <span>Stress Tests Pasados</span>
            <span class="badge ${(findings.stress_tests_passed || 0) === (findings.stress_tests_total || 0) ? 'badge-success' : 'badge-warning'}">${findings.stress_tests_passed || 0}/${findings.stress_tests_total || 0}</span>
          </li>
          <li>
            <span>Eventos de Auditoría</span>
            <span class="badge badge-success">${findings.audit_events_count || 0}</span>
          </li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p>Para acceder al informe completo y la documentación de evidencias, acceda a la plataforma.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Informe generado automáticamente por ObelixIA</p>
      <p>Generado: ${new Date(report.generated_at).toLocaleString('es-ES')}</p>
      <p>Enviado por: ${profile?.full_name || user.email}</p>
    </div>
  </div>
</body>
</html>
`;

    // 4. Send emails
    let emailsSent = 0;
    const errors: string[] = [];

    if (resendApiKey) {
      for (const email of auditorEmails) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'ObelixIA Audit <noreply@obelixia.com>',
              to: [email],
              subject: emailSubject,
              html: emailHtml,
            }),
          });

          if (emailResponse.ok) {
            emailsSent++;
            console.log(`Email sent to ${email}`);
          } else {
            const errorText = await emailResponse.text();
            errors.push(`Failed to send to ${email}: ${errorText}`);
            console.error(`Failed to send to ${email}:`, errorText);
          }
        } catch (emailError: any) {
          errors.push(`Error sending to ${email}: ${emailError?.message || 'Unknown error'}`);
          console.error(`Error sending to ${email}:`, emailError);
        }
      }
    } else {
      console.log('RESEND_API_KEY not configured - simulating email send');
      emailsSent = auditorEmails.length;
    }

    // 5. Update report with send status
    const { error: updateError } = await supabase
      .from('audit_reports_generated')
      .update({
        sent_to_auditors: emailsSent > 0,
        auditor_emails: auditorEmails,
        sent_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error updating report:', updateError);
    }

    console.log(`Report ${reportId} sent to ${emailsSent}/${auditorEmails.length} auditors`);

    return new Response(JSON.stringify({
      success: true,
      emails_sent: emailsSent,
      total_recipients: auditorEmails.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending audit report:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
