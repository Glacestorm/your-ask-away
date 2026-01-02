import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvisorRequest {
  action: 'analyze' | 'monitor' | 'get_alerts' | 'dismiss_alert' | 'get_config' | 'update_config';
  company_id: string;
  user_id?: string;
  params?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, company_id, user_id, params } = await req.json() as AdvisorRequest;

    console.log(`[erp-advisor-agent] Action: ${action}, Company: ${company_id}`);

    // Get or create agent config
    const getConfig = async () => {
      const { data: existing } = await supabase
        .from('erp_advisor_agent_config')
        .select('*')
        .eq('company_id', company_id)
        .single();

      if (existing) return existing;

      // Get company country
      const { data: company } = await supabase
        .from('erp_companies')
        .select('country')
        .eq('id', company_id)
        .single();

      const { data: newConfig, error } = await supabase
        .from('erp_advisor_agent_config')
        .insert({
          company_id,
          is_active: true,
          country_code: company?.country || 'ES',
          specializations: ['accounting', 'tax', 'treasury'],
          alert_thresholds_json: {
            balance_mismatch: 0.01,
            overdue_days: 30,
            reconciliation_pending_days: 7,
            vat_filing_reminder_days: 5
          },
          notification_preferences: {
            email: true,
            in_app: true,
            critical_only: false
          }
        })
        .select()
        .single();

      if (error) throw error;
      return newConfig;
    };

    // Create alert
    const createAlert = async (alertData: {
      alert_type: string;
      severity: string;
      title: string;
      description: string;
      recommendation?: string;
      affected_entities?: any[];
    }) => {
      const { error } = await supabase.from('erp_advisor_alerts').insert({
        company_id,
        ...alertData,
        affected_entities_json: alertData.affected_entities || null,
      });
      if (error) console.error('Error creating alert:', error);
    };

    // Monitor journal entries
    const monitorJournalEntries = async () => {
      const issues: any[] = [];

      // Check for unbalanced entries (should not exist due to trigger, but double-check)
      const { data: entries } = await supabase
        .from('erp_journal_entries')
        .select(`
          id, entry_number, entry_date, description,
          erp_journal_entry_lines(debit_amount, credit_amount)
        `)
        .eq('company_id', company_id)
        .eq('status', 'posted')
        .order('entry_date', { ascending: false })
        .limit(100);

      entries?.forEach((entry: any) => {
        const totalDebit = entry.erp_journal_entry_lines?.reduce((sum: number, l: any) => sum + (l.debit_amount || 0), 0) || 0;
        const totalCredit = entry.erp_journal_entry_lines?.reduce((sum: number, l: any) => sum + (l.credit_amount || 0), 0) || 0;
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          issues.push({
            type: 'balance_mismatch',
            entity_type: 'journal_entry',
            entity_id: entry.id,
            message: `Asiento ${entry.entry_number} descuadrado: Debe ${totalDebit.toFixed(2)} ≠ Haber ${totalCredit.toFixed(2)}`,
            severity: 'error'
          });
        }
      });

      // Check for entries in closed periods
      const { data: closedPeriodEntries } = await supabase
        .from('erp_journal_entries')
        .select(`
          id, entry_number, period_id,
          erp_periods!inner(status, period_name)
        `)
        .eq('company_id', company_id)
        .eq('erp_periods.status', 'closed')
        .eq('status', 'draft');

      closedPeriodEntries?.forEach((entry: any) => {
        issues.push({
          type: 'draft_in_closed_period',
          entity_type: 'journal_entry',
          entity_id: entry.id,
          message: `Asiento ${entry.entry_number} en borrador en período cerrado`,
          severity: 'warning'
        });
      });

      return issues;
    };

    // Monitor receivables and payables
    const monitorTreasury = async () => {
      const issues: any[] = [];
      const today = new Date().toISOString().split('T')[0];

      // Overdue receivables
      const { data: overdueReceivables } = await supabase
        .from('erp_receivables')
        .select('id, due_date, amount, remaining_amount, customer_id')
        .eq('company_id', company_id)
        .eq('status', 'pending')
        .lt('due_date', today);

      if (overdueReceivables && overdueReceivables.length > 0) {
        const totalOverdue = overdueReceivables.reduce((sum, r) => sum + (r.remaining_amount || 0), 0);
        issues.push({
          type: 'overdue_receivables',
          count: overdueReceivables.length,
          total: totalOverdue,
          message: `${overdueReceivables.length} cobros vencidos por ${totalOverdue.toFixed(2)}€`,
          severity: totalOverdue > 10000 ? 'error' : 'warning'
        });
      }

      // Overdue payables
      const { data: overduePayables } = await supabase
        .from('erp_payables')
        .select('id, due_date, amount, remaining_amount, supplier_id')
        .eq('company_id', company_id)
        .eq('status', 'pending')
        .lt('due_date', today);

      if (overduePayables && overduePayables.length > 0) {
        const totalOverdue = overduePayables.reduce((sum, p) => sum + (p.remaining_amount || 0), 0);
        issues.push({
          type: 'overdue_payables',
          count: overduePayables.length,
          total: totalOverdue,
          message: `${overduePayables.length} pagos vencidos por ${totalOverdue.toFixed(2)}€`,
          severity: totalOverdue > 10000 ? 'error' : 'warning'
        });
      }

      // Upcoming payments (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const { data: upcomingPayments } = await supabase
        .from('erp_payables')
        .select('id, due_date, remaining_amount')
        .eq('company_id', company_id)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', nextWeek.toISOString().split('T')[0]);

      if (upcomingPayments && upcomingPayments.length > 0) {
        const totalUpcoming = upcomingPayments.reduce((sum, p) => sum + (p.remaining_amount || 0), 0);
        issues.push({
          type: 'upcoming_payments',
          count: upcomingPayments.length,
          total: totalUpcoming,
          message: `${upcomingPayments.length} pagos próximos (7 días) por ${totalUpcoming.toFixed(2)}€`,
          severity: 'info'
        });
      }

      return issues;
    };

    // Monitor bank reconciliation
    const monitorReconciliation = async () => {
      const issues: any[] = [];

      // Unreconciled bank statement lines
      const { data: unreconciledLines, count } = await supabase
        .from('erp_bank_statement_lines')
        .select('id, amount, transaction_date', { count: 'exact' })
        .eq('is_reconciled', false);

      if (count && count > 0) {
        issues.push({
          type: 'pending_reconciliation',
          count,
          message: `${count} movimientos bancarios pendientes de conciliar`,
          severity: count > 50 ? 'warning' : 'info'
        });
      }

      return issues;
    };

    // AI Analysis with recommendations
    const performAIAnalysis = async (issues: any[]) => {
      if (!LOVABLE_API_KEY || issues.length === 0) return null;

      const systemPrompt = `Eres un asesor contable experto especializado en normativa española y europea.
Analiza los problemas detectados y proporciona recomendaciones claras y accionables.

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": "Resumen ejecutivo de la situación",
  "priorities": [
    {"issue": "descripción", "priority": "alta|media|baja", "recommendation": "acción a tomar"}
  ],
  "compliance_risks": ["lista de riesgos normativos si los hay"],
  "optimization_suggestions": ["sugerencias de optimización fiscal/contable"]
}`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Analiza estos problemas detectados: ${JSON.stringify(issues)}` }
            ],
            temperature: 0.3,
            max_tokens: 1500,
          }),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        const jsonMatch = content?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('[erp-advisor-agent] AI analysis error:', e);
      }

      return null;
    };

    let result: any = {};

    switch (action) {
      case 'get_config':
        result.config = await getConfig();
        break;

      case 'update_config':
        const { error: updateError } = await supabase
          .from('erp_advisor_agent_config')
          .update(params)
          .eq('company_id', company_id);
        
        if (updateError) throw updateError;
        result.success = true;
        break;

      case 'get_alerts':
        const { data: alerts } = await supabase
          .from('erp_advisor_alerts')
          .select('*')
          .eq('company_id', company_id)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(params?.limit || 20);
        
        result.alerts = alerts || [];
        break;

      case 'dismiss_alert':
        if (!params?.alert_id) throw new Error('alert_id requerido');
        
        await supabase
          .from('erp_advisor_alerts')
          .update({ 
            is_dismissed: true, 
            action_taken: params?.action_taken 
          })
          .eq('id', params.alert_id);
        
        result.success = true;
        break;

      case 'monitor':
      case 'analyze':
        const config = await getConfig();
        
        if (!config.is_active) {
          result = { active: false, message: 'Agente desactivado' };
          break;
        }

        // Run all monitors
        const journalIssues = await monitorJournalEntries();
        const treasuryIssues = await monitorTreasury();
        const reconciliationIssues = await monitorReconciliation();

        const allIssues = [...journalIssues, ...treasuryIssues, ...reconciliationIssues];

        // Create alerts for critical issues
        for (const issue of allIssues.filter(i => i.severity === 'error')) {
          await createAlert({
            alert_type: issue.type,
            severity: 'critical',
            title: issue.type.replace(/_/g, ' ').toUpperCase(),
            description: issue.message,
            recommendation: `Revisar y corregir inmediatamente`,
            affected_entities: issue.entity_id ? [{ type: issue.entity_type, id: issue.entity_id }] : undefined
          });
        }

        // AI analysis
        const aiAnalysis = await performAIAnalysis(allIssues);

        // Log process audit
        await supabase.from('erp_advisor_process_audit').insert({
          company_id,
          process_type: 'full_monitor',
          entity_type: 'company',
          entity_id: company_id,
          validation_result: allIssues.length === 0 ? 'passed' : 'issues_found',
          issues_found_json: allIssues,
          recommendations_json: aiAnalysis
        });

        result = {
          issues: allIssues,
          summary: {
            total: allIssues.length,
            errors: allIssues.filter(i => i.severity === 'error').length,
            warnings: allIssues.filter(i => i.severity === 'warning').length,
            info: allIssues.filter(i => i.severity === 'info').length
          },
          aiAnalysis,
          timestamp: new Date().toISOString()
        };
        break;
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-advisor-agent] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
