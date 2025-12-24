import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface TransactionEnrichmentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface RawTransaction {
  id?: string;
  transaction_id?: string;
  date?: string;
  transaction_date?: string;
  amount: number;
  description?: string;
  raw_description?: string;
  merchant_name?: string;
  mcc_code?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

export interface EnrichedTransaction {
  id: string;
  company_id: string;
  original_transaction_id: string;
  transaction_date: string;
  amount: number;
  merchant_name: string;
  merchant_logo_url: string | null;
  category: string;
  subcategory: string;
  mcc_code: string | null;
  location: {
    latitude?: number;
    longitude?: number;
    address?: string;
  } | null;
  is_recurring: boolean;
  recurring_type: string | null;
  recurring_frequency: string | null;
  confidence_score: number;
  raw_description: string;
  enriched_at: string;
  created_at: string;
}

export interface TransactionSummary {
  totalVolume: number;
  avgMonthlyVolume: number;
  transactionCount: number;
  categoryBreakdown: Record<string, number>;
  recurringCount: number;
}

export interface EnrichmentResult {
  success: boolean;
  enriched_count: number;
  transactions: EnrichedTransaction[];
  summary: TransactionSummary;
}

export function useTransactionEnrichment(companyId: string | null) {
  const queryClient = useQueryClient();
  const [isEnriching, setIsEnriching] = useState(false);
  // === ESTADO KB ===
  const [error, setError] = useState<TransactionEnrichmentError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  // Fetch enriched transactions for a company
  const { data: enrichedTransactions, isLoading, refetch } = useQuery({
    queryKey: ['enriched-transactions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error: fetchError } = await supabase
        .from('enriched_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('transaction_date', { ascending: false })
        .limit(500);

      if (fetchError) {
        setError({
          code: 'FETCH_TRANSACTIONS_ERROR',
          message: fetchError.message,
          details: { originalError: String(fetchError) }
        });
        throw fetchError;
      }
      setLastRefresh(new Date());
      return data as EnrichedTransaction[];
    },
    enabled: !!companyId,
  });

  // Enrich transactions via Edge Function
  const enrichTransactions = useCallback(async (
    transactions: RawTransaction[]
  ): Promise<EnrichmentResult | null> => {
    if (!companyId) {
      toast.error('Se requiere un ID de empresa');
      return null;
    }

    setIsEnriching(true);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-transaction', {
        body: { 
          companyId,
          transactions 
        }
      });

      if (error) throw error;

      // Invalidate cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['enriched-transactions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['customer-360-profile', companyId] });
      
      toast.success(`${data.enriched_count} transacciones enriquecidas`);
      return data as EnrichmentResult;
    } catch (err: any) {
      console.error('Error enriching transactions:', err);
      setError({
        code: 'ENRICH_ERROR',
        message: err.message,
        details: { originalError: String(err) }
      });
      toast.error('Error al enriquecer transacciones: ' + err.message);
      return null;
    } finally {
      setIsEnriching(false);
    }
  }, [companyId, queryClient]);

  // Delete enriched transaction
  const deleteTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from('enriched_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enriched-transactions', companyId] });
      toast.success('Transacción eliminada');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar: ' + error.message);
    }
  });

  // Calculate summary from enriched transactions
  const summary: TransactionSummary | null = enrichedTransactions?.length ? {
    totalVolume: enrichedTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
    avgMonthlyVolume: enrichedTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) / 12,
    transactionCount: enrichedTransactions.length,
    categoryBreakdown: enrichedTransactions.reduce((acc, tx) => {
      const cat = tx.category || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, number>),
    recurringCount: enrichedTransactions.filter(tx => tx.is_recurring).length,
  } : null;

  // Get transactions by category
  const getByCategory = useCallback((category: string): EnrichedTransaction[] => {
    if (!enrichedTransactions) return [];
    return enrichedTransactions.filter(tx => tx.category === category);
  }, [enrichedTransactions]);

  // Get recurring transactions
  const getRecurringTransactions = useCallback((): EnrichedTransaction[] => {
    if (!enrichedTransactions) return [];
    return enrichedTransactions.filter(tx => tx.is_recurring);
  }, [enrichedTransactions]);

  // Get transactions by date range
  const getByDateRange = useCallback((startDate: Date, endDate: Date): EnrichedTransaction[] => {
    if (!enrichedTransactions) return [];
    return enrichedTransactions.filter(tx => {
      const txDate = new Date(tx.transaction_date);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [enrichedTransactions]);

  // Get top merchants by volume
  const getTopMerchants = useCallback((limit = 10): { merchant: string; volume: number; count: number }[] => {
    if (!enrichedTransactions) return [];
    
    const merchantStats: Record<string, { volume: number; count: number }> = {};
    
    for (const tx of enrichedTransactions) {
      const merchant = tx.merchant_name || 'Desconocido';
      if (!merchantStats[merchant]) {
        merchantStats[merchant] = { volume: 0, count: 0 };
      }
      merchantStats[merchant].volume += Math.abs(tx.amount);
      merchantStats[merchant].count += 1;
    }

    return Object.entries(merchantStats)
      .map(([merchant, stats]) => ({ merchant, ...stats }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, limit);
  }, [enrichedTransactions]);

  return {
    // Data
    enrichedTransactions: enrichedTransactions || [],
    summary,
    
    // Loading states
    isLoading,
    isEnriching,
    
    // Actions
    enrichTransactions,
    deleteTransaction: deleteTransaction.mutate,
    refetch,
    
    // Utility functions
    getByCategory,
    getRecurringTransactions,
    getByDateRange,
    getTopMerchants,
    
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
}

// Hook for bulk enrichment operations
export function useBulkTransactionEnrichment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const enrichAllCompanyTransactions = useCallback(async (
    companyIds: string[],
    transactionsPerCompany: Record<string, RawTransaction[]>
  ) => {
    setIsProcessing(true);
    setProgress(0);

    const results: { companyId: string; success: boolean; count: number }[] = [];
    
    for (let i = 0; i < companyIds.length; i++) {
      const companyId = companyIds[i];
      const transactions = transactionsPerCompany[companyId] || [];
      
      if (transactions.length === 0) {
        results.push({ companyId, success: true, count: 0 });
        continue;
      }

      try {
        const { data, error } = await supabase.functions.invoke('enrich-transaction', {
          body: { companyId, transactions }
        });

        if (error) throw error;

        results.push({ companyId, success: true, count: data.enriched_count });
        queryClient.invalidateQueries({ queryKey: ['enriched-transactions', companyId] });
      } catch (e) {
        results.push({ companyId, success: false, count: 0 });
      }

      setProgress(Math.round(((i + 1) / companyIds.length) * 100));
    }

    setIsProcessing(false);
    
    const totalEnriched = results.reduce((sum, r) => sum + r.count, 0);
    toast.success(`${totalEnriched} transacciones enriquecidas en ${companyIds.length} empresas`);
    
    return results;
  }, [queryClient]);

  return {
    enrichAllCompanyTransactions,
    isProcessing,
    progress,
  };
}
