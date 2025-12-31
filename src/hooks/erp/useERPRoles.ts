/**
 * Hook para gestión de roles y permisos ERP
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ERPRole, ERPPermission, CreateRoleForm } from '@/types/erp';
import { useERPContext } from './useERPContext';
import { toast } from 'sonner';

export function useERPRoles() {
  const { currentCompany, hasPermission } = useERPContext();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<ERPRole[]>([]);
  const [permissions, setPermissions] = useState<ERPPermission[]>([]);

  // Cargar permisos disponibles
  const fetchPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('erp_permissions')
        .select('*')
        .order('module')
        .order('action');

      if (error) throw error;
      setPermissions((data || []) as ERPPermission[]);
    } catch (err) {
      console.error('[useERPRoles] fetchPermissions error:', err);
    }
  }, []);

  // Cargar roles de la empresa
  const fetchRoles = useCallback(async () => {
    if (!currentCompany?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('erp_roles')
        .select(`
          *,
          erp_role_permissions(
            permission:erp_permissions(*)
          )
        `)
        .or(`company_id.eq.${currentCompany.id},company_id.is.null`)
        .order('name');

      if (error) throw error;

      // Mapear permisos
      const rolesWithPermissions = (data || []).map((r: any) => ({
        ...r,
        permissions: r.erp_role_permissions?.map((rp: any) => rp.permission).filter(Boolean) || [],
      }));

      setRoles(rolesWithPermissions as ERPRole[]);
    } catch (err) {
      console.error('[useERPRoles] fetchRoles error:', err);
      toast.error('Error cargando roles');
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id]);

  // Crear rol
  const createRole = useCallback(async (form: CreateRoleForm): Promise<ERPRole | null> => {
    if (!currentCompany?.id) return null;
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos');
      return null;
    }

    setIsLoading(true);
    try {
      // Crear rol
      const { data: role, error: roleError } = await supabase
        .from('erp_roles')
        .insert([{
          company_id: currentCompany.id,
          name: form.name,
          description: form.description,
        }])
        .select()
        .single();

      if (roleError) throw roleError;

      // Asignar permisos
      if (form.permission_ids.length > 0) {
        const rolePermissions = form.permission_ids.map(pid => ({
          role_id: role.id,
          permission_id: pid,
        }));

        const { error: rpError } = await supabase
          .from('erp_role_permissions')
          .insert(rolePermissions);

        if (rpError) console.warn('Error asignando permisos:', rpError);
      }

      toast.success('Rol creado');
      await fetchRoles();
      return role as ERPRole;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando rol';
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany?.id, hasPermission, fetchRoles]);

  // Actualizar permisos de rol
  const updateRolePermissions = useCallback(async (
    roleId: string, 
    permissionIds: string[]
  ): Promise<boolean> => {
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos');
      return false;
    }

    try {
      // Eliminar permisos actuales
      await supabase
        .from('erp_role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Insertar nuevos permisos
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(pid => ({
          role_id: roleId,
          permission_id: pid,
        }));

        const { error } = await supabase
          .from('erp_role_permissions')
          .insert(rolePermissions);

        if (error) throw error;
      }

      toast.success('Permisos actualizados');
      await fetchRoles();
      return true;
    } catch (err) {
      toast.error('Error actualizando permisos');
      return false;
    }
  }, [hasPermission, fetchRoles]);

  // Eliminar rol
  const deleteRole = useCallback(async (roleId: string): Promise<boolean> => {
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos');
      return false;
    }

    try {
      const { error } = await supabase
        .from('erp_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast.success('Rol eliminado');
      await fetchRoles();
      return true;
    } catch (err) {
      toast.error('Error eliminando rol');
      return false;
    }
  }, [hasPermission, fetchRoles]);

  // Asignar rol a usuario
  const assignRoleToUser = useCallback(async (
    userId: string, 
    roleId: string,
    isDefault = false
  ): Promise<boolean> => {
    if (!currentCompany?.id) return false;
    if (!hasPermission('admin.all')) {
      toast.error('Sin permisos');
      return false;
    }

    try {
      // Verificar si ya existe la relación
      const { data: existing } = await supabase
        .from('erp_user_companies')
        .select('id')
        .eq('user_id', userId)
        .eq('company_id', currentCompany.id)
        .single();

      if (existing) {
        // Actualizar rol
        const { error } = await supabase
          .from('erp_user_companies')
          .update({ role_id: roleId, is_default: isDefault })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Crear relación
        const { error } = await supabase
          .from('erp_user_companies')
          .insert([{
            user_id: userId,
            company_id: currentCompany.id,
            role_id: roleId,
            is_default: isDefault,
          }]);

        if (error) throw error;
      }

      toast.success('Rol asignado');
      return true;
    } catch (err) {
      toast.error('Error asignando rol');
      return false;
    }
  }, [currentCompany?.id, hasPermission]);

  // Agrupar permisos por módulo
  const getPermissionsByModule = useCallback(() => {
    const grouped: Record<string, ERPPermission[]> = {};
    permissions.forEach(p => {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    });
    return grouped;
  }, [permissions]);

  return {
    roles,
    permissions,
    isLoading,
    fetchRoles,
    fetchPermissions,
    createRole,
    updateRolePermissions,
    deleteRole,
    assignRoleToUser,
    getPermissionsByModule,
  };
}

export default useERPRoles;
