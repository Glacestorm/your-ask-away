/**
 * Hook para gestión de Operaciones de Financiación
 * Leasing, Pólizas de crédito, Préstamos, Renting
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface FinancingOperation {
  id: string;
  company_id: string;
  operation_type: string;
  loan_subtype: string | null;
  financial_entity_name: string;
  financial_entity_code: string | null;
  contract_number: string;
  description: string | null;
  principal_amount: number;
  outstanding_balance: number;
  currency: string;
  interest_rate: number;
  interest_type: string;
  reference_rate: string | null;
  spread: number | null;
  start_date: string;
  end_date: string;
  term_months: number;
  payment_frequency: string;
  next_payment_date: string | null;
  payment_amount: number | null;
  credit_limit: number | null;
  guarantee_type: string | null;
  guarantee_details: Json | null;
  asset_description: string | null;
  residual_value: number | null;
  status: string;
  accounting_account_code: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FinancingPayment {
  id: string;
  operation_id: string;
  company_id: string;
  payment_number: number;
  due_date: string;
  payment_date: string | null;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  fees: number | null;
  status: string;
  journal_entry_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFinancingOperationForm {
  operation_type: string;
  loan_subtype?: string;
  financial_entity_name: string;
  financial_entity_code?: string;
  contract_number: string;
  description?: string;
  principal_amount: number;
  currency?: string;
  interest_rate: number;
  interest_type: string;
  reference_rate?: string;
  spread?: number;
  start_date: string;
  end_date: string;
  term_months: number;
  payment_frequency: string;
  payment_amount?: number;
  credit_limit?: number;
  guarantee_type?: string;
  guarantee_details?: Json;
  asset_description?: string;
  residual_value?: number;
  accounting_account_code?: string;
}

export interface CreatePaymentForm {
  operation_id: string;
  company_id: string;
  payment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  fees?: number;
}

export function useERPFinancingOperations() {
  const { currentCompany } = useERPContext();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    operation_type: '' as string,
    status: '' as string,
    search: ''
  });

  // === FETCH OPERATIONS ===
  const {
    data: operations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['erp-financing-operations', currentCompany?.id, filters],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      let query = supabase
        .from('erp_financing_operations')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('start_date', { ascending: false });

      if (filters.operation_type) {
        query = query.eq('operation_type', filters.operation_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`contract_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%,financial_entity_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancingOperation[];
    },
    enabled: !!currentCompany?.id
  });

  // === FETCH SINGLE OPERATION WITH PAYMENTS ===
  const fetchOperationWithPayments = useCallback(async (operationId: string) => {
    const [opResult, paymentsResult] = await Promise.all([
      supabase
        .from('erp_financing_operations')
        .select('*')
        .eq('id', operationId)
        .single(),
      supabase
        .from('erp_financing_payments')
        .select('*')
        .eq('operation_id', operationId)
        .order('payment_number', { ascending: true })
    ]);

    if (opResult.error) throw opResult.error;
    if (paymentsResult.error) throw paymentsResult.error;

    return {
      operation: opResult.data as FinancingOperation,
      payments: paymentsResult.data as FinancingPayment[]
    };
  }, []);

  // === CREATE OPERATION ===
  const createMutation = useMutation({
    mutationFn: async (form: CreateFinancingOperationForm) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const insertData = {
        company_id: currentCompany.id,
        operation_type: form.operation_type,
        loan_subtype: form.loan_subtype,
        financial_entity_name: form.financial_entity_name,
        financial_entity_code: form.financial_entity_code,
        contract_number: form.contract_number,
        description: form.description,
        principal_amount: form.principal_amount,
        outstanding_balance: form.principal_amount,
        currency: form.currency || currentCompany.currency || 'EUR',
        interest_rate: form.interest_rate,
        interest_type: form.interest_type,
        reference_rate: form.reference_rate,
        spread: form.spread,
        start_date: form.start_date,
        end_date: form.end_date,
        term_months: form.term_months,
        payment_frequency: form.payment_frequency,
        payment_amount: form.payment_amount,
        credit_limit: form.credit_limit,
        guarantee_type: form.guarantee_type,
        guarantee_details: form.guarantee_details,
        asset_description: form.asset_description,
        residual_value: form.residual_value,
        accounting_account_code: form.accounting_account_code,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('erp_financing_operations')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as FinancingOperation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-financing-operations'] });
      toast.success('Operación de financiación creada');
    },
    onError: (error) => {
      console.error('Error creating financing operation:', error);
      toast.error('Error al crear la operación');
    }
  });

  // === UPDATE OPERATION ===
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FinancingOperation> }) => {
      const { guarantee_details, ...rest } = updates;
      const updateData = guarantee_details !== undefined 
        ? { ...rest, guarantee_details: guarantee_details as Json }
        : rest;

      const { data, error } = await supabase
        .from('erp_financing_operations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FinancingOperation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-financing-operations'] });
      toast.success('Operación actualizada');
    },
    onError: (error) => {
      console.error('Error updating financing operation:', error);
      toast.error('Error al actualizar la operación');
    }
  });

  // === DELETE OPERATION ===
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('erp_financing_operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-financing-operations'] });
      toast.success('Operación eliminada');
    },
    onError: (error) => {
      console.error('Error deleting financing operation:', error);
      toast.error('Error al eliminar la operación');
    }
  });

  // === CREATE PAYMENT ===
  const createPaymentMutation = useMutation({
    mutationFn: async (form: CreatePaymentForm) => {
      const { data, error } = await supabase
        .from('erp_financing_payments')
        .insert({
          operation_id: form.operation_id,
          company_id: form.company_id,
          payment_number: form.payment_number,
          due_date: form.due_date,
          principal_amount: form.principal_amount,
          interest_amount: form.interest_amount,
          total_amount: form.total_amount,
          fees: form.fees || 0,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data as FinancingPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-financing-operations'] });
      toast.success('Pago programado');
    },
    onError: (error) => {
      console.error('Error creating payment:', error);
      toast.error('Error al crear el pago');
    }
  });

  // === REGISTER PAYMENT ===
  const registerPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, paymentDate }: { 
      paymentId: string; 
      paymentDate: string;
    }) => {
      const { data, error } = await supabase
        .from('erp_financing_payments')
        .update({
          payment_date: paymentDate,
          status: 'paid'
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data as FinancingPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-financing-operations'] });
      toast.success('Pago registrado');
    },
    onError: (error) => {
      console.error('Error registering payment:', error);
      toast.error('Error al registrar el pago');
    }
  });

  // === GENERATE AMORTIZATION SCHEDULE ===
  const generateAmortizationSchedule = useCallback((
    operationId: string,
    companyId: string,
    principal: number,
    annualRate: number,
    payments: number,
    frequency: string,
    startDate: Date
  ): CreatePaymentForm[] => {
    const schedule: CreatePaymentForm[] = [];
    
    const periodsPerYear: Record<string, number> = {
      monthly: 12,
      quarterly: 4,
      semi_annual: 2,
      annual: 1,
      bullet: 1
    };
    
    const periodicRate = annualRate / 100 / (periodsPerYear[frequency] || 12);
    
    if (frequency === 'bullet') {
      const totalInterest = principal * (annualRate / 100) * (payments / 12);
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + payments);
      schedule.push({
        operation_id: operationId,
        company_id: companyId,
        payment_number: 1,
        due_date: dueDate.toISOString().split('T')[0],
        principal_amount: principal,
        interest_amount: totalInterest,
        total_amount: principal + totalInterest
      });
    } else {
      const periodicPayment = principal * (periodicRate * Math.pow(1 + periodicRate, payments)) / 
                              (Math.pow(1 + periodicRate, payments) - 1);
      
      let outstanding = principal;
      const monthsPerPeriod = 12 / (periodsPerYear[frequency] || 12);
      
      for (let i = 1; i <= payments; i++) {
        const interestAmount = outstanding * periodicRate;
        const principalAmount = periodicPayment - interestAmount;
        outstanding -= principalAmount;
        
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i * monthsPerPeriod));
        
        schedule.push({
          operation_id: operationId,
          company_id: companyId,
          payment_number: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal_amount: Math.round(principalAmount * 100) / 100,
          interest_amount: Math.round(interestAmount * 100) / 100,
          total_amount: Math.round(periodicPayment * 100) / 100
        });
      }
    }
    
    return schedule;
  }, []);

  // === STATS ===
  const stats = {
    totalOperations: operations.length,
    activeOperations: operations.filter(o => o.status === 'active').length,
    totalOutstanding: operations
      .filter(o => o.status === 'active')
      .reduce((sum, o) => sum + o.outstanding_balance, 0),
    byType: operations.reduce((acc, op) => {
      acc[op.operation_type] = (acc[op.operation_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    operations,
    isLoading,
    error,
    stats,
    filters,
    setFilters,
    refetch,
    fetchOperationWithPayments,
    createOperation: createMutation.mutateAsync,
    updateOperation: updateMutation.mutateAsync,
    deleteOperation: deleteMutation.mutateAsync,
    createPayment: createPaymentMutation.mutateAsync,
    registerPayment: registerPaymentMutation.mutateAsync,
    generateAmortizationSchedule,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

export default useERPFinancingOperations;
