import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LowCodeModule } from '@/components/lowcode/types';
import { toast } from 'sonner';

export function useLowCodeModules() {
  const queryClient = useQueryClient();

  const modulesQuery = useQuery({
    queryKey: ['lowcode-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lowcode_modules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(mod => ({
        id: mod.id,
        module_key: mod.module_key,
        module_name: mod.module_name,
        description: mod.description || '',
        icon: mod.icon || 'Box',
        color: '#3b82f6',
        category: mod.category || '',
        forms: mod.forms || [],
        pages: mod.pages || [],
        rules: mod.rules || [],
        reports: mod.reports || [],
        permissions: (mod.permissions as unknown as LowCodeModule['permissions']) || { viewRoles: [], adminRoles: [] },
        settings: (mod.settings as unknown as Record<string, unknown>) || {},
        dependencies: [],
        status: mod.status as LowCodeModule['status'] || 'draft',
        is_active: true,
        version: String(mod.version || '1.0.0'),
        created_by: mod.created_by || undefined,
        published_at: mod.published_at || undefined,
        created_at: mod.created_at || undefined,
        updated_at: mod.updated_at || undefined,
      })) as LowCodeModule[];
    },
  });

  const createModule = useMutation({
    mutationFn: async (module: Partial<LowCodeModule>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('lowcode_modules')
        .insert({
          module_name: module.module_name || 'Nuevo Módulo',
          module_key: module.module_key || `module_${Date.now()}`,
          description: module.description,
          icon: module.icon || 'Box',
          version: 1,
          settings: JSON.parse(JSON.stringify(module.settings || {})),
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-modules'] });
      toast.success('Módulo creado correctamente');
    },
    onError: (error) => {
      toast.error('Error al crear módulo: ' + error.message);
    },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LowCodeModule> & { id: string }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.module_name) updateData.module_name = updates.module_name;
      if (updates.module_key) updateData.module_key = updates.module_key;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.icon) updateData.icon = updates.icon;
      if (updates.version) updateData.version = parseInt(updates.version) || 1;
      if (updates.settings) updateData.settings = JSON.parse(JSON.stringify(updates.settings));

      const { data, error } = await supabase
        .from('lowcode_modules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-modules'] });
      toast.success('Módulo actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar módulo: ' + error.message);
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lowcode_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-modules'] });
      toast.success('Módulo eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar módulo: ' + error.message);
    },
  });

  return {
    modules: modulesQuery.data || [],
    isLoading: modulesQuery.isLoading,
    error: modulesQuery.error,
    createModule,
    updateModule,
    deleteModule,
  };
}
