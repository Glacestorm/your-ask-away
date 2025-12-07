import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import CashFlowAnalysis from './CashFlowAnalysis';
import { Loader2 } from 'lucide-react';

interface CashFlowAnalysisWrapperProps {
  companyId: string;
  companyName: string;
}

const CashFlowAnalysisWrapper: React.FC<CashFlowAnalysisWrapperProps> = ({ companyId, companyName }) => {
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<any[]>([]);
  const [incomeStatements, setIncomeStatements] = useState<any[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        const { data: stmts } = await supabase
          .from('company_financial_statements')
          .select('id, fiscal_year, statement_type, status')
          .eq('company_id', companyId)
          .eq('is_archived', false)
          .order('fiscal_year', { ascending: false })
          .limit(5);

        if (stmts && stmts.length > 0) {
          setStatements(stmts);

          const statementIds = stmts.map(s => s.id);

          const [{ data: balances }, { data: incomes }] = await Promise.all([
            supabase.from('balance_sheets').select('*').in('statement_id', statementIds),
            supabase.from('income_statements').select('*').in('statement_id', statementIds)
          ]);

          setBalanceSheets(balances || []);
          setIncomeStatements(incomes || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hi ha dades financeres disponibles per aquesta empresa.
      </div>
    );
  }

  return (
    <CashFlowAnalysis
      companyId={companyId}
      companyName={companyName}
      statements={statements}
      incomeStatements={incomeStatements}
      balanceSheets={balanceSheets}
    />
  );
};

export default CashFlowAnalysisWrapper;
