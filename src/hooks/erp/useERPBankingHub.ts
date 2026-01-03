/**
 * Hook para Banking Hub - Integración bancaria inteligente
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface BankingProvider {
  id: string;
  provider_code: string;
  provider_name: string;
  country_code: string;
  region: string;
  protocol: string;
  auth_type: string;
  supported_features: string[];
  logo_url?: string;
  is_active: boolean;
  requires_certificate: boolean;
  sandbox_available: boolean;
}

export interface BankAccount {
  id: string;
  company_id: string;
  account_name: string;
  account_number?: string;
  iban?: string;
  swift_bic?: string;
  bank_name?: string;
  currency: string;
  account_type: string;
  current_balance: number;
  available_balance: number;
  credit_limit: number;
  is_default: boolean;
  is_active: boolean;
  last_sync_at?: string;
}

export interface BankConnection {
  id: string;
  company_id: string;
  provider_id: string;
  bank_account_id?: string;
  connection_name: string;
  status: 'pending' | 'active' | 'expired' | 'error' | 'suspended';
  consent_expires_at?: string;
  last_sync_at?: string;
  next_sync_at?: string;
  sync_frequency: string;
  auto_reconcile: boolean;
  auto_create_entries: boolean;
  error_message?: string;
  error_count: number;
  provider?: BankingProvider;
  bank_account?: BankAccount;
}

export interface BankTransaction {
  id: string;
  connection_id: string;
  company_id: string;
  bank_account_id?: string;
  external_id: string;
  transaction_date: string;
  value_date?: string;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  counterparty_name?: string;
  counterparty_account?: string;
  category_name?: string;
  balance_after?: number;
  status: 'pending' | 'matched' | 'reconciled' | 'ignored' | 'error';
  match_confidence?: number;
  matched_entity_type?: string;
  matched_entity_id?: string;
  journal_entry_id?: string;
  ai_analysis?: Record<string, unknown>;
  suggested_account_id?: string;
}

export interface BankPosition {
  id: string;
  company_id: string;
  position_date: string;
  total_balance: number;
  total_available: number;
  total_credit_lines: number;
  total_used_credit: number;
  by_currency: Record<string, number>;
  by_bank: Record<string, number>;
  by_account: Record<string, { balance: number; name: string }>;
  cash_flow_forecast: Record<string, number>;
  alerts: Array<{ type: string; message: string }>;
}

export interface SyncLog {
  id: string;
  connection_id: string;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at?: string;
  records_fetched: number;
  records_processed: number;
  records_matched: number;
  entries_created: number;
  errors: unknown[];
}

export function useERPBankingHub() {
  const { currentCompany } = useERPContext();
  const [providers, setProviders] = useState<BankingProvider[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [position, setPosition] = useState<BankPosition | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch providers
  const fetchProviders = useCallback(async (filters?: { region?: string; country?: string }) => {
    try {
      let query = supabase
        .from('erp_banking_providers')
        .select('*')
        .eq('is_active', true)
        .order('provider_name');

      if (filters?.region) query = query.eq('region', filters.region);
      if (filters?.country) query = query.eq('country_code', filters.country);

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map(p => ({
        ...p,
        supported_features: Array.isArray(p.supported_features) 
          ? p.supported_features as string[]
          : typeof p.supported_features === 'string'
            ? JSON.parse(p.supported_features)
            : []
      }));
      
      setProviders(mapped as BankingProvider[]);
      return mapped;
    } catch (error) {
      console.error('[useERPBankingHub] fetchProviders error:', error);
      return [];
    }
  }, []);

  // Fetch bank accounts
  const fetchAccounts = useCallback(async () => {
    if (!currentCompany?.id) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_bank_accounts')
        .select('*')
        .eq('company_id', currentCompany.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAccounts(data as BankAccount[]);
      return data;
    } catch (error) {
      console.error('[useERPBankingHub] fetchAccounts error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    if (!currentCompany?.id) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_bank_connections')
        .select(`
          *,
          provider:erp_banking_providers(*),
          bank_account:erp_bank_accounts(*)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data as unknown as BankConnection[]);
      return data;
    } catch (error) {
      console.error('[useERPBankingHub] fetchConnections error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (filters?: {
    connectionId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) => {
    if (!currentCompany?.id) return [];
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('erp_bank_transactions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('transaction_date', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.connectionId) query = query.eq('connection_id', filters.connectionId);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.dateFrom) query = query.gte('transaction_date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('transaction_date', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;

      setTransactions(data as BankTransaction[]);
      return data;
    } catch (error) {
      console.error('[useERPBankingHub] fetchTransactions error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Fetch current position
  const fetchPosition = useCallback(async (date?: string) => {
    if (!currentCompany?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('erp_bank_positions')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('position_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPosition(data as unknown as BankPosition);
      }
      return data;
    } catch (error) {
      console.error('[useERPBankingHub] fetchPosition error:', error);
      return null;
    }
  }, [currentCompany?.id]);

  // Create bank account
  const createAccount = useCallback(async (account: Partial<BankAccount>) => {
    if (!currentCompany?.id) return null;

    try {
      const { data, error } = await supabase
        .from('erp_bank_accounts')
        .insert([{
          account_name: account.account_name || 'Nueva cuenta',
          account_number: account.account_number,
          iban: account.iban,
          swift_bic: account.swift_bic,
          bank_name: account.bank_name,
          currency: account.currency || 'EUR',
          account_type: account.account_type || 'checking',
          current_balance: account.current_balance || 0,
          available_balance: account.available_balance || 0,
          credit_limit: account.credit_limit || 0,
          is_default: account.is_default || false,
          is_active: true,
          company_id: currentCompany.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Cuenta bancaria creada');
      await fetchAccounts();
      return data;
    } catch (error) {
      console.error('[useERPBankingHub] createAccount error:', error);
      toast.error('Error al crear cuenta');
      return null;
    }
  }, [currentCompany?.id, fetchAccounts]);

  // Create connection
  const createConnection = useCallback(async (connection: {
    provider_id: string;
    bank_account_id?: string;
    connection_name: string;
    sync_frequency?: string;
    auto_reconcile?: boolean;
    auto_create_entries?: boolean;
  }) => {
    if (!currentCompany?.id) return null;

    try {
      const { data, error } = await supabase
        .from('erp_bank_connections')
        .insert({
          ...connection,
          company_id: currentCompany.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Conexión creada. Configure la autenticación.');
      await fetchConnections();
      return data;
    } catch (error) {
      console.error('[useERPBankingHub] createConnection error:', error);
      toast.error('Error al crear conexión');
      return null;
    }
  }, [currentCompany?.id, fetchConnections]);

  // Sync connection via Edge Function
  const syncConnection = useCallback(async (connectionId: string, syncType: 'transactions' | 'balance' | 'full' = 'transactions') => {
    if (!currentCompany?.id) return null;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-banking-hub', {
        body: {
          action: 'sync',
          company_id: currentCompany.id,
          connection_id: connectionId,
          sync_type: syncType
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Sincronización completada: ${data.records_processed || 0} registros`);
        await Promise.all([fetchTransactions(), fetchConnections(), fetchPosition()]);
      } else {
        toast.error(data?.error || 'Error en sincronización');
      }

      return data;
    } catch (error) {
      console.error('[useERPBankingHub] syncConnection error:', error);
      toast.error('Error al sincronizar');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [currentCompany?.id, fetchTransactions, fetchConnections, fetchPosition]);

  // Auto-reconcile transactions with AI
  const autoReconcile = useCallback(async (transactionIds?: string[]) => {
    if (!currentCompany?.id) return null;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('erp-banking-hub', {
        body: {
          action: 'auto_reconcile',
          company_id: currentCompany.id,
          transaction_ids: transactionIds
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.matched_count || 0} transacciones conciliadas automáticamente`);
        await fetchTransactions();
      }

      return data;
    } catch (error) {
      console.error('[useERPBankingHub] autoReconcile error:', error);
      toast.error('Error en conciliación automática');
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [currentCompany?.id, fetchTransactions]);

  // Manual reconcile
  const manualReconcile = useCallback(async (
    transactionId: string,
    entityType: string,
    entityId: string
  ) => {
    try {
      const { error } = await supabase
        .from('erp_bank_transactions')
        .update({
          matched_entity_type: entityType,
          matched_entity_id: entityId,
          match_confidence: 100,
          status: 'reconciled',
          reconciled_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Transacción conciliada');
      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('[useERPBankingHub] manualReconcile error:', error);
      toast.error('Error al conciliar');
      return false;
    }
  }, [fetchTransactions]);

  // Create journal entries from transactions
  const createJournalEntries = useCallback(async (transactionIds: string[]) => {
    if (!currentCompany?.id) return null;

    try {
      const { data, error } = await supabase.functions.invoke('erp-banking-hub', {
        body: {
          action: 'create_entries',
          company_id: currentCompany.id,
          transaction_ids: transactionIds
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.entries_created || 0} asientos creados`);
        await fetchTransactions();
      }

      return data;
    } catch (error) {
      console.error('[useERPBankingHub] createJournalEntries error:', error);
      toast.error('Error al crear asientos');
      return null;
    }
  }, [currentCompany?.id, fetchTransactions]);

  // Update connection status
  const updateConnectionStatus = useCallback(async (
    connectionId: string, 
    status: BankConnection['status'],
    errorMessage?: string
  ) => {
    try {
      // First get current error count if status is error
      let newErrorCount = 0;
      if (status === 'error') {
        const { data: current } = await supabase
          .from('erp_bank_connections')
          .select('error_count')
          .eq('id', connectionId)
          .single();
        newErrorCount = (current?.error_count || 0) + 1;
      }

      const { error } = await supabase
        .from('erp_bank_connections')
        .update({
          status,
          error_message: errorMessage,
          error_count: newErrorCount
        })
        .eq('id', connectionId);

      if (error) throw error;
      await fetchConnections();
      return true;
    } catch (error) {
      console.error('[useERPBankingHub] updateConnectionStatus error:', error);
      return false;
    }
  }, [fetchConnections]);

  // Stats
  const stats = {
    totalAccounts: accounts.length,
    activeConnections: connections.filter(c => c.status === 'active').length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    totalBalance: position?.total_balance || 0,
    totalAvailable: position?.total_available || 0
  };

  // Initial fetch
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchAccounts();
      fetchConnections();
      fetchPosition();
    }
  }, [currentCompany?.id, fetchAccounts, fetchConnections, fetchPosition]);

  return {
    // Data
    providers,
    accounts,
    connections,
    transactions,
    position,
    syncLogs,
    stats,
    // State
    isLoading,
    isSyncing,
    // Actions
    fetchProviders,
    fetchAccounts,
    fetchConnections,
    fetchTransactions,
    fetchPosition,
    createAccount,
    createConnection,
    syncConnection,
    autoReconcile,
    manualReconcile,
    createJournalEntries,
    updateConnectionStatus
  };
}

export default useERPBankingHub;
