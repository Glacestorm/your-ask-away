import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LowCodePage, PageComponent } from '@/components/lowcode/types';
import { toast } from 'sonner';

export function useLowCodePages(moduleId?: string) {
  const queryClient = useQueryClient();

  const pagesQuery = useQuery({
    queryKey: ['lowcode-pages', moduleId],
    queryFn: async () => {
      let query = supabase
        .from('lowcode_page_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(page => ({
        ...page,
        components: (page.components as unknown as PageComponent[]) || [],
        permissions: (page.permissions as unknown as LowCodePage['permissions']) || { roles: [], users: [] },
      })) as LowCodePage[];
    },
  });

  const createPage = useMutation({
    mutationFn: async (page: Partial<LowCodePage>) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('lowcode_page_definitions')
        .insert({
          page_name: page.page_name || 'Nueva Página',
          page_key: page.page_key || `page_${Date.now()}`,
          description: page.description,
          module_id: page.module_id,
          layout: page.layout || 'single',
          components: JSON.parse(JSON.stringify(page.components || [])),
          route_path: page.route_path || `/custom/${Date.now()}`,
          is_public: page.is_public ?? false,
          permissions: JSON.parse(JSON.stringify(page.permissions || { roles: [], users: [] })),
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-pages'] });
      toast.success('Página creada correctamente');
    },
    onError: (error) => {
      toast.error('Error al crear página: ' + error.message);
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LowCodePage> & { id: string }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.page_name) updateData.page_name = updates.page_name;
      if (updates.page_key) updateData.page_key = updates.page_key;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.layout) updateData.layout = updates.layout;
      if (updates.components) updateData.components = JSON.parse(JSON.stringify(updates.components));
      if (updates.route_path) updateData.route_path = updates.route_path;
      if (updates.is_public !== undefined) updateData.is_public = updates.is_public;
      if (updates.permissions) updateData.permissions = JSON.parse(JSON.stringify(updates.permissions));

      const { data, error } = await supabase
        .from('lowcode_page_definitions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-pages'] });
      toast.success('Página actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar página: ' + error.message);
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lowcode_page_definitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-pages'] });
      toast.success('Página eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar página: ' + error.message);
    },
  });

  return {
    pages: pagesQuery.data || [],
    isLoading: pagesQuery.isLoading,
    error: pagesQuery.error,
    createPage,
    updatePage,
    deletePage,
  };
}
