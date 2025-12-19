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
        id: page.id,
        page_key: page.page_key,
        page_name: page.page_name,
        description: page.description || '',
        module_id: page.module_id || undefined,
        layout: ((page.layout as unknown as { type?: string })?.type || 'single') as LowCodePage['layout'],
        components: (page.blocks as unknown as PageComponent[]) || [],
        route_path: `/custom/${page.page_key}`,
        is_public: page.status === 'published',
        permissions: { roles: [], users: [] },
        created_by: page.created_by || undefined,
        created_at: page.created_at || undefined,
        updated_at: page.updated_at || undefined,
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
          layout: JSON.parse(JSON.stringify({ type: page.layout || 'single' })),
          blocks: JSON.parse(JSON.stringify(page.components || [])),
          status: page.is_public ? 'published' : 'draft',
          visibility_rules: JSON.parse(JSON.stringify(page.permissions || { roles: [], users: [] })),
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
      if (updates.layout) updateData.layout = JSON.parse(JSON.stringify({ type: updates.layout }));
      if (updates.components) updateData.blocks = JSON.parse(JSON.stringify(updates.components));
      if (updates.is_public !== undefined) updateData.status = updates.is_public ? 'published' : 'draft';
      if (updates.permissions) updateData.visibility_rules = JSON.parse(JSON.stringify(updates.permissions));

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
