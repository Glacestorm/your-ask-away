/**
 * Hook para gestión de Inversiones
 * Depósitos, Bonos, Acciones, Fondos, Letras del Tesoro
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface Investment {
  id: string;
  company_id: string;
  investment_type: string;
  financial_entity_name: string | null;
  isin_code: string | null;
  investment_name: string;
  description: string | null;
  nominal_amount: number;
  current_value: number;
  currency: string;
  interest_rate: number | null;
  yield_rate: number | null;
  purchase_date: string;
  maturity_date: string | null;
  purchase_price: number | null;
  units_quantity: number | null;
  unit_price: number | null;
  bond_structure_type: string | null;
  coupon_frequency: string | null;
  next_coupon_date: string | null;
  status: string;
  accounting_account_code: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  company_id: string;
  transaction_type: string;
  transaction_date: string;
  units: number | null;
  price_per_unit: number | null;
  total_amount: number;
  fees: number | null;
  realized_pnl: number | null;
  journal_entry_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketStockWatchlist {
  id: string;
  company_id: string;
  isin_code: string | null;
  symbol: string;
  stock_name: string;
  exchange: string | null;
  currency: string;
  is_active: boolean;
  last_price: number | null;
  price_change: number | null;
  price_change_pct: number | null;
  day_high: number | null;
  day_low: number | null;
  volume: number | null;
  market_cap: number | null;
  price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvestmentForm {
  investment_type: string;
  financial_entity_name?: string;
  isin_code?: string;
  investment_name: string;
  description?: string;
  nominal_amount: number;
  currency?: string;
  interest_rate?: number;
  yield_rate?: number;
  purchase_date: string;
  maturity_date?: string;
  purchase_price?: number;
  units_quantity?: number;
  unit_price?: number;
  bond_structure_type?: string;
  coupon_frequency?: string;
  accounting_account_code?: string;
}

export interface CreateTransactionForm {
  investment_id: string;
  company_id: string;
  transaction_type: string;
  transaction_date: string;
  units?: number;
  price_per_unit?: number;
  total_amount: number;
  fees?: number;
  realized_pnl?: number;
  notes?: string;
}

export function useERPInvestments() {
  const { currentCompany } = useERPContext();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    investment_type: '' as string,
    status: '' as string,
    search: ''
  });

  // === FETCH INVESTMENTS ===
  const {
    data: investments = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['erp-investments', currentCompany?.id, filters],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      let query = supabase
        .from('erp_investments')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('purchase_date', { ascending: false });

      if (filters.investment_type) {
        query = query.eq('investment_type', filters.investment_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`investment_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,isin_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Investment[];
    },
    enabled: !!currentCompany?.id
  });

  // === FETCH SINGLE INVESTMENT WITH TRANSACTIONS ===
  const fetchInvestmentWithTransactions = useCallback(async (investmentId: string) => {
    const [invResult, txResult] = await Promise.all([
      supabase
        .from('erp_investments')
        .select('*')
        .eq('id', investmentId)
        .single(),
      supabase
        .from('erp_investment_transactions')
        .select('*')
        .eq('investment_id', investmentId)
        .order('transaction_date', { ascending: false })
    ]);

    if (invResult.error) throw invResult.error;
    if (txResult.error) throw txResult.error;

    return {
      investment: invResult.data as Investment,
      transactions: txResult.data as InvestmentTransaction[]
    };
  }, []);

  // === FETCH WATCHLIST ===
  const {
    data: watchlist = [],
    isLoading: isLoadingWatchlist,
    refetch: refetchWatchlist
  } = useQuery({
    queryKey: ['erp-stock-watchlist', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase
        .from('erp_market_stock_watchlist')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('symbol', { ascending: true });

      if (error) throw error;
      return data as MarketStockWatchlist[];
    },
    enabled: !!currentCompany?.id
  });

  // === CREATE INVESTMENT ===
  const createMutation = useMutation({
    mutationFn: async (form: CreateInvestmentForm) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const currentValue = form.units_quantity && form.unit_price 
        ? form.units_quantity * form.unit_price 
        : form.nominal_amount;

      const { data, error } = await supabase
        .from('erp_investments')
        .insert({
          company_id: currentCompany.id,
          ...form,
          current_value: currentValue,
          currency: form.currency || currentCompany.currency || 'EUR',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data as Investment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-investments'] });
      toast.success('Inversión creada');
    },
    onError: (error) => {
      console.error('Error creating investment:', error);
      toast.error('Error al crear la inversión');
    }
  });

  // === UPDATE INVESTMENT ===
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Investment> }) => {
      const { data, error } = await supabase
        .from('erp_investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Investment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-investments'] });
      toast.success('Inversión actualizada');
    },
    onError: (error) => {
      console.error('Error updating investment:', error);
      toast.error('Error al actualizar la inversión');
    }
  });

  // === DELETE INVESTMENT ===
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('erp_investments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-investments'] });
      toast.success('Inversión eliminada');
    },
    onError: (error) => {
      console.error('Error deleting investment:', error);
      toast.error('Error al eliminar la inversión');
    }
  });

  // === CREATE TRANSACTION ===
  const createTransactionMutation = useMutation({
    mutationFn: async (form: CreateTransactionForm) => {
      const { data, error } = await supabase
        .from('erp_investment_transactions')
        .insert({
          ...form,
          fees: form.fees || 0
        })
        .select()
        .single();

      if (error) throw error;
      return data as InvestmentTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-investments'] });
      toast.success('Transacción registrada');
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast.error('Error al registrar la transacción');
    }
  });

  // === UPDATE VALUATION ===
  const updateValuationMutation = useMutation({
    mutationFn: async ({ investmentId, newPrice, valuationDate }: {
      investmentId: string;
      newPrice: number;
      valuationDate: string;
    }) => {
      const { data: inv, error: fetchError } = await supabase
        .from('erp_investments')
        .select('*')
        .eq('id', investmentId)
        .single();

      if (fetchError) throw fetchError;

      const investment = inv as Investment;
      const newValue = investment.units_quantity 
        ? investment.units_quantity * newPrice 
        : newPrice;

      const { error: updateError } = await supabase
        .from('erp_investments')
        .update({
          unit_price: investment.units_quantity ? newPrice : null,
          current_value: newValue
        })
        .eq('id', investmentId);

      if (updateError) throw updateError;

      await supabase
        .from('erp_investment_transactions')
        .insert({
          investment_id: investmentId,
          company_id: investment.company_id,
          transaction_type: 'valuation',
          transaction_date: valuationDate,
          price_per_unit: investment.units_quantity ? newPrice : null,
          total_amount: newValue,
          fees: 0
        });

      return { newValue };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-investments'] });
      toast.success('Valoración actualizada');
    },
    onError: (error) => {
      console.error('Error updating valuation:', error);
      toast.error('Error al actualizar la valoración');
    }
  });

  // === ADD TO WATCHLIST ===
  const addToWatchlistMutation = useMutation({
    mutationFn: async (data: { symbol: string; stock_name: string; exchange?: string; currency?: string }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data: result, error } = await supabase
        .from('erp_market_stock_watchlist')
        .insert({
          company_id: currentCompany.id,
          ...data,
          currency: data.currency || 'EUR',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return result as MarketStockWatchlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-stock-watchlist'] });
      toast.success('Añadido a seguimiento');
    },
    onError: (error) => {
      console.error('Error adding to watchlist:', error);
      toast.error('Error al añadir a seguimiento');
    }
  });

  // === REMOVE FROM WATCHLIST ===
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('erp_market_stock_watchlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-stock-watchlist'] });
      toast.success('Eliminado del seguimiento');
    },
    onError: (error) => {
      console.error('Error removing from watchlist:', error);
      toast.error('Error al eliminar del seguimiento');
    }
  });

  // === STATS ===
  const stats = {
    totalInvestments: investments.length,
    activeInvestments: investments.filter(i => i.status === 'active').length,
    totalValue: investments
      .filter(i => i.status === 'active')
      .reduce((sum, i) => sum + i.current_value, 0),
    byType: investments.reduce((acc, inv) => {
      acc[inv.investment_type] = (acc[inv.investment_type] || 0) + inv.current_value;
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    investments,
    watchlist,
    isLoading,
    isLoadingWatchlist,
    error,
    stats,
    filters,
    setFilters,
    refetch,
    refetchWatchlist,
    fetchInvestmentWithTransactions,
    createInvestment: createMutation.mutateAsync,
    updateInvestment: updateMutation.mutateAsync,
    deleteInvestment: deleteMutation.mutateAsync,
    createTransaction: createTransactionMutation.mutateAsync,
    updateValuation: updateValuationMutation.mutateAsync,
    addToWatchlist: addToWatchlistMutation.mutateAsync,
    removeFromWatchlist: removeFromWatchlistMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

export default useERPInvestments;
