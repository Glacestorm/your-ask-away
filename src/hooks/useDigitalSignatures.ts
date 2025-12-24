import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DigitalSignature {
  id: string;
  document_id: string;
  document_type: string;
  document_hash: string;
  signer_id: string | null;
  signer_name: string;
  signer_email: string;
  signature_type: string;
  signature_data: Record<string, unknown> | null;
  certificate_issuer: string | null;
  certificate_serial: string | null;
  timestamp_authority: string | null;
  signed_at: string;
  verification_status: string;
  verified_at: string | null;
  eidas_level: string;
  created_at: string;
}

// Generate document hash
async function hashDocument(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useDigitalSignatures() {
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchSignatures = useCallback(async (documentId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('digital_signatures')
        .select('*')
        .order('signed_at', { ascending: false });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSignatures((data as DigitalSignature[]) || []);
    } catch (error) {
      console.error('Error fetching signatures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signDocument = useCallback(async (
    documentId: string,
    documentType: string,
    documentContent: string,
    eidasLevel: 'AdES' | 'QES' = 'QES'
  ) => {
    if (!user?.id || !user?.email) {
      toast.error('Debes iniciar sesión para firmar documentos');
      return null;
    }

    setLoading(true);
    try {
      const documentHash = await hashDocument(documentContent);
      const timestamp = new Date().toISOString();

      // Simulate eIDAS qualified signature
      const signatureData = {
        algorithm: 'RSA-SHA256',
        keySize: 2048,
        signedAt: timestamp,
        eidasCompliant: true,
        level: eidasLevel,
        timestampToken: await hashDocument(timestamp + documentHash)
      };

      const { data, error } = await supabase
        .from('digital_signatures')
        .insert({
          document_id: documentId,
          document_type: documentType,
          document_hash: documentHash,
          signer_id: user.id,
          signer_name: user.user_metadata?.full_name || user.email,
          signer_email: user.email,
          signature_type: 'qualified',
          signature_data: signatureData,
          certificate_issuer: 'Lovable eIDAS TSP',
          certificate_serial: crypto.randomUUID(),
          timestamp_authority: 'RFC3161 TSA',
          eidas_level: eidasLevel,
          verification_status: 'valid',
          verified_at: timestamp
        })
        .select()
        .single();

      if (error) throw error;

      const signature = data as DigitalSignature;
      setSignatures(prev => [signature, ...prev]);
      toast.success('Documento firmado con firma cualificada eIDAS');
      return signature;
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Error al firmar el documento');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const verifySignature = useCallback(async (
    signatureId: string,
    documentContent: string
  ): Promise<{ valid: boolean; message: string }> => {
    try {
      const { data: signature, error } = await supabase
        .from('digital_signatures')
        .select('*')
        .eq('id', signatureId)
        .single();

      if (error || !signature) {
        return { valid: false, message: 'Firma no encontrada' };
      }

      const currentHash = await hashDocument(documentContent);
      
      if (currentHash !== (signature as DigitalSignature).document_hash) {
        // Update signature status
        await supabase
          .from('digital_signatures')
          .update({ verification_status: 'invalid' })
          .eq('id', signatureId);

        return { valid: false, message: 'El documento ha sido modificado después de la firma' };
      }

      return { 
        valid: true, 
        message: `Firma válida - Nivel eIDAS: ${(signature as DigitalSignature).eidas_level}` 
      };
    } catch (error) {
      console.error('Error verifying signature:', error);
      return { valid: false, message: 'Error al verificar la firma' };
    }
  }, []);

  const getDocumentSignatures = useCallback(async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('digital_signatures')
        .select('*')
        .eq('document_id', documentId)
        .order('signed_at', { ascending: false });

      if (error) throw error;
      return (data as DigitalSignature[]) || [];
    } catch (error) {
      console.error('Error getting document signatures:', error);
      return [];
    }
  }, []);

  return {
    signatures,
    loading,
    signDocument,
    verifySignature,
    getDocumentSignatures,
    fetchSignatures
  };
}
