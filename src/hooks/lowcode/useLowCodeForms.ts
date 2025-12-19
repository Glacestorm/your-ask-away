import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormDefinition, FormSubmission, FormField } from '@/components/lowcode/types';
import { toast } from 'sonner';

export function useLowCodeForms() {
  const queryClient = useQueryClient();

  const { data: forms = [], isLoading, error } = useQuery({
    queryKey: ['lowcode-forms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lowcode_form_definitions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(form => ({
        ...form,
        fields: (form.fields as unknown as FormField[]) || [],
        validations: (form.validations as Record<string, any>) || {},
        permissions: (form.permissions as Record<string, any>) || {},
        settings: (form.settings as Record<string, any>) || {},
      })) as FormDefinition[];
    },
  });

  const createForm = useMutation({
    mutationFn: async (form: Partial<FormDefinition>) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
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
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear formulario: ${error.message}`);
    },
  });

  const updateForm = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormDefinition> & { id: string }) => {
      const { data, error } = await supabase
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
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const deleteForm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lowcode_form_definitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  const publishForm = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('lowcode_form_definitions')
        .update({ status: 'published' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowcode-forms'] });
      toast.success('Formulario publicado');
    },
    onError: (error: Error) => {
      toast.error(`Error al publicar: ${error.message}`);
    },
  });

  return {
    forms,
    isLoading,
    error,
    createForm,
    updateForm,
    deleteForm,
    publishForm,
  };
}

export function useLowCodeForm(formId: string | undefined) {
  const { data: form, isLoading, error } = useQuery({
    queryKey: ['lowcode-form', formId],
    queryFn: async () => {
      if (!formId) return null;
      const { data, error } = await supabase
        .from('lowcode_form_definitions')
        .select('*')
        .eq('id', formId)
        .single();
      
      if (error) throw error;
      return {
        ...data,
        fields: (data.fields as unknown as FormField[]) || [],
        validations: (data.validations as Record<string, any>) || {},
        permissions: (data.permissions as Record<string, any>) || {},
        settings: (data.settings as Record<string, any>) || {},
      } as FormDefinition;
    },
    enabled: !!formId,
  });

  return { form, isLoading, error };
}

export function useFormSubmissions(formId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['form-submissions', formId],
    queryFn: async () => {
      if (!formId) return [];
      const { data, error } = await supabase
        .from('lowcode_form_submissions')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FormSubmission[];
    },
    enabled: !!formId,
  });

  const submitForm = useMutation({
    mutationFn: async ({ formId, data }: { formId: string; data: Record<string, any> }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from('lowcode_form_submissions')
        .insert({
          form_id: formId,
          submitted_by: user?.user?.id,
          data,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
      toast.success('Formulario enviado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar: ${error.message}`);
    },
  });

  const updateSubmissionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FormSubmission['status'] }) => {
      const { data, error } = await supabase
        .from('lowcode_form_submissions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
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
    error,
    submitForm,
    updateSubmissionStatus,
  };
}
