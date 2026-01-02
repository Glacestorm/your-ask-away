import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  action: 'check_entry' | 'check_invoice' | 'check_vat' | 'full_audit' | 'get_regulations';
  company_id: string;
  entity_type?: string;
  entity_id?: string;
  country_code?: string;
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

    const { action, company_id, entity_type, entity_id, country_code: requestCountry } = await req.json() as ComplianceRequest;

    console.log(`[erp-advisor-compliance] Action: ${action}, Company: ${company_id}`);

    // Get company info and country
    const { data: company } = await supabase
      .from('erp_companies')
      .select('country, currency, tax_id')
      .eq('id', company_id)
      .single();

    const countryCode = requestCountry || company?.country || 'ES';

    // Get applicable regulations
    const getRegulations = async () => {
      const { data } = await supabase
        .from('erp_accounting_regulations')
        .select('*')
        .eq('country_code', countryCode)
        .eq('is_active', true);
      return data || [];
    };

    // Check journal entry compliance
    const checkJournalEntry = async (entryId: string) => {
      const issues: any[] = [];
      const recommendations: string[] = [];

      const { data: entry } = await supabase
        .from('erp_journal_entries')
        .select(`
          *,
          erp_journal_entry_lines(
            *,
            erp_chart_of_accounts(account_code, account_name, account_type)
          )
        `)
        .eq('id', entryId)
        .single();

      if (!entry) {
        return { valid: false, issues: [{ type: 'not_found', message: 'Asiento no encontrado' }] };
      }

      // Check balance
      const totalDebit = entry.erp_journal_entry_lines?.reduce((sum: number, l: any) => sum + (l.debit_amount || 0), 0) || 0;
      const totalCredit = entry.erp_journal_entry_lines?.reduce((sum: number, l: any) => sum + (l.credit_amount || 0), 0) || 0;

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        issues.push({
          type: 'balance_error',
          severity: 'error',
          message: `Asiento descuadrado: Debe ${totalDebit.toFixed(2)} ≠ Haber ${totalCredit.toFixed(2)}`,
          regulation: 'PGC Art. 28 - Principio de partida doble'
        });
      }

      // Check for required description
      if (!entry.description || entry.description.trim().length < 5) {
        issues.push({
          type: 'missing_description',
          severity: 'warning',
          message: 'Descripción insuficiente del asiento',
          regulation: 'PGC Art. 29 - Registro de operaciones'
        });
        recommendations.push('Añadir descripción detallada que identifique la operación');
      }

      // Check VAT accounts have proper counterpart
      const vatLines = entry.erp_journal_entry_lines?.filter((l: any) => 
        l.erp_chart_of_accounts?.account_code?.startsWith('472') || 
        l.erp_chart_of_accounts?.account_code?.startsWith('477')
      );

      if (vatLines?.length > 0) {
        const hasExpenseOrIncome = entry.erp_journal_entry_lines?.some((l: any) => {
          const code = l.erp_chart_of_accounts?.account_code || '';
          return code.startsWith('6') || code.startsWith('7');
        });

        if (!hasExpenseOrIncome) {
          issues.push({
            type: 'vat_without_base',
            severity: 'warning',
            message: 'IVA registrado sin cuenta de gasto/ingreso asociada',
            regulation: 'Ley 37/1992 del IVA'
          });
        }
      }

      // Check for future dates
      const entryDate = new Date(entry.entry_date);
      const today = new Date();
      if (entryDate > today) {
        issues.push({
          type: 'future_date',
          severity: 'warning',
          message: 'Fecha de asiento en el futuro',
          regulation: 'PGC - Principio de devengo'
        });
      }

      return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        entry_id: entryId,
        issues,
        recommendations
      };
    };

    // Check invoice compliance
    const checkInvoice = async (invoiceId: string, invoiceType: 'sales' | 'purchase') => {
      const issues: any[] = [];
      const recommendations: string[] = [];

      const table = invoiceType === 'sales' ? 'erp_sales_invoices' : 'erp_purchase_invoices';
      const { data: invoice } = await supabase
        .from(table)
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (!invoice) {
        return { valid: false, issues: [{ type: 'not_found', message: 'Factura no encontrada' }] };
      }

      // Check required fields for Spanish invoices
      if (countryCode === 'ES') {
        if (!invoice.invoice_number) {
          issues.push({
            type: 'missing_number',
            severity: 'error',
            message: 'Número de factura obligatorio',
            regulation: 'RD 1619/2012 Art. 6 - Contenido de la factura'
          });
        }

        if (!invoice.invoice_date) {
          issues.push({
            type: 'missing_date',
            severity: 'error',
            message: 'Fecha de factura obligatoria',
            regulation: 'RD 1619/2012 Art. 6'
          });
        }

        // Check VAT is properly calculated
        const baseAmount = invoice.base_amount || invoice.subtotal || 0;
        const taxAmount = invoice.tax_amount || invoice.vat_amount || 0;
        const totalAmount = invoice.total_amount || 0;

        if (Math.abs(baseAmount + taxAmount - totalAmount) > 0.01) {
          issues.push({
            type: 'amount_mismatch',
            severity: 'error',
            message: 'Los importes no cuadran: Base + IVA ≠ Total',
            regulation: 'RD 1619/2012 Art. 6.1.i'
          });
        }
      }

      return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        invoice_id: invoiceId,
        invoice_type: invoiceType,
        issues,
        recommendations
      };
    };

    // Check VAT compliance
    const checkVATCompliance = async () => {
      const issues: any[] = [];
      const recommendations: string[] = [];

      // Get current quarter dates
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
      const year = now.getFullYear();

      // Check VAT register entries
      const { data: vatEntries, count } = await supabase
        .from('erp_vat_register')
        .select('*', { count: 'exact' })
        .eq('company_id', company_id)
        .gte('operation_date', `${year}-01-01`);

      // Check for missing VAT entries
      const { data: invoices } = await supabase
        .from('erp_sales_invoices')
        .select('id, invoice_number')
        .eq('company_id', company_id)
        .gte('invoice_date', `${year}-01-01`)
        .is('vat_register_id', null);

      if (invoices && invoices.length > 0) {
        issues.push({
          type: 'missing_vat_register',
          severity: 'warning',
          message: `${invoices.length} facturas sin registrar en libro de IVA`,
          regulation: 'Art. 62 Ley 37/1992',
          affected: invoices.slice(0, 5).map(i => i.invoice_number)
        });
        recommendations.push('Registrar todas las facturas en el libro de IVA antes del cierre del trimestre');
      }

      // Check filing deadlines
      const filingDeadlines: Record<number, string> = {
        1: `${year}-04-20`,
        2: `${year}-07-20`,
        3: `${year}-10-20`,
        4: `${year + 1}-01-30`
      };

      const deadline = new Date(filingDeadlines[currentQuarter]);
      const daysToDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysToDeadline <= 10 && daysToDeadline > 0) {
        issues.push({
          type: 'upcoming_vat_filing',
          severity: 'warning',
          message: `Declaración IVA T${currentQuarter} vence en ${daysToDeadline} días`,
          regulation: 'Art. 71 Ley 37/1992',
          deadline: filingDeadlines[currentQuarter]
        });
        recommendations.push(`Preparar modelo 303 antes del ${filingDeadlines[currentQuarter]}`);
      }

      return {
        country: countryCode,
        current_quarter: `T${currentQuarter}/${year}`,
        vat_entries_count: count || 0,
        issues,
        recommendations
      };
    };

    // Full compliance audit
    const fullAudit = async () => {
      const results: any = {
        company_id,
        country: countryCode,
        audit_date: new Date().toISOString(),
        sections: {}
      };

      // VAT Compliance
      results.sections.vat = await checkVATCompliance();

      // Get recent entries and check them
      const { data: recentEntries } = await supabase
        .from('erp_journal_entries')
        .select('id')
        .eq('company_id', company_id)
        .order('created_at', { ascending: false })
        .limit(10);

      const entryChecks = await Promise.all(
        (recentEntries || []).map(e => checkJournalEntry(e.id))
      );

      results.sections.journal_entries = {
        checked: entryChecks.length,
        with_issues: entryChecks.filter(c => !c.valid).length,
        details: entryChecks.filter(c => c.issues.length > 0)
      };

      // Get regulations
      const regulations = await getRegulations();
      results.applicable_regulations = regulations.map(r => ({
        type: r.regulation_type,
        name: r.regulation_name,
        code: r.regulation_code
      }));

      // Overall score
      const totalIssues = [
        ...results.sections.vat.issues,
        ...entryChecks.flatMap(c => c.issues)
      ];

      const errorCount = totalIssues.filter(i => i.severity === 'error').length;
      const warningCount = totalIssues.filter(i => i.severity === 'warning').length;

      results.compliance_score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
      results.status = errorCount > 0 ? 'non_compliant' : warningCount > 0 ? 'needs_attention' : 'compliant';

      // Save audit
      await supabase.from('erp_advisor_process_audit').insert({
        company_id,
        process_type: 'compliance_audit',
        entity_type: 'company',
        entity_id: company_id,
        validation_result: results.status,
        issues_found_json: totalIssues,
        recommendations_json: results
      });

      return results;
    };

    let result: any = {};

    switch (action) {
      case 'get_regulations':
        result.regulations = await getRegulations();
        result.country = countryCode;
        break;

      case 'check_entry':
        if (!entity_id) throw new Error('entity_id requerido');
        result = await checkJournalEntry(entity_id);
        break;

      case 'check_invoice':
        if (!entity_id || !entity_type) throw new Error('entity_id y entity_type requeridos');
        result = await checkInvoice(entity_id, entity_type as 'sales' | 'purchase');
        break;

      case 'check_vat':
        result = await checkVATCompliance();
        break;

      case 'full_audit':
        result = await fullAudit();
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
    console.error('[erp-advisor-compliance] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
