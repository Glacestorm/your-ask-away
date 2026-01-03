import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JournalEntryLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

interface JournalEntry {
  date: string;
  description: string;
  reference: string;
  lines: JournalEntryLine[];
  total_debit: number;
  total_credit: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, operation_category, operation_type, transaction_type, company_id, operation_data } = await req.json();
    
    console.log(`[erp-auto-accounting] Action: ${action}, Category: ${operation_category}, Type: ${operation_type}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'get_config': {
        if (!company_id) throw new Error('company_id is required');
        
        const { data: config, error } = await supabase
          .from('erp_auto_accounting_config')
          .select('*')
          .eq('company_id', company_id)
          .eq('is_active', true);
        
        if (error) throw error;
        
        return new Response(JSON.stringify({
          success: true,
          data: config
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_template': {
        if (!operation_category || !operation_type || !transaction_type) {
          throw new Error('operation_category, operation_type, and transaction_type are required');
        }
        
        // First check company config
        if (company_id) {
          const { data: companyConfig } = await supabase
            .from('erp_auto_accounting_config')
            .select('*')
            .eq('company_id', company_id)
            .eq('operation_category', operation_category)
            .eq('operation_type', operation_type)
            .eq('transaction_type', transaction_type)
            .eq('is_active', true)
            .single();
          
          if (companyConfig) {
            return new Response(JSON.stringify({
              success: true,
              data: companyConfig,
              source: 'company_config'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        // Fallback to default templates
        const { data: template, error } = await supabase
          .from('erp_accounting_templates')
          .select('*')
          .eq('operation_category', operation_category)
          .eq('operation_type', operation_type)
          .eq('transaction_type', transaction_type)
          .eq('is_default', true)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        return new Response(JSON.stringify({
          success: true,
          data: template,
          source: 'default_template'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_entry': {
        if (!operation_category || !operation_type || !transaction_type || !operation_data) {
          throw new Error('operation_category, operation_type, transaction_type, and operation_data are required');
        }
        
        // Get template
        let template;
        
        if (company_id) {
          const { data: companyConfig } = await supabase
            .from('erp_auto_accounting_config')
            .select('*')
            .eq('company_id', company_id)
            .eq('operation_category', operation_category)
            .eq('operation_type', operation_type)
            .eq('transaction_type', transaction_type)
            .eq('is_active', true)
            .single();
          
          template = companyConfig;
        }
        
        if (!template) {
          const { data: defaultTemplate } = await supabase
            .from('erp_accounting_templates')
            .select('*')
            .eq('operation_category', operation_category)
            .eq('operation_type', operation_type)
            .eq('transaction_type', transaction_type)
            .eq('is_default', true)
            .single();
          
          template = defaultTemplate;
        }
        
        if (!template) {
          throw new Error(`No accounting template found for ${operation_category}/${operation_type}/${transaction_type}`);
        }
        
        // Build journal entry
        const amount = operation_data.amount || operation_data.principal_amount || operation_data.total_amount || 0;
        const description = template.description_template
          .replace('{contract_number}', operation_data.contract_number || '')
          .replace('{investment_name}', operation_data.investment_name || '')
          .replace('{payment_number}', operation_data.payment_number || '');
        
        const entry: JournalEntry = {
          date: operation_data.date || new Date().toISOString().split('T')[0],
          description,
          reference: operation_data.contract_number || operation_data.id || '',
          lines: [
            {
              account_code: template.debit_account_code,
              account_name: template.debit_account_name || '',
              debit: amount,
              credit: 0,
              description
            },
            {
              account_code: template.credit_account_code,
              account_name: template.credit_account_name || '',
              debit: 0,
              credit: amount,
              description
            }
          ],
          total_debit: amount,
          total_credit: amount
        };
        
        // Add tax line if applicable
        if (template.tax_account_code && template.tax_rate) {
          const taxAmount = amount * (template.tax_rate / 100);
          entry.lines.push({
            account_code: template.tax_account_code,
            account_name: 'IVA Soportado',
            debit: taxAmount,
            credit: 0,
            description: `IVA ${template.tax_rate}%`
          });
          entry.total_debit += taxAmount;
          // Adjust credit line
          entry.lines[1].credit += taxAmount;
          entry.total_credit += taxAmount;
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            entry,
            template,
            auto_post: template.auto_post || false,
            requires_approval: template.requires_approval !== false
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'save_config': {
        if (!company_id || !operation_category || !operation_type || !transaction_type) {
          throw new Error('company_id, operation_category, operation_type, and transaction_type are required');
        }
        
        const { debit_account_code, debit_account_name, credit_account_code, credit_account_name, 
                tax_account_code, tax_rate, description_template, auto_post, requires_approval } = operation_data;
        
        const { data, error } = await supabase
          .from('erp_auto_accounting_config')
          .upsert({
            company_id,
            operation_category,
            operation_type,
            transaction_type,
            debit_account_code,
            debit_account_name,
            credit_account_code,
            credit_account_name,
            tax_account_code,
            tax_rate,
            description_template,
            auto_post: auto_post || false,
            requires_approval: requires_approval !== false,
            is_active: true
          }, {
            onConflict: 'company_id,operation_category,operation_type,transaction_type'
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({
          success: true,
          data
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_all_templates': {
        const { data: templates, error } = await supabase
          .from('erp_accounting_templates')
          .select('*')
          .order('operation_category', { ascending: true })
          .order('operation_type', { ascending: true });
        
        if (error) throw error;
        
        return new Response(JSON.stringify({
          success: true,
          data: templates
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[erp-auto-accounting] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
