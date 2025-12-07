import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LongTermFinancialAnalysis from './LongTermFinancialAnalysis';
import { Loader2 } from 'lucide-react';

interface LongTermFinancialAnalysisWrapperProps {
  companyId: string;
  companyName: string;
}

const LongTermFinancialAnalysisWrapper: React.FC<LongTermFinancialAnalysisWrapperProps> = ({ companyId, companyName }) => {
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState<any[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<Record<string, any>>({});
  const [incomeStatements, setIncomeStatements] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
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

          // Convert to record by statement_id
          const balanceRecord: Record<string, any> = {};
          (balances || []).forEach(b => {
            balanceRecord[b.statement_id] = b;
          });

          const incomeRecord: Record<string, any> = {};
          (incomes || []).forEach(i => {
            incomeRecord[i.statement_id] = i;
          });

          setBalanceSheets(balanceRecord);
          setIncomeStatements(incomeRecord);
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
    <LongTermFinancialAnalysis
      companyId={companyId}
      companyName={companyName}
      statements={statements}
      balanceSheets={balanceSheets}
      incomeStatements={incomeStatements}
    />
  );
};

export default LongTermFinancialAnalysisWrapper;
