/**
 * useTrainingCertificates - Hook para gestionar certificados de cursos
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Certificate {
  id: string;
  enrollment_id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  certificate_url: string | null;
  verification_code: string;
  issued_at: string;
  expires_at: string | null;
  score: number | null;
  grade: string | null;
  skills_acquired: string[];
  metadata: Record<string, unknown>;
  is_valid: boolean;
}

export interface CertificateData {
  studentName: string;
  courseName: string;
  courseDescription?: string;
  completionDate: string;
  certificateNumber: string;
  verificationCode: string;
  score?: number;
  grade?: string;
  skills?: string[];
  instructorName?: string;
  organizationName?: string;
  organizationLogo?: string;
}

// Generate unique certificate number
const generateCertificateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}${month}-${random}`;
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export function useTrainingCertificates() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch user certificates
  const fetchMyCertificates = useCallback(async () => {
    if (!user?.id) return [];

    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('training_certificates')
        .select(`
          *,
          training_courses:course_id (
            title,
            description,
            thumbnail_url
          )
        `)
        .eq('user_id', user.id)
        .eq('is_valid', true)
        .order('issued_at', { ascending: false });

      if (fetchError) throw fetchError;

      const certs = (data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        enrollment_id: c.enrollment_id as string,
        user_id: c.user_id as string,
        course_id: c.course_id as string,
        certificate_number: c.certificate_number as string,
        certificate_url: c.certificate_url as string | null,
        verification_code: c.verification_code as string,
        issued_at: c.issued_at as string,
        expires_at: c.expires_at as string | null,
        score: c.score as number | null,
        grade: c.grade as string | null,
        skills_acquired: (c.skills_acquired as string[]) || [],
        metadata: (c.metadata as Record<string, unknown>) || {},
        is_valid: c.is_valid as boolean,
        course: c.training_courses,
      }));

      setMyCertificates(certs);
      return certs;
    } catch (err) {
      console.error('[useTrainingCertificates] fetchMyCertificates error:', err);
      setError('Error loading certificates');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Issue certificate
  const issueCertificate = useCallback(async (
    enrollmentId: string,
    courseId: string,
    score?: number,
    skills?: string[]
  ) => {
    if (!user?.id) return null;

    try {
      setLoading(true);

      // Check if certificate already exists
      const { data: existing } = await supabase
        .from('training_certificates')
        .select('id')
        .eq('enrollment_id', enrollmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.info('Ya tienes un certificado para este curso');
        return existing;
      }

      const certificateNumber = generateCertificateNumber();
      const verificationCode = generateVerificationCode();
      
      // Calculate grade based on score
      let grade = 'Aprobado';
      if (score) {
        if (score >= 95) grade = 'Sobresaliente';
        else if (score >= 85) grade = 'Notable';
        else if (score >= 75) grade = 'Bien';
        else if (score >= 70) grade = 'Aprobado';
      }

      const { data: newCert, error: insertError } = await supabase
        .from('training_certificates')
        .insert({
          enrollment_id: enrollmentId,
          user_id: user.id,
          course_id: courseId,
          certificate_number: certificateNumber,
          verification_code: verificationCode,
          score: score || null,
          grade,
          skills_acquired: skills || [],
          is_valid: true,
          metadata: {
            issued_by: 'system',
            platform_version: '1.0',
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('🎓 ¡Certificado emitido!', {
        description: `Número: ${certificateNumber}`,
      });

      // Update leaderboard counter
      await supabase.rpc('update_leaderboard_counters', {
        p_user_id: user.id,
        p_counter: 'certificates_earned',
        p_increment: 1,
      });

      await fetchMyCertificates();
      return newCert;
    } catch (err) {
      console.error('[useTrainingCertificates] issueCertificate error:', err);
      toast.error('Error al emitir certificado');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchMyCertificates]);

  // Verify certificate by code
  const verifyCertificate = useCallback(async (verificationCode: string) => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('training_certificates')
        .select(`
          *,
          training_courses:course_id (
            title,
            description
          ),
          profiles:user_id (
            full_name
          )
        `)
        .eq('verification_code', verificationCode.toUpperCase())
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        return { valid: false, message: 'Certificado no encontrado' };
      }

      if (!data.is_valid) {
        return { valid: false, message: 'Certificado revocado', certificate: data };
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, message: 'Certificado expirado', certificate: data };
      }

      return { valid: true, message: 'Certificado válido', certificate: data };
    } catch (err) {
      console.error('[useTrainingCertificates] verifyCertificate error:', err);
      return { valid: false, message: 'Error al verificar' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate LinkedIn share URL
  const generateLinkedInShareUrl = useCallback((certificate: Certificate, courseName: string, organizationName = 'Academia') => {
    const issueDate = new Date(certificate.issued_at);
    const issueYear = issueDate.getFullYear();
    const issueMonth = issueDate.getMonth() + 1;

    // LinkedIn Add to Profile URL
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: courseName,
      organizationName,
      issueYear: String(issueYear),
      issueMonth: String(issueMonth),
      certUrl: `${window.location.origin}/verify-certificate?code=${certificate.verification_code}`,
      certId: certificate.certificate_number,
    });

    return `https://www.linkedin.com/profile/add?${params.toString()}`;
  }, []);

  // Generate verification QR URL
  const generateVerificationUrl = useCallback((verificationCode: string) => {
    return `${window.location.origin}/verify-certificate?code=${verificationCode}`;
  }, []);

  return {
    // State
    loading,
    error,
    myCertificates,
    // Actions
    fetchMyCertificates,
    issueCertificate,
    verifyCertificate,
    // Helpers
    generateLinkedInShareUrl,
    generateVerificationUrl,
    generateCertificateNumber,
    generateVerificationCode,
  };
}

export default useTrainingCertificates;
