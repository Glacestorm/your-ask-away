/**
 * useAcademiaCertificatesAI - Hook para certificados con IA
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CertificateData {
  id: string;
  certificateCode: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: string;
  verificationUrl: string;
  pdfUrl?: string;
  skills: string[];
  grade?: string;
  hoursCompleted: number;
  achievements?: string[];
}

export interface CertificateVerification {
  valid: boolean;
  certificate?: CertificateData;
  message: string;
  verifiedAt: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: string;
}

export function useAcademiaCertificatesAI() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // === FETCH USER CERTIFICATES ===
  const fetchCertificates = useCallback(async () => {
    if (!user?.id) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-certificates',
        {
          body: {
            action: 'get_certificates',
            context: { userId: user.id }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setCertificates(data.data?.certificates || []);
        return data.data;
      }

      throw new Error(data?.error || 'Error fetching certificates');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAcademiaCertificatesAI] fetchCertificates error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // === GENERATE CERTIFICATE ===
  const generateCertificate = useCallback(async (params: {
    courseId: string;
    enrollmentId: string;
    templateId?: string;
  }) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-certificates',
        {
          body: {
            action: 'generate_certificate',
            params: {
              ...params,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('¡Certificado generado exitosamente!');
        await fetchCertificates();
        return data.data;
      }

      throw new Error(data?.error || 'Error generating certificate');
    } catch (err) {
      console.error('[useAcademiaCertificatesAI] generateCertificate error:', err);
      toast.error('Error al generar certificado');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchCertificates]);

  // === VERIFY CERTIFICATE ===
  const verifyCertificate = useCallback(async (code: string): Promise<CertificateVerification | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-certificates',
        {
          body: {
            action: 'verify_certificate',
            params: { code }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data as CertificateVerification;
      }

      return {
        valid: false,
        message: data?.error || 'Certificado no encontrado',
        verifiedAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('[useAcademiaCertificatesAI] verifyCertificate error:', err);
      return {
        valid: false,
        message: 'Error al verificar certificado',
        verifiedAt: new Date().toISOString()
      };
    }
  }, []);

  // === GENERATE SKILL BADGE ===
  const generateSkillBadge = useCallback(async (params: {
    skill: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    courseId?: string;
  }) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-certificates',
        {
          body: {
            action: 'generate_badge',
            params: {
              ...params,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('¡Insignia de habilidad generada!');
        return data.data;
      }

      return null;
    } catch (err) {
      console.error('[useAcademiaCertificatesAI] generateSkillBadge error:', err);
      toast.error('Error al generar insignia');
      return null;
    }
  }, [user?.id]);

  // === GET CERTIFICATE TEMPLATES ===
  const getTemplates = useCallback(async (): Promise<CertificateTemplate[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-certificates',
        {
          body: {
            action: 'get_templates'
          }
        }
      );

      if (fnError) throw fnError;

      return data?.data?.templates || [];
    } catch (err) {
      console.error('[useAcademiaCertificatesAI] getTemplates error:', err);
      return [];
    }
  }, []);

  // === SHARE CERTIFICATE ===
  const shareCertificate = useCallback(async (certificateId: string, platform: 'linkedin' | 'twitter' | 'email') => {
    const cert = certificates.find(c => c.id === certificateId);
    if (!cert) {
      toast.error('Certificado no encontrado');
      return null;
    }

    const shareUrl = cert.verificationUrl;
    const shareText = `¡He completado el curso "${cert.courseName}" y obtenido mi certificado! Verifica mi logro:`;

    switch (platform) {
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=Mi Certificado: ${cert.courseName}&body=${shareText} ${shareUrl}`;
        break;
    }

    toast.success('Enlace de compartir generado');
    return shareUrl;
  }, [certificates]);

  // === DOWNLOAD PDF ===
  const downloadPdf = useCallback(async (certificateId: string) => {
    const cert = certificates.find(c => c.id === certificateId);
    if (!cert?.pdfUrl) {
      toast.error('PDF no disponible');
      return;
    }

    window.open(cert.pdfUrl, '_blank');
  }, [certificates]);

  return {
    isLoading,
    certificates,
    error,
    fetchCertificates,
    generateCertificate,
    verifyCertificate,
    generateSkillBadge,
    getTemplates,
    shareCertificate,
    downloadPdf,
  };
}

export default useAcademiaCertificatesAI;
