import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import WorkingCapitalAnalysis from './WorkingCapitalAnalysis';
import { Loader2 } from 'lucide-react';

interface WorkingCapitalAnalysisWrapperProps {
  companyId: string;
  companyName: string;
}

const WorkingCapitalAnalysisWrapper: React.FC<WorkingCapitalAnalysisWrapperProps> = ({ companyId, companyName }) => {
  const [loading, setLoading] = useState(true);
  const [balanceSheets, setBalanceSheets] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      setLoading(true);

      try {
        const { data: statements } = await supabase
          .from('company_financial_statements')
          .select('id, fiscal_year')
          .eq('company_id', companyId)
          .eq('is_archived', false)
          .order('fiscal_year', { ascending: false })
          .limit(5);

        if (statements && statements.length > 0) {
          const statementIds = statements.map(s => s.id);

          const { data: balances } = await supabase
            .from('balance_sheets')
            .select('*')
            .in('statement_id', statementIds);

          // Add fiscal_year to each balance sheet
          const balancesWithYear = (balances || []).map(balance => {
            const stmt = statements.find(s => s.id === balance.statement_id);
            return { ...balance, fiscal_year: stmt?.fiscal_year };
          });

          setBalanceSheets(balancesWithYear);
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

  if (balanceSheets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hi ha dades financeres disponibles per aquesta empresa.
      </div>
    );
  }

  return (
    <WorkingCapitalAnalysis
      companyId={companyId}
      companyName={companyName}
      balanceSheets={balanceSheets}
    />
  );
};

export default WorkingCapitalAnalysisWrapper;
