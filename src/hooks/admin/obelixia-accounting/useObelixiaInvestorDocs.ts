/**
 * useObelixiaInvestorDocs Hook
 * Fase 15 Extended: Strategic Financial Agent - Investor Documents Suite
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type InvestorDocument = Database['public']['Tables']['obelixia_investor_documents']['Row'];

export type { InvestorDocument };

export interface InvestorDocContext {
  documentType: 'pitch_deck' | 'executive_summary' | 'one_pager' | 'investor_memo' | 'teaser' | 'data_room';
  title: string;
  companyInfo: Record<string, unknown>;
  fundingRound?: string;
  fundingAmount?: number;
  investorType?: string[];
  designTemplate?: string;
}

export function useObelixiaInvestorDocs() {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<InvestorDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<InvestorDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch all investor documents
  const fetchDocuments = useCallback(async (type?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('obelixia_investor_documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (type) {
        query = query.eq('document_type', type);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDocuments(data || []);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching documents';
      setError(message);
      console.error('[useObelixiaInvestorDocs] fetchDocuments error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate new investor document using AI
  const generateDocument = useCallback(async (context: InvestorDocContext) => {
    setIsLoading(true);
    setGenerationProgress(10);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-investor-docs',
        {
          body: {
            action: 'generate_document',
            context
          }
        }
      );

      setGenerationProgress(90);

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Documento para inversores generado');
        setGenerationProgress(100);
        await fetchDocuments();
        return data.data;
      }

      throw new Error(data?.error || 'Error generando documento');
    } catch (err) {
      console.error('[useObelixiaInvestorDocs] generateDocument error:', err);
      toast.error('Error al generar documento');
      return null;
    } finally {
      setIsLoading(false);
      setGenerationProgress(0);
    }
  }, [fetchDocuments]);

  // Generate specific slide/section
  const generateSection = useCallback(async (
    documentId: string,
    section: string,
    context: Record<string, unknown>
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-investor-docs',
        {
          body: {
            action: 'generate_section',
            documentId,
            section,
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Sección "${section}" generada`);
        await fetchDocuments();
        return data.data;
      }

      throw new Error(data?.error || 'Error generando sección');
    } catch (err) {
      console.error('[useObelixiaInvestorDocs] generateSection error:', err);
      toast.error('Error al generar sección');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchDocuments]);

  // Optimize document for specific investor type
  const optimizeForInvestor = useCallback(async (
    documentId: string,
    investorType: 'vc' | 'angel' | 'pe' | 'corporate' | 'family_office'
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-investor-docs',
        {
          body: {
            action: 'optimize_for_investor',
            documentId,
            investorType
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(`Documento optimizado para ${investorType.toUpperCase()}`);
        await fetchDocuments();
        return data.data;
      }

      throw new Error(data?.error || 'Error optimizando documento');
    } catch (err) {
      console.error('[useObelixiaInvestorDocs] optimizeForInvestor error:', err);
      toast.error('Error al optimizar documento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchDocuments]);

  // Generate pitch script
  const generatePitchScript = useCallback(async (
    documentId: string,
    duration: number // in minutes
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-investor-docs',
        {
          body: {
            action: 'generate_pitch_script',
            documentId,
            duration
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Guión de pitch generado');
        return data.data;
      }

      throw new Error(data?.error || 'Error generando guión');
    } catch (err) {
      console.error('[useObelixiaInvestorDocs] generatePitchScript error:', err);
      toast.error('Error al generar guión');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update document
  const updateDocument = useCallback(async (
    documentId: string,
    updates: Database['public']['Tables']['obelixia_investor_documents']['Update']
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('obelixia_investor_documents')
        .update(updates)
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast.success('Documento actualizado');
      await fetchDocuments();
      return true;
    } catch (err) {
      console.error('[useObelixiaInvestorDocs] updateDocument error:', err);
      toast.error('Error al actualizar documento');
      return false;
    }
  }, [fetchDocuments]);

  // Export document
  const exportDocument = useCallback(async (
    documentId: string, 
    format: 'pdf' | 'pptx' | 'html'
  ) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-investor-docs',
        {
          body: {
            action: 'export_document',
            documentId,
            format
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Documento exportado');
        return data.data;
      }

      throw new Error(data?.error || 'Error exportando');
    } catch (err) {
      console.error('[useObelixiaInvestorDocs] exportDocument error:', err);
      toast.error('Error al exportar documento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get AI review and suggestions
  const getAIReview = useCallback(async (documentId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'obelixia-investor-docs',
        {
          body: {
            action: 'ai_review',
            documentId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        return data.data;
      }

      throw new Error(data?.error || 'Error obteniendo revisión');
    } catch (err) {
      console.error('[useObelixiaInvestorDocs] getAIReview error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh
  const startAutoRefresh = useCallback((intervalMs = 300000) => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
    }
    fetchDocuments();
    autoRefreshInterval.current = setInterval(fetchDocuments, intervalMs);
  }, [fetchDocuments]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    documents,
    currentDocument,
    error,
    generationProgress,
    setCurrentDocument,
    fetchDocuments,
    generateDocument,
    generateSection,
    optimizeForInvestor,
    generatePitchScript,
    updateDocument,
    exportDocument,
    getAIReview,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaInvestorDocs;
