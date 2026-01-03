/**
 * Hook para gestión de Cotizaciones de Acciones
 * Búsqueda, watchlist, cotizaciones en tiempo real
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface StockQuote {
  symbol: string;
  name: string;
  isin?: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  updatedAt: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  currency: string;
}

export function useERPStockQuotes() {
  const { currentCompany } = useERPContext();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // === FETCH WATCHLIST WITH PRICES ===
  const {
    data: watchlistQuotes = [],
    isLoading: isLoadingWatchlist,
    refetch: refetchWatchlist
  } = useQuery({
    queryKey: ['erp-stock-watchlist-quotes', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase.functions.invoke('erp-stock-quotes', {
        body: {
          action: 'update_watchlist',
          company_id: currentCompany.id
        }
      });

      if (error) throw error;
      if (!data?.success) return [];

      return data.data as StockQuote[];
    },
    enabled: !!currentCompany?.id,
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    staleTime: 30 * 1000
  });

  // === FETCH MARKET SUMMARY ===
  const {
    data: marketSummary,
    isLoading: isLoadingMarket
  } = useQuery({
    queryKey: ['erp-market-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('erp-stock-quotes', {
        body: { action: 'get_market_summary' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to fetch market summary');

      return data.data as { indices: MarketIndex[]; updatedAt: string };
    },
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000
  });

  // === SEARCH STOCKS ===
  const searchStocks = useCallback(async (query: string) => {
    if (!query || query.length < 2) return [];

    try {
      const { data, error } = await supabase.functions.invoke('erp-stock-quotes', {
        body: {
          action: 'search',
          query
        }
      });

      if (error) throw error;
      if (!data?.success) return [];

      return data.data as StockQuote[];
    } catch (err) {
      console.error('Error searching stocks:', err);
      return [];
    }
  }, []);

  // === GET QUOTES BY SYMBOLS ===
  const getQuotes = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return [];

    try {
      const { data, error } = await supabase.functions.invoke('erp-stock-quotes', {
        body: {
          action: 'get_quotes',
          symbols
        }
      });

      if (error) throw error;
      if (!data?.success) return [];

      return data.data as StockQuote[];
    } catch (err) {
      console.error('Error fetching quotes:', err);
      return [];
    }
  }, []);

  // === ADD TO WATCHLIST ===
  const addToWatchlistMutation = useMutation({
    mutationFn: async (stock: { symbol: string; stock_name: string; exchange?: string; currency?: string }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase
        .from('erp_market_stock_watchlist')
        .insert({
          company_id: currentCompany.id,
          symbol: stock.symbol,
          stock_name: stock.stock_name,
          exchange: stock.exchange,
          currency: stock.currency || 'EUR',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-stock-watchlist-quotes'] });
      toast.success('Añadido a seguimiento');
    },
    onError: (error) => {
      console.error('Error adding to watchlist:', error);
      toast.error('Error al añadir a seguimiento');
    }
  });

  // === REMOVE FROM WATCHLIST ===
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { error } = await supabase
        .from('erp_market_stock_watchlist')
        .delete()
        .eq('company_id', currentCompany.id)
        .eq('symbol', symbol);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-stock-watchlist-quotes'] });
      toast.success('Eliminado del seguimiento');
    },
    onError: (error) => {
      console.error('Error removing from watchlist:', error);
      toast.error('Error al eliminar del seguimiento');
    }
  });

  return {
    watchlistQuotes,
    marketSummary,
    isLoading: isLoadingWatchlist || isLoadingMarket,
    searchQuery,
    setSearchQuery,
    searchStocks,
    getQuotes,
    refetchWatchlist,
    addToWatchlist: addToWatchlistMutation.mutateAsync,
    removeFromWatchlist: removeFromWatchlistMutation.mutateAsync,
    isAddingToWatchlist: addToWatchlistMutation.isPending
  };
}

export default useERPStockQuotes;
