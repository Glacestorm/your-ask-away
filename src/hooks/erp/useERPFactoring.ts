/**
 * Hook for ERP Factoring Operations
 * Manages factoring contracts and invoice assignments
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface FactoringContract {
  id: string;
  company_id: string | null;
  contract_number: string;
  financial_entity_id: string | null;
  financial_entity?: {
    name: string;
  };
  contract_type: 'with_recourse' | 'without_recourse' | 'reverse_factoring';
  status: 'active' | 'suspended' | 'terminated' | 'expired';
  global_limit: number;
  used_limit: number;
  available_limit: number;
  advance_percentage: number;
  interest_rate: number;
  commission_rate: number;
  currency: string;
  start_date: string;
  end_date: string | null;
  debtor_limits: Record<string, number>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactoringAssignment {
  id: string;
  company_id: string | null;
  contract_id: string;
  contract?: {
    contract_number: string;
    financial_entity_id: string | null;
  };
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  debtor_id: string | null;
  debtor?: {
    legal_name: string;
  };
  debtor_name: string;
  debtor_tax_id: string | null;
  invoice_amount: number;
  assigned_amount: number;
  advance_amount: number;
  advance_percentage: number;
  status: 'pending' | 'approved' | 'advanced' | 'collected' | 'defaulted' | 'rejected';
  assignment_date: string;
  advance_date: string | null;
  collection_date: string | null;
  collected_amount: number | null;
  interest_charged: number;
  commission_charged: number;
  net_settlement: number | null;
  recourse_date: string | null;
  recourse_exercised: boolean;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactoringStats {
  totalContracts: number;
  activeContracts: number;
  totalLimit: number;
  usedLimit: number;
  availableLimit: number;
  pendingAssignments: number;
  advancedAmount: number;
  collectedAmount: number;
}

export function useERPFactoring() {
  const { currentCompany } = useERPContext();
  const companyId = currentCompany?.id;
  const [contracts, setContracts] = useState<FactoringContract[]>([]);
  const [assignments, setAssignments] = useState<FactoringAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FactoringStats>({
    totalContracts: 0,
    activeContracts: 0,
    totalLimit: 0,
    usedLimit: 0,
    availableLimit: 0,
    pendingAssignments: 0,
    advancedAmount: 0,
    collectedAmount: 0,
  });

  // Fetch contracts
  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('erp_factoring_contracts')
        .select(`
          *,
          financial_entity:erp_financial_entities(name)
        `)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        contract_type: item.contract_type as FactoringContract['contract_type'],
        status: item.status as FactoringContract['status'],
        debtor_limits: (item.debtor_limits as Record<string, number>) || {},
        financial_entity: item.financial_entity as { name: string } | undefined,
      })) as FactoringContract[];
      
      setContracts(typedData);
      calculateStats(typedData, assignments);
    } catch (error) {
      console.error('Error fetching factoring contracts:', error);
      toast.error('Error al cargar contratos de factoring');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  // Fetch assignments
  const fetchAssignments = useCallback(async (contractId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('erp_factoring_assignments')
        .select(`
          *,
          contract:erp_factoring_contracts(contract_number, financial_entity_id),
          debtor:erp_trade_partners(legal_name)
        `)
        .order('assignment_date', { ascending: false });

      if (contractId) {
        query = query.eq('contract_id', contractId);
      } else if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as FactoringAssignment['status'],
        contract: item.contract as FactoringAssignment['contract'] | undefined,
        debtor: item.debtor as { legal_name: string } | undefined,
      })) as FactoringAssignment[];
      
      setAssignments(typedData);
      calculateStats(contracts, typedData);
    } catch (error) {
      console.error('Error fetching factoring assignments:', error);
      toast.error('Error al cargar cesiones de factoring');
    } finally {
      setLoading(false);
    }
  }, [companyId, contracts]);

  // Calculate stats
  const calculateStats = (contractsList: FactoringContract[], assignmentsList: FactoringAssignment[]) => {
    const activeContracts = contractsList.filter(c => c.status === 'active');
    const totalLimit = activeContracts.reduce((sum, c) => sum + Number(c.global_limit), 0);
    const usedLimit = activeContracts.reduce((sum, c) => sum + Number(c.used_limit), 0);
    const pendingAssignments = assignmentsList.filter(a => a.status === 'pending').length;
    const advancedAmount = assignmentsList
      .filter(a => a.status === 'advanced')
      .reduce((sum, a) => sum + Number(a.advance_amount), 0);
    const collectedAmount = assignmentsList
      .filter(a => a.status === 'collected')
      .reduce((sum, a) => sum + Number(a.collected_amount || 0), 0);

    setStats({
      totalContracts: contractsList.length,
      activeContracts: activeContracts.length,
      totalLimit,
      usedLimit,
      availableLimit: totalLimit - usedLimit,
      pendingAssignments,
      advancedAmount,
      collectedAmount,
    });
  };

  // Create contract
  const createContract = useCallback(async (contract: {
    contract_number: string;
    financial_entity_id?: string | null;
    contract_type: 'with_recourse' | 'without_recourse' | 'reverse_factoring';
    global_limit: number;
    advance_percentage: number;
    interest_rate: number;
    commission_rate: number;
    currency: string;
    start_date: string;
    end_date?: string | null;
    notes?: string | null;
  }) => {
    try {
      const { data, error } = await supabase
        .from('erp_factoring_contracts')
        .insert([{
          contract_number: contract.contract_number,
          financial_entity_id: contract.financial_entity_id || null,
          contract_type: contract.contract_type,
          global_limit: contract.global_limit,
          used_limit: 0,
          advance_percentage: contract.advance_percentage,
          interest_rate: contract.interest_rate,
          commission_rate: contract.commission_rate,
          currency: contract.currency,
          start_date: contract.start_date,
          end_date: contract.end_date || null,
          notes: contract.notes || null,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Contrato de factoring creado');
      fetchContracts();
      return data;
    } catch (error) {
      console.error('Error creating factoring contract:', error);
      toast.error('Error al crear contrato de factoring');
      return null;
    }
  }, [companyId, fetchContracts]);

  // Update contract
  const updateContract = useCallback(async (id: string, updates: Partial<FactoringContract>) => {
    try {
      const { error } = await supabase
        .from('erp_factoring_contracts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Contrato actualizado');
      fetchContracts();
      return true;
    } catch (error) {
      console.error('Error updating factoring contract:', error);
      toast.error('Error al actualizar contrato');
      return false;
    }
  }, [fetchContracts]);

  // Create assignment
  const createAssignment = useCallback(async (assignment: {
    contract_id: string;
    invoice_number: string;
    invoice_date: string;
    due_date: string;
    debtor_id?: string | null;
    debtor_name: string;
    debtor_tax_id?: string | null;
    invoice_amount: number;
    assigned_amount: number;
    advance_amount: number;
    advance_percentage: number;
    currency: string;
    notes?: string | null;
  }) => {
    try {
      const { data, error } = await supabase
        .from('erp_factoring_assignments')
        .insert([{
          ...assignment,
          company_id: companyId,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Cesión de factura creada');
      fetchAssignments();
      return data;
    } catch (error) {
      console.error('Error creating factoring assignment:', error);
      toast.error('Error al crear cesión de factura');
      return null;
    }
  }, [companyId, fetchAssignments]);

  // Update assignment status
  const updateAssignmentStatus = useCallback(async (
    id: string, 
    status: FactoringAssignment['status'],
    additionalData?: Partial<FactoringAssignment>
  ) => {
    try {
      const updates: Partial<FactoringAssignment> = { status, ...additionalData };
      
      if (status === 'advanced') {
        updates.advance_date = new Date().toISOString().split('T')[0];
      } else if (status === 'collected') {
        updates.collection_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('erp_factoring_assignments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Estado de cesión actualizado');
      fetchAssignments();
      return true;
    } catch (error) {
      console.error('Error updating assignment status:', error);
      toast.error('Error al actualizar estado');
      return false;
    }
  }, [fetchAssignments]);

  // Initial fetch
  useEffect(() => {
    fetchContracts();
    fetchAssignments();
  }, [fetchContracts, fetchAssignments]);

  return {
    contracts,
    assignments,
    loading,
    stats,
    fetchContracts,
    fetchAssignments,
    createContract,
    updateContract,
    createAssignment,
    updateAssignmentStatus,
  };
}

export default useERPFactoring;
