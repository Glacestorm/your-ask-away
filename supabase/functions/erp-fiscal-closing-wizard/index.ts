import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClosingRequest {
  action: 'validate' | 'close_periods' | 'regularization' | 'closing_entry' | 'opening_entry' | 'full_wizard';
  company_id: string;
  fiscal_year_id: string;
  user_id?: string;
  options?: {
    target_account?: string;
    new_fiscal_year_id?: string;
  };
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

    const { action, company_id, fiscal_year_id, user_id, options } = await req.json() as ClosingRequest;

    console.log(`[erp-fiscal-closing-wizard] Action: ${action}, Company: ${company_id}, FY: ${fiscal_year_id}`);

    // Helper to log events
    const logEvent = async (closingId: string, eventType: string, message: string, severity: string = 'info', details?: any) => {
      await supabase.from('erp_closing_events').insert({
        closing_id: closingId,
        event_type: eventType,
        message,
        severity,
        details_json: details || null,
      });
    };

    // Get or create closing record
    const getOrCreateClosing = async () => {
      const { data: existing } = await supabase
        .from('erp_fiscal_closings')
        .select('*')
        .eq('company_id', company_id)
        .eq('fiscal_year_id', fiscal_year_id)
        .single();

      if (existing) return existing;

      const { data: newClosing, error } = await supabase
        .from('erp_fiscal_closings')
        .insert({
          company_id,
          fiscal_year_id,
          status: 'pending',
          performed_by: user_id,
        })
        .select()
        .single();

      if (error) throw error;
      return newClosing;
    };

    // Validate fiscal year and periods
    const validatePrerequisites = async (closingId: string) => {
      const issues: { type: string; message: string; severity: string }[] = [];

      // Check fiscal year exists and is not closed
      const { data: fiscalYear } = await supabase
        .from('erp_fiscal_years')
        .select('*')
        .eq('id', fiscal_year_id)
        .single();

      if (!fiscalYear) {
        issues.push({ type: 'fiscal_year', message: 'Ejercicio fiscal no encontrado', severity: 'error' });
      } else if (fiscalYear.status === 'closed') {
        issues.push({ type: 'fiscal_year', message: 'El ejercicio ya está cerrado', severity: 'error' });
      }

      // Check all periods are closed or ready
      const { data: periods } = await supabase
        .from('erp_periods')
        .select('*')
        .eq('fiscal_year_id', fiscal_year_id)
        .eq('status', 'open');

      if (periods && periods.length > 0) {
        issues.push({ 
          type: 'periods', 
          message: `Hay ${periods.length} período(s) abiertos`, 
          severity: 'warning' 
        });
      }

      // Check for draft journal entries
      const { count: draftEntries } = await supabase
        .from('erp_journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company_id)
        .eq('fiscal_year_id', fiscal_year_id)
        .eq('status', 'draft');

      if (draftEntries && draftEntries > 0) {
        issues.push({
          type: 'entries',
          message: `Hay ${draftEntries} asiento(s) en borrador pendientes de validar`,
          severity: 'warning'
        });
      }

      // Check trial balance (debits = credits) - simplified check via entries
      const { data: entryBalances } = await supabase
        .from('erp_journal_entry_lines')
        .select('debit_amount, credit_amount')
        .eq('erp_journal_entries.company_id', company_id)
        .eq('erp_journal_entries.fiscal_year_id', fiscal_year_id);

      if (entryBalances) {
        const totalDebit = entryBalances.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
        const totalCredit = entryBalances.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          issues.push({
            type: 'balance',
            message: `El balance de sumas y saldos no cuadra: Debe ${totalDebit.toFixed(2)} ≠ Haber ${totalCredit.toFixed(2)}`,
            severity: 'error'
          });
        }
      }

      await logEvent(closingId, 'validation_complete', `Validación completada: ${issues.length} incidencias`, 
        issues.some(i => i.severity === 'error') ? 'error' : 'info',
        { issues }
      );

      return { 
        valid: !issues.some(i => i.severity === 'error'), 
        issues,
        fiscalYear 
      };
    };

    // Close all periods
    const closePeriods = async (closingId: string) => {
      const { data: periods, error } = await supabase
        .from('erp_periods')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('fiscal_year_id', fiscal_year_id)
        .neq('status', 'closed')
        .select();

      if (error) throw error;

      await logEvent(closingId, 'periods_closed', `${periods?.length || 0} períodos cerrados`, 'info');
      return periods;
    };

    // Create regularization entry (groups 6 and 7 to result account)
    const createRegularizationEntry = async (closingId: string, targetAccount: string = '129') => {
      // Get accounts with balance in groups 6 and 7
      const { data: incomeExpenseAccounts } = await supabase
        .from('erp_journal_entry_lines')
        .select(`
          account_id,
          erp_chart_of_accounts!inner(account_code, account_name),
          debit_amount,
          credit_amount
        `)
        .eq('erp_journal_entries.company_id', company_id)
        .eq('erp_journal_entries.fiscal_year_id', fiscal_year_id);

      // Calculate balances for groups 6 and 7
      const accountBalances = new Map<string, { code: string; name: string; balance: number }>();
      
      incomeExpenseAccounts?.forEach((line: any) => {
        const code = line.erp_chart_of_accounts?.account_code || '';
        if (code.startsWith('6') || code.startsWith('7')) {
          const existing = accountBalances.get(line.account_id) || {
            code,
            name: line.erp_chart_of_accounts?.account_name || '',
            balance: 0
          };
          existing.balance += (line.debit_amount || 0) - (line.credit_amount || 0);
          accountBalances.set(line.account_id, existing);
        }
      });

      // Create regularization entry
      const lines: any[] = [];
      let totalResult = 0;

      accountBalances.forEach((acc, accountId) => {
        if (Math.abs(acc.balance) > 0.001) {
          lines.push({
            account_id: accountId,
            debit_amount: acc.balance < 0 ? Math.abs(acc.balance) : 0,
            credit_amount: acc.balance > 0 ? acc.balance : 0,
            description: `Regularización ${acc.code} - ${acc.name}`
          });
          totalResult += acc.balance;
        }
      });

      if (lines.length === 0) {
        await logEvent(closingId, 'regularization_skipped', 'No hay saldos a regularizar', 'info');
        return null;
      }

      // Get result account
      const { data: resultAccount } = await supabase
        .from('erp_chart_of_accounts')
        .select('id')
        .eq('company_id', company_id)
        .eq('account_code', targetAccount)
        .single();

      if (!resultAccount) {
        throw new Error(`Cuenta de resultados ${targetAccount} no encontrada`);
      }

      // Add result account line
      lines.push({
        account_id: resultAccount.id,
        debit_amount: totalResult > 0 ? totalResult : 0,
        credit_amount: totalResult < 0 ? Math.abs(totalResult) : 0,
        description: 'Resultado del ejercicio'
      });

      // Create the entry
      const { data: entry, error } = await supabase
        .from('erp_journal_entries')
        .insert({
          company_id,
          fiscal_year_id,
          journal_id: null, // Special closing journal
          entry_date: new Date().toISOString().split('T')[0],
          description: 'Asiento de regularización',
          entry_type: 'regularization',
          status: 'posted',
          created_by: user_id
        })
        .select()
        .single();

      if (error) throw error;

      // Insert lines
      for (const line of lines) {
        await supabase.from('erp_journal_entry_lines').insert({
          entry_id: entry.id,
          ...line
        });
      }

      // Update closing record
      await supabase
        .from('erp_fiscal_closings')
        .update({ regularization_entry_id: entry.id })
        .eq('id', closingId);

      await logEvent(closingId, 'regularization_created', 
        `Asiento de regularización creado. Resultado: ${totalResult.toFixed(2)}`, 
        'info',
        { entry_id: entry.id, result: totalResult, lines_count: lines.length }
      );

      return entry;
    };

    // Create closing entry (all accounts to zero)
    const createClosingEntry = async (closingId: string) => {
      // Get all account balances
      const { data: balances } = await supabase.rpc('erp_get_account_balances', {
        p_company_id: company_id,
        p_fiscal_year_id: fiscal_year_id
      });

      const lines: any[] = [];

      balances?.forEach((acc: any) => {
        if (Math.abs(acc.balance) > 0.001) {
          lines.push({
            account_id: acc.account_id,
            debit_amount: acc.balance < 0 ? Math.abs(acc.balance) : 0,
            credit_amount: acc.balance > 0 ? acc.balance : 0,
            description: `Cierre ${acc.account_code}`
          });
        }
      });

      if (lines.length === 0) {
        await logEvent(closingId, 'closing_skipped', 'No hay saldos a cerrar', 'info');
        return null;
      }

      const { data: entry, error } = await supabase
        .from('erp_journal_entries')
        .insert({
          company_id,
          fiscal_year_id,
          entry_date: new Date().toISOString().split('T')[0],
          description: 'Asiento de cierre',
          entry_type: 'closing',
          status: 'posted',
          created_by: user_id
        })
        .select()
        .single();

      if (error) throw error;

      for (const line of lines) {
        await supabase.from('erp_journal_entry_lines').insert({
          entry_id: entry.id,
          ...line
        });
      }

      await supabase
        .from('erp_fiscal_closings')
        .update({ closing_entry_id: entry.id })
        .eq('id', closingId);

      await logEvent(closingId, 'closing_entry_created', 
        `Asiento de cierre creado con ${lines.length} líneas`, 
        'info',
        { entry_id: entry.id }
      );

      return entry;
    };

    // Create opening entry for new fiscal year
    const createOpeningEntry = async (closingId: string, newFiscalYearId: string) => {
      // Get balance sheet accounts (groups 1-5)
      const { data: balances } = await supabase.rpc('erp_get_account_balances', {
        p_company_id: company_id,
        p_fiscal_year_id: fiscal_year_id
      });

      const lines: any[] = [];

      balances?.forEach((acc: any) => {
        const code = acc.account_code || '';
        // Only balance sheet accounts (1-5)
        if (['1', '2', '3', '4', '5'].some(g => code.startsWith(g))) {
          if (Math.abs(acc.balance) > 0.001) {
            lines.push({
              account_id: acc.account_id,
              debit_amount: acc.balance > 0 ? acc.balance : 0,
              credit_amount: acc.balance < 0 ? Math.abs(acc.balance) : 0,
              description: `Apertura ${acc.account_code}`
            });
          }
        }
      });

      if (lines.length === 0) {
        await logEvent(closingId, 'opening_skipped', 'No hay saldos a traspasar', 'info');
        return null;
      }

      const { data: entry, error } = await supabase
        .from('erp_journal_entries')
        .insert({
          company_id,
          fiscal_year_id: newFiscalYearId,
          entry_date: new Date().toISOString().split('T')[0],
          description: 'Asiento de apertura',
          entry_type: 'opening',
          status: 'posted',
          created_by: user_id
        })
        .select()
        .single();

      if (error) throw error;

      for (const line of lines) {
        await supabase.from('erp_journal_entry_lines').insert({
          entry_id: entry.id,
          ...line
        });
      }

      await supabase
        .from('erp_fiscal_closings')
        .update({ opening_entry_id: entry.id })
        .eq('id', closingId);

      await logEvent(closingId, 'opening_entry_created', 
        `Asiento de apertura creado para nuevo ejercicio`, 
        'info',
        { entry_id: entry.id, new_fiscal_year_id: newFiscalYearId }
      );

      return entry;
    };

    // Execute action
    let result: any = {};
    const closing = await getOrCreateClosing();

    switch (action) {
      case 'validate':
        await supabase.from('erp_fiscal_closings').update({ status: 'validating' }).eq('id', closing.id);
        result = await validatePrerequisites(closing.id);
        break;

      case 'close_periods':
        result.periods = await closePeriods(closing.id);
        break;

      case 'regularization':
        result.entry = await createRegularizationEntry(closing.id, options?.target_account);
        break;

      case 'closing_entry':
        result.entry = await createClosingEntry(closing.id);
        break;

      case 'opening_entry':
        if (!options?.new_fiscal_year_id) {
          throw new Error('new_fiscal_year_id requerido para asiento de apertura');
        }
        result.entry = await createOpeningEntry(closing.id, options.new_fiscal_year_id);
        break;

      case 'full_wizard':
        await supabase.from('erp_fiscal_closings').update({ 
          status: 'validating',
          started_at: new Date().toISOString()
        }).eq('id', closing.id);

        // Step 1: Validate
        const validation = await validatePrerequisites(closing.id);
        if (!validation.valid) {
          result = { success: false, step: 'validation', ...validation };
          break;
        }

        await supabase.from('erp_fiscal_closings').update({ status: 'closing' }).eq('id', closing.id);

        // Step 2: Close periods
        result.periods = await closePeriods(closing.id);

        // Step 3: Regularization
        result.regularization = await createRegularizationEntry(closing.id, options?.target_account);

        // Step 4: Closing entry
        result.closing = await createClosingEntry(closing.id);

        // Step 5: Opening entry (if new fiscal year provided)
        if (options?.new_fiscal_year_id) {
          result.opening = await createOpeningEntry(closing.id, options.new_fiscal_year_id);
        }

        // Mark fiscal year as closed
        await supabase
          .from('erp_fiscal_years')
          .update({ status: 'closed' })
          .eq('id', fiscal_year_id);

        // Complete closing
        await supabase.from('erp_fiscal_closings').update({ 
          status: 'closed',
          completed_at: new Date().toISOString()
        }).eq('id', closing.id);

        await logEvent(closing.id, 'wizard_complete', 'Cierre de ejercicio completado', 'info');
        result.success = true;
        break;
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      closing_id: closing.id,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[erp-fiscal-closing-wizard] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
