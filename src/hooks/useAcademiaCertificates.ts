/**
 * useAcademiaCertificates - Hook para gestión de certificados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string | null;
  certificate_code: string;
  issued_at: string | null;
  pdf_url: string | null;
  verification_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

export function useAcademiaCertificates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // === USER CERTIFICATES ===
  const certificatesQuery = useQuery({
    queryKey: ['academia-certificates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('academia_certificates')
        .select(`
          *,
          course:academia_courses(id, title, slug, thumbnail_url, instructor_name)
        `)
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // === VERIFY CERTIFICATE ===
  const verifyCertificate = async (code: string) => {
    const { data, error } = await supabase
      .from('academia_certificates')
      .select(`
        *,
        course:academia_courses(id, title, slug)
      `)
      .eq('certificate_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { valid: false, message: 'Certificado no encontrado' };
      }
      throw error;
    }

    return {
      valid: true,
      certificate: data,
      message: 'Certificado válido',
    };
  };

  // === ISSUE CERTIFICATE ===
  const issueCertificateMutation = useMutation({
    mutationFn: async ({
      courseId,
      enrollmentId,
    }: {
      courseId: string;
      enrollmentId: string;
    }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      // Generate unique certificate code
      const code = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data, error } = await supabase
        .from('academia_certificates')
        .insert({
          user_id: user.id,
          course_id: courseId,
          enrollment_id: enrollmentId,
          certificate_code: code,
          issued_at: new Date().toISOString(),
          verification_url: `${window.location.origin}/academia/verificar/${code}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Update enrollment to mark certificate as issued
      await supabase
        .from('academia_enrollments')
        .update({
          certificate_issued: true,
          certificate_code: code,
        })
        .eq('id', enrollmentId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['academia-enrollments'] });
      toast.success('¡Certificado generado exitosamente!');
    },
    onError: (error) => {
      console.error('Issue certificate error:', error);
      toast.error('Error al generar certificado');
    },
  });

  return {
    certificates: certificatesQuery.data || [],
    loading: certificatesQuery.isLoading,
    verifyCertificate,
    issueCertificate: issueCertificateMutation.mutate,
    issuing: issueCertificateMutation.isPending,
    refetch: certificatesQuery.refetch,
  };
}

export default useAcademiaCertificates;
