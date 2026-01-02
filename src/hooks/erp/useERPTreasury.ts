/**
 * Hook principal de Tesorería ERP
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface TreasuryStats {
  totalPayables: number;
  totalReceivables: number;
  pendingPayments: number;
  pendingReceipts: number;
  cashBalance: number;
  bankBalance: number;
}

export function useERPTreasury() {
  const { currentCompany } = useERPContext();
  const [stats, setStats] = useState<TreasuryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!currentCompany?.id) return null;
    
    setIsLoading(true);
    try {
      // Fetch payables
      const { data: payables } = await supabase
        .from('erp_payables')
        .select('amount, status')
        .eq('company_id', currentCompany.id);

      // Fetch receivables
      const { data: receivables } = await supabase
        .from('erp_receivables')
        .select('amount, status')
        .eq('company_id', currentCompany.id);

      const totalPayables = payables?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalReceivables = receivables?.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const pendingPayments = payables?.filter(p => p.status === 'pending').length || 0;
      const pendingReceipts = receivables?.filter(r => r.status === 'pending').length || 0;

      const result: TreasuryStats = {
        totalPayables,
        totalReceivables,
        pendingPayments,
        pendingReceipts,
        cashBalance: 0,
        bankBalance: 0
      };

      setStats(result);
      return result;
    } catch (error) {
      console.error('[useERPTreasury] Error:', error);
      toast.error('Error al cargar estadísticas de tesorería');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  return {
    stats,
    isLoading,
    fetchStats
  };
}

export default useERPTreasury;
