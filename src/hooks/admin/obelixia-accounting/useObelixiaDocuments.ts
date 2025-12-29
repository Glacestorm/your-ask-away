/**
 * useObelixiaDocuments Hook
 * Phase 11C: AI Document Management - Digital Archive, Advanced OCR, Semantic Search
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Document {
  id: string;
  name: string;
  type: 'invoice' | 'receipt' | 'contract' | 'report' | 'statement' | 'other';
  category: string;
  status: 'pending' | 'processed' | 'verified' | 'archived';
  uploadedAt: string;
  processedAt?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  extractedData?: Record<string, unknown>;
  tags?: string[];
  versions?: DocumentVersion[];
  aiAnalysis?: {
    confidence: number;
    entities: string[];
    summary: string;
    suggestedCategory?: string;
  };
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  changes: string;
  fileUrl: string;
}

export interface SearchResult {
  documentId: string;
  documentName: string;
  relevanceScore: number;
  matchedText: string;
  highlights: string[];
}

export interface DocumentContext {
  companyId: string;
  fiscalYear?: number;
}

// === HOOK ===
export function useObelixiaDocuments() {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH DOCUMENTS ===
  const fetchDocuments = useCallback(async (context?: DocumentContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-documents',
        {
          body: {
            action: 'get_documents',
            context
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success && fnData?.data) {
        setDocuments(fnData.data.documents || []);
        setLastRefresh(new Date());
        return fnData.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useObelixiaDocuments] fetchDocuments error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SEMANTIC SEARCH ===
  const semanticSearch = useCallback(async (query: string, filters?: Record<string, unknown>) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-documents',
        {
          body: {
            action: 'semantic_search',
            query,
            filters
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        setSearchResults(fnData.data?.results || []);
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaDocuments] semanticSearch error:', err);
      toast.error('Error en búsqueda');
      return null;
    }
  }, []);

  // === PROCESS DOCUMENT WITH OCR ===
  const processDocument = useCallback(async (documentId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-documents',
        {
          body: {
            action: 'process_ocr',
            documentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Documento procesado con OCR');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaDocuments] processDocument error:', err);
      toast.error('Error al procesar documento');
      return null;
    }
  }, []);

  // === ANALYZE DOCUMENT WITH AI ===
  const analyzeDocument = useCallback(async (documentId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-documents',
        {
          body: {
            action: 'ai_analyze',
            documentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Análisis IA completado');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaDocuments] analyzeDocument error:', err);
      toast.error('Error al analizar');
      return null;
    }
  }, []);

  // === CREATE VERSION ===
  const createVersion = useCallback(async (
    documentId: string,
    changes: string,
    newFileUrl?: string
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-documents',
        {
          body: {
            action: 'create_version',
            documentId,
            changes,
            newFileUrl
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Versión creada');
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaDocuments] createVersion error:', err);
      toast.error('Error al crear versión');
      return null;
    }
  }, []);

  // === ARCHIVE DOCUMENT ===
  const archiveDocument = useCallback(async (documentId: string) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        'obelixia-documents',
        {
          body: {
            action: 'archive',
            documentId
          }
        }
      );

      if (fnError) throw fnError;

      if (fnData?.success) {
        toast.success('Documento archivado');
        setDocuments(prev => prev.map(d => 
          d.id === documentId ? { ...d, status: 'archived' as const } : d
        ));
        return fnData.data;
      }

      return null;
    } catch (err) {
      console.error('[useObelixiaDocuments] archiveDocument error:', err);
      toast.error('Error al archivar');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: DocumentContext, intervalMs = 60000) => {
    stopAutoRefresh();
    fetchDocuments(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchDocuments(context);
    }, intervalMs);
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
    searchResults,
    error,
    lastRefresh,
    fetchDocuments,
    semanticSearch,
    processDocument,
    analyzeDocument,
    createVersion,
    archiveDocument,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useObelixiaDocuments;
