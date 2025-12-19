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
        ...mod,
        settings: (mod.settings as unknown as LowCodeModule['settings']) || {},
        dependencies: mod.dependencies || [],
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
          color: module.color || '#3b82f6',
          version: module.version || '1.0.0',
          is_active: module.is_active ?? true,
          settings: JSON.parse(JSON.stringify(module.settings || {})),
          dependencies: module.dependencies || [],
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
      if (updates.color) updateData.color = updates.color;
      if (updates.version) updateData.version = updates.version;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.settings) updateData.settings = JSON.parse(JSON.stringify(updates.settings));
      if (updates.dependencies) updateData.dependencies = updates.dependencies;

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
