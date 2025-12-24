/**
 * useLowCodePages - KB 2.0 Migration
 * Low-code page management with state machine
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LowCodePage, PageComponent } from '@/components/lowcode/types';
import { toast } from 'sonner';
import { KBStatus, KBError, parseError, collectTelemetry } from '@/hooks/core';

export function useLowCodePages(moduleId?: string) {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const pagesQuery = useQuery({
    queryKey: ['lowcode-pages', moduleId],
    queryFn: async () => {
      const startTime = Date.now();
      setStatus('loading');
      
      let query = supabase
        .from('lowcode_page_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        setStatus('error');
        throw fetchError;
      }
      
      setStatus('success');
      setLastRefresh(new Date());
      collectTelemetry('useLowCodePages', 'fetchPages', 'success', Date.now() - startTime);
      
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
      const startTime = Date.now();
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error: insertError } = await supabase
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
      
      if (insertError) throw insertError;
      collectTelemetry('useLowCodePages', 'createPage', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-pages'] });
      toast.success('Página creada correctamente');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al crear página: ' + err.message);
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LowCodePage> & { id: string }) => {
      const startTime = Date.now();
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

      const { data, error: updateError } = await supabase
        .from('lowcode_page_definitions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      collectTelemetry('useLowCodePages', 'updatePage', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-pages'] });
      toast.success('Página actualizada');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al actualizar página: ' + err.message);
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const startTime = Date.now();
      const { error: deleteError } = await supabase
        .from('lowcode_page_definitions')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      collectTelemetry('useLowCodePages', 'deletePage', 'success', Date.now() - startTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-pages'] });
      toast.success('Página eliminada');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error('Error al eliminar página: ' + err.message);
    },
  });

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isLoading = pagesQuery.isLoading;
  const isSuccess = status === 'success';
  const isError = status === 'error' || !!pagesQuery.error;

  return {
    pages: pagesQuery.data || [],
    isLoading,
    error: error || (pagesQuery.error ? parseError(pagesQuery.error) : null),
    createPage,
    updatePage,
    deletePage,
    // === KB 2.0 ===
    status,
    isIdle,
    isSuccess,
    isError,
    lastRefresh,
    clearError,
  };
}
