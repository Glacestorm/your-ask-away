/**
 * Hook para gestión de empresas ERP
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ERPCompany, ERPCompanyGroup, CreateCompanyForm } from '@/types/erp';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export function useERPCompanies() {
  const { currentCompany, hasPermission, refreshCompanies } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<ERPCompany[]>([]);
  const [groups, setGroups] = useState<ERPCompanyGroup[]>([]);

  // Cargar todas las empresas (para admin)
  const fetchCompanies = useCallback(async () => {
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos para ver todas las empresas');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_companies')
        .select('*, group:erp_company_groups(*)')
        .order('name');

      if (error) throw error;
      setCompanies((data || []) as ERPCompany[]);
    } catch (err) {
      console.error('[useERPCompanies] fetchCompanies error:', err);
      toast.error('Error cargando empresas');
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission]);

  // Cargar grupos
  const fetchGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('erp_company_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups((data || []) as ERPCompanyGroup[]);
    } catch (err) {
      console.error('[useERPCompanies] fetchGroups error:', err);
    }
  }, []);

  // Crear empresa
  const createCompany = useCallback(async (form: CreateCompanyForm): Promise<ERPCompany | null> => {
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos para crear empresas');
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_companies')
        .insert([{
          name: form.name,
          legal_name: form.legal_name,
          tax_id: form.tax_id,
          address: form.address,
          city: form.city,
          postal_code: form.postal_code,
          country: form.country || 'ES',
          currency: form.currency || 'EUR',
          timezone: form.timezone || 'Europe/Madrid',
          phone: form.phone,
          email: form.email,
          website: form.website,
          group_id: form.group_id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Empresa creada correctamente');
      await refreshCompanies();
      return data as ERPCompany;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando empresa';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, refreshCompanies]);

  // Actualizar empresa
  const updateCompany = useCallback(async (
    companyId: string, 
    updates: Partial<CreateCompanyForm>
  ): Promise<boolean> => {
    if (!hasPermission('config.write')) {
      toast.error('Sin permisos para editar empresas');
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('erp_companies')
        .update(updates)
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Empresa actualizada');
      await refreshCompanies();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error actualizando empresa';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, refreshCompanies]);

  // Desactivar empresa
  const deactivateCompany = useCallback(async (companyId: string): Promise<boolean> => {
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos para desactivar empresas');
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('erp_companies')
        .update({ is_active: false })
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Empresa desactivada');
      await refreshCompanies();
      return true;
    } catch (err) {
      toast.error('Error desactivando empresa');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, refreshCompanies]);

  // Borrar empresa permanentemente
  const deleteCompany = useCallback(async (companyId: string): Promise<boolean> => {
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos para eliminar empresas');
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('erp_companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Empresa eliminada permanentemente');
      await refreshCompanies();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error eliminando empresa';
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, refreshCompanies]);

  // Crear grupo
  const createGroup = useCallback(async (name: string, description?: string): Promise<ERPCompanyGroup | null> => {
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('erp_company_groups')
        .insert([{ name, description }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Grupo creado');
      await fetchGroups();
      return data as ERPCompanyGroup;
    } catch (err) {
      toast.error('Error creando grupo');
      return null;
    }
  }, [hasPermission, fetchGroups]);

  return {
    companies,
    groups,
    isLoading,
    fetchCompanies,
    fetchGroups,
    createCompany,
    updateCompany,
    deactivateCompany,
    deleteCompany,
    createGroup,
  };
}

export default useERPCompanies;
