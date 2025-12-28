import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccountingRequest {
  action: 'get_dashboard' | 'create_entry' | 'post_entry' | 'reverse_entry' | 
          'get_ledger' | 'get_trial_balance' | 'close_period' | 
          'reconcile_bank' | 'auto_reconcile' | 'generate_fiscal_declaration' |
          'partner_transaction' | 'ai_categorize' |
          'get_balance_sheet' | 'get_income_statement' | 'get_cash_flow' |
          'close_fiscal_period' | 'close_fiscal_year' |
          'get_tax_calendar' | 'get_tax_declarations' |
          // FASE 2: Motor Asientos Automáticos
          'generate_auto_entry' | 'validate_balance' | 'partner_distribution' |
          // FASE 3: Workflow Facturación
          'quote_to_invoice' | 'send_invoice' | 'payment_reminder' | 'register_payment' |
          // FASE 4: Gestión Socios Completa
          'partner_dividend' | 'partner_salary' | 'partner_loan' |
          // FASE 5: Cumplimiento Fiscal ES+AD
          'calculate_vat_303' | 'calculate_irpf_111' | 'calculate_is_200' |
          'calculate_modelo_347' | 'calculate_igi_andorra' | 'calculate_is_andorra' |
          'submit_declaration' | 'generate_closing_entries' |
          // FASE 6: Reporting
          'get_aging_report' | 'get_cash_projection' |
          // FASE 7: Integraciones
          'import_bank_file' | 'export_accounting';
  params?: Record<string, unknown>;
}

// === PLANTILLAS DE ASIENTOS AUTOMÁTICOS ===
const ENTRY_TEMPLATES = {
  // Emisión Factura Venta
  invoice_issued: {
    description: 'Factura de venta',
    lines: [
      { account: '430', type: 'debit', source: 'total' }, // Clientes
      { account: '700', type: 'credit', source: 'base' }, // Ventas
      { account: '477', type: 'credit', source: 'tax' },  // IVA Repercutido
    ]
  },
  // Cobro de Factura
  invoice_collected: {
    description: 'Cobro de factura',
    lines: [
      { account: '572', type: 'debit', source: 'amount' },  // Bancos
      { account: '430', type: 'credit', source: 'amount' }, // Clientes
    ]
  },
  // Factura Proveedor
  supplier_invoice: {
    description: 'Factura de proveedor',
    lines: [
      { account: '600', type: 'debit', source: 'base' },  // Compras
      { account: '472', type: 'debit', source: 'tax' },   // IVA Soportado
      { account: '400', type: 'credit', source: 'total' }, // Proveedores
    ]
  },
  // Pago a Proveedor
  supplier_paid: {
    description: 'Pago a proveedor',
    lines: [
      { account: '400', type: 'debit', source: 'amount' },  // Proveedores
      { account: '572', type: 'credit', source: 'amount' }, // Bancos
    ]
  },
  // Nómina Socio Administrador
  partner_salary: {
    description: 'Retribución administrador',
    lines: [
      { account: '640', type: 'debit', source: 'gross' },  // Sueldos
      { account: '4751', type: 'credit', source: 'irpf' }, // HP Acreedora IRPF
      { account: '465', type: 'credit', source: 'net' },   // Remuneraciones Pend.
    ]
  },
  // Dividendo Socio
  partner_dividend: {
    description: 'Reparto dividendo',
    lines: [
      { account: '129', type: 'debit', source: 'gross' },   // Resultado del ejercicio
      { account: '4751', type: 'credit', source: 'irpf' },  // HP Acreedora IRPF (19%)
      { account: '526', type: 'credit', source: 'net' },    // Dividendo activo a pagar
    ]
  },
  // Aportación Capital Socio
  partner_capital: {
    description: 'Aportación de capital',
    lines: [
      { account: '572', type: 'debit', source: 'amount' },  // Bancos
      { account: '100', type: 'credit', source: 'amount' }, // Capital Social
    ]
  },
  // Préstamo Socio a Sociedad
  partner_loan_in: {
    description: 'Préstamo de socio',
    lines: [
      { account: '572', type: 'debit', source: 'amount' },  // Bancos
      { account: '170', type: 'credit', source: 'amount' }, // Deudas LP entidades crédito
    ]
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, params } = await req.json() as AccountingRequest;

    console.log(`[obelixia-accounting-engine] Action: ${action}`);

    let result: unknown;

    switch (action) {
      // ============================================================
      // DASHBOARD
      // ============================================================
      case 'get_dashboard': {
        const { data: config } = await supabase
          .from('obelixia_fiscal_config')
          .select('*')
          .eq('is_active', true)
          .single();

        const today = new Date().toISOString().split('T')[0];
        const { data: currentPeriod } = await supabase
          .from('obelixia_fiscal_periods')
          .select('*')
          .lte('start_date', today)
          .gte('end_date', today)
          .single();

        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 7)
          .eq('is_active', true);

        const { data: expenseAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 6)
          .eq('is_active', true);

        const incomeIds = incomeAccounts?.map(a => a.id) || [];
        const expenseIds = expenseAccounts?.map(a => a.id) || [];

        let totalIncome = 0;
        let totalExpenses = 0;

        if (incomeIds.length > 0) {
          const { data: incomeBalances } = await supabase
            .from('obelixia_ledger_balances')
            .select('period_credit, period_debit')
            .in('account_id', incomeIds);
          
          totalIncome = (incomeBalances || []).reduce((sum, b) => 
            sum + (b.period_credit - b.period_debit), 0);
        }

        if (expenseIds.length > 0) {
          const { data: expenseBalances } = await supabase
            .from('obelixia_ledger_balances')
            .select('period_debit, period_credit')
            .in('account_id', expenseIds);
          
          totalExpenses = (expenseBalances || []).reduce((sum, b) => 
            sum + (b.period_debit - b.period_credit), 0);
        }

        const { data: recentEntries } = await supabase
          .from('obelixia_journal_entries')
          .select('*')
          .order('entry_date', { ascending: false })
          .limit(10);

        const { data: unreconciledTxns } = await supabase
          .from('obelixia_bank_transactions')
          .select('*')
          .eq('is_reconciled', false)
          .order('transaction_date', { ascending: false })
          .limit(20);

        const { data: pendingDeclarations } = await supabase
          .from('obelixia_fiscal_declarations')
          .select('*')
          .eq('status', 'pending')
          .order('due_date', { ascending: true });

        const { data: partners } = await supabase
          .from('obelixia_partners')
          .select('*')
          .eq('status', 'active');

        // Get cash balance (account 572)
        const { data: cashAccount } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_code', '572')
          .single();

        let cashBalance = 0;
        if (cashAccount) {
          const { data: cashMovements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(status)')
            .eq('account_id', cashAccount.id)
            .eq('journal_entry.status', 'posted');
          
          cashBalance = (cashMovements || []).reduce((sum, m) => 
            sum + (m.debit_amount - m.credit_amount), 0);
        }

        // Get pending receivables (account 430)
        const { data: receivablesAccount } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_code', '430')
          .single();

        let pendingReceivables = 0;
        if (receivablesAccount) {
          const { data: receivablesMovements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(status)')
            .eq('account_id', receivablesAccount.id)
            .eq('journal_entry.status', 'posted');
          
          pendingReceivables = (receivablesMovements || []).reduce((sum, m) => 
            sum + (m.debit_amount - m.credit_amount), 0);
        }

        // Generate alerts
        const alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string; dueDate?: string }> = [];

        // Check for upcoming declaration deadlines
        for (const decl of pendingDeclarations || []) {
          const dueDate = new Date(decl.due_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue < 0) {
            alerts.push({
              type: 'error',
              message: `Declaración ${decl.declaration_type} vencida`,
              dueDate: decl.due_date
            });
          } else if (daysUntilDue <= 7) {
            alerts.push({
              type: 'warning',
              message: `Declaración ${decl.declaration_type} vence en ${daysUntilDue} días`,
              dueDate: decl.due_date
            });
          }
        }

        // Check for unreconciled transactions
        if ((unreconciledTxns?.length || 0) > 10) {
          alerts.push({
            type: 'info',
            message: `${unreconciledTxns?.length} movimientos bancarios pendientes de conciliar`
          });
        }

        result = {
          config,
          currentPeriod,
          kpis: {
            totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            unreconciledCount: unreconciledTxns?.length || 0,
            pendingDeclarations: pendingDeclarations?.length || 0,
          },
          totalIncome,
          totalExpenses,
          netResult: totalIncome - totalExpenses,
          cashBalance,
          pendingReceivables,
          pendingVat: 0, // Calculate from 477-472
          totalAssets: 0,
          totalLiabilities: 0,
          operatingIncome: totalIncome,
          operatingExpenses: totalExpenses,
          recentEntries,
          unreconciledTxns,
          pendingDeclarations,
          partners,
          alerts,
        };
        break;
      }

      // ============================================================
      // FASE 2: MOTOR ASIENTOS AUTOMÁTICOS
      // ============================================================
      case 'generate_auto_entry': {
        const { event_type, event_data, entry_date } = params as {
          event_type: keyof typeof ENTRY_TEMPLATES;
          event_data: {
            total?: number;
            base?: number;
            tax?: number;
            amount?: number;
            gross?: number;
            net?: number;
            irpf?: number;
            description?: string;
            reference_type?: string;
            reference_id?: string;
          };
          entry_date: string;
        };

        const template = ENTRY_TEMPLATES[event_type];
        if (!template) {
          throw new Error(`Tipo de evento no soportado: ${event_type}`);
        }

        // Get fiscal period
        const { data: period } = await supabase
          .from('obelixia_fiscal_periods')
          .select('id, status')
          .lte('start_date', entry_date)
          .gte('end_date', entry_date)
          .single();

        if (!period) {
          throw new Error('No existe período fiscal para esta fecha');
        }
        if (period.status === 'locked') {
          throw new Error('El período fiscal está bloqueado');
        }

        // Build lines from template
        const lines: Array<{ account_code: string; debit_amount: number; credit_amount: number; description?: string }> = [];
        
        for (const lineTemplate of template.lines) {
          const { data: account } = await supabase
            .from('obelixia_chart_of_accounts')
            .select('account_code')
            .eq('account_code', lineTemplate.account)
            .single();

          if (!account) {
            throw new Error(`Cuenta no encontrada: ${lineTemplate.account}`);
          }

          const amount = event_data[lineTemplate.source as keyof typeof event_data] as number || 0;
          
          lines.push({
            account_code: account.account_code,
            debit_amount: lineTemplate.type === 'debit' ? amount : 0,
            credit_amount: lineTemplate.type === 'credit' ? amount : 0,
            description: event_data.description,
          });
        }

        // Validate balance
        const totalDebit = lines.reduce((sum, l) => sum + l.debit_amount, 0);
        const totalCredit = lines.reduce((sum, l) => sum + l.credit_amount, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(`Asiento descuadrado: Debe=${totalDebit}, Haber=${totalCredit}`);
        }

        // Create entry
        const { data: entry, error: entryError } = await supabase
          .from('obelixia_journal_entries')
          .insert({
            entry_date,
            description: `${template.description}${event_data.description ? ': ' + event_data.description : ''}`,
            fiscal_period_id: period.id,
            reference_type: event_data.reference_type,
            reference_id: event_data.reference_id,
            is_automatic: true,
            total_debit: totalDebit,
            total_credit: totalCredit,
            status: 'posted', // Auto entries are posted immediately
            posted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (entryError) throw entryError;

        // Create lines
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const { data: account } = await supabase
            .from('obelixia_chart_of_accounts')
            .select('id')
            .eq('account_code', line.account_code)
            .single();

          if (account) {
            await supabase
              .from('obelixia_journal_entry_lines')
              .insert({
                journal_entry_id: entry.id,
                line_number: i + 1,
                account_id: account.id,
                debit_amount: line.debit_amount,
                credit_amount: line.credit_amount,
                description: line.description,
              });
          }
        }

        result = { entry, lines, message: 'Asiento automático generado y contabilizado' };
        break;
      }

      case 'validate_balance': {
        const { entry_id } = params as { entry_id?: string };

        if (entry_id) {
          // Validate specific entry
          const { data: entry } = await supabase
            .from('obelixia_journal_entries')
            .select('total_debit, total_credit')
            .eq('id', entry_id)
            .single();

          if (!entry) throw new Error('Asiento no encontrado');

          const balanced = Math.abs(entry.total_debit - entry.total_credit) < 0.01;
          result = { 
            balanced, 
            debit: entry.total_debit, 
            credit: entry.total_credit,
            difference: entry.total_debit - entry.total_credit 
          };
        } else {
          // Validate all posted entries
          const { data: entries } = await supabase
            .from('obelixia_journal_entries')
            .select('id, entry_number, total_debit, total_credit')
            .eq('status', 'posted');

          const unbalanced = (entries || []).filter(e => 
            Math.abs(e.total_debit - e.total_credit) > 0.01
          );

          result = {
            total_entries: entries?.length || 0,
            balanced_count: (entries?.length || 0) - unbalanced.length,
            unbalanced_count: unbalanced.length,
            unbalanced_entries: unbalanced
          };
        }
        break;
      }

      case 'partner_distribution': {
        const { amount, distribution_type, fiscal_year } = params as {
          amount: number;
          distribution_type: 'dividend' | 'bonus';
          fiscal_year: number;
        };

        // Get active partners
        const { data: partners } = await supabase
          .from('obelixia_partners')
          .select('*')
          .eq('status', 'active');

        if (!partners || partners.length === 0) {
          throw new Error('No hay socios activos');
        }

        // Get fiscal config for jurisdiction
        const { data: config } = await supabase
          .from('obelixia_fiscal_config')
          .select('jurisdiction')
          .eq('fiscal_year', fiscal_year)
          .eq('is_active', true)
          .single();

        // Tax rates by jurisdiction
        const irpfRate = config?.jurisdiction === 'andorra' ? 0 : 0.19; // Andorra: 0%, España: 19%

        const distributions = partners.map(partner => {
          const grossAmount = (amount * partner.ownership_percentage) / 100;
          const withholding = grossAmount * irpfRate;
          const netAmount = grossAmount - withholding;

          return {
            partner_id: partner.id,
            partner_name: partner.partner_name,
            ownership_percentage: partner.ownership_percentage,
            gross_amount: grossAmount,
            withholding_rate: irpfRate * 100,
            withholding_amount: withholding,
            net_amount: netAmount,
          };
        });

        const totalGross = distributions.reduce((sum, d) => sum + d.gross_amount, 0);
        const totalWithholding = distributions.reduce((sum, d) => sum + d.withholding_amount, 0);
        const totalNet = distributions.reduce((sum, d) => sum + d.net_amount, 0);

        result = {
          distribution_type,
          total_amount: amount,
          jurisdiction: config?.jurisdiction || 'spain',
          distributions,
          totals: {
            gross: totalGross,
            withholding: totalWithholding,
            net: totalNet
          }
        };
        break;
      }

      // ============================================================
      // FASE 3: WORKFLOW FACTURACIÓN
      // ============================================================
      case 'quote_to_invoice': {
        const { quote_id, auto_send } = params as { quote_id: string; auto_send?: boolean };

        // Get quote
        const { data: quote } = await supabase
          .from('service_quotes')
          .select('*')
          .eq('id', quote_id)
          .single();

        if (!quote) throw new Error('Presupuesto no encontrado');
        if (quote.status !== 'accepted') throw new Error('El presupuesto no está aceptado');

        // Generate invoice number: OBX-2025-XXXXX
        const year = new Date().getFullYear();
        const { count } = await supabase
          .from('obelixia_invoices')
          .select('*', { count: 'exact', head: true })
          .gte('issue_date', `${year}-01-01`);

        const invoiceNumber = `OBX-${year}-${String((count || 0) + 1).padStart(5, '0')}`;

        // Calculate due date based on payment terms (default 30 days)
        const issueDate = new Date().toISOString().split('T')[0];
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabase
          .from('obelixia_invoices')
          .insert({
            invoice_number: invoiceNumber,
            quote_id,
            company_id: quote.company_id,
            issue_date: issueDate,
            due_date: dueDate,
            subtotal: quote.subtotal || quote.total,
            tax_rate: 21, // Default IVA
            tax_amount: (quote.subtotal || quote.total) * 0.21,
            total: (quote.subtotal || quote.total) * 1.21,
            status: auto_send ? 'sent' : 'draft',
            sent_at: auto_send ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Update quote status
        await supabase
          .from('service_quotes')
          .update({ status: 'invoiced' })
          .eq('id', quote_id);

        // Generate accounting entry
        if (invoice) {
          await supabase.functions.invoke('obelixia-accounting-engine', {
            body: {
              action: 'generate_auto_entry',
              params: {
                event_type: 'invoice_issued',
                event_data: {
                  total: invoice.total,
                  base: invoice.subtotal,
                  tax: invoice.tax_amount,
                  description: `Factura ${invoiceNumber}`,
                  reference_type: 'invoice',
                  reference_id: invoice.id,
                },
                entry_date: issueDate,
              }
            }
          });
        }

        result = { invoice, message: 'Factura creada correctamente' };
        break;
      }

      case 'send_invoice': {
        const { invoice_id } = params as { invoice_id: string };

        const { data: invoice, error } = await supabase
          .from('obelixia_invoices')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', invoice_id)
          .select()
          .single();

        if (error) throw error;

        // TODO: Send email notification
        
        result = { invoice, message: 'Factura enviada' };
        break;
      }

      case 'payment_reminder': {
        const { invoice_id, reminder_type } = params as { 
          invoice_id?: string; 
          reminder_type: '7_days' | '15_days' | '30_days' 
        };

        const today = new Date().toISOString().split('T')[0];
        
        let query = supabase
          .from('obelixia_invoices')
          .select('*, company:companies(name, email)')
          .eq('status', 'sent')
          .lt('due_date', today);

        if (invoice_id) {
          query = query.eq('id', invoice_id);
        }

        const { data: overdueInvoices } = await query;

        const reminders = [];
        for (const invoice of overdueInvoices || []) {
          const daysOverdue = Math.floor(
            (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Track reminder
          await supabase
            .from('obelixia_invoice_reminders')
            .insert({
              invoice_id: invoice.id,
              reminder_type,
              days_overdue: daysOverdue,
              sent_at: new Date().toISOString(),
            });

          reminders.push({
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            company_name: invoice.company?.name,
            days_overdue: daysOverdue,
            amount: invoice.total,
          });
        }

        result = { 
          reminders_sent: reminders.length, 
          reminders,
          message: `${reminders.length} recordatorios enviados`
        };
        break;
      }

      case 'register_payment': {
        const { invoice_id, amount, payment_date, payment_method, bank_reference } = params as {
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method?: string;
          bank_reference?: string;
        };

        const { data: invoice } = await supabase
          .from('obelixia_invoices')
          .select('*')
          .eq('id', invoice_id)
          .single();

        if (!invoice) throw new Error('Factura no encontrada');

        const previousPaid = invoice.amount_paid || 0;
        const newPaid = previousPaid + amount;
        const isPaid = newPaid >= invoice.total;

        // Update invoice
        const { error: updateError } = await supabase
          .from('obelixia_invoices')
          .update({
            amount_paid: newPaid,
            status: isPaid ? 'paid' : 'partial',
            paid_at: isPaid ? new Date().toISOString() : null,
          })
          .eq('id', invoice_id);

        if (updateError) throw updateError;

        // Record payment
        await supabase
          .from('obelixia_invoice_payments')
          .insert({
            invoice_id,
            amount,
            payment_date,
            payment_method,
            bank_reference,
          });

        // Generate accounting entry for payment
        await supabase.functions.invoke('obelixia-accounting-engine', {
          body: {
            action: 'generate_auto_entry',
            params: {
              event_type: 'invoice_collected',
              event_data: {
                amount,
                description: `Cobro ${invoice.invoice_number}`,
                reference_type: 'payment',
                reference_id: invoice_id,
              },
              entry_date: payment_date,
            }
          }
        });

        result = { 
          invoice_id,
          amount_paid: newPaid,
          remaining: invoice.total - newPaid,
          status: isPaid ? 'paid' : 'partial',
          message: isPaid ? 'Factura cobrada completamente' : 'Pago parcial registrado'
        };
        break;
      }

      // ============================================================
      // FASE 4: GESTIÓN SOCIOS COMPLETA
      // ============================================================
      case 'partner_dividend': {
        const { partner_id, gross_amount, fiscal_year, distribution_date } = params as {
          partner_id: string;
          gross_amount: number;
          fiscal_year: number;
          distribution_date: string;
        };

        // Get partner and config
        const { data: partner } = await supabase
          .from('obelixia_partners')
          .select('*')
          .eq('id', partner_id)
          .single();

        if (!partner) throw new Error('Socio no encontrado');

        const { data: config } = await supabase
          .from('obelixia_fiscal_config')
          .select('jurisdiction')
          .eq('fiscal_year', fiscal_year)
          .eq('is_active', true)
          .single();

        // Calculate withholding
        const irpfRate = config?.jurisdiction === 'andorra' ? 0 : 0.19;
        const withholding = gross_amount * irpfRate;
        const netAmount = gross_amount - withholding;

        // Create transaction
        const { data: transaction, error: txError } = await supabase
          .from('obelixia_partner_transactions')
          .insert({
            partner_id,
            transaction_type: 'dividend',
            transaction_date: distribution_date,
            amount: gross_amount,
            tax_withholding: withholding,
            net_amount: netAmount,
            description: `Dividendo ejercicio ${fiscal_year}`,
            status: 'pending',
          })
          .select()
          .single();

        if (txError) throw txError;

        // Generate accounting entry
        await supabase.functions.invoke('obelixia-accounting-engine', {
          body: {
            action: 'generate_auto_entry',
            params: {
              event_type: 'partner_dividend',
              event_data: {
                gross: gross_amount,
                irpf: withholding,
                net: netAmount,
                description: `Dividendo ${partner.partner_name}`,
                reference_type: 'partner_transaction',
                reference_id: transaction.id,
              },
              entry_date: distribution_date,
            }
          }
        });

        // Update partner current account
        await supabase
          .from('obelixia_partners')
          .update({
            current_account_balance: (partner.current_account_balance || 0) - gross_amount,
          })
          .eq('id', partner_id);

        result = { 
          transaction,
          withholding_summary: {
            gross: gross_amount,
            rate: irpfRate * 100,
            withholding,
            net: netAmount
          },
          message: 'Dividendo registrado correctamente'
        };
        break;
      }

      case 'partner_salary': {
        const { partner_id, gross_amount, irpf_rate, payment_date, concept } = params as {
          partner_id: string;
          gross_amount: number;
          irpf_rate: number;
          payment_date: string;
          concept?: string;
        };

        const { data: partner } = await supabase
          .from('obelixia_partners')
          .select('*')
          .eq('id', partner_id)
          .single();

        if (!partner) throw new Error('Socio no encontrado');
        if (!partner.is_administrator) throw new Error('El socio no es administrador');

        const withholding = gross_amount * (irpf_rate / 100);
        const netAmount = gross_amount - withholding;

        // Create transaction
        const { data: transaction, error: txError } = await supabase
          .from('obelixia_partner_transactions')
          .insert({
            partner_id,
            transaction_type: 'admin_remuneration',
            transaction_date: payment_date,
            amount: gross_amount,
            tax_withholding: withholding,
            net_amount: netAmount,
            description: concept || 'Retribución administrador',
            status: 'pending',
          })
          .select()
          .single();

        if (txError) throw txError;

        // Generate accounting entry
        await supabase.functions.invoke('obelixia-accounting-engine', {
          body: {
            action: 'generate_auto_entry',
            params: {
              event_type: 'partner_salary',
              event_data: {
                gross: gross_amount,
                irpf: withholding,
                net: netAmount,
                description: `Retribución ${partner.partner_name}`,
                reference_type: 'partner_transaction',
                reference_id: transaction.id,
              },
              entry_date: payment_date,
            }
          }
        });

        result = { 
          transaction,
          payroll_summary: {
            gross: gross_amount,
            irpf_rate,
            irpf_amount: withholding,
            net: netAmount
          },
          message: 'Retribución registrada correctamente'
        };
        break;
      }

      case 'partner_loan': {
        const { partner_id, amount, loan_type, interest_rate, start_date, end_date } = params as {
          partner_id: string;
          amount: number;
          loan_type: 'to_company' | 'from_company';
          interest_rate?: number;
          start_date: string;
          end_date?: string;
        };

        const { data: partner } = await supabase
          .from('obelixia_partners')
          .select('*')
          .eq('id', partner_id)
          .single();

        if (!partner) throw new Error('Socio no encontrado');

        // Create loan record
        const { data: loan, error: loanError } = await supabase
          .from('obelixia_partner_loans')
          .insert({
            partner_id,
            loan_type,
            principal_amount: amount,
            interest_rate: interest_rate || 0,
            start_date,
            end_date,
            outstanding_balance: amount,
            status: 'active',
          })
          .select()
          .single();

        if (loanError) throw loanError;

        // Create transaction
        const { data: transaction } = await supabase
          .from('obelixia_partner_transactions')
          .insert({
            partner_id,
            transaction_type: loan_type === 'to_company' ? 'loan_to_company' : 'loan_repayment',
            transaction_date: start_date,
            amount,
            description: `Préstamo ${loan_type === 'to_company' ? 'de socio' : 'a socio'}`,
            status: 'approved',
          })
          .select()
          .single();

        // Generate accounting entry
        await supabase.functions.invoke('obelixia-accounting-engine', {
          body: {
            action: 'generate_auto_entry',
            params: {
              event_type: loan_type === 'to_company' ? 'partner_loan_in' : 'partner_capital',
              event_data: {
                amount,
                description: `Préstamo ${partner.partner_name}`,
                reference_type: 'partner_loan',
                reference_id: loan.id,
              },
              entry_date: start_date,
            }
          }
        });

        // Update partner current account
        const balanceChange = loan_type === 'to_company' ? amount : -amount;
        await supabase
          .from('obelixia_partners')
          .update({
            current_account_balance: (partner.current_account_balance || 0) + balanceChange,
          })
          .eq('id', partner_id);

        result = { 
          loan, 
          transaction,
          message: 'Préstamo registrado correctamente'
        };
        break;
      }

      // ============================================================
      // FASE 5: CUMPLIMIENTO FISCAL ES+AD
      // ============================================================
      case 'calculate_vat_303': {
        const { period, fiscal_year } = params as { period: 'Q1' | 'Q2' | 'Q3' | 'Q4'; fiscal_year: number };

        // Map period to dates
        const periodDates: Record<string, { start: string; end: string }> = {
          Q1: { start: `${fiscal_year}-01-01`, end: `${fiscal_year}-03-31` },
          Q2: { start: `${fiscal_year}-04-01`, end: `${fiscal_year}-06-30` },
          Q3: { start: `${fiscal_year}-07-01`, end: `${fiscal_year}-09-30` },
          Q4: { start: `${fiscal_year}-10-01`, end: `${fiscal_year}-12-31` },
        };

        const dates = periodDates[period];

        // Get IVA accounts
        const { data: ivaRepAccount } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_code', '477')
          .single();

        const { data: ivaSopAccount } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_code', '472')
          .single();

        let ivaRepercutido = 0;
        let ivaSoportado = 0;

        // Get IVA repercutido movements
        if (ivaRepAccount) {
          const { data: repMovs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('credit_amount, debit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', ivaRepAccount.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', dates.start)
            .lte('journal_entry.entry_date', dates.end);

          ivaRepercutido = (repMovs || []).reduce((sum, m) => 
            sum + (m.credit_amount - m.debit_amount), 0);
        }

        // Get IVA soportado movements
        if (ivaSopAccount) {
          const { data: sopMovs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', ivaSopAccount.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', dates.start)
            .lte('journal_entry.entry_date', dates.end);

          ivaSoportado = (sopMovs || []).reduce((sum, m) => 
            sum + (m.debit_amount - m.credit_amount), 0);
        }

        // Calculate bases (reverse from IVA at 21%)
        const baseImponible21 = ivaRepercutido / 0.21;
        const baseDeducible = ivaSoportado / 0.21;

        const resultado = ivaRepercutido - ivaSoportado;
        const aIngresar = Math.max(0, resultado);
        const aCompensar = Math.max(0, -resultado);

        // Due date: 20th of month after quarter
        const dueMonth = parseInt(period.replace('Q', '')) * 3 + 1;
        const dueDate = new Date(fiscal_year, dueMonth - 1, 20).toISOString().split('T')[0];

        // Create or update declaration
        const { data: declaration, error: declError } = await supabase
          .from('obelixia_fiscal_declarations')
          .upsert({
            declaration_type: 'modelo_303',
            fiscal_year,
            declaration_period: period,
            due_date: dueDate,
            status: 'calculated',
            calculated_data: {
              base_imponible_21: baseImponible21,
              cuota_21: ivaRepercutido,
              iva_soportado_deducible: ivaSoportado,
              base_deducible: baseDeducible,
              resultado,
              a_ingresar: aIngresar,
              a_compensar: aCompensar,
            },
            total_amount: aIngresar,
          }, {
            onConflict: 'declaration_type,fiscal_year,declaration_period',
          })
          .select()
          .single();

        if (declError) throw declError;

        result = {
          declaration,
          summary: {
            base_imponible_21: baseImponible21,
            cuota_21: ivaRepercutido,
            total_cuotas_devengadas: ivaRepercutido,
            iva_soportado_deducible: ivaSoportado,
            resultado,
            resultado_liquidacion: aIngresar > 0 ? aIngresar : -aCompensar,
          },
          period,
          fiscal_year,
          due_date: dueDate,
        };
        break;
      }

      case 'calculate_irpf_111': {
        const { period, fiscal_year } = params as { period: 'Q1' | 'Q2' | 'Q3' | 'Q4'; fiscal_year: number };

        // Get IRPF account (4751)
        const { data: irpfAccount } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_code', '4751')
          .single();

        // Map period to dates
        const periodDates: Record<string, { start: string; end: string }> = {
          Q1: { start: `${fiscal_year}-01-01`, end: `${fiscal_year}-03-31` },
          Q2: { start: `${fiscal_year}-04-01`, end: `${fiscal_year}-06-30` },
          Q3: { start: `${fiscal_year}-07-01`, end: `${fiscal_year}-09-30` },
          Q4: { start: `${fiscal_year}-10-01`, end: `${fiscal_year}-12-31` },
        };

        const dates = periodDates[period];
        let totalRetenciones = 0;

        if (irpfAccount) {
          const { data: irpfMovs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('credit_amount, debit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', irpfAccount.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', dates.start)
            .lte('journal_entry.entry_date', dates.end);

          totalRetenciones = (irpfMovs || []).reduce((sum, m) => 
            sum + (m.credit_amount - m.debit_amount), 0);
        }

        // Get partner salary data
        const { data: salaryTxns } = await supabase
          .from('obelixia_partner_transactions')
          .select('*')
          .eq('transaction_type', 'admin_remuneration')
          .gte('transaction_date', dates.start)
          .lte('transaction_date', dates.end);

        const totalRendimientos = (salaryTxns || []).reduce((sum, t) => sum + t.amount, 0);

        // Due date
        const dueMonth = parseInt(period.replace('Q', '')) * 3 + 1;
        const dueDate = new Date(fiscal_year, dueMonth - 1, 20).toISOString().split('T')[0];

        // Create declaration
        const { data: declaration, error: declError } = await supabase
          .from('obelixia_fiscal_declarations')
          .upsert({
            declaration_type: 'modelo_111',
            fiscal_year,
            declaration_period: period,
            due_date: dueDate,
            status: 'calculated',
            calculated_data: {
              rendimientos_trabajo: totalRendimientos,
              retenciones_trabajo: totalRetenciones,
              num_perceptores: salaryTxns?.length || 0,
            },
            total_amount: totalRetenciones,
          }, {
            onConflict: 'declaration_type,fiscal_year,declaration_period',
          })
          .select()
          .single();

        if (declError) throw declError;

        result = {
          declaration,
          summary: {
            rendimientos_trabajo: totalRendimientos,
            retenciones: totalRetenciones,
            perceptores: salaryTxns?.length || 0,
          },
          period,
          fiscal_year,
          due_date: dueDate,
        };
        break;
      }

      case 'calculate_is_200': {
        const { fiscal_year } = params as { fiscal_year: number };

        // Get income and expenses
        const yearStart = `${fiscal_year}-01-01`;
        const yearEnd = `${fiscal_year}-12-31`;

        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 7);

        const { data: expenseAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 6);

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const acc of incomeAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('credit_amount, debit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', yearStart)
            .lte('journal_entry.entry_date', yearEnd);
          
          totalIncome += (movs || []).reduce((s, m) => s + (m.credit_amount - m.debit_amount), 0);
        }

        for (const acc of expenseAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', yearStart)
            .lte('journal_entry.entry_date', yearEnd);
          
          totalExpenses += (movs || []).reduce((s, m) => s + (m.debit_amount - m.credit_amount), 0);
        }

        const resultadoContable = totalIncome - totalExpenses;
        
        // Get jurisdiction for tax rate
        const { data: config } = await supabase
          .from('obelixia_fiscal_config')
          .select('jurisdiction, corporate_tax_rate')
          .eq('fiscal_year', fiscal_year)
          .eq('is_active', true)
          .single();

        // Tax rates: Spain 25%, Andorra 10%
        const taxRate = config?.corporate_tax_rate || (config?.jurisdiction === 'andorra' ? 10 : 25);
        const impuestoSociedades = Math.max(0, resultadoContable) * (taxRate / 100);

        // Due date: July 25 of next year
        const dueDate = `${fiscal_year + 1}-07-25`;

        // Create declaration
        const { data: declaration, error: declError } = await supabase
          .from('obelixia_fiscal_declarations')
          .upsert({
            declaration_type: config?.jurisdiction === 'andorra' ? 'is_andorra' : 'modelo_200',
            fiscal_year,
            declaration_period: 'annual',
            due_date: dueDate,
            status: 'calculated',
            calculated_data: {
              ingresos: totalIncome,
              gastos: totalExpenses,
              resultado_contable: resultadoContable,
              base_imponible: Math.max(0, resultadoContable),
              tipo_gravamen: taxRate,
              cuota_integra: impuestoSociedades,
              cuota_liquida: impuestoSociedades,
            },
            total_amount: impuestoSociedades,
          }, {
            onConflict: 'declaration_type,fiscal_year,declaration_period',
          })
          .select()
          .single();

        if (declError) throw declError;

        result = {
          declaration,
          summary: {
            ingresos: totalIncome,
            gastos: totalExpenses,
            resultado_contable: resultadoContable,
            base_imponible: Math.max(0, resultadoContable),
            tipo_gravamen: taxRate,
            impuesto: impuestoSociedades,
          },
          fiscal_year,
          jurisdiction: config?.jurisdiction || 'spain',
          due_date: dueDate,
        };
        break;
      }

      case 'calculate_modelo_347': {
        const { fiscal_year } = params as { fiscal_year: number };

        // Operations > 3.005,06€ with same counterparty
        const yearStart = `${fiscal_year}-01-01`;
        const yearEnd = `${fiscal_year}-12-31`;

        // Get invoices grouped by company
        const { data: invoices } = await supabase
          .from('obelixia_invoices')
          .select('company_id, total, company:companies(name, tax_id)')
          .gte('issue_date', yearStart)
          .lte('issue_date', yearEnd)
          .in('status', ['sent', 'paid', 'partial']);

        // Group and sum by company
        const byCompany: Record<string, { name: string; tax_id: string; total: number }> = {};
        for (const inv of invoices || []) {
          const companyData = inv.company as { name?: string; tax_id?: string } | null;
          if (!byCompany[inv.company_id]) {
            byCompany[inv.company_id] = {
              name: companyData?.name || 'Desconocido',
              tax_id: companyData?.tax_id || '',
              total: 0
            };
          }
          byCompany[inv.company_id].total += inv.total;
        }

        // Filter > 3.005,06€
        const threshold = 3005.06;
        const declarables = Object.entries(byCompany)
          .filter(([_, data]) => data.total > threshold)
          .map(([company_id, data]) => ({
            company_id,
            name: data.name,
            tax_id: data.tax_id,
            total: data.total,
          }));

        const { data: declaration } = await supabase
          .from('obelixia_fiscal_declarations')
          .upsert({
            declaration_type: 'modelo_347',
            fiscal_year,
            declaration_period: 'annual',
            due_date: `${fiscal_year + 1}-02-28`,
            status: 'calculated',
            calculated_data: {
              threshold,
              declarables,
              total_declarables: declarables.length,
              total_amount: declarables.reduce((s, d) => s + d.total, 0),
            },
            total_amount: declarables.reduce((s, d) => s + d.total, 0),
          }, {
            onConflict: 'declaration_type,fiscal_year,declaration_period',
          })
          .select()
          .single();

        result = {
          declaration,
          declarables,
          summary: {
            total_counterparties: declarables.length,
            total_volume: declarables.reduce((s, d) => s + d.total, 0),
            threshold,
          },
        };
        break;
      }

      case 'calculate_igi_andorra': {
        const { period, fiscal_year } = params as { period: 'Q1' | 'Q2' | 'Q3' | 'Q4'; fiscal_year: number };

        // IGI = Impost General Indirecte (Andorra's VAT equivalent at 4.5%)
        const periodDates: Record<string, { start: string; end: string }> = {
          Q1: { start: `${fiscal_year}-01-01`, end: `${fiscal_year}-03-31` },
          Q2: { start: `${fiscal_year}-04-01`, end: `${fiscal_year}-06-30` },
          Q3: { start: `${fiscal_year}-07-01`, end: `${fiscal_year}-09-30` },
          Q4: { start: `${fiscal_year}-10-01`, end: `${fiscal_year}-12-31` },
        };

        const dates = periodDates[period];

        // Get sales (7xx accounts)
        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 7)
          .eq('is_active', true);

        let totalVentas = 0;
        for (const acc of incomeAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('credit_amount, debit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', dates.start)
            .lte('journal_entry.entry_date', dates.end);
          
          totalVentas += (movs || []).reduce((s, m) => s + (m.credit_amount - m.debit_amount), 0);
        }

        // IGI at 4.5%
        const igiRate = 4.5;
        const igiDevengado = totalVentas * (igiRate / 100);

        // Get purchases for IGI soportado
        const { data: expenseAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 6)
          .eq('is_active', true);

        let totalCompras = 0;
        for (const acc of expenseAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', dates.start)
            .lte('journal_entry.entry_date', dates.end);
          
          totalCompras += (movs || []).reduce((s, m) => s + (m.debit_amount - m.credit_amount), 0);
        }

        const igiSoportado = totalCompras * (igiRate / 100);
        const resultado = igiDevengado - igiSoportado;

        // Due date: 20th of month after quarter
        const dueMonth = parseInt(period.replace('Q', '')) * 3 + 1;
        const dueDate = new Date(fiscal_year, dueMonth - 1, 20).toISOString().split('T')[0];

        const { data: declaration } = await supabase
          .from('obelixia_fiscal_declarations')
          .upsert({
            declaration_type: 'igi_andorra',
            fiscal_year,
            declaration_period: period,
            due_date: dueDate,
            status: 'calculated',
            calculated_data: {
              ventas: totalVentas,
              igi_devengado: igiDevengado,
              compras: totalCompras,
              igi_soportado: igiSoportado,
              resultado,
              tipo_igi: igiRate,
            },
            total_amount: Math.max(0, resultado),
          }, {
            onConflict: 'declaration_type,fiscal_year,declaration_period',
          })
          .select()
          .single();

        result = {
          declaration,
          summary: {
            ventas: totalVentas,
            igi_devengado: igiDevengado,
            compras: totalCompras,
            igi_soportado: igiSoportado,
            resultado,
          },
          period,
          fiscal_year,
          due_date: dueDate,
        };
        break;
      }

      case 'calculate_is_andorra': {
        // Andorra Corporate Tax at 10%
        const { fiscal_year } = params as { fiscal_year: number };

        const yearStart = `${fiscal_year}-01-01`;
        const yearEnd = `${fiscal_year}-12-31`;

        // Calculate profit
        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 7);

        const { data: expenseAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 6);

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const acc of incomeAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('credit_amount, debit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', yearStart)
            .lte('journal_entry.entry_date', yearEnd);
          
          totalIncome += (movs || []).reduce((s, m) => s + (m.credit_amount - m.debit_amount), 0);
        }

        for (const acc of expenseAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', yearStart)
            .lte('journal_entry.entry_date', yearEnd);
          
          totalExpenses += (movs || []).reduce((s, m) => s + (m.debit_amount - m.credit_amount), 0);
        }

        const beneficio = totalIncome - totalExpenses;
        const taxRate = 10; // Andorra: 10%
        const impuesto = Math.max(0, beneficio) * (taxRate / 100);

        // Due date: September 30 of next year
        const dueDate = `${fiscal_year + 1}-09-30`;

        const { data: declaration } = await supabase
          .from('obelixia_fiscal_declarations')
          .upsert({
            declaration_type: 'is_andorra',
            fiscal_year,
            declaration_period: 'annual',
            due_date: dueDate,
            status: 'calculated',
            calculated_data: {
              ingresos: totalIncome,
              gastos: totalExpenses,
              beneficio,
              tipo_gravamen: taxRate,
              impuesto,
            },
            total_amount: impuesto,
          }, {
            onConflict: 'declaration_type,fiscal_year,declaration_period',
          })
          .select()
          .single();

        result = {
          declaration,
          summary: {
            ingresos: totalIncome,
            gastos: totalExpenses,
            beneficio,
            tipo_gravamen: taxRate,
            impuesto,
          },
          fiscal_year,
          due_date: dueDate,
        };
        break;
      }

      case 'submit_declaration': {
        const { declaration_id, submission_reference, submission_date } = params as {
          declaration_id: string;
          submission_reference?: string;
          submission_date: string;
        };

        const { data: declaration, error } = await supabase
          .from('obelixia_fiscal_declarations')
          .update({
            status: 'submitted',
            submitted_at: submission_date,
            submission_reference,
          })
          .eq('id', declaration_id)
          .select()
          .single();

        if (error) throw error;

        result = { declaration, message: 'Declaración marcada como presentada' };
        break;
      }

      case 'generate_closing_entries': {
        const { fiscal_year } = params as { fiscal_year: number };

        // Get income and expense accounts with balances
        const yearEnd = `${fiscal_year}-12-31`;

        const { data: accounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('*')
          .in('account_group', [6, 7])
          .eq('is_active', true);

        const closingLines: Array<{ account_code: string; debit: number; credit: number }> = [];
        let totalIncome = 0;
        let totalExpenses = 0;

        for (const account of accounts || []) {
          const { data: movements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', account.id)
            .eq('journal_entry.status', 'posted')
            .lte('journal_entry.entry_date', yearEnd);

          const balance = (movements || []).reduce((sum, m) => {
            if (account.account_group === 7) {
              return sum + (m.credit_amount - m.debit_amount);
            }
            return sum + (m.debit_amount - m.credit_amount);
          }, 0);

          if (balance !== 0) {
            if (account.account_group === 7) {
              // Income: debit to close
              closingLines.push({
                account_code: account.account_code,
                debit: balance,
                credit: 0
              });
              totalIncome += balance;
            } else {
              // Expense: credit to close
              closingLines.push({
                account_code: account.account_code,
                debit: 0,
                credit: balance
              });
              totalExpenses += balance;
            }
          }
        }

        // Add result line (129 - Resultado del ejercicio)
        const netProfit = totalIncome - totalExpenses;
        closingLines.push({
          account_code: '129',
          debit: netProfit < 0 ? Math.abs(netProfit) : 0,
          credit: netProfit > 0 ? netProfit : 0
        });

        // Get period for year end
        const { data: period } = await supabase
          .from('obelixia_fiscal_periods')
          .select('id')
          .eq('fiscal_year', fiscal_year)
          .order('end_date', { ascending: false })
          .limit(1)
          .single();

        // Create closing entry
        const totalDebit = closingLines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = closingLines.reduce((s, l) => s + l.credit, 0);

        const { data: entry, error: entryError } = await supabase
          .from('obelixia_journal_entries')
          .insert({
            entry_date: yearEnd,
            description: `Asiento de cierre ejercicio ${fiscal_year}`,
            fiscal_period_id: period?.id,
            reference_type: 'year_close',
            is_automatic: true,
            is_closing_entry: true,
            total_debit: totalDebit,
            total_credit: totalCredit,
            status: 'draft',
          })
          .select()
          .single();

        if (entryError) throw entryError;

        // Create lines
        for (let i = 0; i < closingLines.length; i++) {
          const line = closingLines[i];
          const { data: account } = await supabase
            .from('obelixia_chart_of_accounts')
            .select('id')
            .eq('account_code', line.account_code)
            .single();

          if (account) {
            await supabase
              .from('obelixia_journal_entry_lines')
              .insert({
                journal_entry_id: entry.id,
                line_number: i + 1,
                account_id: account.id,
                debit_amount: line.debit,
                credit_amount: line.credit,
              });
          }
        }

        result = {
          entry,
          lines: closingLines,
          summary: {
            total_income: totalIncome,
            total_expenses: totalExpenses,
            net_profit: netProfit,
          },
          message: 'Asiento de cierre generado (en borrador)'
        };
        break;
      }

      // ============================================================
      // FASE 6: REPORTING
      // ============================================================
      case 'get_aging_report': {
        const { report_type, as_of_date } = params as { 
          report_type: 'receivables' | 'payables'; 
          as_of_date?: string 
        };

        const asOf = as_of_date || new Date().toISOString().split('T')[0];
        const accountCode = report_type === 'receivables' ? '430' : '400';

        // Get invoices
        const table = report_type === 'receivables' ? 'obelixia_invoices' : 'obelixia_supplier_invoices';
        const { data: invoices } = await supabase
          .from(table)
          .select('*, company:companies(name)')
          .in('status', ['sent', 'partial'])
          .lte('issue_date', asOf);

        const aging = {
          current: [] as unknown[],
          days_1_30: [] as unknown[],
          days_31_60: [] as unknown[],
          days_61_90: [] as unknown[],
          days_90_plus: [] as unknown[],
        };

        for (const inv of invoices || []) {
          const dueDate = new Date(inv.due_date);
          const asOfDate = new Date(asOf);
          const daysOverdue = Math.floor((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const outstanding = inv.total - (inv.amount_paid || 0);

          const record = {
            id: inv.id,
            invoice_number: inv.invoice_number,
            company_name: inv.company?.name,
            due_date: inv.due_date,
            total: inv.total,
            paid: inv.amount_paid || 0,
            outstanding,
            days_overdue: daysOverdue > 0 ? daysOverdue : 0,
          };

          if (daysOverdue <= 0) {
            aging.current.push(record);
          } else if (daysOverdue <= 30) {
            aging.days_1_30.push(record);
          } else if (daysOverdue <= 60) {
            aging.days_31_60.push(record);
          } else if (daysOverdue <= 90) {
            aging.days_61_90.push(record);
          } else {
            aging.days_90_plus.push(record);
          }
        }

        const totals = {
          current: aging.current.reduce((s: number, r: any) => s + r.outstanding, 0),
          days_1_30: aging.days_1_30.reduce((s: number, r: any) => s + r.outstanding, 0),
          days_31_60: aging.days_31_60.reduce((s: number, r: any) => s + r.outstanding, 0),
          days_61_90: aging.days_61_90.reduce((s: number, r: any) => s + r.outstanding, 0),
          days_90_plus: aging.days_90_plus.reduce((s: number, r: any) => s + r.outstanding, 0),
        };

        result = {
          report_type,
          as_of_date: asOf,
          aging,
          totals,
          grand_total: Object.values(totals).reduce((s, v) => s + v, 0),
        };
        break;
      }

      case 'get_cash_projection': {
        const { days_ahead } = params as { days_ahead?: number };

        const projectionDays = days_ahead || 90;
        const today = new Date();

        // Get current cash balance
        const { data: cashAccount } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_code', '572')
          .single();

        let currentBalance = 0;
        if (cashAccount) {
          const { data: movements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(status)')
            .eq('account_id', cashAccount.id)
            .eq('journal_entry.status', 'posted');
          
          currentBalance = (movements || []).reduce((sum, m) => 
            sum + (m.debit_amount - m.credit_amount), 0);
        }

        // Get expected receivables
        const { data: receivables } = await supabase
          .from('obelixia_invoices')
          .select('*')
          .in('status', ['sent', 'partial'])
          .gte('due_date', today.toISOString().split('T')[0])
          .lte('due_date', new Date(Date.now() + projectionDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        // Get expected payables (if table exists)
        const { data: payables } = await supabase
          .from('obelixia_supplier_invoices')
          .select('*')
          .in('status', ['pending', 'approved'])
          .gte('due_date', today.toISOString().split('T')[0])
          .lte('due_date', new Date(Date.now() + projectionDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        // Build daily projection
        const projection: Array<{
          date: string;
          inflows: number;
          outflows: number;
          balance: number;
        }> = [];

        let runningBalance = currentBalance;
        for (let i = 0; i <= projectionDays; i++) {
          const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          const dayInflows = (receivables || [])
            .filter(r => r.due_date === date)
            .reduce((s, r) => s + (r.total - (r.amount_paid || 0)), 0);
          
          const dayOutflows = (payables || [])
            .filter(p => p.due_date === date)
            .reduce((s, p) => s + (p.total - (p.amount_paid || 0)), 0);

          runningBalance += dayInflows - dayOutflows;

          projection.push({
            date,
            inflows: dayInflows,
            outflows: dayOutflows,
            balance: runningBalance,
          });
        }

        result = {
          current_balance: currentBalance,
          projection_days: projectionDays,
          projection,
          summary: {
            total_expected_inflows: projection.reduce((s, p) => s + p.inflows, 0),
            total_expected_outflows: projection.reduce((s, p) => s + p.outflows, 0),
            projected_end_balance: runningBalance,
            min_balance: Math.min(...projection.map(p => p.balance)),
            min_balance_date: projection.find(p => p.balance === Math.min(...projection.map(x => x.balance)))?.date,
          },
        };
        break;
      }

      // ============================================================
      // FASE 7: INTEGRACIONES
      // ============================================================
      case 'import_bank_file': {
        const { bank_account_id, file_content, file_format } = params as {
          bank_account_id: string;
          file_content: string;
          file_format: 'ofx' | 'csv' | 'norma43';
        };

        // Parse file based on format
        const transactions: Array<{
          transaction_date: string;
          value_date: string;
          description: string;
          amount: number;
          reference?: string;
        }> = [];

        if (file_format === 'csv') {
          // Simple CSV parsing
          const lines = file_content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 3) {
              transactions.push({
                transaction_date: values[headers.indexOf('fecha') || 0],
                value_date: values[headers.indexOf('fecha_valor') || headers.indexOf('fecha') || 0],
                description: values[headers.indexOf('concepto') || headers.indexOf('descripcion') || 1],
                amount: parseFloat(values[headers.indexOf('importe') || headers.indexOf('amount') || 2].replace(',', '.')),
                reference: values[headers.indexOf('referencia') || 3],
              });
            }
          }
        }
        // TODO: Add OFX and Norma43 parsers

        // Insert transactions
        const imported = [];
        for (const txn of transactions) {
          const { data, error } = await supabase
            .from('obelixia_bank_transactions')
            .insert({
              bank_account_id,
              transaction_date: txn.transaction_date,
              value_date: txn.value_date,
              description: txn.description,
              amount: txn.amount,
              reference: txn.reference,
              is_reconciled: false,
              source: file_format,
            })
            .select()
            .single();

          if (!error && data) {
            imported.push(data);
          }
        }

        result = {
          imported_count: imported.length,
          transactions: imported,
          message: `${imported.length} transacciones importadas`
        };
        break;
      }

      case 'export_accounting': {
        const { format, fiscal_year, include_auxiliaries } = params as {
          format: 'a3' | 'sage' | 'contaplus' | 'sii';
          fiscal_year: number;
          include_auxiliaries?: boolean;
        };

        // Get all posted entries for the year
        const yearStart = `${fiscal_year}-01-01`;
        const yearEnd = `${fiscal_year}-12-31`;

        const { data: entries } = await supabase
          .from('obelixia_journal_entries')
          .select(`
            *,
            lines:obelixia_journal_entry_lines(
              *,
              account:obelixia_chart_of_accounts(*)
            )
          `)
          .eq('status', 'posted')
          .gte('entry_date', yearStart)
          .lte('entry_date', yearEnd)
          .order('entry_date');

        // Format data based on target system
        let exportData: string;

        switch (format) {
          case 'a3':
            // A3 format (CSV with specific columns)
            exportData = 'ASIENTO;FECHA;CUENTA;CONCEPTO;DEBE;HABER\n';
            for (const entry of entries || []) {
              for (const line of entry.lines) {
                exportData += `${entry.entry_number};${entry.entry_date};${line.account.account_code};${line.description || entry.description};${line.debit_amount};${line.credit_amount}\n`;
              }
            }
            break;

          case 'sage':
            // Sage format
            exportData = 'Fecha|Cuenta|Descripcion|Debe|Haber|Documento\n';
            for (const entry of entries || []) {
              for (const line of entry.lines) {
                exportData += `${entry.entry_date}|${line.account.account_code}|${line.description || entry.description}|${line.debit_amount}|${line.credit_amount}|${entry.source_document || ''}\n`;
              }
            }
            break;

          case 'contaplus':
            // ContaPlus XLS format (simplified)
            exportData = 'EJERCICIO\tASIENTO\tFECHA\tCUENTA\tCONCEPTO\tDEBE\tHABER\n';
            for (const entry of entries || []) {
              for (const line of entry.lines) {
                exportData += `${fiscal_year}\t${entry.entry_number}\t${entry.entry_date}\t${line.account.account_code}\t${line.description || entry.description}\t${line.debit_amount}\t${line.credit_amount}\n`;
              }
            }
            break;

          case 'sii':
            // SII XML format for Spain (simplified structure)
            exportData = `<?xml version="1.0" encoding="UTF-8"?>
<RegistroLRFacturasEmitidas>
  <Cabecera>
    <IDVersionSii>1.1</IDVersionSii>
    <Ejercicio>${fiscal_year}</Ejercicio>
  </Cabecera>
  <RegistroLRFacturasEmitidas>
    <!-- Facturas exportadas -->
  </RegistroLRFacturasEmitidas>
</RegistroLRFacturasEmitidas>`;
            break;

          default:
            exportData = '';
        }

        result = {
          format,
          fiscal_year,
          entries_count: entries?.length || 0,
          export_data: exportData,
          download_ready: true,
        };
        break;
      }

      // ============================================================
      // EXISTING ACTIONS (keep all existing functionality)
      // ============================================================
      case 'create_entry': {
        const { entry_date, description, lines, reference_type, reference_id, source_document } = params as {
          entry_date: string;
          description: string;
          lines: Array<{
            account_code: string;
            debit_amount: number;
            credit_amount: number;
            description?: string;
            tax_code?: string;
          }>;
          reference_type?: string;
          reference_id?: string;
          source_document?: string;
        };

        const totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
        const totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(`Asiento descuadrado: Debe=${totalDebit}, Haber=${totalCredit}`);
        }

        const { data: period } = await supabase
          .from('obelixia_fiscal_periods')
          .select('id, status')
          .lte('start_date', entry_date)
          .gte('end_date', entry_date)
          .single();

        if (!period) {
          throw new Error('No existe período fiscal para esta fecha');
        }
        if (period.status === 'locked') {
          throw new Error('El período fiscal está bloqueado');
        }

        const { data: entry, error: entryError } = await supabase
          .from('obelixia_journal_entries')
          .insert({
            entry_date,
            description,
            fiscal_period_id: period.id,
            reference_type,
            reference_id,
            source_document,
            total_debit: totalDebit,
            total_credit: totalCredit,
            status: 'draft',
          })
          .select()
          .single();

        if (entryError) throw entryError;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const { data: account } = await supabase
            .from('obelixia_chart_of_accounts')
            .select('id')
            .eq('account_code', line.account_code)
            .single();

          if (!account) {
            throw new Error(`Cuenta no encontrada: ${line.account_code}`);
          }

          await supabase
            .from('obelixia_journal_entry_lines')
            .insert({
              journal_entry_id: entry.id,
              line_number: i + 1,
              account_id: account.id,
              debit_amount: line.debit_amount || 0,
              credit_amount: line.credit_amount || 0,
              description: line.description,
              tax_code: line.tax_code,
            });
        }

        result = { entry, message: 'Asiento creado correctamente' };
        break;
      }

      case 'post_entry': {
        const { entry_id } = params as { entry_id: string };

        const { data: entry } = await supabase
          .from('obelixia_journal_entries')
          .select('*, lines:obelixia_journal_entry_lines(*)')
          .eq('id', entry_id)
          .single();

        if (!entry) throw new Error('Asiento no encontrado');
        if (entry.status !== 'draft') throw new Error('Solo se pueden contabilizar asientos en borrador');

        const { error } = await supabase
          .from('obelixia_journal_entries')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
          })
          .eq('id', entry_id);

        if (error) throw error;

        result = { success: true, message: 'Asiento contabilizado' };
        break;
      }

      case 'reverse_entry': {
        const { entry_id, reversal_date, reason } = params as { 
          entry_id: string; 
          reversal_date: string;
          reason?: string;
        };

        const { data: originalEntry } = await supabase
          .from('obelixia_journal_entries')
          .select('*, lines:obelixia_journal_entry_lines(*)')
          .eq('id', entry_id)
          .single();

        if (!originalEntry) throw new Error('Asiento no encontrado');
        if (originalEntry.status !== 'posted') throw new Error('Solo se pueden anular asientos contabilizados');

        const { data: period } = await supabase
          .from('obelixia_fiscal_periods')
          .select('id')
          .lte('start_date', reversal_date)
          .gte('end_date', reversal_date)
          .single();

        const { data: reversalEntry } = await supabase
          .from('obelixia_journal_entries')
          .insert({
            entry_date: reversal_date,
            description: `Anulación: ${originalEntry.description}. ${reason || ''}`,
            fiscal_period_id: period?.id,
            reference_type: 'adjustment',
            reference_id: entry_id,
            is_reversing: true,
            reversed_entry_id: entry_id,
            total_debit: originalEntry.total_credit,
            total_credit: originalEntry.total_debit,
            status: 'posted',
            posted_at: new Date().toISOString(),
          })
          .select()
          .single();

        for (let i = 0; i < originalEntry.lines.length; i++) {
          const line = originalEntry.lines[i];
          await supabase
            .from('obelixia_journal_entry_lines')
            .insert({
              journal_entry_id: reversalEntry.id,
              line_number: i + 1,
              account_id: line.account_id,
              debit_amount: line.credit_amount,
              credit_amount: line.debit_amount,
              description: `Anulación: ${line.description || ''}`,
            });
        }

        await supabase
          .from('obelixia_journal_entries')
          .update({ status: 'reversed' })
          .eq('id', entry_id);

        result = { reversalEntry, message: 'Asiento anulado correctamente' };
        break;
      }

      case 'get_ledger': {
        const { account_id, fiscal_period_id } = params as {
          account_id?: string;
          fiscal_period_id?: string;
        };

        let query = supabase
          .from('obelixia_journal_entry_lines')
          .select(`
            *,
            journal_entry:obelixia_journal_entries!inner(*),
            account:obelixia_chart_of_accounts(*)
          `)
          .eq('journal_entry.status', 'posted')
          .order('journal_entry(entry_date)', { ascending: true });

        if (account_id) {
          query = query.eq('account_id', account_id);
        }

        if (fiscal_period_id) {
          query = query.eq('journal_entry.fiscal_period_id', fiscal_period_id);
        }

        const { data: movements } = await query.limit(500);

        let runningBalance = 0;
        const ledgerWithBalance = (movements || []).map(m => {
          runningBalance += (m.debit_amount - m.credit_amount);
          return { ...m, running_balance: runningBalance };
        });

        result = { movements: ledgerWithBalance };
        break;
      }

      case 'get_trial_balance': {
        const { fiscal_period_id } = params as {
          fiscal_period_id?: string;
        };

        const { data: accounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('*')
          .eq('is_active', true)
          .eq('is_detail', true)
          .order('account_code');

        const trialBalance = [];
        let totalDebit = 0;
        let totalCredit = 0;

        for (const account of accounts || []) {
          const { data: movements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(status)')
            .eq('account_id', account.id)
            .eq('journal_entry.status', 'posted');

          const debit = (movements || []).reduce((sum, m) => sum + (m.debit_amount || 0), 0);
          const credit = (movements || []).reduce((sum, m) => sum + (m.credit_amount || 0), 0);
          const balance = debit - credit;

          if (debit !== 0 || credit !== 0) {
            const balanceDebit = balance > 0 ? balance : 0;
            const balanceCredit = balance < 0 ? Math.abs(balance) : 0;
            
            trialBalance.push({
              account,
              debit,
              credit,
              balance_debit: balanceDebit,
              balance_credit: balanceCredit,
            });

            totalDebit += balanceDebit;
            totalCredit += balanceCredit;
          }
        }

        result = { 
          trialBalance, 
          totals: { 
            debit: totalDebit, 
            credit: totalCredit,
            balanced: Math.abs(totalDebit - totalCredit) < 0.01
          }
        };
        break;
      }

      case 'auto_reconcile': {
        const { bank_account_id } = params as { bank_account_id: string };

        const { data: transactions } = await supabase
          .from('obelixia_bank_transactions')
          .select('*')
          .eq('bank_account_id', bank_account_id)
          .eq('is_reconciled', false);

        const { data: rules } = await supabase
          .from('obelixia_reconciliation_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: true });

        const reconciled = [];
        const unmatched = [];

        for (const txn of transactions || []) {
          let matched = false;

          for (const rule of rules || []) {
            let isMatch = false;
            const fieldValue = txn[rule.match_field as keyof typeof txn]?.toString().toLowerCase() || '';

            switch (rule.match_type) {
              case 'exact':
                isMatch = fieldValue === rule.match_value.toLowerCase();
                break;
              case 'contains':
                isMatch = fieldValue.includes(rule.match_value.toLowerCase());
                break;
              case 'regex':
                try {
                  isMatch = new RegExp(rule.match_value, 'i').test(fieldValue);
                } catch {
                  isMatch = false;
                }
                break;
            }

            if (isMatch) {
              await supabase
                .from('obelixia_bank_transactions')
                .update({
                  is_reconciled: true,
                  category: rule.target_category,
                  reconciled_at: new Date().toISOString(),
                })
                .eq('id', txn.id);

              await supabase
                .from('obelixia_reconciliation_rules')
                .update({ matches_count: (rule.matches_count || 0) + 1 })
                .eq('id', rule.id);

              reconciled.push({ transaction: txn, rule });
              matched = true;
              break;
            }
          }

          if (!matched) {
            unmatched.push(txn);
          }
        }

        result = {
          reconciled_count: reconciled.length,
          unmatched_count: unmatched.length,
          reconciled,
          unmatched,
        };
        break;
      }

      case 'ai_categorize': {
        const { description, amount, counterparty } = params as {
          description: string;
          amount: number;
          counterparty?: string;
        };

        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        const { data: accounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('account_code, account_name, description')
          .eq('is_active', true)
          .eq('is_detail', true)
          .in('account_group', [6, 7]);

        const accountsList = (accounts || [])
          .map(a => `${a.account_code}: ${a.account_name}`)
          .join('\n');

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `Eres un contable experto en Plan General Contable español.
Clasifica el movimiento bancario en una de estas cuentas:

${accountsList}

Responde SOLO con JSON:
{
  "account_code": "XXX",
  "account_name": "Nombre",
  "confidence": 0.XX,
  "reasoning": "Explicación breve"
}`
              },
              {
                role: 'user',
                content: `Movimiento: ${description}
Importe: ${amount}€
${counterparty ? `Ordenante/Beneficiario: ${counterparty}` : ''}

¿A qué cuenta corresponde?`
              }
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse AI response' };
        } catch {
          result = { rawContent: content, parseError: true };
        }
        break;
      }

      case 'partner_transaction': {
        const { partner_id, transaction_type, amount, description, transaction_date } = params as {
          partner_id: string;
          transaction_type: string;
          amount: number;
          description?: string;
          transaction_date: string;
        };

        const { data: transaction, error } = await supabase
          .from('obelixia_partner_transactions')
          .insert({
            partner_id,
            transaction_type,
            amount,
            description,
            transaction_date,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        const multiplier = ['capital_contribution', 'loan_to_company'].includes(transaction_type) ? 1 : -1;
        
        const { data: partner } = await supabase
          .from('obelixia_partners')
          .select('current_account_balance')
          .eq('id', partner_id)
          .single();

        await supabase
          .from('obelixia_partners')
          .update({
            current_account_balance: (partner?.current_account_balance || 0) + (amount * multiplier),
          })
          .eq('id', partner_id);

        result = { transaction, message: 'Transacción de socio registrada' };
        break;
      }

      case 'generate_fiscal_declaration': {
        const { declaration_type, period_id } = params as {
          declaration_type: string;
          period_id: string;
        };

        const { data: period } = await supabase
          .from('obelixia_fiscal_periods')
          .select('*')
          .eq('id', period_id)
          .single();

        if (!period) throw new Error('Período no encontrado');

        let calculatedData: Record<string, unknown> = {};

        if (declaration_type === 'modelo_303') {
          const { data: ivaRepAccount } = await supabase
            .from('obelixia_chart_of_accounts')
            .select('id')
            .eq('account_code', '477')
            .single();

          const { data: ivaSopAccount } = await supabase
            .from('obelixia_chart_of_accounts')
            .select('id')
            .eq('account_code', '472')
            .single();

          let ivaRepercutido = 0;
          let ivaSoportado = 0;

          if (ivaRepAccount) {
            const { data: repMovs } = await supabase
              .from('obelixia_journal_entry_lines')
              .select('credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
              .eq('account_id', ivaRepAccount.id)
              .eq('journal_entry.fiscal_period_id', period_id)
              .eq('journal_entry.status', 'posted');

            ivaRepercutido = (repMovs || []).reduce((sum, m) => sum + (m.credit_amount || 0), 0);
          }

          if (ivaSopAccount) {
            const { data: sopMovs } = await supabase
              .from('obelixia_journal_entry_lines')
              .select('debit_amount, journal_entry:obelixia_journal_entries!inner(*)')
              .eq('account_id', ivaSopAccount.id)
              .eq('journal_entry.fiscal_period_id', period_id)
              .eq('journal_entry.status', 'posted');

            ivaSoportado = (sopMovs || []).reduce((sum, m) => sum + (m.debit_amount || 0), 0);
          }

          calculatedData = {
            iva_repercutido: ivaRepercutido,
            iva_soportado: ivaSoportado,
            resultado: ivaRepercutido - ivaSoportado,
            a_ingresar: Math.max(0, ivaRepercutido - ivaSoportado),
            a_compensar: Math.max(0, ivaSoportado - ivaRepercutido),
          };
        }

        const periodEnd = new Date(period.end_date);
        const dueDate = new Date(periodEnd);
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(20);

        const { data: declaration } = await supabase
          .from('obelixia_fiscal_declarations')
          .upsert({
            declaration_type,
            fiscal_period_id: period_id,
            declaration_period: `${period.period_name}`,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'calculated',
            calculated_data: calculatedData,
            total_amount: calculatedData.resultado as number,
          }, {
            onConflict: 'fiscal_period_id,declaration_type',
          })
          .select()
          .single();

        result = { declaration, calculatedData };
        break;
      }

      case 'get_balance_sheet': {
        const { as_of_date } = params as { as_of_date: string };

        const { data: accounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('*')
          .eq('is_active', true)
          .eq('is_detail', true)
          .order('account_code');

        const assets: Array<{account: unknown; balance: number}> = [];
        const liabilities: Array<{account: unknown; balance: number}> = [];
        const equity: Array<{account: unknown; balance: number}> = [];

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        for (const account of accounts || []) {
          const { data: movements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', account.id)
            .eq('journal_entry.status', 'posted')
            .lte('journal_entry.entry_date', as_of_date);

          const debit = (movements || []).reduce((sum, m) => sum + (m.debit_amount || 0), 0);
          const credit = (movements || []).reduce((sum, m) => sum + (m.credit_amount || 0), 0);
          const balance = account.normal_balance === 'debit' ? debit - credit : credit - debit;

          if (balance === 0) continue;

          const row = { account, balance };

          if (account.account_type === 'asset') {
            assets.push(row);
            totalAssets += balance;
          } else if (account.account_type === 'liability') {
            liabilities.push(row);
            totalLiabilities += balance;
          } else if (account.account_type === 'equity') {
            equity.push(row);
            totalEquity += balance;
          }
        }

        result = {
          as_of_date,
          assets,
          liabilities,
          equity,
          totals: {
            assets: totalAssets,
            liabilities: totalLiabilities,
            equity: totalEquity,
            liabilities_and_equity: totalLiabilities + totalEquity,
            balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
          }
        };
        break;
      }

      case 'get_income_statement': {
        const { start_date, end_date } = params as {
          start_date: string;
          end_date: string;
        };

        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('*')
          .eq('is_active', true)
          .eq('is_detail', true)
          .eq('account_group', 7)
          .order('account_code');

        const { data: expenseAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('*')
          .eq('is_active', true)
          .eq('is_detail', true)
          .eq('account_group', 6)
          .order('account_code');

        const income: Array<{account: unknown; amount: number}> = [];
        const expenses: Array<{account: unknown; amount: number}> = [];
        let totalIncome = 0;
        let totalExpenses = 0;

        for (const account of incomeAccounts || []) {
          const { data: movements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', account.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', start_date)
            .lte('journal_entry.entry_date', end_date);

          const amount = (movements || []).reduce((sum, m) => 
            sum + ((m.credit_amount || 0) - (m.debit_amount || 0)), 0);

          if (amount !== 0) {
            income.push({ account, amount });
            totalIncome += amount;
          }
        }

        for (const account of expenseAccounts || []) {
          const { data: movements } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', account.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', start_date)
            .lte('journal_entry.entry_date', end_date);

          const amount = (movements || []).reduce((sum, m) => 
            sum + ((m.debit_amount || 0) - (m.credit_amount || 0)), 0);

          if (amount !== 0) {
            expenses.push({ account, amount });
            totalExpenses += amount;
          }
        }

        result = {
          period: { start_date, end_date },
          income,
          expenses,
          totals: {
            income: totalIncome,
            expenses: totalExpenses,
            gross_profit: totalIncome - totalExpenses,
            net_profit: totalIncome - totalExpenses
          }
        };
        break;
      }

      case 'get_cash_flow': {
        const { start_date, end_date } = params as {
          start_date: string;
          end_date: string;
        };

        const { data: cashAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('is_active', true)
          .like('account_code', '57%');

        const cashAccountIds = (cashAccounts || []).map(a => a.id);

        const { data: openingMovements } = await supabase
          .from('obelixia_journal_entry_lines')
          .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
          .in('account_id', cashAccountIds)
          .eq('journal_entry.status', 'posted')
          .lt('journal_entry.entry_date', start_date);

        const openingBalance = (openingMovements || []).reduce((sum, m) => 
          sum + ((m.debit_amount || 0) - (m.credit_amount || 0)), 0);

        const { data: periodMovements } = await supabase
          .from('obelixia_journal_entry_lines')
          .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
          .in('account_id', cashAccountIds)
          .eq('journal_entry.status', 'posted')
          .gte('journal_entry.entry_date', start_date)
          .lte('journal_entry.entry_date', end_date);

        const inflows = (periodMovements || []).reduce((sum, m) => sum + (m.debit_amount || 0), 0);
        const outflows = (periodMovements || []).reduce((sum, m) => sum + (m.credit_amount || 0), 0);
        const netCashFlow = inflows - outflows;
        const closingBalance = openingBalance + netCashFlow;

        result = {
          period: { start_date, end_date },
          opening_balance: openingBalance,
          inflows,
          outflows,
          net_cash_flow: netCashFlow,
          closing_balance: closingBalance,
          operating_activities: netCashFlow,
          investing_activities: 0,
          financing_activities: 0
        };
        break;
      }

      case 'close_fiscal_period': {
        const { period_id } = params as { period_id: string };

        const { data: draftEntries } = await supabase
          .from('obelixia_journal_entries')
          .select('id')
          .eq('fiscal_period_id', period_id)
          .eq('status', 'draft');

        if (draftEntries && draftEntries.length > 0) {
          throw new Error(`Hay ${draftEntries.length} asientos en borrador. Debe contabilizarlos antes de cerrar.`);
        }

        const { data: period, error } = await supabase
          .from('obelixia_fiscal_periods')
          .update({
            status: 'closed',
            closed_at: new Date().toISOString()
          })
          .eq('id', period_id)
          .select()
          .single();

        if (error) throw error;

        result = { period, message: 'Período cerrado correctamente' };
        break;
      }

      case 'close_fiscal_year': {
        const { fiscal_year } = params as { fiscal_year: number };

        const { data: periods } = await supabase
          .from('obelixia_fiscal_periods')
          .select('*')
          .eq('fiscal_year', fiscal_year);

        const openPeriods = (periods || []).filter(p => p.status !== 'closed');
        if (openPeriods.length > 0) {
          throw new Error(`Hay ${openPeriods.length} períodos abiertos. Debe cerrarlos antes de cerrar el ejercicio.`);
        }

        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 7);

        const { data: expenseAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 6);

        const yearStart = `${fiscal_year}-01-01`;
        const yearEnd = `${fiscal_year}-12-31`;

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const acc of incomeAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('credit_amount, debit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', yearStart)
            .lte('journal_entry.entry_date', yearEnd);
          
          totalIncome += (movs || []).reduce((s, m) => s + (m.credit_amount - m.debit_amount), 0);
        }

        for (const acc of expenseAccounts || []) {
          const { data: movs } = await supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
            .eq('account_id', acc.id)
            .eq('journal_entry.status', 'posted')
            .gte('journal_entry.entry_date', yearStart)
            .lte('journal_entry.entry_date', yearEnd);
          
          totalExpenses += (movs || []).reduce((s, m) => s + (m.debit_amount - m.credit_amount), 0);
        }

        const netProfit = totalIncome - totalExpenses;

        await supabase
          .from('obelixia_fiscal_periods')
          .update({ status: 'locked' })
          .eq('fiscal_year', fiscal_year);

        result = {
          fiscal_year,
          total_income: totalIncome,
          total_expenses: totalExpenses,
          net_profit: netProfit,
          message: `Ejercicio ${fiscal_year} cerrado. Resultado: ${netProfit.toFixed(2)}€`
        };
        break;
      }

      case 'get_tax_calendar': {
        const { year } = params as { year?: number };
        const fiscalYear = year || new Date().getFullYear();

        const { data: periods } = await supabase
          .from('obelixia_fiscal_periods')
          .select('*')
          .eq('fiscal_year', fiscalYear)
          .order('start_date');

        const calendar: Array<{
          id: string;
          title: string;
          due_date: string;
          type: string;
          period: string;
          status: 'pending' | 'upcoming' | 'overdue' | 'completed';
        }> = [];

        const today = new Date().toISOString().split('T')[0];

        for (const period of periods || []) {
          const periodEnd = new Date(period.end_date);
          
          const ivaDue = new Date(periodEnd);
          ivaDue.setMonth(ivaDue.getMonth() + 1);
          ivaDue.setDate(20);
          
          const { data: ivaDecl } = await supabase
            .from('obelixia_fiscal_declarations')
            .select('status')
            .eq('fiscal_period_id', period.id)
            .eq('declaration_type', 'iva')
            .single();

          calendar.push({
            id: `iva-${period.id}`,
            title: `IVA ${period.period_name}`,
            due_date: ivaDue.toISOString().split('T')[0],
            type: 'iva',
            period: period.period_name,
            status: ivaDecl?.status === 'submitted' ? 'completed' 
                  : ivaDue.toISOString().split('T')[0] < today ? 'overdue'
                  : ivaDue.toISOString().split('T')[0] <= new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0] ? 'upcoming'
                  : 'pending'
          });

          if (period.period_type === 'quarter') {
            const irpfDue = new Date(periodEnd);
            irpfDue.setMonth(irpfDue.getMonth() + 1);
            irpfDue.setDate(20);

            const { data: irpfDecl } = await supabase
              .from('obelixia_fiscal_declarations')
              .select('status')
              .eq('fiscal_period_id', period.id)
              .eq('declaration_type', 'irpf')
              .single();

            calendar.push({
              id: `irpf-${period.id}`,
              title: `IRPF ${period.period_name}`,
              due_date: irpfDue.toISOString().split('T')[0],
              type: 'irpf',
              period: period.period_name,
              status: irpfDecl?.status === 'submitted' ? 'completed'
                    : irpfDue.toISOString().split('T')[0] < today ? 'overdue'
                    : irpfDue.toISOString().split('T')[0] <= new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0] ? 'upcoming'
                    : 'pending'
            });
          }
        }

        calendar.push({
          id: `is-${fiscalYear}`,
          title: `Impuesto Sociedades ${fiscalYear}`,
          due_date: `${fiscalYear + 1}-07-25`,
          type: 'corporate',
          period: `Ejercicio ${fiscalYear}`,
          status: `${fiscalYear + 1}-07-25` < today ? 'overdue' : 'pending'
        });

        result = { year: fiscalYear, calendar };
        break;
      }

      case 'get_tax_declarations': {
        const { year, status } = params as { year?: number; status?: string };
        const fiscalYear = year || new Date().getFullYear();

        let query = supabase
          .from('obelixia_fiscal_declarations')
          .select(`
            *,
            fiscal_period:obelixia_fiscal_periods(*)
          `)
          .order('due_date', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }

        const { data: declarations } = await query;

        const filtered = (declarations || []).filter(d => {
          if (!d.fiscal_period) return true;
          return d.fiscal_period.fiscal_year === fiscalYear;
        });

        const byType = {
          iva: filtered.filter(d => d.declaration_type === 'iva' || d.declaration_type === 'modelo_303'),
          irpf: filtered.filter(d => d.declaration_type === 'irpf' || d.declaration_type === 'modelo_111'),
          corporate: filtered.filter(d => d.declaration_type === 'corporate' || d.declaration_type === 'modelo_200' || d.declaration_type === 'is_andorra'),
          igi: filtered.filter(d => d.declaration_type === 'igi_andorra'),
          other: filtered.filter(d => !['iva', 'irpf', 'corporate', 'modelo_303', 'modelo_111', 'modelo_200', 'is_andorra', 'igi_andorra'].includes(d.declaration_type))
        };

        result = { 
          year: fiscalYear, 
          declarations: filtered,
          byType,
          summary: {
            total: filtered.length,
            pending: filtered.filter(d => d.status === 'pending' || d.status === 'calculated').length,
            submitted: filtered.filter(d => d.status === 'submitted').length,
            paid: filtered.filter(d => d.status === 'paid').length
          }
        };
        break;
      }

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[obelixia-accounting-engine] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
