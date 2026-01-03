/**
 * Hook para gestión de Contabilidad Automática
 * Generación automática de asientos para operaciones de financiación e inversiones
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export interface AccountingConfig {
  id: string;
  company_id: string;
  operation_category: string;
  operation_type: string;
  transaction_type: string;
  debit_account_code: string;
  debit_account_name: string | null;
  credit_account_code: string;
  credit_account_name: string | null;
  tax_account_code: string | null;
  tax_rate: number | null;
  description_template: string | null;
  is_active: boolean;
  auto_post: boolean;
  requires_approval: boolean;
}

export interface AccountingTemplate {
  id: string;
  template_name: string;
  country_code: string;
  framework_code: string;
  operation_category: string;
  operation_type: string;
  transaction_type: string;
  debit_account_code: string;
  debit_account_name: string | null;
  credit_account_code: string;
  credit_account_name: string | null;
  tax_account_code: string | null;
  tax_rate: number | null;
  description_template: string | null;
  is_default: boolean;
}

export interface JournalEntryLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface GeneratedJournalEntry {
  date: string;
  description: string;
  reference: string;
  lines: JournalEntryLine[];
  total_debit: number;
  total_credit: number;
}

export function useERPAutoAccounting() {
  const { currentCompany } = useERPContext();
  const queryClient = useQueryClient();

  // === FETCH COMPANY CONFIG ===
  const {
    data: config = [],
    isLoading: isLoadingConfig,
    refetch: refetchConfig
  } = useQuery({
    queryKey: ['erp-auto-accounting-config', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      const { data, error } = await supabase.functions.invoke('erp-auto-accounting', {
        body: {
          action: 'get_config',
          company_id: currentCompany.id
        }
      });

      if (error) throw error;
      if (!data?.success) return [];

      return data.data as AccountingConfig[];
    },
    enabled: !!currentCompany?.id
  });

  // === FETCH ALL TEMPLATES ===
  const {
    data: templates = [],
    isLoading: isLoadingTemplates
  } = useQuery({
    queryKey: ['erp-accounting-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('erp-auto-accounting', {
        body: { action: 'get_all_templates' }
      });

      if (error) throw error;
      if (!data?.success) return [];

      return data.data as AccountingTemplate[];
    }
  });

  // === GET TEMPLATE FOR OPERATION ===
  const getTemplate = useCallback(async (
    operationCategory: string,
    operationType: string,
    transactionType: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('erp-auto-accounting', {
        body: {
          action: 'get_template',
          operation_category: operationCategory,
          operation_type: operationType,
          transaction_type: transactionType,
          company_id: currentCompany?.id
        }
      });

      if (error) throw error;
      if (!data?.success) return null;

      return {
        template: data.data as AccountingConfig | AccountingTemplate,
        source: data.source as 'company_config' | 'default_template'
      };
    } catch (err) {
      console.error('Error getting template:', err);
      return null;
    }
  }, [currentCompany?.id]);

  // === GENERATE JOURNAL ENTRY ===
  const generateEntry = useCallback(async (
    operationCategory: string,
    operationType: string,
    transactionType: string,
    operationData: Record<string, unknown>
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('erp-auto-accounting', {
        body: {
          action: 'generate_entry',
          operation_category: operationCategory,
          operation_type: operationType,
          transaction_type: transactionType,
          company_id: currentCompany?.id,
          operation_data: operationData
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate entry');

      return data.data as {
        entry: GeneratedJournalEntry;
        template: AccountingConfig | AccountingTemplate;
        auto_post: boolean;
        requires_approval: boolean;
      };
    } catch (err) {
      console.error('Error generating entry:', err);
      toast.error('Error al generar asiento');
      return null;
    }
  }, [currentCompany?.id]);

  // === SAVE CONFIG ===
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: {
      operation_category: string;
      operation_type: string;
      transaction_type: string;
      debit_account_code: string;
      debit_account_name?: string;
      credit_account_code: string;
      credit_account_name?: string;
      tax_account_code?: string;
      tax_rate?: number;
      description_template?: string;
      auto_post?: boolean;
      requires_approval?: boolean;
    }) => {
      if (!currentCompany?.id) throw new Error('No company selected');

      const { data, error } = await supabase.functions.invoke('erp-auto-accounting', {
        body: {
          action: 'save_config',
          company_id: currentCompany.id,
          operation_category: configData.operation_category,
          operation_type: configData.operation_type,
          transaction_type: configData.transaction_type,
          operation_data: configData
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to save config');

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erp-auto-accounting-config'] });
      toast.success('Configuración guardada');
    },
    onError: (error) => {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    }
  });

  // === GROUP TEMPLATES BY CATEGORY ===
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.operation_category]) {
      acc[template.operation_category] = [];
    }
    acc[template.operation_category].push(template);
    return acc;
  }, {} as Record<string, AccountingTemplate[]>);

  // === CHECK IF OPERATION HAS CONFIG ===
  const hasConfig = useCallback((
    operationCategory: string,
    operationType: string,
    transactionType: string
  ) => {
    return config.some(c => 
      c.operation_category === operationCategory &&
      c.operation_type === operationType &&
      c.transaction_type === transactionType &&
      c.is_active
    );
  }, [config]);

  return {
    config,
    templates,
    templatesByCategory,
    isLoading: isLoadingConfig || isLoadingTemplates,
    refetchConfig,
    getTemplate,
    generateEntry,
    saveConfig: saveConfigMutation.mutateAsync,
    hasConfig,
    isSaving: saveConfigMutation.isPending
  };
}

export default useERPAutoAccounting;
