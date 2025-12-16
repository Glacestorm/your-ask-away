import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  sectorKey: string;
  reportType: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  periodStart: string;
  periodEnd: string;
  templateId?: string;
  generatePdf?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const { sectorKey, reportType, periodStart, periodEnd, templateId }: ReportRequest = await req.json();

    console.log(`Generating ${reportType} audit report for sector ${sectorKey}`);
    console.log(`Period: ${periodStart} to ${periodEnd}`);

    // 1. Fetch template if provided
    let template = null;
    if (templateId) {
      const { data: templateData } = await supabase
        .from('auditor_report_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      template = templateData;
    } else {
      const { data: templateData } = await supabase
        .from('auditor_report_templates')
        .select('*')
        .eq('sector_key', sectorKey)
        .eq('is_active', true)
        .limit(1)
        .single();
      template = templateData;
    }

    // 2. Fetch questions for this sector
    const { data: questions } = await supabase
      .from('auditor_questions')
      .select('*')
      .eq('sector_key', sectorKey)
      .eq('is_active', true)
      .order('priority');

    // 3. Fetch existing responses
    const { data: responses } = await supabase
      .from('auditor_responses')
      .select('*, question:auditor_questions(*)')
      .in('question_id', questions?.map(q => q.id) || []);

    // 4. Collect evidence from various sources
    const evidenceData: Record<string, any> = {};

    // Audit logs
    const { data: auditLogs, count: auditLogsCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd)
      .limit(100);
    evidenceData.audit_logs = { count: auditLogsCount, sample: auditLogs?.slice(0, 10) };

    // Security incidents
    const { data: incidents } = await supabase
      .from('security_incidents')
      .select('*')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);
    evidenceData.security_incidents = incidents || [];

    // Backup verifications
    const { data: backups } = await supabase
      .from('backup_verifications')
      .select('*')
      .gte('verification_date', periodStart)
      .lte('verification_date', periodEnd);
    evidenceData.backup_verifications = backups || [];

    // Risk assessments
    const { data: riskAssessments } = await supabase
      .from('risk_assessments')
      .select('*')
      .gte('assessment_date', periodStart)
      .lte('assessment_date', periodEnd);
    evidenceData.risk_assessments = riskAssessments || [];

    // Resilience tests
    const { data: resilienceTests } = await supabase
      .from('resilience_tests')
      .select('*')
      .gte('test_date', periodStart)
      .lte('test_date', periodEnd);
    evidenceData.resilience_tests = resilienceTests || [];

    // Stress test executions
    const { data: stressTests } = await supabase
      .from('stress_test_executions')
      .select('*')
      .gte('execution_start', periodStart)
      .lte('execution_start', periodEnd);
    evidenceData.stress_tests = stressTests || [];

    // 5. Calculate compliance score
    const totalQuestions = questions?.length || 0;
    const answeredQuestions = responses?.filter(r => r.status === 'approved' || r.status === 'submitted').length || 0;
    const criticalQuestions = questions?.filter(q => q.priority === 'critical').length || 0;
    const answeredCritical = responses?.filter(r => 
      (r.status === 'approved' || r.status === 'submitted') && 
      r.question?.priority === 'critical'
    ).length || 0;

    // Weighted score: critical questions count 2x
    const baseScore = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 50 : 50;
    const criticalScore = criticalQuestions > 0 ? (answeredCritical / criticalQuestions) * 50 : 50;
    const complianceScore = Math.round(baseScore + criticalScore);

    // 6. Generate findings summary
    const findingsSummary = {
      total_questions: totalQuestions,
      answered_questions: answeredQuestions,
      pending_questions: totalQuestions - answeredQuestions,
      critical_pending: criticalQuestions - answeredCritical,
      incidents_count: evidenceData.security_incidents.length,
      incidents_resolved: evidenceData.security_incidents.filter((i: any) => i.status === 'resolved').length,
      backups_verified: evidenceData.backup_verifications.length,
      backups_successful: evidenceData.backup_verifications.filter((b: any) => b.restored_successfully).length,
      stress_tests_passed: evidenceData.stress_tests.filter((s: any) => s.passed).length,
      stress_tests_total: evidenceData.stress_tests.length,
      audit_events_count: evidenceData.audit_logs.count,
    };

    // 7. Build sections data
    const sectionsData = template?.sections?.map((section: any) => {
      const sectionQuestions = questions?.filter(q => 
        q.category.toLowerCase().includes(section.id.replace('_', ' '))
      );
      const sectionResponses = responses?.filter(r => 
        sectionQuestions?.some(q => q.id === r.question_id)
      );

      return {
        ...section,
        questions_count: sectionQuestions?.length || 0,
        answered_count: sectionResponses?.length || 0,
        compliance_percentage: sectionQuestions?.length 
          ? Math.round((sectionResponses?.length || 0) / sectionQuestions.length * 100)
          : 100,
        evidence_collected: true,
      };
    }) || [];

    // 8. Save the report
    const { data: report, error: insertError } = await supabase
      .from('audit_reports_generated')
      .insert({
        sector_key: sectorKey,
        report_period_start: periodStart,
        report_period_end: periodEnd,
        report_type: reportType,
        template_id: template?.id,
        compliance_score: complianceScore,
        findings_summary: findingsSummary,
        sections_data: sectionsData,
        generated_by: user.id,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving report:', insertError);
      throw insertError;
    }

    // 9. Save collected evidence
    const evidenceTypes = [
      { type: 'audit_logs', data: evidenceData.audit_logs },
      { type: 'security_incidents', data: evidenceData.security_incidents },
      { type: 'backup_verifications', data: evidenceData.backup_verifications },
      { type: 'risk_assessments', data: evidenceData.risk_assessments },
      { type: 'resilience_tests', data: evidenceData.resilience_tests },
      { type: 'stress_tests', data: evidenceData.stress_tests },
    ];

    for (const evidence of evidenceTypes) {
      await supabase.from('audit_evidence').insert({
        evidence_type: evidence.type,
        evidence_period_start: periodStart,
        evidence_period_end: periodEnd,
        data: evidence.data,
        source_table: evidence.type,
        is_validated: true,
      });
    }

    console.log(`Report generated successfully with ID: ${report.id}`);

    return new Response(JSON.stringify({
      success: true,
      report: {
        id: report.id,
        compliance_score: complianceScore,
        findings_summary: findingsSummary,
        sections_data: sectionsData,
        questions_count: totalQuestions,
        responses_count: answeredQuestions,
        evidence_types: evidenceTypes.map(e => e.type),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating audit report:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
