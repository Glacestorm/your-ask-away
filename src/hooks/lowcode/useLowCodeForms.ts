/**
 * useLowCodeForms - KB 2.0 Migration
 * Low-code form management with state machine
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormDefinition, FormSubmission, FormField } from '@/components/lowcode/types';
import { toast } from 'sonner';
import { KBStatus, KBError, parseError, collectTelemetry } from '@/hooks/core';

export function useLowCodeForms() {
  const queryClient = useQueryClient();
  
  // === KB 2.0 STATE ===
  const [status, setStatus] = useState<KBStatus>('idle');
  const [error, setError] = useState<KBError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') setStatus('idle');
  }, [status]);

  const { data: forms = [], isLoading, error: queryError } = useQuery({
    queryKey: ['lowcode-forms'],
    queryFn: async () => {
      const startTime = Date.now();
      setStatus('loading');
      
      const { data, error: fetchError } = await supabase
        .from('lowcode_form_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        setStatus('error');
        throw fetchError;
      }
      
      setStatus('success');
      setLastRefresh(new Date());
      collectTelemetry('useLowCodeForms', 'fetchForms', 'success', Date.now() - startTime);
      
      return data.map(form => ({
        ...form,
        fields: (form.fields as unknown as FormField[]) || [],
        validations: (form.validations as Record<string, unknown>) || {},
        permissions: (form.permissions as Record<string, unknown>) || {},
        settings: (form.settings as Record<string, unknown>) || {},
      })) as FormDefinition[];
    },
  });

  const createForm = useMutation({
    mutationFn: async (form: Partial<FormDefinition>) => {
      const startTime = Date.now();
      const { data: user } = await supabase.auth.getUser();
      const { data, error: insertError } = await supabase
        .from('lowcode_form_definitions')
        .insert({
          form_key: form.form_key || `form_${Date.now()}`,
          form_name: form.form_name || 'Nuevo Formulario',
          description: form.description,
          module_id: form.module_id,
          fields: JSON.parse(JSON.stringify(form.fields || [])),
          validations: form.validations || {},
          permissions: form.permissions || {},
          settings: form.settings || {},
          status: 'draft',
          version: 1,
          created_by: user?.user?.id,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      collectTelemetry('useLowCodeForms', 'createForm', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario creado correctamente');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error al crear formulario: ${err.message}`);
    },
  });

  const updateForm = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormDefinition> & { id: string }) => {
      const startTime = Date.now();
      const { data, error: updateError } = await supabase
        .from('lowcode_form_definitions')
        .update({
          form_name: updates.form_name,
          description: updates.description,
          fields: updates.fields ? JSON.parse(JSON.stringify(updates.fields)) : undefined,
          validations: updates.validations,
          permissions: updates.permissions,
          settings: updates.settings,
          status: updates.status,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      collectTelemetry('useLowCodeForms', 'updateForm', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario actualizado');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error al actualizar: ${err.message}`);
    },
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const startTime = Date.now();
      const { error: deleteError } = await supabase
        .from('lowcode_form_definitions')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      collectTelemetry('useLowCodeForms', 'deleteForm', 'success', Date.now() - startTime);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario eliminado');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error al eliminar: ${err.message}`);
    },
  });

  const publishForm = useMutation({
    mutationFn: async (id: string) => {
      const startTime = Date.now();
      const { data, error: publishError } = await supabase
        .from('lowcode_form_definitions')
        .update({ status: 'published' })
        .eq('id', id)
        .select()
        .single();
      
      if (publishError) throw publishError;
      collectTelemetry('useLowCodeForms', 'publishForm', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario publicado');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error al publicar: ${err.message}`);
    },
  });

  // === KB 2.0 COMPUTED ===
  const isIdle = status === 'idle';
  const isSuccess = status === 'success';
  const isError = status === 'error' || !!queryError;

  return {
    forms,
    isLoading,
    error: error || (queryError ? parseError(queryError) : null),
    createForm,
    updateForm,
    deleteForm,
    publishForm,
    // === KB 2.0 ===
    status,
    isIdle,
    isSuccess,
    isError,
    lastRefresh,
    clearError,
  };
}

export function useLowCodeForm(formId: string | undefined) {
  const [error, setError] = useState<KBError | null>(null);

  const { data: form, isLoading, error: queryError } = useQuery({
    queryKey: ['lowcode-form', formId],
    queryFn: async () => {
      if (!formId) return null;
      const startTime = Date.now();
      const { data, error: fetchError } = await supabase
        .from('lowcode_form_definitions')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (fetchError) throw fetchError;
      collectTelemetry('useLowCodeForm', 'fetchForm', 'success', Date.now() - startTime);
      return {
        ...data,
        fields: (data.fields as unknown as FormField[]) || [],
        validations: (data.validations as Record<string, unknown>) || {},
        permissions: (data.permissions as Record<string, unknown>) || {},
        settings: (data.settings as Record<string, unknown>) || {},
      } as FormDefinition;
    },
    enabled: !!formId,
  });

  return { 
    form, 
    isLoading, 
    error: error || (queryError ? parseError(queryError) : null),
  };
}

export function useFormSubmissions(formId: string | undefined) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<KBError | null>(null);

  const { data: submissions = [], isLoading, error: queryError } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: async () => {
      if (!formId) return [];
      const startTime = Date.now();
      const { data, error: fetchError } = await supabase
        .from('lowcode_form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      collectTelemetry('useFormSubmissions', 'fetchSubmissions', 'success', Date.now() - startTime);
      return data as FormSubmission[];
    },
    enabled: !!formId,
  });

  const submitForm = useMutation({
    mutationFn: async ({ formId, data }: { formId: string; data: Record<string, unknown> }) => {
      const startTime = Date.now();
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error: submitError } = await supabase
        .from('lowcode_form_submissions')
        .insert([{
          form_id: formId,
          submitted_by: user?.user?.id,
          data: data as never,
          status: 'pending',
        }])
        .select()
        .single();
      
      if (submitError) throw submitError;
      collectTelemetry('useFormSubmissions', 'submitForm', 'success', Date.now() - startTime);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      toast.success('Formulario enviado correctamente');
    },
    onError: (err: Error) => {
      const kbError = parseError(err);
      setError(kbError);
      toast.error(`Error al enviar: ${err.message}`);
    },
  });

  const updateSubmissionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FormSubmission['status'] }) => {
      const startTime = Date.now();
      const { data, error: updateError } = await supabase
        .from('lowcode_form_submissions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      collectTelemetry('useFormSubmissions', 'updateStatus', 'success', Date.now() - startTime);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      toast.success('Estado actualizado');
    },
  });

  return {
    submissions,
    isLoading,
    error: error || (queryError ? parseError(queryError) : null),
    submitForm,
    updateSubmissionStatus,
  };
}
