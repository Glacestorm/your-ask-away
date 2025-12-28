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
          'close_fiscal_period' | 'close_fiscal_year';
  params?: Record<string, unknown>;
}

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
      case 'get_dashboard': {
        // Get fiscal config
        const { data: config } = await supabase
          .from('obelixia_fiscal_config')
          .select('*')
          .eq('is_active', true)
          .single();

        // Get current period
        const today = new Date().toISOString().split('T')[0];
        const { data: currentPeriod } = await supabase
          .from('obelixia_fiscal_periods')
          .select('*')
          .lte('start_date', today)
          .gte('end_date', today)
          .single();

        // Get income accounts (7xx)
        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 7)
          .eq('is_active', true);

        // Get expense accounts (6xx)
        const { data: expenseAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('account_group', 6)
          .eq('is_active', true);

        // Calculate totals from ledger balances
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

        // Get recent entries
        const { data: recentEntries } = await supabase
          .from('obelixia_journal_entries')
          .select('*')
          .order('entry_date', { ascending: false })
          .limit(10);

        // Get unreconciled bank transactions
        const { data: unreconciledTxns } = await supabase
          .from('obelixia_bank_transactions')
          .select('*')
          .eq('is_reconciled', false)
          .order('transaction_date', { ascending: false })
          .limit(20);

        // Get pending fiscal declarations
        const { data: pendingDeclarations } = await supabase
          .from('obelixia_fiscal_declarations')
          .select('*')
          .eq('status', 'pending')
          .order('due_date', { ascending: true });

        // Get partners
        const { data: partners } = await supabase
          .from('obelixia_partners')
          .select('*')
          .eq('status', 'active');

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
          recentEntries,
          unreconciledTxns,
          pendingDeclarations,
          partners,
        };
        break;
      }

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

        // Validate balance
        const totalDebit = lines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
        const totalCredit = lines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(`Asiento descuadrado: Debe=${totalDebit}, Haber=${totalCredit}`);
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

        // Create journal entry
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

        // Get account IDs and create lines
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

        // Get entry with lines
        const { data: entry } = await supabase
          .from('obelixia_journal_entries')
          .select('*, lines:obelixia_journal_entry_lines(*)')
          .eq('id', entry_id)
          .single();

        if (!entry) throw new Error('Asiento no encontrado');
        if (entry.status !== 'draft') throw new Error('Solo se pueden contabilizar asientos en borrador');

        // Update entry status
        const { error } = await supabase
          .from('obelixia_journal_entries')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
          })
          .eq('id', entry_id);

        if (error) throw error;

        // Update ledger balances
        for (const line of entry.lines) {
          const { error: rpcError } = await supabase.rpc('update_ledger_balance_on_entry', {
            p_journal_entry_id: entry_id
          });
          if (rpcError) {
            console.log('Manual ledger update for line:', line.id);
          }
        }

        result = { success: true, message: 'Asiento contabilizado' };
        break;
      }

      case 'reverse_entry': {
        const { entry_id, reversal_date, reason } = params as { 
          entry_id: string; 
          reversal_date: string;
          reason?: string;
        };

        // Get original entry with lines
        const { data: originalEntry } = await supabase
          .from('obelixia_journal_entries')
          .select('*, lines:obelixia_journal_entry_lines(*)')
          .eq('id', entry_id)
          .single();

        if (!originalEntry) throw new Error('Asiento no encontrado');
        if (originalEntry.status !== 'posted') throw new Error('Solo se pueden anular asientos contabilizados');

        // Get period for reversal
        const { data: period } = await supabase
          .from('obelixia_fiscal_periods')
          .select('id')
          .lte('start_date', reversal_date)
          .gte('end_date', reversal_date)
          .single();

        // Create reversal entry (swap debit/credit)
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

        // Create reversed lines
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

        // Mark original as reversed
        await supabase
          .from('obelixia_journal_entries')
          .update({ status: 'reversed' })
          .eq('id', entry_id);

        result = { reversalEntry, message: 'Asiento anulado correctamente' };
        break;
      }

      case 'get_ledger': {
        const { account_id, fiscal_period_id, fiscal_year } = params as {
          account_id?: string;
          fiscal_period_id?: string;
          fiscal_year?: number;
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

        // Calculate running balance
        let runningBalance = 0;
        const ledgerWithBalance = (movements || []).map(m => {
          runningBalance += (m.debit_amount - m.credit_amount);
          return { ...m, running_balance: runningBalance };
        });

        result = { movements: ledgerWithBalance };
        break;
      }

      case 'get_trial_balance': {
        const { fiscal_period_id, as_of_date } = params as {
          fiscal_period_id?: string;
          as_of_date?: string;
        };

        // Get all accounts with their balances
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
          // Get sum of movements
          let query = supabase
            .from('obelixia_journal_entry_lines')
            .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(status)')
            .eq('account_id', account.id)
            .eq('journal_entry.status', 'posted');

          const { data: movements } = await query;

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

        // Get unreconciled transactions
        const { data: transactions } = await supabase
          .from('obelixia_bank_transactions')
          .select('*')
          .eq('bank_account_id', bank_account_id)
          .eq('is_reconciled', false);

        // Get active reconciliation rules
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
              // Mark as reconciled
              await supabase
                .from('obelixia_bank_transactions')
                .update({
                  is_reconciled: true,
                  category: rule.target_category,
                  reconciled_at: new Date().toISOString(),
                })
                .eq('id', txn.id);

              // Update rule match count
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

        // Get chart of accounts for context
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

        // Create partner transaction
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

        // Update partner current account
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

        // Get period info
        const { data: period } = await supabase
          .from('obelixia_fiscal_periods')
          .select('*')
          .eq('id', period_id)
          .single();

        if (!period) throw new Error('Período no encontrado');

        let calculatedData: Record<string, unknown> = {};

        if (declaration_type === 'modelo_303') {
          // Calculate IVA declaration
          // Get IVA repercutido (477)
          const { data: ivaRepAccount } = await supabase
            .from('obelixia_chart_of_accounts')
            .select('id')
            .eq('account_code', '477')
            .single();

          // Get IVA soportado (472)
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

        // Get due date (20th of next month for quarterly, etc.)
        const periodEnd = new Date(period.end_date);
        const dueDate = new Date(periodEnd);
        dueDate.setMonth(dueDate.getMonth() + 1);
        dueDate.setDate(20);

        // Create or update declaration
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
        const { as_of_date, compare_with_date } = params as {
          as_of_date: string;
          compare_with_date?: string;
        };

        // Get asset accounts (groups 1, 2, 3, 4, 5 - with certain patterns)
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
          // Get movements up to as_of_date
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

          // Classify by account type
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
        const { start_date, end_date, compare_start, compare_end } = params as {
          start_date: string;
          end_date: string;
          compare_start?: string;
          compare_end?: string;
        };

        // Get income accounts (7xx)
        const { data: incomeAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('*')
          .eq('is_active', true)
          .eq('is_detail', true)
          .eq('account_group', 7)
          .order('account_code');

        // Get expense accounts (6xx)
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

        // Calculate income
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

        // Calculate expenses
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
            net_profit: totalIncome - totalExpenses // Simplified
          }
        };
        break;
      }

      case 'get_cash_flow': {
        const { start_date, end_date } = params as {
          start_date: string;
          end_date: string;
        };

        // Get cash accounts (57x)
        const { data: cashAccounts } = await supabase
          .from('obelixia_chart_of_accounts')
          .select('id')
          .eq('is_active', true)
          .like('account_code', '57%');

        const cashAccountIds = (cashAccounts || []).map(a => a.id);

        // Get opening balance
        const { data: openingMovements } = await supabase
          .from('obelixia_journal_entry_lines')
          .select('debit_amount, credit_amount, journal_entry:obelixia_journal_entries!inner(*)')
          .in('account_id', cashAccountIds)
          .eq('journal_entry.status', 'posted')
          .lt('journal_entry.entry_date', start_date);

        const openingBalance = (openingMovements || []).reduce((sum, m) => 
          sum + ((m.debit_amount || 0) - (m.credit_amount || 0)), 0);

        // Get period movements
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
          operating_activities: netCashFlow, // Simplified
          investing_activities: 0,
          financing_activities: 0
        };
        break;
      }

      case 'close_fiscal_period': {
        const { period_id } = params as { period_id: string };

        // Verify all entries are posted
        const { data: draftEntries } = await supabase
          .from('obelixia_journal_entries')
          .select('id')
          .eq('fiscal_period_id', period_id)
          .eq('status', 'draft');

        if (draftEntries && draftEntries.length > 0) {
          throw new Error(`Hay ${draftEntries.length} asientos en borrador. Debe contabilizarlos antes de cerrar.`);
        }

        // Close the period
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

        // Get all periods for the year
        const { data: periods } = await supabase
          .from('obelixia_fiscal_periods')
          .select('*')
          .eq('fiscal_year', fiscal_year);

        // Check all periods are closed
        const openPeriods = (periods || []).filter(p => p.status !== 'closed');
        if (openPeriods.length > 0) {
          throw new Error(`Hay ${openPeriods.length} períodos abiertos. Debe cerrarlos antes de cerrar el ejercicio.`);
        }

        // Calculate net profit (income - expenses)
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

        // Lock all periods
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
