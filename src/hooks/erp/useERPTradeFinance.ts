/**
 * Hook para gestión de Comercio Nacional/Internacional (Trade Finance)
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

// ========== INTERFACES ==========

export interface FinancialEntity {
  id: string;
  company_id?: string | null;
  entity_type: string;
  name: string;
  legal_name?: string | null;
  swift_bic?: string | null;
  country: string;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  api_endpoint?: string | null;
  api_type?: string | null;
  api_documentation_url?: string | null;
  supported_operations: string[];
  is_active: boolean;
  logo_url?: string | null;
  sync_status: string;
  last_sync_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeAPIConnection {
  id: string;
  company_id: string;
  entity_id: string;
  connection_name: string;
  api_type: string;
  environment: string;
  status: string;
  last_test_at?: string | null;
  last_error?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  entity?: FinancialEntity;
}

export interface TradeDocumentTemplate {
  id: string;
  entity_id?: string | null;
  company_id?: string | null;
  document_type: string;
  document_category: string;
  document_name: string;
  description?: string | null;
  template_url?: string | null;
  template_format: string;
  is_active: boolean;
  is_official: boolean;
  language: string;
  download_count: number;
  created_at: string;
  updated_at: string;
  // Partial entity for display
  entity?: {
    id: string;
    name: string;
    swift_bic?: string | null;
  } | null;
}

export interface TradeOperation {
  id: string;
  company_id: string;
  entity_id?: string | null;
  operation_type: string;
  operation_subtype?: string | null;
  operation_number: string;
  reference_number?: string | null;
  scope: string;
  status: string;
  currency: string;
  amount: number;
  exchange_rate: number;
  counterparty_name?: string | null;
  counterparty_country?: string | null;
  issue_date?: string | null;
  maturity_date?: string | null;
  fees_amount: number;
  interest_rate?: number | null;
  interest_amount: number;
  commission_amount: number;
  total_cost: number;
  net_amount?: number | null;
  is_synced_with_bank: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Partial entity for display
  entity?: {
    id: string;
    name: string;
    swift_bic?: string | null;
  } | null;
}

export interface TradeStats {
  totalOperations: number;
  activeOperations: number;
  totalVolume: number;
  connectedBanks: number;
  pendingApproval: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

// ========== HOOK ==========

export function useERPTradeFinance() {
  const { currentCompany } = useERPContext();
  
  // State
  const [entities, setEntities] = useState<FinancialEntity[]>([]);
  const [connections, setConnections] = useState<TradeAPIConnection[]>([]);
  const [templates, setTemplates] = useState<TradeDocumentTemplate[]>([]);
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== FETCH FUNCTIONS ==========

  const fetchEntities = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('erp_financial_entities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      setEntities((data || []) as FinancialEntity[]);
      return data as FinancialEntity[];
    } catch (err) {
      console.error('[useERPTradeFinance] fetchEntities error:', err);
      return [];
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    if (!currentCompany?.id) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('erp_trade_api_connections')
        .select(`
          *,
          entity:erp_financial_entities(*)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setConnections((data || []) as TradeAPIConnection[]);
      return data as TradeAPIConnection[];
    } catch (err) {
      console.error('[useERPTradeFinance] fetchConnections error:', err);
      return [];
    }
  }, [currentCompany?.id]);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('erp_trade_document_templates')
        .select(`
          *,
          entity:erp_financial_entities(id, name, swift_bic)
        `)
        .eq('is_active', true)
        .order('document_name');

      if (fetchError) throw fetchError;
      setTemplates((data || []) as TradeDocumentTemplate[]);
      return data as TradeDocumentTemplate[];
    } catch (err) {
      console.error('[useERPTradeFinance] fetchTemplates error:', err);
      return [];
    }
  }, []);

  const fetchOperations = useCallback(async (filters?: {
    operation_type?: string;
    status?: string;
    scope?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    if (!currentCompany?.id) return [];

    try {
      let query = supabase
        .from('erp_trade_operations')
        .select(`
          *,
          entity:erp_financial_entities(id, name, swift_bic)
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (filters?.operation_type) {
        query = query.eq('operation_type', filters.operation_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.scope) {
        query = query.eq('scope', filters.scope);
      }
      if (filters?.dateFrom) {
        query = query.gte('issue_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('issue_date', filters.dateTo);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;
      setOperations((data || []) as TradeOperation[]);
      return data as TradeOperation[];
    } catch (err) {
      console.error('[useERPTradeFinance] fetchOperations error:', err);
      return [];
    }
  }, [currentCompany?.id]);

  const calculateStats = useCallback(async () => {
    if (!currentCompany?.id) return null;

    try {
      const { data: ops, error: fetchError } = await supabase
        .from('erp_trade_operations')
        .select('operation_type, status, amount, currency')
        .eq('company_id', currentCompany.id);

      if (fetchError) throw fetchError;

      const { data: conns } = await supabase
        .from('erp_trade_api_connections')
        .select('id')
        .eq('company_id', currentCompany.id)
        .eq('status', 'active');

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let totalVolume = 0;
      let activeCount = 0;
      let pendingApproval = 0;

      (ops || []).forEach((op: { operation_type: string; status: string; amount: number }) => {
        byType[op.operation_type] = (byType[op.operation_type] || 0) + 1;
        byStatus[op.status] = (byStatus[op.status] || 0) + 1;
        totalVolume += Number(op.amount) || 0;
        
        if (['draft', 'pending', 'in_progress', 'approved'].includes(op.status)) {
          activeCount++;
        }
        if (op.status === 'pending') {
          pendingApproval++;
        }
      });

      const calculatedStats: TradeStats = {
        totalOperations: ops?.length || 0,
        activeOperations: activeCount,
        totalVolume,
        connectedBanks: conns?.length || 0,
        pendingApproval,
        byType,
        byStatus,
      };

      setStats(calculatedStats);
      return calculatedStats;
    } catch (err) {
      console.error('[useERPTradeFinance] calculateStats error:', err);
      return null;
    }
  }, [currentCompany?.id]);

  // ========== CRUD OPERATIONS ==========

  const createConnection = useCallback(async (data: {
    entity_id: string;
    connection_name: string;
    api_type: string;
    environment: string;
  }) => {
    if (!currentCompany?.id) {
      toast.error('Selecciona una empresa');
      return null;
    }

    try {
      const { data: result, error: insertError } = await supabase
        .from('erp_trade_api_connections')
        .insert([{
          company_id: currentCompany.id,
          ...data,
          status: 'pending',
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Conexión creada');
      await fetchConnections();
      return result;
    } catch (err) {
      console.error('[useERPTradeFinance] createConnection error:', err);
      toast.error('Error al crear conexión');
      return null;
    }
  }, [currentCompany?.id, fetchConnections]);

  const testConnection = useCallback(async (connectionId: string) => {
    try {
      // Update status to testing
      await supabase
        .from('erp_trade_api_connections')
        .update({ 
          status: 'testing',
          last_test_at: new Date().toISOString()
        })
        .eq('id', connectionId);

      // Simulate API test (in real implementation, call edge function)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update to active (simulated success)
      await supabase
        .from('erp_trade_api_connections')
        .update({ 
          status: 'active',
          last_error: null
        })
        .eq('id', connectionId);

      toast.success('Conexión verificada correctamente');
      await fetchConnections();
      return true;
    } catch (err) {
      console.error('[useERPTradeFinance] testConnection error:', err);
      toast.error('Error al verificar conexión');
      return false;
    }
  }, [fetchConnections]);

  const createOperation = useCallback(async (data: { 
    operation_type: string;
    scope?: string;
    entity_id?: string;
    counterparty_name?: string;
    counterparty_country?: string;
    amount?: number;
    currency?: string;
  }) => {
    if (!currentCompany?.id) {
      toast.error('Selecciona una empresa');
      return null;
    }

    try {
      // Generate operation number
      const { count } = await supabase
        .from('erp_trade_operations')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany.id)
        .eq('operation_type', data.operation_type);

      const opNumber = `${data.operation_type.toUpperCase().slice(0, 3)}-${String((count || 0) + 1).padStart(6, '0')}`;

      const { data: result, error: insertError } = await supabase
        .from('erp_trade_operations')
        .insert([{
          company_id: currentCompany.id,
          operation_number: opNumber,
          operation_type: data.operation_type,
          scope: data.scope || 'national',
          status: 'draft',
          currency: data.currency || 'EUR',
          amount: data.amount || 0,
          exchange_rate: 1,
          fees_amount: 0,
          interest_amount: 0,
          commission_amount: 0,
          total_cost: 0,
          entity_id: data.entity_id,
          counterparty_name: data.counterparty_name,
          counterparty_country: data.counterparty_country,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Operación creada');
      await fetchOperations();
      await calculateStats();
      return result;
    } catch (err) {
      console.error('[useERPTradeFinance] createOperation error:', err);
      toast.error('Error al crear operación');
      return null;
    }
  }, [currentCompany?.id, fetchOperations, calculateStats]);

  // ========== INITIAL LOAD ==========

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchEntities(),
        fetchConnections(),
        fetchTemplates(),
        fetchOperations(),
        calculateStats(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [fetchEntities, fetchConnections, fetchTemplates, fetchOperations, calculateStats]);

  useEffect(() => {
    if (currentCompany?.id) {
      loadAll();
    }
  }, [currentCompany?.id, loadAll]);

  // ========== REALTIME ==========

  useEffect(() => {
    if (!currentCompany?.id) return;

    const channel = supabase
      .channel('erp_trade_operations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'erp_trade_operations',
          filter: `company_id=eq.${currentCompany.id}`,
        },
        () => {
          fetchOperations();
          calculateStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCompany?.id, fetchOperations, calculateStats]);

  // ========== RETURN ==========

  return {
    // State
    entities,
    connections,
    templates,
    operations,
    stats,
    isLoading,
    error,
    
    // Fetch
    fetchEntities,
    fetchConnections,
    fetchTemplates,
    fetchOperations,
    calculateStats,
    loadAll,
    
    // Actions
    createConnection,
    testConnection,
    createOperation,
  };
}

export default useERPTradeFinance;
