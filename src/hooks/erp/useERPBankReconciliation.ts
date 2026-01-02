/**
 * Hook para Conciliación Bancaria ERP
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface BankStatementLine {
  id: string;
  statement_id: string;
  line_number: number;
  transaction_date: string;
  value_date: string;
  description: string;
  reference?: string;
  amount: number;
  matched_entity_type?: string;
  matched_entity_id?: string;
  match_score?: number;
  is_reconciled: boolean;
}

export interface BankStatement {
  id: string;
  company_id: string;
  bank_account_id: string;
  period_id?: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  imported_at?: string;
  source: 'manual' | 'ofx' | 'mt940' | 'camt';
  status: string;
  lines?: BankStatementLine[];
}

export function useERPBankReconciliation() {
  const { currentCompany } = useERPContext();
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [currentStatement, setCurrentStatement] = useState<BankStatement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  const fetchStatements = useCallback(async (bankAccountId?: string) => {
    if (!currentCompany?.id) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_bank_statements')
        .select(`
          *,
          lines:erp_bank_statement_lines(*)
        `)
        .eq('company_id', currentCompany.id)
        .order('statement_date', { ascending: false });

      if (bankAccountId) {
        query = query.eq('bank_account_id', bankAccountId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setStatements(data as BankStatement[]);
      return data;
    } catch (error) {
      console.error('[useERPBankReconciliation] Error:', error);
      toast.error('Error al cargar extractos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  const importStatement = useCallback(async (
    bankAccountId: string,
    file: File,
    source: 'ofx' | 'mt940' | 'camt'
  ) => {
    if (!currentCompany?.id) return null;

    setIsLoading(true);
    try {
      // Parse file content (simplified - would need actual parser)
      const content = await file.text();
      
      // Create statement
      const { data: statement, error } = await supabase
        .from('erp_bank_statements')
        .insert({
          company_id: currentCompany.id,
          bank_account_id: bankAccountId,
          statement_date: new Date().toISOString().split('T')[0],
          opening_balance: 0,
          closing_balance: 0,
          source,
          status: 'imported',
          imported_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Extracto importado correctamente');
      await fetchStatements(bankAccountId);
      return statement;
    } catch (error) {
      console.error('[useERPBankReconciliation] importStatement error:', error);
      toast.error('Error al importar extracto');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, fetchStatements]);

  const autoMatch = useCallback(async (statementId: string) => {
    if (!currentCompany?.id) return null;

    setIsMatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-auto-reconciliation', {
        body: {
          action: 'auto_match',
          company_id: currentCompany.id,
          statement_id: statementId
        }
      });

      if (error) throw error;

      toast.success(`${data?.matched_count || 0} movimientos conciliados`);
      await fetchStatements();
      return data;
    } catch (error) {
      console.error('[useERPBankReconciliation] autoMatch error:', error);
      toast.error('Error en conciliación automática');
      return null;
    } finally {
      setIsMatching(false);
    }
  }, [currentCompany?.id, fetchStatements]);

  const manualMatch = useCallback(async (
    lineId: string,
    entityType: 'payment' | 'receipt',
    entityId: string
  ) => {
    try {
      const { error } = await supabase
        .from('erp_bank_statement_lines')
        .update({
          matched_entity_type: entityType,
          matched_entity_id: entityId,
          match_score: 100,
          is_reconciled: true
        })
        .eq('id', lineId);

      if (error) throw error;

      toast.success('Movimiento conciliado');
      await fetchStatements();
      return true;
    } catch (error) {
      console.error('[useERPBankReconciliation] manualMatch error:', error);
      toast.error('Error al conciliar');
      return false;
    }
  }, [fetchStatements]);

  return {
    statements,
    currentStatement,
    isLoading,
    isMatching,
    setCurrentStatement,
    fetchStatements,
    importStatement,
    autoMatch,
    manualMatch
  };
}

export default useERPBankReconciliation;
