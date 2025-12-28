/**
 * License Bulk Operations Hook
 * Operaciones masivas de licencias
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { License } from '@/types/license';

export interface BulkGenerateParams {
  count: number;
  planId: string;
  licenseeEmails: string[];
  validDays?: number;
  prefix?: string;
}

export interface BulkImportRow {
  email: string;
  name?: string;
  company?: string;
  plan?: string;
  valid_days?: number;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  licenses?: License[];
}

export function useLicenseBulkOperations() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);

  const bulkGenerate = useCallback(async (params: BulkGenerateParams): Promise<BulkOperationResult> => {
    setLoading(true);
    setProgress(0);
    const result: BulkOperationResult = { success: 0, failed: 0, errors: [], licenses: [] };

    try {
      for (let i = 0; i < params.count; i++) {
        const email = params.licenseeEmails[i] || `license-${i + 1}@generated.local`;
        
        try {
          const { data, error } = await supabase.functions.invoke('license-manager', {
            body: {
              action: 'generate',
              planId: params.planId,
              licenseeEmail: email,
              validDays: params.validDays || 365,
            }
          });

          if (error) throw error;
          if (data?.license) {
            result.licenses?.push(data.license);
            result.success++;
          }
        } catch (err) {
          result.failed++;
          result.errors.push({ 
            row: i + 1, 
            error: err instanceof Error ? err.message : 'Error desconocido' 
          });
        }

        setProgress(Math.round(((i + 1) / params.count) * 100));
      }

      setOperationResult(result);
      
      if (result.success > 0) {
        toast.success(`${result.success} licencias generadas correctamente`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} licencias fallaron`);
      }

      return result;
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }, []);

  const importFromCSV = useCallback(async (csvContent: string): Promise<BulkOperationResult> => {
    setLoading(true);
    setProgress(0);
    const result: BulkOperationResult = { success: 0, failed: 0, errors: [], licenses: [] };

    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const rows: BulkImportRow[] = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: BulkImportRow = { email: '' };
        headers.forEach((header, idx) => {
          if (header === 'email') row.email = values[idx];
          if (header === 'name') row.name = values[idx];
          if (header === 'company') row.company = values[idx];
          if (header === 'plan') row.plan = values[idx];
          if (header === 'valid_days') row.valid_days = parseInt(values[idx]) || undefined;
        });
        return row;
      }).filter(r => r.email);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        try {
          const { data, error } = await supabase.functions.invoke('license-manager', {
            body: {
              action: 'generate',
              planCode: row.plan || 'professional',
              licenseeEmail: row.email,
              licenseeName: row.name,
              licenseeCompany: row.company,
              validDays: row.valid_days || 365,
            }
          });

          if (error) throw error;
          if (data?.license) {
            result.licenses?.push(data.license);
            result.success++;
          }
        } catch (err) {
          result.failed++;
          result.errors.push({ 
            row: i + 2, 
            error: err instanceof Error ? err.message : 'Error desconocido' 
          });
        }

        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setOperationResult(result);
      
      if (result.success > 0) {
        toast.success(`${result.success} licencias importadas`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} filas con errores`);
      }

      return result;
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }, []);

  const exportLicenses = useCallback(async (
    format: 'csv' | 'json', 
    filters?: { status?: string; planId?: string }
  ): Promise<boolean> => {
    setLoading(true);
    try {
      let query = supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.planId) query = query.eq('plan_id', filters.planId);

      const { data, error } = await query;
      if (error) throw error;

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `licenses-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const headers = [
          'ID', 'License Key Hash', 'Type', 'Status', 'Email', 'Company',
          'Max Users', 'Max Devices', 'Issued At', 'Expires At'
        ];
        const csvRows = [
          headers.join(','),
          ...(data || []).map((license: Record<string, unknown>) => [
            license.id,
            license.license_key_hash,
            license.license_type,
            license.status,
            license.licensee_email,
            license.licensee_company || '',
            license.max_users,
            license.max_devices,
            license.issued_at,
            license.expires_at || ''
          ].map(v => `"${v}"`).join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `licenses-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success('Licencias exportadas');
      return true;
    } catch (err) {
      console.error('[useLicenseBulkOperations] exportLicenses error:', err);
      toast.error('Error al exportar licencias');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (
    licenseIds: string[], 
    newStatus: string
  ): Promise<BulkOperationResult> => {
    setLoading(true);
    setProgress(0);
    const result: BulkOperationResult = { success: 0, failed: 0, errors: [] };

    try {
      for (let i = 0; i < licenseIds.length; i++) {
        try {
          const { error } = await supabase
            .from('licenses')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', licenseIds[i]);

          if (error) throw error;
          result.success++;
        } catch (err) {
          result.failed++;
          result.errors.push({ 
            row: i + 1, 
            error: err instanceof Error ? err.message : 'Error desconocido' 
          });
        }

        setProgress(Math.round(((i + 1) / licenseIds.length) * 100));
      }

      setOperationResult(result);
      toast.success(`${result.success} licencias actualizadas`);
      return result;
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setOperationResult(null);
  }, []);

  return {
    loading,
    progress,
    operationResult,
    bulkGenerate,
    importFromCSV,
    exportLicenses,
    bulkUpdateStatus,
    resetProgress,
  };
}

export default useLicenseBulkOperations;
